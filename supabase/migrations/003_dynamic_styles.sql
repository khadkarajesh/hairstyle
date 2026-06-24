alter table sessions
  add column if not exists selected_styles text[],
  add column if not exists hair_attributes jsonb;
