// Usage:
//  npm start -- --url https://example.com/article
//  npm start -- --kw "キーワード1, キーワード2"

// Load environment variables from .env when present
require("dotenv").config();

const axios = require("axios");
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");

const { extractTextFromHtml } = require("./lib/extract");
const { buildPrompt, generateTitleFromText } = require("./lib/prompt");
const { callOllama } = require("./lib/ollama");
const { postDraftToHatena } = require("./lib/hatena");
const { searchSearXNG } = require("./lib/search");

function buildPrompt({ mode, input, excerpt }) {
  const common = `対象読者: フロントエンド開発者\n目的: ツールの特徴・導入メリット・簡単な使い方を説明する\nトーン: フレンドリーかつ専門的\n長さ: 800〜1200字\n構成: 1) イントロ、2) 特徴、3) 導入手順、4) まとめ\n出力形式: 見出し付きの日本語記事`;

  if (mode === "url") {
    return `以下のウェブページの内容を参考に、日本語のブログ記事を書いてください。\nURL: ${input}\n\n== ページ内容（抜粋）==\n${excerpt}\n\n${common}`;
  }

  if (mode === "search") {
    return `以下のキーワードに関する検索結果を参考に、日本語のブログ記事を書いてください。\nキーワード: ${input}\n\n== 検索結果（抜粋）==\n${excerpt}\n\n${common}`;
  }

  return `以下のキーワードを基に、日本語のブログ記事を書いてください。\nキーワード: ${input}\n\n${common}`;
}

async function callOllama(body) {
  const url =
    process.env.OLLAMA_ENDPOINT || "http://localhost:11434/api/generate";
  return axios.post(url, body, {
    headers: { "Content-Type": "application/json" },
    responseType: "text",
  });
}

async function main() {
  const argv = yargs(hideBin(process.argv))
    .option("url", {
      type: "string",
      description: "Source URL to base the article on",
    })
    .option("kw", { type: "string", description: "Comma-separated keywords" })
    .option("hatena", {
      type: "boolean",
      description: "Post generated article as draft to Hatena Blog",
    })
    .option("hatena-title", {
      type: "string",
      description: "Title to use when posting to Hatena",
    })
    .option("hatena-tags", {
      type: "string",
      description: "Comma-separated tags for Hatena",
    })
    .option("model", {
      type: "string",
      description: "Model name",
      default: "llama3.2:latest",
    })
    .help().argv;

  let mode = null;
  let input = null;
  if (argv.url) {
    mode = "url";
    input = argv.url;
  } else if (argv.kw) {
    mode = "kw";
    input = argv.kw;
  } else {
    console.error("URLまたはキーワードを指定してください。");
    process.exit(1);
  }

  let excerpt = "";
  if (mode === "url") {
    try {
      const res = await axios.get(input, { responseType: "text" });
      excerpt = await extractTextFromHtml(res.data, 3000);
    } catch (e) {
      console.error("URL取得に失敗しました:", e.message);
      process.exit(1);
    }
  } else if (mode === "kw") {
    console.log(`SearXNGで検索中: ${input}`);
    try {
      const results = await searchSearXNG(input, 5);
      if (results.length > 0) {
        const contents = [];
        for (const res of results) {
          if (!res.url) continue;
          try {
            console.log(`Fetching: ${res.url}`);
            contents.push(
              `Title: ${res.title}\nURL: ${res.url}\nContent: ${res.content || ""}`,
            );
          } catch (e) {
            console.warn(`Failed to fetch ${res.url}: ${e.message}`);
          }
        }
        if (contents.length > 0) {
          excerpt = contents.join("\n\n---\n\n");
          mode = "search";
        }
      }
    } catch (e) {
      console.error("Search failed:", e.message);
    }
  }

  const prompt = buildPrompt({ mode, input, excerpt });
  const body = { model: argv.model, prompt, max_tokens: 1200 };

  try {
    const res = await callOllama(body);
    // axios with responseType text returns data as string
    const article = res.data;
    console.log(article);

    if (argv.hatena) {
      // Post as draft to Hatena Blog
      const hatenaUser = process.env.HATENA_USER;
      const hatenaBlog = process.env.HATENA_BLOG_ID;
      const hatenaApiKey = process.env.HATENA_API_KEY;
      if (!hatenaUser || !hatenaBlog || !hatenaApiKey) {
        console.error(
          "Hatena 投稿に必要な環境変数が不足しています。HATENA_USER, HATENA_BLOG_ID, HATENA_API_KEY を設定してください。",
        );
        process.exit(1);
      }

      const title = argv["hatena-title"] || generateTitleFromText(article);
      const tags = (argv["hatena-tags"] || "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      try {
        await postDraftToHatena({
          user: hatenaUser,
          blog: hatenaBlog,
          apiKey: hatenaApiKey,
          title,
          content: article,
          tags,
        });
        console.log("Hatena 下書きを投稿しました。");
      } catch (e) {
        console.error("Hatena 投稿に失敗しました:", e.message || e);
        if (e.response && e.response.data) console.error(e.response.data);
        process.exit(1);
      }
    }
  } catch (e) {
    if (e.response && e.response.data)
      console.error("APIエラー:", e.response.data);
    else console.error("API呼び出しに失敗しました:", e.message);
    process.exit(1);
  }
}

main();

function generateTitleFromText(text) {
  // Try to find a heading-like line
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  for (const l of lines) {
    if (l.length > 10 && l.length < 120)
      return l.replace(/^#\s*/, "").slice(0, 120);
  }
  // fallback: first 60 chars
  return text.replace(/\s+/g, " ").slice(0, 60) + "...";
}

async function postDraftToHatena({
  user,
  blog,
  apiKey,
  title,
  content,
  tags = [],
}) {
  const endpoint = `https://blog.hatena.ne.jp/${encodeURIComponent(user)}/${encodeURIComponent(blog)}/atom/entry`;
  // Build Atom entry XML
  const categories = tags
    .map((t) => `<category term="${escapeXml(t)}" />`)
    .join("");
  const xml =
    `<?xml version="1.0" encoding="utf-8"?>\n` +
    `<entry xmlns="http://www.w3.org/2005/Atom" xmlns:app="http://www.w3.org/2007/app">\n` +
    `<title>${escapeXml(title)}</title>\n` +
    `<content type="text/html">${escapeXml(content)}</content>\n` +
    `${categories}\n` +
    `<app:control><app:draft>yes</app:draft></app:control>\n` +
    `</entry>`;

  return axios.post(endpoint, xml, {
    auth: { username: user, password: apiKey },
    headers: { "Content-Type": "application/atom+xml; charset=utf-8" },
  });
}

function escapeXml(unsafe) {
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
