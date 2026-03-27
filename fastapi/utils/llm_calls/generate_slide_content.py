from datetime import datetime
from typing import Optional
from models.llm_message import LLMSystemMessage, LLMUserMessage
from models.presentation_layout import SlideLayoutModel
from models.presentation_outline_model import SlideOutlineModel
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
        Generate structured slide based on provided outline, follow mentioned steps and notes and provide structured output.

        {"# User Instructions:" if instructions else ""}
        {instructions or ""}

        {"# Tone:" if tone else ""}
        {tone or ""}

        {"# Verbosity:" if verbosity else ""}
        {verbosity or ""}

        # Content Fidelity Rules (MUST follow)
        - Exact percentages from the source material must be preserved verbatim — never round, truncate, or approximate (e.g., 73.2% stays 73.2%, not ~73% or "about three-quarters").
        - Named people, personas, or extreme users must appear with their exact names as given in the outline (e.g., "Maria, the night-shift nurse" not "a healthcare worker").
        - Verbatim quotes from the source must be reproduced exactly, enclosed in quotation marks, with attribution.
        - Named frameworks (e.g., B=MAP, MECE, Pareto, Jobs-to-be-Done) must be referenced by their exact name — never paraphrase as "a behavioral framework" or "a prioritization method".
        - Stage numbers and stage names must always appear together (e.g., "Stage 3: Prototype" not just "Prototype" or "Stage 3").
        - Never write filler openings like "This slide explores…", "In this section we…", "Let's look at…", or "Here we discuss…". Start directly with the substance.

        # Steps
        1. Analyze the outline.
        2. Generate structured slide based on the outline.
        3. Generate speaker note that is simple, clear, concise and to the point.

        # Notes
        - Slide body should not use words like "This slide", "This presentation".
        - Rephrase the slide body to make it flow naturally.
        - Only use markdown to highlight important points.
        - Make sure to follow language guidelines.
        - Speaker note should be normal text, not markdown.
        - Strictly follow the max and min character limit for every property in the slide.
        - Never ever go over the max character limit. Limit your narration to make sure you never go over the max character limit.
        - Number of items should not be more than max number of items specified in slide schema. If you have to put multiple points then merge them to obey max numebr of items.
        - Generate content as per the given tone.
        - Be very careful with number of words to generate for given field. As generating more than max characters will overflow in the design. So, analyze early and never generate more characters than allowed.
        - Do not add emoji in the content.
        - Metrics should be in abbreviated form with least possible characters. Do not add long sequence of words for metrics.
        - For verbosity (text density rules — follow strictly):
            - If verbosity is 'minimal':
                * Maximum 3 bullet points per slide.
                * Headlines only — no body paragraphs, no sub-bullets.
                * Use the shortest possible phrasing; aim for ≤ 6 words per bullet.
                * Prefer charts, callout numbers, or single metrics over text.
                * Generate description at 1/5 or lower of the max character limit.
            - If verbosity is 'concise':
                * Maximum 5 bullet points per slide.
                * One short body sentence allowed (1 sentence max).
                * Prefer charts and callout numbers to convey data.
                * Generate description at 1/3 or lower of the max character limit. It is OK to omit secondary details.
            - If verbosity is 'standard' (default):
                * Up to 8 bullet points per slide.
                * Short paragraphs allowed (2-3 sentences each).
                * Every data point from the outline must appear — do not omit any.
                * Generate description at 2/3 of the max character limit.
            - If verbosity is 'text-heavy':
                * Full explanations with all concepts, data points, and quotes included.
                * Sub-bullets are allowed for detailed breakdowns.
                * Tables are preferred for dense lists or comparisons.
                * Every concept, data point, and quote from the outline must be present.
                * Generate description at 3/4 or higher of the max character limit. Must not exceed the max character limit.

        User instructions, tone and verbosity should always be followed and should supercede any other instruction, except for max and min character limit, slide schema and number of items.

        - Provide output in json format and **don't include <parameters> tags**.

        # Image and Icon Output Format
        image: {{
            __image_prompt__: string,
        }}
        icon: {{
            __icon_query__: string,
        }}

    """


def get_user_prompt(outline: str, language: str):
    return f"""
        ## Current Date and Time
        {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}

        ## Icon Query And Image Prompt Language
        English

        ## Slide Content Language
        {language}

        ## Slide Outline
        {outline}
    """


def get_messages(
    outline: str,
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
            content=get_user_prompt(outline, language),
        ),
    ]


async def get_slide_content_from_type_and_outline(
    slide_layout: SlideLayoutModel,
    outline: SlideOutlineModel,
    language: str,
    tone: Optional[str] = None,
    verbosity: Optional[str] = None,
    instructions: Optional[str] = None,
):
    client = LLMClient()
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

    try:
        response = await client.generate_structured(
            model=model,
            messages=get_messages(
                outline.content,
                language,
                tone,
                verbosity,
                instructions,
            ),
            response_format=response_schema,
            strict=False,
        )
        return response

    except Exception as e:
        raise handle_llm_client_exceptions(e)
