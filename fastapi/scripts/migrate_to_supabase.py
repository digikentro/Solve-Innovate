"""
Migrate SQLite presentation data to Supabase.
Run from the fastapi directory: uv run python scripts/migrate_to_supabase.py
"""
import json
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env")
    sys.exit(1)

client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

EXPORT_DIR = Path(__file__).parent.parent  # fastapi/

def load_export(table: str):
    path = EXPORT_DIR / f"_export_{table}.json"
    if not path.exists():
        print(f"  [SKIP] No export file for {table}")
        return []
    with open(path) as f:
        return json.load(f)


def migrate_table(table: str, rows: list[dict], json_fields: list[str]):
    if not rows:
        print(f"  [SKIP] {table} — no data")
        return

    # Convert JSON string fields to Python objects
    cleaned = []
    for row in rows:
        r = dict(row)
        for field in json_fields:
            if field in r and isinstance(r[field], str):
                try:
                    r[field] = json.loads(r[field])
                except (json.JSONDecodeError, TypeError):
                    pass
        cleaned.append(r)

    # Upsert in chunks of 100
    chunk_size = 100
    inserted = 0
    for i in range(0, len(cleaned), chunk_size):
        chunk = cleaned[i : i + chunk_size]
        result = client.table(table).upsert(chunk, on_conflict="id").execute()
        inserted += len(chunk)

    print(f"  [OK] {table} — {inserted} rows inserted/updated")


print("=== Migrating SQLite → Supabase ===")

# markdown_presentations
rows = load_export("markdown_presentations")
migrate_table(
    "markdown_presentations",
    rows,
    json_fields=["slides_markdown", "per_slide_instructions", "generated_slides"],
)

# project_presentations (no JSON fields)
rows = load_export("project_presentations")
migrate_table("project_presentations", rows, json_fields=[])

# project_presentation_revisions
rows = load_export("project_presentation_revisions")
migrate_table(
    "project_presentation_revisions",
    rows,
    json_fields=["source_snapshot", "outline", "settings"],
)

print("=== Migration complete ===")
