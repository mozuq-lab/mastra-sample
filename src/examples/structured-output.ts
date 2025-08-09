// JSON形式で出力するエージェントの例（人物情報抽出）
import { generateObject } from "ai";
import { z } from "zod";
import { getLLMModel } from "../mastra/config/models";

// 人物情報のスキーマ定義
const PersonSchema = z.object({
  name: z.string().describe("人物の名前"),
  age: z.number().describe("年齢"),
  occupation: z.string().describe("職業"),
});

// 人物情報抽出関数
export async function extractPersonInfo(input: string) {
  const result = await generateObject({
    model: getLLMModel(),
    schema: PersonSchema,
    prompt: `
あなたは人物情報を抽出・整理するエージェントです。
与えられたテキストから人物の情報を抽出し、JSON形式で出力してください。
情報が不明な場合は、適切なデフォルト値を使用してください。

テキスト: ${input}
`,
  });

  return result.object;
}

// 使用例の関数
export async function runPersonInfoExample() {
  console.log("=== 人物情報抽出の例 ===");

  const input = `
  田中太郎さんは35歳のソフトウェアエンジニアで、東京に住んでいます。
  JavaScript、TypeScript、Pythonが得意で、10年間のプログラミング経験があります。
  最近はAIと機械学習にも興味を持っています。
  `;

  try {
    const result = await extractPersonInfo(input);
    console.log("抽出された人物情報:");
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

// メイン実行部分（直接実行時）
if (import.meta.url === `file://${process.argv[1]}`) {
  // 環境変数にAPIキーがある場合は実際の例を実行
  if (process.env.OPENAI_API_KEY) {
    runPersonInfoExample().catch(console.error);
  } else {
    console.log("OpenAI APIキーが見つかりません。");
  }
}
