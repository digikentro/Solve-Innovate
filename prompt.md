# Project: Build a Gamma-like Presentation Generator with Markdown Renderer

## Executive Summary
Build a presentation generation system that replicates Gamma.app's architecture. The key innovation is a **markdown-based slide renderer** that allows unlimited content depth per slide (unlike fixed-layout systems with Zod schemas that truncate content).

---

## Part 1: Backend Migration Guide

### What NOT to Copy
- `venv/` or `.venv/` — Never copy virtual environments
- `__pycache__/` directories
- `.pyc` files
- `chroma/` (vector store data)
- `presenton_backend.egg-info/`

### Migration Steps

1. **Create new backend directory in Solve Innovate:**
```bash
cd solve-innovate
mkdir -p backend/ppt
cd backend/ppt
```

2. **Copy source folders only (NOT venv):**
```bash
# From presenton-1/servers/fastapi, copy these folders:
cp -r api/ solve-innovate/backend/ppt/
cp -r services/ solve-innovate/backend/ppt/
cp -r utils/ solve-innovate/backend/ppt/
cp -r models/ solve-innovate/backend/ppt/
cp -r enums/ solve-innovate/backend/ppt/
cp -r constants/ solve-innovate/backend/ppt/
cp -r assets/ solve-innovate/backend/ppt/

# Copy config files:
cp pyproject.toml solve-innovate/backend/ppt/
cp server.py solve-innovate/backend/ppt/
cp .env.example solve-innovate/backend/ppt/  # Don't copy actual .env with secrets
```

3. **Create fresh virtual environment:**
```bash
cd solve-innovate/backend/ppt
python -m venv venv
# Windows:
.\venv\Scripts\Activate.ps1
# Linux/Mac:
source venv/bin/activate
```

4. **Install dependencies:**
```bash
# If using uv (recommended, faster):
pip install uv
uv pip install -e .

# Or standard pip:
pip install -e .
```

5. **Create .env file with your API keys:**
```env
OPENAI_API_KEY=your_key
ANTHROPIC_API_KEY=your_key
SUPABASE_URL=your_url
SUPABASE_KEY=your_key
DATABASE_URL=sqlite:///./app.db
```

6. **Run the backend:**
```bash
uvicorn api.main:app --reload --port 8000
```

### Required Dependencies (pyproject.toml)
```toml
[project]
name = "ppt-backend"
version = "0.1.0"
requires-python = ">=3.11,<3.12"
dependencies = [
    "aiohttp>=3.12.15",
    "anthropic>=0.60.0",
    "fastapi[standard]>=0.116.1",
    "google-genai>=1.28.0",
    "openai>=1.98.0",
    "python-pptx>=1.0.2",
    "sqlmodel>=0.0.24",
    "supabase>=2.0.0",
    "dirtyjson>=1.0.8",
]
```

---

## Part 2: Backend Modifications for Markdown Frontend

The existing FastAPI backend needs these additions to support the new markdown-based frontend:

### New Endpoints to Add

```python
# File: api/v1/ppt/endpoints/markdown_presentation.py

from fastapi import APIRouter, Body
from fastapi.responses import StreamingResponse
from typing import Optional, List, Literal
import uuid
import json

MARKDOWN_ROUTER = APIRouter(prefix="/markdown", tags=["Markdown Presentations"])


@MARKDOWN_ROUTER.post("/create")
async def create_markdown_presentation(
    content: str = Body(...),
    slides_markdown: Optional[List[str]] = Body(None),  # Pre-split by ---
    n_slides: int = Body(10),
    language: str = Body("English"),
    tone: str = Body("professional"),
    verbosity: Literal["minimal", "concise", "standard", "text_heavy"] = Body("standard"),
    text_mode: Literal["generate", "condense", "preserve"] = Body("generate"),
    audience: Optional[str] = Body(None),
    theme: str = Body("modern-dark"),
    image_source: Literal["ai", "stock", "none"] = Body("ai"),
    image_style: Optional[str] = Body("photo"),
    instructions: Optional[str] = Body(None),
    per_slide_instructions: Optional[List[str]] = Body(None),
):
    """
    Create a markdown-based presentation.
    
    - slides_markdown: If provided (card-by-card mode), each item is one slide's content
    - text_mode: 
        - generate: Create new content, expand ideas
        - condense: Summarize to key points
        - preserve: Keep user's exact text, only format into slides
    """
    presentation_id = uuid.uuid4()
    
    # Store in database
    # ... (same pattern as existing create endpoint)
    
    return {"presentation_id": str(presentation_id)}


@MARKDOWN_ROUTER.get("/presentation/{id}/stream")
async def stream_markdown_presentation(id: str):
    """
    SSE endpoint that streams markdown slides as they're generated.
    Each slide is emitted as a JSON event with markdown content.
    """
    async def generate():
        presentation = await get_presentation(id)
        
        # Build LLM prompt using new markdown system prompt
        messages = build_markdown_generation_messages(presentation)
        
        accumulated = ""
        async for chunk in llm_client.stream(messages):
            accumulated += chunk
            
            # Check for slide boundaries
            if "---" in accumulated:
                parts = accumulated.split("---")
                for complete_slide in parts[:-1]:
                    if complete_slide.strip():
                        yield f"data: {json.dumps({'type': 'slide', 'markdown': complete_slide.strip()})}\n\n"
                accumulated = parts[-1]
        
        # Emit final slide
        if accumulated.strip():
            yield f"data: {json.dumps({'type': 'slide', 'markdown': accumulated.strip()})}\n\n"
        
        yield f"data: {json.dumps({'type': 'done'})}\n\n"
    
    return StreamingResponse(generate(), media_type="text/event-stream")


@MARKDOWN_ROUTER.post("/slide/regenerate")
async def regenerate_slide(
    presentation_id: str = Body(...),
    slide_index: int = Body(...),
    instructions: Optional[str] = Body(None),
):
    """
    Regenerate a single slide without affecting others.
    """
    # Get presentation and slide context
    # Generate new markdown for just this slide
    # Return updated markdown
    pass


@MARKDOWN_ROUTER.post("/presentation/{id}/switch-theme")
async def switch_theme(id: str, new_theme: str = Body(...)):
    """
    Switch theme - no regeneration needed since content is markdown.
    Frontend just re-renders with new CSS variables.
    """
    await update_presentation_theme(id, new_theme)
    return {"success": True, "theme": new_theme}
```

