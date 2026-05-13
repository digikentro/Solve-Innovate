import os
import logging
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from api.lifespan import app_lifespan
from api.middlewares import RequestLoggingMiddleware, UserConfigEnvUpdateMiddleware
from api.v1.ppt.router import API_V1_PPT_ROUTER
from api.v1.webhook.router import API_V1_WEBHOOK_ROUTER
from api.v1.mock.router import API_V1_MOCK_ROUTER


def _cors_allow_origins() -> list[str]:
    extra = os.getenv("CORS_ALLOWED_ORIGINS", "").strip()
    if extra:
        return [o.strip() for o in extra.split(",") if o.strip()]
    origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
        "https://solve-innovate.onrender.com",
        "https://solve-innovate-v3.onrender.com",
    ]
    for key in (
        "FRONTEND_URL",
        "RENDER_EXTERNAL_URL",
        "RENDER_FRONTEND_URL",
        "VITE_FRONTEND_URL",
        "VERCEL_URL",
        "VERCEL_BRANCH_URL",
    ):
        host = os.getenv(key)
        if not host:
            continue
        host = host.strip()
        if not host.startswith("http"):
            host = f"https://{host}"
        origins.append(host.rstrip("/"))
    return list(dict.fromkeys(origins))


logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO").upper(),
    format="%(levelname)s %(name)s - %(message)s",
)

app = FastAPI(lifespan=app_lifespan)


# Routers
app.include_router(API_V1_PPT_ROUTER)
app.include_router(API_V1_WEBHOOK_ROUTER)
app.include_router(API_V1_MOCK_ROUTER)

# Mount static directory for icons, placeholder images, etc.
static_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static")
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Mount app_data directory as static files (for images, exports, etc.)
app_data_dir = os.environ.get("APP_DATA_DIRECTORY")
if app_data_dir and os.path.exists(app_data_dir):
    app.mount("/app_data", StaticFiles(directory=app_data_dir), name="app_data")

# Middlewares
origins = _cors_allow_origins()

# Register app-specific middleware first; CORS should be the outermost layer
# so error responses also include Access-Control headers.
app.add_middleware(UserConfigEnvUpdateMiddleware)
app.add_middleware(RequestLoggingMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)
