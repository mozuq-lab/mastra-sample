import { openai } from "@ai-sdk/openai";

/**
 * 環境変数からLLMモデル設定を取得
 */
export function getLLMModel() {
  const modelName = process.env.LLM_MODEL || "gpt-4o-mini";
  return openai(modelName);
}

/**
 * 環境変数からエンべディングモデル設定を取得
 */
export function getEmbeddingModel() {
  const embeddingModelName = process.env.EMBEDDING_MODEL || "text-embedding-3-small";
  return openai.embedding(embeddingModelName);
}

/**
 * 利用可能なモデル一覧
 */
export const AVAILABLE_LLM_MODELS = [
  "gpt-4o",
  "gpt-4o-mini",
  "gpt-4-turbo",
  "gpt-4",
  "gpt-3.5-turbo",
] as const;

export const AVAILABLE_EMBEDDING_MODELS = [
  "text-embedding-3-small",
  "text-embedding-3-large",
  "text-embedding-ada-002",
] as const;

/**
 * 現在の設定を表示
 */
export function getModelConfig() {
  return {
    llmModel: process.env.LLM_MODEL || "gpt-4o-mini",
    embeddingModel: process.env.EMBEDDING_MODEL || "text-embedding-3-small",
  };
}