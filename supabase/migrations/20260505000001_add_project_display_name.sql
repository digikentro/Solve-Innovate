-- Add a user-editable display name for projects (sidebar label).
-- Default behavior: if not customized, we keep it equal to the existing title (HMW).

ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Backfill existing rows so sidebar always has a name to show.
UPDATE public.projects
SET display_name = title
WHERE display_name IS NULL;

-- Optional: index to support ordering/filtering by display name in the future.
CREATE INDEX IF NOT EXISTS projects_display_name_idx ON public.projects (display_name);

