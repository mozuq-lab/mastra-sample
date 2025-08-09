import fs from "node:fs/promises";
import { Agent } from "@mastra/core/agent";
import { chunkText } from "../../utils/text-utils.js";
import { resolveFromProjectRoot } from "../../utils/path-utils.js";
import OpenAi from "openai";
import dotenv from "dotenv";
import { getLLMModel } from "../config/models.js";

dotenv.config();

const openaiClient = new OpenAi({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * 指定されたテキストのエンべディング（ベクトル表現）を取得します。
 * @param text - エンべディングを取得するテキスト
 * @returns - テキストのエンべディング（数値配列）
 */
async function getEmbedding(text: string): Promise<number[]> {
  try {
    const normalizedText = text
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
    console.log(
      `Generating embedding for text: "${normalizedText.substring(0, 50)}..."`
    );
    const response = await openaiClient.embeddings.create({
      model: process.env.EMBEDDING_MODEL || "text-embedding-3-small",
      input: normalizedText,
    });
    console.log(
      `Embedding generated, length: ${response.data[0].embedding.length})`
    );
    return response.data[0].embedding;
  } catch (error) {
    console.error("Error getting embedding:", error);
    throw error;
  }
}

/**
 * プロンプトとテキストに基づいてLLMに解答を生成させます。
 * @param prompt - LLMに与えるプロンプト
 * @param context - 検索された関連情報
 * @returns - LLMからの応答テキスト
 */
export async function generateCompletion(
  prompt: string,
  context: string
): Promise<string> {
  try {
    const systemMessage =
      "あなたは親切なAIアシスタントです。提供されたコンテキスト情報を利用して、ユーザーの質問に正確かつ簡潔に答えてください。もしコンテキスト情報だけでは答えられない場合は、その旨を正直に伝えてください。";
    const userMessage = `コンテキスト:\n${context}\n\n質問:\n${prompt}\n\n回答:`;

    const response = await openaiClient.chat.completions.create({
      model: process.env.LLM_MODEL || "gpt-4o-mini",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage },
      ],
      temperature: 0.7,
      max_tokens: 250,
    });
    return (
      response.choices[0]?.message.content?.trim() ||
      "回答が得られませんでした。"
    );
  } catch (error) {
    console.error("Error generating completion:", error);
    throw error;
  }
}

interface VectorDocument {
  id: string;
  text: string;
  embedding: number[];
}

// シンプルなインメモリベクターストア
class SimpleVectorStore {
  private documents: VectorDocument[] = [];
  private nextId = 1;

  /**
   * ドキュメント（テキストチャンク）をストアに追加します。
   * エンべディングも内部で生成・保存します。
   * @param textChunk ストアに追加するテキストチャンク
   */
  async addDocument(textChunk: string): Promise<void> {
    try {
      const embedding = await getEmbedding(textChunk);
      this.documents.push({
        id: `doc-${this.nextId++}`,
        text: textChunk,
        embedding,
      });
      console.log(
        `ドキュメントを追加しました: ${textChunk.substring(0, 30)}...`
      );
    } catch (error) {
      console.error("ドキュメントの追加中にエラーが発生しました:", error);
    }
  }

  /**
   * クエリテキストに最も類似するドキュメントを検索します。
   * @param queryText 検索クエリ
   * @pramp topK 取得する類似ドキュメントの数
   * @pramp similarityThreshold 類似度の最小閾値（0〜1の範囲、デフォルト0.0で足切りなし）
   * @return 類似ドキュメントの配列
   */
  async search(
    queryText: string,
    topK = 5,
    similarityThreshold = 0.0
  ): Promise<VectorDocument[]> {
    if (this.documents.length === 0) {
      console.warn("ドキュメントがストアにありません。");
      return [];
    }

    try {
      console.log(
        `検索クエリ: ${queryText.substring(0, 30)}... with threshold ${similarityThreshold}`
      );
      const queryEmbedding = await getEmbedding(queryText);

      // 各ドキュメントのエンべディングとクエリのコサイン類似度を計算
      let similarities: { doc: VectorDocument; score: number }[] =
        this.documents.map((doc) => {
          const score = this.cosineSimilarity(queryEmbedding, doc.embedding);
          return { doc, score };
        });

      // 全ての類似度スコアを表示
      console.log("All similaritye scores before filtering:");
      similarities.forEach((sim, idx) => {
        console.log(
          `Document ID: ${idx}, (${sim.doc.text.substring(0, 30)}...) Score: ${sim.score}`
        );
      });

      // スコアが閾値以上のドキュメントをフィルタリング
      const beforeFilterCount = similarities.length;
      similarities = similarities.filter(
        (sim) => sim.score >= similarityThreshold
      );
      console.log(
        `Filterd from ${beforeFilterCount} to ${similarities.length} documents with threshold ${similarityThreshold}`
      );
      similarities.sort((a, b) => b.score - a.score);

      // 上位の結果をログに出力
      const results = similarities.slice(0, topK);
      console.log(`Top ${topK} search results:`);
      results.forEach((sim, idx) => {
        console.log(
          `Rank ${idx + 1}: Score: ${sim.score}, Text: ${sim.doc.text.substring(0, 50)}...`
        );
      });

      return results.map((sim) => sim.doc);
    } catch (error) {
      console.error("検索中にエラーが発生しました:", error);
      return [];
    }
  }

