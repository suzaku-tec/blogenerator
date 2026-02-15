const axios = require('axios');

function escapeXml(unsafe){
  return String(unsafe)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&apos;');
}

async function postDraftToHatena({user, blog, apiKey, title, content, tags=[]}){
  const endpoint = `https://blog.hatena.ne.jp/${encodeURIComponent(user)}/${encodeURIComponent(blog)}/atom/entry`;
  const categories = tags.map(t=>`<category term="${escapeXml(t)}" />`).join('');
  const xml = `<?xml version="1.0" encoding="utf-8"?>\n`+
    `<entry xmlns="http://www.w3.org/2005/Atom" xmlns:app="http://www.w3.org/2007/app">\n`+
    `<title>${escapeXml(title)}</title>\n`+
    `<content type="text/html">${escapeXml(content)}</content>\n`+
    `${categories}\n`+
    `<app:control><app:draft>yes</app:draft></app:control>\n`+
    `</entry>`;

  return axios.post(endpoint, xml, {
    auth: { username: user, password: apiKey },
    headers: { 'Content-Type': 'application/atom+xml; charset=utf-8' },
  });
}

module.exports = { postDraftToHatena, escapeXml };