### New LLM Prompt File

```python
# File: utils/llm_calls/generate_markdown_slides.py

from typing import Optional, List
from models.llm_message import LLMSystemMessage, LLMUserMessage


MARKDOWN_SYSTEM_PROMPT = """
You are a presentation content generator that outputs structured markdown slides.

## Output Format
For each slide, output markdown using the extended syntax below. Separate slides with `---` on its own line.

## Extended Markdown Syntax

### Metrics (for KPIs, statistics)
:::metric
VALUE | LABEL | DELTA (optional)
:::

Example:
:::metric
73.2% | Conversion Rate | +12.5%
$1.2M | Revenue
42 | DAU
:::

### Callouts (for key insights, warnings, tips)
:::callout[icon=lightbulb|warning|info|check]
**Title**
Body text here
:::

### Charts (for data visualization)
:::chart[type=bar|line|pie|donut]
| Category | Value |
|----------|-------|
| Item 1   | 100   |
:::

### Multi-column layouts
:::columns
Column 1 content

---

Column 2 content
:::

### Standard Markdown
- Headings: # ## ###
- Lists: - or 1. 2. 3.
- Quotes: > "text" — attribution
- Tables: | Header | Header |
- Images: ![alt](url) or ![alt](image:description-for-ai-generation)
- Bold: **text**, Italic: *text*

## Text Mode Behavior
- **generate**: Create new content from the outline, expand ideas, add context
- **condense**: Summarize the input to key points only, remove fluff
- **preserve**: Keep the user's exact text, only format it into slides — do NOT rewrite

## Verbosity Rules
- **minimal**: 3 bullets max, headlines only, ≤6 words per bullet, prefer metrics/charts over text
- **concise**: 5 bullets max, one sentence descriptions, prefer visual elements
- **standard**: 8 bullets, short paragraphs (2-3 sentences), include all data points
- **text_heavy**: Full explanations, sub-bullets allowed, tables for dense data, every quote included

## Content Fidelity (ALWAYS follow)
- Exact percentages must be preserved verbatim (73.2% stays 73.2%)
- Named personas must appear with exact names ("Maria, the night-shift nurse")
- Verbatim quotes must be reproduced exactly with attribution
- Named frameworks must use their exact names (B=MAP, not "a behavioral framework")
- Stage numbers and names together ("Stage 3: Prototype")
- Never write filler openings ("This slide explores...", "Let's look at...")

## Slide Structure Guidelines
1. **Title slide**: # Main Title, subtitle as paragraph, optional metrics
2. **Content slides**: ## Section Title, mix of bullets, metrics, callouts as appropriate
3. **Data slides**: Use :::metric for KPIs, :::chart for trends, tables for comparisons
4. **Quote slides**: Use > blockquote syntax with attribution
5. **Conclusion**: Key takeaways as bullet list, optional CTA callout

## Example Output

---
# Q3 2024 Performance Review
Building momentum in key growth markets

:::metric
$12.4M | Revenue | +23.5%
847K | Active Users | +18.2%
4.8 | App Store Rating
:::
---
## Market Expansion Results

Our APAC expansion delivered **3x projected returns** within 6 months.

- **Japan**: 120K users acquired, $2.1M revenue
- **Singapore**: Strategic partnerships with 3 enterprise clients
- **Australia**: #2 app in productivity category

:::callout[icon=lightbulb]
**Key Insight**
Localization drove 60% higher conversion vs. English-only markets
:::
---
## Customer Testimonial

> "This platform transformed how our team collaborates. We've cut meeting time by 40% and improved project delivery speed."
> — Sarah Chen, VP Operations at TechCorp

![Team collaboration](image:diverse-team-working-together-modern-office)
---
"""


def get_markdown_generation_messages(
    content: str,
    n_slides: int,
    language: str,
    tone: str,
    verbosity: str,
    text_mode: str,
    audience: Optional[str] = None,
    instructions: Optional[str] = None,
    slides_markdown: Optional[List[str]] = None,
    per_slide_instructions: Optional[List[str]] = None,
):
    """
    Build messages for markdown slide generation.
    """
    
    # Build per-slide instructions section if provided
    per_slide_section = ""
    if slides_markdown and per_slide_instructions:
        per_slide_section = "\n## Per-Slide Instructions\n"
        for i, (slide, instr) in enumerate(zip(slides_markdown, per_slide_instructions or [])):
            if instr:
                per_slide_section += f"Slide {i+1}: {instr}\n"
    
    # Build card-by-card section if slides_markdown provided
    cards_section = ""
    if slides_markdown:
        cards_section = "\n## Card-by-Card Content (User-defined slide breaks)\n"
        for i, slide in enumerate(slides_markdown):
            cards_section += f"\n### Card {i+1}\n{slide}\n"
    
    user_prompt = f"""
## Generation Parameters
- Text Mode: {text_mode}
- Verbosity: {verbosity}
- Tone: {tone}
- Audience: {audience or "General"}
- Language: {language}
- Number of Slides: {n_slides}

## User Instructions
{instructions or "None provided"}

## Source Content
{content}
{cards_section}
{per_slide_section}

Generate the presentation slides in extended markdown format. Separate each slide with `---` on its own line.
{"Respect the user's card breaks — each Card above should become one slide." if slides_markdown else ""}
"""

    return [
        LLMSystemMessage(content=MARKDOWN_SYSTEM_PROMPT),
        LLMUserMessage(content=user_prompt),
    ]
```

