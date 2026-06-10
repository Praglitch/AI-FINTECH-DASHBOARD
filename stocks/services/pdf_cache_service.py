from stocks.models import AnnouncementPdfCache
from stocks.services.pdf_service import extract_pdf_text_from_url
from stocks.services.chunking_service import create_chunks_for_pdf


def get_or_create_pdf_cache(newsid, scripcode, attachment_url):
    """
    Return cached PDF text if available.
    Otherwise download, extract, store, create chunks, and return.
    """
    # Check if already cached
    cached_pdf = AnnouncementPdfCache.objects.filter(
        newsid=str(newsid)
    ).first()

    if cached_pdf:
        print(f"✅ Using cached PDF: {newsid}")
        return cached_pdf.pdf_text

    print(f"📥 Downloading PDF for newsid: {newsid}")

    pdf_text = extract_pdf_text_from_url(attachment_url)

    if not pdf_text or len(pdf_text) < 100:
        print(f"⚠️ Failed to extract text from PDF: {newsid}")
        return None

    # Create cache entry
    pdf_cache = AnnouncementPdfCache.objects.create(
        newsid=str(newsid),
        scripcode=str(scripcode),
        attachment_url=attachment_url,
        pdf_text=pdf_text,
        processed=True
    )

    # Create chunks
    chunk_count = create_chunks_for_pdf(pdf_cache)
    print(f"✅ Created {chunk_count} chunks for {newsid}")

    return pdf_text