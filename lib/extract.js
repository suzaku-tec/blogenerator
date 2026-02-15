const cheerio = require('cheerio');

async function extractTextFromHtml(html, maxChars = 3000) {
  const $ = cheerio.load(html);
  const selectors = ['article', 'main', 'body'];
  let text = '';
  for (const sel of selectors) {
    const el = $(sel);
    if (el && el.text().trim().length > 200) {
      text = el.text();
      break;
    }
  }
  if (!text) text = $('body').text() || html.replace(/<[^>]+>/g, ' ');
  return text.replace(/\s+/g, ' ').trim().slice(0, maxChars);
}

module.exports = { extractTextFromHtml };
