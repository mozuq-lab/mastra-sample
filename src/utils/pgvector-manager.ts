#!/usr/bin/env tsx

import "dotenv/config";

/**
 * PostgreSQL pgvectorベクターストア管理スクリプト
 *
 * 使用方法:
 * - npm run pgvector:update - src/data/以下の全ファイルからベクターストアを更新
 * - npm run pgvector:stats - ベクターストアの統計情報を表示
 * - npm run pgvector:rebuild - ベクターストアを完全に再構築
 */

import fs from "node:fs/promises";
import path from "node:path";
import { resolveFromProjectRoot } from "./path-utils.js";
import { getPostgresVector } from "../mastra/config/vectors.js";
import { getEmbeddingModel } from "../mastra/config/models.js";

const INDEX_NAME = "knowledge_base";

// 中央設定のPostgreSQL pgvector設定を使用
const vectorStore = getPostgresVector();

// 環境変数からエンベディングモデルを取得
const embeddingModel = getEmbeddingModel();

/**
 * テキストをエンベディングに変換
 */
async function generateEmbeddings(texts: string[]) {
  const embeddings = [];

  console.log(`🔄 Generating embeddings for ${texts.length} chunks...`);

  for (let i = 0; i < texts.length; i++) {
    const text = texts[i];
    try {
      const result = await embeddingModel.doEmbed({
        values: [text],
      });
      embeddings.push(result.embeddings[0]);

      if ((i + 1) % 10 === 0) {
        console.log(
          `  - Progress: ${i + 1}/${texts.length} embeddings generated`
        );
      }
    } catch (error) {
      console.error(`Error generating embedding for chunk ${i}:`, error);
      throw error;
    }
  }

  return embeddings;
}

/**
 * テキストをチャンクに分割
 */
function splitTextIntoChunks(
  text: string,
  chunkSize = 200,
  overlap = 50
): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.slice(start, end);
    chunks.push(chunk.trim());

    if (end >= text.length) break;
    start = end - overlap;
  }

  return chunks;
}

/**
 * インデックスの存在確認
 */
