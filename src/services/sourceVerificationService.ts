export interface SourceVerificationTier {
  tier: 1 | 2 | 3 | 4 | 5;
  name: string;
  description: string;
  examples: string[];
  verificationRequirements: string[];
  qualityStandards: string[];
  credibilityScore: number;
  biasRisk: 'low' | 'medium' | 'high';
  recommendedUse: string[];
}

export interface VerifiedSource {
  id: string;
  title: string;
  url: string;
  tier: 1 | 2 | 3 | 4 | 5;
  sourceType: string;
  publicationDate?: string;
  author?: string;
  organization?: string;
  verificationStatus: 'pending' | 'verified' | 'flagged' | 'rejected';
  biasScore: number; // 0-100, higher = less bias
  credibilityScore: number; // 0-100, based on tier and verification
  notes?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  evidence: string[];
  culturalContext?: string;
  regionalRelevance?: string;
}

export interface SourceVerificationResult {
  overallScore: number;
  tierBreakdown: Record<number, number>;
  biasAnalysis: {
    averageBias: number;
    biasDistribution: Record<string, number>;
  };
  credibilityAnalysis: {
    averageCredibility: number;
    tierCredibility: Record<number, number>;
  };
  recommendations: string[];
  warnings: string[];
}

// Comprehensive Tier 1-5 Source Verification Framework
export const SOURCE_VERIFICATION_TIERS: SourceVerificationTier[] = [
  {
    tier: 1,
    name: 'Highest Credibility',
    description: 'Government agencies, UN/World Bank, peer-reviewed journals, McKinsey/BCG',
    examples: [
      'Government of India - Ministry of Statistics and Programme Implementation',
      'United Nations Development Programme (UNDP)',
      'World Bank Group Reports',
      'McKinsey Global Institute',
      'Boston Consulting Group (BCG)',
      'Nature, Science, The Lancet (peer-reviewed journals)',
      'Reserve Bank of India (RBI)',
      'NITI Aayog Reports',
      'International Monetary Fund (IMF)',
      'World Health Organization (WHO)',
      'International Labour Organization (ILO)',
      'United Nations Educational, Scientific and Cultural Organization (UNESCO)',
      'World Trade Organization (WTO)',
      'International Energy Agency (IEA)',
      'Food and Agriculture Organization (FAO)'
    ],
    verificationRequirements: [
      'Direct citation with exact URL',
      'Currency verification (within 2 years)',
      'Methodology review and validation',
      'Source authority confirmation',
      'Cross-reference with official databases'
    ],
    qualityStandards: [
      'Highest credibility standards',
      'Rigorous methodology requirements',
      'Independent validation processes',
      'Peer review for academic sources',
      'Government oversight and accountability'
    ],
    credibilityScore: 95,
    biasRisk: 'low',
    recommendedUse: [
      'Primary evidence for high-stakes decisions',
      'Regulatory compliance documentation',
      'Academic research and publications',
      'Policy development and advocacy',
      'Investment and funding decisions'
    ]
  },
  {
    tier: 2,
    name: 'High Credibility',
    description: 'Industry associations, research institutes, established market research firms',
    examples: [
      'Confederation of Indian Industry (CII)',
      'Federation of Indian Chambers of Commerce and Industry (FICCI)',
      'Associated Chambers of Commerce and Industry of India (ASSOCHAM)',
      'National Association of Software and Service Companies (NASSCOM)',
      'Indian Council for Research on International Economic Relations (ICRIER)',
      'Centre for Policy Research (CPR)',
      'Observer Research Foundation (ORF)',
      'Brookings Institution India',
      'Pew Research Center',
      'Gallup International',
      'Deloitte Insights',
      'PwC Research',
      'KPMG Reports',
      'EY Global Insights',
      'Accenture Research',
      'IBM Institute for Business Value',
      'Microsoft Research',
      'Google Research',
      'Stanford Research Institute',
      'MIT Technology Review'
    ],
    verificationRequirements: [
      'Source verification and methodology assessment',
      'Bias evaluation and disclosure review',
      'Organization reputation check',
      'Methodology transparency review',
      'Expert consultation validation'
    ],
    qualityStandards: [
      'High credibility standards',
      'Established methodology frameworks',
      'Professional standards compliance',
      'Industry best practices',
      'Regular quality audits'
    ],
    credibilityScore: 85,
    biasRisk: 'low',
    recommendedUse: [
      'Market analysis and business planning',
      'Industry trend analysis',
      'Competitive intelligence',
      'Strategic planning and decision-making',
      'Professional presentations and reports'
    ]
  },
  {
    tier: 3,
    name: 'Moderate Credibility',
    description: 'University research, specialized consultancies, recognized think tanks',
    examples: [
      'Indian Institutes of Technology (IITs)',
      'Indian Institutes of Management (IIMs)',
      'Delhi University Research',
      'Mumbai University Studies',
      'Bangalore University Research',
      'Tata Institute of Social Sciences (TISS)',
      'National Institute of Public Finance and Policy (NIPFP)',
      'Institute for Human Development (IHD)',
      'Centre for Science and Environment (CSE)',
      'The Energy and Resources Institute (TERI)',
      'Development Alternatives',
      'PRADAN (Professional Assistance for Development Action)',
      'SELCO Foundation',
      'Gram Vikas',
      'BAIF Development Research Foundation',
      'International Crops Research Institute for the Semi-Arid Tropics (ICRISAT)',
      'International Rice Research Institute (IRRI)',
      'International Maize and Wheat Improvement Center (CIMMYT)',
      'International Food Policy Research Institute (IFPRI)',
      'International Water Management Institute (IWMI)'
    ],
    verificationRequirements: [
      'Academic review and methodology evaluation',
      'Peer validation and expert consultation',
      'Institution reputation assessment',
      'Research methodology transparency',
      'Conflict of interest disclosure review'
    ],
    qualityStandards: [
      'Moderate credibility standards',
      'Academic standards compliance',
      'Peer review processes',
      'Methodology transparency',
      'Expert oversight'
    ],
    credibilityScore: 75,
    biasRisk: 'medium',
    recommendedUse: [
      'Academic research and studies',
      'Specialized sector analysis',
      'Development program evaluation',
      'Policy research and analysis',
      'Educational and training materials'
    ]
  },
  {
    tier: 4,
    name: 'Contextual Credibility',
    description: 'Expert interviews, community leaders, pilot program results',
    examples: [
      'Expert interviews with domain specialists',
      'Community leader testimonials',
      'Pilot program evaluation reports',
      'Case study documentation',
      'Field research findings',
      'Stakeholder consultation reports',
      'Focus group study results',
      'User experience research',
      'Participatory rural appraisal (PRA)',
      'Rapid rural appraisal (RRA)',
      'Community-based monitoring',
      'Local knowledge documentation',
      'Indigenous knowledge systems',
      'Traditional practice documentation',
      'Local innovation case studies',
      'Grassroots organization reports',
      'Self-help group documentation',
      'Microfinance institution studies',
      'Social enterprise case studies',
      'Community development project reports'
    ],
    verificationRequirements: [
      'Source assessment and methodology review',
      'Bias detection and mitigation',
      'Context validation and verification',
      'Expert consultation and validation',
      'Cross-reference with other sources'
    ],
    qualityStandards: [
      'Contextual credibility standards',
      'Bias awareness and mitigation',
      'Methodology transparency',
      'Expert validation',
      'Context sensitivity'
    ],
    credibilityScore: 65,
    biasRisk: 'medium',
    recommendedUse: [
      'Community engagement and participation',
      'Local context understanding',
      'Cultural sensitivity analysis',
      'Stakeholder consultation',
      'Participatory development planning'
    ]
  },
  {
    tier: 5,
    name: 'Supporting Evidence',
    description: 'News sources, blog posts, anecdotal evidence',
    examples: [
      'The Hindu',
      'The Times of India',
      'Hindustan Times',
      'The Indian Express',
      'Business Standard',
      'Economic Times',
      'Mint',
      'Livemint',
      'Scroll.in',
      'The Wire',
      'Newslaundry',
      'The Quint',
      'YourStory',
      'Inc42',
      'TechCrunch India',
      'VentureBeat',
      'Medium articles',
      'LinkedIn posts',
      'Twitter/X discussions',
      'Reddit community discussions',
      'Quora answers',
      'YouTube content',
      'Podcast discussions',
      'Webinar recordings',
      'Conference presentations',
      'Workshop documentation',
      'Meetup group discussions',
      'Online forum discussions',
      'Social media trends',
      'Crowdsourced information',
      'Anecdotal evidence'
    ],
    verificationRequirements: [
      'Multiple source verification',
      'Bias assessment and evaluation',
      'Context evaluation and validation',
      'Fact-checking and cross-reference',
      'Source credibility assessment'
    ],
    qualityStandards: [
      'Lower credibility standards',
      'Requires triangulation',
      'Context-dependent validation',
      'Bias awareness essential',
      'Supporting evidence role'
    ],
    credibilityScore: 45,
    biasRisk: 'high',
    recommendedUse: [
      'Supporting evidence and context',
      'Trend identification and monitoring',
      'Public opinion and sentiment analysis',
      'Awareness and engagement building',
      'Initial research and exploration'
    ]
  }
];