### Register New Router

```python
# File: api/v1/ppt/__init__.py (or wherever routers are registered)

from .endpoints.markdown_presentation import MARKDOWN_ROUTER

# Add to app
app.include_router(MARKDOWN_ROUTER, prefix="/api/v1/ppt")
```

---

## Part 3: Current Pain Points (Why This Refactor)

1. **Content truncation**: Fixed layouts have maxItems/maxLength constraints that cut off important information
2. **Schema rigidity**: 100+ layout components with Zod schemas — each slide type has hard-coded structure
3. **No content preservation mode**: Can't tell the system "keep this exact text"
4. **Poor mapping between content and layout**: Data-heavy content gets assigned visual layouts, losing information

---

## Part 4: Architecture Overview

### System Components
```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────────┐  ┌────────────────┐  ┌────────────────────┐  │
│  │ Card-by-Card  │  │  Prompt Editor │  │  Markdown Slide    │  │
│  │ Input Screen  │  │  Control Panel │  │  Renderer          │  │
│  │ (--- syntax)  │  │  (Gamma-style) │  │  (Block-based)     │  │
│  └───────────────┘  └────────────────┘  └────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                        FastAPI Backend                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────────┐  ┌────────────────┐  ┌────────────────────┐  │
│  │ Project Brief │  │  Markdown Slide│  │  PPTX Export       │  │
│  │ Generator     │  │  Generator     │  │  Service           │  │
│  │ (Supabase)    │  │  (LLM)         │  │                    │  │
│  └───────────────┘  └────────────────┘  └────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Part 5: Gamma Feature Specification

### 1. Input Screen (Card-by-Card Mode)

**UI Components:**
- Large textarea with placeholder showing `---` separator syntax
- Toggle: "Freeform" (AI decides all breaks) vs "Card-by-card" (user controls)
- "Continue to prompt editor" CTA button
- Character/slide count indicator

**Behavior:**
```typescript
// Parse input into slides
const parseCardByCard = (input: string): string[] => {
  return input.split(/\n---\n/).map(s => s.trim()).filter(Boolean);
};

// In freeform mode, the entire input becomes a single content block
// Backend decides slide breaks based on n_slides parameter
```

**API Contract:**
```typescript
interface CreatePresentationRequest {
  content: string;                    // Full markdown content
  slides_markdown?: string[];         // If card-by-card mode, pre-split slides
  n_slides: number;
  language: string;
  tone: 'default' | 'casual' | 'professional' | 'funny' | 'educational' | 'sales_pitch';
  verbosity: 'minimal' | 'concise' | 'standard' | 'text_heavy';
  text_mode: 'generate' | 'condense' | 'preserve';
  instructions?: string;
  audience?: string;
  theme: string;
  image_source: 'ai' | 'stock' | 'none';
  image_style?: 'photo' | 'abstract' | '3d' | 'line_art' | 'watercolor';
  per_slide_instructions?: string[];
}
```

---

### 2. Prompt Editor Control Panel (Gamma-style Sidebar)

**Left Panel - Settings:**
```tsx
interface PromptEditorSettings {
  // Text Content Section
  textMode: 'generate' | 'condense' | 'preserve';
  verbosity: 'minimal' | 'concise' | 'detailed' | 'extensive';
  audience: string;  // Free text: "executives", "students", etc.
  language: string;  // Dropdown with 50+ languages
  
