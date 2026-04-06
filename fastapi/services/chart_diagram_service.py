"""
chart_diagram_service.py

Config-driven service for injecting charts and diagrams into presentation slides.
"""

from enum import Enum
from typing import List, Dict, Any, Optional
import random


class ChartType(str, Enum):
    BAR = "bar"
    LINE = "line"
    PIE = "pie"
    AREA = "area"
    SCATTER = "scatter"


class DiagramType(str, Enum):
    PROCESS_FLOW = "process_flow"
    TIMELINE = "timeline"
    MATRIX = "matrix"
    ORG_CHART = "org_chart"
    FLOWCHART = "flowchart"


class ChartDiagramService:
    """Service for generating and injecting chart/diagram blocks into slides."""

    @staticmethod
    def get_chart_templates(chart_type: ChartType) -> Dict[str, Any]:
        """Return sample chart data based on type."""
        if chart_type == ChartType.BAR:
            return {
                "type": "chart",
                "chartType": "bar",
                "data": {
                    "headers": ["Category", "Value"],
                    "rows": [["Q1", "45"], ["Q2", "67"], ["Q3", "52"], ["Q4", "78"]],
                },
            }
        elif chart_type == ChartType.LINE:
            return {
                "type": "chart",
                "chartType": "line",
                "data": {
                    "headers": ["Month", "Growth"],
                    "rows": [["Jan", "20"], ["Feb", "35"], ["Mar", "45"], ["Apr", "60"]],
                },
            }
        elif chart_type == ChartType.PIE:
            return {
                "type": "chart",
                "chartType": "pie",
                "data": {
                    "headers": ["Segment", "Share"],
                    "rows": [["A", "30"], ["B", "25"], ["C", "20"], ["D", "25"]],
                },
            }
        elif chart_type == ChartType.AREA:
            return {
                "type": "chart",
                "chartType": "area",
                "data": {
                    "headers": ["Period", "Revenue"],
                    "rows": [["P1", "100"], ["P2", "150"], ["P3", "120"], ["P4", "180"]],
                },
            }
        elif chart_type == ChartType.SCATTER:
            return {
                "type": "chart",
                "chartType": "scatter",
                "data": {
                    "headers": ["X", "Y"],
                    "rows": [["10", "20"], ["20", "35"], ["30", "25"], ["40", "45"]],
                },
            }
        return {}

    @staticmethod
    def get_diagram_templates(diagram_type: DiagramType) -> Dict[str, Any]:
        """Return sample diagram data based on type."""
        if diagram_type == DiagramType.PROCESS_FLOW:
            return {
                "type": "diagram",
                "diagramType": "process_flow",
                "steps": ["Step 1: Analysis", "Step 2: Design", "Step 3: Implementation"],
            }
        elif diagram_type == DiagramType.TIMELINE:
            return {
                "type": "diagram",
                "diagramType": "timeline",
                "events": [
                    {"date": "Q1", "label": "Launch"},
                    {"date": "Q2", "label": "Growth"},
                    {"date": "Q3", "label": "Scale"},
                ],
            }
        elif diagram_type == DiagramType.MATRIX:
            return {
                "type": "diagram",
                "diagramType": "matrix",
                "quadrants": ["High/High", "High/Low", "Low/High", "Low/Low"],
            }
        elif diagram_type == DiagramType.ORG_CHART:
            return {
                "type": "diagram",
                "diagramType": "org_chart",
                "hierarchy": ["CEO", "VP Sales", "VP Eng", "Manager", "Team"],
            }
        elif diagram_type == DiagramType.FLOWCHART:
            return {
                "type": "diagram",
                "diagramType": "flowchart",
                "nodes": ["Start", "Process", "Decision", "End"],
            }
        return {}

    @staticmethod
    def should_inject_visual(
        slide_index: int, frequency: int, total_slides: int
    ) -> bool:
        """Determine if a visual should be injected based on frequency."""
        if frequency <= 0:
            return False
        # Inject on every Nth slide, but not on first or last slide
        if slide_index == 0 or slide_index >= total_slides - 1:
            return False
        return (slide_index % frequency) == 0

    @staticmethod
    def inject_chart_into_slide(
        slide_markdown: str,
        slide_index: int,
        chart_types: List[str],
        chart_frequency: int,
        total_slides: int,
    ) -> tuple[str, Optional[Dict[str, Any]]]:
        """
        Inject a chart block into the slide if conditions are met.
        Returns (markdown, chart_block or None)
        """
        if not chart_types or chart_frequency <= 0:
            return slide_markdown, None

        if not ChartDiagramService.should_inject_visual(
            slide_index, chart_frequency, total_slides
        ):
            return slide_markdown, None

        # Pick a random chart type from allowed types
        valid_types = [ct for ct in chart_types if ct in [e.value for e in ChartType]]
        if not valid_types:
            return slide_markdown, None

        chosen_type = random.choice(valid_types)
        chart_block = ChartDiagramService.get_chart_templates(ChartType(chosen_type))

        # Append chart markdown to slide
        chart_md = f"\n\n:::chart[type={chosen_type}]\n"
        headers = chart_block["data"]["headers"]
        rows = chart_block["data"]["rows"]
        chart_md += "| " + " | ".join(headers) + " |\n"
        chart_md += "| " + " | ".join(["---"] * len(headers)) + " |\n"
        for row in rows:
            chart_md += "| " + " | ".join(row) + " |\n"
        chart_md += ":::\n"

        return slide_markdown + chart_md, chart_block

    @staticmethod
    def inject_diagram_into_slide(
        slide_markdown: str,
        slide_index: int,
        diagram_types: List[str],
        diagram_frequency: int,
        total_slides: int,
    ) -> tuple[str, Optional[Dict[str, Any]]]:
        """
        Inject a diagram block into the slide if conditions are met.
        Returns (markdown, diagram_block or None)
        """
        if not diagram_types or diagram_frequency <= 0:
            return slide_markdown, None

        if not ChartDiagramService.should_inject_visual(
            slide_index, diagram_frequency, total_slides
        ):
            return slide_markdown, None

        # Pick a random diagram type from allowed types
        valid_types = [
            dt for dt in diagram_types if dt in [e.value for e in DiagramType]
        ]
        if not valid_types:
            return slide_markdown, None

        chosen_type = random.choice(valid_types)
        diagram_block = ChartDiagramService.get_diagram_templates(
            DiagramType(chosen_type)
        )

        # Append diagram markdown placeholder
        diagram_md = f"\n\n:::diagram[type={chosen_type}]\n:::\n"

        return slide_markdown + diagram_md, diagram_block

    @staticmethod
    def inject_visuals_into_slide(
        slide_markdown: str,
        slide_index: int,
        total_slides: int,
        config: Dict[str, Any],
    ) -> tuple[str, List[Dict[str, Any]]]:
        """
        Inject both charts and diagrams into a slide based on config.
        Returns (updated_markdown, list_of_injected_blocks)
        """
        injected_blocks = []
        updated_md = slide_markdown

        # Inject chart if enabled
        if config.get("chart_enabled", False):
            chart_types = config.get("chart_types", [])
            chart_freq = config.get("chart_frequency", 3)
            updated_md, chart_block = ChartDiagramService.inject_chart_into_slide(
                updated_md, slide_index, chart_types, chart_freq, total_slides
            )
            if chart_block:
                injected_blocks.append(chart_block)

        # Inject diagram if enabled
        if config.get("diagram_enabled", False):
            diagram_types = config.get("diagram_types", [])
            diagram_freq = config.get("diagram_frequency", 4)
            updated_md, diagram_block = ChartDiagramService.inject_diagram_into_slide(
                updated_md, slide_index, diagram_types, diagram_freq, total_slides
            )
            if diagram_block:
                injected_blocks.append(diagram_block)

        return updated_md, injected_blocks
