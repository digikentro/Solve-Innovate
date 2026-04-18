"""
markdown_presentation.py

All endpoints related to markdown-based presentation generation.

Routes (all under prefix /markdown added by the parent router):
  POST /create                              — create a new presentation record
  GET  /presentation/{id}/stream            — SSE-stream slide generation
  POST /slide/regenerate                    — regenerate a single slide
  POST /presentation/{id}/switch-theme      — change theme (no re-generation)
  POST /presentation/{id}/export/pptx       — export to .pptx file
  POST /project/{project_id}/generate       — one-click from Supabase project
"""

from __future__ import annotations

import json
import logging
import os
import re
import uuid
from typing import Any, Dict, List, Literal, Optional
from urllib.parse import quote

from fastapi import APIRouter, Body, Depends, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.sql.markdown_presentation import MarkdownPresentationModel
from models.sql.project_presentation import ProjectPresentationModel
from models.sql.project_presentation_revision import ProjectPresentationRevisionModel
from models.image_prompt import ImagePrompt
from models.llm_message import LLMSystemMessage, LLMUserMessage
from services.database import get_async_session
from services.llm_client import LLMClient
from services.image_generation_service import ImageGenerationService
from utils.asset_directory_utils import get_exports_directory, get_images_directory
from utils.llm_calls.generate_brief_from_project import generate_brief_from_project
from utils.llm_calls.generate_markdown_slides import get_markdown_generation_messages
from utils.llm_provider import get_model

MARKDOWN_ROUTER = APIRouter(prefix="/markdown", tags=["Markdown Presentations"])

logger = logging.getLogger(__name__)

# ─── Response / request models ───────────────────────────────────────────────


class CreatePresentationResponse(BaseModel):
    presentation_id: str


class PresentationSummaryResponse(BaseModel):
    id: str
    theme: str
    n_slides: int
    language: str
    generated_slides: Optional[List[str]]


class RegenerateSlideResponse(BaseModel):
    slide_index: int
    markdown: str


class SwitchThemeResponse(BaseModel):
    success: bool
    theme: str


class ExportPptxResponse(BaseModel):
    path: str


class ProjectPresentationSummary(BaseModel):
    id: str
    project_id: str
    title: str
    status: str
    created_at: str
    updated_at: str
    current_revision_id: Optional[str] = None
    current_markdown_presentation_id: Optional[str] = None
    current_slide_count: Optional[int] = None
    logo_url: Optional[str] = None
    logo_position: Optional[str] = None
    preview_title: Optional[str] = None
    preview_snippet: Optional[str] = None


class CreateProjectPresentationResponse(BaseModel):
    presentation_id: str


class RenameProjectPresentationRequest(BaseModel):
    title: str


class DeleteProjectPresentationResponse(BaseModel):
    success: bool
    presentation_id: str


class GenerateProjectPresentationResponse(BaseModel):
    presentation_id: str
    markdown_presentation_id: str
    revision_id: str
    editor_payload: Dict[str, Any]


class OutlineSlideDraft(BaseModel):
    title: str
    bullets: List[str]
    visual_intent: Literal[
        "Data-Heavy",
        "Visual-Hero",
        "Narrative",
        "Comparison",
        "Process",
    ] = "Narrative"
    has_quantitative_data: bool = False


class OutlineDraft(BaseModel):
    slides: List[OutlineSlideDraft]


class SpatialPosition(BaseModel):
    x: float = Field(ge=0, le=100)
    y: float = Field(ge=0, le=100)
    width: float = Field(gt=0, le=100)
    height: float = Field(gt=0, le=100)


class SpatialTextStyle(BaseModel):
    variant: Literal["title", "subtitle", "heading", "body", "bullets", "caption"] = "body"
    emphasis: Optional[Literal["normal", "strong"]] = "normal"
    font_size: Optional[int] = None
    align: Optional[Literal["left", "center", "right"]] = "left"


class SpatialTextBlock(BaseModel):
    id: str
    type: Literal["text"]
    position: SpatialPosition
    content: str
    style: SpatialTextStyle


class SpatialImageBlock(BaseModel):
    id: str
    type: Literal["image"]
    position: SpatialPosition
    prompt: str
    caption: Optional[str] = None


class SpatialChartDataPoint(BaseModel):
    label: str
    value: float


class SpatialChartBlock(BaseModel):
    id: str
    type: Literal["chart"]
    position: SpatialPosition
    chart_type: Literal["bar", "line", "pie", "donut", "area"]
    data: List[SpatialChartDataPoint]
    title: Optional[str] = None

class SpatialShapeBlock(BaseModel):
    id: str
    type: Literal["shape"]
    position: SpatialPosition
    shape_type: Literal["square", "circle", "rectangle", "triangle", "line"]
    color: Optional[str] = None


class SpatialIconBlock(BaseModel):
    id: str
    type: Literal["icon"]
    position: SpatialPosition
    icon_query: str
    color: Optional[str] = None


class SpatialTableData(BaseModel):
    headers: List[str]
    rows: List[List[str]]

class SpatialTableBlock(BaseModel):
    id: str
    position: SpatialPosition
    type: Literal['table']
    data: SpatialTableData
    color: Optional[str] = None

SpatialBlock = SpatialTextBlock | SpatialImageBlock | SpatialChartBlock | SpatialShapeBlock | SpatialIconBlock | SpatialTableBlock


class SpatialSlide(BaseModel):
    id: str
    title: str
    visual_intent: str
    chart_candidate: bool = False
    blocks: List[SpatialBlock]


class SpatialDeckPayload(BaseModel):
    format: Literal["spatial-json-canvas"] = "spatial-json-canvas"
    version: str = "1.0"
    slides: List[SpatialSlide]


class OutlineDraftResponse(BaseModel):
    presentation_id: str
    revision_id: Optional[str] = None
    outline: Optional[OutlineDraft] = None


class EditorStatePayload(BaseModel):
    markdown_presentation_id: Optional[str] = None
    editor_payload: Dict[str, Any]
    theme: Optional[str] = None
    logo_url: Optional[str] = None
    logo_position: Optional[str] = None
    custom_colors: Optional[Dict[str, str]] = None


class EditorStateResponse(BaseModel):
    presentation_id: str
    editor: Dict[str, Any]


# ─── Helpers ─────────────────────────────────────────────────────────────────


