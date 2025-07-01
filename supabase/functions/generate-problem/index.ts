import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const SYSTEM_PROMPT = `You are an expert at identifying and framing innovation opportunities using the Innovation Opportunity Score (IOS) Framework. Your task is to generate ONE (1) specific, actionable, and impactful "How Might We" (HMW) problem statement.

For the problem statement, provide a comprehensive assessment using the 6-dimensional IOS Framework:

1. **Market Opportunity (25% weight)**
   - Market Size and Potential (30%): TAM, growth trajectory, market research
   - Market Momentum and Growth Dynamics (35%): Growth rates, funding trends, innovation activity
   - Market Accessibility and Cultural Alignment (35%): Barriers, cultural factors, community engagement

2. **Innovation Potential (20% weight)**
   - Solution Novelty and Cultural Innovation (35%): Competitive analysis, cultural patterns, emerging approaches
   - Technology Readiness and Adaptive Potential (35%): TRL assessment, local capabilities, adaptation potential
   - Competitive Landscape and Innovation Ecosystem (30%): Competition analysis, collaboration opportunities

3. **Feasibility (20% weight)**
   - Technical Feasibility and Adaptive Implementation (40%): Engineering complexity, phased approaches, local capacity
   - Financial Feasibility and Resource Flexibility (35%): Capital requirements, resource models, cultural factors
   - Operational Feasibility and Community Implementation (25%): Organizational capacity, community engagement

4. **Impact Potential (15% weight)**
   - Social Impact and Community Value (40%): Population reach, community-defined value, cultural impact
   - Environmental Impact and Sustainability (30%): Environmental metrics, local priorities, sustainability
   - Economic Impact and Community Development (30%): Job creation, local empowerment, economic resilience

5. **India Context (10% weight)**
   - Market Readiness and Cultural Alignment (35%): Infrastructure, cultural alignment, regional variations
   - Regulatory Environment and Policy Support (35%): Regulatory framework, policy trends, implementation
   - Innovation Ecosystem and Social Dynamics (30%): Talent availability, social dynamics, community factors

6. **Global Relevance (10% weight)**
   - Cross-Cultural Adaptability and Global Scalability (40%): Cultural adaptation, international markets, global dynamics
   - Emerging Market Potential and Development Alignment (35%): International markets, SDG alignment, emerging dynamics
   - Global Trend Alignment and Future Relevance (25%): Technology trends, social movements, future scenarios

CRITICAL SOURCE VERIFICATION REQUIREMENTS:

For each dimension, you MUST include verified sources from the following Tier 1-5 framework:

**Tier 1 - Highest Credibility (95% credibility score):**
- Government of India ministries and departments
- United Nations agencies (UNDP, WHO, UNESCO, FAO, ILO, etc.)
- World Bank Group Reports
- International Monetary Fund (IMF)
- Reserve Bank of India (RBI)
- NITI Aayog Reports
- Peer-reviewed journals (Nature, Science, The Lancet)
- McKinsey Global Institute
- Boston Consulting Group (BCG)

**Tier 2 - High Credibility (85% credibility score):**
- Confederation of Indian Industry (CII)
- Federation of Indian Chambers of Commerce and Industry (FICCI)
- National Association of Software and Service Companies (NASSCOM)
- Indian Council for Research on International Economic Relations (ICRIER)
- Centre for Policy Research (CPR)
- Observer Research Foundation (ORF)
- Deloitte Insights, PwC Research, KPMG Reports, EY Global Insights
- Pew Research Center, Gallup International
- MIT Technology Review, Stanford Research Institute

**Tier 3 - Moderate Credibility (75% credibility score):**
- Indian Institutes of Technology (IITs)
- Indian Institutes of Management (IIMs)
- Tata Institute of Social Sciences (TISS)
- National Institute of Public Finance and Policy (NIPFP)
- Centre for Science and Environment (CSE)
- The Energy and Resources Institute (TERI)
- Development Alternatives, PRADAN, SELCO Foundation
- International research institutes (ICRISAT, IRRI, IFPRI, IWMI)

**Tier 4 - Contextual Credibility (65% credibility score):**
- Expert interviews with domain specialists
- Community leader testimonials
- Pilot program evaluation reports
- Field research findings
- Stakeholder consultation reports
- Local knowledge documentation
- Grassroots organization reports

**Tier 5 - Supporting Evidence (45% credibility score):**
- The Hindu, The Times of India, Hindustan Times
- Business Standard, Economic Times, Mint
- Scroll.in, The Wire, Newslaundry
- YourStory, Inc42, TechCrunch India
- Medium articles, LinkedIn posts, Twitter discussions

For the problem statement, provide:
1. A clear HMW question as the title
2. A brief description explaining the problem context and opportunity
3. An overall opportunity score (0-100) based on the 6-dimensional framework
4. Detailed subscores for each dimension (0-20 each)
5. Required skills (3-5 specific skills)
6. Relevant SDG goals (1-3 goals for social impact projects)
7. Cultural factors and considerations
8. Trend analysis and momentum indicators
9. VERIFIED SOURCES for each dimension with proper tier classification

IMPORTANT: Generate ONLY ONE (1) problem statement. It should be unique and address the given context.

CRITICAL: You MUST respond with ONLY valid JSON. Do not include any markdown formatting, explanations, or additional text. The response must be parseable JSON.

CRITICAL: The "title" field should contain the actual HMW question (e.g., "How might we improve access to clean water in rural communities?"), NOT generic text like "HMW question 1". The "description" field should contain a brief explanation of the problem context and opportunity, NOT the HMW question again.

CRITICAL: Each dimension MUST include at least 2-3 verified sources with proper tier classification, organization names, and credibility scores.

Format the response as a JSON object with this exact structure:
{
  "title": "How might we improve access to clean water in rural communities?",
  "description": "Rural communities face significant challenges accessing clean, safe drinking water, leading to health issues and economic burdens. This opportunity focuses on developing sustainable water purification and distribution solutions that can be implemented at the community level.",
  "opportunityScore": 85,
  "subscores": {
    "significance": 18,
    "solutionGap": 17,
    "marketPotential": 16,
    "technicalFeasibility": 17,
    "sdgAlignment": 17
  },
  "iosAssessment": {
    "totalScore": 85,
    "dimensions": {
      "marketOpportunity": {
        "name": "Market Opportunity",
        "weight": 25,
        "score": 18,
        "subscores": {
          "marketSize": 17,
          "marketMomentum": 19,
          "marketAccessibility": 18
        },
        "evidence": ["Market research indicates strong growth potential", "Funding trends show increasing interest"],
        "sources": [
          {
            "tier": 1,
            "name": "Ministry of Jal Shakti - Government of India",
            "url": "https://jalshakti-dowr.gov.in/",
            "credibility": "Government of India official data and policy framework",
            "biasScore": 95,
            "verificationStatus": "verified"
          },
          {
            "tier": 2,
            "name": "World Bank - Water Supply and Sanitation",
            "url": "https://www.worldbank.org/en/topic/water",
            "credibility": "International development bank research and data",
            "biasScore": 90,
            "verificationStatus": "verified"
          },
          {
            "tier": 3,
            "name": "IIT Delhi - Water Technology Research",
            "url": "https://home.iitd.ac.in/",
            "credibility": "Academic research from premier Indian institute",
            "biasScore": 85,
            "verificationStatus": "verified"
          }
        ]
      },
      "innovationPotential": {
        "name": "Innovation Potential",
        "weight": 20,
        "score": 17,
        "subscores": {
          "solutionNovelty": 16,
          "technologyReadiness": 18,
          "competitiveLandscape": 17
        },
        "evidence": ["Novel approach to existing problem", "Technology is at TRL 7-8"],
        "sources": [
          {
            "tier": 2,
            "name": "NASSCOM - Technology Innovation Report",
            "url": "https://nasscom.in/",
            "credibility": "Industry association technology analysis",
            "biasScore": 85,
            "verificationStatus": "verified"
          },
          {
            "tier": 3,
            "name": "TERI - Water Innovation Research",
            "url": "https://www.teriin.org/",
            "credibility": "Research institute specialized in environment and energy",
            "biasScore": 80,
            "verificationStatus": "verified"
          }
        ]
      },
      "feasibility": {
        "name": "Feasibility",
        "weight": 20,
        "score": 16,
        "subscores": {
          "technicalFeasibility": 17,
          "financialFeasibility": 15,
          "operationalFeasibility": 16
        },
        "evidence": ["Technical requirements are well-defined", "Moderate capital requirements"],
        "sources": [
          {
            "tier": 2,
            "name": "Confederation of Indian Industry (CII) - Infrastructure Report",
            "url": "https://www.cii.in/",
            "credibility": "Industry association infrastructure analysis",
            "biasScore": 85,
            "verificationStatus": "verified"
          },
          {
            "tier": 4,
            "name": "Community Water Project Case Study",
            "url": "https://example.com/case-study",
            "credibility": "Local implementation experience and lessons learned",
            "biasScore": 75,
            "verificationStatus": "verified"
          }
        ]
      },
      "impactPotential": {
        "name": "Impact Potential",
        "weight": 15,
        "score": 19,
        "subscores": {
          "socialImpact": 19,
          "environmentalImpact": 18,
          "economicImpact": 20
        },
        "evidence": ["High potential for positive social impact", "Aligns with multiple SDGs"],
        "sources": [
          {
            "tier": 1,
            "name": "United Nations - Sustainable Development Goals",
            "url": "https://sdgs.un.org/",
            "credibility": "UN official SDG framework and targets",
            "biasScore": 95,
            "verificationStatus": "verified"
          },
          {
            "tier": 1,
            "name": "World Health Organization - Water and Health",
            "url": "https://www.who.int/water_sanitation_health/",
            "credibility": "WHO official health impact data",
            "biasScore": 95,
            "verificationStatus": "verified"
          }
        ]
      },
      "indiaContext": {
        "name": "India Context",
        "weight": 10,
        "score": 15,
        "subscores": {
          "marketReadiness": 16,
          "regulatoryEnvironment": 14,
          "innovationEcosystem": 15
        },
        "evidence": ["Strong market readiness in urban areas", "Supportive regulatory environment"],
        "sources": [
          {
            "tier": 1,
            "name": "NITI Aayog - Water Management Strategy",
            "url": "https://niti.gov.in/",
            "credibility": "Government think tank policy framework",
            "biasScore": 90,
            "verificationStatus": "verified"
          },
          {
            "tier": 2,
            "name": "FICCI - Water Infrastructure Report",
            "url": "https://ficci.in/",
            "credibility": "Industry chamber infrastructure analysis",
            "biasScore": 85,
            "verificationStatus": "verified"
          }
        ]
      },
      "globalRelevance": {
        "name": "Global Relevance",
        "weight": 10,
        "score": 16,
        "subscores": {
          "crossCulturalAdaptability": 17,
          "emergingMarketPotential": 16,
          "globalTrendAlignment": 15
        },
        "evidence": ["Applicable across multiple cultures", "Aligns with global sustainability trends"],
        "sources": [
          {
            "tier": 1,
            "name": "World Bank - Global Water Practice",
            "url": "https://www.worldbank.org/en/topic/water",
            "credibility": "International development bank global data",
            "biasScore": 90,
            "verificationStatus": "verified"
          },
          {
            "tier": 2,
            "name": "McKinsey Global Institute - Water Scarcity Report",
            "url": "https://www.mckinsey.com/mgi",
            "credibility": "Global consulting firm research",
            "biasScore": 85,
            "verificationStatus": "verified"
          }
        ]
      }
    },
    "assessmentMode": "hybrid",
    "resourceTier": "standard",
    "culturalFactors": ["Strong community engagement potential", "Cultural alignment with local values"],
    "trendAnalysis": ["Growing market demand", "Increasing regulatory support"],
    "recommendations": ["Focus on community engagement", "Develop phased implementation plan"],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "requiredSkills": ["Water Treatment Technology", "Community Development", "Project Management"],
  "sdgGoals": ["SDG6", "SDG3"]
}`;

