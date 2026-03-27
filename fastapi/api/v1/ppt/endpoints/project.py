"""
Project endpoints — Supabase project fetch and brief generation.

Routes:
  GET  /project/{project_id}        — fetch raw project row
  POST /project/{project_id}/brief  — fetch project + condense to markdown brief via LLM
"""

from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.supabase_client import get_supabase_client
from utils.llm_calls.generate_brief_from_project import generate_brief_from_project

PROJECT_ROUTER = APIRouter(prefix="/project", tags=["Project"])

TABLE_NAME = "projects"


# ---------------------------------------------------------------------------
# Response models
# ---------------------------------------------------------------------------

class ProjectResponse(BaseModel):
    id: str
    data: Dict[str, Any]


class BriefResponse(BaseModel):
    project_id: str
    brief: str


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_client():
    """Return the Supabase client or raise a 503 if not configured."""
    try:
        return get_supabase_client()
    except RuntimeError as exc:
        raise HTTPException(
            status_code=503,
            detail=str(exc),
        ) from exc


async def _fetch_project(project_id: str) -> Dict[str, Any]:
    """Fetch a single project row from Supabase; raise 404 if not found."""
    client = _get_client()
    try:
        response = (
            client.table(TABLE_NAME)
            .select("*")
            .eq("id", project_id)
            .single()
            .execute()
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Supabase query failed: {exc}",
        ) from exc

    if not response.data:
        raise HTTPException(
            status_code=404,
            detail=f"Project '{project_id}' not found in table '{TABLE_NAME}'.",
        )

    return response.data


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@PROJECT_ROUTER.get("/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: str):
    """
    Fetch the raw project row from Supabase.

    Returns the full row as a JSON object so the frontend can inspect
    available fields without making a separate brief call.
    """
    data = await _fetch_project(project_id)
    return ProjectResponse(id=project_id, data=data)


@PROJECT_ROUTER.post("/{project_id}/brief", response_model=BriefResponse)
async def get_project_brief(project_id: str):
    """
    Fetch the project row and run it through the brief-generation LLM prompt.

    The returned `brief` field is a markdown string ready to be pasted
    directly into the presentation content field (or auto-populated by
    the frontend Import-from-Project flow).
    """
    project_data = await _fetch_project(project_id)
    brief = await generate_brief_from_project(project_data)
    return BriefResponse(project_id=project_id, brief=brief)
