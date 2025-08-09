import { ragAgentPg } from "../mastra/agents/rag-agent-pg";

async function runRagPgvectorExample() {
  console.log("=== Mastra RAGエージェント（pgvector）使用例 ===\n");

  try {
    // 1. TypeScriptについての質問
    console.log("1. TypeScriptについて質問:");
    const response1 = await ragAgentPg.generate(
      "TypeScriptとは何ですか？JavaScriptとの違いを教えてください。"
    );
    console.log("回答:", response1.text);
    console.log(`\n${"=".repeat(50)}\n`);

    // 2. React関連の質問
    console.log("2. Reactについて質問:");
    const response2 = await ragAgentPg.generate(
      "Reactでコンポーネントを作る際の利点は何ですか？"
    );
    console.log("回答:", response2.text);
    console.log(`\n${"=".repeat(50)}\n`);

    // 3. 存在しない情報についての質問
    console.log("3. 存在しない情報について質問:");
    const response3 = await ragAgentPg.generate(
      "量子コンピューティングについて教えてください"
    );
    console.log("回答:", response3.text);
    console.log(`\n${"=".repeat(50)}\n`);

    // 4. 開発に関する質問
    console.log("4. 開発に関する質問:");
    const response4 = await ragAgentPg.generate(
      "効果的なプログラミングの学習方法を教えてください"
    );
    console.log("回答:", response4.text);
  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

// 実行
if (require.main === module) {
  runRagPgvectorExample();
}

export { runRagPgvectorExample };
