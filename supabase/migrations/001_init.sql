-- ── Sessions ──────────────────────────────────────────────────────────────────
create table if not exists sessions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  status      text not null default 'uploading',
  face_shape  text,
  created_at  timestamptz not null default now()
);

alter table sessions enable row level security;

create policy "users_own_sessions" on sessions
  for all using (auth.uid() = user_id);

-- ── Session styles ────────────────────────────────────────────────────────────
create table if not exists session_styles (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid references sessions(id) on delete cascade not null,
  style_id    text not null,
  image_url   text,
  saved       boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table session_styles enable row level security;

create policy "users_own_styles" on session_styles
  for all using (
    session_id in (select id from sessions where user_id = auth.uid())
  );

-- ── Storage buckets (run once in Supabase SQL editor) ─────────────────────────
-- insert into storage.buckets (id, name, public) values ('uploads', 'uploads', false);
-- insert into storage.buckets (id, name, public) values ('results', 'results', false);
--
-- create policy "users_upload" on storage.objects for insert
--   with check (bucket_id = 'uploads' and auth.uid()::text = (storage.foldername(name))[1]);
--
-- create policy "users_read_uploads" on storage.objects for select
--   using (bucket_id = 'uploads' and auth.uid()::text = (storage.foldername(name))[1]);
--
-- create policy "service_write_results" on storage.objects for insert
--   with check (bucket_id = 'results');
--
-- create policy "users_read_results" on storage.objects for select
--   using (bucket_id = 'results' and auth.uid()::text = (storage.foldername(name))[1]);
