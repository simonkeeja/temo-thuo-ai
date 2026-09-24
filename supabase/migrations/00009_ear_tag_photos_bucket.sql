
-- Create storage bucket for ear-tag photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ear-tag-photos',
  'ear-tag-photos',
  true,
  5242880, -- 5 MB (pre-compression; validated on frontend)
  ARRAY['image/jpeg','image/png','image/webp','image/avif']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to their own path
CREATE POLICY "Authenticated users can upload ear tag photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'ear-tag-photos');

-- Public read for all ear-tag photos
CREATE POLICY "Public read ear tag photos"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'ear-tag-photos');

-- Allow authenticated users to delete their own uploads
CREATE POLICY "Authenticated users can delete ear tag photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'ear-tag-photos');
