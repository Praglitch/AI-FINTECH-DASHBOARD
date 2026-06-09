def detect_intent(question):

    question = question.lower()

    if any(word in question for word in [
        "director",
        "board",
        "chairman",
        "management",
        "ceo"
    ]):
        return "governance"

    if any(word in question for word in [
        "promoter",
        "shareholding",
        "fii",
        "fpi",
        "mutual fund"
    ]):
        return "ownership"

    if any(word in question for word in [
        "insider",
        "esop",
        "buying",
        "selling"
    ]):
        return "insider"

    if any(word in question for word in [
        "bulk deal",
        "block deal"
    ]):
        return "deals"

    if any(word in question for word in [
        "news",
        "announcement",
        "corporate action",
        "latest"
    ]):
        return "corporate"

    if any(word in question for word in [
        "price",
        "market cap",
        "pe",
        "stock"
    ]):
        return "market"

    return "analysis"