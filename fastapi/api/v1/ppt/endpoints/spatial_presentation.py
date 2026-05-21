from __future__ import annotations

import os
import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.sql.project_presentation import ProjectPresentationModel
from models.sql.project_presentation_revision import ProjectPresentationRevisionModel
from services.database import get_async_session
from services.spatial_pptx_export import export_spatial_to_pptx
from utils.asset_directory_utils import get_exports_directory

SPATIAL_ROUTER = APIRouter(prefix="/spatial", tags=["Spatial Presentations"])


class ExportPptxResponse(BaseModel):
    path: str


@SPATIAL_ROUTER.post(
    "/presentation/{presentation_id}/export/pptx",
    response_model=ExportPptxResponse,
)
async def export_spatial_pptx(
    presentation_id: str,
    sql_session: AsyncSession = Depends(get_async_session),
):
    """Export latest spatial editor_payload for a project presentation as PPTX."""
    try:
        presentation_uuid = uuid.UUID(presentation_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid presentation ID format.") from exc

    presentation = await sql_session.get(ProjectPresentationModel, presentation_uuid)
    if not presentation:
        raise HTTPException(status_code=404, detail="Presentation not found.")

    revision = None
    if presentation.current_revision_id:
        revision = await sql_session.get(ProjectPresentationRevisionModel, presentation.current_revision_id)

    if not revision:
        stmt = (
            select(ProjectPresentationRevisionModel)
            .where(ProjectPresentationRevisionModel.presentation_id == presentation_uuid)
            .order_by(ProjectPresentationRevisionModel.updated_at.desc())
            .limit(1)
        )
        result = await sql_session.execute(stmt)
        revision = result.scalar_one_or_none()

    if not revision:
        raise HTTPException(status_code=404, detail="Presentation revision not found.")

    settings = revision.settings or {}
    editor_payload = settings.get("editor_payload")
    if not isinstance(editor_payload, dict):
        raise HTTPException(status_code=404, detail="editor_payload not found in revision settings.")

    exports_dir = get_exports_directory()
    output_path = os.path.join(exports_dir, f"spatial_presentation_{presentation_id}.pptx")

    try:
        await export_spatial_to_pptx(editor_payload=editor_payload, output_path=output_path)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Failed to export PPTX: {exc}") from exc

    return ExportPptxResponse(path=output_path)
