from typing import List

from fastapi import APIRouter

# Icon search / RAG disabled — was: ICON_FINDER_SERVICE.search_icons
ICONS_ROUTER = APIRouter(prefix="/icons", tags=["Icons"])


@ICONS_ROUTER.get("/search", response_model=List[str])
async def search_icons(query: str, limit: int = 20):
    return []
