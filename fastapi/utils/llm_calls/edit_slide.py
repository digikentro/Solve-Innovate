from datetime import datetime
from typing import Optional
from models.llm_message import LLMSystemMessage, LLMUserMessage
from models.presentation_layout import SlideLayoutModel
from models.sql.slide import SlideModel
from services.llm_client import LLMClient
from utils.llm_client_error_handler import handle_llm_client_exceptions
from utils.llm_provider import get_model
from utils.schema_utils import add_field_in_schema, remove_fields_from_schema


def get_system_prompt(
    tone: Optional[str] = None,
    verbosity: Optional[str] = None,
    instructions: Optional[str] = None,
):
    return f"""
    Edit Slide data and speaker note based on provided prompt, follow mentioned steps and notes and provide structured output.

    {"# User Instruction:" if instructions else ""}
    {instructions or ""}

    {"# Tone:" if tone else ""}
    {tone or ""}

    {"# Verbosity:" if verbosity else ""}
    {verbosity or ""}

    # Content Fidelity Rules (MUST follow)
    - Exact percentages from the source material must be preserved verbatim — never round, truncate, or approximate (e.g., 73.2% stays 73.2%, not ~73% or "about three-quarters").
    - Named people, personas, or extreme users must appear with their exact names as given in the slide data (e.g., "Maria, the night-shift nurse" not "a healthcare worker").
    - Verbatim quotes from the source must be reproduced exactly, enclosed in quotation marks, with attribution.
    - Named frameworks (e.g., B=MAP, MECE, Pareto, Jobs-to-be-Done) must be referenced by their exact name — never paraphrase as "a behavioral framework" or "a prioritization method".
    - Stage numbers and stage names must always appear together (e.g., "Stage 3: Prototype" not just "Prototype" or "Stage 3").
    - Never write filler openings like "This slide explores…", "In this section we…", "Let's look at…", or "Here we discuss…". Start directly with the substance.

    # Notes
    - Provide output in language mentioned in **Input**.
    - The goal is to change Slide data based on the provided prompt.
    - Do not change **Image prompts** and **Icon queries** if not asked for in prompt.
    - Generate **Image prompts** and **Icon queries** if asked to generate or change in prompt.
    - Make sure to follow language guidelines.
    - Speaker note should be normal text, not markdown.
    - Speaker note should be simple, clear, concise and to the point.
    - For verbosity (text density rules — follow strictly):
        - If verbosity is 'minimal':
            * Maximum 3 bullet points per slide. Headlines only — no body paragraphs.
            * Use the shortest possible phrasing; aim for ≤ 6 words per bullet.
        - If verbosity is 'concise':
            * Maximum 5 bullet points per slide. One short body sentence allowed.
            * Prefer charts and callout numbers over text.
        - If verbosity is 'standard' (default):
            * Up to 8 bullet points per slide. Short paragraphs (2-3 sentences).
            * Every data point from the slide content must appear.
        - If verbosity is 'text-heavy':
            * Full explanations with all concepts, data points, and quotes.
            * Sub-bullets allowed. Tables preferred for dense lists.

    **Go through all notes and steps and make sure they are followed, including mentioned constraints**
    """


def get_user_prompt(prompt: str, slide_data: dict, language: str):
    return f"""
        ## Icon Query And Image Prompt Language
        English

        ## Current Date and Time
        {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}

        ## Slide Content Language
        {language}

        ## Prompt
        {prompt}

        ## Slide data
        {slide_data}
    """


def get_messages(
    prompt: str,
    slide_data: dict,
    language: str,
    tone: Optional[str] = None,
    verbosity: Optional[str] = None,
    instructions: Optional[str] = None,
):
    return [
        LLMSystemMessage(
            content=get_system_prompt(tone, verbosity, instructions),
        ),
        LLMUserMessage(
            content=get_user_prompt(prompt, slide_data, language),
        ),
    ]


async def get_edited_slide_content(
    prompt: str,
    slide: SlideModel,
    language: str,
    slide_layout: SlideLayoutModel,
    tone: Optional[str] = None,
    verbosity: Optional[str] = None,
    instructions: Optional[str] = None,
):
    model = get_model()

    response_schema = remove_fields_from_schema(
        slide_layout.json_schema, ["__image_url__", "__icon_url__"]
    )
    response_schema = add_field_in_schema(
        response_schema,
        {
            "__speaker_note__": {
                "type": "string",
                "minLength": 100,
                "maxLength": 250,
                "description": "Speaker note for the slide",
            }
        },
        True,
    )

    client = LLMClient()
    try:
        response = await client.generate_structured(
            model=model,
            messages=get_messages(
                prompt, slide.content, language, tone, verbosity, instructions
            ),
            response_format=response_schema,
            strict=False,
        )
        return response

    except Exception as e:
        raise handle_llm_client_exceptions(e)