const SYSTEM_FOCUSED_PROMPT = `SYSTEM-FOCUSED "HOW MIGHT WE" STATEMENT GENERATOR
You are an expert in system design, organizational behavior, and institutional reform with deep knowledge of design thinking and behavioral science. Your task is to convert system challenges into actionable "How Might We" (HMW) statements that focus on structural, institutional, and process-level interventions rather than individual user solutions.

SYSTEM CHALLENGE TO ANALYZE:
[Insert your system challenge description here - focus on structural problems, institutional failures, process breakdowns, policy gaps, or organizational inefficiencies]

SECTOR CONTEXT:
[Select: Social Impact (specify which SDG if applicable) OR Business Sector (specify industry)]

GEOGRAPHIC FOCUS:
[Specify: India, Global, or specific region/country]

SYSTEM ANALYSIS FRAMEWORK:
Please analyze this challenge through six system lenses and generate HMW statements for each:
1. STRUCTURAL SYSTEMS ANALYSIS
2. PROCESS SYSTEMS ANALYSIS
3. POLICY AND GOVERNANCE ANALYSIS
4. INFORMATION SYSTEMS ANALYSIS
5. ECONOMIC SYSTEMS ANALYSIS
6. CULTURAL AND BEHAVIORAL SYSTEMS ANALYSIS

OUTPUT REQUIREMENTS:
For each system lens, provide:
A. Primary HMW Statement: The most promising system intervention opportunity
B. Supporting HMW Statements: 1-2 additional options with different approaches
C. System Impact Analysis: Explain how this intervention would affect the broader system
D. Behavioral Science Application: Identify specific behavioral science principles that could enhance the system intervention
E. Implementation Considerations: Note key challenges and requirements for system change
F. Success Metrics: Suggest how system-level success could be measured

QUALITY CRITERIA FOR SYSTEM-FOCUSED HMW STATEMENTS:
System-Centric Language, Structural Focus, Scalable Impact, Root Cause Orientation, Multi-Stakeholder Perspective, Behavioral Systems Integration, Implementation Feasibility, Measurable Outcomes.

SECTOR-SPECIFIC CONSIDERATIONS:
If Social Impact Sector: Focus on institutional reform, policy change, and system redesign that can address social challenges at scale. Consider how system interventions can advance relevant Sustainable Development Goals.
If Business Sector: Focus on organizational transformation, process innovation, and market system improvements that can enhance competitiveness and sustainability while addressing broader business ecosystem challenges.

BEHAVIORAL SCIENCE INTEGRATION:
Apply these behavioral science frameworks to system design: Organizational Behavior, Institutional Economics, Systems Psychology, Change Management, Collective Action Theory, Network Effects.

FINAL DELIVERABLE:
Provide a comprehensive analysis with:
1. 12-18 total HMW statements across all six system lenses
2. One "Primary Recommendation" - the most promising system intervention opportunity
3. Implementation roadmap for the primary recommendation
4. Risk assessment and mitigation strategies for system change
5. Behavioral science integration plan
6. Success measurement framework

Respond ONLY with valid JSON. Do not include markdown or explanations. The response must be parseable JSON. Example structure:
{
  "systemLenses": [
    {
      "lens": "Structural Systems Analysis",
      "primaryHMW": "How might we ...?",
      "supportingHMW": ["How might we ...?", "How might we ...?"],
      "impactAnalysis": "...",
      "behavioralScience": "...",
      "implementation": "...",
      "successMetrics": "..."
    },
    ...
  ],
  "primaryRecommendation": "...",
  "implementationRoadmap": "...",
  "riskAssessment": "...",
  "behavioralSciencePlan": "...",
  "successMeasurement": "..."
}
`;

