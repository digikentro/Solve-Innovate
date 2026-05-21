from typing import Optional
from models.llm_message import LLMSystemMessage, LLMUserMessage
from models.presentation_layout import PresentationLayoutModel
from models.presentation_outline_model import PresentationOutlineModel
from services.llm_client import LLMClient
from utils.llm_client_error_handler import handle_llm_client_exceptions
from utils.llm_provider import get_model
from utils.get_dynamic_models import get_presentation_structure_model_with_n_slides
from models.presentation_structure_model import PresentationStructureModel


def get_messages(
    presentation_layout: PresentationLayoutModel,
    n_slides: int,
    data: str,
    instructions: Optional[str] = None,
):
    return [
        LLMSystemMessage(
            content=f"""
                You're a professional presentation designer with creative freedom to design engaging presentations.

                {presentation_layout.to_string()}

                # DESIGN PHILOSOPHY
                - Create visually compelling and varied presentations
                - Match layout to content purpose and audience needs
                - Prioritize engagement over rigid formatting rules

                # STEP 1: Semantic Role Detection
                Before selecting a layout, infer the **semantic role** of each slide from its outline content.
                Common semantic roles and what to look for in the outline:

                | Semantic Role       | Outline Signals                                                        |
                |---------------------|------------------------------------------------------------------------|
                | cover               | First slide, presentation title, subtitle, author/presenter name       |
                | table_of_contents   | Agenda, overview, list of topics, section list                         |
                | key_insight         | A single bold statement, big idea, thesis, takeaway                    |
                | data_heavy          | Percentages, metrics, KPIs, numbers, statistics, measurements          |
                | chart_visual        | Trends over time, comparisons of quantities, distributions             |
                | persona_cards       | Named people, user profiles, team members, stakeholders                |
                | journey_map         | Stages, steps, phases, timeline, process flow, milestones              |
                | comparison          | Before/after, pros/cons, Option A vs B, old vs new                     |
                | quote               | Direct quotation, testimonial, cited statement                         |
                | list_detail         | Bullet points, feature lists, enumerated items with descriptions       |
                | table_data          | Structured rows/columns, matrix, tabular information                   |
                | image_narrative     | Story with visual, concept illustration, visual metaphor               |
                | closing             | Thank you, next steps, contact info, Q&A, call to action               |

                # STEP 2: Layout Matching Strategy
                After determining each slide's semantic role, match it to the BEST available layout using these rules:

                1. **cover** → Choose a layout whose name/description mentions "intro", "title", or "cover"
                2. **table_of_contents** → Choose a layout with "table of contents", "agenda", or "index"
                3. **data_heavy** → Choose a layout with "metrics", "KPI", "numbers", "stats", or "metric cards"
                4. **chart_visual** → Choose a layout with "chart", "graph", or "donut" in the name/description
                5. **persona_cards** → Choose a layout with "team", "members", "person", "photo", or "contact"
                6. **journey_map** → Choose a layout with "timeline", "process", "steps", "numbered", or "stages"
                7. **comparison** → Choose a layout with "comparison", "dual", "two column", "two section", or "side by side"
                8. **quote** → Choose a layout with "quote" in the name/description
                9. **list_detail** → Choose a layout with "bullet", "list", "icon" and text descriptions
                10. **table_data** → Choose a layout with "table" in the name/description
                11. **image_narrative** → Choose a layout with "image" and "description" in the name/description
                12. **closing** → Choose a layout with "thank you", "contact", "conclusion", or "closing"
                13. **key_insight** → Choose a layout with "emphasis", "highlight", "headline", or a simple text + description layout

                If multiple layouts match a semantic role, prefer the one whose description most closely aligns with the slide's specific content (e.g., a data-heavy slide with 8 metrics → prefer a grid/snapshot metrics layout over a simple 3-metric layout).

                # STEP 3: Visual Variety & Flow
                After initial mapping, review the full sequence and adjust:
                - **Avoid repeating** the same layout index for consecutive slides unless the content truly demands it
                - Create a **natural visual rhythm** — alternate between text-heavy and visual-heavy layouts
                - The **first slide** should almost always use the cover/intro layout
                - The **last slide** should use a closing/thank-you layout when the content suggests it
                - If no layout strongly matches a role, choose the layout that provides the best visual contrast with adjacent slides

                {"# User Instruction:" if instructions else ""}
                {instructions or ""}

                User instruction should be taken into account while creating the presentation structure, except for number of slides.

                Select layout index for each of the {n_slides} slides based on what will best serve the presentation's goals.
            """,
        ),
        LLMUserMessage(
            content=f"""
                {data}
            """,
        ),
    ]


