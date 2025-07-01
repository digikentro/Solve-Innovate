import { supabase } from '../lib/supabase';

// Enhanced Scoring Functions
export async function createEnhancedScoring(data: any) {
  const { data: result, error } = await supabase
    .from('enhanced_scoring')
    .insert([data])
    .select()
    .single();

  if (error) throw error;
  return result;
}

export async function getEnhancedScoring(problemId: string) {
  const { data, error } = await supabase
    .from('enhanced_scoring')
    .select('*')
    .eq('problem_id', problemId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) throw error;
  return data;
}

export async function updateEnhancedScoring(id: string, data: any) {
  const { data: result, error } = await supabase
    .from('enhanced_scoring')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return result;
}

// Dynamic Indicators Functions
export async function createDynamicIndicator(data: any) {
  const { data: result, error } = await supabase
    .from('dynamic_indicators')
    .insert([data])
    .select()
    .single();

  if (error) throw error;
  return result;
}

export async function getDynamicIndicators(problemId: string) {
  const { data, error } = await supabase
    .from('dynamic_indicators')
    .select('*')
    .eq('problem_id', problemId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function updateDynamicIndicator(id: string, data: any) {
  const { data: result, error } = await supabase
    .from('dynamic_indicators')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return result;
}

export async function deleteDynamicIndicator(id: string) {
  const { error } = await supabase
    .from('dynamic_indicators')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Cultural Intelligence Functions
export async function createCulturalIntelligence(data: any) {
  const { data: result, error } = await supabase
    .from('cultural_intelligence')
    .insert([data])
    .select()
    .single();

  if (error) throw error;
  return result;
}

export async function getCulturalIntelligence(problemId: string) {
  const { data, error } = await supabase
    .from('cultural_intelligence')
    .select('*')
    .eq('problem_id', problemId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) throw error;
  return data;
}

export async function updateCulturalIntelligence(id: string, data: any) {
  const { data: result, error } = await supabase
    .from('cultural_intelligence')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return result;
}

// Collaborative Assessment Functions
export async function createCollaborativeAssessment(data: any) {
  const { data: result, error } = await supabase
    .from('collaborative_assessments')
    .insert([data])
    .select()
    .single();

  if (error) throw error;
  return result;
}

export async function getCollaborativeAssessments(problemId: string) {
  const { data, error } = await supabase
    .from('collaborative_assessments')
    .select('*')
    .eq('problem_id', problemId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function updateCollaborativeAssessment(id: string, data: any) {
  const { data: result, error } = await supabase
    .from('collaborative_assessments')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return result;
}

export async function deleteCollaborativeAssessment(id: string) {
  const { error } = await supabase
    .from('collaborative_assessments')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Assessment Quality Functions
export async function createAssessmentQuality(data: any) {
  const { data: result, error } = await supabase
    .from('assessment_quality')
    .insert([data])
    .select()
    .single();

  if (error) throw error;
  return result;
}

export async function getAssessmentQuality(problemId: string) {
  const { data, error } = await supabase
    .from('assessment_quality')
    .select('*')
    .eq('problem_id', problemId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) throw error;
  return data;
}

export async function updateAssessmentQuality(id: string, data: any) {
  const { data: result, error } = await supabase
    .from('assessment_quality')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return result;
}

// Assessment History Functions
export async function createAssessmentHistory(data: any) {
  const { data: result, error } = await supabase
    .from('assessment_history')
    .insert([data])
    .select()
    .single();

  if (error) throw error;
  return result;
}

export async function getAssessmentHistory(problemId: string) {
  const { data, error } = await supabase
    .from('assessment_history')
    .select('*')
    .eq('problem_id', problemId)
    .order('version_number', { ascending: false });

  if (error) throw error;
  return data;
}

// Resource Framework Functions
export async function createResourceFramework(data: any) {
  const { data: result, error } = await supabase
    .from('resource_framework_config')
    .insert([data])
    .select()
    .single();

  if (error) throw error;
  return result;
}

export async function getResourceFramework(problemId: string) {
  const { data, error } = await supabase
    .from('resource_framework_config')
    .select('*')
    .eq('problem_id', problemId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) throw error;
  return data;
}

export async function updateResourceFramework(id: string, data: any) {
  const { data: result, error } = await supabase
    .from('resource_framework_config')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return result;
}

// Multi-modal Assessment Functions
export async function createMultiModalAssessment(data: any) {
  const { data: result, error } = await supabase
    .from('multi_modal_assessments')
    .insert([data])
    .select()
    .single();

  if (error) throw error;
  return result;
}

export async function getMultiModalAssessment(problemId: string) {
  const { data, error } = await supabase
    .from('multi_modal_assessments')
    .select('*')
    .eq('problem_id', problemId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) throw error;
  return data;
}

export async function updateMultiModalAssessment(id: string, data: any) {
  const { data: result, error } = await supabase
    .from('multi_modal_assessments')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return result;
}

// Utility Functions
export async function getAssessmentSummary(problemId: string) {
  try {
    const [
      enhancedScoring,
      dynamicIndicators,
      culturalIntelligence,
      collaborativeAssessments,
      assessmentQuality
    ] = await Promise.all([
      getEnhancedScoring(problemId).catch(() => null),
      getDynamicIndicators(problemId).catch(() => []),
      getCulturalIntelligence(problemId).catch(() => null),
      getCollaborativeAssessments(problemId).catch(() => []),
      getAssessmentQuality(problemId).catch(() => null)
    ]);

    return {
      enhancedScoring,
      dynamicIndicators,
      culturalIntelligence,
      collaborativeAssessments,
      assessmentQuality,
      hasCompleteAssessment: !!enhancedScoring,
      hasDynamicIndicators: dynamicIndicators.length > 0,
      hasCulturalIntelligence: !!culturalIntelligence,
      hasCollaborativeAssessment: collaborativeAssessments.length > 0,
      hasQualityReview: !!assessmentQuality
    };
  } catch (error) {
    console.error('Error getting assessment summary:', error);
    throw error;
  }
}

export async function calculateOverallScore(problemId: string) {
  try {
    const summary = await getAssessmentSummary(problemId);
    
    if (!summary.enhancedScoring) {
      return null;
    }

    // Calculate weighted score from enhanced scoring
    const scores = summary.enhancedScoring;
    const weights = {
      market_opportunity: 0.2,
      innovation_potential: 0.2,
      feasibility: 0.15,
      impact_potential: 0.2,
      india_context: 0.15,
      global_relevance: 0.1
    };

    let weightedScore = 0;
    let totalWeight = 0;

    Object.entries(weights).forEach(([key, weight]) => {
      const score = scores[`${key}_score`];
      if (score !== null && score !== undefined) {
        weightedScore += score * weight;
        totalWeight += weight;
      }
    });

    const baseScore = totalWeight > 0 ? weightedScore / totalWeight : 0;

    // Apply quality multiplier if available
    let qualityMultiplier = 1.0;
    if (summary.assessmentQuality) {
      qualityMultiplier = summary.assessmentQuality.overall_quality_score / 100;
    }

    // Apply collaboration bonus
    let collaborationBonus = 0;
    if (summary.collaborativeAssessments.length > 0) {
      const avgContribution = summary.collaborativeAssessments.reduce(
        (sum, ca) => sum + ca.contribution_score, 0
      ) / summary.collaborativeAssessments.length;
      collaborationBonus = Math.min(avgContribution * 0.1, 10); // Max 10% bonus
    }

    const finalScore = Math.min(100, (baseScore * qualityMultiplier) + collaborationBonus);

    return {
      baseScore: Math.round(baseScore * 100) / 100,
      qualityMultiplier: Math.round(qualityMultiplier * 100) / 100,
      collaborationBonus: Math.round(collaborationBonus * 100) / 100,
      finalScore: Math.round(finalScore * 100) / 100
    };
  } catch (error) {
    console.error('Error calculating overall score:', error);
    throw error;
  }
} 