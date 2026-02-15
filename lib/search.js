const axios = require("axios");

/**
 * 指定されたクエリでSearXNGを検索します。
 *
 * @param {string} query - 検索クエリ。
 * @param {number} [limit=5] - 返却する結果の最大数。
 * @returns {Promise<Array<Object>>} 検索結果のリスト。
 */
async function searchSearXNG(query, limit = 5) {
  const endpoint = process.env.SEARXNG_ENDPOINT || "http://localhost:18080";
  const url = `${endpoint}/search`;
  try {
    const res = await axios.get(url, {
      params: {
        q: query,
        format: "json",
        language: "ja",
      },
    });
    if (res.data && res.data.results) {
      return res.data.results.slice(0, limit);
    }
    return [];
  } catch (e) {
    console.error("SearXNG search failed:", e.message);
    return [];
  }
}

module.exports = { searchSearXNG };
