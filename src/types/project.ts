export type ProjectStatus = 'draft' | 'active' | 'completed' | 'archived';

export interface ProjectInput {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: ProjectStatus;
  tags?: string[] | null;
  created_at: string;
  updated_at: string;
  presentable_slide?: any;
}

export interface Project extends ProjectInput {
  // Additional fields or overrides can go here
}

export interface ProjectWithIdeas extends Project {
  ideas?: ProjectIdea[];
}

export interface ProjectIdea {
  id: string;
  project_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export type HmwType = 'human' | 'system' | 'business';

export interface BaseProblem {
  id: string;
  title: string;
  description: string;
  opportunityScore: number;
  subscores: Record<string, number>;
  iosAssessment: any; // fallback for unknown structure
  requiredSkills: string[];
  sdgGoals: string[];
  hmwType: HmwType;
}

export interface SystemProblem extends BaseProblem {
  hmwType: 'system';
  iosAssessment: {
    totalScore: number;
    dimensions: {
      marketOpportunity?: any;
      innovationPotential?: any;
      feasibility?: any;
      systemImpactPotential?: any;
      indiaContext?: any;
      globalRelevance?: any;
    };
    [key: string]: any;
  };
}

export interface BusinessProblem extends BaseProblem {
  hmwType: 'business';
  iosAssessment: {
    totalScore: number;
    dimensions: {
      marketOpportunity?: any;
      innovationPotential?: any;
      feasibility?: any;
      businessImpactPotential?: any;
      indiaContext?: any;
      globalRelevance?: any;
    };
    [key: string]: any;
  };
  businessMetrics?: Record<string, any>;
}

export interface HumanProblem extends BaseProblem {
  hmwType: 'human';
  iosAssessment: {
    totalScore: number;
    dimensions: {
      marketOpportunity?: any;
      innovationPotential?: any;
      feasibility?: any;
      impactPotential?: any;
      indiaContext?: any;
      globalRelevance?: any;
    };
    [key: string]: any;
  };
}

export type ProblemStatementEnhanced = HumanProblem | SystemProblem | BusinessProblem;
