from .financial_service import get_company_financials_data
from .shareholding_service import get_company_shareholding_data
from .market_service import get_company_market_data
from .news_service import get_company_news_data
from .announcement_service import get_company_announcements_data
from .corporate_actions_service import get_company_corporate_actions_data
from .company_service import get_company_details_data
from .yfinance_services import get_yfinance_data
from .board_service import get_board_of_directors_data
from .insider_service import get_insider_trading_data
from .bulk_deals_service import get_bulk_deals_data
from .block_deals_service import get_block_deals_data

def build_context(question, fincode):

    question = question.lower()

    context = []

    company = get_company_details_data(fincode)

    if company:
        context.append(f"Company: {company}")

    # Financial questions
    if any(word in question for word in [
        "profit", "revenue", "sales", "eps",
        "income", "financial"
    ]):
        financials = get_company_financials_data(fincode)

        if financials:
            context.append(f"Financials: {financials}")

    # Shareholding questions
    if any(word in question for word in [
        "promoter", "shareholding", "fii",
        "fpi", "mutual fund"
    ]):
        shareholding = get_company_shareholding_data(fincode)

        if shareholding:
            context.append(f"Shareholding: {shareholding}")

    # Market questions
    if any(word in question for word in [
        "price", "market cap", "pe",
        "52 week", "stock"
    ]):
        market = get_company_market_data(fincode)

        if market:
            context.append(f"Market: {market}")

    # News/Event questions
    if any(word in question for word in [
        "news", "announcement",
        "recent", "latest", "event"
    ]):
        news = get_company_news_data(fincode)
        announcements = get_company_announcements_data(fincode)
        actions = get_company_corporate_actions_data(fincode)

        context.append(f"News: {news}")
        context.append(f"Announcements: {announcements}")
        context.append(f"Corporate Actions: {actions}")
        
        # Board / Governance questions
    if any(word in question for word in [
        "director",
        "directors",
        "board",
        "chairman",
        "management",
        "ceo"
    ]):

        board = get_board_of_directors_data(fincode)

        if board:
            context.append(
                f"Board Of Directors: {board}"
            )
            
            
            # Insider Trading questions
    if any(word in question for word in [
        "insider",
        "insider trading",
        "buying",
        "selling",
        "purchase",
        "sale",
        "esop"
    ]):

        insider = get_insider_trading_data(fincode)

        if insider:
            context.append(
                f"Insider Trading: {insider}"
            )
            
            
            # Bulk Deal questions
    if any(word in question for word in [
        "bulk deal",
        "bulk deals",
        "large purchase",
        "large sale",
        "institutional buying",
        "institutional selling"
    ]):

        bulk_deals = get_bulk_deals_data(fincode)

        if bulk_deals:
            context.append(
                f"Bulk Deals: {bulk_deals}"
            )


    # Block Deal questions
    if any(word in question for word in [
        "block deal",
        "block deals",
        "institutional transaction",
        "large institutional trade"
    ]):

        block_deals = get_block_deals_data(fincode)

        if block_deals:
            context.append(
                f"Block Deals: {block_deals}"
            )
            
            
    return "\n\n".join(context)



