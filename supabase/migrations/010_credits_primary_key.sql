-- credits.user_id was declared UNIQUE but not PRIMARY KEY.
-- Supabase dashboard (and PostgREST) require a PK to identify rows for DELETE.
ALTER TABLE credits ADD PRIMARY KEY (user_id);
