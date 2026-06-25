-- Add unique constraint on (session_id, style_id) so upserts in generate-angle
-- actually update existing rows instead of inserting duplicates.
-- Without this, every generate-angle call inserted a new row, the cache check
-- found multiple rows (causing .single() to error), and OpenAI was called every
-- time the page loaded.

-- Deduplicate first: keep the row with the most image data per (session_id, style_id).
DELETE FROM session_styles
WHERE id NOT IN (
  SELECT DISTINCT ON (session_id, style_id) id
  FROM session_styles
  ORDER BY session_id, style_id,
    (image_url IS NOT NULL)::int DESC,
    (image_url_left IS NOT NULL)::int DESC,
    (image_url_right IS NOT NULL)::int DESC,
    created_at DESC
);

-- Now safe to add the unique constraint.
ALTER TABLE session_styles
  ADD CONSTRAINT session_styles_session_id_style_id_key
  UNIQUE (session_id, style_id);
