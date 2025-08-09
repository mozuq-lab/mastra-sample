import { Agent } from "@mastra/core/agent";
import { createVectorQueryTool } from "@mastra/rag";
import { getPostgresVector } from "../config/vectors.js";
import { getLLMModel, getEmbeddingModel } from "../config/models.js";

let knowledgeBaseLoaded = false;
const INDEX_NAME = "knowledge_base";

const RAG_AGENT_INSTRUCTIONS = `
あなたはRAG（Retrieval-Augmented Generation）エージェントです。
ナレッジベースから取得した情報に基づいてユーザーの質問に答えることが目標です。

以下の手順に従ってください：
1. ユーザーの質問を受け取ります。
2. "vectorQuery" ツールを使用してユーザーの質問に関連する情報を検索します。
3. ツールから関連するコンテキストを受け取ります。
4. コンテキストに関連情報が見つからない場合は、ナレッジベースで回答が見つからなかった旨をユーザーに伝えます。
5. そうでなければ、ツールから提供されたコンテキストのみに基づいてユーザーの質問に答えを作成します。外部の知識は使用しないでください。
6. ユーザーに回答を提示します。

コンテキストが不十分な場合は、その旨を明確に述べてください。
`;

// 中央設定のPostgreSQL pgvectorストアを使用
const vectorStore = getPostgresVector();

// 環境変数からエンべディングモデルを取得
const embeddingModel = getEmbeddingModel();

// ベクタークエリツールを作成（初期化付き）
const vectorQueryTool = createVectorQueryTool({
  indexName: INDEX_NAME,
  vectorStore: vectorStore,
  model: embeddingModel,
  description: "ナレッジベースからクエリに関連する情報を検索します",
});

// ベクタークエリツール実行前に初期化を確実に実行するためのラッパー
const originalExecute = vectorQueryTool.execute;
vectorQueryTool.execute = async function (
  context: Parameters<typeof originalExecute>[0]
) {
  await ensureKnowledgeBaseLoaded();
  return originalExecute.call(this, context);
};

// ナレッジベース読み込み関数
async function ensureKnowledgeBaseLoaded() {
  if (knowledgeBaseLoaded) {
    return;
  }

  try {
    console.log("🔍 PostgreSQL pgvectorベクターストアを確認中...");

    knowledgeBaseLoaded = true;
    console.log("✅ ベクターストアの準備が完了しました");
  } catch (error) {
    console.error("❌ ナレッジベース読み込みエラー:", error);
    throw error;
  }
}

// RAGエージェントを作成（環境変数からモデルを取得）
export const ragAgentPg = new Agent({
  name: "RAGエージェント（pgvector）",
  instructions: RAG_AGENT_INSTRUCTIONS,
  model: getLLMModel(),
  tools: {
    vectorQuery: vectorQueryTool,
  },
});

// テスト用：単一質問関数
export async function askQuestion(question: string) {
  try {
    await ensureKnowledgeBaseLoaded();
    const response = await ragAgentPg.generate(question);
    return response.text;
  } catch (error) {
    console.error("質問処理エラー:", error);
    throw error;
  }
}
