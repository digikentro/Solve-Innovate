from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import Column, DateTime, String
from sqlmodel import Field, SQLModel

from utils.datetime_utils import get_current_utc_datetime


class ProjectPresentationModel(SQLModel, table=True):
    __tablename__ = "project_presentations"

    id: uuid.UUID = Field(primary_key=True, default_factory=uuid.uuid4)
    project_id: str = Field(sa_column=Column(String, index=True, nullable=False))
    title: str = Field(sa_column=Column(String, nullable=False))
    status: str = Field(default="draft", sa_column=Column(String, nullable=False))
    current_revision_id: Optional[uuid.UUID] = Field(default=None)

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
