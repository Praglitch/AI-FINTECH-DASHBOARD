"""
Registry for AI retrieval: maps intents to data sources and provides handlers.
"""

from .financial_service import get_company_financials_data
from .shareholding_service import get_company_shareholding_data
from .market_service import get_company_market_data
from .news_service import get_company_news_data
from .announcement_service import get_company_announcements_data
from .corporate_actions_service import get_company_corporate_actions_data
from .company_service import get_company_details_data
from .board_service import get_board_of_directors_data
from .insider_service import get_insider_trading_data
from .bulk_deals_service import get_bulk_deals_data
from .block_deals_service import get_block_deals_data
from .chunk_retrieval_service import search_chunks


def get_announcement_pdf_chunks(fincode, question=None):
    """
    Search PDF chunks for the given company.
    """
    from ..database.db_connection import get_connection
    
    conn = get_connection()
    cursor = conn.cursor()
    
    # Try to find scripcode using fincode first
    cursor.execute("""
        SELECT scripcode 
        FROM company_master 
        WHERE fincode = %s
    """, [fincode])
    
    result = cursor.fetchone()
    
    if result:
        scripcode = str(result[0])
        print(f"Converted fincode {fincode} → scripcode {scripcode}")
    else:
        scripcode = str(fincode)
        print(f"Using {scripcode} as scripcode directly")
    
    cursor.close()
    conn.close()
    
    if not question:
        return ""
    
    # Extract keywords from question
    question_lower = question.lower()
    
    # Common keywords to search for (based on your PDF content)
    keywords_to_try = ['concluded', 'board', 'meeting', 'results', 'dividend', 'approval', 'auditors']
    
    # Also add words from the question
    question_words = [w for w in question_lower.split() if len(w) > 3 and w not in ['what', 'when', 'where', 'which', 'would', 'could', 'should', 'about', 'with', 'without', 'from', 'have', 'been', 'were', 'was']]
    
    all_keywords = list(set(keywords_to_try + question_words))
    
    print(f"Searching with keywords: {all_keywords[:5]}")
    
    # Search for each keyword and collect unique chunks
    all_chunks = []
    seen_chunk_ids = set()
    
    for keyword in all_keywords[:5]:  # Limit to 5 keywords
        results = search_chunks(scripcode, keyword, limit=3)
        for chunk in results:
            if chunk.id not in seen_chunk_ids:
                seen_chunk_ids.add(chunk.id)
                all_chunks.append(chunk)
    
    if not all_chunks:
        return ""
    
    # Sort by chunk_index
    all_chunks.sort(key=lambda x: x.chunk_index)
    
    return "\n\n".join(
        f"[Chunk {chunk.chunk_index}]\n{chunk.chunk_text}"
        for chunk in all_chunks[:5]
    )


# SOURCE HANDLERS
SOURCE_HANDLERS = {
    "company": get_company_details_data,
    "financials": get_company_financials_data,
    "shareholding": get_company_shareholding_data,
    "market": get_company_market_data,
    "news": get_company_news_data,
    "announcements": get_company_announcements_data,
    "corporate_actions": get_company_corporate_actions_data,
    "board": get_board_of_directors_data,
    "insider": get_insider_trading_data,
    "bulk_deals": get_bulk_deals_data,
    "block_deals": get_block_deals_data,
    "announcement_pdf_chunks": get_announcement_pdf_chunks,
}


# INTENT → SOURCES MAPPING
INTENT_SOURCES = {
    "analysis": [
        "company",
        "financials",
        "shareholding",
        "market",
        "news",
        "announcements",
        "corporate_actions",
        "insider",
        "bulk_deals",
        "block_deals",
    ],
    "governance": [
        "board",
    ],
    "ownership": [
        "shareholding",
        "insider",
        "bulk_deals",
        "block_deals",
    ],
    "market": [
        "market",
        "financials",
    ],
    "corporate": [
        "news",
        "announcements",
        "announcement_pdf_chunks",
        "corporate_actions",
    ],
    "deals": [
        "insider",
        "bulk_deals",
        "block_deals",
    ],
}


# FETCH SOURCES
def fetch_sources(fincode, source_keys, question=None):
    """
    Returns a list of (source_name, data) preserving source order.
    """
    results = []

    for key in source_keys:
        handler = SOURCE_HANDLERS.get(key)

        if handler:
            if key == "announcement_pdf_chunks":
                data = handler(fincode, question)
            else:
                data = handler(fincode)

            if data:
                results.append((key, data))

    return results