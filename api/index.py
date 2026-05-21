"""
Vercel Python entry: exposes the FastAPI ASGI `app` for /api/* rewrites.
"""
import os
import sys

# Resolve presenton backend package (`api`, `services`, …) under ./fastapi
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "fastapi"))

from api.main import app  # noqa: F401 — Vercel runtime expects name `app`
