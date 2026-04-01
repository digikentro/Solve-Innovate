"""
generate_brief_from_project.py

Takes raw JSONB data from a Supabase project row and condenses it into a
presentation-ready markdown brief using STRUCTURED output (Pydantic schema).

Why structured output instead of free-text:
  - Schema is enforced at the JSON level — [ROLE:] tags, section count, and
    field types can never be missing or malformed.
  - Pydantic validates the response before it reaches the frontend.
  - A post-generation fidelity check verifies that key numbers/percentages
    from the source data appear verbatim in the output, and raises a clear
    error instead of silently returning a degraded brief.
"""

from __future__ import annotations

import json
import re
from typing import Any, Dict, List, Literal

from fastapi import HTTPException
from pydantic import BaseModel, Field, model_validator

from models.llm_message import LLMSystemMessage, LLMUserMessage
from services.llm_client import LLMClient
from utils.llm_client_error_handler import handle_llm_client_exceptions
from utils.llm_provider import get_model

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

JSONB_COLUMNS = [
    "analysis",
    "canvas",
    "as_is_map",
    "extreme_user_data",
    "deep_empathy_data",
    "psychological_analysis",
    "transformation_framework",
    "Behaviour_Framework",
    "HMW_Ideation_Framework",
    "research_data",
    "Idea_Clustering_and_Idea_Cards",
    "final_idea",
    "testing",
    "market_research",
]

VALID_ROLES = Literal[
    "cover",
    "table_of_contents",
    "key_insight",
    "data_heavy",
    "chart_visual",
    "persona_cards",
    "journey_map",
    "comparison",
    "quote",
    "list_detail",
    "table_data",
    "closing",
    "psychological_analysis",
    "testing",
    "canvas",
    "as_is_map",
    "extreme_user_data",
    "deep_empathy_data",
    "transformation_framework",
    "Behaviour_Framework",
    "HMW_Ideation_Framework",
    "research_data",
    "Idea_Clustering_and_Idea_Cards",
    "final_idea",
    "market_research",
]

# Minimum fraction of source numbers that must appear verbatim in the brief.
FIDELITY_THRESHOLD = 0.70

# ---------------------------------------------------------------------------
# Pydantic output schema — enforced by generate_structured()
# ---------------------------------------------------------------------------

class BriefSection(BaseModel):
    """A single slide-worthy section of the presentation brief."""

    role: VALID_ROLES = Field(
        description="Semantic role for layout selection. Must be one of the 12 valid values."
    )
    heading: str = Field(
        min_length=3,
        max_length=120,
        description="Concise slide heading. No filler like 'This section covers...'.",
    )
    content: str = Field(
        min_length=20,
        max_length=2000,
        description=(
            "Slide content in markdown. Preserve exact numbers, persona names, "
            "verbatim quotes, and framework names from the source data."
        ),
    )

    @model_validator(mode="after")
    def no_filler_openings(self) -> "BriefSection":
        filler_prefixes = (
            "this section",
            "in this section",
            "this slide",
            "let's look at",
            "here we",
            "we will",
            "we explore",
        )
        lowered = self.content.lower()
        for phrase in filler_prefixes:
            if lowered.startswith(phrase):
                raise ValueError(
                    f"Content must not start with filler phrase '{phrase}'. "
                    "Start directly with substance."
                )
        return self


class PresentationBrief(BaseModel):
    """Structured brief — one object per slide-worthy section."""

    sections: List[BriefSection] = Field(
        min_length=6,
        max_length=20,
        description=(
            "Ordered sections. First must be role='cover', last must be role='closing'."
        ),
    )

    @model_validator(mode="after")
    def validate_cover_and_closing(self) -> "PresentationBrief":
        if not self.sections:
            return self
        if self.sections[0].role != "cover":
            raise ValueError("First section must have role='cover'.")
        if self.sections[-1].role != "closing":
            raise ValueError("Last section must have role='closing'.")
        return self


# ---------------------------------------------------------------------------
# System prompt
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """
You are a senior presentation strategist. Read raw project research data
(JSONB columns from a design-thinking / innovation database) and produce a
structured JSON brief for an AI presentation generator.

# Output Schema
Return a JSON object with this exact shape:
{
  "sections": [
    {
      "role": "<one of the 12 valid roles>",
      "heading": "<concise slide heading>",
      "content": "<slide content in markdown>"
    }
  ]
}

# Valid Roles — use exactly one per section
cover | table_of_contents | key_insight | data_heavy | chart_visual |
persona_cards | journey_map | comparison | quote | list_detail | table_data | closing

# Column → Role Mapping Guide
- analysis                       → key_insight or data_heavy
- canvas                         → list_detail or comparison
- as_is_map                      → journey_map
- extreme_user_data              → persona_cards
- deep_empathy_data              → quote or persona_cards
- psychological_analysis         → key_insight or list_detail
- transformation_framework       → journey_map
- Behaviour_Framework            → list_detail or key_insight
- HMW_Ideation_Framework         → list_detail
- research_data                  → data_heavy or chart_visual
- Idea_Clustering_and_Idea_Cards → list_detail
- final_idea                     → key_insight or list_detail
- testing                        → data_heavy or testing
- market_research                → data_heavy or chart_visual or market_research
- psychological_analysis         → key_insight or psychological_analysis
- canvas                         → list_detail or comparison or canvas
- as_is_map                      → journey_map or as_is_map

# Mandatory Rules
1. First section role="cover". Last section role="closing".
2. Aim for 8–16 sections. One slide-worthy insight per section.
3. Preserve VERBATIM from the source:
   - All percentages and numbers (73.2% stays 73.2% — never ~73%)
   - Persona names with descriptors ("Ritu, the rural micro-entrepreneur")
   - Direct quotes with attribution, enclosed in quotation marks
   - Framework names by their exact name (B=MAP, MECE, HMW, JTBD)
   - Stage numbers and names together ("Stage 3: Ideation", not just "Ideation")
4. Never start content with filler: "This section covers", "In this section",
   "This slide explores", "Let's look at", "Here we discuss". Start with substance.
5. content field: use markdown (bullets, bold). Max ~200 words per section.
""".strip()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _extract_numbers(text: str) -> List[str]:
    """Return all numeric tokens (integers, decimals, percentages) from text."""
    return re.findall(r"\b\d+(?:\.\d+)?%?", text)


