from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from typing import Any, Dict

from dotenv import load_dotenv


def _truthy(value: str | None) -> bool:
    return (value or "").strip().lower() in {"1", "true", "yes", "on"}


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Seed (upsert) a row in Supabase `projects` for local testing."
    )
    parser.add_argument(
        "--env",
        default=os.path.join(os.path.dirname(__file__), "..", ".env"),
        help="Path to env file (default: fastapi/.env)",
    )
    parser.add_argument(
        "--id",
        default="0497ad67-3f6e-49ee-9ac2-07e75cc4b710",
        help="Project UUID to seed",
    )
    parser.add_argument("--title", default="Seeded Project", help="Project title")
    parser.add_argument(
        "--description",
        default="Seeded row for presentation generation.",
        help="Project description",
    )
    parser.add_argument(
        "--extra-json",
        default="{}",
        help="Extra JSON fields to include in the row (default: '{}')",
    )
    args = parser.parse_args()

    load_dotenv(args.env)

    url = os.getenv("SUPABASE_URL")
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not service_key:
        print(
            "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env. "
            "Add SUPABASE_SERVICE_ROLE_KEY to fastapi/.env (server-only).",
            file=sys.stderr,
        )
        return 2

    extra: Dict[str, Any]
    try:
        extra = json.loads(args.extra_json or "{}")
    except json.JSONDecodeError as exc:
        print(f"--extra-json must be valid JSON: {exc}", file=sys.stderr)
        return 2

    row: Dict[str, Any] = {
        "id": args.id,
        "title": args.title,
        "description": args.description,
        **extra,
    }

    endpoint = url.rstrip("/") + "/rest/v1/projects"
    qs = urllib.parse.urlencode({"on_conflict": "id"})
    upsert_url = f"{endpoint}?{qs}"

    body = json.dumps(row).encode("utf-8")
    req = urllib.request.Request(
        upsert_url,
        data=body,
        method="POST",
        headers={
            "Content-Type": "application/json",
            "apikey": service_key,
            "Authorization": f"Bearer {service_key}",
            "Prefer": "resolution=merge-duplicates,return=representation",
        },
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            resp_text = resp.read().decode("utf-8", errors="replace")
            if resp.status < 200 or resp.status >= 300:
                print(f"Upsert failed ({resp.status}): {resp_text}", file=sys.stderr)
                return 1
    except urllib.error.HTTPError as exc:
        err_body = exc.read().decode("utf-8", errors="replace")
        print(f"Upsert failed ({exc.code}): {err_body}", file=sys.stderr)
        return 1
    except Exception as exc:  # noqa: BLE001
        print(f"Upsert failed: {exc}", file=sys.stderr)
        return 1

    # Enable service-role reads for the API server if desired.
    if not _truthy(os.getenv("USE_SUPABASE_SERVICE_ROLE")):
        print(
            "Seeded. To make the FastAPI `/generate` read this row, set "
            "USE_SUPABASE_SERVICE_ROLE=true in fastapi/.env (server-only)."
        )
    else:
        print("Seeded. API is already configured to use service-role reads.")

    print("Seeded row id:", args.id)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

