
def detect_intent(question):
    """
    Returns one of:
    - analysis
    - governance
    - ownership
    - market
    - corporate
    - deals
    """

    q = question.lower()

    # --------------------------------------------------
    # DEALS
    # --------------------------------------------------
    deals_keywords = [
        "insider",
        "insider trading",
        "esop",
        "bulk deal",
        "bulk deals",
        "block deal",
        "block deals",
        "large trade",
        "institutional deal",
    ]

    if any(word in q for word in deals_keywords):
        return "deals"
    
    
    # --------------------------------------------------
    # BOARD MEETING / RESULTS / FILINGS
    # --------------------------------------------------

    meeting_keywords = [
        "board meeting",
        "outcome",
        "meeting outcome",
        "financial results",
        "quarterly results",
        "results",
        "sebi",
        "filing",
    ]

    if any(word in q for word in meeting_keywords):
        return "corporate"

    # --------------------------------------------------
    # GOVERNANCE
    # --------------------------------------------------
    governance_keywords = [
        "director",
        "directors",
        "board",
        "board of directors",
        "chairman",
        "chairperson",
        "management",
        "ceo",
        "chief executive",
        "executive",
        "independent director",
        "md",
        "managing director",
    ]

    if any(word in q for word in governance_keywords):
        return "governance"

    # --------------------------------------------------
    # OWNERSHIP
    # --------------------------------------------------
    ownership_keywords = [
        "promoter",
        "promoters",
        "shareholding",
        "holding pattern",
        "fii",
        "fpi",
        "mutual fund",
        "mutual funds",
        "mf",
        "institutional holding",
        "retail holding",
        "public holding",
        "ownership",
    ]

    if any(word in q for word in ownership_keywords):
        return "ownership"

    # --------------------------------------------------
    # CORPORATE
    # --------------------------------------------------
    corporate_keywords = [
        "news",
        "announcement",
        "announcements",
        "corporate action",
        "corporate actions",
        "dividend",
        "bonus",
        "stock split",
        "split",
        "rights issue",
        "buyback",
        "latest",
        "recent",
        "update",
        "event",
        "filing",
        "bse filing",
        "board meeting",
        "outcome",
        "results",
        "financial results",
        "quarterly results",
        "meeting outcome",
        "sebi",
        "regulation",
        "filing",
    ]

    if any(word in q for word in corporate_keywords):
        return "corporate"

    # --------------------------------------------------
    # MARKET
    # --------------------------------------------------
    market_keywords = [
    "price",
    "stock price",
    "share price",
    "market price",
    "pe",
    "p/e",
    "pe ratio",
    "market cap",
    "market capitalization",
    "52 week",
    "52-week",
    "all time high",
    "ath",
    "performance",
    "return",
    "rally",
    "fall",
    "volume",
    "turnover",

    "ohlc",
    "open",
    "high",
    "low",
    "close",
    "candlestick",
    "candle",
]
    if any(word in q for word in market_keywords):
        return "market"

    # --------------------------------------------------
    # ANALYSIS
    # --------------------------------------------------
    analysis_keywords = [
        "analyze",
        "analysis",
        "invest",
        "investment",
        "buy",
        "sell",
        "hold",
        "good company",
        "good stock",
        "worth buying",
        "risk",
        "risks",
        "positive",
        "positives",
        "negative",
        "negatives",
        "outlook",
        "future",
        "long term",
        "short term",
        "investment thesis",
    ]

    if any(word in q for word in analysis_keywords):
        return "analysis"

    # --------------------------------------------------
    # DEFAULT
    # --------------------------------------------------
    return "analysis"
