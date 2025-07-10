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
  dimensions: {
    marketOpportunity: IOSDimension;
    innovationPotential: IOSDimension;
    feasibility: IOSDimension;
    impactPotential: IOSDimension;
    indiaContext: IOSDimension;
    globalRelevance: IOSDimension;
  };
  assessmentMode: 'quantitative' | 'qualitative' | 'hybrid';
  resourceTier: 'express' | 'standard' | 'premium';
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
  iosAssessment?: IOSAssessment;
  createdAt?: string;
  updatedAt?: string;
}

// Enhanced scoring criteria based on the IOS Framework
export const IOS_CRITERIA = {
  marketOpportunity: {
    weight: 25,
    subscores: {
      marketSize: { weight: 30, maxScore: 20 },
      marketMomentum: { weight: 35, maxScore: 20 },
      marketAccessibility: { weight: 35, maxScore: 20 }
    }
  },
  innovationPotential: {
    weight: 20,
    subscores: {
      solutionNovelty: { weight: 35, maxScore: 20 },
      technologyReadiness: { weight: 35, maxScore: 20 },
      competitiveLandscape: { weight: 30, maxScore: 20 }
    }
  },
  feasibility: {
    weight: 20,
    subscores: {
      technicalFeasibility: { weight: 40, maxScore: 20 },
      financialFeasibility: { weight: 35, maxScore: 20 },
      operationalFeasibility: { weight: 25, maxScore: 20 }
    }
  },
  impactPotential: {
    weight: 15,
    subscores: {
      socialImpact: { weight: 40, maxScore: 20 },
      environmentalImpact: { weight: 30, maxScore: 20 },
      economicImpact: { weight: 30, maxScore: 20 }
    }
  },
  indiaContext: {
    weight: 10,
    subscores: {
      marketReadiness: { weight: 35, maxScore: 20 },
      regulatoryEnvironment: { weight: 35, maxScore: 20 },
      innovationEcosystem: { weight: 30, maxScore: 20 }
    }
  },
  globalRelevance: {
    weight: 10,
    subscores: {
      crossCulturalAdaptability: { weight: 40, maxScore: 20 },
      emergingMarketPotential: { weight: 35, maxScore: 20 },
      globalTrendAlignment: { weight: 25, maxScore: 20 }
    }
  }
};

export class IOSFrameworkService {
  // Calculate comprehensive IOS score using the 6-dimensional framework
  static calculateIOSScore(assessment: IOSAssessment): number {
    const dimensions = assessment.dimensions;
    
    let totalScore = 0;
    
    // Market Opportunity (25%)
    totalScore += (dimensions.marketOpportunity.score * IOS_CRITERIA.marketOpportunity.weight) / 100;
    
    // Innovation Potential (20%)
    totalScore += (dimensions.innovationPotential.score * IOS_CRITERIA.innovationPotential.weight) / 100;
    
    // Feasibility (20%)
    totalScore += (dimensions.feasibility.score * IOS_CRITERIA.feasibility.weight) / 100;
    
    // Impact Potential (15%)
    totalScore += (dimensions.impactPotential.score * IOS_CRITERIA.impactPotential.weight) / 100;
    
    // India Context (10%)
    totalScore += (dimensions.indiaContext.score * IOS_CRITERIA.indiaContext.weight) / 100;
    
    // Global Relevance (10%)
    totalScore += (dimensions.globalRelevance.score * IOS_CRITERIA.globalRelevance.weight) / 100;
    
    return Math.round(totalScore);
  }

  // Generate assessment mode recommendation based on data availability
  static recommendAssessmentMode(dataAvailability: {
    quantitative: boolean;
    qualitative: boolean;
    cultural: boolean;
    community: boolean;
  }): 'quantitative' | 'qualitative' | 'hybrid' {
    const { quantitative, qualitative, cultural, community } = dataAvailability;
    
    if (quantitative && (qualitative || cultural || community)) {
      return 'hybrid';
    } else if (quantitative) {
      return 'quantitative';
    } else {
      return 'qualitative';
    }
  }

