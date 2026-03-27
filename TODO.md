# PPT Generation Flow Fix - TODO

## Approved Plan Steps
- [ ] Step 1: Update generate_markdown_slides.py with exact SLIDE format system prompt and JSON parsing instructions in user prompt.
- [ ] Step 2: Enhance generate_from_project in markdown_presentation.py to deeply extract/print all JSONB fields (research_data, chatbox, all 12 stages).
- [ ] Step 3: Test backend endpoint with sample project data.
- [ ] Step 4: Verify SSE stream produces slides matching exact task format.
- [ ] Step 5: Ensure existing functions (create, stream, export) unchanged/perfect.
- [ ] Step 6: attempt_completion.

**Progress:** Step 1 complete (prompts updated). Step 2: backend content builder enhanced to prioritize/extract all JSON deeply. Tests needed.

