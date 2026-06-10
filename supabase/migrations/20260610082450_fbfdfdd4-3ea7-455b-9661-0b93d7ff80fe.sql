
CREATE POLICY "Users upload review media to own folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'review-media' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone read review media"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'review-media');

CREATE POLICY "Users delete own review media"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'review-media' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Admins delete review media"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'review-media' AND public.has_role(auth.uid(), 'admin'));
