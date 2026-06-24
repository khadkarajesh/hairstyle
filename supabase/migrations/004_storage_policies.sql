-- Allow service role to update (upsert) existing files in the results bucket
create policy "service_update_results" on storage.objects
  for update using (bucket_id = 'results');
