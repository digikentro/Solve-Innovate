export interface IOSDimension {
  name: string;
  weight: number;
  score: number;
  subscores: Record<string, number>;
  evidence: string[];
  sources: IOSSource[];
}

export interface IOSSource {
  tier: 1 | 2 | 3 | 4 | 5;
  name: string;
  url?: string;
  credibility: string;
  date?: string;
  biasScore?: number;
}

export interface IOSAssessment {
  totalScore: number;
  dimensions: Record<string, IOSDimension>;
  culturalFactors: string[];
  trendAnalysis: string[];
  recommendations: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProblemStatement {
  id?: string;
  title: string;
  description: string;
  opportunityScore: number;
  requiredSkills: string[];
  sector: string;
  iosAssessment?: IOSAssessment;
  createdAt?: string;
  updatedAt?: string;
}


export class IOSFrameworkService {
  // Calculate comprehensive IOS score using the 6-dimensional framework
  static calculateIOSScore(assessment: IOSAssessment): number {
    const dimensions = assessment.dimensions as Record<string, any>;
    let totalScore = 0;
    // Use all keys in dimensions
    for (const key of Object.keys(dimensions)) {
      const dim = dimensions[key];
      if (dim && typeof dim.score === 'number' && typeof dim.weight === 'number') {
        totalScore += (dim.score * dim.weight * 10) / 100;
      }
    }
    return Math.round(totalScore);
  } 

  // Validate source credibility
  static validateSource(source: IOSSource): boolean {
    return source.tier >= 1 && source.tier <= 5 && 
           source.name.length > 0 && 
           source.credibility.length > 0;
  }
}