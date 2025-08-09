# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 重要なコマンド

### 開発コマンド

- `npm run dev` - Mastra開発サーバーを起動
- `npm run build` - プロジェクトをビルド
- `npm run start` - 本番サーバーを起動

### PostgreSQLベクターストア管理

- `npm run pgvector:update` - src/data/以下の全ファイルからPostgreSQLベクターストアを更新
- `npm run pgvector:stats` - PostgreSQLベクターストアの統計情報を表示
- `npm run pgvector:rebuild` - PostgreSQLベクターストアを完全に再構築

### 使用例実行

- `npm run dev -- examples/rag-example.ts` - SimpleVectorStore版RAGエージェントのテスト
- `npm run dev -- examples/rag-pgvector-example.ts` - PostgreSQL版RAGエージェントのテスト
- `npm run dev -- examples/math-example.ts` - 数学計算エージェントのテスト

## アーキテクチャ概要

### Mastra設定の構造

このプロジェクトには以下のMastra設定が存在する：

1. **ベクター設定** (`src/mastra/config/vectors.ts`)
   - 中央集権的なベクターストア設定
   - PgVectorインスタンスを一元管理
   - 循環依存を回避した設計

2. **メインアプリケーション設定** (`src/mastra/index.ts`)
   - 全体的なMastraインスタンス
   - エージェント、ワークフロー、ベクターストア、ロガーを統合
   - `mastra.getVector('postgres')`で中央設定にアクセス

### RAG実装のバリエーション

1. **rag-agent.ts** - SimpleVectorStore使用版
   - プロジェクト固有のベクターストア実装
   - コサイン類似度による検索
   - メモリ内での動作

2. **rag-agent-pg.ts** - PostgreSQL統合版（推奨）
   - `@mastra/rag`のcreateVectorQueryToolを使用
   - **中央設定のベクターストア**を参照（`config/vectors.ts`）
   - PostgreSQL pgvector拡張機能を使用
   - 永続化ストレージ対応
   - インデックス名は`knowledge_base`（SQLの識別子規則に準拠）
   - 本格運用向けのスケーラブルなベクター検索
   - リソース効率的（単一接続プール共有）

### ベクターストア永続化の仕組み

- **中央設定による効率的管理**（`src/mastra/config/vectors.ts`）
- PostgreSQL pgvectorでのベクターデータ永続化
- 単一接続プールの共有でリソース効率化
- 既存インデックスの自動チェック機能
- 重複処理回避でAPI使用量を削減
- pgvector-managerで管理機能を提供

## 重要な技術仕様

### ファイル名規約

- **kebab-case**で統一（例：`rag-agent-pg.ts`）
- ハイフン使用、キャメルケースやアンダースコア避ける

### インデックス命名規則

- SQL識別子規則に準拠（文字、数字、アンダースコアのみ）
- ハイフンは使用不可（`knowledge-base` → `knowledge_base`）

### 環境変数

- `OPENAI_API_KEY` - OpenAI APIキー（必須）
- `PG_CONNECTION_STRING` - PostgreSQL接続文字列（デフォルト：`postgresql://localhost:5432/mastra_vectors`）

### チャンクとエンベディング

- デフォルトチャンクサイズ: 200文字、オーバーラップ: 50文字
- OpenAI text-embedding-3-small使用（1536次元）
- `src/data/`以下の全ファイル（.txt, .md, .json, .csv）をナレッジベースとして使用

## PostgreSQLセットアップ

PostgreSQL統合版を使用するには、事前にPostgreSQLサーバーとpgvector拡張機能の設定が必要です：

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

## ワークフロー

### 開発フロー

1. **プロトタイプ開発**: SimpleVectorStore版（`rag-agent.ts`）でクイック開発
2. **本番準備**: PostgreSQL版（`rag-agent-pg.ts`）に移行
3. **ベクターストア構築**: `npm run pgvector:update` で`src/data/`の全ファイルを投入
4. **本番運用**: 構築済みベクターストアを活用

### 推奨ベストプラクティス

- **開発段階**: SimpleVectorStore版でRAGロジックを確認
- **本番運用**: PostgreSQL版で永続化とパフォーマンスを確保
- **中央設定活用**: `src/mastra/config/vectors.ts`で設定を一元管理
- **リソース効率化**: 中央設定により接続プールを共有
- **データ更新**: `src/data/`にファイルを追加後、`npm run pgvector:update`でナレッジベースを更新

### アーキテクチャの利点

1. **リソース効率性**: 単一のPostgreSQLコネクションプールを全体で共有
2. **保守性**: 設定の一元化（環境変数、接続設定）
3. **型安全性**: `mastra.getVector('postgres')`で型安全なアクセス
4. **テスタビリティ**: テスト時にモックベクターストアを簡単に注入可能
5. **拡張性**: 複数のベクターストア（Pinecone、Chroma等）を統一的に管理

## トラブルシューティング

### よくあるエラー

1. **"Invalid index name"**: インデックス名にハイフンが含まれている
2. **"No relevant information found"**: 類似度閾値が高すぎるか、チャンクサイズが不適切
3. **Rate limit exceeded**: OpenAI APIの使用量制限、既存ベクターストアの再利用を推奨
4. **PostgreSQL接続エラー**: `PG_CONNECTION_STRING`の設定確認、PostgreSQLサービスの起動状態をチェック
5. **pgvector拡張機能エラー**: データベースでpgvector拡張機能が有効になっているか確認

### PostgreSQL関連のトラブルシューティング

```bash
# PostgreSQLサービス確認
brew services list | grep postgresql

# データベース接続テスト
psql -d mastra_vectors -c "SELECT 1;"

# pgvector拡張機能確認
psql -d mastra_vectors -c "SELECT * FROM pg_extension WHERE extname = 'vector';"
```

### ベクターストア状態確認

- `npm run pgvector:stats`で統計取得
- ベクターストアのexistence checkで重複処理を防止
