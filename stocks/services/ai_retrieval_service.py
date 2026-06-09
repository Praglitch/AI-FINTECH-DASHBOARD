
"""
Builds a context string for AI questions using intent-based retrieval.
"""

from .intent_service import detect_intent
from .retrieval_registry import INTENT_SOURCES, fetch_sources


def build_context(question, fincode):
    """
    Returns a plain-text context string containing all relevant data
    for the given question and company.
    """

    question_lower = question.lower()

    # Detect intent
    intent = detect_intent(question_lower)

    print(f"INTENT: {intent}")

    # Get sources for intent
    source_keys = INTENT_SOURCES.get(
        intent,
        INTENT_SOURCES.get("analysis", [])
    )

    print(f"SOURCES TO FETCH: {source_keys}")

    # Fetch data
    fetched = fetch_sources(
    fincode,
    source_keys,
    question
)

    # Build context
    context_parts = []

    for source_name, data in fetched:

        label = source_name.replace(
            "_",
            " "
        ).title()

        context_parts.append(
            f"{label}: {data}"
        )

    print(
        f"CONTEXT LENGTH: {len(context_parts)}"
    )

    for part in context_parts[:3]:
        print(part[:100])

    return "\n\n".join(context_parts)