  // Visuals Section
  theme: string;     // Theme ID with thumbnail preview
  imageSource: 'ai' | 'stock' | 'none';
  imageStyle: 'photo' | 'abstract' | '3d' | 'line_art';
}
```

**Center Panel - Live Card Preview:**
```tsx
// Editable outline cards showing:
// - Slide number
// - Auto-generated title (editable inline)
// - Content preview (first 100 chars)
// - Drag handle for reordering
// - Delete button
// - Per-card instruction input (optional)

interface OutlineCard {
  id: string;
  index: number;
  title: string;
  contentPreview: string;
  perSlideInstructions?: string;
  isEditing: boolean;
}
```

**Theme Picker Component:**
```tsx
const themes = [
  { id: 'modern-dark', name: 'Modern Dark', preview: '/themes/modern-dark.png', 
    colors: { primary: '#5146E5', bg: '#1a1a2e', text: '#ffffff' }},
  { id: 'clean-light', name: 'Clean Light', preview: '/themes/clean-light.png', 
    colors: { primary: '#2563eb', bg: '#ffffff', text: '#1f2937' }},
  { id: 'nature', name: 'Nature', preview: '/themes/nature.png', 
    colors: { primary: '#059669', bg: '#ecfdf5', text: '#064e3b' }},
  { id: 'sunset', name: 'Sunset', preview: '/themes/sunset.png',
    colors: { primary: '#f59e0b', bg: '#fffbeb', text: '#78350f' }},
  { id: 'midnight', name: 'Midnight', preview: '/themes/midnight.png',
    colors: { primary: '#8b5cf6', bg: '#0f0f1a', text: '#e2e8f0' }},
  // ... 10-15 themes total
];
```

---

### 3. Markdown Slide Renderer (THE CORE INNOVATION)

**Why Markdown?**
- No content truncation — blocks stack vertically, scroll if needed
- Separation of content and presentation — theme is just CSS variables
- "Preserve" mode works naturally — user markdown → rendered markdown
- One-click theme switch — just swap CSS variables, no content re-generation

**Block Types to Support:**

```typescript
type MarkdownBlock = 
  | { type: 'heading'; level: 1 | 2 | 3; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'bullet_list'; items: string[] }
  | { type: 'numbered_list'; items: string[] }
  | { type: 'metric_row'; metrics: { value: string; label: string; delta?: string }[] }
  | { type: 'quote'; text: string; attribution?: string }
  | { type: 'image'; src: string; alt: string; caption?: string }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'chart'; chartType: 'bar' | 'line' | 'pie' | 'donut'; data: ChartData }
  | { type: 'callout'; icon: string; title: string; body: string }
  | { type: 'code'; language: string; code: string }
  | { type: 'divider' }
  | { type: 'columns'; columns: MarkdownBlock[][] };
```

**Extended Markdown Syntax:**

```markdown
# Slide Title                          → heading level 1
## Section Header                      → heading level 2

Regular paragraph text here.           → paragraph

- Bullet point 1                       → bullet_list
- Bullet point 2
- Bullet point 3

1. Numbered item                       → numbered_list
2. Another item

> "Quote text here"                    → quote
> — Attribution Name

:::metric
73.2% | Conversion Rate | +12.5%
$1.2M | Revenue | -3.2%
42 | Active Users
:::                                    → metric_row

:::callout[icon=lightbulb]
**Key Insight**
This is the callout body text
:::                                    → callout

:::chart[type=bar]
| Category | Value |
|----------|-------|
| Q1       | 100   |
| Q2       | 150   |
:::                                    → chart

| Header 1 | Header 2 |                → table
|----------|----------|
| Cell 1   | Cell 2   |

![Alt text](image-url)                 → image

:::columns
Column 1 content here

---

Column 2 content here
:::                                    → columns
```

**React Renderer Components:**

```tsx
// BlockRenderer.tsx - Main dispatcher
const BlockRenderer: React.FC<{ block: MarkdownBlock }> = ({ block }) => {
  switch (block.type) {
    case 'heading': return <HeadingBlock {...block} />;
    case 'paragraph': return <ParagraphBlock {...block} />;
    case 'bullet_list': return <BulletListBlock {...block} />;
    case 'metric_row': return <MetricRowBlock {...block} />;
    case 'quote': return <QuoteBlock {...block} />;
    case 'chart': return <ChartBlock {...block} />;
    case 'table': return <TableBlock {...block} />;
    case 'callout': return <CalloutBlock {...block} />;
    case 'columns': return <ColumnsBlock {...block} />;
    default: return null;
  }
};

