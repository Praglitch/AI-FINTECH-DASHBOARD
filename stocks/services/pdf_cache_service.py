from stocks.models import AnnouncementPdfCache
from stocks.services.pdf_service import extract_pdf_text_from_url
from stocks.services.chunking_service import create_chunks_for_pdf


def get_or_create_pdf_cache(newsid, scripcode, attachment_url):
    """
    Return cached PDF text if available.
    Otherwise download, extract, store, and return.
    """

    cached_pdf = AnnouncementPdfCache.objects.filter(
        newsid=newsid
    ).first()

    if cached_pdf:
        print("Using cached PDF")
        return cached_pdf.pdf_text

    print("Downloading PDF")

    pdf_text = extract_pdf_text_from_url(attachment_url)

    if not pdf_text:
        return None

    pdf_cache = AnnouncementPdfCache.objects.create(
    newsid=newsid,
    scripcode=scripcode,
    attachment_url=attachment_url,
    pdf_text=pdf_text,
    processed=True
)

    create_chunks_for_pdf(pdf_cache)

    return pdf_text