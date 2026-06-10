from stocks.models import AnnouncementChunk

def search_chunks(scripcode, keyword, limit=5):
    """
    Search chunks for a given scripcode and keyword (case-insensitive).
    """
    if not keyword or len(keyword) < 3:
        return AnnouncementChunk.objects.none()
    
    # Case-insensitive search using __icontains
    return AnnouncementChunk.objects.filter(
        pdf__scripcode=str(scripcode),
        chunk_text__icontains=keyword
    )[:limit]