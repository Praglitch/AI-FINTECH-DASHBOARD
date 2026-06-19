# stocks/services/chunking_service.py
import os
from openai import OpenAI
from stocks.models import AnnouncementChunk

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

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
    Generates OpenAI embeddings for each chunk automatically.
    """
    # Delete old chunks for this PDF (if any)
    AnnouncementChunk.objects.filter(pdf=pdf_cache).delete()

    # Split the PDF text into chunks
    raw_chunks = chunk_text(pdf_cache.pdf_text)

    created = 0
    for index, chunk_text_fragment in enumerate(raw_chunks):
        # Generate embedding using OpenAI
        try:
            response = client.embeddings.create(
                model="text-embedding-3-small",
                input=chunk_text_fragment[:8000]  # truncate to avoid token limits
            )
            embedding = response.data[0].embedding
        except Exception as e:
            print(f"⚠️ Embedding error on chunk {index}: {e}")
            embedding = None  # fallback to null (can be backfilled later)

        # Save chunk with embedding
        AnnouncementChunk.objects.create(
            pdf=pdf_cache,
            chunk_index=index,
            chunk_text=chunk_text_fragment,
            embedding=embedding
        )
        created += 1

    return created