export class SourceVerificationService {
  
  // Get tier information by tier number
  static getTierInfo(tier: number): SourceVerificationTier | undefined {
    return SOURCE_VERIFICATION_TIERS.find(t => t.tier === tier);
  }

  // Validate source against tier requirements
  static validateSource(source: VerifiedSource): {
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const tierInfo = this.getTierInfo(source.tier);
    if (!tierInfo) {
      return {
        isValid: false,
        issues: ['Invalid tier number'],
        recommendations: ['Select a valid tier (1-5)']
      };
    }

    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check basic requirements
    if (!source.title || source.title.trim().length === 0) {
      issues.push('Source title is required');
    }

    if (!source.url || !this.isValidUrl(source.url)) {
      issues.push('Valid URL is required');
    }

    // Check tier-specific requirements
    if (source.tier === 1) {
      if (!source.organization) {
        issues.push('Organization name is required for Tier 1 sources');
        recommendations.push('Add the official organization name');
      }
      if (!source.publicationDate) {
        issues.push('Publication date is required for Tier 1 sources');
        recommendations.push('Add the publication date');
      }
    }

    if (source.tier <= 2) {
      if (source.biasScore < 70) {
        issues.push('High-tier sources should have low bias scores');
        recommendations.push('Review and adjust bias assessment');
      }
    }

    // Check verification status
    if (source.verificationStatus === 'flagged') {
      issues.push('Source has been flagged for review');
      recommendations.push('Review source credibility and address concerns');
    }

    return {
      isValid: issues.length === 0,
      issues,
      recommendations
    };
  }

