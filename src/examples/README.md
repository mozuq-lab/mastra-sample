# Mastraエージェントの例

このディレクトリには、様々なMastraエージェントの使用例が含まれています。

## ファイル概要

- `structured_output.ts` - JSON形式で出力するエージェントの実装例
- `math-example.ts` - 数学計算エージェントの使用例
- `rag-example.ts` - RAG（Retrieval-Augmented Generation）エージェントの使用例

## エージェント一覧

### 1. 構造化出力エージェント（structured_output.ts）

自然言語のテキストから人物の情報を抽出し、以下の形式で構造化します：

```typescript
{
  name: string,           // 人物の名前
  age: number,           // 年齢
  occupation: string,    // 職業
  location: string,      // 居住地
  skills: string[],      // スキルの配列
  experience_years: number // 経験年数
}
```

### 2. RAGエージェント（rag-example.ts）

文書検索と質問応答を組み合わせたRAG（Retrieval-Augmented Generation）エージェントです。

**主な機能：**

- 文書データベースからの検索
- 検索結果に基づく質問応答
- 新しい文書の追加
- 関連度スコアによる結果のランキング

**使用例：**

```typescript
// TypeScriptについての質問
const response = await ragAgent.generate("TypeScriptとは何ですか？");

// 新しい文書の追加
await ragAgent.generate(`
新しい技術文書を追加してください：
タイトル: "Vue.js入門"
内容: "Vue.jsは、プログレッシブなJavaScriptフレームワークです。"
タグ: ["vuejs", "javascript", "framework"]
`);
```

**利用可能なツール：**

- `searchDocuments`: 文書データベースから関連文書を検索
- `addDocument`: 新しい文書をデータベースに追加

### 3. 天気情報整理エージェント

天気に関する情報を以下の形式で構造化します：

```typescript
{
  location: string,       // 場所
  temperature: number,    // 気温（摂氏）
  condition: string,      // 天気の状態
  humidity: number,       // 湿度（%）
  wind_speed: number,     // 風速（km/h）
  forecast: [             // 3日間の天気予報
    {
      date: string,       // 日付
      high: number,       // 最高気温
      low: number,        // 最低気温
      condition: string   // 天気
    }
  ]
}
```

### 4. 商品レビュー分析エージェント

商品レビューを分析し、以下の形式で構造化します：

```typescript
{
  product_name: string,         // 商品名
  rating: number,               // 評価（1-5）
  pros: string[],               // 良い点
  cons: string[],               // 悪い点
  overall_impression: string,   // 総合的な印象
  recommendation: boolean,      // 推奨するかどうか
  price_value: "excellent" | "good" | "fair" | "poor" // 価格に対する価値
}
```

## 使用方法

### 基本的な使用方法

```typescript
import {
  extractPersonInfo,
  organizeWeatherInfo,
  analyzeProductReview,
} from "./structured_output";

// 人物情報の抽出
const personInfo = await extractPersonInfo(
  "田中太郎さんは35歳のエンジニアです。"
);

// 天気情報の整理
const weatherInfo = await organizeWeatherInfo("東京は晴れで25度です。");

// 商品レビューの分析
const reviewAnalysis =
  await analyzeProductReview("このイヤホンは音質が良いです。");
```

### 実行方法

1. **実際のAIを使用する場合**（OpenAI APIキーが必要）：

   ```bash
   export OPENAI_API_KEY="your-api-key-here"
   npx tsx src/examples/structured_output.ts
   ```

2. **モック例を確認する場合**（APIキー不要）：
   ```bash
   npx tsx src/examples/structured_output.ts
   ```

## 技術スタック

- **AI SDK**: Vercel AI SDKの`generateObject`関数を使用
- **スキーマ検証**: Zodライブラリでスキーマを定義
- **LLM**: OpenAI GPT-4o-mini
- **TypeScript**: 型安全性を確保

## 特徴

- **型安全性**: TypeScriptとZodスキーマによる厳密な型チェック
- **構造化出力**: 一貫性のあるJSON形式での出力
- **エラーハンドリング**: 適切なエラー処理とフォールバック
- **モック対応**: APIキーなしでも動作確認可能
- **拡張性**: 新しいスキーマやユースケースを簡単に追加可能

## カスタマイズ

新しいスキーマを追加する場合は、以下の手順に従ってください：

1. Zodスキーマを定義
2. 対応する関数を作成
3. 適切なプロンプトを設定
4. 使用例を追加

例：

```typescript
const BookSchema = z.object({
  title: z.string().describe("書籍のタイトル"),
  author: z.string().describe("著者名"),
  genre: z.string().describe("ジャンル"),
  pages: z.number().describe("ページ数"),
});

export async function extractBookInfo(input: string) {
  const result = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: BookSchema,
    prompt: `書籍情報を抽出してください。テキスト: ${input}`,
  });
  return result.object;
}
```