  // Recommend resource tier based on organizational capabilities
  static recommendResourceTier(capabilities: {
    timeAvailable: 'limited' | 'moderate' | 'extensive';
    budget: 'low' | 'medium' | 'high';
    expertise: 'basic' | 'intermediate' | 'advanced';
    researchCapacity: 'minimal' | 'moderate' | 'comprehensive';
  }): 'express' | 'standard' | 'premium' {
    const { timeAvailable, budget, expertise, researchCapacity } = capabilities;
    
    // Premium tier requires extensive resources
    if (timeAvailable === 'extensive' && budget === 'high' && 
        expertise === 'advanced' && researchCapacity === 'comprehensive') {
      return 'premium';
    }
    
    // Express tier for limited resources
    if (timeAvailable === 'limited' || budget === 'low' || 
        expertise === 'basic' || researchCapacity === 'minimal') {
      return 'express';
    }
    
    // Default to standard tier
    return 'standard';
  }

  // Validate source credibility
  static validateSource(source: IOSSource): boolean {
    return source.tier >= 1 && source.tier <= 5 && 
           source.name.length > 0 && 
           source.credibility.length > 0;
  }

  // Calculate dimension score from subscores
  static calculateDimensionScore(subscores: Record<string, number>, dimension: keyof typeof IOS_CRITERIA): number {
    const criteria = IOS_CRITERIA[dimension];
    let weightedScore = 0;
    
    Object.entries(subscores).forEach(([subscore, score]) => {
      const subscoreCriteria = criteria.subscores[subscore as keyof typeof criteria.subscores];
      if (subscoreCriteria && typeof subscoreCriteria === 'object' && 'weight' in subscoreCriteria) {
        weightedScore += (score * (subscoreCriteria as any).weight) / 100;
      }
    });
    
    return Math.round(weightedScore);
  }

  // Generate cultural intelligence insights
  static generateCulturalInsights(assessment: IOSAssessment): string[] {
    const insights: string[] = [];
    
    // Analyze cultural factors from the assessment
    if (assessment.culturalFactors.length > 0) {
      insights.push(`Cultural alignment score: ${assessment.dimensions.indiaContext.score}/20`);
      insights.push(`Key cultural considerations: ${assessment.culturalFactors.join(', ')}`);
    }
    
    // Add recommendations based on cultural context
    if (assessment.dimensions.indiaContext.score < 10) {
      insights.push('Consider local cultural factors and community engagement strategies');
    }
    
    return insights;
  }

  // Generate trend analysis insights
  static generateTrendInsights(assessment: IOSAssessment): string[] {
    const insights: string[] = [];
    
    // Analyze momentum indicators
    if (assessment.dimensions.marketOpportunity.score > 15) {
      insights.push('Strong market momentum detected - favorable timing for innovation');
    }
    
    // Global trend alignment
    if (assessment.dimensions.globalRelevance.score > 15) {
      insights.push('High alignment with global trends - strong scalability potential');
    }
    
    return insights;
  }

  // Create a comprehensive assessment report
  static generateAssessmentReport(assessment: IOSAssessment): {
    summary: string;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    riskFactors: string[];
  } {
    const totalScore = this.calculateIOSScore(assessment);
    
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const recommendations: string[] = [];
    const riskFactors: string[] = [];
    
    // Analyze each dimension
    Object.entries(assessment.dimensions).forEach(([dimension, data]) => {
      if (data.score >= 15) {
        strengths.push(`Strong ${dimension.replace(/([A-Z])/g, ' $1').toLowerCase()} (${data.score}/20)`);
      } else if (data.score <= 10) {
        weaknesses.push(`Weak ${dimension.replace(/([A-Z])/g, ' $1').toLowerCase()} (${data.score}/20)`);
        riskFactors.push(`Low ${dimension.replace(/([A-Z])/g, ' $1').toLowerCase()} may impact success`);
      }
    });
    
    // Generate recommendations based on weaknesses
    weaknesses.forEach(weakness => {
      if (weakness.includes('market opportunity')) {
        recommendations.push('Conduct comprehensive market research and validate demand');
      } else if (weakness.includes('innovation potential')) {
        recommendations.push('Explore novel solution approaches and competitive differentiation');
      } else if (weakness.includes('feasibility')) {
        recommendations.push('Develop phased implementation plan and secure necessary resources');
      } else if (weakness.includes('impact potential')) {
        recommendations.push('Define clear impact metrics and measurement framework');
      } else if (weakness.includes('india context')) {
        recommendations.push('Engage with local stakeholders and understand cultural context');
      } else if (weakness.includes('global relevance')) {
        recommendations.push('Assess international market potential and adaptation requirements');
      }
    });
    
    const summary = `Total IOS Score: ${totalScore}/100 - ${totalScore >= 70 ? 'High Opportunity' : totalScore >= 50 ? 'Moderate Opportunity' : 'Limited Opportunity'}`;
    
    return {
      summary,
      strengths,
      weaknesses,
      recommendations,
      riskFactors
    };
  }
}

