from utils.llm_calls.generate_markdown_slides import get_markdown_generation_messages


def test_spatial_prompt_contains_density_and_layout_hardening():
    messages = get_markdown_generation_messages(
        content="Project content",
        n_slides=9,
        language="English",
        tone="professional",
        density="Concise",
        visual_preference="Data-Heavy",
        include_images=True,
        include_charts=True,
        quantitative_datasets=[{"source": "research_data", "data": [{"label": "A", "value": 32}]}],
    )

    system_prompt = messages[0].content.lower()
    user_prompt = messages[1].content.lower()
    merged = f"{system_prompt}\n{user_prompt}"

    assert "valid json only" in merged
    assert "target slide count: 9" in user_prompt
    assert "if density is 'concise', text blocks may contain at most 4 bullets" in user_prompt
    assert "do not overlap blocks" in user_prompt
    assert "quantitative datasets" in user_prompt


def test_spatial_prompt_contains_visual_constraints():
    messages = get_markdown_generation_messages(
        content="Source",
        n_slides=4,
        language="English",
        tone="executive",
        density="Standard",
        visual_preference="Visual-Hero",
    )
    merged = f"{messages[0].content.lower()}\n{messages[1].content.lower()}"
    assert "spatial json" in merged
    assert "x and y" in merged
    assert "visual preference" in merged
