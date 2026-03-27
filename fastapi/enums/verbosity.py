from enum import Enum


class Verbosity(str, Enum):
    MINIMAL = "minimal"
    CONCISE = "concise"
    STANDARD = "standard"
    TEXT_HEAVY = "text-heavy"

