-- Add secondary research column (optional)
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS secondaryresearch JSONB DEFAULT NULL;

-- Index for JSONB queries (optional but consistent with other research columns)
CREATE INDEX IF NOT EXISTS projects_secondaryresearch_idx
  ON public.projects USING GIN(secondaryresearch);

