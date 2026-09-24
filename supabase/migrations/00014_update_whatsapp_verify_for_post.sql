DROP FUNCTION IF EXISTS public.whatsapp_verify(text, text, text);

CREATE OR REPLACE FUNCTION public.whatsapp_verify(
  p_mode       text DEFAULT NULL,
  p_token      text DEFAULT NULL,
  p_challenge  text DEFAULT NULL,
  object       text DEFAULT NULL,
  entry        jsonb DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_payload jsonb;
  v_anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5YmtocHhzdnhsbHVya3RsZGp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1MjEwOTYsImV4cCI6MjEwNDA5NzA5Nn0.M1jSVHhof9E1pC4JMlWxkx3xAn2wwRcR0Z1yY1Onu_Y';
BEGIN
  -- 1. Verification Handshake (GET from Meta)
  IF p_challenge IS NOT NULL AND (p_token = 'temothuo_webhook_2026' OR p_token IS NULL) THEN
    RETURN p_challenge;
  END IF;

  -- 2. Message Event (POST from Meta)
  IF entry IS NOT NULL THEN
    v_payload := jsonb_build_object(
      'object', COALESCE(object, 'whatsapp_business_account'),
      'entry', entry
    );

    PERFORM net.http_post(
      url := 'https://zybkhpxsvxllurktldjv.supabase.co/functions/v1/whatsapp-webhook',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_anon_key
      ),
      body := v_payload
    );

    RETURN 'EVENT_RECEIVED';
  END IF;

  RETURN 'OK';
END;
$$;

GRANT EXECUTE ON FUNCTION public.whatsapp_verify(text, text, text, text, jsonb) TO anon, authenticated;
