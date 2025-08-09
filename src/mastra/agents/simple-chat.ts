import { Agent } from "@mastra/core/agent";
import { getLLMModel } from "../config/models.js";

export const simpleChatAgent = new Agent({
  name: "シンプルチャットボット",
  instructions: `
あなたはフレンドリーなチャットボットです。
ユーザーの質問に答えてください。
日本語で応答してください。
`,
  model: getLLMModel(),
});
