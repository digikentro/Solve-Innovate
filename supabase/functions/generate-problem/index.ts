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
    const { projectType, inputMode, sector, problemDescription, pdfContext,  hmwType } = await req.json();

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

    let prompt="", promptid;

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

    if (hmwType=="business") {
      promptid = "pmpt_6862a3b4a6988197aa074721f4f146ec04bbee4b574378ce"
    } 
    else if (hmwType=="system") {
      promptid = "pmpt_6862a39c868481968c4c0ce5a4f0587a0a5d943dd0655c66"
    } 
    else {
      promptid = "pmpt_6862a373af9881949cd06ea68bd149230669cec6bc0a51cf"
    }

    // prompt += `User Skills: ${userSkills?.join(', ') || 'Not specified'}\n\n`;
    // prompt += `Generate ONE problem statement that aligns with the user's skills and the specified context. Use the comprehensive IOS Framework to provide detailed assessment across all 6 dimensions.`;

    // Call OpenAI API directly
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`
      },
      body: JSON.stringify({
        "prompt": {
          "id": promptid,
          // "version": "1"
        },
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
        try {
          problemsData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        } catch {
          console.error("Failed JSON extract:", jsonMatch[0]);
          throw new Error("Invalid JSON format in assistant output");
        }
      } else {
        console.error("No JSON in content:", content);
        throw new Error("No valid JSON found in assistant response");
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