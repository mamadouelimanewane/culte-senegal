const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const PORT = process.env.PORT || 3031;
const ROOT = __dirname;

const MIME = {
  '.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8',
  '.js':'application/javascript; charset=utf-8','.json':'application/json; charset=utf-8',
  '.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg',
  '.svg':'image/svg+xml','.ico':'image/x-icon','.woff2':'font/woff2',
  '.webp':'image/webp','.webmanifest':'application/manifest+json',
};

// Extensions compressibles (texte)
const COMPRESSIBLE = new Set(['.html','.css','.js','.json','.svg','.webmanifest']);

// Cache statique longue durée pour assets immutables
const LONG_CACHE = new Set(['.css','.js','.png','.jpg','.jpeg','.svg','.woff2','.webp','.ico']);

// ETag simple basé sur mtime + taille
function etag(stat) { return `"${stat.mtimeMs.toString(36)}-${stat.size.toString(36)}"`; }

http.createServer((req, res) => {
  // Sécurité : bloquer path traversal
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath.includes('..')) { res.writeHead(403); res.end('Forbidden'); return; }

  let fp = path.join(ROOT, urlPath);
  if (fp.endsWith('/') || fp.endsWith(path.sep)) fp = path.join(fp, 'index.html');

  fs.stat(fp, (err, stat) => {
    if (err || !stat.isFile()) { res.writeHead(404); res.end('Not found'); return; }

    const ext = path.extname(fp).toLowerCase();
    const contentType = MIME[ext] || 'application/octet-stream';
    const tag = etag(stat);

    // 304 Not Modified
    if (req.headers['if-none-match'] === tag) {
      res.writeHead(304);
      res.end();
      return;
    }

    const headers = {
      'Content-Type': contentType,
      'ETag': tag,
      'Vary': 'Accept-Encoding',
      'X-Content-Type-Options': 'nosniff',
    };

    // Cache headers
    if (LONG_CACHE.has(ext)) {
      headers['Cache-Control'] = 'public, max-age=604800, stale-while-revalidate=86400';
    } else {
      headers['Cache-Control'] = 'public, max-age=0, must-revalidate';
    }

    // Security headers pour HTML
    if (ext === '.html') {
      headers['X-Frame-Options'] = 'SAMEORIGIN';
      headers['Referrer-Policy'] = 'strict-origin-when-cross-origin';
    }

    // Compression gzip si supportée
    const acceptEncoding = req.headers['accept-encoding'] || '';
    if (COMPRESSIBLE.has(ext) && stat.size > 1024 && acceptEncoding.includes('gzip')) {
      headers['Content-Encoding'] = 'gzip';
      res.writeHead(200, headers);
      fs.createReadStream(fp).pipe(zlib.createGzip({ level: 6 })).pipe(res);
    } else {
      headers['Content-Length'] = stat.size;
      res.writeHead(200, headers);
      fs.createReadStream(fp).pipe(res);
    }
  });
}).listen(PORT, () => console.log(`Serving on http://localhost:${PORT} (gzip enabled)`));
