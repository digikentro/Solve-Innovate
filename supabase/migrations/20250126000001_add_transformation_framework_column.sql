-- Add transformation_framework column to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS transformation_framework JSONB DEFAULT NULL;

-- Create index for the new column for better query performance
CREATE INDEX IF NOT EXISTS projects_transformation_framework_idx ON public.projects USING GIN(transformation_framework);