def _serialize_project_data(project_row: Dict[str, Any]) -> str:
    """Serialize non-null JSONB columns into a labelled text block for the LLM."""
    parts: list[str] = []

    # Metadata fields first so the LLM can use them for the cover title
    for meta_key in ("title", "name", "project_name", "description"):
        val = project_row.get(meta_key)
        if val:
            parts.append(f"### {meta_key}\n{val}")

    for col in JSONB_COLUMNS:
        value = project_row.get(col)
        if value is None:
            continue
        try:
            serialized = json.dumps(value, ensure_ascii=False, indent=2)
        except (TypeError, ValueError):
            serialized = str(value)
        parts.append(f"### {col}\n{serialized}")

    return "\n\n".join(parts)


def _validate_fidelity(source_text: str, brief: PresentationBrief) -> List[str]:
    """
    Check that at least FIDELITY_THRESHOLD of numeric tokens from the source
    appear verbatim somewhere in the brief.

    Returns list of missing tokens (empty list = pass).
    """
    source_numbers = set(_extract_numbers(source_text))
    if not source_numbers:
        return []

    brief_text = " ".join(f"{s.heading} {s.content}" for s in brief.sections)
    missing = [n for n in source_numbers if n not in brief_text]

    if len(missing) / len(source_numbers) > (1 - FIDELITY_THRESHOLD):
        return missing
    return []


def _brief_to_markdown(brief: PresentationBrief) -> str:
    """Render the validated structured brief to markdown for the downstream pipeline."""
    parts: list[str] = []
    for section in brief.sections:
        parts.append(
            f"[ROLE: {section.role}]\n## {section.heading}\n\n{section.content}"
        )
    return "\n\n---\n\n".join(parts)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

async def generate_brief_from_project(project_row: Dict[str, Any]) -> str:
    """
    Convert a raw Supabase project row into a validated, presentation-ready
    markdown brief.

    Steps:
      1. Serialize JSONB columns to labelled text.
      2. Call generate_structured() → LLM fills the PresentationBrief schema.
      3. Pydantic validates role constraints and cover/closing order.
      4. Numeric fidelity check — fails loudly if >30% of source numbers are
         absent from the brief (prevents silent paraphrasing).
      5. Serialize the validated model to markdown for the frontend.

    Returns:
        Markdown string with --- separators and [ROLE: ...] tags per section.

    Raises:
        HTTPException 422: Schema validation failed (bad roles, wrong order).
        HTTPException 422: Fidelity check failed (numbers missing from brief).
        HTTPException 5xx: LLM provider error.
    """
    data_text = _serialize_project_data(project_row)

    messages = [
        LLMSystemMessage(content=SYSTEM_PROMPT),
        LLMUserMessage(
            content=(
                "Here is the raw project data. Produce the structured JSON brief.\n\n"
                f"{data_text}"
            )
        ),
    ]

    client = LLMClient()
    model = get_model()

    try:
        raw = await client.generate_structured(
            model=model,
            messages=messages,
            response_format=PresentationBrief.model_json_schema(),
            strict=False,
            max_tokens=4096,
        )
    except Exception as e:
        raise handle_llm_client_exceptions(e)

    # --- Schema validation (Pydantic) ---
    try:
        brief = PresentationBrief.model_validate(raw)
    except Exception as exc:
        raise HTTPException(
            status_code=422,
            detail=f"Brief schema validation failed: {exc}",
        ) from exc

    # --- Content fidelity check ---
    missing_numbers = _validate_fidelity(data_text, brief)
    if missing_numbers:
        raise HTTPException(
            status_code=422,
            detail=(
                f"Brief fidelity check failed: {len(missing_numbers)} numeric value(s) "
                f"from the source data are absent from the generated brief: "
                f"{missing_numbers[:10]}. "
                "The LLM likely paraphrased data instead of quoting it verbatim. "
                "Please retry."
            ),
        )

    return _brief_to_markdown(brief)
