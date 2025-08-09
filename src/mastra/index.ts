import { Mastra } from "@mastra/core/mastra";
import { PinoLogger } from "@mastra/loggers";
import { weatherWorkflow } from "./workflows/weather-workflow";
import { weatherAgent } from "./agents/weather-agent";
import { simpleChatAgent } from "./agents/simple-chat";
import { ragAgentPg } from "./agents/rag-agent-pg";
import { postgresVector } from "./config/vectors.js";
import { mathAgent } from "./agents/math-agent";

export const mastra = new Mastra({
  vectors: {
    postgres: postgresVector, // 中央でベクターストアを管理
  },
  workflows: { weatherWorkflow },
  agents: { simpleChatAgent, weatherAgent, mathAgent, ragAgentPg },
  logger: new PinoLogger({
    name: "Mastra",
    level: "info",
  }),
});

// ベクターストアへの便利なアクセス関数
export function getPostgresVector() {
  return mastra.getVector("postgres");
}
