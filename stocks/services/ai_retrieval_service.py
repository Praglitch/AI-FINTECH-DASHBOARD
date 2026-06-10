"""
Builds a context string for AI questions using intent-based retrieval.
Supports multi-intent detection (e.g., ownership + analysis together).
"""

from .intent_service import detect_intent
from .retrieval_registry import INTENT_SOURCES, fetch_sources


def build_context(question, fincode):
    """
    Returns a plain-text context string containing all relevant data
    for the given question and company.
    """
    question_lower = question.lower()

    # Define keyword groups for each intent (same as in intent_service)
    # This avoids import cycles and allows multi-intent detection.
    intent_keywords = {
        "deals": [
            "insider", "insider trading", "esop", "bulk deal", "bulk deals",
            "block deal", "block deals", "large trade", "institutional deal"
        ],
        "governance": [
            "director", "directors", "board", "board of directors", "chairman",
            "chairperson", "management", "ceo", "chief executive", "executive",
            "independent director", "md", "managing director"
        ],
        "ownership": [
            "promoter", "promoters", "shareholding", "holding pattern",
            "fii", "fpi", "mutual fund", "mutual funds", "mf",
            "institutional holding", "retail holding", "public holding", "ownership"
        ],
        "corporate": [
            "news", "announcement", "announcements", "corporate action", "corporate actions",
            "dividend", "bonus", "stock split", "split", "rights issue", "buyback",
            "latest", "recent", "update", "event", "filing", "bse filing",
            "board meeting", "outcome", "results", "financial results", "quarterly results",
            "meeting outcome", "sebi", "regulation", "filing"
        ],
        "market": [
            "price", "stock price", "share price", "market price",
            "pe", "p/e", "pe ratio", "market cap", "market capitalization",
            "52 week", "52-week", "all time high", "ath", "performance",
            "return", "rally", "fall", "volume", "turnover",
            "ohlc", "open", "high", "low", "close", "candlestick", "candle"
        ],
        "analysis": [
            "analyze", "analysis", "invest", "investment", "buy", "sell", "hold",
            "good company", "good stock", "worth buying", "risk", "risks",
            "positive", "positives", "negative", "negatives", "outlook", "future",
            "long term", "short term", "investment thesis"
        ]
    }

    # Collect all intents that match the question
    matched_intents = set()
    for intent, keywords in intent_keywords.items():
        if any(kw in question_lower for kw in keywords):
            matched_intents.add(intent)

    # If no specific intent, fallback to analysis (default)
    if not matched_intents:
        matched_intents.add("analysis")

    print(f"Matched intents: {matched_intents}")

    # Merge source keys from all matched intents (union, no duplicates)
    all_source_keys = set()
    for intent in matched_intents:
        keys = INTENT_SOURCES.get(intent, INTENT_SOURCES.get("analysis", []))
        all_source_keys.update(keys)

    print(f"Combined sources: {all_source_keys}")

    # Fetch data using the combined source keys
    fetched = fetch_sources(fincode, list(all_source_keys), question)

    # Build context parts
    context_parts = []
    for source_name, data in fetched:
        label = source_name.replace("_", " ").title()
        context_parts.append(f"{label}: {data}")

    print(f"CONTEXT LENGTH: {len(context_parts)}")
    for part in context_parts[:3]:
        print(part[:100])

    return "\n\n".join(context_parts)