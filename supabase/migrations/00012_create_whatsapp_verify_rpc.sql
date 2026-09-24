
-- Public RPC that handles Meta's webhook verification GET handshake.
-- Meta sends: hub.mode=subscribe, hub.verify_token, hub.challenge
-- We check the token and echo back hub.challenge as plain text.
-- Callable by the anon role (no JWT needed via PostgREST /rpc/).

CREATE OR REPLACE FUNCTION public.whatsapp_verify(
  p_mode       text,
  p_token      text,
  p_challenge  text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_token = 'temothuo_webhook_2026' AND p_challenge IS NOT NULL THEN
    RETURN p_challenge;
  END IF;
  RETURN NULL;
END;
$$;

-- Grant anon role execute access so it works without Authorization header
GRANT EXECUTE ON FUNCTION public.whatsapp_verify(text, text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.whatsapp_verify(text, text, text) TO authenticated;
