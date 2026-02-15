/**
 * モードと入力に基づいてLLM用のプロンプトを構築します。
 *
 * @param {Object} params - パラメータ。
 * @param {string} params.mode - 動作モード ('url', 'search', または 'kw')。
 * @param {string} params.input - 入力URLまたはキーワード。
 * @param {string} [params.excerpt] - 抽出されたテキストまたは検索結果。
 * @returns {string} 構築されたプロンプト文字列。
 */
function buildPrompt({ mode, input, excerpt }) {
  const common = `対象読者: システム開発者\n目的: 調査結果をまとめてブログとして公開したい\nトーン: 専門的\n\n構成: 1) イントロ、2) 特徴、3) 導入手順、4) まとめ\n出力形式: markdown形式で、適宜見出しやコードブロックを使用してわかりやすく説明してください。`;

  if (mode === "url") {
    return `以下のウェブページの内容を参考に、日本語のブログ記事を書いてください。\nURL: ${input}\n\n== ページ内容（抜粋）==\n${excerpt}\n\n${common}`;
  }

  if (mode === "search") {
    return `以下のキーワードに関する検索結果を参考に、日本語のブログ記事を書いてください。\nキーワード: ${input}\n\n== 検索結果（抜粋）==\n${excerpt}\n\n${common}`;
  }

  return `以下のキーワードを基に、日本語のブログ記事を書いてください。\nキーワード: ${input}\n\n${common}`;
}

/**
 * 生成された記事テキストからタイトルを生成します。
 * タイトルらしい最初の行を探すか、テキストを切り詰めます。
 *
 * @param {string} text - 生成された記事テキスト。
 * @returns {string} 生成されたタイトル。
 */
function generateTitleFromText(text) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  for (const l of lines) {
    if (l.length > 10 && l.length < 120)
      return l.replace(/^#\s*/, "").slice(0, 120);
  }
  return text.replace(/\s+/g, " ").slice(0, 60) + "...";
}

module.exports = { buildPrompt, generateTitleFromText };
