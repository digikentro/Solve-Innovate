"""
Builds LLM messages for markdown-based presentation generation.

This prompt contract is capacity-aware:
- `n_slides` is a target, not a hard cap.
- If content does not fit a 16:9 slide, the model must create continuation
  slides using markdown separators (`---`).
"""

from __future__ import annotations

from typing import Dict, List, Literal, Optional

from models.llm_message import LLMSystemMessage, LLMUserMessage

GenerationScope = Literal["deck", "single_slide"]


MARKDOWN_SYSTEM_PROMPT = """
You generate presentation slides in markdown.

OUTPUT RULES
1) Use markdown only.
2) Separate slides with a line containing only `---`.
3) Do not include prose outside slide content.
4) Keep exact numbers, percentages, names, and quotes verbatim.
5) Never use filler openings like "This slide covers...".

STRUCTURE RULES
- Prefer one clear idea per slide.
- For dense content, split into continuation slides instead of cramming.
- Continuation titles should end with "(cont.)".
- Use compact bullets and tables that fit a 16:9 slide.

ALLOWED MARKDOWN FEATURES
- Headings: # ## ###
- Bullets and numbered lists
- Tables
- Quotes
- Bold / italic
- Optional custom blocks:
  :::metric
  :::callout[icon=...]
  :::chart[type=bar|line|pie|donut]
- Images: ![alt](image:description of what the image should show)
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
    verbosity: str,
    text_mode: str,
    audience: Optional[str] = None,
    instructions: Optional[str] = None,
    slides_markdown: Optional[List[str]] = None,
    per_slide_instructions: Optional[List[str]] = None,
    include_images: bool = False,
    include_charts: bool = False,
    generation_scope: GenerationScope = "deck",
) -> List[LLMSystemMessage | LLMUserMessage]:
    """
    Build [system, user] messages for markdown slide generation.

    `generation_scope` controls output shape:
    - "deck": output multiple slides separated by `---`
    - "single_slide": output exactly one slide and no separators
    """

    target_slides = max(1, n_slides)
    budget = _capacity_budget(verbosity)

    cards_section = _build_cards_section(slides_markdown)
    per_slide_section = _build_per_slide_section(
        slides_markdown, per_slide_instructions
    )

    if generation_scope == "single_slide":
        output_contract = (
            "Output exactly ONE slide body. Do not emit `---` separators."
        )
    else:
        output_contract = (
            "Output a full deck separated by `---`. "
            f"Treat {target_slides} as the target count, but add continuation slides "
            "when content would overflow a 16:9 slide."
        )

    user_prompt = f"""
## Generation Scope
- Scope: {generation_scope}
- {output_contract}

## Generation Parameters
- Target slide count: {target_slides}
- Language: {language}
- Tone: {tone}
- Text mode: {text_mode}
- Audience: {audience or "General stakeholders"}
- Verbosity: {verbosity}

## Capacity Budget (per 16:9 slide)
- Max bullets: {budget["max_bullets"]}
- Max words per bullet: {budget["max_words_per_bullet"]}
- Max paragraph words: {budget["max_paragraph_words"]}
- Max table rows: {budget["max_table_rows"]}
- If limits are exceeded, create continuation slides with "(cont.)" titles.

## Content Fidelity Rules
- Preserve exact numbers/percentages and quoted text.
- Preserve person and framework names exactly.
- Do not invent unsupported data.
- If the source follows a 12-stage innovation pipeline, preserve stage order as guidance only.
- Do not force any fixed slide count template.

## Visual Generation (Experimental)
- Include AI Images: {include_images}
- Include Data Charts: {include_charts}

{
    "If 'Include AI Images' is True: You MUST insert exactly one relevant image per every 2-3 slides using: ![alt description](image:prompt for image generation)." if include_images else ""
}
{
    "If 'Include Data Charts' is True: For slides with dense numeric tables, you MUST also add a :::chart[type=bar|line|pie|donut] block below the table summarizing the key trend." if include_charts else ""
}

## Additional Instructions
{instructions or "None"}
{cards_section}
{per_slide_section}

## Source Content
{content}
""".strip()

    return [
        LLMSystemMessage(content=MARKDOWN_SYSTEM_PROMPT.strip()),
        LLMUserMessage(content=user_prompt),
    ]
