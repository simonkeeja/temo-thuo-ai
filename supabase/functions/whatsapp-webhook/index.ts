// @ts-ignore — Deno header required for no-JWT deployment
// deno-lint-ignore-file no-explicit-any
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ── Constants ───────────────────────────────────────────────────
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const LLM_ENDPOINT =
  'https://app-e6n6zaspjytd-api-VaOwP8E7dJqa.gateway.appmedo.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse';

// System prompt for the agricultural assistant
const SYSTEM_PROMPT = `You are Temo, an AI agricultural assistant for Botswana's national livestock management platform (Temo-Thuo AI).
You help farmers with:
- Livestock health: symptoms, sick animal reporting, disease prevention
- Crop farming: planting tips, irrigation, fertiliser, pest control for Botswana conditions
- Animal registration: microchip IDs, ear tags, farmer codes
- Weather and climate advice for Botswana's districts
- Market prices, insurance, financial guidance for farmers
- Ministry of Agriculture regulations and compliance

Guidelines:
- Reply in plain text suitable for WhatsApp (no Markdown headers, use short paragraphs)
- Be concise — WhatsApp messages should be under 200 words unless the farmer asks for detail
- Use simple language; many farmers have limited formal education
- Include practical, actionable advice
- When you detect a sick animal report, always ask for the animal ID/ear tag and recommend urgent vet contact if the condition sounds serious
- Always sign off responses with "— Temo 🌿"
- Respond in the same language the farmer uses (English, Setswana, or mix)`;

// ── Intent detection ─────────────────────────────────────────────
function detectIntent(text: string): string {
  const t = text.toLowerCase();
  if (/sick|ill|disease|dying|not eating|lame|wound|infected|swollen/i.test(t)) return 'sick_animal';
  if (/weather|rain|drought|flood|temperature|forecast/i.test(t)) return 'weather';
  if (/price|market|sell|buy|cost|pula/i.test(t)) return 'market';
  if (/register|microchip|ear.?tag|animal.?id|livestock.?id/i.test(t)) return 'registration';
  if (/crop|plant|seed|harvest|irrigat|fertilis|pest|weed/i.test(t)) return 'crop_farming';
  if (/insur|claim|policy|premium/i.test(t)) return 'insurance';
  if (/balance|loan|credit|financ/i.test(t)) return 'financial';
  if (/hello|hi|help|start|menu|options/i.test(t)) return 'greeting';
  return 'general_query';
}

