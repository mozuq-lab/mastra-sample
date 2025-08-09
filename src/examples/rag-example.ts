import { ragAgent } from "../mastra/agents/rag-agent";

async function runRagExample() {
  console.log("=== RAGエージェント使用例 ===\n");

  try {
    // 1. 文書検索の例
    console.log("1. TypeScriptについて質問:");
    const response1 = await ragAgent.generate(
      "TypeScriptとは何ですか？JavaScriptとの違いを教えてください。"
    );
    console.log("回答:", response1.text);
    console.log(`\n${"=".repeat(50)}\n`);

    // 2. React関連の質問
    console.log("2. Reactについて質問:");
    const response2 = await ragAgent.generate(
      "Reactでコンポーネントを作る際の利点は何ですか？"
    );
    console.log("回答:", response2.text);
    console.log(`\n${"=".repeat(50)}\n`);

    // 3. 新しい文書を追加
    console.log("3. 新しい文書を追加:");
    const response3 = await ragAgent.generate(`
新しい技術文書を追加してください：
タイトル: "Vue.js入門"
内容: "Vue.jsは、プログレッシブなJavaScriptフレームワークです。学習コストが低く、既存のプロジェクトに段階的に導入できます。"
タグ: ["vuejs", "javascript", "framework", "frontend"]
`);
    console.log("追加結果:", response3.text);
    console.log(`\n${"=".repeat(50)}\n`);

    // 4. 追加した文書を検索
    console.log("4. 追加した文書を検索:");
    const response4 = await ragAgent.generate("Vue.jsについて教えてください");
    console.log("回答:", response4.text);
    console.log(`\n${"=".repeat(50)}\n`);

    // 5. 存在しない情報についての質問
    console.log("5. 存在しない情報について質問:");
    const response5 = await ragAgent.generate(
      "量子コンピューティングについて教えてください"
    );
    console.log("回答:", response5.text);
  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

// 実行
if (require.main === module) {
  runRagExample();
}

export { runRagExample };
