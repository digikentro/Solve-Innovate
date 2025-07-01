-- Enhanced Framework Database Schema
-- This migration implements the Revised Innovation Opportunity Score Framework

-- 1. Enhanced Problems Table with Multi-Modal Assessment Support
ALTER TABLE public.problems ADD COLUMN IF NOT EXISTS assessment_mode TEXT DEFAULT 'quantitative';
ALTER TABLE public.problems ADD COLUMN IF NOT EXISTS data_availability_level TEXT DEFAULT 'high';
ALTER TABLE public.problems ADD COLUMN IF NOT EXISTS cultural_context_notes TEXT;
ALTER TABLE public.problems ADD COLUMN IF NOT EXISTS resource_tier TEXT DEFAULT 'standard';
ALTER TABLE public.problems ADD COLUMN IF NOT EXISTS last_assessment_update TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.problems ADD COLUMN IF NOT EXISTS assessment_confidence_score DECIMAL(3,2) DEFAULT 0.8;

-- 2. Dynamic Assessment Indicators Table
CREATE TABLE IF NOT EXISTS public.dynamic_indicators (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    problem_id UUID REFERENCES public.problems(id) ON DELETE CASCADE,
    indicator_type TEXT NOT NULL, -- 'trend', 'momentum', 'market_signal', 'regulatory'
    indicator_name TEXT NOT NULL,
    indicator_value JSONB NOT NULL,
    source TEXT NOT NULL,
    confidence_score DECIMAL(3,2) DEFAULT 0.8,
    trend_direction TEXT, -- 'increasing', 'decreasing', 'stable'
    momentum_score INTEGER CHECK (momentum_score >= -100 AND momentum_score <= 100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Cultural Intelligence Data Table
CREATE TABLE IF NOT EXISTS public.cultural_intelligence (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    problem_id UUID REFERENCES public.problems(id) ON DELETE CASCADE,
    cultural_values_analysis JSONB,
    social_dynamics_assessment JSONB,
    behavioral_pattern_analysis JSONB,
    community_context_evaluation JSONB,
    cultural_adaptation_recommendations TEXT[],
    regional_variations JSONB,
    community_engagement_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enhanced Scoring Breakdown Table
CREATE TABLE IF NOT EXISTS public.enhanced_scoring (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    problem_id UUID REFERENCES public.problems(id) ON DELETE CASCADE,
    
    -- Market Opportunity (25% weight)
    market_opportunity_score INTEGER CHECK (market_opportunity_score >= 0 AND market_opportunity_score <= 100),
    traditional_market_metrics JSONB,
    emerging_market_indicators JSONB,
    cultural_market_factors JSONB,
    market_momentum_analysis JSONB,
    
    -- Innovation Potential (20% weight)
    innovation_potential_score INTEGER CHECK (innovation_potential_score >= 0 AND innovation_potential_score <= 100),
    traditional_innovation_metrics JSONB,
    cultural_innovation_patterns JSONB,
    adaptive_technology_assessment JSONB,
    community_innovation_capacity JSONB,
    
    -- Feasibility (20% weight)
    feasibility_score INTEGER CHECK (feasibility_score >= 0 AND feasibility_score <= 100),
    traditional_feasibility_metrics JSONB,
    adaptive_implementation_strategies JSONB,
    resource_flexibility_analysis JSONB,
    community_implementation_capacity JSONB,
    
    -- Impact Potential (15% weight)
    impact_potential_score INTEGER CHECK (impact_potential_score >= 0 AND impact_potential_score <= 100),
    traditional_impact_metrics JSONB,
    community_defined_value_assessment JSONB,
    cultural_impact_analysis JSONB,
    adaptive_impact_measurement JSONB,
    
    -- India Context (10% weight)
    india_context_score INTEGER CHECK (india_context_score >= 0 AND india_context_score <= 100),
    traditional_india_metrics JSONB,
    cultural_intelligence_analysis JSONB,
    social_dynamics_assessment JSONB,
    regional_variation_analysis JSONB,
    digital_india_integration JSONB,
    
    -- Global Relevance (10% weight)
    global_relevance_score INTEGER CHECK (global_relevance_score >= 0 AND global_relevance_score <= 100),
    traditional_global_metrics JSONB,
    cross_cultural_adaptability_assessment JSONB,
    emerging_market_potential JSONB,
    global_trend_alignment JSONB,
    
    -- Overall weighted score
    overall_weighted_score DECIMAL(5,2),
    
    -- Assessment metadata
    assessment_mode TEXT DEFAULT 'standard',
    assessment_confidence DECIMAL(3,2) DEFAULT 0.8,
    assessment_date TIMESTAMPTZ DEFAULT NOW(),
    assessor_id UUID REFERENCES auth.users(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Assessment Quality Assurance Table
CREATE TABLE IF NOT EXISTS public.assessment_quality (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    problem_id UUID REFERENCES public.problems(id) ON DELETE CASCADE,
    assessment_id UUID REFERENCES public.enhanced_scoring(id) ON DELETE CASCADE,
    
    -- Quality metrics
    completeness_score DECIMAL(3,2),
    consistency_score DECIMAL(3,2),
    source_verification_score DECIMAL(3,2),
    bias_detection_score DECIMAL(3,2),
    overall_quality_score DECIMAL(3,2),
    
    -- Quality flags
    quality_flags TEXT[],
    improvement_recommendations TEXT[],
    
    -- Validation
    validated_by UUID REFERENCES auth.users(id),
    validation_date TIMESTAMPTZ,
    validation_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Collaborative Assessment Table
CREATE TABLE IF NOT EXISTS public.collaborative_assessments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    problem_id UUID REFERENCES public.problems(id) ON DELETE CASCADE,
    assessment_id UUID REFERENCES public.enhanced_scoring(id) ON DELETE CASCADE,
    
    -- Collaboration details
    collaborator_id UUID REFERENCES auth.users(id),
    collaborator_role TEXT, -- 'expert', 'stakeholder', 'community_member'
    collaboration_type TEXT, -- 'review', 'validation', 'input'
    
    -- Assessment contribution
    contributed_dimensions TEXT[], -- which dimensions they contributed to
    contribution_notes TEXT,
    contribution_score DECIMAL(3,2),
    
    -- Consensus
    consensus_level DECIMAL(3,2), -- agreement level with other assessors
    conflict_resolution_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Assessment History and Versioning Table
CREATE TABLE IF NOT EXISTS public.assessment_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    problem_id UUID REFERENCES public.problems(id) ON DELETE CASCADE,
    assessment_id UUID REFERENCES public.enhanced_scoring(id) ON DELETE CASCADE,
    
    -- Versioning
    version_number INTEGER NOT NULL,
    change_type TEXT, -- 'initial', 'update', 'revision', 'correction'
    change_reason TEXT,
    
    -- Previous values (for comparison)
    previous_scores JSONB,
    previous_metadata JSONB,
    
    -- Change tracking
    changed_by UUID REFERENCES auth.users(id),
    change_date TIMESTAMPTZ DEFAULT NOW(),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Resource Framework Configuration Table
CREATE TABLE IF NOT EXISTS public.resource_framework_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Framework tiers
    tier_name TEXT NOT NULL UNIQUE, -- 'express', 'standard', 'premium'
    tier_description TEXT,
    
    -- Assessment capabilities
    available_modes TEXT[], -- assessment modes available for this tier
    max_collaborators INTEGER,
    expert_consultation_available BOOLEAN DEFAULT false,
    automated_support_level TEXT, -- 'basic', 'standard', 'advanced'
    
    -- Resource requirements
    estimated_time_hours INTEGER,
    estimated_cost_range JSONB,
    required_expertise_level TEXT,
    
    -- Quality standards
    minimum_quality_score DECIMAL(3,2),
    validation_requirements TEXT[],
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_dynamic_indicators_problem_id ON public.dynamic_indicators(problem_id);
CREATE INDEX IF NOT EXISTS idx_dynamic_indicators_type ON public.dynamic_indicators(indicator_type);
CREATE INDEX IF NOT EXISTS idx_cultural_intelligence_problem_id ON public.cultural_intelligence(problem_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_scoring_problem_id ON public.enhanced_scoring(problem_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_scoring_overall_score ON public.enhanced_scoring(overall_weighted_score DESC);
CREATE INDEX IF NOT EXISTS idx_assessment_quality_problem_id ON public.assessment_quality(problem_id);
CREATE INDEX IF NOT EXISTS idx_collaborative_assessments_problem_id ON public.collaborative_assessments(problem_id);
CREATE INDEX IF NOT EXISTS idx_assessment_history_problem_id ON public.assessment_history(problem_id);

-- Enable Row Level Security
ALTER TABLE public.dynamic_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cultural_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enhanced_scoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_quality ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaborative_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_framework_config ENABLE ROW LEVEL SECURITY;

-- Create function to calculate overall weighted score
CREATE OR REPLACE FUNCTION calculate_weighted_score(
    market_score INTEGER,
    innovation_score INTEGER,
    feasibility_score INTEGER,
    impact_score INTEGER,
    india_score INTEGER,
    global_score INTEGER
) RETURNS DECIMAL(5,2) AS $$
BEGIN
    RETURN (
        (market_score * 0.25) +
        (innovation_score * 0.20) +
        (feasibility_score * 0.20) +
        (impact_score * 0.15) +
        (india_score * 0.10) +
        (global_score * 0.10)
    );
END;
$$ LANGUAGE plpgsql;

-- Create function to update assessment confidence
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

-- Fix trigger and function for assessment confidence
DROP TRIGGER IF EXISTS update_assessment_confidence_trigger ON public.collaborative_assessments;
DROP FUNCTION IF EXISTS update_assessment_confidence_trigger_fn CASCADE;

CREATE OR REPLACE FUNCTION update_assessment_confidence_trigger_fn()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM update_assessment_confidence(NEW.problem_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_assessment_confidence_trigger
    AFTER INSERT OR UPDATE ON public.collaborative_assessments
    FOR EACH ROW
    EXECUTE FUNCTION update_assessment_confidence_trigger_fn(); 