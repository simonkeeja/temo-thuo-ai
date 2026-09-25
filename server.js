import express from 'express';
import fetch from 'node-fetch';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'temothuo_webhook_2026';
const SUPABASE_FUNCTION_URL = 'https://zybkhpxsvxllurktldjv.supabase.co/functions/v1/whatsapp-webhook';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5YmtocHhzdnhsbHVya3RsZGp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1MjEwOTYsImV4cCI6MjEwNDA5NzA5Nn0.M1jSVHhof9E1pC4JMlWxkx3xAn2wwRcR0Z1yY1Onu_Y';

// Health check
app.get('/', (req, res) =&gt; {
  res.send('🌿 Temo-Thuo AI WhatsApp Gateway is running!');
});

// 1. Meta Webhook Verification Handshake (GET)
app.get('/webhook', (req, res) =&gt; {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('[Temo-Thuo] Meta verification passed!');
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// 2. Incoming Messages from WhatsApp (POST)
app.post('/webhook', async (req, res) =&gt; {
  res.status(200).send('EVENT_RECEIVED');

  try {
    await fetch(SUPABASE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(req.body),
    });
  } catch (err) {
    console.error('Forwarding error:', err);
  }
});

app.listen(PORT, () =&gt; {
  console.log(`Temo-Thuo Webhook Gateway listening on port ${PORT}`);
});