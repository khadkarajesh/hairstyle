-- Add shown_to_barber signal to session_styles.
-- Set by user after visiting their barber — feeds into session 3 Claude prompt
-- as the strongest intent signal (they actually acted on it).

ALTER TABLE session_styles
  ADD COLUMN IF NOT EXISTS shown_to_barber boolean NOT NULL DEFAULT false;
