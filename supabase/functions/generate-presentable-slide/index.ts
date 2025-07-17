import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

const SYSTEM_PROMPT = `You are an expert at creating business presentation slides. 
Given a project title and description, generate a single-slide summary in the style of a 'How Might We' (HMW) slide.

Instructions:
- Write a bold HMW question based on the project.
- Provide 3-4 concise bullet points summarizing the key context, pain points, or challenges.
- Choose the most relevant icon from the full list of react-icons (https://react-icons.github.io/react-icons/). Return the icon’s import path as two fields: iconSet (e.g., 'fi', 'fa', 'md', etc.) and iconName (e.g., 'FiHome', 'FaBeer', 'MdWork', etc.).
- Use clear, professional language.
- Respond ONLY in valid JSON: { "hmw": string, "bullets": string[], "iconSet": string, "iconName": string }`;

async function generatePresentableSlide(title: string, description: string) {
  const userPrompt = `Project Title: ${title}\nProject Description: ${description}`;
  const body = {
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt }
    ],
    max_tokens: 400
  };
  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify(body)
  });
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  try {
    return JSON.parse(content);
  } catch (e) {
    throw new Error('Failed to parse OpenAI response as JSON');
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey',
      },
    });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey' },
    });
  }
  try {
    const { title, description } = await req.json();
    if (!title || !description) {
      return new Response(JSON.stringify({ error: 'Missing title or description' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey' },
      });
    }
    const slide = await generatePresentableSlide(title, description);
    return new Response(JSON.stringify(slide), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message || 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey' },
    });
  }
}); 