// Helper functions for the framework
export const IOSHelpers = {
  // Convert legacy scoring to IOS framework
  convertLegacyScore(legacySubscores: {
    significance: number;
    solutionGap: number;
    marketPotential: number;
    technicalFeasibility: number;
    sdgAlignment: number;
  }): Partial<IOSAssessment> {
    return {
      dimensions: {
        marketOpportunity: {
          name: 'Market Opportunity',
          weight: 25,
          score: Math.round((legacySubscores.marketPotential * 20) / 20),
          subscores: {
            marketSize: legacySubscores.marketPotential * 0.3,
            marketMomentum: legacySubscores.marketPotential * 0.35,
            marketAccessibility: legacySubscores.marketPotential * 0.35
          },
          evidence: ['Legacy scoring conversion'],
          sources: []
        },
        innovationPotential: {
          name: 'Innovation Potential',
          weight: 20,
          score: Math.round((legacySubscores.solutionGap * 20) / 20),
          subscores: {
            solutionNovelty: legacySubscores.solutionGap * 0.35,
            technologyReadiness: legacySubscores.technicalFeasibility * 0.35,
            competitiveLandscape: legacySubscores.solutionGap * 0.3
          },
          evidence: ['Legacy scoring conversion'],
          sources: []
        },
        feasibility: {
          name: 'Feasibility',
          weight: 20,
          score: Math.round((legacySubscores.technicalFeasibility * 20) / 20),
          subscores: {
            technicalFeasibility: legacySubscores.technicalFeasibility * 0.4,
            financialFeasibility: legacySubscores.technicalFeasibility * 0.35,
            operationalFeasibility: legacySubscores.technicalFeasibility * 0.25
          },
          evidence: ['Legacy scoring conversion'],
          sources: []
        },
        impactPotential: {
          name: 'Impact Potential',
          weight: 15,
          score: Math.round((legacySubscores.significance * 20) / 20),
          subscores: {
            socialImpact: legacySubscores.significance * 0.4,
            environmentalImpact: legacySubscores.significance * 0.3,
            economicImpact: legacySubscores.significance * 0.3
          },
          evidence: ['Legacy scoring conversion'],
          sources: []
        },
        indiaContext: {
          name: 'India Context',
          weight: 10,
          score: Math.round((legacySubscores.sdgAlignment * 20) / 20),
          subscores: {
            marketReadiness: legacySubscores.sdgAlignment * 0.35,
            regulatoryEnvironment: legacySubscores.sdgAlignment * 0.35,
            innovationEcosystem: legacySubscores.sdgAlignment * 0.3
          },
          evidence: ['Legacy scoring conversion'],
          sources: []
        },
        globalRelevance: {
          name: 'Global Relevance',
          weight: 10,
          score: Math.round((legacySubscores.sdgAlignment * 20) / 20),
          subscores: {
            crossCulturalAdaptability: legacySubscores.sdgAlignment * 0.4,
            emergingMarketPotential: legacySubscores.sdgAlignment * 0.35,
            globalTrendAlignment: legacySubscores.sdgAlignment * 0.25
          },
          evidence: ['Legacy scoring conversion'],
          sources: []
        }
      },
      assessmentMode: 'hybrid',
      resourceTier: 'standard',
      culturalFactors: [],
      trendAnalysis: [],
      recommendations: []
    };
  },

  // Validate assessment data
  validateAssessment(assessment: IOSAssessment): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check if all dimensions are present
    const requiredDimensions = ['marketOpportunity', 'innovationPotential', 'feasibility', 'impactPotential', 'indiaContext', 'globalRelevance'];
    requiredDimensions.forEach(dim => {
      if (!assessment.dimensions[dim as keyof typeof assessment.dimensions]) {
        errors.push(`Missing dimension: ${dim}`);
      }
    });
    
    // Validate scores are within range
    Object.entries(assessment.dimensions).forEach(([dimension, data]) => {
      if (data.score < 0 || data.score > 20) {
        errors.push(`Invalid score for ${dimension}: ${data.score} (must be 0-20)`);
      }
    });
    
    // Validate sources
    Object.entries(assessment.dimensions).forEach(([dimension, data]) => {
      data.sources.forEach((source, index) => {
        if (!IOSFrameworkService.validateSource(source)) {
          errors.push(`Invalid source ${index + 1} in ${dimension}`);
        }
      });
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}; 