"""Builds LLM messages for spatial JSON canvas presentation generation."""

from __future__ import annotations

from typing import Dict, List, Optional

from models.llm_message import LLMSystemMessage, LLMUserMessage

SPATIAL_SYSTEM_PROMPT = """
You generate structured spatial JSON for a slide canvas editor. You are producing a high-end, Consultant-level presentation.

OUTPUT FORMAT
1) Return valid JSON only. No markdown. No prose.
2) Match the provided JSON schema exactly.
3) Every slide must include blocks.
4) Every block must include position: {x, y, width, height} using percentages in [0, 100].

LAYOUT RULES
1) Do not overlap blocks.
2) Ensure clear whitespace between blocks.
3) Keep all block rectangles fully inside the 0-100 canvas bounds.
4) Use a coherent, beautiful visual hierarchy (title first, supporting content below).
5) Maximize the use of empty space! Stretch content horizontally and vertically. Use columns, grids, metrics calls-outs, and varying text blocks to create rich, dense layouts. DO NOT leave slides empty or overly simple.
6) Distribute content effectively: instead of a single giant bulleted list, break it down into multiple structured text blocks (e.g., side-by-side columns, quadrants).

BLOCK RULES
1) text blocks require content and style.
2) image blocks require prompt; do not provide URLs. Limit the total number of image blocks in the entire presentation to 4 maximum. Focus on high-impact visual slides only.
3) chart blocks require chart_type and data points with numeric values.
4) Keep exact numbers, percentages, names, and quotes from source content.
5) Never invent unsupported quantitative facts.
6) You CAN use placeholder text or images if it helps to construct a beautiful layout, as long as the core content is preserved.
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
- This must look like a premium McKinsey/BCG/Bain deck.
- Fill the slide canvas! Don't just dump 3 text bullet points in the middle.
- If there is enough space, create complex, multi-column layouts using multiple blocks.
- Distribute content efficiently (e.g., 50% left side: visual, 50% right side: split into top and bottom text quadrants).
- Use rich formatting: Add titles, strong/bold emphasis, and descriptive labels to textual blocks.
- For data, use varied presentations.
- DO NOT be conservative. Write verbose text that fills the space appropriately if the density mode asks for it. Make things look beautiful, symmetrical, and dense!

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

## Spatial Layout Rules (Mandatory)
- Do not overlap blocks.
- Calculate x and y so blocks keep clear whitespace.
- Keep x, y, width, height in [0, 100].
- Ensure x + width <= 100 and y + height <= 100.

## Visual Generation
- Include AI Images: {include_images}
- Include Data Charts: {include_charts}

If Include AI Images is true, add image blocks with prompt text only. IMPORTANT: Maximum 4 Image Blocks in total across the entire presentation.
If Include Data Charts is true, for quantitative slides add chart blocks using data points from the provided quantitative datasets.

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