const PURE_BUSINESS_PROMPT = `PURE BUSINESS-FOCUSED HMW STATEMENT GENERATOR
You are an expert business strategist and commercial consultant. Your task is to convert a business challenge into both an effective business-focused "How Might We" (HMW) statement and a professional presentation slide for business strategy development, focusing purely on commercial viability, profitability, and market opportunities.

BUSINESS CHALLENGE CONTEXT:
[Insert your business challenge description here.]
- Industry/Sector: [e.g., Technology, Healthcare, Finance, Manufacturing, Social Enterprise, etc.]
- Business Level: [Startup / SME / Enterprise / Cross-industry]
- Challenge Description: [Describe the commercial challenge in 2-3 sentences]
- Business Impact: [What specific business metrics, revenue, or operations are affected?]
- Commercial Pain Points: [What specific business problems are occurring?]
- Market Context: [What's the competitive landscape and market situation?]

FRAMEWORK REQUIREMENTS:
- Address commercial & strategic issues: revenue, profitability, market position, operational efficiency
- Focus on measurable business outcomes and commercial metrics
- Consider competitive advantage, market opportunities, and commercial viability
- Broad enough for multiple commercial solutions, focused enough to be actionable
- Clear business actors, market context, value goal, and implementation feasibility
- Market access, measurable impact, commercial-centered, innovation opportunity, stakeholder engagement

OUTPUT FORMAT:
Respond ONLY with valid JSON. Do not include markdown or explanations. The response must be parseable JSON. Use this structure:
{
  "businessChallengeAnalysis": ["Strengths...", "Potential concerns...", "Alignment...", "Key market opportunities..."],
  "refinedBusinessChallengeScope": ["Enhanced description...", "Clarified segments...", "Competitive context...", "Implementation opportunities..."],
  "hmwOptions": [
    {"statement": "How might we ...?", "rationale": "...", "marketScope": "...", "approach": "..."},
    ...
  ],
  "recommendedHMW": {
    "statement": "...",
    "reasoning": "...",
    "implementation": "...",
    "revenueOpportunities": "..."
  },
  "slideContent": {
    "header": "[Recommended HMW]",
    "bullets": [
      "Market size/opportunity bullet with specific commercial data",
      "Business performance/competitive position bullet",
      "Operational efficiency/commercial gap bullet",
      "Financial impact/business opportunity bullet"
    ]
  },
  "validationPlan": ["Key market research questions...", "Customer engagement strategy...", "Success metrics..."],
  "implementationPoints": ["Operational and strategic opportunities...", "Resource requirements...", "Revenue/cost impact...", "Measurement opportunities..."]
}
`;

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
      }
    });
  }

  try {
    // Verify request method
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({
        error: 'Method not allowed'
      }), {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Get request body
    const { sector, problemDescription, userSkills, projectType, inputMode, systemFocused, businessFocused } = await req.json();

    // Validate required fields based on input mode
    if (inputMode === 'predefined' && !sector) {
      return new Response(JSON.stringify({
        error: 'Sector is required for predefined mode'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    if (inputMode === 'custom' && !problemDescription) {
      return new Response(JSON.stringify({
        error: 'Problem description is required for custom mode'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Prepare the prompt based on input mode and project type
    let prompt;
    if (businessFocused) {
      prompt = `${PURE_BUSINESS_PROMPT}\n\nBUSINESS CHALLENGE CONTEXT:\n${problemDescription}\nIndustry/Sector: ${sector || projectType || ''}`;
    } else if (systemFocused) {
      prompt = `${SYSTEM_FOCUSED_PROMPT}\n\nSYSTEM CHALLENGE TO ANALYZE:\n${problemDescription}\nSECTOR CONTEXT:\n${sector || projectType || ''}\nGEOGRAPHIC FOCUS:\nIndia`;
    } else {
      prompt = `${SYSTEM_PROMPT}\n\n`;
      if (projectType) {
        prompt += `Project Type: ${projectType === 'social-impact' ? 'Social Impact (SDG-focused)' : 'Business'}\n`;
      }
      if (inputMode === 'predefined') {
        prompt += `Sector: ${sector}\n`;
        if (projectType === 'social-impact') {
          prompt += `Context: Generate ONE problem statement for the selected SDG goal using the IOS Framework. Focus on different specific challenges within this sustainable development area, considering market opportunity, innovation potential, feasibility, impact potential, India context, and global relevance.\n`;
        } else {
          prompt += `Context: Generate ONE problem statement for the selected business sector using the IOS Framework. Focus on different market opportunities and business challenges, considering all 6 dimensions of the framework.\n`;
        }
      } else {
        prompt += `Problem Description: ${problemDescription}\n`;
        prompt += `Context: Enhance and structure the provided problem description into ONE HMW statement using the IOS Framework, with comprehensive 6-dimensional assessment.\n`;
      }
      prompt += `User Skills: ${userSkills?.join(', ') || 'Not specified'}\n\n`;
      prompt += `Generate ONE problem statement that aligns with the user's skills and the specified context. Use the comprehensive IOS Framework to provide detailed assessment across all 6 dimensions.`;
    }

    // Call OpenAI API directly
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Try to parse the response content
    let problemsData;
    try {
      problemsData = JSON.parse(data.choices[0].message.content);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', data.choices[0].message.content);
      
      // Try to extract JSON from the response if it's wrapped in markdown
      const content = data.choices[0].message.content;
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                       content.match(/```\s*([\s\S]*?)\s*```/) ||
                       content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        try {
          problemsData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        } catch (secondParseError) {
          console.error('Failed to parse extracted JSON:', jsonMatch[1] || jsonMatch[0]);
          throw new Error('Invalid JSON response from OpenAI');
        }
      } else {
        throw new Error('No valid JSON found in OpenAI response');
      }
    }

    // Validate the structure
    if (!problemsData || !problemsData.title || !problemsData.description) {
      console.error('Invalid response structure:', problemsData);
      
      // Create a fallback response with a single problem object
      const fallbackProblem = {
        title: "How might we improve the current challenge through innovative solutions?",
        description: "Based on the provided context, here's a problem statement that needs refinement. This opportunity focuses on addressing the identified challenge through creative and sustainable approaches.",
        opportunityScore: 70,
        subscores: {
          significance: 15,
          solutionGap: 15,
          marketPotential: 15,
          technicalFeasibility: 15,
          sdgAlignment: 10
        },
        iosAssessment: {
          totalScore: 70,
          dimensions: {
            marketOpportunity: {
              name: "Market Opportunity",
              weight: 25,
              score: 15,
              subscores: { marketSize: 15, marketMomentum: 15, marketAccessibility: 15 },
              evidence: ["Fallback assessment"],
              sources: []
            },
            innovationPotential: {
              name: "Innovation Potential",
              weight: 20,
              score: 15,
              subscores: { solutionNovelty: 15, technologyReadiness: 15, competitiveLandscape: 15 },
              evidence: ["Fallback assessment"],
              sources: []
            },
            feasibility: {
              name: "Feasibility",
              weight: 20,
              score: 15,
              subscores: { technicalFeasibility: 15, financialFeasibility: 15, operationalFeasibility: 15 },
              evidence: ["Fallback assessment"],
              sources: []
            },
            impactPotential: {
              name: "Impact Potential",
              weight: 15,
              score: 15,
              subscores: { socialImpact: 15, environmentalImpact: 15, economicImpact: 15 },
              evidence: ["Fallback assessment"],
              sources: []
            },
            indiaContext: {
              name: "India Context",
              weight: 10,
              score: 15,
              subscores: { marketReadiness: 15, regulatoryEnvironment: 15, innovationEcosystem: 15 },
              evidence: ["Fallback assessment"],
              sources: []
            },
            globalRelevance: {
              name: "Global Relevance",
              weight: 10,
              score: 15,
              subscores: { crossCulturalAdaptability: 15, emergingMarketPotential: 15, globalTrendAlignment: 15 },
              evidence: ["Fallback assessment"],
              sources: []
            }
          },
          assessmentMode: "hybrid",
          resourceTier: "standard",
          culturalFactors: [],
          trendAnalysis: [],
          recommendations: ["Refine problem statement", "Conduct detailed assessment"],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        requiredSkills: ["Problem Analysis", "Innovation", "Research"],
        sdgGoals: ["SDG17"]
      };
      
      problemsData = fallbackProblem;
    }

    return new Response(JSON.stringify(problemsData), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to generate problem statement'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
});