# コーディング規約

## ファイル名規約

このプロジェクトでは**ケバブケース（kebab-case）**でファイル名を統一しています。

### 例

✅ **推奨**

```
llm-client.ts
vector-store.ts
rag-agent-pg.ts
text-utils.ts
vector-store-manager.ts
structured-output.ts
```

❌ **非推奨**

```
llmClient.ts        // キャメルケース
vectorStore.ts      // キャメルケース
structured_output.ts // アンダースコア
```

### 理由

1. **一貫性**: プロジェクト全体で統一された命名規則
2. **可読性**: 複数の単語が区切られて読みやすい
3. **慣例**: Node.js/TypeScriptプロジェクトでの一般的な慣例
4. **ツール互換性**: 多くのツールがケバブケースを推奨

## ディレクトリ構造

```
src/
├── examples/           # 使用例
├── mastra/
│   ├── config/        # 設定ファイル（ベクターストア等）
│   ├── agents/        # エージェント実装
│   ├── tools/         # ツール実装
│   ├── workflows/     # ワークフロー実装
│   └── index.ts       # メインMastraインスタンス
├── utils/             # ユーティリティ関数
└── data/              # ナレッジベースデータ（.txt, .md, .json, .csv）
```

## TypeScriptインポート

ファイル拡張子を明記し、適切なパスを使用：

```typescript
// ユーティリティ関数のインポート
import { chunkText } from "../../utils/text-utils.js";
import { SimpleVectorStore } from "../../vector-store.js";

// 中央設定からのインポート（推奨）
import { getPostgresVector } from "../config/vectors.js";

// Mastraインスタンスからのインポート
import { mastra, getPostgresVector } from "../index.js";
```

## アーキテクチャパターン

### 設定の分離

循環依存を回避するため、設定ファイルを分離：

```typescript
// src/mastra/config/vectors.ts - 設定のみ
export const postgresVector = new PgVector({ /* config */ });
export function getPostgresVector() { return postgresVector; }

// src/mastra/index.ts - Mastraインスタンス
import { postgresVector } from "./config/vectors.js";
export const mastra = new Mastra({ vectors: { postgres: postgresVector } });

// src/mastra/agents/rag-agent-pg.ts - エージェント実装
import { getPostgresVector } from "../config/vectors.js";  // 直接参照
```

### リソース共有パターン

```typescript
// ❌ 非推奨：個別インスタンス作成
const vectorStore = new PgVector({ /* config */ });

// ✅ 推奨：中央設定を使用
const vectorStore = getPostgresVector();
```

## 命名規則サマリー

| 種類           | 規則                 | 例                       |
| -------------- | -------------------- | ------------------------ |
| ファイル名     | kebab-case           | `rag-agent.ts`           |
| ディレクトリ名 | kebab-case           | `text-utils/`            |
| クラス名       | PascalCase           | `SimpleVectorStore`      |
| 関数名         | camelCase            | `generateEmbeddings`     |
| 変数名         | camelCase            | `knowledgeBaseLoaded`    |
| 定数名         | SCREAMING_SNAKE_CASE | `RAG_AGENT_INSTRUCTIONS` |
