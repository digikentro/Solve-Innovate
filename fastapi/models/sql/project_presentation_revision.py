from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import Column, DateTime, JSON
from sqlmodel import Field, SQLModel

from utils.datetime_utils import get_current_utc_datetime


class ProjectPresentationRevisionModel(SQLModel, table=True):
    __tablename__ = "project_presentation_revisions"

    id: uuid.UUID = Field(primary_key=True, default_factory=uuid.uuid4)
    presentation_id: uuid.UUID = Field(foreign_key="project_presentations.id")
    revision_number: int = Field(default=1)
    is_draft: bool = Field(default=True)
    markdown_presentation_id: Optional[uuid.UUID] = Field(default=None)

    source_snapshot: Optional[dict] = Field(
        default=None, sa_column=Column(JSON, nullable=True)
    )
    outline: Optional[dict] = Field(default=None, sa_column=Column(JSON, nullable=True))
    settings: Optional[dict] = Field(default=None, sa_column=Column(JSON, nullable=True))

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