async function checkIfIndexExists(): Promise<boolean> {
  try {
    await vectorStore.query({
      indexName: INDEX_NAME,
      queryVector: new Array(1536).fill(0),
      topK: 1,
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * データディレクトリを見つける
 */
async function findDataDirectory(): Promise<string> {
  const possiblePaths = [
    await resolveFromProjectRoot("src/data").catch(() => null),
    path.resolve("src/data"),
    path.resolve("../../src/data"),
    "src/data",
  ].filter(Boolean) as string[];

  for (const tryPath of possiblePaths) {
    try {
      await fs.access(tryPath);
      const stats = await fs.stat(tryPath);
      if (stats.isDirectory()) {
        return tryPath;
      }
    } catch {
      // continue
    }
  }

  throw new Error("Could not find src/data directory in any expected location");
}

/**
 * データディレクトリからテキストファイルを読み込む
 */
async function loadAllDataFiles(): Promise<
  Array<{ content: string; filename: string; path: string }>
> {
  const dataDir = await findDataDirectory();
  console.log(`📁 Scanning data directory: ${dataDir}`);

  const files = await fs.readdir(dataDir);
  const textFiles = files.filter(
    (file) =>
      file.endsWith(".txt") ||
      file.endsWith(".md") ||
      file.endsWith(".json") ||
      file.endsWith(".csv")
  );

  if (textFiles.length === 0) {
    throw new Error(`No text files found in ${dataDir}`);
  }

  console.log(`📄 Found ${textFiles.length} files: ${textFiles.join(", ")}`);

  const fileData = [];
  for (const filename of textFiles) {
    const filePath = path.join(dataDir, filename);
    try {
      const content = await fs.readFile(filePath, "utf-8");
      fileData.push({ content, filename, path: filePath });
      console.log(`  ✅ Loaded: ${filename} (${content.length} characters)`);
    } catch (error) {
      console.warn(`  ⚠️  Failed to load ${filename}:`, error);
    }
  }

  return fileData;
}

/**
 * ベクターストアを更新
 */
async function updateVectorStore() {
  try {
    console.log("🔄 Updating PostgreSQL pgvector store...");

    // データディレクトリから全ファイルを読み込み
    const fileData = await loadAllDataFiles();

    // 全ファイルのチャンクを収集
    const allChunks: Array<{
      text: string;
      source: string;
      fileIndex: number;
      chunkIndex: number;
    }> = [];

    for (let fileIndex = 0; fileIndex < fileData.length; fileIndex++) {
      const { content, filename } = fileData[fileIndex];
      const chunks = splitTextIntoChunks(content);

      for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
        allChunks.push({
          text: chunks[chunkIndex],
          source: filename,
          fileIndex,
          chunkIndex,
        });
      }

      console.log(`  📊 ${filename}: ${chunks.length} chunks`);
    }

    console.log(`📊 Total chunks from all files: ${allChunks.length}`);

    // インデックスが存在するか確認
    const indexExists = await checkIfIndexExists();

    if (!indexExists) {
      console.log("🔧 Creating PostgreSQL pgvector index...");
      await vectorStore.createIndex({
        indexName: INDEX_NAME,
        dimension: 1536,
      });
      console.log("✅ PostgreSQL pgvector index created");
    } else {
      console.log("ℹ️  Using existing PostgreSQL pgvector index");
    }

    // エンベディング生成
    const texts = allChunks.map((chunk) => chunk.text);
    const embeddings = await generateEmbeddings(texts);

    // ドキュメントを挿入/更新
    console.log("💾 Inserting documents into PostgreSQL...");
    const ids = allChunks.map((_, index) => `doc_${index}`);
    const metadata = allChunks.map((chunk, index) => ({
      text: chunk.text,
      source: chunk.source,
      file_index: chunk.fileIndex,
      chunk_index: chunk.chunkIndex,
      global_index: index,
      updated_at: new Date().toISOString(),
    }));

    await vectorStore.upsert({
      indexName: INDEX_NAME,
      vectors: embeddings,
      metadata: metadata,
      ids: ids,
    });

    console.log(
      `✅ Successfully updated PostgreSQL pgvector store with ${allChunks.length} documents from ${fileData.length} files`
    );

    // ファイル別の統計を表示
    const fileStats = fileData.map((file, index) => {
      const fileChunks = allChunks.filter((chunk) => chunk.fileIndex === index);
      return `  📄 ${file.filename}: ${fileChunks.length} chunks`;
    });
    console.log("📈 File breakdown:");
    for (const stat of fileStats) {
      console.log(stat);
    }
  } catch (error) {
    console.error("❌ Error updating vector store:", error);
    process.exit(1);
  }
}

/**
 * ベクターストアの統計情報を表示
 */
async function showStats() {
  try {
    console.log("📊 PostgreSQL pgvector Store Statistics");
    console.log("=========================================");

    const connectionInfo = {
      connectionString:
        process.env.PG_CONNECTION_STRING ||
        "postgresql://postgres:password@localhost:5432/mastra_vectors",
      indexName: INDEX_NAME,
    };

    console.log(`Connection: ${connectionInfo.connectionString}`);
    console.log(`Index Name: ${connectionInfo.indexName}`);

    const indexExists = await checkIfIndexExists();
    console.log(`Index Exists: ${indexExists ? "✅ Yes" : "❌ No"}`);

    if (indexExists) {
      console.log("Embedding Dimension: 1536");
      console.log("Model: text-embedding-3-small");
      console.log("Vector Database: PostgreSQL with pgvector extension");
    } else {
      console.log(
        "ℹ️  Run 'npm run pgvector:update' to create the vector store"
      );
    }
  } catch (error) {
    console.error("❌ Error getting stats:", error);
    process.exit(1);
  }
}

/**
 * ベクターストアを完全に再構築
 */
async function rebuildVectorStore() {
  try {
    console.log("🔄 Rebuilding PostgreSQL pgvector store...");

    // 既存のインデックスを削除
    try {
      await vectorStore.deleteIndex({
        indexName: INDEX_NAME,
      });
      console.log("🗑️  Existing index deleted");
    } catch {
      console.log("ℹ️  No existing index to delete");
    }

    // 新しくベクターストアを作成
    await updateVectorStore();
  } catch (error) {
    console.error("❌ Error rebuilding vector store:", error);
    process.exit(1);
  }
}

// コマンドライン引数を処理
const command = process.argv[2];

switch (command) {
  case "update":
    await updateVectorStore();
    break;
  case "stats":
    await showStats();
    break;
  case "rebuild":
    await rebuildVectorStore();
    break;
  default:
    console.log("PostgreSQL pgvector Store Manager");
    console.log("==================================");
    console.log("Available commands:");
    console.log(
      "  update  - Update vector store with all files from src/data/"
    );
    console.log("  stats   - Show vector store statistics");
    console.log("  rebuild - Completely rebuild vector store");
    console.log("");
    console.log("Usage:");
    console.log("  npm run pgvector:update");
    console.log("  npm run pgvector:stats");
    console.log("  npm run pgvector:rebuild");
    break;
}
