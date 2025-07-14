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
    const { userSkills, generatedProblems } = await req.json();

    // Validate required fields
    if (!userSkills || !Array.isArray(userSkills)) {
      return new Response(JSON.stringify({
        error: 'User skills array is required'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    if (!generatedProblems || !Array.isArray(generatedProblems) || generatedProblems.length === 0) {
      return new Response(JSON.stringify({
        error: 'Generated problems array is required and must not be empty'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Create prompt for ChatGPT to choose the best HMW based on skills
    const problemsList = generatedProblems.map((problem: any, index: number) => 
      `${index + 1}. "${problem.title}"\n   Required Skills: ${problem.requiredSkills.join(', ')}`
    ).join('\n\n');

    const prompt = `You are an expert at matching user skills with innovation opportunities. 

User Skills: ${userSkills.join(', ')}

Available HMW Problems:
${problemsList}

Task: Choose the ONE HMW problem that best matches the user's skills. Consider:
1. Direct skill matches (e.g., "JavaScript" matches "Frontend Development")
2. Related skills (e.g., "Project Management" matches "Leadership")
3. Transferable skills (e.g., "Data Analysis" matches "Research")
4. The potential for the user to contribute meaningfully to the problem

Respond with ONLY a JSON object in this exact format:
{
  "selectedProblemIndex": 1,
  "reasoning": "Brief explanation of why this problem best matches the user's skills"
}

If NONE of the problems are a good match for the user's skills, respond with:
{
  "noMatch": true,
  "reasoning": "Brief explanation of why none of the problems match the user's skills"
}

Choose the problem number (1, 2, 3, etc.) that best fits the user's skills.`;

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`
      },
      body: JSON.stringify({
        "model": 'gpt-3.5-turbo',
        "input": prompt
      })
    });

    if (!response.ok) {
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

    let result;
    try {
      result = JSON.parse(content);
    } catch (err) {
      console.error('Failed to parse OpenAI response:', content);
      throw new Error('Invalid response from OpenAI');
    }

    if (result.noMatch) {
      return new Response(JSON.stringify({
        success: false,
        message: result.reasoning || "No skills match found. Try updating your skills or generating more problems."
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Get the selected problem
    const selectedIndex = result.selectedProblemIndex - 1; // Convert to 0-based index
    if (selectedIndex < 0 || selectedIndex >= generatedProblems.length) {
      throw new Error('Invalid problem index selected');
    }

    const selectedProblem = generatedProblems[selectedIndex];
    
    return new Response(JSON.stringify({
      success: true,
      matchedProblem: {
        title: selectedProblem.title,
        requiredSkills: selectedProblem.requiredSkills,
        id: selectedProblem.id,
        reasoning: result.reasoning
      }
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to match skills with problems'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}); 