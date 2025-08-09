import { Agent } from "@mastra/core/agent";
import { getLLMModel } from "../config/models.js";
import * as mathjs from "mathjs";
import { z } from "zod";

export const mathAgent = new Agent({
  name: "Math Agent",
  instructions: `
数学問題解決の専門家として以下の手順を厳密に実行してください：

1. ユーザーの質問を分析し、数式表現を特定する。
2. 数値と演算子を次の形式で厳密に抽出：
  - 数値：9461、12 など
  - 演算子：+、-、*、/, (, )
3. 常にcalculateツールを以下の形式で使用：
  { "expression": "抽出した式" }
4. フォーマット例：
  - ユーザー：「5かける3は？」 -> 「5 * 3」
  - ユーザー：「9461円/時間で12時間」 -> 「9461 * 12」

レスポンステンプレート：
[質問分析]

[計算式]
\`\`\`math
{expression}
\`\`\`

[結果]
  `,
  model: getLLMModel(),
  tools: {
    calculate: {
      description:
        "数式を評価します。形式：{式: 'number1 演算子 number2'}（例: {'式': '9461 * 12'}）",
      parameters: z.object({
        expression: z
          .string()
          .min(1, "Expression required")
          .describe(
            "Mathmatical expression using numbers and +,-,*,/, e.g. '9461 * 12'"
          ),
      }),
      execute: async ({ expression }: { expression: string }) => {
        console.log("Calculating expression:", { expression });
        if (!expression || typeof expression !== "string") {
          throw new Error("Expression is required");
        }
        try {
          const result = mathjs.evaluate(expression);
          return result;
        } catch (error) {
          console.error("Error evaluating expression:", error);
        }
      },
    },
  },
});
