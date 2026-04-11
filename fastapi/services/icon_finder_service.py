"""
Icon search is disabled. Endpoints and slide pipelines use `/static/icons/placeholder.svg`.
Re-implement search_icons here if you add icons back.
"""


class IconFinderService:
    async def search_icons(self, query: str, k: int = 1) -> list[str]:
        return []


ICON_FINDER_SERVICE = IconFinderService()
