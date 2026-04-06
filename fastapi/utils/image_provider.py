from enums.image_provider import ImageProvider
from utils.get_env import (
    get_disable_image_generation_env,
    get_image_provider_env,
)
from utils.parsers import parse_bool_or_none
import logging


logger = logging.getLogger(__name__)


IMAGE_PROVIDER_ALIASES: dict[str, ImageProvider] = {
    "dalle": ImageProvider.DALLE3,
    "dalle3": ImageProvider.DALLE3,
    "dall_e_3": ImageProvider.DALLE3,
    "dall-e-3": ImageProvider.DALLE3,
    "gpt_image_1_5": ImageProvider.GPT_IMAGE_1_5,
    "gpt-image-1.5": ImageProvider.GPT_IMAGE_1_5,
}


def is_image_generation_disabled() -> bool:
    return parse_bool_or_none(get_disable_image_generation_env()) or False


def is_pixels_selected() -> bool:
    return ImageProvider.PEXELS == get_selected_image_provider()


def is_pixabay_selected() -> bool:
    return ImageProvider.PIXABAY == get_selected_image_provider()


def is_gemini_flash_selected() -> bool:
    return ImageProvider.GEMINI_FLASH == get_selected_image_provider()


def is_nanobanana_pro_selected() -> bool:
    return ImageProvider.NANOBANANA_PRO == get_selected_image_provider()


def is_dalle3_selected() -> bool:
    return ImageProvider.DALLE3 == get_selected_image_provider()


def is_gpt_image_1_5_selected() -> bool:
    return ImageProvider.GPT_IMAGE_1_5 == get_selected_image_provider()


def is_comfyui_selected() -> bool:
    return ImageProvider.COMFYUI == get_selected_image_provider()


def get_selected_image_provider() -> ImageProvider | None:
    """
    Get the selected image provider from environment variables.
    Returns:
        ImageProvider: The selected image provider.
    """
    image_provider_env = get_image_provider_env()
    if image_provider_env:
        normalized_value = image_provider_env.strip().lower()
        if normalized_value in IMAGE_PROVIDER_ALIASES:
            return IMAGE_PROVIDER_ALIASES[normalized_value]

        try:
            return ImageProvider(normalized_value)
        except ValueError:
            logger.warning(
                "Unknown IMAGE_PROVIDER '%s'. Image generation will use fallback behavior.",
                image_provider_env,
            )
            return None
    return None
