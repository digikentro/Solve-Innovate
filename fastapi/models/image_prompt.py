from typing import Literal, Optional
from pydantic import BaseModel


class ImagePrompt(BaseModel):
    prompt: str
    theme_prompt: Optional[str] = None
    image_source: Optional[Literal["ai", "stock", "none"]] = None
    image_model: Optional[str] = None

    def get_image_prompt(self, with_theme: bool = False) -> str:
        return f"{self.prompt}, {self.theme_prompt}" if with_theme else self.prompt
