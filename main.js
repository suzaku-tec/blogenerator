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
  const body = { model: argv.model, prompt, max_tokens: 8192 };

  try {
    const res = await callOllama(body);
    console.log("Ollama response received.");
    const article = res.response;

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