// SlideRenderer.tsx - Full slide with theme
const SlideRenderer: React.FC<{ 
  blocks: MarkdownBlock[]; 
  theme: Theme;
  isEditing: boolean;
}> = ({ blocks, theme, isEditing }) => {
  return (
    <div 
      className="slide-container"
      style={{
        '--primary-color': theme.colors.primary,
        '--background-color': theme.colors.bg,
        '--text-color': theme.colors.text,
        '--heading-font': theme.fonts.heading,
        '--body-font': theme.fonts.body,
      } as React.CSSProperties}
    >
      {blocks.map((block, i) => (
        <EditableBlockWrapper key={i} block={block} isEditing={isEditing}>
          <BlockRenderer block={block} />
        </EditableBlockWrapper>
      ))}
    </div>
  );
};
```

**Theme CSS Variables:**

```css
.slide-container {
  background: var(--background-color);
  color: var(--text-color);
  font-family: var(--body-font);
  padding: 48px;
  min-height: 100%;
  aspect-ratio: 16/9;
}

.slide-container h1, .slide-container h2, .slide-container h3 {
  font-family: var(--heading-font);
  color: var(--primary-color);
}

.metric-value {
  font-size: 3rem;
  font-weight: 700;
  color: var(--primary-color);
}

.metric-delta.positive { color: #10b981; }
.metric-delta.negative { color: #ef4444; }

.quote-text {
  font-style: italic;
  border-left: 4px solid var(--primary-color);
  padding-left: 1rem;
  font-size: 1.25rem;
}

.callout {
  background: color-mix(in srgb, var(--primary-color) 10%, transparent);
  border-left: 4px solid var(--primary-color);
  padding: 1rem;
  border-radius: 0.5rem;
}
```

---

### 4. Markdown Parser Implementation

```typescript
// services/markdown-parser.ts

interface ParseResult {
  blocks: MarkdownBlock[];
}

export function parseExtendedMarkdown(markdown: string): ParseResult {
  const blocks: MarkdownBlock[] = [];
  const lines = markdown.split('\n');
  
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    
    // Heading
    if (line.startsWith('# ')) {
      blocks.push({ type: 'heading', level: 1, text: line.slice(2) });
      i++;
      continue;
    }
    if (line.startsWith('## ')) {
      blocks.push({ type: 'heading', level: 2, text: line.slice(3) });
      i++;
      continue;
    }
    if (line.startsWith('### ')) {
      blocks.push({ type: 'heading', level: 3, text: line.slice(4) });
      i++;
      continue;
    }
    
    // Metric block
    if (line.startsWith(':::metric')) {
      const metrics: { value: string; label: string; delta?: string }[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith(':::')) {
        const parts = lines[i].split('|').map(p => p.trim());
        if (parts.length >= 2) {
          metrics.push({
            value: parts[0],
            label: parts[1],
            delta: parts[2] || undefined,
          });
        }
        i++;
      }
      blocks.push({ type: 'metric_row', metrics });
      i++; // skip closing :::
      continue;
    }
    
    // Callout block
    const calloutMatch = line.match(/^:::callout\[icon=(\w+)\]/);
    if (calloutMatch) {
      const icon = calloutMatch[1];
      i++;
      let title = '';
      let body = '';
      while (i < lines.length && !lines[i].startsWith(':::')) {
        const l = lines[i];
        if (l.startsWith('**') && l.endsWith('**')) {
          title = l.slice(2, -2);
        } else {
          body += l + '\n';
        }
        i++;
      }
      blocks.push({ type: 'callout', icon, title, body: body.trim() });
      i++;
      continue;
    }
    
    // Chart block
    const chartMatch = line.match(/^:::chart\[type=(\w+)\]/);
    if (chartMatch) {
      const chartType = chartMatch[1] as 'bar' | 'line' | 'pie' | 'donut';
      i++;
      // Parse table data for chart
      const data = parseTableData(lines, i);
      i = data.endIndex;
      blocks.push({ type: 'chart', chartType, data: data.chartData });
      i++;
      continue;
    }
    
    // Columns block
    if (line.startsWith(':::columns')) {
      i++;
      const columns: MarkdownBlock[][] = [[]];
      let currentCol = 0;
      while (i < lines.length && !lines[i].startsWith(':::')) {
        if (lines[i] === '---') {
          columns.push([]);
          currentCol++;
        } else {
          // Recursively parse column content
          const colContent = parseExtendedMarkdown(lines[i]);
          columns[currentCol].push(...colContent.blocks);
        }
        i++;
      }
      blocks.push({ type: 'columns', columns });
      i++;
      continue;
    }
    
    // Quote
    if (line.startsWith('> ')) {
      let text = line.slice(2);
      let attribution: string | undefined;
      i++;
      while (i < lines.length && lines[i].startsWith('> ')) {
        const l = lines[i].slice(2);
        if (l.startsWith('— ') || l.startsWith('- ')) {
          attribution = l.slice(2);
        } else {
          text += '\n' + l;
        }
        i++;
      }
      blocks.push({ type: 'quote', text: text.replace(/^"|"$/g, ''), attribution });
      continue;
    }
    
    // Bullet list
    if (line.startsWith('- ')) {
      const items: string[] = [];
      while (i < lines.length && lines[i].startsWith('- ')) {
        items.push(lines[i].slice(2));
        i++;
      }
      blocks.push({ type: 'bullet_list', items });
      continue;
    }
    
    // Numbered list
    if (/^\d+\. /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\. /, ''));
        i++;
      }
      blocks.push({ type: 'numbered_list', items });
      continue;
    }
    
    // Table
    if (line.includes('|') && lines[i + 1]?.includes('---')) {
      const headers = line.split('|').map(h => h.trim()).filter(Boolean);
      i += 2; // skip header and separator
      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes('|')) {
        rows.push(lines[i].split('|').map(c => c.trim()).filter(Boolean));
        i++;
      }
      blocks.push({ type: 'table', headers, rows });
      continue;
    }
    
    // Image
    const imgMatch = line.match(/!\[([^\]]*)\]\(([^)]+)\)/);
    if (imgMatch) {
      blocks.push({ type: 'image', alt: imgMatch[1], src: imgMatch[2] });
      i++;
      continue;
    }
    
    // Paragraph (default)
    if (line.trim()) {
      blocks.push({ type: 'paragraph', text: line });
    }
    i++;
  }
  
  return { blocks };
}
```

---

### 5. Supabase Integration (Project Import)

```python
# Backend endpoint for one-click generation from Solve Innovate project

