const cheerio = require("cheerio");

/**
 * HTML文字列からテキストコンテンツを抽出します。
 * 'article', 'main', 'body' タグを優先的に処理します。
 *
 * @param {string} html - HTMLコンテンツ。
 * @param {number} [maxChars=3000] - 返却する最大文字数。
 * @returns {Promise<string>} 抽出されたテキスト。
 */
async function extractTextFromHtml(html, maxChars = 3000) {
  const $ = cheerio.load(html);
  const selectors = ["article", "main", "body"];
  let text = "";
  for (const sel of selectors) {
    const el = $(sel);
    if (el && el.text().trim().length > 200) {
      text = el.text();
      break;
    }
  }
  if (!text) text = $("body").text() || html.replace(/<[^>]+>/g, " ");
  return text.replace(/\s+/g, " ").trim().slice(0, maxChars);
}

module.exports = { extractTextFromHtml };
