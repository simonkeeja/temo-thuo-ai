import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OCR_ENDPOINT = 'https://app-e6n6zaspjytd-api-W9z3M6eONl3L.gateway.appmedo.com/parse/image';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...CORS, 'Content-Type': 'application/json' } });
  }

  try {
    const apiKey = Deno.env.get('INTEGRATIONS_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Server configuration error' }), { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    const body = await req.json();
    const { imageUrl, base64Image } = body;

    if (!imageUrl && !base64Image) {
      return new Response(JSON.stringify({ error: 'Provide imageUrl or base64Image' }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    // Build multipart form for OCR API
    const form = new FormData();
    if (imageUrl)    form.append('url', imageUrl);
    if (base64Image) form.append('base64Image', base64Image);
    form.append('language', 'eng');
    form.append('OCREngine', '2');   // Engine 2: better for short alphanumeric strings like ear-tag numbers
    form.append('scale', 'true');    // Upscale small images for better accuracy
    form.append('detectOrientation', 'true');

    const upstream = await fetch(OCR_ENDPOINT, {
      method: 'POST',
      headers: { 'X-Gateway-Authorization': apiKey },
      body: form,
    });

    // Forward quota/balance errors verbatim
    if (upstream.status === 429 || upstream.status === 402) {
      const errText = await upstream.text();
      return new Response(errText, { status: upstream.status, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }
    if (!upstream.ok) {
      return new Response(JSON.stringify({ error: `OCR upstream error: ${upstream.status}` }), { status: 502, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    const data = await upstream.json();

    // Extract and clean the ear-tag number from parsed text
    const rawText: string = data?.ParsedResults?.[0]?.ParsedText ?? '';
    const isError = data?.IsErroredOnProcessing === true;
    const exitCode: number = data?.OCRExitCode ?? 3;

    // Extract alphanumeric tokens that look like ear-tag numbers
    // Ear tags in Botswana are typically format: letters + digits, e.g. BTW001234, BW-1234, etc.
    const tokens = rawText
      .split(/\s+/)
      .map(t => t.replace(/[^A-Z0-9\-]/gi, '').toUpperCase())
      .filter(t => t.length >= 3 && t.length <= 20);

    const extractedTag = tokens.length > 0 ? tokens[0] : null;

    return new Response(JSON.stringify({
      success: !isError && exitCode <= 2,
      rawText: rawText.trim(),
      extractedTag,
      exitCode,
    }), { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message ?? 'Internal error' }), { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } });
  }
});
