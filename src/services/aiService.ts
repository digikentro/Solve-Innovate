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