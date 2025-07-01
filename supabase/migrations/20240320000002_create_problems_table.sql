-- Create the problems table
CREATE TABLE IF NOT EXISTS public.problems (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    opportunity_score INTEGER NOT NULL,
    subscores JSONB NOT NULL,
    required_skills TEXT[] NOT NULL,
    sdg_goals TEXT[] NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.problems ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON public.problems
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.problems
    FOR INSERT WITH CHECK (auth.role() = 'authenticated'); 