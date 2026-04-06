import os

from enums.image_provider import ImageProvider
from utils.image_provider import get_selected_image_provider


def test_get_selected_image_provider_accepts_legacy_dalle_alias():
    old_value = os.environ.get("IMAGE_PROVIDER")
    os.environ["IMAGE_PROVIDER"] = "dalle"
    try:
        assert get_selected_image_provider() == ImageProvider.DALLE3
    finally:
        if old_value is None:
            os.environ.pop("IMAGE_PROVIDER", None)
        else:
            os.environ["IMAGE_PROVIDER"] = old_value


def test_get_selected_image_provider_returns_none_for_unknown_value():
    old_value = os.environ.get("IMAGE_PROVIDER")
    os.environ["IMAGE_PROVIDER"] = "not-a-provider"
    try:
        assert get_selected_image_provider() is None
    finally:
        if old_value is None:
            os.environ.pop("IMAGE_PROVIDER", None)
        else:
            os.environ["IMAGE_PROVIDER"] = old_value
