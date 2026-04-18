"""Builds LLM messages for spatial JSON canvas presentation generation."""

from __future__ import annotations

from typing import Dict, List, Optional

from models.llm_message import LLMSystemMessage, LLMUserMessage

SPATIAL_SYSTEM_PROMPT = """
You are a Lead Designer for a top-tier strategy and editorial presentation team building board-ready, founder-ready, and investor-ready decks.
You generate structured spatial JSON for a slide canvas editor.

DECK PRIORITIES
- Make the story feel like a sharp strategy memo turned into a presentation: tension, insight, recommendation, evidence, next step.
- Lead with claims, not labels. Every slide title should read like a conclusion, decision, or pressure point.
- Use the project research as proof, but do not waste space on methodology unless it directly changes the recommendation.
- Keep every slide executive-level, visually disciplined, and easy to scan at presentation distance.
- If evidence exists, prefer charts, metric rows, tables, scorecards, and comparisons over generic image slides.
- Make the deck feel data-backed and opinionated: at least 2 slides should be explicitly data-heavy when quantitative datasets are provided.
- For market research, testing, and idea clustering, compress the slide into what matters: what was learned, what it means, and what should happen next.

CONTENT STYLE
- Write like a strategist with an editorial point of view. Use crisp, assertive language. Avoid filler, hedging, and tutorial phrasing.
- Favor strong nouns and verbs over passive descriptions.
- Do not name slides with generic labels like "Overview" or "Details" when a sharper claim is available.
- When a section is weak or exploratory, show that honestly and compress it into a bridge slide instead of padding it.
- Keep the tone mixing consulting rigor with magazine-level clarity: analytical, polished, and a little more distinctive than a standard corporate deck.

PHASE 1: CANVAS COORDINATES (0-100)
- TITLE ZONE: Always at y=[5, 15], height~10. Width 60-90.
- MAIN CONTENT ZONE: y=[18, 85]. This is where the magic happens.
- BRANDING ZONE: y=[90, 95]. Small text or shapes.
- GUTTER: Keep a 5% margin from all edges.

PHASE 2: LAYOUT ARCHETYPES
1) THE HERO: Large statement slide, data callout, or image with a single thesis.
2) THE SPLIT: Left 50% for evidence/chart, Right 50% for synthesis and implications.
3) THE TRIO: Three balanced columns for before / after / next or insight / evidence / action.
4) THE QUADRANT: Four boxes for comparative analysis, option scoring, or cluster mapping.
5) THE JOURNEY: Horizontal flow using shape connectors and sequential text blocks for funnels, journeys, or decision paths.
6) THE SCORECARD: A compact matrix of options, clusters, or metrics with a recommendation highlighted.

PHASE 3: BLOCK RULES
1) text blocks: Use 'variant' (title, heading, body, bullets). Keep z_index clear.
2) image blocks: Include high-quality prompts. Limit to 4 slides total in the deck.
3) chart blocks: REQUIRED for 'Data-Heavy' slides. Use provided dataset points.
4) shape blocks: Use lines or rectangles to create 'Boxed' layouts or connectors.
5) icon blocks: Search for relevant business icons.
6) When the evidence pack includes section_evidence_depth or section_numeric_signals, those values must be charted exactly as provided. Do not invent, normalize, or smooth them.

SYMMETRY & DENSITY
- Symmetrical layouts feel more professional.
- Use 'width: fill_container' style logic (width ~ 90% if single column).
- Never overlap. Use x+width and y+height math to verify gaps.
- Prefer one dominant idea per slide and convert supporting detail into callouts, charts, or comparison blocks.
- Avoid skinny boxes and clipped text. Prefer 2-3 well-proportioned regions over many tiny blocks.
- Avoid icon blocks unless the slide truly needs them; use shapes, callouts, or images instead.
- Never use placeholder icons, empty image frames, or decorative filler text.
- Keep slide titles short, strong, and specific. Avoid generic titles like "Overview" or "Structure" when a more narrative title is possible.
- If a slide is data-light, use a bold visual hero, quote, comparison, or scorecard layout rather than padding with weak bullets.
- Use editorial spacing: generous breathing room around the title, a defined left-to-right reading path, and one visual anchor per slide.
- Use visual contrast intentionally: dense evidence slides can be tighter, but story slides should feel spacious and confident.
"""


