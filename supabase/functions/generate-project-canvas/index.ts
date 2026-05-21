import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

type SectionInput = {
  key: string;
  label?: string;
  content: unknown;
};

type SectionPlan = {
  key: string;
  title: string;
  bullets: string[];
};

const SYSTEM_PROMPT = `You are a diagram planner for an Excalidraw canvas.
Given project sections, create concise card-style summaries.
Return ONLY valid JSON with this exact shape:
{ "sections": [ { "key": string, "title": string, "bullets": string[] } ] }

Rules:
- Each section should have 1 short title and 2-5 bullets.
- Bullets must be concise (max ~12 words each).
- Preserve the original section order.
- Do not include any extra keys or text outside the JSON.`;

function safeStringify(value: unknown) {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

async function callOpenAI(sections: SectionInput[]): Promise<SectionPlan[]> {
  if (!OPENAI_API_KEY) {
    throw new Error('Missing OPENAI_API_KEY');
  }

  const userPrompt = `Sections:\n${safeStringify(
    sections.map((section) => ({
      key: section.key,
      label: section.label || section.key,
      content: section.content,
    }))
  )}`;

  const body = {
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: 800,
  };

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI error: ${response.status} ${errorBody}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content || '';
  const parsed = JSON.parse(content);
  if (!parsed || !Array.isArray(parsed.sections)) {
    throw new Error('Invalid OpenAI response format');
  }
  return parsed.sections as SectionPlan[];
}

function randomInt(max: number) {
  return Math.floor(Math.random() * max);
}

function baseElement() {
  const now = Date.now();
  return {
    strokeColor: '#1f2937',
    backgroundColor: '#f8fafc',
    fillStyle: 'solid',
    strokeWidth: 1,
    strokeStyle: 'solid',
    roundness: null,
    roughness: 0,
    opacity: 100,
    angle: 0,
    seed: randomInt(1_000_000_000),
    version: 1,
    versionNonce: randomInt(1_000_000_000),
    index: null,
    isDeleted: false,
    groupIds: [],
    frameId: null,
    boundElements: null,
    updated: now,
    link: null,
    locked: false,
  };
}

function createCardElements(plan: SectionPlan, x: number, y: number, width: number) {
  const title = plan.title?.trim() || plan.key;
  const bullets = Array.isArray(plan.bullets) ? plan.bullets : [];
  const lines = [title, ...bullets.map((b) => `• ${b}`)];
  const lineHeight = 24;
  const padding = 16;
  const textHeight = Math.max(lines.length, 2) * lineHeight;
  const height = Math.max(textHeight + padding * 2, 120);

  const sectionId = crypto.randomUUID();

  const rect = {
    ...baseElement(),
    id: crypto.randomUUID(),
    type: 'rectangle',
    x,
    y,
    width,
    height,
    customData: {
      sectionKey: plan.key,
      sectionId,
      source: 'ai',
    },
  };

  const text = {
    ...baseElement(),
    id: crypto.randomUUID(),
    type: 'text',
    x: x + padding,
    y: y + padding,
    width: width - padding * 2,
    height: textHeight,
    text: lines.join('\n'),
    originalText: lines.join('\n'),
    fontSize: 20,
    fontFamily: 1,
    textAlign: 'left',
    verticalAlign: 'top',
    containerId: null,
    autoResize: false,
    lineHeight: 1.25,
    strokeColor: '#0f172a',
    backgroundColor: 'transparent',
    customData: {
      sectionKey: plan.key,
      sectionId,
      source: 'ai',
    },
  };

  return { rect, text, height: height + 24 };
}

function buildFallbackPlan(sections: SectionInput[]): SectionPlan[] {
  return sections.map((section) => {
    const label = section.label || section.key;
    const content =
      typeof section.content === 'string'
        ? section.content
        : safeStringify(section.content);
    const bullets = content
      .replace(/\s+/g, ' ')
      .split('.')
      .map((chunk) => chunk.trim())
      .filter(Boolean)
      .slice(0, 4);
    return {
      key: section.key,
      title: label,
      bullets: bullets.length ? bullets : [content.slice(0, 120)],
    };
  });
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
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey',
      },
    });
  }

  try {
    const { sections, layout } = await req.json();

    if (!Array.isArray(sections) || sections.length === 0) {
      return new Response(JSON.stringify({ error: 'Missing sections array' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey',
        },
      });
    }

    let plans: SectionPlan[] = [];
    try {
      plans = await callOpenAI(sections);
    } catch {
      plans = buildFallbackPlan(sections);
    }

    const startX = typeof layout?.startX === 'number' ? layout.startX : 100;
    const startY = typeof layout?.startY === 'number' ? layout.startY : 80;
    const cardWidth = typeof layout?.cardWidth === 'number' ? layout.cardWidth : 520;
    const gapY = typeof layout?.gapY === 'number' ? layout.gapY : 40;

    const elements: any[] = [];
    let currentY = startY;

    for (const plan of plans) {
      const { rect, text, height } = createCardElements(plan, startX, currentY, cardWidth);
      elements.push(rect, text);
      currentY += height + gapY;
    }

    const responseBody = {
      elements,
      appState: {
        viewBackgroundColor: '#ffffff',
      },
      generated_at: new Date().toISOString(),
    };

    return new Response(JSON.stringify(responseBody), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || 'Internal error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey',
      },
    });
  }
});
