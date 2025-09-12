-- Add chatbox column to store chat history for projects
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS chatbox JSONB DEFAULT NULL;

-- Create index for the chatbox column for better query performance
CREATE INDEX IF NOT EXISTS projects_chatbox_idx ON public.projects USING GIN(chatbox);
