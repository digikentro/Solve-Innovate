import os
from utils.get_env import (
    get_app_data_directory_env,
    get_database_url_env,
    get_use_database_url_for_sql_writes_env,
)
from urllib.parse import urlsplit, urlunsplit, parse_qsl, urlencode
import ssl


def get_database_url_and_connect_args() -> tuple[str, dict]:
    sqlite_default = "sqlite:///" + os.path.join(
        get_app_data_directory_env() or "/tmp/presenton", "fastapi.db"
    )
    use_database_url_for_writes = (
        str(get_use_database_url_for_sql_writes_env() or "").strip().lower() == "true"
    )
    configured_database_url = get_database_url_env()

    # Keep SQLite as the default write-store source of truth.
    # DATABASE_URL is used for SQL writes only when explicitly opted in.
    if use_database_url_for_writes and not configured_database_url:
        raise RuntimeError(
            "USE_DATABASE_URL_FOR_SQL_WRITES is true but DATABASE_URL is not set."
        )

    if use_database_url_for_writes and configured_database_url:
        database_url = configured_database_url
    else:
        database_url = sqlite_default

    # Render/Heroku-style URLs use postgres:// ; normalize before driver detection.
    if database_url.startswith("postgres://"):
        database_url = "postgresql://" + database_url[len("postgres://") :]

    if database_url.startswith("sqlite://"):
        database_url = database_url.replace("sqlite://", "sqlite+aiosqlite://", 1)
    elif database_url.startswith("postgresql://"):
        database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    elif database_url.startswith("mysql://"):
        database_url = database_url.replace("mysql://", "mysql+aiomysql://", 1)
    else:
        database_url = database_url

    connect_args = {}
    if "sqlite" in database_url:
        connect_args["check_same_thread"] = False

    # PgBouncer (e.g. Supabase pooler, many managed Postgres URLs) in transaction or
    # statement mode breaks asyncpg prepared statements. Disable the cache whenever
    # we use asyncpg — set here so it still applies if query-string rewriting below fails.
    if "postgresql+asyncpg" in urlsplit(database_url).scheme:
        connect_args["statement_cache_size"] = 0

    try:
        split_result = urlsplit(database_url)
        query_params = parse_qsl(split_result.query, keep_blank_values=True)
        rewritten_query_params = []
        driver_scheme = split_result.scheme

        if "postgresql+asyncpg" in driver_scheme:
            has_prepared_statement_cache_setting = any(
                k.lower() == "prepared_statement_cache_size"
                for k, _ in query_params
            )
            if not has_prepared_statement_cache_setting:
                # SQLAlchemy also reads this URL option for the asyncpg dialect.
                rewritten_query_params.append(("prepared_statement_cache_size", "0"))

        for k, v in query_params:
            key_lower = k.lower()
            if key_lower == "sslmode" and "postgresql+asyncpg" in driver_scheme:
                if v.lower() != "disable" and "sqlite" not in database_url:
                    # For asyncpg, 'ssl' can be a boolean or an SSLContext
                    if v.lower() == "require":
                        connect_args["ssl"] = True
                    else:
                        connect_args["ssl"] = ssl.create_default_context()
                        # Often required for Supabase/Render to avoid certificate verification errors if not using custom CAs
                        connect_args["ssl"].check_hostname = False
                        connect_args["ssl"].verify_mode = ssl.CERT_NONE
                continue

            rewritten_query_params.append((k, v))

        database_url = urlunsplit(
            (
                split_result.scheme,
                split_result.netloc,
                split_result.path,
                urlencode(rewritten_query_params),
                split_result.fragment,
            )
        )
    except Exception:
        pass

    return database_url, connect_args
