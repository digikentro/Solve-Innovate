from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock
import uuid

import pytest

from api.v1.ppt.endpoints.markdown_presentation import _build_project_presentation_summary


def test_build_project_presentation_summary_ignores_non_dict_revision_settings():
    presentation_id = uuid.uuid4()
    revision_id = uuid.uuid4()
    markdown_id = uuid.uuid4()

    presentation = SimpleNamespace(
        id=presentation_id,
        project_id="project-123",
        title="Quarterly Update",
        status="generated",
        created_at=datetime(2026, 4, 13, tzinfo=timezone.utc),
        updated_at=datetime(2026, 4, 13, 12, 30, tzinfo=timezone.utc),
        current_revision_id=revision_id,
    )
    revision = SimpleNamespace(
        markdown_presentation_id=markdown_id,
        settings="legacy-settings-string",
    )
    markdown = SimpleNamespace(
        id=markdown_id,
        generated_slides=["# Title\nBody copy"],
    )

    sql_session = SimpleNamespace(get=AsyncMock(side_effect=[revision, markdown]))

    summary = asyncio.run(_build_project_presentation_summary(presentation, sql_session))

    assert summary.id == str(presentation_id)
    assert summary.current_revision_id == str(revision_id)
    assert summary.current_markdown_presentation_id == str(markdown_id)
    assert summary.current_slide_count == 1
    assert summary.preview_title == "Title"
    assert summary.preview_snippet == "Body copy"
    assert summary.logo_url is None
    assert summary.logo_position is None