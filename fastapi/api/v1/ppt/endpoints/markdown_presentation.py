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

from fastapi import APIRouter, Body, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.sql.markdown_presentation import MarkdownPresentationModel
from models.sql.project_presentation import ProjectPresentationModel
from models.sql.project_presentation_revision import ProjectPresentationRevisionModel
from models.sse_response import SSECompleteResponse, SSEErrorResponse, SSEResponse
from services.database import get_async_session
from services.llm_client import LLMClient
from utils.asset_directory_utils import get_exports_directory
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


class GenerateProjectPresentationResponse(BaseModel):
    presentation_id: str
    markdown_presentation_id: str
    revision_id: str


class OutlineSlideDraft(BaseModel):
    title: str
    details: List[str]


class OutlineDraft(BaseModel):
    slides: List[OutlineSlideDraft]


class OutlineDraftResponse(BaseModel):
    presentation_id: str
    revision_id: str
    outline: OutlineDraft


class EditorSlidePayload(BaseModel):
    id: str
    markdown: str
    blocks: Optional[List[Dict[str, Any]]] = None


class EditorStatePayload(BaseModel):
    markdown_presentation_id: str
    slides: List[EditorSlidePayload]
    theme: Optional[str] = None
    logo_url: Optional[str] = None
    logo_position: Optional[str] = None
    custom_colors: Optional[Dict[str, str]] = None


class EditorStateResponse(BaseModel):
    presentation_id: str
    editor: EditorStatePayload


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
    pages: List[List[Dict[str, Any]]] = []
    current: List[Dict[str, Any]] = []
    current_bullets = 0
    current_rows = 0
    current_words = 0

    for block in blocks:
        next_bullets = current_bullets + int(block["bullet_items"])
        next_rows = current_rows + int(block["table_rows"])
        next_words = current_words + int(block["paragraph_words"])
        exceeds = (
            next_bullets > limits["max_bullets"]
            or next_rows > limits["max_table_rows"]
            or next_words > limits["max_paragraph_words"]
        )
        if exceeds and current:
            pages.append(current)
            current = []
            current_bullets = 0
            current_rows = 0
            current_words = 0

        current.append(block)
        current_bullets += int(block["bullet_items"])
        current_rows += int(block["table_rows"])
        current_words += int(block["paragraph_words"])

    if current:
        pages.append(current)

    if not pages:
        return []

    continuation = _continuation_heading(heading)
    slides: List[str] = []
    for index, page in enumerate(pages):
        lines: List[str] = []
        if heading:
            lines.append(heading if index == 0 else (continuation or heading))
            lines.append("")
        for block in page:
            lines.append(block["text"].strip())
            lines.append("")
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
        raw_details = raw_slide.get("details") or []
        details = (
            [str(item).strip() for item in raw_details if str(item).strip()]
            if isinstance(raw_details, list)
            else []
        )
        lines = [f"## {title}"]
        if details:
            lines.extend(f"- {item}" for item in details)
        seeds.append("\n".join(lines))
    return seeds


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


