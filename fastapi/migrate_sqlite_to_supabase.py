import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
import os
import ssl
from dotenv import load_dotenv

load_dotenv()

async def main():
    sqlite_url = "sqlite+aiosqlite:///app_data/fastapi.db"
    
    pg_url = os.environ.get("DATABASE_URL")
    if not pg_url:
        print("DATABASE_URL not found in .env")
        return
        
    print(f"Found Postgres URL, preparing migration...")
        
    if pg_url.startswith("postgresql://"):
        pg_url = pg_url.replace("postgresql://", "postgresql+asyncpg://", 1)
        
    # Drop query params for clean base
    base_url = pg_url.split("?")[0]

    sqlite_engine = create_async_engine(sqlite_url)
    
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE

    pg_engine = create_async_engine(base_url, connect_args={"ssl": ssl_context})

    tables_to_migrate = [
        "markdown_presentations",
        "project_presentations",
        "project_presentation_revisions",
        "presentations",
        "slides"
    ]

    async with sqlite_engine.connect() as sqlite_conn:
        async with pg_engine.begin() as pg_conn:
            for table in tables_to_migrate:
                print(f"Migrating {table}...")
                try:
                    result = await sqlite_conn.execute(text(f"SELECT * FROM {table}"))
                    rows = result.mappings().all()

                    if not rows:
                        print(f" - {table} is empty")
                        continue

                    print(f" - Found {len(rows)} rows in {table}")
                    
                    columns = list(rows[0].keys())
                    col_str = ", ".join([f'"{c}"' for c in columns])
                    val_str = ", ".join([f":{c}" for c in columns])
                    
                    # On Postgres, ON CONFLICT DO NOTHING requires specifying conflict target IF it is DO UPDATE,
                    # but DO NOTHING can just be DO NOTHING. Wait! Actually ON CONFLICT DO NOTHING without target is only valid in Postgres.
                    insert_query = text(f"INSERT INTO {table} ({col_str}) VALUES ({val_str}) ON CONFLICT (id) DO NOTHING")
                    
                    import json
                    from datetime import datetime

                    def clean_val(col, val):
                        if col in ("is_draft", "is_favorite"):
                            return bool(val) if val is not None else None
                        if isinstance(val, str):
                            if len(val) >= 19 and val[4] == '-' and val[7] == '-' and val[10] in ('T', ' '):
                                try:
                                    return datetime.fromisoformat(val.replace(" ", "T"))
                                except ValueError:
                                    pass
                        return val
                    
                    data = [{k: clean_val(k, v) for k, v in row.items()} for row in rows]
                    await pg_conn.execute(insert_query, data)
                    print(f" - Uploaded {table}")

                except Exception as e:
                    print(f" - Error migrating {table}: {e}")

    print("Migration complete!")
    await sqlite_engine.dispose()
    await pg_engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
