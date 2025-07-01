-- Create the project_solutions table
CREATE TABLE IF NOT EXISTS public.project_solutions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'draft',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS project_solutions_project_id_idx ON public.project_solutions(project_id);
CREATE INDEX IF NOT EXISTS project_solutions_created_at_idx ON public.project_solutions(created_at DESC);
CREATE INDEX IF NOT EXISTS project_solutions_status_idx ON public.project_solutions(status);

-- Enable Row Level Security
ALTER TABLE public.project_solutions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view solutions of their projects"
    ON public.project_solutions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = project_solutions.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert solutions for their projects"
    ON public.project_solutions
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = project_solutions.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update solutions of their projects"
    ON public.project_solutions
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = project_solutions.project_id
            AND projects.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = project_solutions.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete solutions of their projects"
    ON public.project_solutions
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = project_solutions.project_id
            AND projects.user_id = auth.uid()
        )
    ); 