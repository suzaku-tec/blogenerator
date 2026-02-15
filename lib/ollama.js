const axios = require('axios');

async function callOllama(body){
  const url = process.env.OLLAMA_ENDPOINT || 'http://localhost:11434/api/generate';
  return axios.post(url, body, { headers: { 'Content-Type': 'application/json' }, responseType: 'text' });
}

module.exports = { callOllama };