VERBOSITY_BUDGETS: Dict[str, Dict[str, int]] = {
    "minimal": {
        "max_bullets": 4,
        "max_words_per_bullet": 10,
        "max_paragraph_words": 40,
        "max_table_rows": 5,
    },
    "concise": {
        "max_bullets": 6,
        "max_words_per_bullet": 14,
        "max_paragraph_words": 65,
        "max_table_rows": 7,
    },
    "standard": {
        "max_bullets": 8,
        "max_words_per_bullet": 18,
        "max_paragraph_words": 95,
        "max_table_rows": 9,
    },
    "text_heavy": {
        "max_bullets": 10,
        "max_words_per_bullet": 24,
        "max_paragraph_words": 130,
        "max_table_rows": 12,
    },
}


def _capacity_budget(verbosity: str) -> Dict[str, int]:
    return VERBOSITY_BUDGETS.get(verbosity, VERBOSITY_BUDGETS["concise"])


def _build_cards_section(slides_markdown: Optional[List[str]]) -> str:
    if not slides_markdown:
        return ""
    lines = ["", "## Slide Seeds (user-defined order)"]
    for index, slide in enumerate(slides_markdown, start=1):
        lines.append(f"\n### Seed {index}\n{slide}")
    return "\n".join(lines)


def _build_per_slide_section(
    slides_markdown: Optional[List[str]],
    per_slide_instructions: Optional[List[str]],
) -> str:
    if not slides_markdown or not per_slide_instructions:
        return ""
    lines = ["", "## Per-Slide Instructions"]
    for index, instruction in enumerate(per_slide_instructions, start=1):
        if instruction and instruction.strip():
            lines.append(f"- Slide {index}: {instruction.strip()}")
    return "\n".join(lines) if len(lines) > 1 else ""