async def _get_presentation_or_404(
    presentation_id: str,
    sql_session: AsyncSession,
) -> MarkdownPresentationModel:
    try:
        pres_uuid = uuid.UUID(presentation_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid presentation ID format.")

    presentation = await sql_session.get(MarkdownPresentationModel, pres_uuid)
    if not presentation:
        raise HTTPException(
            status_code=404,
            detail=f"Markdown presentation '{presentation_id}' not found.",
        )
    return presentation


STREAM_SEPARATOR_RE = re.compile(r"\r?\n\s*---\s*\r?\n")
SENTENCE_SPLIT_RE = re.compile(r"(?<=[.!?])\s+")
WORD_RE = re.compile(r"\S+")

VERBOSITY_LIMITS: Dict[str, Dict[str, int]] = {
    "minimal": {
        "max_bullets": 4,
        "max_words_per_bullet": 10,
        "max_paragraph_words": 40,
        "max_table_rows": 5,
        "max_table_cell_words": 12,
    },
    "concise": {
        "max_bullets": 6,
        "max_words_per_bullet": 14,
        "max_paragraph_words": 65,
        "max_table_rows": 7,
        "max_table_cell_words": 16,
    },
    "standard": {
        "max_bullets": 8,
        "max_words_per_bullet": 18,
        "max_paragraph_words": 95,
        "max_table_rows": 9,
        "max_table_cell_words": 20,
    },
    "text_heavy": {
        "max_bullets": 10,
        "max_words_per_bullet": 24,
        "max_paragraph_words": 130,
        "max_table_rows": 12,
        "max_table_cell_words": 24,
    },
}


def _get_limits(verbosity: str) -> Dict[str, int]:
    return VERBOSITY_LIMITS.get(verbosity, VERBOSITY_LIMITS["concise"])


def _normalize_newlines(text: str) -> str:
    return text.replace("\r\n", "\n").replace("\r", "\n")


def _split_markdown_slides(markdown: str) -> List[str]:
    normalized = _normalize_newlines(markdown or "").strip()
    if not normalized:
        return []

    slides: List[str] = []
    buffer: List[str] = []
    for line in normalized.split("\n"):
        if line.strip() == "---":
            candidate = "\n".join(buffer).strip()
            if candidate:
                slides.append(candidate)
            buffer = []
            continue
        buffer.append(line)

    candidate = "\n".join(buffer).strip()
    if candidate:
        slides.append(candidate)
    return slides


def _take_complete_slides_from_buffer(buffer: str) -> tuple[List[str], str]:
    slides: List[str] = []
    while True:
        match = STREAM_SEPARATOR_RE.search(buffer)
        if not match:
            break
        candidate = buffer[: match.start()].strip()
        if candidate:
            slides.append(candidate)
        buffer = buffer[match.end() :]
    return slides, buffer


def _word_count(text: str) -> int:
    return len(WORD_RE.findall(text or ""))


def _split_words(text: str, max_words: int) -> List[str]:
    words = (text or "").split()
    if len(words) <= max_words:
        return [" ".join(words).strip()] if words else []
    chunks: List[str] = []
    for start in range(0, len(words), max_words):
        chunk = " ".join(words[start : start + max_words]).strip()
        if chunk:
            chunks.append(chunk)
    return chunks


def _split_sentences_to_word_chunks(text: str, max_words: int) -> List[str]:
    sentences = [s.strip() for s in SENTENCE_SPLIT_RE.split((text or "").strip()) if s.strip()]
    if not sentences:
        return []

    chunks: List[str] = []
    current: List[str] = []
    current_words = 0

    for sentence in sentences:
        sentence_words = _word_count(sentence)
        if sentence_words > max_words:
            if current:
                chunks.append(" ".join(current).strip())
                current = []
                current_words = 0
            chunks.extend(_split_words(sentence, max_words))
            continue
        if current_words + sentence_words > max_words and current:
            chunks.append(" ".join(current).strip())
            current = [sentence]
            current_words = sentence_words
            continue
        current.append(sentence)
        current_words += sentence_words

    if current:
        chunks.append(" ".join(current).strip())
    return chunks


def _is_list_line(line: str) -> bool:
    stripped = line.strip()
    return bool(
        stripped.startswith("- ")
        or stripped.startswith("* ")
        or re.match(r"^\d+\.\s+", stripped)
    )


def _is_table_separator(line: str) -> bool:
    stripped = line.strip()
    if "|" not in stripped:
        return False
    compact = stripped.replace("|", "").replace(":", "").replace(" ", "")
    return bool(compact) and set(compact) <= {"-"}


def _parse_table_row(line: str) -> List[str]:
    raw = line.strip()
    if raw.startswith("|"):
        raw = raw[1:]
    if raw.endswith("|"):
        raw = raw[:-1]
    return [cell.strip() for cell in raw.split("|")]


def _render_table_row(cells: List[str]) -> str:
    escaped = [(cell or "").replace("|", r"\|").strip() for cell in cells]
    return f"| {' | '.join(escaped)} |"


def _extract_heading_and_body(slide_markdown: str) -> tuple[Optional[str], List[str]]:
    lines = _normalize_newlines(slide_markdown).split("\n")
    first_non_empty = next((i for i, line in enumerate(lines) if line.strip()), None)
    if first_non_empty is None:
        return None, []
    candidate = lines[first_non_empty].strip()
    if candidate.startswith("#"):
        body = lines[first_non_empty + 1 :]
        return candidate, body
    return None, lines[first_non_empty:]


def _continuation_heading(heading: Optional[str]) -> Optional[str]:
    if not heading:
        return None
    match = re.match(r"^(#{1,3})\s+(.*)$", heading.strip())
    if not match:
        return heading
    prefix, text = match.groups()
    normalized = re.sub(r"\s*\(cont\.\)\s*$", "", text.strip(), flags=re.IGNORECASE)
    return f"{prefix} {normalized} (cont.)"


def _blockify_body_lines(body_lines: List[str]) -> List[Dict[str, Any]]:
    blocks: List[Dict[str, Any]] = []
    i = 0
    while i < len(body_lines):
        line = body_lines[i]
        if not line.strip():
            i += 1
            continue

        if line.strip().startswith(":::"):
            custom_lines = [line]
            i += 1
            while i < len(body_lines) and not body_lines[i].strip().startswith(":::"):
                custom_lines.append(body_lines[i])
                i += 1
            if i < len(body_lines):
                custom_lines.append(body_lines[i])
                i += 1
            blocks.append({"type": "custom", "lines": custom_lines})
            continue

        if line.strip().startswith("```"):
            code_lines = [line]
            i += 1
            while i < len(body_lines) and not body_lines[i].strip().startswith("```"):
                code_lines.append(body_lines[i])
                i += 1
            if i < len(body_lines):
                code_lines.append(body_lines[i])
                i += 1
            blocks.append({"type": "custom", "lines": code_lines})
            continue

        if line.strip().startswith("#"):
            blocks.append({"type": "custom", "lines": [line]})
            i += 1
            continue

        if (
            "|" in line
            and i + 1 < len(body_lines)
            and _is_table_separator(body_lines[i + 1])
        ):
            table_lines = [line, body_lines[i + 1]]
            i += 2
            while i < len(body_lines) and body_lines[i].strip() and "|" in body_lines[i]:
                table_lines.append(body_lines[i])
                i += 1
            blocks.append({"type": "table", "lines": table_lines})
            continue

        if _is_list_line(line):
            list_lines = [line]
            i += 1
            while i < len(body_lines) and body_lines[i].strip() and _is_list_line(body_lines[i]):
                list_lines.append(body_lines[i])
                i += 1
            blocks.append({"type": "list", "lines": list_lines})
            continue

        paragraph_lines = [line]
        i += 1
        while i < len(body_lines) and body_lines[i].strip():
            next_line = body_lines[i]
            if _is_list_line(next_line):
                break
            if "|" in next_line and i + 1 < len(body_lines) and _is_table_separator(body_lines[i + 1]):
                break
            paragraph_lines.append(next_line)
            i += 1
        blocks.append({"type": "paragraph", "lines": paragraph_lines})
    return blocks


def _split_list_block(lines: List[str], limits: Dict[str, int]) -> List[Dict[str, Any]]:
    first = lines[0].strip()
    numbered = bool(re.match(r"^\d+\.\s+", first))

    raw_items: List[str] = []
    for line in lines:
        stripped = line.strip()
        item = re.sub(r"^([-*]|\d+\.)\s+", "", stripped).strip()
        if item:
            raw_items.append(item)

    expanded_items: List[str] = []
    for item in raw_items:
        parts = _split_sentences_to_word_chunks(item, limits["max_words_per_bullet"])
        expanded_items.extend(parts if parts else [item])

    out: List[Dict[str, Any]] = []
    chunk_size = max(1, limits["max_bullets"])
    for start in range(0, len(expanded_items), chunk_size):
        chunk = expanded_items[start : start + chunk_size]
        if numbered:
            rendered = [f"{index + 1}. {text}" for index, text in enumerate(chunk)]
        else:
            rendered = [f"- {text}" for text in chunk]
        out.append(
            {
                "type": "list",
                "text": "\n".join(rendered),
                "bullet_items": len(chunk),
                "table_rows": 0,
                "paragraph_words": 0,
            }
        )
    return out


def _split_table_block(lines: List[str], limits: Dict[str, int]) -> List[Dict[str, Any]]:
    headers = _parse_table_row(lines[0])
    data_rows = [_parse_table_row(row_line) for row_line in lines[2:]]
    header_count = len(headers)

    expanded_rows: List[List[str]] = []
    for row in data_rows:
        padded = (row + [""] * header_count)[:header_count]
        cell_chunks = [
            _split_words(cell, limits["max_table_cell_words"]) or [cell]
            for cell in padded
        ]
        max_len = max(len(chunks) for chunks in cell_chunks) if cell_chunks else 1
        for idx in range(max_len):
            expanded_rows.append(
                [chunks[idx] if idx < len(chunks) else "" for chunks in cell_chunks]
            )

    if not expanded_rows:
        expanded_rows = [["" for _ in headers]]

    chunk_size = max(1, limits["max_table_rows"])
    blocks: List[Dict[str, Any]] = []
    for start in range(0, len(expanded_rows), chunk_size):
        chunk_rows = expanded_rows[start : start + chunk_size]
        text_lines = [
            _render_table_row(headers),
            _render_table_row(["---"] * len(headers)),
            *[_render_table_row(row) for row in chunk_rows],
        ]
        blocks.append(
            {
                "type": "table",
                "text": "\n".join(text_lines),
                "bullet_items": 0,
                "table_rows": len(chunk_rows),
                "paragraph_words": 0,
            }
        )
    return blocks


def _split_paragraph_block(lines: List[str], limits: Dict[str, int]) -> List[Dict[str, Any]]:
    text = " ".join(line.strip() for line in lines if line.strip())
    if not text:
        return []
    chunks = _split_sentences_to_word_chunks(text, limits["max_paragraph_words"])
    if not chunks:
        chunks = _split_words(text, limits["max_paragraph_words"])
    return [
        {
            "type": "paragraph",
            "text": chunk,
            "bullet_items": 0,
            "table_rows": 0,
            "paragraph_words": _word_count(chunk),
        }
        for chunk in chunks
    ]


def _split_blocks_for_capacity(
    body_lines: List[str], limits: Dict[str, int]
) -> List[Dict[str, Any]]:
    blocks = _blockify_body_lines(body_lines)
    output: List[Dict[str, Any]] = []
    for block in blocks:
        block_type = block["type"]
        lines = block["lines"]
        if block_type == "list":
            output.extend(_split_list_block(lines, limits))
            continue
        if block_type == "table":
            output.extend(_split_table_block(lines, limits))
            continue
        if block_type == "custom":
            custom_text = "\n".join(lines).strip()
            if custom_text:
                output.append(
                    {
                        "type": "custom",
                        "text": custom_text,
                        "bullet_items": 0,
                        "table_rows": 0,
                        "paragraph_words": limits["max_paragraph_words"],
                    }
                )
            continue
        output.extend(_split_paragraph_block(lines, limits))
    return output


def _pack_split_blocks(
    heading: Optional[str],
    blocks: List[Dict[str, Any]],
    limits: Dict[str, int],
) -> List[str]:
    """
    Pack split blocks into slides. Strategy (priority order):
      1. Try to fit everything into a single-column slide.
      2. If overflow, try to fit into 2 columns (left col + right col).
      3. If still overflow, try 3 columns.
      4. Only spill to a new slide when content is truly too large for 3 columns.
    """

    def _blocks_fit(group: List[Dict[str, Any]], col_multiplier: float = 1.0) -> bool:
        """Check whether a group of blocks fits within column-adjusted limits."""
        total_bullets = sum(int(b["bullet_items"]) for b in group)
        total_rows = sum(int(b["table_rows"]) for b in group)
        total_words = sum(int(b["paragraph_words"]) for b in group)
        adj_bullets = int(limits["max_bullets"] * col_multiplier)
        adj_rows = int(limits["max_table_rows"] * col_multiplier)
        adj_words = int(limits["max_paragraph_words"] * col_multiplier)
        return total_bullets <= adj_bullets and total_rows <= adj_rows and total_words <= adj_words

    def _render_blocks_text(group: List[Dict[str, Any]]) -> str:
        """Render a list of blocks as markdown text lines."""
        lines = []
        for b in group:
            lines.append(b["text"].strip())
            lines.append("")
        return "\n".join(lines).strip()

    def _try_pack_into_columns(group: List[Dict[str, Any]], n_cols: int) -> Optional[str]:
        """
        Try to split `group` evenly across `n_cols` columns.
        Returns the :::columns markdown string if it fits, else None.
        """
        # Each column gets at most 1/n_cols of the limits (with a small padding factor).
        col_factor = (1.0 / n_cols) * 1.1  # 10% headroom

        # Split into roughly equal column groups
        total = len(group)
        if total == 0:
            return None

        chunk_size = max(1, (total + n_cols - 1) // n_cols)
        column_groups = [group[i : i + chunk_size] for i in range(0, total, chunk_size)]

        # Check each column fits within column capacity
        for col_group in column_groups:
            if not _blocks_fit(col_group, col_factor * n_cols):
                return None  # A column still overflows

        # Build :::columns markdown
        lines = [":::columns"]
        for ci, col_group in enumerate(column_groups):
            if ci > 0:
                lines.append("---")
            lines.append(_render_blocks_text(col_group))
        lines.append(":::")
        return "\n".join(lines)

    # ── Phase 1: Greedily assign blocks to pages ─────────────────────────────
    pages: List[List[Dict[str, Any]]] = []
    current: List[Dict[str, Any]] = []

    for block in blocks:
        trial = current + [block]
        if _blocks_fit(trial):
            current.append(block)
        else:
            if current:
                pages.append(current)
            current = [block]

    if current:
        pages.append(current)

    if not pages:
        return []

    # ── Phase 2: Merge overflow pages using columns where possible ────────────
    merged_pages: List[str] = []  # each entry is a slide markdown body (no heading)
    continuation = _continuation_heading(heading)

    page_idx = 0
    while page_idx < len(pages):
        page = pages[page_idx]
        page_text = _render_blocks_text(page)

        # Already fits single column → output as-is
        if _blocks_fit(page):
            merged_pages.append(page_text)
            page_idx += 1
            continue

        # Try merging with next page(s) into 2 or 3 columns
        combined = False
        for n_cols in (2, 3):
            # Try to merge this page + up to (n_cols-1) following pages into columns
            candidates = []
            flat_blocks: List[Dict[str, Any]] = []
            for look_ahead in range(n_cols):
                idx = page_idx + look_ahead
                if idx < len(pages):
                    candidates.append(pages[idx])
                    flat_blocks.extend(pages[idx])
                else:
                    break

            if len(candidates) < 2:
                continue

            col_md = _try_pack_into_columns(flat_blocks, n_cols)
            if col_md is not None:
                merged_pages.append(col_md)
                page_idx += len(candidates)
                combined = True
                break

        if not combined:
            # Cannot fit into columns — output as single overflowing slide
            merged_pages.append(page_text)
            page_idx += 1

    # ── Phase 3: Attach headings and emit final slide strings ─────────────────
    slides: List[str] = []
    for index, body_text in enumerate(merged_pages):
        lines: List[str] = []
        if heading:
            lines.append(heading if index == 0 else (continuation or heading))
            lines.append("")
        lines.append(body_text)
        candidate = "\n".join(lines).strip()
        if candidate:
            slides.append(candidate)
    return slides


def _split_slide_for_capacity(slide_markdown: str, verbosity: str) -> List[str]:
    limits = _get_limits(verbosity)
    heading, body_lines = _extract_heading_and_body(slide_markdown)
    blocks = _split_blocks_for_capacity(body_lines, limits)
    if not blocks:
        cleaned = slide_markdown.strip()
        return [cleaned] if cleaned else []
    return _pack_split_blocks(heading, blocks, limits)


def _normalize_generated_slides(slides: List[str], verbosity: str) -> List[str]:
    normalized: List[str] = []
    for slide in slides:
        for maybe_slide in _split_markdown_slides(slide):
            normalized.extend(_split_slide_for_capacity(maybe_slide, verbosity))
    return [slide for slide in normalized if slide.strip()]


def _outline_to_slide_seeds(outline_payload: Dict[str, Any]) -> List[str]:
    slides = outline_payload.get("slides") if isinstance(outline_payload, dict) else None
    if not isinstance(slides, list):
        return []

    seeds: List[str] = []
    for idx, raw_slide in enumerate(slides, start=1):
        if not isinstance(raw_slide, dict):
            continue
        title = str(raw_slide.get("title") or f"Slide {idx}").strip()
        raw_bullets = raw_slide.get("bullets") or raw_slide.get("details") or []
        bullets = (
            [str(item).strip() for item in raw_bullets if str(item).strip()]
            if isinstance(raw_bullets, list)
            else []
        )
        lines = [f"## {title}"]
        if bullets:
            lines.extend(f"- {item}" for item in bullets)
        seeds.append("\n".join(lines))
    return seeds


def _coerce_outline_payload(raw_outline: Dict[str, Any]) -> Dict[str, Any]:
    slides = raw_outline.get("slides") if isinstance(raw_outline, dict) else None
    if not isinstance(slides, list):
        return {"slides": []}

    normalized_slides: List[Dict[str, Any]] = []
    for index, item in enumerate(slides):
        if not isinstance(item, dict):
            continue
        bullets = item.get("bullets") or item.get("details") or []
        if not isinstance(bullets, list):
            bullets = []
        normalized_slides.append(
            {
                "title": str(item.get("title") or f"Slide {index + 1}").strip(),
                "bullets": [str(each).strip() for each in bullets if str(each).strip()],
                "visual_intent": item.get("visual_intent") or "Narrative",
                "has_quantitative_data": bool(item.get("has_quantitative_data") or item.get("chart_candidate")),
            }
        )

    return {"slides": normalized_slides}


def _collect_numeric_pairs(value: Any, path: str = "") -> List[Dict[str, Any]]:
    rows: List[Dict[str, Any]] = []
    if isinstance(value, dict):
        for key, inner in value.items():
            next_path = f"{path}.{key}" if path else str(key)
            rows.extend(_collect_numeric_pairs(inner, next_path))
        return rows

    if isinstance(value, list):
        for index, inner in enumerate(value):
            next_path = f"{path}[{index}]"
            rows.extend(_collect_numeric_pairs(inner, next_path))
        return rows

    if isinstance(value, (int, float)) and not isinstance(value, bool):
        rows.append({"label": path or "value", "value": float(value)})
    return rows


def _extract_quantitative_datasets(project: Dict[str, Any]) -> List[Dict[str, Any]]:
    datasets: List[Dict[str, Any]] = []
    candidate_fields = [
        "research_data",
        "research_findings",
        "market_research",
        "metrics",
        "analysis",
        "as_is_map",
        "extreme_user_data",
        "deep_empathy_data",
        "psychological_analysis",
        "Behaviour_Framework",
        "HMW_Ideation_Framework",
        "Idea_Clustering_and_Idea_Cards",
        "transformation_framework",
        "final_idea",
        "prototype_images",
        "testing",
        "design_research",
    ]

    for field in candidate_fields:
        normalized = _normalize_project_value(project.get(field))
        if normalized is None:
            continue
        numeric_rows = _collect_numeric_pairs(normalized, field)
        if not numeric_rows:
            continue
        datasets.append(
            {
                "source": field,
                "data": numeric_rows[:20],
            }
        )
    return datasets


_PROJECT_PIPELINE_SECTIONS: List[tuple[str, str]] = [
    ("problem_statement", "Problem Statement"),
    ("as_is_map", "As-Is Map"),
    ("extreme_user_data", "Extreme User Data"),
    ("deep_empathy_data", "Deep Empathy Data"),
    ("psychological_analysis", "Psychological Analysis"),
    ("Behaviour_Framework", "Behaviour Framework"),
    ("HMW_Ideation_Framework", "HMW / Ideation Framework"),
    ("Idea_Clustering_and_Idea_Cards", "Idea Clustering and Idea Cards"),
    ("transformation_framework", "Transformation Framework"),
    ("market_research", "Market Research"),
    ("research_data", "Research Data"),
    ("research_findings", "Research Findings"),
    ("key_insights", "Key Insights"),
    ("analysis", "Analysis"),
    ("final_idea", "Final Idea"),
    ("implementation_plan", "Implementation Plan"),
    ("prototype_images", "Prototype Images"),
    ("testing", "Testing"),
    ("design_research", "Design Research"),
]


def _count_meaningful_nodes(value: Any) -> int:
    normalized = _normalize_project_value(value)
    if normalized is None:
        return 0
    if isinstance(normalized, dict):
        total = sum(_count_meaningful_nodes(inner) for inner in normalized.values())
        if total:
            return total
        return 1 if any(_has_meaningful_content(inner) for inner in normalized.values()) else 0
    if isinstance(normalized, list):
        total = sum(_count_meaningful_nodes(inner) for inner in normalized)
        if total:
            return total
        return sum(1 for inner in normalized if _has_meaningful_content(inner))
    if isinstance(normalized, str):
        return 1 if normalized.strip() else 0
    if isinstance(normalized, (int, float)) and not isinstance(normalized, bool):
        return 1
    if isinstance(normalized, bool):
        return 1
    return 0


def _build_section_evidence_pack(project: Dict[str, Any]) -> Dict[str, Any]:
    section_depth_points: List[Dict[str, Any]] = []
    numeric_signal_points: List[Dict[str, Any]] = []
    summary = {
        "populated_sections": 0,
        "total_evidence_nodes": 0,
        "total_numeric_points": 0,
        "prototype_sections": 0,
        "list_sections": 0,
    }

    for field, label in _PROJECT_PIPELINE_SECTIONS:
        normalized = _normalize_project_value(project.get(field))
        if not _has_meaningful_content(normalized):
            continue

        summary["populated_sections"] += 1
        evidence_depth = max(1, _count_meaningful_nodes(normalized))
        numeric_rows = _collect_numeric_pairs(normalized, field)
        summary["total_evidence_nodes"] += evidence_depth
        summary["total_numeric_points"] += len(numeric_rows)
        if field == "prototype_images":
            summary["prototype_sections"] += 1
        if isinstance(normalized, list):
            summary["list_sections"] += 1

        section_depth_points.append({"label": label, "value": float(evidence_depth)})
        numeric_signal_points.append({"label": label, "value": float(len(numeric_rows))})

    datasets: List[Dict[str, Any]] = []
    if section_depth_points:
        datasets.append({"source": "section_evidence_depth", "data": section_depth_points})
    if numeric_signal_points:
        datasets.append({"source": "section_numeric_signals", "data": numeric_signal_points})

    return {"summary": summary, "datasets": datasets}


def _fallback_icon_data_uri(color: Optional[str]) -> str:
    fill = f"#{color.lstrip('#')}" if isinstance(color, str) and color.strip() else "#D97706"
    svg = (
        "<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'>"
        f"<rect width='160' height='160' rx='40' fill='{fill}' fill-opacity='0.14'/>"
        f"<circle cx='80' cy='80' r='30' fill='{fill}' fill-opacity='0.9'/>"
        f"<circle cx='80' cy='80' r='12' fill='white' fill-opacity='0.95'/>"
        f"<path d='M80 24v18M80 118v18M24 80h18M118 80h18M40 40l13 13M107 107l13 13M40 120l13-13M107 53l13-13' stroke='{fill}' stroke-width='10' stroke-linecap='round' opacity='0.8'/>"
        "</svg>"
    )
    return f"data:image/svg+xml;charset=UTF-8,{quote(svg)}"


_CHART_TYPE_CYCLE = ["bar", "line", "donut", "area", "pie"]


def _normalize_chart_type_cycle(chart_types: Optional[List[str]]) -> List[str]:
    selected: List[str] = []
    for chart_type in chart_types or []:
        normalized = chart_type.strip().lower()
        if normalized in _CHART_TYPE_CYCLE and normalized not in selected:
            selected.append(normalized)
    for fallback in _CHART_TYPE_CYCLE:
        if fallback not in selected:
            selected.append(fallback)
    return selected


def _choose_chart_type(
    slide: SpatialSlide,
    slide_index: int,
    chart_index: int,
    chart_cycle: List[str],
) -> str:
    intent = (slide.visual_intent or "").lower()
    if "comparison" in intent and "bar" in chart_cycle:
        return "bar"
    if "process" in intent and "area" in chart_cycle:
        return "area"
    if "visual-hero" in intent and "donut" in chart_cycle:
        return "donut"
    if "narrative" in intent and "line" in chart_cycle:
        return "line"
    if "data-heavy" in intent and "bar" in chart_cycle:
        return "bar"
    return chart_cycle[(slide_index + chart_index) % len(chart_cycle)]


def _collect_fallback_slide_seeds(content: str, limit: int) -> List[str]:
    seeds: List[str] = []
    current_title = "Presentation"
    current_body: List[str] = []

    for line in content.splitlines():
        stripped = line.strip()
        if not stripped:
            continue
        if stripped.startswith("## "):
            if current_body:
                seeds.append("\n".join([f"## {current_title}", *current_body]).strip())
                current_body = []
            current_title = stripped.replace("## ", "", 1).strip() or current_title
            continue
        if stripped.startswith("# "):
            continue
        current_body.append(stripped)

    if current_body:
        seeds.append("\n".join([f"## {current_title}", *current_body]).strip())

    if not seeds:
        seeds = [f"## {current_title}\n- Key evidence and recommendation."]

    return seeds[: max(1, limit)]


def _parse_seed_title_and_bullets(seed: str) -> tuple[str, List[str]]:
    lines = [line.strip() for line in seed.splitlines() if line.strip()]
    title = "Presentation"
    bullets: List[str] = []
    for line in lines:
        if line.startswith("## "):
            title = line.replace("## ", "", 1).strip() or title
            continue
        if line.startswith("- "):
            bullets.append(line[2:].strip())
        elif line.startswith("* "):
            bullets.append(line[2:].strip())
        elif re.match(r"^\d+\.\s+", line):
            bullets.append(re.sub(r"^\d+\.\s+", "", line).strip())
        elif not bullets:
            bullets.append(line)
    return title, [bullet for bullet in bullets if bullet]


def _build_fallback_spatial_deck(
    *,
    content: str,
    n_slides: int,
    slides_markdown: Optional[List[str]],
    quantitative_datasets: List[Dict[str, Any]],
    chart_types: Optional[List[str]],
) -> SpatialDeckPayload:
    seeds = slides_markdown or _collect_fallback_slide_seeds(content, n_slides)
    chart_cycle = _normalize_chart_type_cycle(chart_types)
    fallback_chart_data = quantitative_datasets[0].get("data", []) if quantitative_datasets else []

    slides: List[SpatialSlide] = []
    for index, seed in enumerate(seeds[: max(1, n_slides)]):
        title, bullets = _parse_seed_title_and_bullets(seed)
        visual_intent = "Data-Heavy" if fallback_chart_data and index % 3 == 1 else ("Visual-Hero" if len(bullets) <= 1 else "Narrative")
        blocks: List[SpatialBlock] = []

        blocks.append(
            SpatialTextBlock(
                id=f"slide-{index + 1}-title",
                type="text",
                position=SpatialPosition(x=6, y=6, width=56, height=12),
                content=title,
                style=SpatialTextStyle(variant="title", emphasis="strong", align="left"),
            )
        )

        if bullets:
            body_content = "<ul>" + "".join(f"<li>{bullet}</li>" for bullet in bullets[:5]) + "</ul>"
        else:
            body_content = "<p>Strategic summary unavailable from source; using a resilient fallback narrative.</p>"

        if fallback_chart_data and visual_intent == "Data-Heavy":
            blocks.append(
                SpatialTextBlock(
                    id=f"slide-{index + 1}-body",
                    type="text",
                    position=SpatialPosition(x=6, y=21, width=40, height=58),
                    content=body_content,
                    style=SpatialTextStyle(variant="bullets", align="left"),
                )
            )
            blocks.append(
                SpatialChartBlock(
                    id=f"slide-{index + 1}-chart",
                    type="chart",
                    position=SpatialPosition(x=49, y=20, width=45, height=50),
                    chart_type=_choose_chart_type(
                        SpatialSlide(
                            id=f"slide-{index + 1}",
                            title=title,
                            visual_intent=visual_intent,
                            chart_candidate=True,
                            blocks=[],
                        ),
                        index,
                        0,
                        chart_cycle,
                    ),
                    data=[SpatialChartDataPoint(**item) for item in fallback_chart_data[:8]],
                    title=title,
                )
            )
        else:
            blocks.append(
                SpatialTextBlock(
                    id=f"slide-{index + 1}-body",
                    type="text",
                    position=SpatialPosition(x=6, y=21, width=86, height=58),
                    content=body_content,
                    style=SpatialTextStyle(variant="bullets", align="left"),
                )
            )

        slides.append(
            SpatialSlide(
                id=f"slide-{index + 1}",
                title=title,
                visual_intent=visual_intent,
                chart_candidate=bool(fallback_chart_data and visual_intent == "Data-Heavy"),
                blocks=blocks,
            )
        )

    return SpatialDeckPayload(slides=slides)


async def _resolve_visual_blocks(
    deck: SpatialDeckPayload,
    *,
    image_source: str,
    image_model: str,
    chart_types: Optional[List[str]] = None,
) -> SpatialDeckPayload:
    images_directory = get_images_directory()
    image_service = ImageGenerationService(output_directory=images_directory)
    # Icon RAG/search disabled — see icon_finder_service.py
    # from services.icon_finder_service import ICON_FINDER_SERVICE

    for slide in deck.slides:
        for block in slide.blocks:
            if isinstance(block, SpatialImageBlock):
                try:
                    generated = await image_service.generate_image(
                        ImagePrompt(
                            prompt=block.prompt,
                            image_source=image_source,
                            image_model=image_model,
                        )
                    )
                    if isinstance(generated, str):
                        block.prompt = generated
                    else:
                        block.prompt = os.path.abspath(generated.path)
                except Exception as exc:  # noqa: BLE001
                    logger.warning("Image generation failed for block=%s: %s", block.id, exc)
            elif isinstance(block, SpatialIconBlock):
                block.icon_query = _fallback_icon_data_uri(block.color)
                # try:
                #     results = await ICON_FINDER_SERVICE.search_icons(query=block.icon_query, k=1)
                #     if results and len(results) > 0:
                #         block.icon_query = results[0]
                # except Exception as exc:
                #     logger.warning("Icon search failed for block=%s: %s", block.id, exc)
    chart_cycle = _normalize_chart_type_cycle(chart_types)
    for slide_index, slide in enumerate(deck.slides):
        chart_index = 0
        for block in slide.blocks:
            if isinstance(block, SpatialChartBlock):
                block.chart_type = _choose_chart_type(slide, slide_index, chart_index, chart_cycle)
                chart_index += 1
    return deck


async def _build_spatial_deck(
    *,
    content: str,
    n_slides: int,
    language: str,
    tone: str,
    density: str,
    visual_preference: str,
    audience: Optional[str],
    instructions: Optional[str],
    slides_markdown: Optional[List[str]],
    include_images: bool,
    include_charts: bool,
    quantitative_datasets: List[Dict[str, Any]],
    image_source: str,
    image_model: str,
    chart_types: Optional[List[str]] = None,
) -> SpatialDeckPayload:
    messages = get_markdown_generation_messages(
        content=content,
        n_slides=n_slides,
        language=language,
        tone=tone,
        density=density,
        visual_preference=visual_preference,
        audience=audience,
        instructions=instructions,
        slides_markdown=slides_markdown,
        include_images=include_images,
        include_charts=include_charts,
        quantitative_datasets=quantitative_datasets,
    )
    llm_client = LLMClient()
    try:
        structured = await llm_client.generate_structured(
            model=get_model(),
            messages=messages,
            response_format=SpatialDeckPayload.model_json_schema(),
            strict=True,
            max_tokens=12000,
        )
        deck = SpatialDeckPayload(**structured)
    except Exception as exc:  # noqa: BLE001
        logger.warning(
            "Spatial deck generation failed; falling back to deterministic deck. %s",
            exc,
        )
        deck = _build_fallback_spatial_deck(
            content=content,
            n_slides=n_slides,
            slides_markdown=slides_markdown,
            quantitative_datasets=quantitative_datasets,
            chart_types=chart_types,
        )

    # Guarantee chart blocks always contain numeric data from source datasets.
    fallback_chart_data = []
    if quantitative_datasets:
        fallback_chart_data = quantitative_datasets[0].get("data", [])

    for slide in deck.slides:
        for block in slide.blocks:
            if isinstance(block, SpatialChartBlock) and not block.data and fallback_chart_data:
                block.data = [SpatialChartDataPoint(**item) for item in fallback_chart_data[:8]]

    deck = await _resolve_visual_blocks(
        deck,
        image_source=image_source,
        image_model=image_model,
        chart_types=chart_types,
    )
    return deck


async def _build_generation_content(project: Dict[str, Any]) -> str:
    fallback = _build_project_content(project)
    try:
        brief = await generate_brief_from_project(project)
        if brief and brief.strip():
            return brief.strip()
    except HTTPException as exc:
        logger.warning(
            "Brief generation failed with HTTPException (%s). Falling back to raw content.",
            exc.detail,
        )
    except Exception as exc:  # noqa: BLE001
        logger.warning(
            "Brief generation failed with unexpected error (%s). Falling back to raw content.",
            exc,
        )
    return fallback


# ─── Project Presentation Persistence (SQLite) ────────────────────────────────

@MARKDOWN_ROUTER.get(
    "/project/{project_id}/presentations",
    response_model=List[ProjectPresentationSummary],
)
async def list_project_presentations(
    project_id: str,
    sql_session: AsyncSession = Depends(get_async_session),
):
    stmt = (
        select(ProjectPresentationModel)
        .where(ProjectPresentationModel.project_id == project_id)
        .order_by(ProjectPresentationModel.updated_at.desc())
    )
    results = await sql_session.execute(stmt)
    presentations = results.scalars().all()

    summaries: list[ProjectPresentationSummary] = []
    for presentation in presentations:
        summaries.append(await _build_project_presentation_summary(presentation, sql_session))
    return summaries


@MARKDOWN_ROUTER.post(
    "/project/{project_id}/presentations",
    response_model=CreateProjectPresentationResponse,
)
async def create_project_presentation(
    project_id: str,
    title: str = Body("Untitled Presentation"),
    sql_session: AsyncSession = Depends(get_async_session),
):
    new_presentation = ProjectPresentationModel(
        project_id=project_id,
        title=title or "Untitled Presentation",
        status="draft",
    )
    sql_session.add(new_presentation)
    await sql_session.commit()
    await sql_session.refresh(new_presentation)
    return CreateProjectPresentationResponse(presentation_id=str(new_presentation.id))


@MARKDOWN_ROUTER.patch(
    "/project/presentations/{presentation_id}",
    response_model=ProjectPresentationSummary,
)
async def rename_project_presentation(
    presentation_id: str,
    payload: RenameProjectPresentationRequest,
    sql_session: AsyncSession = Depends(get_async_session),
):
    try:
        pres_uuid = uuid.UUID(presentation_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid presentation ID format.")

    presentation = await sql_session.get(ProjectPresentationModel, pres_uuid)
    if not presentation:
        raise HTTPException(status_code=404, detail="Presentation not found.")

    presentation.title = payload.title.strip() or "Untitled Presentation"
    sql_session.add(presentation)
    await sql_session.commit()
    await sql_session.refresh(presentation)
    return await _build_project_presentation_summary(presentation, sql_session)


@MARKDOWN_ROUTER.delete(
    "/project/presentations/{presentation_id}",
    response_model=DeleteProjectPresentationResponse,
)
async def delete_project_presentation(
    presentation_id: str,
    sql_session: AsyncSession = Depends(get_async_session),
):
    try:
        pres_uuid = uuid.UUID(presentation_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid presentation ID format.")

    presentation = await sql_session.get(ProjectPresentationModel, pres_uuid)
    if not presentation:
        raise HTTPException(status_code=404, detail="Presentation not found.")

    revisions_stmt = select(ProjectPresentationRevisionModel).where(
        ProjectPresentationRevisionModel.presentation_id == pres_uuid
    )
    revisions_result = await sql_session.execute(revisions_stmt)
    revisions = revisions_result.scalars().all()

    markdown_ids = {
        revision.markdown_presentation_id
        for revision in revisions
        if revision.markdown_presentation_id is not None
    }

    await sql_session.execute(
        delete(ProjectPresentationRevisionModel).where(
            ProjectPresentationRevisionModel.presentation_id == pres_uuid
        )
    )
    await sql_session.execute(
        delete(ProjectPresentationModel).where(ProjectPresentationModel.id == pres_uuid)
    )

    if markdown_ids:
        references_stmt = select(ProjectPresentationRevisionModel.markdown_presentation_id).where(
            ProjectPresentationRevisionModel.markdown_presentation_id.in_(list(markdown_ids))
        )
        references_result = await sql_session.execute(references_stmt)
        still_referenced_ids = {
            value
            for value in references_result.scalars().all()
            if value is not None
        }

        orphan_markdown_ids = markdown_ids - still_referenced_ids
        if orphan_markdown_ids:
            await sql_session.execute(
                delete(MarkdownPresentationModel).where(
                    MarkdownPresentationModel.id.in_(list(orphan_markdown_ids))
                )
            )

    await sql_session.commit()
    return DeleteProjectPresentationResponse(success=True, presentation_id=presentation_id)


@MARKDOWN_ROUTER.post(
    "/project/presentations/{presentation_id}/generate",
    response_model=GenerateProjectPresentationResponse,
)
async def generate_project_presentation(
    presentation_id: str,
    n_slides: int = Body(10),
    density: str = Body("Concise"),
    tone: str = Body("professional"),
    theme: str = Body("modern-dark"),
    language: str = Body("English"),
    visual_preference: str = Body("balanced"),
    image_source: str = Body("ai"),
    logo_url: Optional[str] = Body(None),
    logo_position: Optional[str] = Body(None),
    # Visual generation controls
    image_model: str = Body("none"),
    chart_enabled: bool = Body(False),
    chart_types: List[str] = Body(default_factory=list),
    sql_session: AsyncSession = Depends(get_async_session),
):
    try:
        pres_uuid = uuid.UUID(presentation_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid presentation ID format.")

    presentation = await sql_session.get(ProjectPresentationModel, pres_uuid)
    if not presentation:
        raise HTTPException(status_code=404, detail="Presentation not found.")

    project = _fetch_project_row(presentation.project_id)
    content = await _build_generation_content(project)
    evidence_pack = _build_section_evidence_pack(project)
    quantitative_datasets = _extract_quantitative_datasets(project) + evidence_pack["datasets"]
    charts_needed = chart_enabled or bool(quantitative_datasets)

    outline_stmt = (
        select(ProjectPresentationRevisionModel)
        .where(
            ProjectPresentationRevisionModel.presentation_id == pres_uuid,
            ProjectPresentationRevisionModel.is_draft.is_(True),
        )
        .order_by(ProjectPresentationRevisionModel.created_at.desc())
        .limit(1)
    )
    outline_result = await sql_session.execute(outline_stmt)
    outline_revision = outline_result.scalar_one_or_none()

    outline_slide_seeds: Optional[List[str]] = None
    if outline_revision and outline_revision.outline:
        seeds = _outline_to_slide_seeds(outline_revision.outline)
        outline_slide_seeds = seeds if seeds else None

    instructions = (
        "Use the requested tone, density, and visual preference exactly. "
        "If density is 'Concise', limit text blocks to a maximum of 4 bullets. "
        "Do not overlap blocks. Calculate x and y coordinates so elements have clear whitespace."
    )

    spatial_deck = await _build_spatial_deck(
        content=content,
        n_slides=n_slides,
        language=language,
        tone=tone,
        density=density,
        visual_preference=visual_preference,
        audience=None,
        instructions=instructions,
        slides_markdown=outline_slide_seeds,
        include_images=image_source != "none",
        include_charts=charts_needed,
        quantitative_datasets=quantitative_datasets,
        image_source=image_source,
        image_model=image_model,
        chart_types=chart_types,
    )

    generated_slides = []
    for slide in spatial_deck.slides:
        text_parts = [
            block.content
            for block in slide.blocks
            if isinstance(block, SpatialTextBlock) and block.content.strip()
        ]
        generated_slides.append("\n".join(text_parts).strip() or slide.title)

    markdown_presentation = MarkdownPresentationModel(
        content=content,
        slides_markdown=outline_slide_seeds,
        n_slides=n_slides,
        language=language,
        tone=tone,
        verbosity=density.lower(),
        text_mode="generate",
        theme=theme,
        image_source=image_source,
        generated_slides=generated_slides,
        visual_config={
            "density": density,
            "visual_preference": visual_preference,
            "image_model": image_model,
            "chart_enabled": chart_enabled,
            "chart_types": chart_types,
        },
    )
    sql_session.add(markdown_presentation)
    await sql_session.commit()
    await sql_session.refresh(markdown_presentation)

    stmt = select(func.max(ProjectPresentationRevisionModel.revision_number)).where(
        ProjectPresentationRevisionModel.presentation_id == pres_uuid
    )
    result = await sql_session.execute(stmt)
    current_max = result.scalar() or 0

    settings_snapshot = {
        "n_slides": n_slides,
        "density": density,
        "tone": tone,
        "theme": theme,
        "language": language,
        "visual_preference": visual_preference,
        "image_source": image_source,
        "logo_url": logo_url,
        "logo_position": logo_position,
        "image_model": image_model,
        "chart_enabled": chart_enabled,
        "chart_types": chart_types,
        "editor_payload": spatial_deck.model_dump(),
    }

    revision = ProjectPresentationRevisionModel(
        presentation_id=pres_uuid,
        revision_number=current_max + 1,
        is_draft=False,
        markdown_presentation_id=markdown_presentation.id,
        source_snapshot=project,
        settings=settings_snapshot,
    )
    sql_session.add(revision)
    await sql_session.commit()
    await sql_session.refresh(revision)

    presentation.current_revision_id = revision.id
    presentation.status = "generated"
    sql_session.add(presentation)
    await sql_session.commit()

    return GenerateProjectPresentationResponse(
        presentation_id=str(presentation.id),
        markdown_presentation_id=str(markdown_presentation.id),
        revision_id=str(revision.id),
        editor_payload=spatial_deck.model_dump(),
    )


@MARKDOWN_ROUTER.post(
    "/project/presentations/{presentation_id}/outline",
    response_model=OutlineDraftResponse,
)
async def generate_outline_draft(
    presentation_id: str,
    sql_session: AsyncSession = Depends(get_async_session),
):
    try:
        pres_uuid = uuid.UUID(presentation_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid presentation ID format.")

    presentation = await sql_session.get(ProjectPresentationModel, pres_uuid)
    if not presentation:
        raise HTTPException(status_code=404, detail="Presentation not found.")

    project = _fetch_project_row(presentation.project_id)
    content = await _build_generation_content(project)
    evidence_pack = _build_section_evidence_pack(project)
    quantitative_datasets = _extract_quantitative_datasets(project) + evidence_pack["datasets"]
    outline_messages = [
        LLMSystemMessage(
            content=(
                "You are an expert presentation consultant specializing in startup pitch decks, founder narratives, and investor-ready business strategy. "
                "You produce a slide outline as strict JSON.\n\n"
                "STORYLINE ARCHITECTURE (Follow this structure for 8-14 slides):\n"
                "1. COVER: Engaging company or project name and crisp pitch thesis.\n"
                "2. PROBLEM: The urgent pain point founders or users feel today.\n"
                "3. WHY NOW: Timing, market shift, or operational change that makes this compelling.\n"
                "4. INSIGHT / EVIDENCE: Research evidence, data, or customer behavior that proves the case.\n"
                "5. SOLUTION: The product or service and the mechanism that makes it work.\n"
                "6. MARKET: Opportunity size, target segment, and positioning.\n"
                "7. TRACTION / VALIDATION: Evidence, pilots, prototypes, or confidence-building signals.\n"
                "8. BUSINESS MODEL / GO-TO-MARKET: How the solution scales and converts to value.\n"
                "9. TEAM / EXECUTION: Why this team or approach can win.\n"
                "10. ASK / CLOSING: What decision or next step the audience should take.\n\n"
                "RULES:\n"
                "- Each slide must include title, bullets, visual_intent, and has_quantitative_data.\n"
                "- visual_intent must be: Data-Heavy, Visual-Hero, Narrative, Comparison, or Process.\n"
                "- Match the source content exactly for names, quotes, and numbers.\n"
                "- If the evidence pack contains section_evidence_depth or section_numeric_signals, use those to mark Data-Heavy slides and place charts on them."
            )
        ),
        LLMUserMessage(
            content=(
                "Create a high-impact presentation outline from the research content provided below. "
                "Identify specific data points from the quantitative datasets to flag for 'Data-Heavy' slides.\n\n"
                f"QUANTITATIVE DATASETS:\n{json.dumps(quantitative_datasets, ensure_ascii=False, indent=2)}\n\n"
                f"SOURCE RESEARCH CONTENT:\n{content}"
            )
        ),
    ]
    llm_client = LLMClient()
    try:
        llm_outline = await llm_client.generate_structured(
            model=get_model(),
            messages=outline_messages,
            response_format=OutlineDraft.model_json_schema(),
            strict=True,
            max_tokens=4000,
        )
        outline = OutlineDraft(**llm_outline)
    except Exception as exc:  # noqa: BLE001
        logger.exception("Outline generation failed; falling back to deterministic outline. %s", exc)
        outline = _build_outline_from_content(content)

    stmt = select(func.max(ProjectPresentationRevisionModel.revision_number)).where(
        ProjectPresentationRevisionModel.presentation_id == pres_uuid
    )
    result = await sql_session.execute(stmt)
    current_max = result.scalar() or 0

    revision = ProjectPresentationRevisionModel(
        presentation_id=pres_uuid,
        revision_number=current_max + 1,
        is_draft=True,
        outline=outline.model_dump(),
        source_snapshot=project,
    )
    sql_session.add(revision)
    await sql_session.commit()
    await sql_session.refresh(revision)

    return OutlineDraftResponse(
        presentation_id=str(presentation.id),
        revision_id=str(revision.id),
        outline=outline,
    )


@MARKDOWN_ROUTER.get(
    "/project/presentations/{presentation_id}/outline",
    response_model=OutlineDraftResponse,
)
async def get_outline_draft(
    presentation_id: str,
    sql_session: AsyncSession = Depends(get_async_session),
):
    try:
        pres_uuid = uuid.UUID(presentation_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid presentation ID format.")

    outline_stmt = (
        select(ProjectPresentationRevisionModel)
        .where(
            ProjectPresentationRevisionModel.presentation_id == pres_uuid,
            ProjectPresentationRevisionModel.is_draft.is_(True),
        )
        .order_by(ProjectPresentationRevisionModel.created_at.desc())
        .limit(1)
    )
    outline_result = await sql_session.execute(outline_stmt)
    outline_revision = outline_result.scalar_one_or_none()
    if not outline_revision or not outline_revision.outline:
        return OutlineDraftResponse(
            presentation_id=str(pres_uuid),
            revision_id=None,
            outline=None,
        )

    outline = OutlineDraft(**_coerce_outline_payload(outline_revision.outline or {}))
    return OutlineDraftResponse(
        presentation_id=str(pres_uuid),
        revision_id=str(outline_revision.id),
        outline=outline,
    )


@MARKDOWN_ROUTER.patch(
    "/project/presentations/{presentation_id}/outline",
    response_model=OutlineDraftResponse,
)
async def update_outline_draft(
    presentation_id: str,
    payload: OutlineDraft,
    sql_session: AsyncSession = Depends(get_async_session),
):
    try:
        pres_uuid = uuid.UUID(presentation_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid presentation ID format.")

    outline_stmt = (
        select(ProjectPresentationRevisionModel)
        .where(
            ProjectPresentationRevisionModel.presentation_id == pres_uuid,
            ProjectPresentationRevisionModel.is_draft.is_(True),
        )
        .order_by(ProjectPresentationRevisionModel.created_at.desc())
        .limit(1)
    )
    outline_result = await sql_session.execute(outline_stmt)
    outline_revision = outline_result.scalar_one_or_none()
    if not outline_revision:
        stmt = select(func.max(ProjectPresentationRevisionModel.revision_number)).where(
            ProjectPresentationRevisionModel.presentation_id == pres_uuid
        )
        result = await sql_session.execute(stmt)
        current_max = result.scalar() or 0

        outline_revision = ProjectPresentationRevisionModel(
            presentation_id=pres_uuid,
            revision_number=current_max + 1,
            is_draft=True,
        )

    outline_revision.outline = payload.model_dump()
    sql_session.add(outline_revision)
    await sql_session.commit()
    await sql_session.refresh(outline_revision)

    return OutlineDraftResponse(
        presentation_id=str(pres_uuid),
        revision_id=str(outline_revision.id),
        outline=payload,
    )


@MARKDOWN_ROUTER.get(
    "/project/presentations/{presentation_id}/editor-state",
    response_model=EditorStateResponse,
)
async def get_editor_state(
    presentation_id: str,
    sql_session: AsyncSession = Depends(get_async_session),
):
    try:
        pres_uuid = uuid.UUID(presentation_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid presentation ID format.")

    presentation = await sql_session.get(ProjectPresentationModel, pres_uuid)
    if not presentation or not presentation.current_revision_id:
        raise HTTPException(status_code=404, detail="Presentation revision not found.")

    revision = await sql_session.get(
        ProjectPresentationRevisionModel, presentation.current_revision_id
    )
    settings = revision.settings or {}
    editor_payload = settings.get("editor_payload")
    if not isinstance(editor_payload, dict):
        raise HTTPException(status_code=404, detail="Editor payload not found.")

    return EditorStateResponse(
        presentation_id=str(pres_uuid),
        editor=editor_payload,
    )


@MARKDOWN_ROUTER.patch(
    "/project/presentations/{presentation_id}/editor-state",
    response_model=EditorStateResponse,
)
async def update_editor_state(
    presentation_id: str,
    payload: EditorStatePayload,
    sql_session: AsyncSession = Depends(get_async_session),
):
    try:
        pres_uuid = uuid.UUID(presentation_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid ID format.")

    presentation = await sql_session.get(ProjectPresentationModel, pres_uuid)
    if not presentation:
        raise HTTPException(status_code=404, detail="Presentation not found.")

    revision: Optional[ProjectPresentationRevisionModel] = None
    if presentation.current_revision_id:
        revision = await sql_session.get(
            ProjectPresentationRevisionModel, presentation.current_revision_id
        )
    markdown_id: Optional[uuid.UUID] = None
    if payload.markdown_presentation_id:
        try:
            markdown_id = uuid.UUID(payload.markdown_presentation_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid markdown_presentation_id format.")

    if markdown_id:
        markdown = await sql_session.get(MarkdownPresentationModel, markdown_id)
        if not markdown:
            raise HTTPException(status_code=404, detail="Markdown presentation not found.")
        if payload.theme:
            markdown.theme = payload.theme
        sql_session.add(markdown)
    if not revision:
        stmt = select(func.max(ProjectPresentationRevisionModel.revision_number)).where(
            ProjectPresentationRevisionModel.presentation_id == pres_uuid
        )
        result = await sql_session.execute(stmt)
        current_max = result.scalar() or 0
        revision = ProjectPresentationRevisionModel(
            presentation_id=pres_uuid,
            revision_number=current_max + 1,
            is_draft=False,
            markdown_presentation_id=markdown_id,
            settings={},
        )

    settings = _as_dict(revision.settings)
    settings["editor_payload"] = payload.editor_payload
    if payload.logo_url is not None:
        settings["logo_url"] = payload.logo_url
    if payload.logo_position is not None:
        settings["logo_position"] = payload.logo_position
    if payload.theme is not None:
        settings["theme"] = payload.theme
    revision.settings = settings
    if markdown_id:
        revision.markdown_presentation_id = markdown_id
    revision.is_draft = False
    sql_session.add(revision)

    presentation.current_revision_id = revision.id
    presentation.status = "generated"
    sql_session.add(presentation)

    await sql_session.commit()
    await sql_session.refresh(revision)

    return EditorStateResponse(
        presentation_id=str(pres_uuid),
        editor=payload.editor_payload,
    )

def _normalize_project_value(value: Any) -> Any:
    """Parse JSON strings when possible so nested project data is rendered cleanly."""
    if not isinstance(value, str):
        return value

    stripped = value.strip()
    if not stripped:
        return value

    if stripped[0] not in "{[":
        return value

    try:
        return json.loads(stripped)
    except (json.JSONDecodeError, TypeError, ValueError):
        return value


def _has_meaningful_content(value: Any) -> bool:
    """Return True only for values worth sending to slide generation."""
    value = _normalize_project_value(value)

    if value is None:
        return False
    if isinstance(value, str):
        return bool(value.strip())
    if isinstance(value, (list, dict, tuple, set)):
        return bool(value)
    return True


def _render_project_field(project: Dict[str, Any], key: str, label: str) -> str:
    value = _normalize_project_value(project.get(key))
    if not _has_meaningful_content(value):
        return ""

    if isinstance(value, (dict, list)):
        return f"\n## {label}\n```json\n{json.dumps(value, indent=2, ensure_ascii=False)}\n```\n"

    return f"\n## {label}\n{value}\n"


def _build_project_content(project: Dict[str, Any]) -> str:
    """Build a null-safe markdown block from preferred and all additional project columns."""
    preferred_fields = [
        ("problem_statement", "Problem Statement"),
        ("as_is_map", "As-Is Map"),
        ("extreme_user_data", "Extreme User Data"),
        ("deep_empathy_data", "Deep Empathy Data"),
        ("psychological_analysis", "Psychological Analysis"),
        ("Behaviour_Framework", "Behaviour Framework"),
        ("HMW_Ideation_Framework", "HMW / Ideation Framework"),
        ("Idea_Clustering_and_Idea_Cards", "Idea Clustering and Idea Cards"),
        ("transformation_framework", "Transformation Framework"),
        ("market_research", "Market Research"),
        ("research_data", "Research Data"),
        ("research_findings", "Research Findings"),
        ("key_insights", "Key Insights"),
        ("analysis", "Analysis"),
        ("final_idea", "Final Idea"),
        ("implementation_plan", "Implementation Plan"),
        ("prototype_images", "Prototype Images"),
        ("testing", "Testing"),
        ("design_research", "Design Research"),
    ]

    title = (
        project.get("title")
        or project.get("name")
        or project.get("project_name")
        or "Untitled Project"
    )

    content_parts = [f"# {title}"]
    evidence_pack = _build_section_evidence_pack(project)

    content_parts.insert(
        1,
        "\n## Narrative Frame\n"
        "Build the deck as a tight editorial story: problem tension → key insight → evidence → recommendation → next step.\n"
        "Use the strongest proof early and do not bury market research or testing behind methodology-heavy slides.\n"
        "Treat idea clustering as a decision slide and testing as a proof slide.\n"
        "\n## Visual Style Brief\n"
        "Aim for a consulting-meets-editorial presentation style: bold claim-driven titles, crisp hierarchy, asymmetric but balanced layouts, and one clear visual anchor per slide.\n"
        "Prefer scorecards, comparison matrices, tables, and charts over decorative imagery unless the project artifact itself is the story.\n"
        "\n## Evidence Summary\n"
        f"```json\n{json.dumps(evidence_pack['summary'], indent=2, ensure_ascii=False)}\n```\n"
        "\n## Chart Guidance\n"
        "- Use section_evidence_depth for a slide showing which pipeline sections have the most substance.\n"
        "- Use section_numeric_signals for a slide showing where the source contains actual measurable data.\n"
        "- Only use chart values that appear in the evidence pack or extracted quantitative datasets.\n",
    )

    rendered_keys: set[str] = set()
    for key, label in preferred_fields:
        rendered = _render_project_field(project, key, label)
        if rendered:
            content_parts.append(rendered)
            rendered_keys.add(key)

    # Include all remaining project columns so outline generation can use full project context.
    skip_keys = {
        "id",
        "title",
        "name",
        "project_name",
        "created_at",
        "updated_at",
        "user_id",
    }
    for key in sorted(project.keys()):
        if key in rendered_keys or key in skip_keys:
            continue
        label = key.replace("_", " ").strip().title()
        rendered = _render_project_field(project, key, label)
        if rendered:
            content_parts.append(rendered)

    content_parts.insert(
        2,
        "\n## Source Asset Guidance\n"
        "Use the most relevant project-specific evidence from the sections above.\n"
        "Prefer charts, tables, callouts, and prototype artifacts over generic imagery whenever possible.\n"
        "If a section contains statistics, surface them visually. If it contains workflows or user journeys, turn them into process or comparison slides.\n",
    )
    content_parts.insert(
        3,
        "\n## Deck Prioritization\n"
        "When the strongest source material is market research, testing, or idea clustering, promote it to the center of the story instead of treating it like an appendix.\n"
        "Make slide titles read like conclusions, not section names.\n"
    )

    return "\n".join(part for part in content_parts if part)


def _build_outline_from_content(content: str) -> OutlineDraft:
    slides: list[OutlineSlideDraft] = []

    lines = [line.rstrip() for line in content.splitlines()]
    title = lines[0].lstrip("# ").strip() if lines else "Presentation"
    slides.append(
        OutlineSlideDraft(
            title=title,
            bullets=["Project overview and goals."],
            visual_intent="Narrative",
            has_quantitative_data=False,
        )
    )

    current_heading: Optional[str] = None
    current_buffer: list[str] = []
    in_json = False
    json_buffer: list[str] = []

    def _clean_sentence(s: str) -> str:
        normalized = " ".join(s.split())
        return normalized[:180].strip()

    def _summarize_section(heading: str, buffer: list[str], json_text: str) -> list[str]:
        heading_lower = heading.lower()

        # Avoid noisy machine-centric sections in the outline draft.
        if any(skip in heading_lower for skip in ("chat history", "metadata")):
            return ["Reference-only section. Include only if needed in final deck."]

        if "research data" in heading_lower:
            return [
                "Summarize the most important user patterns and statistics.",
                "Highlight 2 to 3 data-backed insights that support the story.",
            ]
        if "analysis" in heading_lower:
            return [
                "Explain the key root causes and behavioral barriers.",
                "Call out the top strategic implication for the solution direction.",
            ]
        if "testing" in heading_lower:
            return [
                "Summarize validation outcomes and major learnings.",
                "List what to iterate next based on the testing results.",
            ]
        if "market" in heading_lower:
            return [
                "Show market opportunity, benchmarks, and competitive positioning.",
                "Clarify why this solution can win in the target segment.",
            ]

        if json_text:
            try:
                parsed = json.loads(json_text)
                if isinstance(parsed, dict):
                    keys = [k.replace("_", " ") for k in list(parsed.keys())[:3]]
                    if keys:
                        return [
                            f"Explain {keys[0]} in plain language.",
                            f"Show key evidence from {keys[-1]} and what it means.",
                        ]
                    return ["Highlight key findings from this dataset."]
                if isinstance(parsed, list) and parsed:
                    return [
                        "Summarize the most important entries from this section.",
                        "Pull out practical takeaways for decision-making.",
                    ]
            except Exception:
                pass
        text = " ".join(buffer).strip()
        if not text:
            return ["Key points for this section."]
        sentences = [_clean_sentence(s) for s in text.split(".") if s.strip()]
        concise = [s for s in sentences if s]
        if concise:
            return concise[:2]
        return ["Key points for this section."]

    def _infer_visual_intent(heading: str, bullets: list[str], json_text: str) -> Literal[
        "Data-Heavy",
        "Visual-Hero",
        "Narrative",
        "Comparison",
        "Process",
    ]:
        heading_lower = heading.lower()
        if any(token in heading_lower for token in ("market", "testing", "research data", "analysis")):
            return "Data-Heavy"
        if any(token in heading_lower for token in ("journey", "flow", "process", "framework", "prototype")):
            return "Process"
        if any(token in heading_lower for token in ("compare", "comparison", "competitive", "differentiation")):
            return "Comparison"
        if len(bullets) <= 2 and not json_text:
            return "Visual-Hero"
        return "Narrative"

    def _flush_section():
        if not current_heading:
            return
        json_text = "\n".join(json_buffer).strip()
        details = _summarize_section(current_heading, current_buffer, json_text)
        slides.append(
            OutlineSlideDraft(
                title=current_heading,
                bullets=details,
                visual_intent=_infer_visual_intent(current_heading, details, json_text),
                has_quantitative_data=bool(json_text and any(char.isdigit() for char in json_text)),
            )
        )

    for line in lines[1:]:
        if line.startswith("## "):
            _flush_section()
            current_heading = line.replace("## ", "", 1).strip()
            current_buffer = []
            json_buffer = []
            in_json = False
            continue

        if line.strip().startswith("```json"):
            in_json = True
            continue
        if line.strip().startswith("```") and in_json:
            in_json = False
            continue

        if in_json:
            json_buffer.append(line)
            continue

        if not line.strip():
            continue
        if line.lstrip().startswith("- "):
            current_buffer.append(line.lstrip()[2:].strip())
        else:
            current_buffer.append(line.strip())

    _flush_section()

    slides.append(
        OutlineSlideDraft(
            title="Closing",
            bullets=["Summary and next steps."],
            visual_intent="Narrative",
            has_quantitative_data=False,
        )
    )
    return OutlineDraft(slides=slides)


def _fetch_project_row(project_id: str) -> Dict[str, Any]:
    """Fetch a single project row from Supabase with defensive result handling."""
    from services.supabase_client import get_supabase_client  # noqa: PLC0415

    try:
        client = get_supabase_client()
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    try:
        logger.info("Supabase fetch: table=projects id=%s", project_id)
        response = (
            client.table("projects")
            .select("*")
            .eq("id", project_id)
            .single()
            .execute()
        )
    except Exception as exc:
        logger.exception("Supabase query failed while fetching project_id=%s", project_id)
        raise HTTPException(
            status_code=500,
            detail=f"Supabase query failed while fetching project '{project_id}': {exc}",
        ) from exc

    if response is None:
        raise HTTPException(
            status_code=502,
            detail="Supabase query returned no response object.",
        )

    # Supabase client responses often carry `.data` and sometimes `.error`.
    project = getattr(response, "data", None)
    error = getattr(response, "error", None)
    status = getattr(response, "status_code", None) or getattr(response, "status", None)

    if error:
        logger.error(
            "Supabase responded with error while fetching project_id=%s status=%s error=%s",
            project_id,
            status,
            error,
        )
        raise HTTPException(
            status_code=502,
            detail=f"Supabase error while fetching project '{project_id}': {error}",
        )

    if not isinstance(project, dict) or not project:
        # Heuristic: anon+RLS often returns empty data even when the row exists.
        # Try a non-single query to capture raw list shape for debugging.
        try:
            fallback = (
                client.table("projects")
                .select("id")
                .eq("id", project_id)
                .execute()
            )
            fallback_data = getattr(fallback, "data", None)
            fallback_n = len(fallback_data) if isinstance(fallback_data, list) else None
        except Exception:
            fallback_n = None

        logger.warning(
            "Supabase project not readable. project_id=%s status=%s fallback_matches=%s",
            project_id,
            status,
            fallback_n,
        )
        raise HTTPException(
            status_code=404,
            detail=(
                f"Project '{project_id}' not found or not readable under current RLS policy "
                "(anon key commonly returns empty results). If this row exists, enable "
                "SUPABASE_SERVICE_ROLE_KEY (server-only) to bypass RLS for reads."
            ),
        )

    logger.info(
        "Supabase fetch success: project_id=%s keys=%s",
        project_id,
        len(project.keys()),
    )
    return project


def _extract_preview(markdown: str) -> tuple[Optional[str], Optional[str]]:
    if not markdown:
        return None, None

    lines = [line.strip() for line in markdown.splitlines() if line.strip()]
    if not lines:
        return None, None

    heading = next((line.lstrip("# ").strip() for line in lines if line.startswith("#")), None)
    text_line = next((line for line in lines if not line.startswith("#")), lines[0])
    snippet = " ".join(text_line.split())[:140].strip() if text_line else None
    return heading or snippet, snippet


def _as_dict(value: Any) -> dict[str, Any]:
    if isinstance(value, dict):
        return value
    return {}


async def _build_project_presentation_summary(
    presentation: ProjectPresentationModel,
    sql_session: AsyncSession,
) -> ProjectPresentationSummary:
    revision_id = presentation.current_revision_id
    markdown_id: Optional[str] = None
    slide_count: Optional[int] = None
    logo_url: Optional[str] = None
    logo_position: Optional[str] = None
    preview_title: Optional[str] = None
    preview_snippet: Optional[str] = None

    if revision_id:
        revision = await sql_session.get(ProjectPresentationRevisionModel, revision_id)
        if revision and revision.markdown_presentation_id:
            markdown = await sql_session.get(
                MarkdownPresentationModel, revision.markdown_presentation_id
            )
            if markdown:
                markdown_id = str(markdown.id)
                slide_count = len(markdown.generated_slides or [])
                if markdown.generated_slides:
                    preview_title, preview_snippet = _extract_preview(markdown.generated_slides[0])
        revision_settings = _as_dict(revision.settings) if revision else {}
        if revision_settings:
            logo_url = revision_settings.get("logo_url")
            logo_position = revision_settings.get("logo_position")

    return ProjectPresentationSummary(
        id=str(presentation.id),
        project_id=presentation.project_id,
        title=presentation.title,
        status=presentation.status,
        created_at=presentation.created_at.isoformat(),
        updated_at=presentation.updated_at.isoformat(),
        current_revision_id=str(revision_id) if revision_id else None,
        current_markdown_presentation_id=markdown_id,
        current_slide_count=slide_count,
        logo_url=logo_url,
        logo_position=logo_position,
        preview_title=preview_title,
        preview_snippet=preview_snippet,
    )


# ─── POST /markdown/create ───────────────────────────────────────────────────


@MARKDOWN_ROUTER.post("/create", response_model=CreatePresentationResponse)
async def create_markdown_presentation(
    content: str = Body(..., description="Full source content / outline"),
    slides_markdown: Optional[List[str]] = Body(
        None, description="Pre-split slide blocks (card-by-card mode)"
    ),
    n_slides: int = Body(10),
    language: str = Body("English"),
    tone: str = Body("professional"),
    verbosity: Literal["minimal", "concise", "standard", "text_heavy"] = Body(
        "standard"
    ),
    text_mode: Literal["generate", "condense", "preserve"] = Body("generate"),
    audience: Optional[str] = Body(None),
    theme: str = Body("modern-dark"),
    image_source: Literal["ai", "stock", "none"] = Body("ai"),
    image_style: Optional[str] = Body("photo"),
    instructions: Optional[str] = Body(None),
    per_slide_instructions: Optional[List[str]] = Body(None),
    sql_session: AsyncSession = Depends(get_async_session),
):
    """
    Create a new markdown presentation record and return its ID.
    The frontend should then connect to the /stream endpoint to receive
    slides as they are generated via SSE.
    """
    presentation = MarkdownPresentationModel(
        content=content,
        slides_markdown=slides_markdown,
        n_slides=n_slides,
        language=language,
        tone=tone,
        verbosity=verbosity,
        text_mode=text_mode,
        audience=audience,
        theme=theme,
        image_source=image_source,
        image_style=image_style,
        instructions=instructions,
        per_slide_instructions=per_slide_instructions,
    )
    sql_session.add(presentation)
    await sql_session.commit()
    await sql_session.refresh(presentation)
    return CreatePresentationResponse(presentation_id=str(presentation.id))


# ─── GET /markdown/presentation/{id}/stream ──────────────────────────────────


@MARKDOWN_ROUTER.get("/presentation/{id}/stream")
async def stream_markdown_presentation(
    id: str,
    sql_session: AsyncSession = Depends(get_async_session),
):
    raise HTTPException(
        status_code=410,
        detail="Streaming markdown generation is deprecated. Use /project/presentations/{presentation_id}/generate for spatial JSON generation.",
    )


# ─── POST /markdown/slide/regenerate ─────────────────────────────────────────


@MARKDOWN_ROUTER.post("/slide/regenerate", response_model=RegenerateSlideResponse)
async def regenerate_slide(
    presentation_id: str = Body(...),
    slide_index: int = Body(...),
    instructions: Optional[str] = Body(None),
    sql_session: AsyncSession = Depends(get_async_session),
):
    raise HTTPException(
        status_code=410,
        detail="Single-slide markdown regeneration is deprecated after the spatial JSON migration.",
    )


# ─── POST /markdown/presentation/{id}/switch-theme ───────────────────────────


@MARKDOWN_ROUTER.post(
    "/presentation/{id}/switch-theme", response_model=SwitchThemeResponse
)
async def switch_theme(
    id: str,
    new_theme: str = Body(..., embed=True),
    sql_session: AsyncSession = Depends(get_async_session),
):
    """
    Switch the theme for a presentation.

    No LLM call needed — content is stored as plain markdown.
    The frontend just re-renders with the new CSS variable set.
    """
    presentation = await _get_presentation_or_404(id, sql_session)
    presentation.theme = new_theme
    sql_session.add(presentation)
    await sql_session.commit()
    return SwitchThemeResponse(success=True, theme=new_theme)


# ─── POST /markdown/presentation/{id}/export/pptx ────────────────────────────


@MARKDOWN_ROUTER.post("/presentation/{id}/export/pptx")
async def export_pptx(
    id: str,
    sql_session: AsyncSession = Depends(get_async_session),
):
    """
    Export the presentation to a .pptx file and stream it directly to the browser.
    """
    presentation = await _get_presentation_or_404(id, sql_session)

    revision_stmt = (
        select(ProjectPresentationRevisionModel)
        .where(ProjectPresentationRevisionModel.markdown_presentation_id == presentation.id)
        .order_by(ProjectPresentationRevisionModel.updated_at.desc())
        .limit(1)
    )
    revision_result = await sql_session.execute(revision_stmt)
    revision = revision_result.scalar_one_or_none()

    if not revision:
        raise HTTPException(status_code=404, detail="Presentation revision not found.")

    settings = revision.settings or {}
    editor_payload = settings.get("editor_payload")
    if not isinstance(editor_payload, dict):
        raise HTTPException(
            status_code=404,
            detail="editor_payload not found. Generate presentation first.",
        )

    from services.spatial_pptx_export import export_spatial_to_pptx  # noqa: PLC0415

    exports_dir = get_exports_directory()
    output_path = os.path.join(exports_dir, f"spatial_presentation_{id}.pptx")
    try:
        await export_spatial_to_pptx(editor_payload=editor_payload, output_path=output_path)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Failed to export PPTX: {exc}") from exc

    project_row = await sql_session.get(ProjectPresentationModel, revision.presentation_id)
    download_base = (
        project_row.title
        if project_row and getattr(project_row, "title", None)
        else f"presentation_{id[:8]}"
    )
    safe_title = re.sub(r'[^\w\-. ]', '_', download_base)
    filename = f"{safe_title}.pptx"

    return FileResponse(
        path=output_path,
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
        filename=filename,
    )


# ─── POST /markdown/presentation/{id}/export/pdf ─────────────────────────────


class ExportPdfResponse(BaseModel):
    path: str


@MARKDOWN_ROUTER.post(
    "/presentation/{id}/export/pdf", response_model=ExportPdfResponse
)
async def export_pdf(
    id: str,
    sql_session: AsyncSession = Depends(get_async_session),
):
    """
    Export the presentation to a .pdf file.

    The file is saved in the exports directory and the path is returned.
    """
    presentation = await _get_presentation_or_404(id, sql_session)

    if not presentation.generated_slides:
        raise HTTPException(
            status_code=400,
            detail="No generated slides found. Run the stream endpoint first.",
        )

    raise HTTPException(
        status_code=501,
        detail="PDF export is not yet implemented. Please use PPTX export instead.",
    )


# ─── GET /markdown/presentation/{id} ─────────────────────────────────────────


@MARKDOWN_ROUTER.get(
    "/presentation/{id}", response_model=PresentationSummaryResponse
)
async def get_markdown_presentation(
    id: str,
    sql_session: AsyncSession = Depends(get_async_session),
):
    """Fetch a markdown presentation record by ID."""
    presentation = await _get_presentation_or_404(id, sql_session)
    return PresentationSummaryResponse(
        id=str(presentation.id),
        theme=presentation.theme,
        n_slides=presentation.n_slides,
        language=presentation.language,
        generated_slides=presentation.generated_slides,
    )


# ─── POST /markdown/project/{project_id}/generate ────────────────────────────


@MARKDOWN_ROUTER.post(
    "/project/{project_id}/generate", response_model=CreatePresentationResponse
)
async def generate_from_project(
    project_id: str,
    n_slides: int = Body(10),
    text_mode: str = Body("condense"),
    verbosity: str = Body("concise"),
    tone: str = Body("professional"),
    theme: str = Body("modern-dark"),
    language: str = Body("English"),
    image_source: str = Body("ai"),
    sql_session: AsyncSession = Depends(get_async_session),
):
    """
    One-click PPT generation from a Solve Innovate Supabase project.

    Fetches the project record, builds a structured content block from its
    JSONB fields, then creates a markdown presentation record.  The caller
    should then connect to /stream to receive the generated slides.
    """
    project = _fetch_project_row(project_id)
    content = await _build_generation_content(project)

    # Delegate to the standard create endpoint logic
    presentation = MarkdownPresentationModel(
        content=content,
        n_slides=n_slides,
        language=language,
        tone=tone,
        verbosity=verbosity,
        text_mode=text_mode,
        theme=theme,
        image_source=image_source,
    )
    sql_session.add(presentation)
    await sql_session.commit()
    await sql_session.refresh(presentation)

    return CreatePresentationResponse(presentation_id=str(presentation.id))