@MARKDOWN_ROUTER.post("/project/{project_id}/generate")
async def generate_from_project(
    project_id: str,
    n_slides: int = Body(10),
    text_mode: str = Body("condense"),
    verbosity: str = Body("concise"),
    tone: str = Body("professional"),
    theme: str = Body("modern-dark"),
    language: str = Body("English"),
):
    """
    One-click PPT generation from Solve Innovate project.
    1. Fetch project data from Supabase
    2. Condense to presentation content
    3. Generate markdown slides
    4. Return presentation_id for streaming
    """
    from services.supabase_client import supabase_client
    
    # Fetch project
    response = supabase_client.table('projects').select('*').eq('id', project_id).single().execute()
    project = response.data
    
    # Build content from project fields
    content = f"""
# {project.get('title', 'Untitled Project')}

## Problem Statement
{project.get('problem_statement', '')}

## Research Findings
{project.get('research_findings', '')}

## Key Insights
{project.get('key_insights', '')}

## Solution
{project.get('solution_description', '')}

## Implementation Plan
{project.get('implementation_plan', '')}

## Metrics & KPIs
{project.get('metrics', '')}

## Next Steps
{project.get('next_steps', '')}
"""
    
    # Create presentation
    return await create_markdown_presentation(
        content=content,
        n_slides=n_slides,
        text_mode=text_mode,
        verbosity=verbosity,
        tone=tone,
        theme=theme,
        language=language,
    )
```

---

### 6. PPTX Export from Markdown

```python
# services/markdown_pptx_export.py

from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RgbColor
from pptx.enum.text import PP_ALIGN

async def export_markdown_to_pptx(
    slides_markdown: list[str],
    theme: dict,
    output_path: str
) -> str:
    """
    Convert markdown slides to PPTX.
    """
    prs = Presentation()
    prs.slide_width = Inches(16)
    prs.slide_height = Inches(9)
    
    for slide_md in slides_markdown:
        blocks = parse_extended_markdown(slide_md).blocks
        pptx_slide = prs.slides.add_slide(prs.slide_layouts[6])  # Blank
        
        y = Inches(0.5)
        for block in blocks:
            if block['type'] == 'heading':
                shape = pptx_slide.shapes.add_textbox(
                    Inches(0.5), y, Inches(15), Inches(1)
                )
                tf = shape.text_frame
                p = tf.paragraphs[0]
                p.text = block['text']
                p.font.size = Pt(44 if block['level'] == 1 else 32)
                p.font.bold = True
                p.font.color.rgb = RgbColor.from_string(theme['colors']['primary'][1:])
                y += Inches(1)
                
            elif block['type'] == 'bullet_list':
                shape = pptx_slide.shapes.add_textbox(
                    Inches(0.5), y, Inches(15), Inches(0.5 * len(block['items']))
                )
                tf = shape.text_frame
                for item in block['items']:
                    p = tf.add_paragraph() if tf.paragraphs[0].text else tf.paragraphs[0]
                    p.text = f"• {item}"
                    p.font.size = Pt(24)
                    p.level = 0
                y += Inches(0.5 * len(block['items']))
                
            elif block['type'] == 'metric_row':
                # Create metric boxes side by side
                n_metrics = len(block['metrics'])
                box_width = 14 / n_metrics
                for i, metric in enumerate(block['metrics']):
                    x = Inches(1 + i * box_width)
                    shape = pptx_slide.shapes.add_textbox(x, y, Inches(box_width - 0.5), Inches(1.5))
                    tf = shape.text_frame
                    p = tf.paragraphs[0]
                    p.text = metric['value']
                    p.font.size = Pt(48)
                    p.font.bold = True
                    p.font.color.rgb = RgbColor.from_string(theme['colors']['primary'][1:])
                    p.alignment = PP_ALIGN.CENTER
                    
                    p2 = tf.add_paragraph()
                    p2.text = metric['label']
                    p2.font.size = Pt(18)
                    p2.alignment = PP_ALIGN.CENTER
                    
                    if metric.get('delta'):
                        p3 = tf.add_paragraph()
                        p3.text = metric['delta']
                        p3.font.size = Pt(16)
                        p3.alignment = PP_ALIGN.CENTER
                        color = '10b981' if metric['delta'].startswith('+') else 'ef4444'
                        p3.font.color.rgb = RgbColor.from_string(color)
                y += Inches(2)
                
            elif block['type'] == 'quote':
                shape = pptx_slide.shapes.add_textbox(
                    Inches(1), y, Inches(14), Inches(2)
                )
                tf = shape.text_frame
                p = tf.paragraphs[0]
                p.text = f'"{block["text"]}"'
                p.font.size = Pt(28)
                p.font.italic = True
                
                if block.get('attribution'):
                    p2 = tf.add_paragraph()
                    p2.text = f"— {block['attribution']}"
                    p2.font.size = Pt(20)
                y += Inches(2.5)
            
            # ... handle other block types
    
    prs.save(output_path)
    return output_path
