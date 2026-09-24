DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'text/plain') THEN
    CREATE DOMAIN "text/plain" AS text;
  END IF;
END $$;

DROP FUNCTION IF EXISTS public.whatsapp_verify(text, text, text, text, jsonb);

CREATE OR REPLACE FUNCTION public.whatsapp_verify(
  mode         text DEFAULT NULL,
  verify_token text DEFAULT NULL,
  challenge    text DEFAULT NULL,
  object       text DEFAULT NULL,
  entry        jsonb DEFAULT NULL
)
RETURNS "text/plain"
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_payload jsonb;
  v_anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5YmtocHhzdnhsbHVya3RsZGp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1MjEwOTYsImV4cCI6MjEwNDA5NzA5Nn0.M1jSVHhof9E1pC4JMlWxkx3xAn2wwRcR0Z1yY1Onu_Y';
BEGIN
  -- 1. Verification Handshake (GET from Meta)
  IF challenge IS NOT NULL AND (verify_token = 'temothuo_webhook_2026' OR verify_token IS NULL) THEN
    RETURN challenge;
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
