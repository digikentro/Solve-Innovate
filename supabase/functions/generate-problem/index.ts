import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

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
    const { projectType, inputMode, sector, problemDescription, pdfContext, hmwType, previousHmws } = await req.json();

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

    let prompt = `You are an expert at identifying and framing innovation opportunities using the Innovation Opportunity Score (IOS) Framework. Your task is to generate ONE specific, actionable, and impactful "How Might We" (HMW) problem statement.\n`;

    if (hmwType == "business") {
      prompt += `For the problem statement, provide a comprehensive assessment using the 7-dimensional IOS Framework:

1. **Market Opportunity (30% weight)**
   - Market Size and Potential (30%): TAM, growth trajectory, market research
   - Market Momentum and Growth Dynamics (35%): Growth rates, funding trends, innovation activity
   - Market Accessibility and Cultural Alignment (35%): Barriers, cultural factors, community engagement

2. **Innovation Potential (15% weight)**
   - Solution Novelty and Cultural Innovation (35%): Competitive analysis, cultural patterns, emerging approaches
   - Technology Readiness and Adaptive Potential (35%): TRL assessment, local capabilities, adaptation potential
   - Competitive Landscape and Innovation Ecosystem (30%): Competition analysis, collaboration opportunities

3. **Feasibility (20% weight)**
   - Technical Feasibility and Adaptive Implementation (50%): Engineering complexity, phased approaches, local capacity
   - Operational Feasibility and Community Implementation (50%): Organizational capacity, community engagement

4. **Impact Potential (10% weight)**
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

7. **Business Metrics (15% weight)**
   - Financial Return (40%): ROI, NPV, IRR, profit margins, payback
   - Competitive Advantage (25%): IP, defensibility, market differentiation
   - Scalability & Resource Fit (20%): Operational scalability with existing resources
   - Time-to-Impact (15%): Speed to revenue generation or cost reduction\n`

    }
    else if (hmwType == "system") {
      prompt += `For the problem statement, provide a comprehensive assessment using the 7-dimensional IOS Framework:

1. **Market Opportunity (20% weight)**
   - Market Size and Potential (30%): TAM, growth trajectory, market research
   - Market Momentum and Growth Dynamics (35%): Growth rates, funding trends, innovation activity
   - Market Accessibility and Cultural Alignment (35%): Barriers, cultural factors, community engagement

2. **Innovation Potential (15% weight)**
   - Solution Novelty and Cultural Innovation (35%): Competitive analysis, cultural patterns, emerging approaches
   - Technology Readiness and Adaptive Potential (35%): TRL assessment, local capabilities, adaptation potential
   - Competitive Landscape and Innovation Ecosystem (30%): Competition analysis, collaboration opportunities

3. **Feasibility (15% weight)**
   - Technical Feasibility and Adaptive Implementation (40%): Engineering complexity, phased approaches, local capacity
   - Financial Feasibility and Resource Flexibility (35%): Capital requirements, resource models, cultural factors
   - Operational Feasibility and Community Implementation (25%): Organizational capacity, community engagement

4. **System Impact (20% weight)**
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

7. **System Metrics (10% weight)**
   - System Leverage (30%): Root-cause focus, structural shifts, system redesign potential
   - Stakeholder Alignment (30%): Multi-actor coordination, incentives alignment, stakeholder roles
   - Policy & Governance Feasibility (25%): Regulatory integration, institutional fit, government support
   - Change-Management Risk (15%): Cultural inertia, resistance, legacy systems, adaptability\n`

    }
    else {
      prompt += `For the problem statement, provide a comprehensive assessment using the 6-dimensional IOS Framework:

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
   - Global Trend Alignment and Future Relevance (25%): Technology trends, social movements, future scenarios\n`
    }

    prompt += `CRITICAL SOURCE VERIFICATION REQUIREMENTS:

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
6. Cultural factors and considerations
7. Trend analysis and momentum indicators
8. VERIFIED SOURCES for each dimension with proper tier classification

IMPORTANT: Generate one problem statement. It should be unique and address the given context.

CRITICAL: You MUST respond with ONLY valid JSON. Do not include any markdown formatting, explanations, or additional text. The response must be parseable JSON.

CRITICAL: The "title" field should contain the actual HMW question (e.g., "How might we improve access to clean water in rural communities?"), NOT generic text like "HMW question 1". The "description" field should contain a brief explanation of the problem context and opportunity, NOT the HMW question again.

CRITICAL: Each dimension MUST include at least 2-3 verified sources with proper tier classification, organization names, and credibility scores.\n
Format the response as a JSON object with this exact structure:\n`

    let example;
    
    if (hmwType == "business") {
      example = {
        "title": "How might we improve access to clean water in rural communities?",
        "description": "Rural communities face significant challenges accessing clean, safe drinking water, leading to health issues and economic burdens. This opportunity focuses on developing sustainable water purification and distribution solutions that can be implemented at the community level.",
        "iosAssessment": {
          "dimensions": {
            "marketOpportunity": {
              "name": "Market Opportunity",
              "weight": 30,
              "score": 9,
              "subscores": {
                "marketSize": 8.5,
                "marketMomentum": 9.5,
                "marketAccessibility": 9
              },
              "evidence": [
                "India's water and wastewater treatment market is the fifth-largest globally, valued at approximately $11 billion and projected to grow to over $18 billion by 2026.",
                "The Jal Jeevan Mission aims to provide 55 liters of tap water per capita per day to every rural household by 2024. As of March 2022, 50% of rural households had a tap connection within their premises."
              ],
              "sources": [
                {
                  "tier": 1,
                  "name": "U.S. Department of Commerce, International Trade Administration",
                  "url": "https://www.trade.gov/market-intelligence/india-water-and-wastewater-treatment-sector",
                  "credibility": "U.S. Department of Commerce, International Trade Administration"
                },
                {
                  "tier": 1,
                  "name": "Ministry of Jal Shakti, Government of India",
                  "url": "https://en.wikipedia.org/wiki/Jal_Jeevan_Mission",
                  "credibility": "Government of India, Ministry of Jal Shakti"
                },
                {
                  "tier": 2,
                  "name": "Energy Policy Institute at the University of Chicago (EPIC)",
                  "url": "https://epic.uchicago.in/project/market-based-approaches-to-allocating-clean-water-experimental-evidence-from-india/",
                  "credibility": "Energy Policy Institute at the University of Chicago"
                },
                {
                  "tier": 2,
                  "name": "World Bank",
                  "url": "https://en.wikipedia.org/wiki/Neer_Nirmal_Pariyojana",
                  "credibility": "World Bank"
                }
              ]
            },
            "innovationPotential": {
              "name": "Innovation Potential",
              "weight": 15,
              "score": 8.5,
              "subscores": {
                "solutionNovelty": 8,
                "technologyReadiness": 9,
                "competitiveLandscape": 8.5
              },
              "evidence": [],
              "sources": []
            },
            "feasibility": {
              "name": "Feasibility",
              "weight": 20,
              "score": 8,
              "subscores": {
                "technicalFeasibility": 8.5,
                "financialFeasibility": 7.5,
                "operationalFeasibility": 8
              },
              "evidence": [],
              "sources": []
            },
            "impactPotential": {
              "name": "Impact Potential",
              "weight": 10,
              "score": 9.5,
              "subscores": {
                "socialImpact": 9.5,
                "environmentalImpact": 9,
                "economicImpact": 10
              },
              "evidence": [],
              "sources": []
            },
            "indiaContext": {
              "name": "India Context",
              "weight": 10,
              "score": 7.5,
              "subscores": {
                "marketReadiness": 8,
                "regulatoryEnvironment": 7,
                "innovationEcosystem": 7.5
              },
              "evidence": [],
              "sources": []
            },
            "globalRelevance": {
              "name": "Global Relevance",
              "weight": 10,
              "score": 8,
              "subscores": {
                "crossCulturalAdaptability": 8.5,
                "emergingMarketPotential": 8,
                "globalTrendAlignment": 7.5
              },
              "evidence": [],
              "sources": []
            },
            "businessMetrics": {
              "name": "Business Metrics",
              "weight": 15,
              "score": 9,
              "subscores": {
                "financialReturn": {
                  "weight": 40,
                  "score": 10,
                  "evidence": [],
                  "sources": []
                },
                "competitiveAdvantage": {
                  "weight": 25,
                  "score": 8.5,
                  "evidence": [],
                  "sources": []
                },
                "scalabilityResourceFit": {
                  "weight": 20,
                  "score": 8,
                  "evidence": [],
                  "sources": []
                },
                "timeToImpact": {
                  "weight": 15,
                  "score": 9,
                  "evidence": [],
                  "sources": []
                }
              }
            }
          },
          "culturalFactors": ["Strong community engagement potential", "Cultural alignment with local values"],
          "trendAnalysis": ["Growing market demand", "Increasing regulatory support"],
          "recommendations": ["Focus on community engagement", "Develop phased implementation plan"]
        },
        "requiredSkills": ["Water Treatment Technology", "Community Development", "Project Management"]
      }
    }

    else if (hmwType == "system") {
      example = {
        "title": "How might we improve access to clean water in rural communities?",
        "description": "Rural communities face significant challenges accessing clean, safe drinking water, leading to health issues and economic burdens. This opportunity focuses on developing sustainable water purification and distribution solutions that can be implemented at the community level.",
        "iosAssessment": {
          "dimensions": {
            "marketOpportunity": {
              "name": "Market Opportunity",
              "weight": 20,
              "score": 9,
              "subscores": {
                "marketSize": 8.5,
                "marketMomentum": 9.5,
                "marketAccessibility": 9
              },
              "evidence": [
                "India's water and wastewater treatment market is the fifth-largest globally, valued at approximately $11 billion and projected to grow to over $18 billion by 2026.",
                "The Jal Jeevan Mission aims to provide 55 liters of tap water per capita per day to every rural household by 2024. As of March 2022, 50% of rural households had a tap connection within their premises."
              ],
              "sources": [
                {
                  "tier": 1,
                  "name": "U.S. Department of Commerce, International Trade Administration",
                  "url": "https://www.trade.gov/market-intelligence/india-water-and-wastewater-treatment-sector",
                  "credibility": "U.S. Department of Commerce, International Trade Administration"
                },
                {
                  "tier": 1,
                  "name": "Ministry of Jal Shakti, Government of India",
                  "url": "https://en.wikipedia.org/wiki/Jal_Jeevan_Mission",
                  "credibility": "Government of India, Ministry of Jal Shakti"
                },
                {
                  "tier": 2,
                  "name": "Energy Policy Institute at the University of Chicago (EPIC)",
                  "url": "https://epic.uchicago.in/project/market-based-approaches-to-allocating-clean-water-experimental-evidence-from-india/",
                  "credibility": "Energy Policy Institute at the University of Chicago"
                },
                {
                  "tier": 2,
                  "name": "World Bank",
                  "url": "https://en.wikipedia.org/wiki/Neer_Nirmal_Pariyojana",
                  "credibility": "World Bank"
                }
              ]
            },
            "innovationPotential": {
              "name": "Innovation Potential",
              "weight": 15,
              "score": 8.5,
              "subscores": {
                "solutionNovelty": 8,
                "technologyReadiness": 9,
                "competitiveLandscape": 8.5
              },
              "evidence": [],
              "sources": []
            },
            "feasibility": {
              "name": "Feasibility",
              "weight": 20,
              "score": 8,
              "subscores": {
                "technicalFeasibility": 8.5,
                "financialFeasibility": 7.5,
                "operationalFeasibility": 8
              },
              "evidence": [],
              "sources": []
            },
            "systemImpact": {
              "name": "System Impact",
              "weight": 15,
              "score": 9.5,
              "subscores": {
                "socialImpact": 9.5,
                "environmentalImpact": 9,
                "economicImpact": 10
              },
              "evidence": [],
              "sources": []
            },
            "indiaContext": {
              "name": "India Context",
              "weight": 10,
              "score": 7.5,
              "subscores": {
                "marketReadiness": 8,
                "regulatoryEnvironment": 7,
                "innovationEcosystem": 7.5
              },
              "evidence": [],
              "sources": []
            },
            "globalRelevance": {
              "name": "Global Relevance",
              "weight": 10,
              "score": 8,
              "subscores": {
                "crossCulturalAdaptability": 8.5,
                "emergingMarketPotential": 8,
                "globalTrendAlignment": 7.5
              },
              "evidence": [],
              "sources": []
            },
            "systemMetrics": {
              "name": "System Metrics",
              "weight": 10,
              "score": 8.5,
              "subscores": {
                "systemLeverage": {
                  "weight": 30,
                  "score": 9,
                  "evidence": [],
                  "sources": []
                },
                "stakeholderAlignment": {
                  "weight": 30,
                  "score": 7.5,
                  "evidence": [],
                  "sources": []
                },
                "policyGovernanceFeasibility": {
                  "weight": 25,
                  "score": 8,
                  "evidence": [],
                  "sources": []
                },
                "changeManagementRisk": {
                  "weight": 15,
                  "score": 7,
                  "evidence": [],
                  "sources": []
                }
              }
            }
          },
          "culturalFactors": ["Strong community engagement potential", "Cultural alignment with local values"],
          "trendAnalysis": ["Growing market demand", "Increasing regulatory support"],
          "recommendations": ["Focus on community engagement", "Develop phased implementation plan"]
        },
        "requiredSkills": ["Water Treatment Technology", "Community Development", "Project Management"]
      }

    }
    else {
      example = {
        "title": "How might we improve access to clean water in rural communities?",
        "description": "Rural communities face significant challenges accessing clean, safe drinking water, leading to health issues and economic burdens. This opportunity focuses on developing sustainable water purification and distribution solutions that can be implemented at the community level.",
        "iosAssessment": {
          "dimensions": {
            "marketOpportunity": {
              "name": "Market Opportunity",
              "weight": 25,
              "score": 9,
              "subscores": {
                "marketSize": 8.5,
                "marketMomentum": 9.5,
                "marketAccessibility": 9
              },
              "evidence": [
                "India's water and wastewater treatment market is the fifth-largest globally, valued at approximately $11 billion and projected to grow to over $18 billion by 2026.",
                "The Jal Jeevan Mission aims to provide 55 liters of tap water per capita per day to every rural household by 2024. As of March 2022, 50% of rural households had a tap connection within their premises."
              ],
              "sources": [
                {
                  "tier": 1,
                  "name": "U.S. Department of Commerce, International Trade Administration",
                  "url": "https://www.trade.gov/market-intelligence/india-water-and-wastewater-treatment-sector",
                  "credibility": "U.S. Department of Commerce, International Trade Administration"
                },
                {
                  "tier": 1,
                  "name": "Ministry of Jal Shakti, Government of India",
                  "url": "https://en.wikipedia.org/wiki/Jal_Jeevan_Mission",
                  "credibility": "Government of India, Ministry of Jal Shakti"
                },
                {
                  "tier": 2,
                  "name": "Energy Policy Institute at the University of Chicago (EPIC)",
                  "url": "https://epic.uchicago.in/project/market-based-approaches-to-allocating-clean-water-experimental-evidence-from-india/",
                  "credibility": "Energy Policy Institute at the University of Chicago"
                },
                {
                  "tier": 2,
                  "name": "World Bank",
                  "url": "https://en.wikipedia.org/wiki/Neer_Nirmal_Pariyojana",
                  "credibility": "World Bank"
                }
              ]
            },
            "innovationPotential": {
              "name": "Innovation Potential",
              "weight": 20,
              "score": 8.5,
              "subscores": {
                "solutionNovelty": 8,
                "technologyReadiness": 9,
                "competitiveLandscape": 8.5
              },
              "evidence": [],
              "sources": []
            },
            "feasibility": {
              "name": "Feasibility",
              "weight": 20,
              "score": 8,
              "subscores": {
                "technicalFeasibility": 8.5,
                "financialFeasibility": 7.5,
                "operationalFeasibility": 8
              },
              "evidence": [],
              "sources": []
            },
            "impactPotential": {
              "name": "Impact Potential",
              "weight": 15,
              "score": 9.5,
              "subscores": {
                "socialImpact": 9.5,
                "environmentalImpact": 9,
                "economicImpact": 10
              },
              "evidence": [],
              "sources": []
            },
            "indiaContext": {
              "name": "India Context",
              "weight": 10,
              "score": 7.5,
              "subscores": {
                "marketReadiness": 8,
                "regulatoryEnvironment": 7,
                "innovationEcosystem": 7.5
              },
              "evidence": [],
              "sources": []
            },
            "globalRelevance": {
              "name": "Global Relevance",
              "weight": 10,
              "score": 8,
              "subscores": {
                "crossCulturalAdaptability": 8.5,
                "emergingMarketPotential": 8,
                "globalTrendAlignment": 7.5
              },
              "evidence": [],
              "sources": []
            }
          },
          "culturalFactors": ["Strong community engagement potential", "Cultural alignment with local values"],
          "trendAnalysis": ["Growing market demand", "Increasing regulatory support"],
          "recommendations": ["Focus on community engagement", "Develop phased implementation plan"]
        },
        "requiredSkills": ["Water Treatment Technology", "Community Development", "Project Management"]
      }
    }

    prompt += JSON.stringify(example, null, 2);

    prompt += `\nReplace the placeholder arrays [] with full evidence and at least three tiered sources for each dimension.
  
  IMPORTANT SCORING GUIDANCE:
  - Score everything out of 10. 
  - Focus on the problem's inherent challenges and barriers, not just its potential.
  - Lower scores can indicate problems that need more innovative solutions or face significant obstacles.`

    // Add instruction to avoid previously generated HMWs and guide score generation
    if (previousHmws && Array.isArray(previousHmws) && previousHmws.length > 0) {
      prompt += `\n\nCRITICAL: Avoid generating any of these previously created HMW statements:\n`;
      previousHmws.forEach((problem: any, index: number) => {
        const title = typeof problem === 'string' ? problem : problem.title;
        const iosScore = typeof problem === 'string' ? 'N/A' : problem.iosScore;
        prompt += `${index + 1}. "${title}" (IOS Score: ${iosScore}%)\n`;
      });

      // Calculate average IOS score of previous problems
      const validScores = previousHmws
        .filter((problem: any) => typeof problem === 'object' && problem.iosScore)
        .map((problem: any) => problem.iosScore);

      if (validScores.length > 0) {
        prompt += `\n\nGenerate a NEW HMW statement with a LOWER IOS score (aim for 2-5% lower than the previous ones).`;
      }

      prompt += `\nGenerate a COMPLETELY DIFFERENT HMW statement that addresses a different aspect, challenge, or opportunity within the same context. Do not repeat any of the above HMWs or their core concepts.`;
    }

    if (projectType) {
      prompt += `\n\nProject Type: ${projectType === 'social-impact' ? 'Social Impact (SDG-focused)' : 'Business'}\n`;
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

    // Call OpenAI API directly
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`
      },
      body: JSON.stringify({
        "model": "gpt-3.5-turbo",
        "input": prompt,
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`OpenAI API error: ${response.status} - ${errorBody}`);
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }


    const data = await response.json();

    if (data.status !== "completed") {
      console.error("OpenAI response not completed:", data);
      throw new Error("Response incomplete or failed");
    }

    const messageObj = data.output.find((o: any) => o.type === "message" && o.role === "assistant");
    if (!messageObj || !messageObj.content?.[0]?.text) {
      console.error("No assistant output found in response:", data);
      throw new Error("Missing assistant message");
    }

    const content = messageObj.content[0].text;

    let problemsData;
    try {
      problemsData = JSON.parse(content);
    } catch (err) {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)```/) || content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const raw = jsonMatch[1] || jsonMatch[0];
        const cleaned = raw.replace(/,(?=\s*[\}\]])/g, '');
        try {
          problemsData = JSON.parse(cleaned);
        } catch (err2) {
          console.error("Failed JSON extract:", cleaned);
          throw new Error("Invalid JSON format in assistant output");
        }
      } else {
        console.error("No JSON in content:", content);
        throw new Error("No valid JSON found in assistant response");
      }
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