def get_markdown_generation_messages(
    content: str,
    n_slides: int,
    language: str,
    tone: str,
    density: str,
    visual_preference: str,
    audience: Optional[str] = None,
    instructions: Optional[str] = None,
    slides_markdown: Optional[List[str]] = None,
    per_slide_instructions: Optional[List[str]] = None,
    include_images: bool = False,
    include_charts: bool = False,
    quantitative_datasets: Optional[List[Dict[str, object]]] = None,
) -> List[LLMSystemMessage | LLMUserMessage]:
    """Build [system, user] messages for spatial JSON deck generation."""

    target_slides = max(1, n_slides)
    budget = _capacity_budget(density.lower())

    cards_section = _build_cards_section(slides_markdown)
    per_slide_section = _build_per_slide_section(
        slides_markdown, per_slide_instructions
    )

    dataset_section = "[]"
    if quantitative_datasets:
        import json

        dataset_section = json.dumps(quantitative_datasets[:20], ensure_ascii=False, indent=2)

    user_prompt = f"""
## Generation Parameters
- Target slide count: {target_slides}
- Language: {language}
- Tone: {tone}
- Density: {density}
- Visual preference: {visual_preference}
- Audience: {audience or "General stakeholders"}

## Consultant-Level Layout Instructions
- This must look like a premium strategy deck with editorial clarity, not a template-driven slide dump.
- Build a clear story arc: cover, agenda or framing, insight, evidence, recommendation, and closing action.
- If there is enough space, create complex, multi-column layouts using multiple blocks.
- Distribute content efficiently, but keep a single visual anchor per slide so the eye knows where to land first.
- Use rich formatting: strong slide titles, bold emphasis, and descriptive labels for every block.
- For data, use varied presentations and make the most important metric or comparison visually dominant.
- Prefer elegant whitespace over overcrowding. The deck should feel designed, not squeezed.
- Use only as many blocks as needed to make the slide feel intentional. Fewer, larger, better-aligned blocks are better than many cramped ones.
- Never create placeholder-style icon columns or unlabeled decorative boxes.
- Never put important text inside very narrow columns; if a column would be skinny, merge it into a wider section.
- Make every slide feel like a polished consulting deliverable with a point of view, not a rough worksheet.
- Prefer project-provided facts, metrics, prototypes, and screenshots over invented decorative visuals.
- If a slide can be expressed as a chart, table, metric row, recommendation matrix, or comparison scorecard, choose that over a stock or AI image.
- If you do use an image block, it should support a specific claim or story beat from the source data, not just fill space.
- When quantitative data is present, dedicate at least one slide to a section evidence chart and one slide to a metric/table summary.
- For market research and testing, emphasize outcome, severity, and implication; avoid method-heavy recaps.
- For idea clustering, show the best clusters, why they matter, and which one wins. Do not present all clusters with equal weight.

## Content Density Rules
- If density is 'Concise', text blocks may contain at most 4 bullets.
- Otherwise, text blocks should stay within the following target budget:
    - Max bullets: {budget["max_bullets"]}
- Max words per bullet: {budget["max_words_per_bullet"]}
- Max paragraph words: {budget["max_paragraph_words"]}
- Max chart rows: {budget["max_table_rows"]}

## Content Fidelity Rules
- Preserve exact numbers/percentages and quoted text.
- Preserve person and framework names exactly.
- Do not invent unsupported data.
- Map every important slide back to a real section from the project pipeline: research, as-is map, user profiles, deep empathy, behavior frameworks, ideation, prototype, testing, or market research.
- Make the strongest evidence visible early. Do not bury the most strategic section at the end if it should anchor the argument.
- If the source contains statistics, turn them into charts, metric rows, or tables instead of burying them in bullets.
- If the source contains stepwise workflows or funnel stages, use process, journey, or comparison layouts.
- If the source contains prototype or product artifacts, feature them as real visual assets rather than generic stock imagery.
- Use the exact labels from the datasets where possible so the viewer can trace chart values back to the project sections.
- For slides about market research, testing, and idea clustering, write the conclusion first, then the evidence. The slide should answer "so what?" immediately.

## Spatial Layout Rules (Mandatory)
- Do not overlap blocks.
- Calculate x and y so blocks keep clear whitespace.
- Keep x, y, width, height in [0, 100].
- Ensure x + width <= 100 and y + height <= 100.
- Avoid layouts where any text container is narrower than about 16 width units unless it is a label, chip, or icon.
- If you use three columns, ensure each column is visually balanced and the gutters are consistent.

## Visual Generation
- Include AI Images: {include_images}
- Include Data Charts: {include_charts}

If Include AI Images is true, add image blocks only when the source clearly benefits from a visual hero or product illustration. IMPORTANT: Maximum 4 Image Blocks in total across the entire presentation. Do not use images just to fill space. Prefer using product/prototype imagery, charts, icons, or diagrams derived from the source pipeline whenever available.
If Include Data Charts is true, for quantitative slides add chart blocks using data points from the provided quantitative datasets.
- Rotate chart types across the deck when data supports it. Do not repeat bar charts on every quantitative slide; vary between bar, line, pie, donut, and area so the deck feels intentionally designed.
- If the evidence pack includes section_evidence_depth or section_numeric_signals, use those datasets for at least one chart slide and one comparison slide.

## Quantitative Datasets (from source research)
{dataset_section}

## Additional Instructions
{instructions or "None"}
{cards_section}
{per_slide_section}

## Source Content
{content}
""".strip()

    return [
        LLMSystemMessage(content=SPATIAL_SYSTEM_PROMPT.strip()),
        LLMUserMessage(content=user_prompt),
    ]