```

---

## Part 6: React Component Structure

```
src/
├── components/
│   ├── input/
│   │   ├── CardByCardInput.tsx       # Textarea with --- parsing
│   │   ├── FreeformInput.tsx         # Simple textarea
│   │   └── ModeToggle.tsx            # Freeform/Card-by-card switch
│   ├── editor/
│   │   ├── PromptEditor.tsx          # Main Gamma-style layout
│   │   ├── SettingsPanel.tsx         # Left sidebar
│   │   ├── OutlinePreview.tsx        # Center panel
│   │   ├── PerSlideInstructions.tsx  # Right panel
│   │   └── ThemePicker.tsx           # Theme grid with thumbnails
│   ├── renderer/
│   │   ├── SlideRenderer.tsx         # Full slide container
│   │   ├── BlockRenderer.tsx         # Block type dispatcher
│   │   ├── blocks/
│   │   │   ├── HeadingBlock.tsx
│   │   │   ├── ParagraphBlock.tsx
│   │   │   ├── BulletListBlock.tsx
│   │   │   ├── MetricRowBlock.tsx
│   │   │   ├── QuoteBlock.tsx
│   │   │   ├── ChartBlock.tsx        # Use recharts or chart.js
│   │   │   ├── TableBlock.tsx
│   │   │   ├── CalloutBlock.tsx
│   │   │   ├── ImageBlock.tsx
│   │   │   └── ColumnsBlock.tsx
│   │   └── EditableBlockWrapper.tsx  # Inline editing support
│   ├── viewer/
│   │   ├── PresentationViewer.tsx    # Main viewer with sidebar
│   │   ├── SlideThumbnails.tsx       # Left sidebar thumbnails
│   │   └── SlideContent.tsx          # Main slide area
│   └── export/
│       └── ExportButtons.tsx         # PPTX/PDF export
├── hooks/
│   ├── useMarkdownParser.ts          # Parse markdown to blocks
│   ├── usePresentationStream.ts      # SSE streaming hook
│   ├── useTheme.ts                   # Theme management
│   └── useInlineEdit.ts              # Block editing hook
├── services/
│   ├── api.ts                        # API client
│   └── markdown-parser.ts            # Extended markdown parser
├── store/
│   └── presentationSlice.ts          # Redux/Zustand state
├── types/
│   ├── blocks.ts                     # MarkdownBlock types
│   ├── theme.ts                      # Theme types
│   └── presentation.ts               # Presentation types
└── themes/
    ├── index.ts                      # Theme registry
    └── presets/                      # Theme JSON definitions
```

---

## Part 7: State Management

```typescript
// store/presentationSlice.ts

interface PresentationState {
  // Input phase
  inputMode: 'freeform' | 'card-by-card';
  rawContent: string;
  parsedSlides: string[];
  
  // Settings
  settings: {
    textMode: 'generate' | 'condense' | 'preserve';
    verbosity: 'minimal' | 'concise' | 'standard' | 'text_heavy';
    tone: string;
    audience: string;
    language: string;
    theme: string;
    imageSource: 'ai' | 'stock' | 'none';
    imageStyle: string;
  };
  
  // Outline editing
  outlineCards: OutlineCard[];
  
  // Generated presentation
  presentationId: string | null;
  slides: {
    id: string;
    markdown: string;
    blocks: MarkdownBlock[];
  }[];
  
  // UI state
  isStreaming: boolean;
  isEditing: boolean;
  selectedSlideIndex: number;
  
  // Per-slide instructions
  perSlideInstructions: Record<number, string>;
}