  // Calculate overall verification score
  static calculateVerificationScore(sources: VerifiedSource[]): SourceVerificationResult {
    if (sources.length === 0) {
      return {
        overallScore: 0,
        tierBreakdown: {},
        biasAnalysis: { averageBias: 0, biasDistribution: {} },
        credibilityAnalysis: { averageCredibility: 0, tierCredibility: {} },
        recommendations: ['Add sources to begin verification assessment'],
        warnings: ['No sources available for verification']
      };
    }

    // Calculate tier breakdown
    const tierBreakdown: Record<number, number> = {};
    const tierCredibility: Record<number, number> = {};
    const biasDistribution: Record<string, number> = { low: 0, medium: 0, high: 0 };

    sources.forEach(source => {
      tierBreakdown[source.tier] = (tierBreakdown[source.tier] || 0) + 1;
      
      const tierInfo = this.getTierInfo(source.tier);
      if (tierInfo) {
        tierCredibility[source.tier] = tierInfo.credibilityScore;
      }

      // Categorize bias
      if (source.biasScore >= 80) biasDistribution.low++;
      else if (source.biasScore >= 60) biasDistribution.medium++;
      else biasDistribution.high++;
    });

    // Calculate weighted scores
    const totalWeightedScore = sources.reduce((sum, source) => {
      const tierInfo = this.getTierInfo(source.tier);
      const tierWeight = tierInfo ? tierInfo.credibilityScore / 100 : 0.5;
      const biasWeight = source.biasScore / 100;
      return sum + (tierWeight * biasWeight * 100);
    }, 0);

    const overallScore = Math.round(totalWeightedScore / sources.length);

    // Calculate averages
    const averageBias = Math.round(sources.reduce((sum, s) => sum + s.biasScore, 0) / sources.length);
    const averageCredibility = Math.round(sources.reduce((sum, s) => sum + s.credibilityScore, 0) / sources.length);

    // Generate recommendations and warnings
    const recommendations: string[] = [];
    const warnings: string[] = [];

    if (overallScore < 70) {
      recommendations.push('Consider adding higher-tier sources to improve credibility');
    }

    if (averageBias < 60) {
      warnings.push('High bias detected across sources - review for objectivity');
      recommendations.push('Seek sources with lower bias scores or diverse perspectives');
    }

    if (tierBreakdown[5] > sources.length * 0.5) {
      warnings.push('Heavy reliance on Tier 5 sources may reduce credibility');
      recommendations.push('Balance with higher-tier sources for better credibility');
    }

    if (sources.length < 3) {
      recommendations.push('Add more sources for comprehensive verification');
    }

    return {
      overallScore,
      tierBreakdown,
      biasAnalysis: {
        averageBias,
        biasDistribution
      },
      credibilityAnalysis: {
        averageCredibility,
        tierCredibility
      },
      recommendations,
      warnings
    };
  }

