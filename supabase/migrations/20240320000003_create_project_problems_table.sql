-- Create the project_problems table
CREATE TABLE IF NOT EXISTS public.project_problems (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    problem_statement TEXT NOT NULL,
    opportunity_score INTEGER NOT NULL,
    significance_score INTEGER NOT NULL,
    solution_gap_score INTEGER NOT NULL,
    market_potential_score INTEGER NOT NULL,
    technical_feasibility_score INTEGER NOT NULL,
    sdg_alignment_score INTEGER NOT NULL,
    required_skills TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS project_problems_project_id_idx ON public.project_problems(project_id);
CREATE INDEX IF NOT EXISTS project_problems_created_at_idx ON public.project_problems(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.project_problems ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view problems of their projects"
    ON public.project_problems
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = project_problems.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert problems for their projects"
    ON public.project_problems
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = project_problems.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update problems of their projects"
    ON public.project_problems
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = project_problems.project_id
            AND projects.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = project_problems.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete problems of their projects"
    ON public.project_problems
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = project_problems.project_id
            AND projects.user_id = auth.uid()
        )
    ); 