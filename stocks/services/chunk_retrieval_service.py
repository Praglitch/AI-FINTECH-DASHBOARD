from stocks.models import AnnouncementChunk

def search_chunks(scripcode, keyword, limit=5):
    return AnnouncementChunk.objects.filter(
        pdf__scripcode=scripcode,
        chunk_text__icontains=keyword
    )[:limit]  