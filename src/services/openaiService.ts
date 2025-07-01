import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Only for client-side usage in this demo
});

export const generateIdeas = async (prompt: string, count: number = 3): Promise<string[]> => {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a creative assistant that helps generate innovative project ideas. Provide concise, unique, and feasible ideas.'
        },
        {
          role: 'user',
          content: `Generate ${count} project ideas based on: ${prompt}`
        }
      ],
      temperature: 0.8,
      max_tokens: 500
    });

    const content = response.choices[0]?.message?.content || '';
    // Split the response into individual ideas
    return content
      .split('\n')
      .map(line => line.replace(/^\d+[.)\s]+/, '').trim())
      .filter(Boolean);
  } catch (error) {
    console.error('Error generating ideas with OpenAI:', error);
    throw new Error('Failed to generate ideas. Please try again.');
  }
};

export const refineIdea = async (idea: string, feedback: string): Promise<string> => {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You help refine and improve project ideas based on user feedback.'
        },
        {
          role: 'user',
          content: `Original idea: ${idea}\n\nFeedback: ${feedback}\n\nPlease provide an improved version of this idea.`
        }
      ],
      temperature: 0.7,
      max_tokens: 300
    });

    return response.choices[0]?.message?.content?.trim() || idea;
  } catch (error) {
    console.error('Error refining idea with OpenAI:', error);
    throw new Error('Failed to refine idea. Please try again.');
  }
};
