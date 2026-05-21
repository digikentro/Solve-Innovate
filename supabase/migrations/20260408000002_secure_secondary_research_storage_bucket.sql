-- Secure Storage bucket and policies for Secondary Research uploads
-- Bucket is expected to exist already, but this makes local/dev reproducible.

-- Create bucket if missing (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('secondary-research', 'secondary-research', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Ensure RLS is enabled on storage.objects (usually enabled by default)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Helper note:
-- Object naming convention enforced by the app:
--   projects/{projectId}/{yyyy-mm-dd}/{uuid}-{filename}
-- We extract projectId with split_part(name, '/', 2)

-- Allow project owners to upload into their project prefix
DROP POLICY IF EXISTS "Secondary research: upload own project files" ON storage.objects;
CREATE POLICY "Secondary research: upload own project files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'secondary-research'
    AND split_part(name, '/', 1) = 'projects'
    AND EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id::text = split_part(name, '/', 2)
        AND p.user_id = auth.uid()
    )
  );

-- Allow project owners to read objects under their project prefix
DROP POLICY IF EXISTS "Secondary research: read own project files" ON storage.objects;
CREATE POLICY "Secondary research: read own project files"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'secondary-research'
    AND split_part(name, '/', 1) = 'projects'
    AND EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id::text = split_part(name, '/', 2)
        AND p.user_id = auth.uid()
    )
  );

-- Allow project owners to delete objects under their project prefix
DROP POLICY IF EXISTS "Secondary research: delete own project files" ON storage.objects;
CREATE POLICY "Secondary research: delete own project files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'secondary-research'
    AND split_part(name, '/', 1) = 'projects'
    AND EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id::text = split_part(name, '/', 2)
        AND p.user_id = auth.uid()
    )
  );

