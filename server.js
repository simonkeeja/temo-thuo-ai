/**
 * Temo-Thuo AI — Native Zero-Dependency Webhook Gateway
 */
import http from 'node:http';

const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'temothuo_webhook_2026';
const SUPABASE_URL = 'https://zybkhpxsvxllurktldjv.supabase.co/functions/v1/whatsapp-webhook';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5YmtocHhzdnhsbHVya3RsZGp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1MjEwOTYsImV4cCI6MjEwNDA5NzA5Nn0.M1jSVHhof9E1pC4JMlWxkx3xAn2wwRcR0Z1yY1Onu_Y';

const server = http.createServer(async (req, res) =&gt; {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // Health check
  if (req.method === 'GET' && pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('🌿 Temo-Thuo AI WhatsApp Webhook Gateway is running!');
  }

  // 1. Meta Webhook Verification Handshake (GET /webhook)
  if (req.method === 'GET' && pathname === '/webhook') {
    const mode = parsedUrl.searchParams.get('hub.mode');
    const token = parsedUrl.searchParams.get('hub.verify_token');
    const challenge = parsedUrl.searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('[Temo-Thuo] Meta verification successful!');
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end(challenge);
    }

    console.warn('[Temo-Thuo] Verification failed. Token mismatch.');
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('Forbidden');
  }

  // 2. Inbound Messages from WhatsApp (POST /webhook)
  if (req.method === 'POST' && pathname === '/webhook') {
    let body = '';
    req.on('data', chunk =&gt; { body += chunk; });
    req.on('end', async () =&gt; {
      // Respond to Meta immediately with 200 OK
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('EVENT_RECEIVED');

      try {
        const payload = JSON.parse(body);
        const forwardRes = await fetch(SUPABASE_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_KEY}`,
          },
          body: JSON.stringify(payload),
        });
        const result = await forwardRes.text();
        console.log('[Temo-Thuo] Forwarded to Supabase successfully:', result);
      } catch (err) {
        console.error('[Temo-Thuo] Error forwarding payload:', err);
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, () =&gt; {
  console.log(`🌿 Temo-Thuo AI Webhook Gateway listening on port ${PORT}`);
});