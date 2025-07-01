-- Fix RLS policies for enhanced framework tables
-- Since problems table doesn't have user_id, we'll use different access patterns

-- Drop existing policies that reference problems.user_id
DROP POLICY IF EXISTS "Users can view indicators for their problems" ON public.dynamic_indicators;
DROP POLICY IF EXISTS "Users can insert indicators for their problems" ON public.dynamic_indicators;
DROP POLICY IF EXISTS "Users can view cultural data for their problems" ON public.cultural_intelligence;
DROP POLICY IF EXISTS "Users can insert cultural data for their problems" ON public.cultural_intelligence;
DROP POLICY IF EXISTS "Users can view scoring for their problems" ON public.enhanced_scoring;
DROP POLICY IF EXISTS "Users can insert scoring for their problems" ON public.enhanced_scoring;
DROP POLICY IF EXISTS "Users can view quality data for their problems" ON public.assessment_quality;
DROP POLICY IF EXISTS "Users can view collaborations for their problems" ON public.collaborative_assessments;
DROP POLICY IF EXISTS "Users can view history for their problems" ON public.assessment_history;

-- Create new policies that allow authenticated users to access their own data
-- For now, we'll use a simpler approach where authenticated users can access all data
-- In a production system, you'd want to implement proper ownership tracking

-- Dynamic indicators policies
CREATE POLICY "Authenticated users can view dynamic indicators" ON public.dynamic_indicators
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert dynamic indicators" ON public.dynamic_indicators
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update dynamic indicators" ON public.dynamic_indicators
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Cultural intelligence policies
CREATE POLICY "Authenticated users can view cultural intelligence" ON public.cultural_intelligence
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert cultural intelligence" ON public.cultural_intelligence
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update cultural intelligence" ON public.cultural_intelligence
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Enhanced scoring policies
CREATE POLICY "Authenticated users can view enhanced scoring" ON public.enhanced_scoring
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert enhanced scoring" ON public.enhanced_scoring
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update enhanced scoring" ON public.enhanced_scoring
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Assessment quality policies
CREATE POLICY "Authenticated users can view assessment quality" ON public.assessment_quality
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert assessment quality" ON public.assessment_quality
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update assessment quality" ON public.assessment_quality
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Collaborative assessments policies
CREATE POLICY "Authenticated users can view collaborative assessments" ON public.collaborative_assessments
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert collaborative assessments" ON public.collaborative_assessments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update collaborative assessments" ON public.collaborative_assessments
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Assessment history policies
CREATE POLICY "Authenticated users can view assessment history" ON public.assessment_history
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert assessment history" ON public.assessment_history
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Fix the trigger function to not reference problems.user_id
CREATE OR REPLACE FUNCTION update_assessment_confidence(
    p_problem_id UUID
) RETURNS DECIMAL(3,2) AS $$
DECLARE
    confidence DECIMAL(3,2);
    data_availability TEXT;
    assessment_mode TEXT;
    collaborator_count INTEGER;
BEGIN
    -- Get problem data
    SELECT problems.data_availability_level, problems.assessment_mode
    INTO data_availability, assessment_mode
    FROM public.problems
    WHERE problems.id = p_problem_id;
    
    -- Get collaborator count
    SELECT COUNT(*)
    INTO collaborator_count
    FROM public.collaborative_assessments
    WHERE problem_id = p_problem_id;
    
    -- Calculate confidence based on factors
    confidence := 0.5; -- Base confidence
    
    -- Adjust for data availability
    CASE data_availability
        WHEN 'high' THEN confidence := confidence + 0.2;
        WHEN 'medium' THEN confidence := confidence + 0.1;
        WHEN 'low' THEN confidence := confidence + 0.0;
    END CASE;
    
    -- Adjust for assessment mode
    CASE assessment_mode
        WHEN 'quantitative' THEN confidence := confidence + 0.1;
        WHEN 'hybrid' THEN confidence := confidence + 0.15;
        WHEN 'qualitative' THEN confidence := confidence + 0.05;
    END CASE;
    
    -- Adjust for collaboration
    IF collaborator_count > 0 THEN
        confidence := confidence + LEAST(collaborator_count * 0.05, 0.2);
    END IF;
    
    -- Ensure confidence is within bounds
    confidence := GREATEST(0.0, LEAST(1.0, confidence));
    
    -- Update the problem's confidence score
    UPDATE public.problems
    SET assessment_confidence_score = confidence
    WHERE id = p_problem_id;
    
    RETURN confidence;
END;
$$ LANGUAGE plpgsql; 