import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

var PORT = process.env.PORT || 3000;
var VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'temothuo_webhook_2026';
var SUPABASE_URL = 'https://zybkhpxsvxllurktldjv.supabase.co/functions/v1/whatsapp-webhook';
var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5YmtocHhzdnhsbHVya3RsZGp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1MjEwOTYsImV4cCI6MjEwNDA5NzA5Nn0.M1jSVHhof9E1pC4JMlWxkx3xAn2wwRcR0Z1yY1Onu_Y';

var DIST_DIR = path.resolve(process.cwd(), 'dist');

var MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

function serveStatic(res, filePath) {
  fs.readFile(filePath, function(err, data) {
    if (err) {
      // Fallback to index.html for React SPA client-side routes
      var indexPath = path.join(DIST_DIR, 'index.html');
      fs.readFile(indexPath, function(err2, indexData) {
        if (err2) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Not Found');
          return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(indexData);
      });
      return;
    }

    var ext = path.extname(filePath).toLowerCase();
    var contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

var server = http.createServer(function(req, res) {
  var host = req.headers.host || 'localhost';
  var parsedUrl = new URL(req.url, 'http://' + host);
  var pathname = parsedUrl.pathname;

  // 1. Meta Webhook Verification Handshake (GET /webhook)
  if (req.method === 'GET') {
    if (pathname === '/webhook') {
      var mode = parsedUrl.searchParams.get('hub.mode');
      var token = parsedUrl.searchParams.get('hub.verify_token');
      var challenge = parsedUrl.searchParams.get('hub.challenge');

      if (mode === 'subscribe') {
        if (token === VERIFY_TOKEN) {
          console.log('[Temo-Thuo] Meta verification successful!');
          res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end(challenge);
          return;
        }
      }

      console.warn('[Temo-Thuo] Verification failed. Token mismatch.');
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('Forbidden');
      return;
    }
  }

  // 2. Inbound Messages from WhatsApp (POST /webhook)
  if (req.method === 'POST') {
    if (pathname === '/webhook') {
      var body = '';
      req.on('data', function(chunk) {
        body += chunk;
      });

      req.on('end', function() {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('EVENT_RECEIVED');

        try {
          var payload = JSON.parse(body);
          fetch(SUPABASE_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + SUPABASE_KEY
            },
            body: JSON.stringify(payload)
          }).then(function(forwardRes) {
            return forwardRes.text();
          }).then(function(result) {
            console.log('[Temo-Thuo] Forwarded to Supabase:', result);
          }).catch(function(err) {
            console.error('[Temo-Thuo] Error forwarding payload:', err);
          });
        } catch (err) {
          console.error('[Temo-Thuo] Parse error:', err);
        }
      });
      return;
    }
  }

  // 3. Serve Frontend Web Dashboard (HTML/CSS/JS)
  if (req.method === 'GET') {
    var safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
    var localPath = path.join(DIST_DIR, safePath);

    fs.stat(localPath, function(err, stats) {
      if (stats && stats.isFile()) {
        serveStatic(res, localPath);
      } else {
        serveStatic(res, path.join(DIST_DIR, 'index.html'));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, function() {
  console.log('Temo-Thuo Full-Stack Web + Webhook listening on port ' + PORT);
});