def get_messages_for_slides_markdown(
    presentation_layout: PresentationLayoutModel,
    n_slides: int,
    data: str,
    instructions: Optional[str] = None,
):
    return [
        LLMSystemMessage(
            content=f"""
                You're a professional presentation designer with creative freedom to design engaging presentations.

                {"# User Instruction:" if instructions else ""}
                {instructions or ""}

                {presentation_layout.to_string()}

                # STEP 1: Semantic Role Detection
                For each slide, infer its **semantic role** from the content:
                - cover → title/intro slide | table_of_contents → agenda/topics | data_heavy → metrics/KPIs/numbers
                - chart_visual → trends/distributions | persona_cards → people/team | journey_map → timeline/stages/steps
                - comparison → before/after/vs | quote → quotation/testimonial | list_detail → bullet points/features
                - table_data → tabular info | image_narrative → visual story | closing → thank you/contact/CTA
                - key_insight → bold statement/takeaway

                # STEP 2: Layout Matching
                Match each semantic role to the best available layout by scanning layout names/descriptions:
                - cover → "intro"/"title" | table_of_contents → "table of contents"/"agenda"
                - data_heavy → "metrics"/"KPI"/"numbers" | chart_visual → "chart"/"graph"/"donut"
                - persona_cards → "team"/"members"/"photo" | journey_map → "timeline"/"process"/"steps"
                - comparison → "comparison"/"dual"/"two column" | quote → "quote"
                - list_detail → "bullet"/"list"/"icon" | table_data → "table"
                - image_narrative → "image"/"description" | closing → "thank you"/"contact"/"conclusion"
                - key_insight → "emphasis"/"highlight"/"headline"

                # STEP 3: Visual Variety
                - Avoid repeating the same layout for consecutive slides
                - First slide → cover/intro layout; Last slide → closing layout when appropriate
                - Alternate text-heavy and visual-heavy layouts for rhythm

                User instruction should be taken into account while creating the presentation structure, except for number of slides.

                Select layout index for each of the {n_slides} slides based on what will best serve the presentation's goals.
            """,
        ),
        LLMUserMessage(
            content=f"""
                {data}
            """,
        ),
    ]


async def generate_presentation_structure(
    presentation_outline: PresentationOutlineModel,
    presentation_layout: PresentationLayoutModel,
    instructions: Optional[str] = None,
    using_slides_markdown: bool = False,
) -> PresentationStructureModel:

    client = LLMClient()
    model = get_model()
    response_model = get_presentation_structure_model_with_n_slides(
        len(presentation_outline.slides)
    )

    try:
        response = await client.generate_structured(
            model=model,
            messages=(
                get_messages_for_slides_markdown(
                    presentation_layout,
                    len(presentation_outline.slides),
                    presentation_outline.to_string(),
                    instructions,
                )
                if using_slides_markdown
                else get_messages(
                    presentation_layout,
                    len(presentation_outline.slides),
                    presentation_outline.to_string(),
                    instructions,
                )
            ),
            response_format=response_model.model_json_schema(),
            strict=True,
        )
        return PresentationStructureModel(**response)
    except Exception as e:
        raise handle_llm_client_exceptions(e)
