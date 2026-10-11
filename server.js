const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const port = Number(process.env.PORT || 3000);
const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

function safePath(requestUrl) {
  const decoded = decodeURIComponent(requestUrl.split('?')[0]);
  if (decoded === '/manus-routes.json') return path.join(root, 'public', 'manus-routes.json');
  const requested = decoded === '/' ? '/index.html' : decoded;
  const resolved = path.normalize(path.join(root, requested));
  return resolved.startsWith(root) ? resolved : null;
}

const server = http.createServer((req, res) => {
  const filePath = safePath(req.url || '/');
  if (!filePath) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Bad request');
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(error.code === 'ENOENT' ? 404 : 500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(error.code === 'ENOENT' ? 'Not found' : 'Server error');
      return;
    }

    const extension = path.extname(filePath);
    res.writeHead(200, {
      'Content-Type': mimeTypes[extension] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    res.end(content);
  });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`placementProof listening on 0.0.0.0:${port}`);
});
