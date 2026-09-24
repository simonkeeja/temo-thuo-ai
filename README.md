# 🌿 Temo-Thuo AI — Botswana National Livestock & Agriculture Management Platform

Temo-Thuo AI is a modern, full-stack agricultural intelligence platform built specifically for Botswana's farming ecosystem. It provides livestock registration with OCR ear-tag recognition, real-time veterinary health tracking, an AI-powered WhatsApp assistant for smallholder farmers (fluent in English & Setswana), disease outbreak monitoring, and ministry-level compliance management.

---

## 🚀 Key Features

- **Livestock Registration Wizard**: 3-step registration flow:
  1. Bio-Sentinel microchip entry
  2. OCR ear-tag photo scanning with auto-cropping and instant number recognition
  3. Animal details (breed, age, gender, location, brand)
- **WhatsApp Agricultural Assistant**:
  - Multi-language conversational AI (English & Setswana) powered by Google Gemini 2.5 Flash
  - 9 automated clinical intents (sick animal reporting, crop advice, market prices, weather alerts, etc.)
  - Real-time conversation tracking and admin monitoring dashboard (`/admin/whatsapp`)
- **Veterinary Health Records**:
  - Full clinical history, vaccination records, quarantine tracking, and withdrawal period monitoring
- **Disease Outbreak Tracking**:
  - Geospatial clustering of reported symptoms to give early warnings to Ministry officials
- **Role-Based Access Control**:
  - Granular permissions for Farmers, Extension Officers, Veterinarians, Inspectors, and Ministry Admins

---

## 🛠 Tech Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui, Lucide Icons, Sonner toasts
- **Backend**: Supabase (PostgreSQL 15, PostgREST, Row-Level Security, Storage, Realtime)
- **AI & Computer Vision**: Google Gemini 2.5 Flash LLM, OCR.space Engine
- **Messaging**: Meta WhatsApp Business Cloud API

---

## 📦 Getting Started Locally

### 1. Prerequisites
- Node.js (v18+)
- npm or pnpm

### 2. Clone and Install Dependencies
```bash
git clone https://github.com/YOUR_USERNAME/temo-thuo-ai.git
cd temo-thuo-ai
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your Supabase credentials:
```env
VITE_SUPABASE_URL=https://zybkhpxsvxllurktldjv.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_APP_ID=app-e6n6zaspjytd
```

### 4. Run Development Server
```bash
npm run dev
```
Open `http://localhost:50000` (or `http://localhost:5173`) in your browser.

### 5. Build for Production
```bash
npm run build
```
The compiled output is in the `dist/` directory.

---

## 🌐 Deployment Guide

### Deploying to Render (Free Static Site)

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "feat: complete Temo-Thuo AI platform"
   git push -u origin main
   ```

2. **Create New Static Site on Render**:
   - Go to [dashboard.render.com](https://dashboard.render.com/)
   - Click **New +** → **Static Site**
   - Connect your `temo-thuo-ai` GitHub repository

3. **Configure Build Settings**:
   - **Name**: `temo-thuo-ai`
   - **Branch**: `main`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

4. **Add Environment Variables**:
   - `VITE_SUPABASE_URL` = `https://zybkhpxsvxllurktldjv.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = *(your anon key)*
   - `VITE_APP_ID` = `app-e6n6zaspjytd`

5. **Configure SPA Rewrite (Crucial for React Router)**:
   - Go to **Redirects/Rewrites** in Render settings:
     - **Type**: `Rewrite`
     - **Source**: `/*`
     - **Destination**: `/index.html`

---

## 📱 WhatsApp Webhook Proxy (on Render)

If your Render backend (`syavi-central-server`) handles the webhook proxy:

```javascript
// Webhook Verification (GET)
app.get('/api/whatsapp-webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === 'temothuo_webhook_2026') {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// Inbound Message Ingestion (POST)
app.post('/api/whatsapp-webhook', async (req, res) => {
  res.sendStatus(200);
  try {
    await fetch('https://zybkhpxsvxllurktldjv.supabase.co/functions/v1/whatsapp-webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(req.body),
    });
  } catch (err) {
    console.error('Webhook error:', err);
  }
});
```

---

## 📄 License
Proprietary — Ministry of Agriculture / Temo-Thuo Initiative, Botswana.
