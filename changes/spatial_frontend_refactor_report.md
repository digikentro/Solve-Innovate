# Spatial Frontend Refactor Report

## Overview
This report documents the frontend refactor for the Spatial JSON presentation architecture.

The presentation editor was migrated from markdown-stream rendering to a spatial canvas model that consumes `editor_payload` and supports Canva/Figma-style interactions.

## Implemented Library Stack
Installed and integrated:
- `react-moveable` for canvas drag/resize/rotate
- `react-selecto` for multi-select with drag-box selection
- `@dnd-kit/core` for slide thumbnail drag-and-drop
- `@dnd-kit/sortable` and `@dnd-kit/utilities` for sortable thumbnail behavior
- `react-hotkeys-hook` for keyboard shortcuts
- `@tiptap/react` kept via existing `LightweightWysiwyg`
- `echarts` + `echarts-for-react` for chart blocks with runtime resize handling

## Major File Changes

### 1) Types and API contracts
- `src/types/presentation.ts`
  - Added strict spatial models (`SpatialDeckPayload`, `SpatialSlide`, `SpatialBlock` variants)
  - Added spatial outline schema (`bullets`, `visual_intent`, `has_quantitative_data`)
  - Updated editor-state API payload shape to `editor_payload`
  - Preserved legacy markdown types for compatibility with existing untouched modules

- `src/services/presentationApi.ts`
  - Updated generate payload fields to match spatial backend (`density`, `visual_preference`, chart/image controls)
  - Added PDF export API method
  - Removed obsolete stream URL helper

### 2) Hook and state management
- `src/hooks/usePresentation.ts`
  - Removed SSE stream dependency
  - New flow: `POST /generate` -> immediate spatial payload hydration
  - Added clipboard state for copy/paste across slides
  - Added undo/redo history state
  - Added debounced autosave with `PATCH /editor-state` sending full `editor_payload`
  - Added keyboard shortcuts:
    - `Cmd/Ctrl+C` copy
    - `Cmd/Ctrl+V` paste
    - `Cmd/Ctrl+Z` undo
    - `Cmd/Ctrl+Shift+Z` redo
    - `Backspace/Delete` delete selected blocks

- Deleted `src/hooks/usePresentationStream.ts`

### 3) Canvas engine
- `src/components/presentation/renderer/SlideRenderer.tsx`
  - Rewritten as absolute positioning renderer
  - Maps block geometry directly to percentages:
    - `left = x%`, `top = y%`, `width = width%`, `height = height%`, `z-index = z_index`
  - Integrated `react-moveable` for drag/resize/rotate
  - Added snap guides and parent bounds locking
  - Integrated `react-selecto` for drag-box multiselect
  - Text block behavior:
    - display mode by default
    - TipTap edit mode on double-click only
    - read-only while dragging
  - Image block behavior:
    - supports `cover` / `contain`
    - resize scales container without distortion
  - Chart block behavior:
    - ECharts rendering
    - `resize()` triggered on stage resize via `ResizeObserver`

- `src/components/presentation/LightweightWysiwyg.tsx`
  - Added `compact`, `readOnly`, and `onBlur` support for canvas editing mode

### 4) Workspace UI and layout
- `src/components/presentation/PresentationViewer.tsx`
  - Rebuilt to strict layout:
    - top bar
    - left thumbnails column
    - center stage column
    - right panel (Design / Insert / Format tabs)
  - Top bar includes:
    - back button
    - editable title
    - save status indicator
    - undo/redo
    - present
    - export dropdown (PPTX/PDF)
    - overflow menu for single-slide regeneration prompt
  - Right panel tabs include:
    - Design: theme swatches, brand colors, logo upload/url, logo placement
    - Insert: add heading/paragraph/image/chart
    - Format (contextual): color, image replace/crop mode, z-index controls, copy/paste/delete

- `src/components/presentation/SlideThumbnails.tsx`
  - Rebuilt with `@dnd-kit/core` + sortable drag ordering
  - Maintains 16:9 thumbnail previews
  - Added persistent "Add New Slide" button

### 5) Outline pre-generation page
- `src/components/presentation/PresentationSection.tsx`
  - Outline view updated to human-readable card format
  - Displays:
    - `visual_intent` badges
    - `has_quantitative_data` indicator
    - editable bullets
  - Kept left settings panel for tone/density/target slides
  - Wired generation to spatial editor payload flow
  - Wired viewer with updated hook APIs and selection state

### 6) Cleanup
- Deleted obsolete markdown pagination utility:
  - `src/utils/domSlidePagination.tsx`

- Updated compatibility usage:
  - `src/components/presentation/PresentationStreamView.tsx`

## Requirement Mapping
- Mandatory libraries: implemented
- 3-column layout + top bar: implemented
- Absolute positioning engine with percentage mapping: implemented
- Moveable bounds + snapping: implemented
- Selecto multiselect: implemented
- Text editing lock + double-click activation: implemented
- Image proportional scaling controls: implemented
- Chart resize handling: implemented
- Clipboard cross-slide copy/paste: implemented
- Debounced autosave full payload: implemented
- Required shortcuts: implemented
- Outline visual_intent/quantitative cards: implemented

## Validation
Commands executed:
- `npm run build` -> success
- `npx tsc -p tsconfig.json --noEmit` -> remaining errors are pre-existing in unrelated files:
  - `src/components/project-detail/ExtremeUserReportViewer.tsx`
  - `src/components/project-detail/PsychologicalAnalysisReportViewer.tsx`

No type errors remain in the newly refactored presentation files.

## Notes
- Existing dirty-repo changes outside this refactor were not reverted.
- Legacy markdown type exports were intentionally retained to avoid collateral breakage in untouched modules.

## Second-Pass Testing and Accessibility Sweep
- Added explicit accessible names (`aria-label`/`title`) for unlabeled controls in:
  - `src/components/presentation/PresentationViewer.tsx`
  - `src/components/presentation/PresentationSection.tsx`
- Verified after changes:
  - `npm run build` -> success
  - `npx tsc --noEmit` -> unchanged unrelated pre-existing errors only in:
    - `src/components/project-detail/ExtremeUserReportViewer.tsx`
    - `src/components/project-detail/PsychologicalAnalysisReportViewer.tsx`
- Remaining editor diagnostics in presentation files are non-blocking style-policy warnings tied to dynamic color preview buttons that intentionally use inline `style` for runtime-selected colors.
