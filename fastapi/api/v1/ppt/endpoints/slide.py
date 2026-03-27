from typing import Annotated, Optional
from fastapi import APIRouter, Body, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from models.sql.presentation import PresentationModel
from models.sql.slide import SlideModel
from models.presentation_outline_model import SlideOutlineModel
from services.database import get_async_session
from services.image_generation_service import ImageGenerationService
from utils.asset_directory_utils import get_images_directory
from utils.llm_calls.edit_slide import get_edited_slide_content
from utils.llm_calls.edit_slide_html import get_edited_slide_html
from utils.llm_calls.generate_slide_content import get_slide_content_from_type_and_outline
from utils.llm_calls.select_slide_type_on_edit import get_slide_layout_from_prompt
from utils.process_slides import (
    process_old_and_new_slides_and_fetch_assets,
    process_slide_and_fetch_assets,
    process_slide_add_placeholder_assets,
)
import uuid


SLIDE_ROUTER = APIRouter(prefix="/slide", tags=["Slide"])


@SLIDE_ROUTER.post("/edit")
async def edit_slide(
    id: Annotated[uuid.UUID, Body()],
    prompt: Annotated[str, Body()],
    sql_session: AsyncSession = Depends(get_async_session),
):
    slide = await sql_session.get(SlideModel, id)
    if not slide:
        raise HTTPException(status_code=404, detail="Slide not found")
    presentation = await sql_session.get(PresentationModel, slide.presentation)
    if not presentation:
        raise HTTPException(status_code=404, detail="Presentation not found")

    presentation_layout = presentation.get_layout()
    slide_layout = await get_slide_layout_from_prompt(
        prompt, presentation_layout, slide
    )

    edited_slide_content = await get_edited_slide_content(
        prompt, slide, presentation.language, slide_layout
    )

    image_generation_service = ImageGenerationService(get_images_directory())

    # This will mutate edited_slide_content
    new_assets = await process_old_and_new_slides_and_fetch_assets(
        image_generation_service,
        slide.content,
        edited_slide_content,
    )

    # Always assign a new unique id to the slide
    slide.id = uuid.uuid4()

    sql_session.add(slide)
    slide.content = edited_slide_content
    slide.layout = slide_layout.id
    slide.speaker_note = edited_slide_content.get("__speaker_note__", "")
    sql_session.add_all(new_assets)
    await sql_session.commit()

    return slide


@SLIDE_ROUTER.post("/edit-html", response_model=SlideModel)
async def edit_slide_html(
    id: Annotated[uuid.UUID, Body()],
    prompt: Annotated[str, Body()],
    html: Annotated[Optional[str], Body()] = None,
    sql_session: AsyncSession = Depends(get_async_session),
):
    slide = await sql_session.get(SlideModel, id)
    if not slide:
        raise HTTPException(status_code=404, detail="Slide not found")

    html_to_edit = html or slide.html_content
    if not html_to_edit:
        raise HTTPException(status_code=400, detail="No HTML to edit")

    edited_slide_html = await get_edited_slide_html(prompt, html_to_edit)

    # Always assign a new unique id to the slide
    # This is to ensure that the nextjs can track slide updates
    slide.id = uuid.uuid4()

    sql_session.add(slide)
    slide.html_content = edited_slide_html
    await sql_session.commit()

    return slide


@SLIDE_ROUTER.post("/generate")
async def generate_slide(
    presentation_id: Annotated[uuid.UUID, Body()],
    layout_id: Annotated[str, Body()],
    prompt: Annotated[str, Body()],
    sql_session: AsyncSession = Depends(get_async_session),
):
    """Generate AI content for a single new slide given a prompt and layout."""
    presentation = await sql_session.get(PresentationModel, presentation_id)
    if not presentation:
        raise HTTPException(status_code=404, detail="Presentation not found")

    # Resolve the slide layout from the presentation's layout group
    presentation_layout = presentation.get_layout()
    slide_layout = None
    for layout in presentation_layout.slides:
        if layout.id == layout_id:
            slide_layout = layout
            break

    if not slide_layout:
        raise HTTPException(
            status_code=404,
            detail=f"Layout '{layout_id}' not found in presentation layout group",
        )

    # Generate content using the same pipeline as presentation creation
    outline = SlideOutlineModel(content=prompt)
    slide_content = await get_slide_content_from_type_and_outline(
        slide_layout,
        outline,
        presentation.language,
        presentation.tone,
        presentation.verbosity,
        presentation.instructions,
    )

    # Build the slide model
    slide = SlideModel(
        id=uuid.uuid4(),
        presentation=presentation_id,
        layout_group=presentation_layout.name,
        layout=layout_id,
        index=0,  # Index will be set by the frontend
        speaker_note=slide_content.get("__speaker_note__", ""),
        content=slide_content,
    )

    # Process assets (images, icons)
    image_generation_service = ImageGenerationService(get_images_directory())
    process_slide_add_placeholder_assets(slide)
    generated_assets = await process_slide_and_fetch_assets(
        image_generation_service, slide
    )

    sql_session.add(slide)
    sql_session.add_all(generated_assets)
    await sql_session.commit()

    return slide
