# blogenerator

簡単に Ollama 上のモデルにプロンプトを送り、日本語のブログ下書きを生成して Hatena Blog に下書き投稿できる CLI ツールです。

この README は初めて参加する開発者がリポジトリをセットアップしてすぐに試せるように、手順と使い方をわかりやすくまとめています。

---

## 前提

- Node.js 18 以上（fetch が組み込まれたランタイムを推奨）
- Git と npm

## 目次

- インストール
- 設定 (`.env`)
- 使い方（クイックスタート）
- CLI オプション
- ファイル構成
- 開発・デバッグ
- トラブルシューティング

---

## インストール

リポジトリをクローンして依存をインストールします。

```bash
git clone <repo-url>
cd blogenerator
npm install
```

## 設定 (`.env`)

認証情報やエンドポイントは `.env` に置きます。まず `.env.example` をコピーして編集してください。

```text
# c:\dev\js\blogenerator\.env
HATENA_USER=your-hatena-username
HATENA_BLOG_ID=your-blog-id
HATENA_API_KEY=your-hatena-api-key
# Ollama の HTTP エンドポイント（デフォルトは http://localhost:11434/api/generate）
OLLAMA_ENDPOINT=http://localhost:11434/api/generate
```

`.env` は `dotenv` により自動的に読み込まれます。

> 注意: 実運用では `.env` をコミットしないでください。CI ではシークレット管理機能を使ってください。

---

## クイックスタート

1. URL を元に記事を生成して Hatena に下書き投稿（`.env` を設定済み）

```bash
npm start -- --url "https://example.com/article" --hatena --hatena-title "記事タイトル" --hatena-tags "tag1,tag2"
```

2. キーワードから記事を生成して標準出力に表示

```bash
npm start -- --kw "フロントエンド,JavaScript"
```

3. カスタム Ollama endpoint を環境変数で上書き

```bash
OLLAMA_ENDPOINT="http://host:11434/api/generate" npm start -- --kw "例"
```

---

## CLI オプション

- `--url <URL>`: 指定ページの内容を抜粋して記事を生成します
- `--kw <keywords>`: カンマ区切りキーワードで記事を生成します
- `--model <model>`: 使用するモデル名（デフォルト: `llama3.2:latest`）
- `--hatena`: 生成した記事を Hatena Blog の下書きとして投稿します（AtomPub を利用）
- `--hatena-title <title>`: Hatena 投稿時に使うタイトル（未指定時は自動生成）
- `--hatena-tags "t1,t2"`: Hatena 投稿に付与するタグ

環境変数:

- `HATENA_USER`, `HATENA_BLOG_ID`, `HATENA_API_KEY` は Hatena 投稿に必要です（`--hatena` 時）
- `OLLAMA_ENDPOINT` は Ollama の HTTP API エンドポイント（省略時は `http://localhost:11434/api/generate`）

---

## ファイル構成（主要部分）

- `main.js` — エントリーポイント。CLI パースとワークフロー制御を行います。
- `lib/extract.js` — HTML から本文を抽出するユーティリティ
- `lib/prompt.js` — ブログ生成プロンプトとタイトル抽出
- `lib/ollama.js` — Ollama API 呼び出しをカプセル化
- `lib/hatena.js` — Hatena AtomPub (下書き投稿) を担当
- `.env.example` — 必要な環境変数のサンプル

---

## 開発・デバッグ

- 依存インストール: `npm install`
- スクリプト実行: `npm start -- --kw "キーワード"`
- `--hatena` を使う場合は `.env` を正しく設定してください。
- ローカルで Ollama を使う場合は Docker コンテナが `OLLAMA_ENDPOINT` で到達可能であることを確認してください（例: `localhost:11434` をポート公開）。

ログやエラーは標準出力/標準エラーに出ます。Hatena 投稿時のエラーではレスポンス本文も表示します。

---

## トラブルシューティング

- 「URL取得に失敗しました」: ネットワークや対象ページのアクセス制限を確認。
- 「Hatena 投稿に必要な環境変数が不足しています」: `.env` の設定を確認。
- Ollama のレスポンスが想定外の場合は `OLLAMA_ENDPOINT` とモデル名を確認。

---

## 貢献ガイド（簡易）

1. fork -> ブランチ作成 -> 変更 -> PR
2. 追加のユニットテストは歓迎です（今は簡易な構成のため、手動確認が主です）。

---

もし README に追記してほしい具体的な項目（例: CI 設定、テスト例、VSCode ワークスペース設定）があれば教えてください。

URL を元に記事を生成して Hatena に下書きとして投稿する例:

```bash
npm start -- --url "https://example.com/article" --hatena --hatena-title "記事タイトル" --hatena-tags "tag1,tag2"
```

キーワードから記事を生成する例:

```bash
npm start -- --kw "フロントエンド,JavaScript"
```

カスタム Ollama endpoint を使う場合は `.env` で `OLLAMA_ENDPOINT` を設定するか、環境変数で上書きしてください。

```bash
OLLAMA_ENDPOINT="http://localhost:11434/api/generate" npm start -- --kw "例"
```
