"""
Supabase read-only client.

Required environment variables:
  SUPABASE_URL      — project URL  (https://<ref>.supabase.co)
  SUPABASE_ANON_KEY — anon/public key

Optional environment variables:
  USE_SUPABASE_SERVICE_ROLE     — if "true", use the service-role key for reads
  SUPABASE_SERVICE_ROLE_KEY     — service-role key (server-only; bypasses RLS)

Design:
  * By default, the anon key respects Row Level Security — Supabase-side policies
    can restrict what rows are readable.
  * When USE_SUPABASE_SERVICE_ROLE=true, the service-role key is used instead,
    which bypasses RLS. This is useful for local/dev servers that need to read
    user-owned rows without end-user auth tokens.
  * ReadOnlySupabaseClient wraps the raw client and raises PermissionError
    immediately if any mutating method (insert / update / upsert / delete /
    rpc) is called — providing a second, in-process enforcement layer.
"""

from __future__ import annotations

import logging
from functools import lru_cache
from typing import Any

from supabase import Client, create_client

from utils.get_env import (
    get_supabase_key_env,
    get_supabase_service_role_key_env,
    get_supabase_url_env,
    get_use_supabase_service_role_env,
)

_BLOCKED = ("insert", "update", "upsert", "delete")
_BLOCK_MSG = (
    "Write operations are disabled on this Supabase client. "
    "Only SELECT queries are permitted."
)

logger = logging.getLogger(__name__)


class _ReadOnlyTable:
    """Thin proxy around a Supabase table query builder.

    Passes SELECT-related calls through unchanged; raises PermissionError
    on any attempt to mutate data.
    """

    def __init__(self, builder: Any) -> None:
        self._builder = builder

    def __getattr__(self, name: str) -> Any:
        if name in _BLOCKED:
            raise PermissionError(_BLOCK_MSG)
        attr = getattr(self._builder, name)
        # Wrap callable returns so chained mutating calls are also blocked
        if callable(attr):
            def _guarded(*args: Any, **kwargs: Any) -> Any:
                result = attr(*args, **kwargs)
                # If the result is a new query builder, wrap it too
                if hasattr(result, "insert") or hasattr(result, "select"):
                    return _ReadOnlyTable(result)
                return result
            return _guarded
        return attr


class ReadOnlySupabaseClient:
    """Wrapper around a Supabase Client that blocks all mutating operations."""

    def __init__(self, client: Client) -> None:
        self._client = client

    def table(self, table_name: str) -> _ReadOnlyTable:
        return _ReadOnlyTable(self._client.table(table_name))

    # Block top-level mutating shortcuts
    def rpc(self, *args: Any, **kwargs: Any) -> Any:  # type: ignore[override]
        raise PermissionError(_BLOCK_MSG)

    def __getattr__(self, name: str) -> Any:
        if name in _BLOCKED:
            raise PermissionError(_BLOCK_MSG)
        return getattr(self._client, name)


@lru_cache(maxsize=1)
def get_supabase_client() -> ReadOnlySupabaseClient:
    """Return a cached read-only Supabase client.

    Raises RuntimeError if the required environment variables are not set.
    """
    url = get_supabase_url_env()
    anon_key = get_supabase_key_env()

    use_service_raw = (get_use_supabase_service_role_env() or "").strip().lower()
    service_key_present = bool((get_supabase_service_role_key_env() or "").strip())

    # Best-of-both:
    # - If USE_SUPABASE_SERVICE_ROLE is explicitly set, respect it.
    # - Else, if a service-role key exists, prefer it (prevents anon+RLS surprises).
    use_service = use_service_raw in {"1", "true", "yes", "on"} if use_service_raw else service_key_present
    service_key = (get_supabase_service_role_key_env() or "").strip() if use_service else ""
    key = service_key or (anon_key or "")

    if not url or not key.strip():
        raise RuntimeError(
            "SUPABASE_URL and SUPABASE_ANON_KEY environment variables must be set "
            "to use Supabase-backed features."
        )

    if use_service and not service_key_present:
        raise RuntimeError(
            "USE_SUPABASE_SERVICE_ROLE is enabled but SUPABASE_SERVICE_ROLE_KEY is not set."
        )

    logger.info(
        "Supabase client initialized (read-only). key_mode=%s",
        "service_role" if use_service else "anon",
    )
    raw = create_client(url, key)
    return ReadOnlySupabaseClient(raw)