// Actions
const presentationSlice = createSlice({
  name: 'presentation',
  initialState,
  reducers: {
    setInputMode: (state, action) => { state.inputMode = action.payload },
    setRawContent: (state, action) => { state.rawContent = action.payload },
    parseCardByCard: (state) => {
      state.parsedSlides = state.rawContent.split(/\n---\n/).filter(Boolean);
    },
    updateSettings: (state, action) => { 
      state.settings = { ...state.settings, ...action.payload };
    },
    setTheme: (state, action) => { state.settings.theme = action.payload },
    addSlide: (state, action) => { state.slides.push(action.payload) },
    updateSlide: (state, action) => {
      const { index, markdown, blocks } = action.payload;
      state.slides[index] = { ...state.slides[index], markdown, blocks };
    },
    setStreaming: (state, action) => { state.isStreaming = action.payload },
    setSelectedSlide: (state, action) => { state.selectedSlideIndex = action.payload },
    setPerSlideInstruction: (state, action) => {
      const { index, instruction } = action.payload;
      state.perSlideInstructions[index] = instruction;
    },
  },
});
```

---

## Part 8: Implementation Order

### Week 1: Core Infrastructure
- [ ] Set up project structure
- [ ] Implement markdown parser for extended syntax
- [ ] Create block type definitions
- [ ] Build basic block renderers (heading, paragraph, bullets)
- [ ] Implement theme CSS variable system
- [ ] Create SlideRenderer component

### Week 2: Advanced Blocks + Backend
- [ ] MetricRowBlock, ChartBlock (use recharts), TableBlock
- [ ] CalloutBlock, QuoteBlock, ImageBlock
- [ ] ColumnsBlock for multi-column layouts
- [ ] Backend markdown generation prompt
- [ ] SSE streaming endpoint
- [ ] Connect frontend to streaming

### Week 3: Editor UI
- [ ] Card-by-card input with --- parsing
- [ ] Mode toggle (freeform/card-by-card)
- [ ] Settings panel (verbosity, tone, text mode)
- [ ] Theme picker with thumbnail previews
- [ ] Outline preview with inline editing
- [ ] Per-slide instructions panel

### Week 4: Polish + Export
- [ ] Inline block editing (click to edit)
- [ ] One-click theme switching
- [ ] PPTX export from markdown
- [ ] Supabase project import integration
- [ ] Per-slide regeneration
- [ ] Error handling and loading states

---

## Part 9: API Reference

### Backend Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/ppt/markdown/create` | Create markdown presentation |
| GET | `/api/v1/ppt/markdown/presentation/{id}/stream` | SSE stream slides |
| POST | `/api/v1/ppt/markdown/slide/regenerate` | Regenerate single slide |
| POST | `/api/v1/ppt/markdown/presentation/{id}/switch-theme` | Change theme |
| POST | `/api/v1/ppt/markdown/presentation/{id}/export/pptx` | Export to PPTX |
| POST | `/api/v1/ppt/markdown/project/{id}/generate` | Generate from Supabase project |

### Frontend API Service

```typescript
// services/api.ts

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const presentationApi = {
  create: async (params: CreatePresentationRequest) => {
    const res = await fetch(`${API_BASE}/api/v1/ppt/markdown/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return res.json();
  },

  streamSlides: (presentationId: string, onSlide: (slide: string) => void, onDone: () => void) => {
    const eventSource = new EventSource(
      `${API_BASE}/api/v1/ppt/markdown/presentation/${presentationId}/stream`
    );
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'done') {
        eventSource.close();
        onDone();
      } else if (data.type === 'slide') {
        onSlide(data.markdown);
      }
    };
    eventSource.onerror = () => eventSource.close();
    return () => eventSource.close();
  },

  regenerateSlide: async (presentationId: string, slideIndex: number, instructions?: string) => {
    const res = await fetch(`${API_BASE}/api/v1/ppt/markdown/slide/regenerate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ presentation_id: presentationId, slide_index: slideIndex, instructions }),
    });
    return res.json();
  },

  switchTheme: async (presentationId: string, theme: string) => {
    const res = await fetch(`${API_BASE}/api/v1/ppt/markdown/presentation/${presentationId}/switch-theme`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ new_theme: theme }),
    });
    return res.json();
  },

  exportPptx: async (presentationId: string) => {
    const res = await fetch(`${API_BASE}/api/v1/ppt/markdown/presentation/${presentationId}/export/pptx`, {
      method: 'POST',
    });
    const { path } = await res.json();
    window.open(path);
  },

  generateFromProject: async (projectId: string, settings: Partial<CreatePresentationRequest>) => {
    const res = await fetch(`${API_BASE}/api/v1/ppt/markdown/project/${projectId}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    return res.json();
  },
};
```

---

## Success Criteria

1. ✅ **No content truncation** - A slide with 20 bullet points renders all 20
2. ✅ **Preserve mode works** - User markdown appears exactly as written
3. ✅ **One-click theme switch** - Changing theme doesn't regenerate content
4. ✅ **Card-by-card control** - Users can define exact slide breaks with `---`
5. ✅ **Per-slide regeneration** - Regenerate one slide without affecting others
6. ✅ **Inline editing** - Click any text to edit it directly
7. ✅ **PPTX export** - Clean export with theme colors applied
8. ✅ **Supabase integration** - One-click generation from Solve Innovate project
