
-- WhatsApp conversation sessions — one row per unique sender phone number
CREATE TABLE public.whatsapp_sessions (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_number    text NOT NULL UNIQUE,           -- sender's WhatsApp number (E.164)
  farmer_id       uuid REFERENCES public.farmers(id) ON DELETE SET NULL,
  profile_id      uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  display_name    text,
  state           text NOT NULL DEFAULT 'idle',   -- idle | awaiting_omang | awaiting_query | etc.
  context_json    jsonb NOT NULL DEFAULT '{}',    -- conversation context scratch-pad
  last_seen_at    timestamptz NOT NULL DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.whatsapp_sessions ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_wa_sessions_phone ON public.whatsapp_sessions(phone_number);
CREATE INDEX idx_wa_sessions_farmer ON public.whatsapp_sessions(farmer_id);

-- WhatsApp messages log — full conversation history
CREATE TABLE public.whatsapp_messages (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id      uuid NOT NULL REFERENCES public.whatsapp_sessions(id) ON DELETE CASCADE,
  direction       text NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  body            text NOT NULL,
  wa_message_id   text,                           -- WhatsApp cloud API message ID
  intent          text,                           -- detected intent label
  status          text NOT NULL DEFAULT 'received' CHECK (status IN ('received','sent','delivered','failed')),
  created_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_wa_messages_session ON public.whatsapp_messages(session_id);
CREATE INDEX idx_wa_messages_created ON public.whatsapp_messages(created_at DESC);

-- RLS: only admins and ops can read/write; service role used by edge function bypasses RLS
CREATE POLICY "Admin full access wa_sessions"
  ON public.whatsapp_sessions FOR ALL TO authenticated
  USING (get_user_role(auth.uid()) IN ('admin', 'operations_team', 'ministry_official'));

CREATE POLICY "Admin full access wa_messages"
  ON public.whatsapp_messages FOR ALL TO authenticated
  USING (
    get_user_role(auth.uid()) IN ('admin', 'operations_team', 'ministry_official')
  );

-- Farmers can view their own session
CREATE POLICY "Farmers view own wa_session"
  ON public.whatsapp_sessions FOR SELECT TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Farmers view own wa_messages"
  ON public.whatsapp_messages FOR SELECT TO authenticated
  USING (
    session_id IN (
      SELECT id FROM public.whatsapp_sessions WHERE profile_id = auth.uid()
    )
  );
