// deno-lint-ignore-file no-explicit-any
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const LLM_ENDPOINT =
  'https://app-e6n6zaspjytd-api-VaOwP8E7dJqa.gateway.appmedo.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse';

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
- When you detect a sick animal report, always ask for the animal ID/ear tag and recommend urgent vet contact if serious
- Always sign off responses with "— Temo 🌿"
- Respond in the same language the farmer uses (English, Setswana, or mix)`;

function detectIntent(text: string): string {
  if (/sick|ill|disease|dying|not eating|lame|wound|infected|swollen/i.test(text)) return 'sick_animal';
  if (/weather|rain|drought|flood|temperature|forecast/i.test(text)) return 'weather';
  if (/price|market|sell|buy|cost|pula/i.test(text)) return 'market';
  if (/register|microchip|ear.?tag|animal.?id|livestock.?id/i.test(text)) return 'registration';
  if (/crop|plant|seed|harvest|irrigat|fertilis|pest|weed/i.test(text)) return 'crop_farming';
  if (/insur|claim|policy|premium/i.test(text)) return 'insurance';
  if (/balance|loan|credit|financ/i.test(text)) return 'financial';
  if (/hello|hi|help|start|menu|options/i.test(text)) return 'greeting';
  return 'general_query';
}

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
  if (!res.ok || !res.body) throw new Error(`LLM error: ${res.status}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '', fullText = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.startsWith('data:')) continue;
      const d = line.slice(5).trim();
      if (!d || d === '[DONE]') continue;
      try {
        const chunk = JSON.parse(d)?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (chunk) fullText += chunk;
      } catch { /* skip */ }
    }
  }
  return fullText.trim();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  const url = new URL(req.url);

  // ── GET: Meta webhook verification handshake ─────────────────
  if (req.method === 'GET') {
    const mode      = url.searchParams.get('hub.mode');
    const token     = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    const VERIFY_TOKEN = 'temothuo_webhook_2026';

    console.log(`[wa-hook] GET verify: mode=${mode} token_match=${token === VERIFY_TOKEN} has_challenge=${!!challenge}`);

    if (challenge && token === VERIFY_TOKEN) {
      // Return plain challenge string — exactly what Meta requires
      return new Response(challenge, {
        status: 200,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }
    return new Response('Forbidden', { status: 403 });
  }

  // ── POST: incoming WhatsApp message ──────────────────────────
  if (req.method === 'POST') {
    let body: any;
    try { body = await req.json(); }
    catch { return new Response('Bad Request', { status: 400 }); }

    const message = body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!message) {
      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const fromPhone   = message.from as string;
    const inboundText = (message?.text?.body ?? '') as string;
    const waMessageId = message.id as string;

    if (!fromPhone || !inboundText) {
      return new Response(JSON.stringify({ status: 'ignored' }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const apiKey          = Deno.env.get('INTEGRATIONS_API_KEY')!;
    const waToken         = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
    const waPhoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Upsert session
    let session: any;
    const { data: existing } = await admin
      .from('whatsapp_sessions').select('*').eq('phone_number', fromPhone).maybeSingle();

    if (existing) {
      session = existing;
      await admin.from('whatsapp_sessions')
        .update({ last_seen_at: new Date().toISOString() }).eq('id', existing.id);
    } else {
      const { data: profile } = await admin.from('profiles')
        .select('id, full_name, farmers(id)').eq('phone', fromPhone).maybeSingle();
      const { data: ns } = await admin.from('whatsapp_sessions').insert({
        phone_number: fromPhone,
        profile_id:   profile?.id ?? null,
        farmer_id:    (profile?.farmers as any)?.[0]?.id ?? null,
        display_name: profile?.full_name ?? null,
        state: 'idle', context_json: {},
      }).select().single();
      session = ns;
    }

    // Save inbound
    const intent = detectIntent(inboundText);
    await admin.from('whatsapp_messages').insert({
      session_id: session.id, direction: 'inbound',
      body: inboundText, wa_message_id: waMessageId, intent, status: 'received',
    });

    // Load history
    const { data: history } = await admin.from('whatsapp_messages')
      .select('direction, body').eq('session_id', session.id)
      .order('created_at', { ascending: false }).limit(20);

    const contents = [
      { role: 'user',  parts: [{ text: SYSTEM_PROMPT }] },
      { role: 'model', parts: [{ text: 'Understood. I am Temo, your agricultural assistant. How can I help you today?' }] },
      ...(session.display_name ? [
        { role: 'user'  as const, parts: [{ text: `[Context: Farmer's name is ${session.display_name}]` }] },
        { role: 'model' as const, parts: [{ text: `Got it, I'll address them as ${session.display_name}.` }] },
      ] : []),
      ...((history ?? []).reverse().map((m: any) => ({
        role: m.direction === 'inbound' ? 'user' : 'model',
        parts: [{ text: m.body }],
      }))),
    ];

    // Call LLM
    let replyText: string;
    try {
      replyText = await callLLM(apiKey, contents);
      if (!replyText) replyText = 'Sorry, I could not generate a response. Please try again. — Temo 🌿';
    } catch (err: any) {
      console.error('[wa-hook] LLM error:', err.message);
      replyText = 'I am experiencing technical difficulties. Please try again shortly. — Temo 🌿';
    }

    // Save outbound
    await admin.from('whatsapp_messages').insert({
      session_id: session.id, direction: 'outbound',
      body: replyText, intent, status: 'sent',
    });

    // Send via WhatsApp Cloud API
    if (waToken && waPhoneNumberId) {
      try {
        const waRes = await fetch(
          `https://graph.facebook.com/v19.0/${waPhoneNumberId}/messages`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${waToken}` },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              to: fromPhone, type: 'text', text: { body: replyText },
            }),
          }
        );
        if (!waRes.ok) console.error('[wa-hook] WA send error:', waRes.status, await waRes.text());
      } catch (err: any) {
        console.error('[wa-hook] WA API failed:', err.message);
      }
    }

    return new Response(JSON.stringify({ status: 'ok' }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  return new Response('Method Not Allowed', { status: 405 });
});
