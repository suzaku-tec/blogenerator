const { Ollama } = require("ollama");

/**
 * Ollama APIを呼び出してテキストを生成します。
 *
 * @param {Object} body - リクエストボディ。
 * @param {string} body.model - モデル名。
 * @param {string} body.prompt - プロンプトテキスト。
 * @param {number} [body.max_tokens] - 生成する最大トークン数。
 * @returns {Promise<Object>} Ollamaレスポンスオブジェクト。
 */
async function callOllama(body) {
  let host = process.env.OLLAMA_ENDPOINT || "http://localhost:11434";
  host = host.replace(/\/api\/generate\/?$/, "");
  const ollama = new Ollama({ host });
  return ollama.generate({
    model: body.model,
    prompt: body.prompt,
    stream: false,
    options: { num_predict: body.max_tokens },
  });
}

module.exports = { callOllama };