@MARKDOWN_ROUTER.post(
    "/project/presentations/{presentation_id}/generate",
    response_model=GenerateProjectPresentationResponse,
)
async def generate_project_presentation(
    presentation_id: str,
    n_slides: int = Body(10),
    text_mode: str = Body("condense"),
    verbosity: str = Body("concise"),
    tone: str = Body("professional"),
    theme: str = Body("modern-dark"),
    language: str = Body("English"),
    image_source: str = Body("ai"),
    logo_url: Optional[str] = Body(None),
    logo_position: Optional[str] = Body(None),
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

    markdown_presentation = MarkdownPresentationModel(
        content=content,
        slides_markdown=outline_slide_seeds,
        n_slides=n_slides,
        language=language,
        tone=tone,
        verbosity=verbosity,
        text_mode=text_mode,
        theme=theme,
        image_source=image_source,
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
        "text_mode": text_mode,
        "verbosity": verbosity,
        "tone": tone,
        "theme": theme,
        "language": language,
        "image_source": image_source,
        "logo_url": logo_url,
        "logo_position": logo_position,
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
        raise HTTPException(status_code=404, detail="Outline draft not found.")

    outline = OutlineDraft(**outline_revision.outline)
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
    if not revision or not revision.markdown_presentation_id:
        raise HTTPException(status_code=404, detail="Generated presentation not found.")

    markdown = await sql_session.get(
        MarkdownPresentationModel, revision.markdown_presentation_id
    )
    if not markdown:
        raise HTTPException(status_code=404, detail="Markdown presentation not found.")

    settings = revision.settings or {}
    editor_payload = settings.get("editor_payload") or {}
    editor_slides = editor_payload.get("slides") or []

    slides: list[EditorSlidePayload] = []
    generated = markdown.generated_slides or []
    for idx, md in enumerate(generated):
        existing = editor_slides[idx] if idx < len(editor_slides) and isinstance(editor_slides[idx], dict) else {}
        slides.append(
            EditorSlidePayload(
                id=str(existing.get("id") or f"slide-{idx}"),
                markdown=md,
                blocks=existing.get("blocks"),
            )
        )

    return EditorStateResponse(
        presentation_id=str(pres_uuid),
        editor=EditorStatePayload(
            markdown_presentation_id=str(markdown.id),
            slides=slides,
            theme=markdown.theme,
            logo_url=settings.get("logo_url"),
            logo_position=settings.get("logo_position"),
        ),
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
        markdown_uuid = uuid.UUID(payload.markdown_presentation_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid ID format.")

    presentation = await sql_session.get(ProjectPresentationModel, pres_uuid)
    if not presentation:
        raise HTTPException(status_code=404, detail="Presentation not found.")

    markdown = await sql_session.get(MarkdownPresentationModel, markdown_uuid)
    if not markdown:
        raise HTTPException(status_code=404, detail="Markdown presentation not found.")

    markdown.generated_slides = [slide.markdown for slide in payload.slides]
    if payload.theme:
        markdown.theme = payload.theme
    sql_session.add(markdown)

    revision: Optional[ProjectPresentationRevisionModel] = None
    if presentation.current_revision_id:
        revision = await sql_session.get(
            ProjectPresentationRevisionModel, presentation.current_revision_id
        )
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
            markdown_presentation_id=markdown.id,
            settings={},
        )

    settings = dict(revision.settings or {})
    settings["editor_payload"] = {
        "slides": [slide.model_dump() for slide in payload.slides],
    }
    if payload.logo_url is not None:
        settings["logo_url"] = payload.logo_url
    if payload.logo_position is not None:
        settings["logo_position"] = payload.logo_position
    if payload.theme is not None:
        settings["theme"] = payload.theme
    revision.settings = settings
    revision.markdown_presentation_id = markdown.id
    revision.is_draft = False
    sql_session.add(revision)

    presentation.current_revision_id = revision.id
    presentation.status = "generated"
    sql_session.add(presentation)

    await sql_session.commit()
    await sql_session.refresh(revision)

    return EditorStateResponse(
        presentation_id=str(pres_uuid),
        editor=payload,
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
    """Build a dense but null-safe markdown block from the project row."""
    preferred_fields = [
        ("description", "Project Description"),
        ("problem_statement", "Problem Statement"),
        ("presentable_slide", "Presentable Slide"),
        ("analysis", "Analysis"),
        ("research_data", "Research Data"),
        ("chatbox", "Chat History"),
        ("canvas", "Canvas"),
        ("as_is_map", "As-Is Map"),
        ("research_findings", "Research Findings"),
        ("key_insights", "Key Insights"),
        ("extreme_user_data", "Extreme User Data"),
        ("deep_empathy_data", "Deep Empathy Data"),
        ("psychological_analysis", "Psychological Analysis"),
        ("Behaviour_Framework", "Behaviour Framework"),
        ("HMW_Ideation_Framework", "HMW / Ideation Framework"),
        ("Idea_Clustering_and_Idea_Cards", "Idea Clustering and Idea Cards"),
        ("final_idea", "Final Idea"),
        ("prototype_images", "Prototype Images"),
        ("solution_description", "Solution Description"),
        ("transformation_framework", "Transformation Framework"),
        ("implementation_plan", "Implementation Plan"),
        ("testing", "Testing and Validation"),
        ("market_research", "Market Research"),
        ("metrics", "Metrics and KPIs"),
        ("next_steps", "Next Steps"),
        ("metadata", "Metadata"),
        ("design_research", "Design Research"),
        ("skills", "Skills"),
        ("status", "Status"),
    ]

    consumed_keys = {key for key, _ in preferred_fields}
    title = (
        project.get("title")
        or project.get("name")
        or project.get("project_name")
        or "Untitled Project"
    )

    content_parts = [f"# {title}"]

    for key, label in preferred_fields:
        rendered = _render_project_field(project, key, label)
        if rendered:
            content_parts.append(rendered)

    # Include any additional non-empty fields so new JSONB columns don't get lost.
    for key in sorted(project.keys()):
        if key in consumed_keys or key in {"id", "created_at", "updated_at", "user_id"}:
            continue
        rendered = _render_project_field(project, key, key.replace("_", " ").title())
        if rendered:
            content_parts.append(rendered)

    return "\n".join(part for part in content_parts if part)


def _build_outline_from_content(content: str) -> OutlineDraft:
    slides: list[OutlineSlideDraft] = []

    lines = [line.rstrip() for line in content.splitlines()]
    title = lines[0].lstrip("# ").strip() if lines else "Presentation"
    slides.append(OutlineSlideDraft(title=title, details=["Project overview and goals."]))

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

    def _flush_section():
        if not current_heading:
            return
        json_text = "\n".join(json_buffer).strip()
        details = _summarize_section(current_heading, current_buffer, json_text)
        slides.append(OutlineSlideDraft(title=current_heading, details=details))

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

    slides.append(OutlineSlideDraft(title="Closing", details=["Summary and next steps."]))
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
        if revision and revision.settings:
            logo_url = revision.settings.get("logo_url")
            logo_position = revision.settings.get("logo_position")

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
    """
    SSE endpoint that streams markdown slides as they are generated.

    Event format (each event is a JSON payload on the 'response' event):
      {"type": "slide",    "index": <int>, "markdown": "<slide markdown>"}
      {"type": "progress", "message": "..."}
      {"type": "done",     "total_slides": <int>}
      {"type": "error",    "detail": "..."}
    """
    presentation = await _get_presentation_or_404(id, sql_session)

    async def generate():
        try:
            yield SSEResponse(
                event="response",
                data=json.dumps({"type": "progress", "message": "Starting generation…"}),
            ).to_string()

            messages = get_markdown_generation_messages(
                content=presentation.content,
                n_slides=presentation.n_slides,
                language=presentation.language,
                tone=presentation.tone,
                verbosity=presentation.verbosity,
                text_mode=presentation.text_mode,
                audience=presentation.audience,
                instructions=presentation.instructions,
                slides_markdown=presentation.slides_markdown,
                per_slide_instructions=presentation.per_slide_instructions,
                generation_scope="deck",
            )

            llm_client = LLMClient()
            model = get_model()

            accumulated = ""
            slide_index = 0
            generated_slides: List[str] = []

            async for chunk in llm_client.stream(model=model, messages=messages):
                accumulated += chunk

                complete_slides, accumulated = _take_complete_slides_from_buffer(accumulated)
                for complete_slide in complete_slides:
                    normalized_slides = _normalize_generated_slides(
                        [complete_slide],
                        presentation.verbosity,
                    )
                    for normalized_slide in normalized_slides:
                        generated_slides.append(normalized_slide)
                        yield SSEResponse(
                            event="response",
                            data=json.dumps(
                                {
                                    "type": "slide",
                                    "index": slide_index,
                                    "markdown": normalized_slide,
                                }
                            ),
                        ).to_string()
                        slide_index += 1

            # Emit any remaining content as final slide(s).
            remaining_slides = _normalize_generated_slides(
                _split_markdown_slides(accumulated),
                presentation.verbosity,
            )
            for remaining_slide in remaining_slides:
                generated_slides.append(remaining_slide)
                yield SSEResponse(
                    event="response",
                    data=json.dumps(
                        {
                            "type": "slide",
                            "index": slide_index,
                            "markdown": remaining_slide,
                        }
                    ),
                ).to_string()
                slide_index += 1
            # Persist generated slides back to DB
            presentation.generated_slides = generated_slides
            sql_session.add(presentation)
            await sql_session.commit()

            yield SSECompleteResponse(
                key="total_slides",
                value=len(generated_slides),
            ).to_string()

        except HTTPException as exc:
            yield SSEErrorResponse(detail=exc.detail).to_string()
        except Exception as exc:  # noqa: BLE001
            yield SSEErrorResponse(detail=str(exc)).to_string()

    return StreamingResponse(generate(), media_type="text/event-stream")


# ─── POST /markdown/slide/regenerate ─────────────────────────────────────────


@MARKDOWN_ROUTER.post("/slide/regenerate", response_model=RegenerateSlideResponse)
async def regenerate_slide(
    presentation_id: str = Body(...),
    slide_index: int = Body(...),
    instructions: Optional[str] = Body(None),
    sql_session: AsyncSession = Depends(get_async_session),
):
    """
    Regenerate a single slide without affecting the others.

    The updated markdown is saved back to the presentation record and returned.
    """
    presentation = await _get_presentation_or_404(presentation_id, sql_session)

    if not presentation.generated_slides:
        raise HTTPException(
            status_code=400,
            detail="No generated slides found. Run the stream endpoint first.",
        )

    total = len(presentation.generated_slides)
    if slide_index < 0 or slide_index >= total:
        raise HTTPException(
            status_code=400,
            detail=f"slide_index must be between 0 and {total - 1}.",
        )

    # Build context: neighbouring slides for coherence
    prev_slide = (
        presentation.generated_slides[slide_index - 1] if slide_index > 0 else None
    )
    next_slide = (
        presentation.generated_slides[slide_index + 1]
        if slide_index < total - 1
        else None
    )

    regen_content = f"""
Regenerate slide {slide_index + 1} of {total} in the presentation below.

## Original Presentation Content
{presentation.content}

## Current Slide to Replace (slide {slide_index + 1})
{presentation.generated_slides[slide_index]}

{"## Previous Slide (for context)" if prev_slide else ""}
{prev_slide or ""}

{"## Next Slide (for context)" if next_slide else ""}
{next_slide or ""}

{"## User Regeneration Instructions" if instructions else ""}
{instructions or ""}
"""

    messages = get_markdown_generation_messages(
        content=regen_content,
        n_slides=1,
        language=presentation.language,
        tone=presentation.tone,
        verbosity=presentation.verbosity,
        text_mode=presentation.text_mode,
        audience=presentation.audience,
        instructions=instructions,
        generation_scope="single_slide",
    )

    llm_client = LLMClient()
    model = get_model()
    new_markdown = await llm_client.generate(model=model, messages=messages)

    # Force single-slide response contract in case model emits separators.
    normalized = _split_markdown_slides(new_markdown or "")
    new_markdown = (normalized[0] if normalized else (new_markdown or "")).strip()

    # Update in place and persist
    slides_copy = list(presentation.generated_slides)
    slides_copy[slide_index] = new_markdown
    presentation.generated_slides = slides_copy
    sql_session.add(presentation)
    await sql_session.commit()

    return RegenerateSlideResponse(slide_index=slide_index, markdown=new_markdown)


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


@MARKDOWN_ROUTER.post(
    "/presentation/{id}/export/pptx", response_model=ExportPptxResponse
)
async def export_pptx(
    id: str,
    sql_session: AsyncSession = Depends(get_async_session),
):
    """
    Export the presentation to a .pptx file.

    The file is saved in the exports directory and the path is returned.
    """
    presentation = await _get_presentation_or_404(id, sql_session)

    if not presentation.generated_slides:
        raise HTTPException(
            status_code=400,
            detail="No generated slides found. Run the stream endpoint first.",
        )

    # Import here to keep the module loadable even if python-pptx is absent
    from services.markdown_pptx_export import export_markdown_to_pptx  # noqa: PLC0415

    exports_dir = get_exports_directory()
    output_path = os.path.join(exports_dir, f"markdown_presentation_{id}.pptx")

    await export_markdown_to_pptx(
        slides_markdown=presentation.generated_slides,
        theme_id=presentation.theme,
        output_path=output_path,
    )

    return ExportPptxResponse(path=output_path)


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
