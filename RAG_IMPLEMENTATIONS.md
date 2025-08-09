# RAG実装バリエーション

このプロジェクトでは、Mastraを使用した複数のRAG（Retrieval-Augmented Generation）実装を提供しています。

## 実装バリエーション

### 1. rag-agent.ts - SimpleVectorStore使用版

- **特徴**: プロジェクト固有の`SimpleVectorStore`を使用
- **メリット**: 軽量でシンプルな実装
- **検索方式**: コサイン類似度によるベクター検索
- **ストレージ**: インメモリ（再起動で消失）
- **エンべディング**: OpenAIのembedding APIを使用

### 2. rag-agent-pg.ts - PostgreSQL統合版（推奨）

- **特徴**: `@mastra/pg`のPgVectorを使用したPostgreSQL統合
- **メリット**: 本格的な本番環境向け、スケーラブル
- **検索方式**: PostgreSQL pgvector拡張機能を使用したベクター検索
- **ストレージ**: PostgreSQLデータベースで永続化
- **エンべディング**: AI SDKのembed関数を使用

## 各実装の使用場面

### SimpleVectorStore版

```typescript
import { ragAgent } from "./src/mastra/agents/rag-agent";

const response = await ragAgent.text(
  "TypeScriptについて教えてください"
);
```

**適用場面:**

- 軽量な実装が必要
- プロトタイプや開発段階
- シンプルな検索要件

### PostgreSQL統合版（推奨）

```typescript
import { ragAgentPg } from "./src/mastra/agents/rag-agent-pg";

const response = await ragAgentPg.text(
  "Reactについて教えてください"
);
```

**適用場面:**

- 本格的な本番環境での使用
- 大規模なドキュメント管理が必要
- データベースでの永続化が必要
- 高いパフォーマンスとスケーラビリティが重要

## 設定とカスタマイズ

### 環境変数

```bash
# 必須
OPENAI_API_KEY=your_openai_api_key_here

# PostgreSQL接続文字列（PostgreSQL統合版で使用）
PG_CONNECTION_STRING=postgresql://postgres:password@localhost:5432/mastra_vectors
```

### PostgreSQL ベクター永続化の特徴

- **自動重複回避**: 既存のベクターストアをチェックし、不要な再処理を防ぐ
- **永続化ストレージ**: エンべディングがPostgreSQLに保存され、再起動後も利用可能
- **高性能検索**: pgvector拡張機能による最適化されたベクター検索
- **スケーラビリティ**: PostgreSQLの信頼性とスケーラビリティを活用
- **統計情報**: ベクターストアの状態を確認可能
- **手動再構築**: 必要に応じてベクターストアを再構築可能

### ナレッジベースのカスタマイズ

すべての実装で `src/data/sample.txt` をナレッジベースとして使用しています。
独自のデータを使用する場合は、ファイルパスを変更してください。

### チャンクサイズの調整

```typescript
const chunks = chunkText(fileContent, 200, 50); // チャンクサイズ: 200, オーバーラップ: 50
```

## パフォーマンス比較

| 実装              | 初期化時間 | 検索精度 | メモリ使用量 | 拡張性 | ストレージ |
| ----------------- | ---------- | -------- | ------------ | ------ | ---------- |
| SimpleVectorStore | 中         | 高       | 低           | 低     | インメモリ |
| PostgreSQL統合    | 低         | 最高     | 低           | 最高   | 永続化     |

## PostgreSQLセットアップ

PostgreSQL統合版を使用するには、PostgreSQLサーバーとpgvector拡張機能が必要です：

```bash
# PostgreSQLをインストール（macOS）
brew install postgresql

# PostgreSQLを起動
brew services start postgresql

# データベースを作成
createdb mastra_vectors

# pgvector拡張機能をインストール
brew install pgvector

# PostgreSQLに接続してpgvector拡張機能を有効化
psql -d mastra_vectors -c "CREATE EXTENSION vector;"
```

## テスト実行

```bash
# SimpleVectorStore版のテスト
npm run dev -- examples/rag-example.ts

# PostgreSQL統合版のテスト
npm run dev -- examples/rag-pgvector-example.ts
```

## PostgreSQLベクターストア管理

PostgreSQL統合版では、ベクターストアの管理用コマンドを提供：

```bash
# sample.txtからベクターストアを更新
npm run pgvector:update

# ベクターストアの統計情報を表示
npm run pgvector:stats

# ベクターストアを完全に再構築
npm run pgvector:rebuild
```

### 統計情報の例

```
📊 PostgreSQL Vector Store Statistics:
  Exists: true
  Document Count: 111
  Dimension: 1536
  Connection: postgresql://localhost:5432/mastra_vectors
  Index Name: knowledge_base
```

## PostgreSQL永続化のメリット

1. **起動時間の短縮**: 2回目以降は既存のベクターを再利用
2. **API使用量の削減**: エンべディング生成を1回だけ実行
3. **データの保持**: PostgreSQLに永続化されるため、再起動後もベクターが保持される
4. **開発効率**: テスト中の繰り返し実行が高速
5. **高性能**: pgvector拡張機能による最適化されたベクター操作
6. **スケーラビリティ**: PostgreSQLの並行処理とトランザクション機能を活用
7. **信頼性**: PostgreSQLの実績のあるデータ管理機能

## 推奨ワークフロー

1. **開発段階**: SimpleVectorStore版でプロトタイプ開発
2. **本番環境**: PostgreSQL統合版で運用
3. **事前準備**: `npm run pgvector:update` でベクターストアを構築
4. **運用**: アプリケーション起動時は既存のベクターストアを活用
