const { Ollama } = require("ollama");

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
