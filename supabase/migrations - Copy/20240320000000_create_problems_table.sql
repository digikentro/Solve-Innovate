-- Create the problems table
CREATE TABLE IF NOT EXISTS public.problems (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    opportunity_score INTEGER NOT NULL,
    subscores JSONB NOT NULL,
    required_skills TEXT[] NOT NULL,
    sdg_goals TEXT[] NOT NULL,
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', title || ' ' || description)
    ) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create an index for full-text search
CREATE INDEX IF NOT EXISTS problems_search_idx ON public.problems USING GIN (search_vector);

-- Enable Row Level Security
ALTER TABLE public.problems ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON public.problems
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.problems
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_problems_updated_at
    BEFORE UPDATE ON public.problems
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 