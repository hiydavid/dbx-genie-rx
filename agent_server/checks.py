"""Checklist item definitions for Genie Space configuration validation.

All checklist items are defined in docs/checklist-by-schema.md and parsed at runtime.
All evaluations are performed by the LLM.
"""

from agent_server.checklist_parser import (
    get_checklist_items_for_section,
    get_checklist_items,
    RECOGNIZED_SECTIONS,
)


def get_llm_checklist_items_for_section(section_name: str) -> list[dict]:
    """Get the checklist items for a given section.

    All items are LLM-evaluated. Items are parsed from docs/checklist-by-schema.md.

    Args:
        section_name: Name of the section (e.g., "data_sources.tables")

    Returns:
        List of dicts with 'id' and 'description' for each item
    """
    return get_checklist_items_for_section(section_name)


def get_all_sections() -> list[str]:
    """Get all recognized section names.

    Returns:
        List of section names that can be analyzed
    """
    return sorted(RECOGNIZED_SECTIONS)


__all__ = [
    "get_llm_checklist_items_for_section",
    "get_all_sections",
    "get_checklist_items",
    "RECOGNIZED_SECTIONS",
]
