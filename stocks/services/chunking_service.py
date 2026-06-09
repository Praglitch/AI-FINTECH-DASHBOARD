from stocks.models import AnnouncementChunk


def chunk_text(text, chunk_size=1000, overlap=200):
    """
    Split text into overlapping chunks.
    """

    chunks = []

    start = 0

    while start < len(text):
        end = start + chunk_size

        chunks.append(text[start:end])

        start += (chunk_size - overlap)

    return chunks


def create_chunks_for_pdf(pdf_cache):
    """
    Create DB chunks for a cached PDF.
    """

    AnnouncementChunk.objects.filter(
        pdf=pdf_cache
    ).delete()

    chunks = chunk_text(pdf_cache.pdf_text)

    created = 0

    for index, chunk in enumerate(chunks):
        AnnouncementChunk.objects.create(
            pdf=pdf_cache,
            chunk_index=index,
            chunk_text=chunk
        )

        created += 1

    return created