// ── Collect full LLM response from SSE stream ────────────────────
async function callLLM(
  apiKey: string,
  contents: Array<{ role: string; parts: Array<{ text: string }> }>
): Promise<string> {
  const res = await fetch(LLM_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Gateway-Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ contents }),
    signal: AbortSignal.timeout(55_000),
  });

  if (!res.ok || !res.body) {
    throw new Error(`LLM upstream error: ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.startsWith('data:')) continue;
      const dataStr = line.slice(5).trim();
      if (!dataStr || dataStr === '[DONE]') continue;
      try {
        const frame = JSON.parse(dataStr);
        const chunk = frame?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (chunk) fullText += chunk;
      } catch { /* incomplete frame */ }
    }
  }
  return fullText.trim();
}

// ── Main handler ─────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  const url = new URL(req.url);

  // ── WhatsApp webhook verification (GET) ──────────────────────
  // Meta sends an unauthenticated GET; check verify token directly from env
  if (req.method === 'GET') {
    const mode      = url.searchParams.get('hub.mode');
    const token     = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    const verifyToken = Deno.env.get('WHATSAPP_VERIFY_TOKEN') ?? 'temothuo_webhook_2026';

    // Allow if token matches OR if Authorization header has anon key (dev testing)
    const authHeader = req.headers.get('Authorization') ?? '';
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const isAuthed = authHeader === `Bearer ${anonKey}` || authHeader.startsWith('Bearer ey');

    if (mode === 'subscribe' && token === verifyToken && challenge) {
      console.log('WhatsApp webhook verified successfully');
      return new Response(challenge, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // Also handle direct verify_token check without hub.mode (some Meta flows)
    if (token === verifyToken && challenge) {
      return new Response(challenge, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    console.log(`Verification failed: mode=${mode}, token_match=${token === verifyToken}, has_challenge=${!!challenge}`);
    return new Response('Forbidden', { status: 403 });
  }

  // ── WhatsApp incoming message (POST) ────────────────────────
  if (req.method === 'POST') {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return new Response('Bad Request', { status: 400 });
    }

    // Extract message from WhatsApp Cloud API payload
    const entry   = body?.entry?.[0];
    const change  = entry?.changes?.[0];
    const value   = change?.value;
    const message = value?.messages?.[0];

    // Ignore status updates (no message object)
    if (!message) {
      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const fromPhone   = message.from;                         // E.164 sender
    const inboundText = message?.text?.body ?? '';
    const waMessageId = message.id;

    if (!fromPhone || !inboundText) {
      return new Response(JSON.stringify({ status: 'ignored' }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const apiKey          = Deno.env.get('INTEGRATIONS_API_KEY')!;
    const waToken         = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
    const waPhoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');

    // Admin Supabase client (service role bypasses RLS for session writes)
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // ── 1. Upsert session ──────────────────────────────────────
    let session: any;
    const { data: existing } = await admin
      .from('whatsapp_sessions')
      .select('*')
      .eq('phone_number', fromPhone)
      .maybeSingle();

    if (existing) {
      session = existing;
      await admin
        .from('whatsapp_sessions')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('id', existing.id);
    } else {
      // Try to match a known farmer by phone number
      const { data: profile } = await admin
        .from('profiles')
        .select('id, full_name, farmers(id)')
        .eq('phone', fromPhone)
        .maybeSingle();

      const { data: newSession } = await admin
        .from('whatsapp_sessions')
        .insert({
          phone_number: fromPhone,
          profile_id:   profile?.id ?? null,
          farmer_id:    (profile?.farmers as any)?.[0]?.id ?? null,
          display_name: profile?.full_name ?? null,
          state:        'idle',
          context_json: {},
        })
        .select()
        .single();
      session = newSession;
    }

    // ── 2. Save inbound message ────────────────────────────────
    const intent = detectIntent(inboundText);
    await admin.from('whatsapp_messages').insert({
      session_id:    session.id,
      direction:     'inbound',
      body:          inboundText,
      wa_message_id: waMessageId,
      intent,
      status:        'received',
    });

    // ── 3. Load recent conversation history (last 10 turns) ───
    const { data: history } = await admin
      .from('whatsapp_messages')
      .select('direction, body')
      .eq('session_id', session.id)
      .order('created_at', { ascending: false })
      .limit(20);

    // Build LLM contents array (chronological)
    const recentMessages = (history ?? []).reverse();
    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [
      // System context injected as first user turn
      {
        role: 'user',
        parts: [{ text: SYSTEM_PROMPT }],
      },
      {
        role: 'model',
        parts: [{ text: 'Understood. I am Temo, your agricultural assistant. How can I help you today?' }],
      },
      // Inject farmer context if known
      ...(session.display_name ? [{
        role: 'user' as const,
        parts: [{ text: `[Context: This farmer's name is ${session.display_name}]` }],
      }, {
        role: 'model' as const,
        parts: [{ text: `Got it, I'll address them as ${session.display_name}.` }],
      }] : []),
      // Recent conversation turns
      ...recentMessages.map((m: any) => ({
        role: m.direction === 'inbound' ? 'user' : 'model',
        parts: [{ text: m.body }],
      })),
    ];

    // ── 4. Call LLM ────────────────────────────────────────────
    let replyText: string;
    try {
      replyText = await callLLM(apiKey, contents);
      if (!replyText) replyText = 'Sorry, I could not generate a response. Please try again. — Temo 🌿';
    } catch (err: any) {
      console.error('LLM error:', err.message);
      replyText = 'I am currently experiencing technical difficulties. Please try again shortly. — Temo 🌿';
    }

    // ── 5. Save outbound message ───────────────────────────────
    await admin.from('whatsapp_messages').insert({
      session_id: session.id,
      direction:  'outbound',
      body:       replyText,
      intent,
      status:     'sent',
    });

    // ── 6. Send reply via WhatsApp Cloud API ───────────────────
    if (waToken && waPhoneNumberId) {
      try {
        const waRes = await fetch(
          `https://graph.facebook.com/v19.0/${waPhoneNumberId}/messages`,
          {
            method:  'POST',
            headers: {
              'Content-Type':  'application/json',
              'Authorization': `Bearer ${waToken}`,
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              to:                fromPhone,
              type:              'text',
              text:              { body: replyText },
            }),
          }
        );
        if (!waRes.ok) {
          const errBody = await waRes.text();
          console.error('WhatsApp send error:', waRes.status, errBody);
          // Update message status to failed
          await admin
            .from('whatsapp_messages')
            .update({ status: 'failed' })
            .eq('session_id', session.id)
            .eq('direction', 'outbound')
            .order('created_at', { ascending: false })
            .limit(1);
        }
      } catch (err: any) {
        console.error('WhatsApp API call failed:', err.message);
      }
    } else {
      console.warn('WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID not set — reply not sent to WhatsApp');
    }

    return new Response(JSON.stringify({ status: 'ok', reply: replyText }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  return new Response('Method Not Allowed', { status: 405 });
});
