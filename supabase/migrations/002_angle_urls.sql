alter table session_styles
  add column if not exists image_url_left  text,
  add column if not exists image_url_right text;
