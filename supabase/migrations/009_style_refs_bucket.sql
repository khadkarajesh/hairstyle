-- Public bucket for AI-generated hairstyle reference images shown on the landing page.
-- Files are uploaded by the generate-style-refs.ts script and served as <img> tags.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'style-refs',
  'style-refs',
  true,
  5242880, -- 5 MB per file
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow public read (SELECT) on all objects in this bucket.
CREATE POLICY IF NOT EXISTS "style-refs public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'style-refs');

-- Allow service role to upload (INSERT / UPDATE).
CREATE POLICY IF NOT EXISTS "style-refs service write"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'style-refs');

CREATE POLICY IF NOT EXISTS "style-refs service update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'style-refs');
