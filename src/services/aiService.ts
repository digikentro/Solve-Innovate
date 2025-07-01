import { supabase } from '@/lib/supabase';

export interface ProblemStatement {
  id?: string;
  title: string;
  description: string;
  opportunityScore: number;
  subscores: {
    significance: number;
    solutionGap: number;
    marketPotential: number;
    technicalFeasibility: number;
    sdgAlignment: number;
  };
  requiredSkills: string[];
  skillMatchPercentage?: number;
  sdgGoals: string[];
  sector: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface GenerateProblemsInput {
  query: string;
  userSkills?: string[];
  page?: number;
  limit?: number;
}

const SYSTEM_PROMPT = `You are an expert at identifying and framing innovation opportunities. Your task is to generate "How Might We" (HMW) problem statements that are specific, actionable, and impactful.

For each problem statement, provide:
1. A clear HMW question
2. A brief description
3. An opportunity score (0-100) based on:
   - Significance (20 points): Impact on society/environment
   - Solution Gap (20 points): Current solutions' limitations
   - Market Potential (20 points): Economic viability
   - Technical Feasibility (20 points): Implementation possibility
   - SDG Alignment (20 points): UN Sustainable Development Goals

Also include:
- Required skills (3-5 specific skills)
- Relevant SDG goals (1-3 goals)

Format the response as a JSON object with this structure:
{
  "problems": [
    {
      "title": "HMW question",
      "description": "Brief description",
      "opportunityScore": 85,
      "subscores": {
        "significance": 18,
        "solutionGap": 17,
        "marketPotential": 16,
        "technicalFeasibility": 17,
        "sdgAlignment": 17
      },
      "requiredSkills": ["skill1", "skill2", "skill3"],
      "sdgGoals": ["SDG1", "SDG2"]
    }
  ]
}`;

export const aiService = {
  async generateProblems({ query, userSkills = [], page = 1, limit = 10 }: GenerateProblemsInput): Promise<{ problems: ProblemStatement[] }> {
    try {
      // Search in the database
      const { data: existingProblems, error: searchError } = await supabase
        .from('problems')
        .select('*')
        .textSearch('title', query)
        .or(`description.ilike.%${query}%`)
        .range((page - 1) * limit, page * limit - 1)
        .order('opportunityScore', { ascending: false });

      if (searchError) throw searchError;

      // Calculate skill match for all problems
      const problemsWithSkillMatch = (existingProblems || []).map(problem => ({
        ...problem,
        skillMatchPercentage: calculateSkillMatch(problem.requiredSkills, userSkills)
      }));

      return { problems: problemsWithSkillMatch };
    } catch (error) {
      console.error('Error searching problems:', error);
      throw error;
    }
  },

  async createProblem(problem: Omit<ProblemStatement, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProblemStatement> {
    try {
      const { data, error } = await supabase
        .from('problems')
        .insert({
          title: problem.title,
          description: problem.description,
          opportunity_score: problem.opportunityScore,
          subscores: problem.subscores,
          required_skills: problem.requiredSkills,
          sdg_goals: problem.sdgGoals,
          sector: problem.sector
        })
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('No data returned from insert');

      return {
        id: data.id,
        title: data.title,
        description: data.description,
        opportunityScore: data.opportunity_score,
        subscores: data.subscores,
        requiredSkills: data.required_skills,
        sdgGoals: data.sdg_goals,
        sector: data.sector,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Error creating problem:', error);
      throw error;
    }
  },

  async getProblemById(id: string): Promise<ProblemStatement> {
    try {
      const { data, error } = await supabase
        .from('problems')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting problem:', error);
      throw error;
    }
  },

  async updateProblem(id: string, updates: Partial<ProblemStatement>): Promise<ProblemStatement> {
    try {
      const { data, error } = await supabase
        .from('problems')
        .update({
          ...updates,
          search_vector: updates.title || updates.description ? 
            `${updates.title || ''} ${updates.description || ''}` : undefined
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating problem:', error);
      throw error;
    }
  },

  async deleteProblem(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('problems')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting problem:', error);
      throw error;
    }
  },

  async generateProblem(
    sector: string,
    problemDescription: string,
    userSkills?: string[]
  ): Promise<ProblemStatement> {
    try {
      const { data, error } = await supabase.functions.invoke('generate-problem', {
        body: { sector, problemDescription, userSkills },
      });

      if (error) throw error;
      if (!data) throw new Error('No data received from function');

      // The Edge Function now returns both generated and saved problem
      const { generatedProblem, savedProblem } = data;

      // Return the saved problem from the database
      return {
        id: savedProblem.id,
        title: savedProblem.title,
        description: savedProblem.description,
        opportunityScore: savedProblem.opportunity_score,
        subscores: savedProblem.subscores,
        requiredSkills: savedProblem.required_skills,
        sdgGoals: savedProblem.sdg_goals,
        sector: savedProblem.sector,
        createdAt: savedProblem.created_at,
        updatedAt: savedProblem.updated_at
      };
    } catch (error) {
      console.error('Error generating problem:', error);
      throw error;
    }
  }
};

// Helper function to calculate skill match percentage
function calculateSkillMatch(requiredSkills: string[], userSkills: string[]): number {
  if (!requiredSkills.length || !userSkills.length) return 0;
  
  const matchedSkills = requiredSkills.filter(skill =>
    userSkills.some(userSkill =>
      userSkill.toLowerCase().includes(skill.toLowerCase()) ||
      skill.toLowerCase().includes(userSkill.toLowerCase())
    )
  );
  
  return Math.round((matchedSkills.length / requiredSkills.length) * 100);
} 