  // Suggest sources based on problem context
  static suggestSources(problemContext: string, sector: string): {
    tier1: string[];
    tier2: string[];
    tier3: string[];
    tier4: string[];
    tier5: string[];
  } {
    const suggestions = {
      tier1: [] as string[],
      tier2: [] as string[],
      tier3: [] as string[],
      tier4: [] as string[],
      tier5: [] as string[]
    };

    // Add relevant government sources
    if (sector.toLowerCase().includes('health') || problemContext.toLowerCase().includes('health')) {
      suggestions.tier1.push('Ministry of Health and Family Welfare - Government of India');
      suggestions.tier1.push('World Health Organization (WHO)');
    }

    if (sector.toLowerCase().includes('education') || problemContext.toLowerCase().includes('education')) {
      suggestions.tier1.push('Ministry of Education - Government of India');
      suggestions.tier1.push('United Nations Educational, Scientific and Cultural Organization (UNESCO)');
    }

    if (sector.toLowerCase().includes('agriculture') || problemContext.toLowerCase().includes('agriculture')) {
      suggestions.tier1.push('Ministry of Agriculture and Farmers Welfare');
      suggestions.tier1.push('Food and Agriculture Organization (FAO)');
    }

    // Add industry associations
    if (sector.toLowerCase().includes('technology') || problemContext.toLowerCase().includes('technology')) {
      suggestions.tier2.push('National Association of Software and Service Companies (NASSCOM)');
      suggestions.tier2.push('Confederation of Indian Industry (CII) - Technology Division');
    }

    if (sector.toLowerCase().includes('finance') || problemContext.toLowerCase().includes('finance')) {
      suggestions.tier2.push('Reserve Bank of India (RBI)');
      suggestions.tier2.push('Securities and Exchange Board of India (SEBI)');
    }

    // Add academic sources
    suggestions.tier3.push('Indian Institutes of Technology (IITs) - Relevant Research');
    suggestions.tier3.push('Indian Institutes of Management (IIMs) - Case Studies');

    // Add community sources
    suggestions.tier4.push('Local community leader interviews');
    suggestions.tier4.push('Field research and pilot program results');

    // Add news and media sources
    suggestions.tier5.push('The Hindu - Business Line');
    suggestions.tier5.push('Economic Times');
    suggestions.tier5.push('Business Standard');

    return suggestions;
  }

  // Validate URL format
  private static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // Get tier color for UI display
  static getTierColor(tier: number): string {
    switch (tier) {
      case 1: return 'bg-green-500 text-green-800 border-green-200';
      case 2: return 'bg-blue-500 text-blue-800 border-blue-200';
      case 3: return 'bg-yellow-500 border-yellow-200';
      case 4: return 'bg-orange-500 text-orange-800 border-orange-200';
      case 5: return 'bg-red-500 text-red-800 border-red-200';
      default: return 'bg-gray-500 text-gray-800 border-gray-200';
    }
  }

  // Get bias color for UI display
  static getBiasColor(score: number): string {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  }

  // Generate source verification report
  static generateVerificationReport(sources: VerifiedSource[]): {
    summary: string;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    nextSteps: string[];
  } {
    const result = this.calculateVerificationScore(sources);
    
    const summary = `Verification Score: ${result.overallScore}/100 based on ${sources.length} sources`;
    
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    
    if (result.overallScore >= 80) {
      strengths.push('High overall verification score');
    } else if (result.overallScore < 60) {
      weaknesses.push('Low verification score - credibility concerns');
    }
    
    if (result.biasAnalysis.averageBias >= 75) {
      strengths.push('Low bias across sources');
    } else {
      weaknesses.push('High bias detected - objectivity concerns');
    }
    
    const tier1Count = result.tierBreakdown[1] || 0;
    if (tier1Count > 0) {
      strengths.push(`Includes ${tier1Count} highest-tier sources`);
    }
    
    if (result.tierBreakdown[5] > sources.length * 0.5) {
      weaknesses.push('Over-reliance on lower-tier sources');
    }
    
    const nextSteps = [
      'Review and address any warnings',
      'Consider adding higher-tier sources if score is low',
      'Validate all source URLs and information',
      'Update sources with current information',
      'Seek expert review for critical assessments'
    ];
    
    return {
      summary,
      strengths,
      weaknesses,
      recommendations: result.recommendations,
      nextSteps
    };
  }
} 