# Spatial Migration Change Log

Date: 2026-04-03
Scope: Full backend pivot from markdown streaming to spatial JSON canvas, OpenAI-only environment hardening, and frontend runtime crash fix.

## 1) Backend Architecture Refactor (Spatial JSON)

### Core endpoint and schema migration
File: fastapi/api/v1/ppt/endpoints/markdown_presentation.py

- Added spatial canvas schema models:
  - SpatialPosition
  - SpatialTextStyle
  - SpatialTextBlock
  - SpatialImageBlock
  - SpatialChartDataPoint
  - SpatialChartBlock
  - SpatialSlide
  - SpatialDeckPayload
- Updated outline schema from details to bullets and added:
  - visual_intent
  - has_quantitative_data
- Updated response model for generation to include editor_payload.
- Updated editor state payload model to carry exact editor_payload JSON.

### Generate endpoint migration
- Refactored POST /project/presentations/{presentation_id}/generate to:
  - Build quantitative dataset context from project data.
  - Call LLMClient.generate_structured with strict SpatialDeckPayload schema.
  - Resolve image blocks by generating assets and replacing prompt with generated path.
  - Persist exact spatial payload to revision settings.editor_payload.
  - Return editor_payload in API response.

### Outline endpoint migration
- Refactored POST /project/presentations/{presentation_id}/outline to structured LLM output using OutlineDraft schema.
- Prompt now enforces visual_intent and has_quantitative_data flags.
- Added compatibility coercion for legacy outline drafts that still contain details.

### Editor-state behavior change
- GET /project/presentations/{presentation_id}/editor-state now returns exact persisted editor_payload.
- PATCH /project/presentations/{presentation_id}/editor-state now stores exact editor_payload and optional metadata fields.

### Legacy markdown flow handling
- Deprecated runtime markdown stream endpoint and single-slide markdown regeneration with HTTP 410 responses:
  - GET /presentation/{id}/stream
  - POST /slide/regenerate

### Supabase and persistence rules
- Enforced read-only project fetch shape by selecting explicit source columns instead of select *.
- Kept SQLite revision/settings as source of truth for editor state and presentation payload.

## 2) Prompt Contract Migration (Markdown -> Spatial JSON)

File: fastapi/utils/llm_calls/generate_markdown_slides.py

- Replaced markdown-oriented system prompt with spatial JSON contract.
- New prompt requirements include:
  - Valid JSON only.
  - Non-overlapping blocks.
  - Position bounds in 0-100 percentages.
  - Density hardening rule: if density is Concise, text blocks max 4 bullets.
  - Quantitative dataset grounding for chart blocks.
- Updated function signature to use:
  - density
  - visual_preference
  - quantitative_datasets
- Removed markdown deck/single-slide scope assumptions.

## 3) Structured Output Hardening

File: fastapi/services/llm_client.py

- Hardened generate_structured return handling:
  - Parses string content into JSON when needed.
  - Rejects non-object structured responses with clear HTTP errors.

## 4) OpenAI-Only Environment Fix (Missing Google SDK)

### Shared model import safety
File: fastapi/models/llm_message.py

- Made Google type import optional using TYPE_CHECKING fallback to Any.
- Prevents import-time crash when google package is not installed.

### Provider import safety
File: fastapi/services/llm_client.py

- Wrapped Google SDK imports in try/except ModuleNotFoundError.
- Added explicit provider-specific error only when Google provider is selected.
- Added from __future__ import annotations to avoid runtime annotation evaluation issues.

Result: OpenAI-only test collection and execution work without google SDK installed.

## 5) Test Contract Updates

File: fastapi/tests/test_markdown_generation_contract.py

- Replaced markdown separator-oriented assertions with spatial prompt contract assertions.
- Tests now verify:
  - Spatial JSON language in prompts.
  - Density and layout hardening rules.
  - Quantitative dataset instructions in prompt.

## 6) Frontend Runtime Crash Fix (position.x undefined)

### Hydration normalization
File: src/hooks/usePresentation.ts

- Added robust geometry normalization for incoming blocks:
  - normalizePosition with safe defaults.
  - numeric guard via toFiniteNumber.
- Updated normalizeBlock to always provide valid position.
- Ensures legacy or partial payloads do not crash renderer.

### Renderer hardening
File: src/components/presentation/renderer/SlideRenderer.tsx

- Added getNormalizedPosition and numeric guards.
- Replaced direct block.position access with normalized position everywhere:
  - render style mapping
  - drag handler
  - resize handler
- Added defensive fallback when slide.blocks is missing or malformed.
- Updated Moveable guideline source to guarded block list.

Result: Runtime TypeError on position.x no longer crashes rendering.

## 7) Validation Summary

- Backend modified files reported no compile errors in tool diagnostics.
- Targeted pytest after provider import hardening:
  - tests/test_markdown_generation_contract.py: 2 passed
- Frontend build after renderer/hydration fix:
  - npm run build: success
- Remaining diagnostics noted were unrelated style-policy warnings and pre-existing project warnings.

## 8) Files Changed in This Session

- fastapi/api/v1/ppt/endpoints/markdown_presentation.py
- fastapi/utils/llm_calls/generate_markdown_slides.py
- fastapi/services/llm_client.py
- fastapi/tests/test_markdown_generation_contract.py
- fastapi/models/llm_message.py
- src/hooks/usePresentation.ts
- src/components/presentation/renderer/SlideRenderer.tsx

## 9) Notes

- Existing unrelated dirty-repo changes were not reverted.
- Legacy compatibility was retained where possible to avoid collateral breakage.
