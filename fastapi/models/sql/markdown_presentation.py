from datetime import datetime
from typing import List, Optional
import uuid

from sqlalchemy import JSON, Column, DateTime, String
from sqlmodel import Field, SQLModel

from utils.datetime_utils import get_current_utc_datetime


class MarkdownPresentationModel(SQLModel, table=True):
    """
    Stores a markdown-based presentation record.

    The actual slide markdown strings are persisted in `generated_slides` once
    the SSE generation stream completes.  Until then the field is None so the
    frontend knows the presentation has not finished generating.
    """

    __tablename__ = "markdown_presentations"

    id: uuid.UUID = Field(primary_key=True, default_factory=uuid.uuid4)

    # ── Input content ──────────────────────────────────────────────────────────
    content: str  # Raw user content / outline
    # Pre-split slides (card-by-card mode). None means freeform mode.
    slides_markdown: Optional[List[str]] = Field(
        sa_column=Column(JSON), default=None
    )

    # ── Generation parameters ─────────────────────────────────────────────────
    n_slides: int = Field(default=10)
    language: str = Field(default="English")
    tone: str = Field(default="professional")
    verbosity: str = Field(default="standard")
    text_mode: str = Field(default="generate")  # generate | condense | preserve
    audience: Optional[str] = Field(sa_column=Column(String), default=None)
    instructions: Optional[str] = Field(sa_column=Column(String), default=None)
    per_slide_instructions: Optional[List[str]] = Field(
        sa_column=Column(JSON), default=None
    )

    # ── Visual settings ───────────────────────────────────────────────────────
    theme: str = Field(default="modern-dark")
    image_source: str = Field(default="ai")  # ai | stock | none
    image_style: Optional[str] = Field(
        sa_column=Column(String), default="photo"
    )  # photo | abstract | 3d | line_art | watercolor
    
    # Visual generation controls (new)
    visual_config: Optional[dict] = Field(sa_column=Column(JSON), default=None)

    # ── Output ────────────────────────────────────────────────────────────────
    # List of generated markdown strings, one per slide.  Populated after
    # the SSE stream finishes.  None means generation has not run yet.
    generated_slides: Optional[List[str]] = Field(
        sa_column=Column(JSON), default=None
    )

    # ── Timestamps ────────────────────────────────────────────────────────────
    created_at: datetime = Field(
        sa_column=Column(
            DateTime(timezone=True),
            nullable=False,
            default=get_current_utc_datetime,
        )
    )
    updated_at: datetime = Field(
        sa_column=Column(
            DateTime(timezone=True),
            nullable=False,
            default=get_current_utc_datetime,
            onupdate=get_current_utc_datetime,
        )
    )
