# Mastra RAG Agent Project

このプロジェクトは[Mastra](https://docs.mastra.ai)フレームワークを使用して構築されたRAG（Retrieval-Augmented Generation）エージェントのデモンストレーションです。PostgreSQL pgvectorを使った永続化対応のベクターストアと、複数のエージェント実装を含んでいます。

## 🚀 特徴

- **RAGエージェント** - PostgreSQL pgvectorを使った高性能なベクター検索
- **数学計算エージェント** - mathjs統合による正確な計算処理
- **天気エージェント** - 天気情報の取得とアクティビティ提案
- **シンプルチャット** - 汎用的なチャットボット機能
- **環境変数設定** - LLMモデルとエンベディングモデルの柔軟な設定
- **マルチファイル対応** - .txt, .md, .json, .csvファイルの自動取り込み

## 📋 前提条件

- Node.js 18以上
- PostgreSQL 14以上（pgvector拡張付き）
- OpenAI API キー

## 🔧 セットアップ

### 1. 依存関係のインストール
```bash
npm install
```

### 2. 環境変数の設定
`.env`ファイルを作成し、以下の変数を設定：

```bash
# 必須
OPENAI_API_KEY=your_openai_api_key_here

# データベース接続（オプション - デフォルト値あり）
PG_CONNECTION_STRING=postgresql://postgres:password@localhost:5432/mastra_vectors

# モデル設定（オプション - デフォルト値あり）
LLM_MODEL=gpt-4o-mini
EMBEDDING_MODEL=text-embedding-3-small
```

### 3. PostgreSQLセットアップ
```bash
# PostgreSQLサーバー起動
# macOSの場合:
brew services start postgresql

# pgvector拡張を有効化
psql -c "CREATE EXTENSION IF NOT EXISTS vector;" -d mastra_vectors
```

### 4. ベクターストアの初期化
```bash
# データファイルからベクターストアを構築
npm run pgvector:update

# 統計情報の確認
npm run pgvector:stats
```

## 🎯 使用方法

### 開発サーバーの起動
```bash
npm run dev
```

### エージェントのテスト実行

#### RAGエージェント（PostgreSQL版）
```bash
npm run dev -- examples/rag-libsql-example.ts
```

#### 数学計算エージェント
```bash
npm run dev -- examples/math-example.ts
```

#### その他のエージェント
```bash
# 構造化出力の例
npm run dev -- examples/structured-output.ts
```

### ベクターストア管理コマンド

```bash
# ベクターストアの更新（src/data/以下の全ファイル）
npm run pgvector:update

# 統計情報の表示
npm run pgvector:stats

# ベクターストアの完全再構築
npm run pgvector:rebuild
```

## 📁 プロジェクト構造

```
src/
├── data/                      # ナレッジベース用データファイル
│   └── sample.txt            # サンプルデータ
├── examples/                  # 使用例
│   ├── math-example.ts       # 数学計算の例
│   ├── rag-libsql-example.ts # RAGエージェントの例
│   └── structured-output.ts  # 構造化出力の例
├── mastra/
│   ├── agents/               # エージェント実装
│   │   ├── math-agent.ts     # 数学計算エージェント
│   │   ├── rag-agent-pg.ts   # RAGエージェント（PostgreSQL版）
│   │   ├── simple-chat.ts    # シンプルチャットボット
│   │   └── weather-agent.ts  # 天気エージェント
│   ├── config/               # 設定ファイル
│   │   ├── models.ts         # LLM/エンベディングモデル設定
│   │   └── vectors.ts        # ベクターストア設定
│   ├── tools/                # ツール実装
│   │   ├── math-tool.ts      # 数学計算ツール
│   │   └── weather-tool.ts   # 天気ツール
│   └── index.ts              # Mastraメイン設定
├── utils/                    # ユーティリティ
│   ├── pgvector-manager.ts   # PostgreSQL pgvector管理
│   └── text-utils.ts         # テキスト処理ユーティリティ
└── vector-store.ts           # ベクターストア実装
```

## 🔧 環境変数リファレンス

### 必須設定
- `OPENAI_API_KEY` - OpenAI APIキー

### データベース設定
- `PG_CONNECTION_STRING` - PostgreSQL接続文字列（デフォルト: `postgresql://postgres:password@localhost:5432/mastra_vectors`）

### モデル設定
- `LLM_MODEL` - 使用するLLMモデル（デフォルト: `gpt-4o-mini`）
  - 利用可能: `gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo`, `gpt-4`, `gpt-3.5-turbo`
- `EMBEDDING_MODEL` - 使用するエンべディングモデル（デフォルト: `text-embedding-3-small`）
  - 利用可能: `text-embedding-3-small`, `text-embedding-3-large`, `text-embedding-ada-002`

## 🎨 カスタマイズ

### 新しいデータファイルの追加
1. `src/data/`ディレクトリにファイルを配置（.txt, .md, .json, .csv対応）
2. `npm run pgvector:update`でベクターストアを更新

### エージェントのカスタマイズ
エージェントは`src/mastra/agents/`以下で定義されています。新しいエージェントを追加する場合：

1. 新しいエージェントファイルを作成
2. `src/mastra/index.ts`のagents配列に追加
3. 必要に応じてツールを`src/mastra/tools/`に実装

### モデルの変更
環境変数または`src/mastra/config/models.ts`でモデルを変更できます：

```typescript
// 環境変数での設定（推奨）
LLM_MODEL=gpt-4o
EMBEDDING_MODEL=text-embedding-3-large

// または直接コード内で変更
export function getLLMModel() {
  return openai("gpt-4o"); // お好みのモデルに変更
}
```

## 🐛 トラブルシューティング

### よくある問題

1. **"Invalid index name" エラー**
   - インデックス名にハイフンが含まれている可能性があります
   - SQLの識別子規則に従い、アンダースコアを使用してください

2. **"No relevant information found"**
   - 類似度閾値が高すぎるか、チャンクサイズが不適切な可能性
   - `npm run pgvector:stats`で状態を確認

3. **"Rate limit exceeded"**
   - OpenAI APIの使用量制限に達しています
   - 既存のベクターストアを再利用してAPI使用量を削減

4. **PostgreSQL接続エラー**
   - PostgreSQLサーバーが起動しているか確認
   - pgvector拡張がインストールされているか確認
   - 接続文字列が正しいか確認

### デバッグ方法

```bash
# ベクターストアの状態確認
npm run pgvector:stats

# PostgreSQL接続テスト
psql $PG_CONNECTION_STRING -c "SELECT 1;"

# 環境変数の確認
node -e "console.log(process.env.OPENAI_API_KEY ? 'API Key: Set' : 'API Key: Missing')"
```

## 📚 詳細ドキュメント

- [CLAUDE.md](./CLAUDE.md) - Claude Code用の詳細な技術仕様
- [CODING_STANDARDS.md](./CODING_STANDARDS.md) - コーディング規約
- [RAG_IMPLEMENTATIONS.md](./RAG_IMPLEMENTATIONS.md) - RAG実装の詳細
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - トラブルシューティングガイド

## 📄 ライセンス

MIT License

## 🤝 コントリビューション

プルリクエストやIssueを歓迎します。開発に参加する場合は、[CODING_STANDARDS.md](./CODING_STANDARDS.md)を参照してください。

## 🔗 関連リンク

- [Mastra Documentation](https://docs.mastra.ai)
- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [OpenAI API Documentation](https://platform.openai.com/docs)