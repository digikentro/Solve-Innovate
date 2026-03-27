from api.v1.ppt.endpoints.markdown_presentation import (
    _normalize_generated_slides,
    _split_markdown_slides,
)
from utils.llm_calls.generate_markdown_slides import get_markdown_generation_messages


def test_prompt_is_target_aware_and_capacity_bound():
    messages = get_markdown_generation_messages(
        content="Project content",
        n_slides=9,
        language="English",
        tone="professional",
        verbosity="concise",
        text_mode="condense",
    )

    system_prompt = messages[0].content.lower()
    user_prompt = messages[1].content.lower()
    merged = f"{system_prompt}\n{user_prompt}"

    assert "exactly 16" not in merged
    assert "target slide count: 9" in user_prompt
    assert "max bullets" in user_prompt
    assert "max table rows" in user_prompt


def test_single_slide_scope_contract_is_enforced_in_prompt():
    messages = get_markdown_generation_messages(
        content="Regenerate this slide only.",
        n_slides=1,
        language="English",
        tone="professional",
        verbosity="concise",
        text_mode="condense",
        generation_scope="single_slide",
    )
    user_prompt = messages[1].content.lower()
    assert "scope: single_slide" in user_prompt
    assert "output exactly one slide body" in user_prompt
    assert "do not emit `---` separators" in user_prompt


def test_separator_parsing_and_capacity_normalization():
    split_raw = (
        "# Slide A\nA body line\n \n --- \n\n"
        "## Slide B\nB body line\n\n\t---\n"
        "# Slide C\nC body line"
    )
    parsed = _split_markdown_slides(split_raw)
    assert len(parsed) == 3
    assert parsed[0].startswith("# Slide A")
    assert parsed[1].startswith("## Slide B")
    assert parsed[2].startswith("# Slide C")

    bullets = "\n".join(
        [f"- Bullet item {idx} contains enough text to force splitting behavior." for idx in range(1, 15)]
    )
    table_rows = "\n".join([f"| Metric {idx} | Value {idx} |" for idx in range(1, 16)])
    dense_slide = (
        "# Dense Evidence\n\n"
        f"{bullets}\n\n"
        "| Name | Value |\n"
        "| --- | --- |\n"
        f"{table_rows}\n"
    )

    normalized = _normalize_generated_slides([dense_slide], "concise")
    assert len(normalized) > 1
    assert any("(cont.)" in slide for slide in normalized[1:])
    merged = "\n".join(normalized)
    assert "Metric 15" in merged
    assert "Bullet item 14" in merged
