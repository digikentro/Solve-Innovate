-- Add separate columns for research data instead of storing in metadata JSONB
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS as_is_map_data JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS extreme_user_data JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS deep_empathy_data JSONB DEFAULT NULL;

-- Create indexes for the new columns for better query performance
CREATE INDEX IF NOT EXISTS projects_as_is_map_data_idx ON public.projects USING GIN(as_is_map_data);
CREATE INDEX IF NOT EXISTS projects_extreme_user_data_idx ON public.projects USING GIN(extreme_user_data);
CREATE INDEX IF NOT EXISTS projects_deep_empathy_data_idx ON public.projects USING GIN(deep_empathy_data);