  /**
   * 2つのベクトル間のコサイン類似度を計算します。
   * @param vecA ベクトルA
   * @param vecB ベクトルB
   * @returns コサイン類似度（0〜1の範囲）
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length || vecA.length === 0) {
      console.error("ベクトルの次元が一致しないか、空のベクトルです");
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) {
      return 0; // ゼロベクトルの場合は類似度0
    }

    const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));

    // 数値の精度問題を避けるため値を制限（-1.0〜1.0の範囲に収める）
    const clampedSimilarity = Math.max(-1.0, Math.min(1.0, similarity));
    if (similarity !== clampedSimilarity) {
      console.warn(
        `コサイン類似度が制限されました: ${similarity} -> ${clampedSimilarity}`
      );
    }
    return clampedSimilarity;
  }

  getDocuments(): VectorDocument[] {
    return this.documents;
  }
}

let knowledgeBaseLoaded = false;

const RAG_AGENT_INSTRUCTIONS = `
あなたはRAG（Retrieval-Augmented Generation）エージェントです。
ナレッジベースから取得した情報に基づいてユーザーの質問に答えることが目標です。

以下の手順に従ってください：
1. ユーザーの質問を受け取ります。
2. "searchKnowledgeBase" ツールを使用してユーザーの質問に関連する情報を検索します。
3. ツールから関連するコンテキストを受け取ります。
4. コンテキストに関連情報が見つからない場合は、ナレッジベースで回答が見つからなかった旨をユーザーに伝えます。
5. そうでなければ、ツールから提供されたコンテキストのみに基づいてユーザーの質問に答えを作成します。外部の知識は使用しないでください。
6. ユーザーに回答を提示します。

コンテキストが不十分な場合は、その旨を明確に述べてください。
`;

const vectorStore = new SimpleVectorStore();

async function ensureKnowledgeBaseLoaded(): Promise<void> {
  if (knowledgeBaseLoaded) return;

  // プロジェクトルートベースの堅牢なパス解決
  const knowledgeBasePath = await resolveFromProjectRoot("src/data/sample.txt");

  try {
    const fileContent = await fs.readFile(knowledgeBasePath, "utf-8");
    const chunks = chunkText(fileContent, 200, 50);

    console.log(`Splitting knowledge base into ${chunks.length} chunks...`);

    for (const chunk of chunks) {
      await vectorStore.addDocument(chunk);
    }

    knowledgeBaseLoaded = true;
    console.log("Knowledge base loaded successfully.");
  } catch (error) {
    console.error("Error loading knowledge base:", error);
    throw new Error(
      "Failed to load knowledge base. Please check the data file."
    );
  }
}

// カスタム検索ツールを作成
const searchKnowledgeBaseTool = {
  id: "searchKnowledgeBase",
  description: "ナレッジベースからクエリに関連する情報を検索します",
  parameters: {
    type: "object",
    properties: {
      queryText: {
        type: "string",
        description: "検索クエリ",
      },
      topK: {
        type: "number",
        description: "取得する結果の数",
        default: 3,
      },
    },
    required: ["queryText"],
  },
  async execute(params: { queryText: string; topK?: number }) {
    // await ensureKnowledgeBaseLoaded();

    console.log(`Searching for: ${params.queryText}`);
    const results = await vectorStore.search(
      params.queryText,
      params.topK || 3,
      0.0 // similarity threshold
    );

    if (results.length === 0) {
      return "ナレッジベースで関連する情報が見つかりませんでした。";
    }

    const context = results
      .map((result, index) => `[結果${index + 1}] ${result.text}`)
      .join("\n\n");

    console.log(`Found ${results.length} relevant documents`);
    return context;
  },
};

export const ragAgent = new Agent({
  name: "RAG Agent",
  instructions: RAG_AGENT_INSTRUCTIONS,
  model: getLLMModel(),
  tools: {
    searchKnowledgeBase: searchKnowledgeBaseTool,
  },
});

// 初期化
ensureKnowledgeBaseLoaded().catch(console.error);
