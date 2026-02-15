const axios = require("axios");

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
