import os
from openai import OpenAI
from pgvector.django import CosineDistance
from stocks.models import AnnouncementChunk

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def embed_question(question):
    """Generate embedding for a user question."""
    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=question
    )
    return response.data[0].embedding

def search_chunks_by_vector(scripcode, question, limit=5):
    """Semantic search using vector similarity."""
    try:
        query_embedding = embed_question(question)
    except Exception as e:
        print(f"Embedding error: {e}")
        return AnnouncementChunk.objects.none()

    return (AnnouncementChunk.objects
            .filter(pdf__scripcode=str(scripcode))
            .annotate(distance=CosineDistance("embedding", query_embedding))
            .order_by("distance")[:limit])

def search_chunks_keyword(scripcode, question, limit=5):
    """Fallback: keyword-based search."""
    stopwords = {'what','when','where','which','would','could','should',
                 'about','with','without','from','have','been','were','was'}
    keywords = [w for w in question.lower().split() if len(w)>3 and w not in stopwords]
    qs = AnnouncementChunk.objects.filter(pdf__scripcode=str(scripcode))
    for kw in keywords[:5]:
        qs = qs.filter(chunk_text__icontains=kw)
    return qs[:limit]

def search_chunks(scripcode, question, limit=5, use_vector=True):
    """Main entry: try vector, fallback to keyword."""
    if use_vector:
        results = search_chunks_by_vector(scripcode, question, limit)
        if results.exists():
            return results
    return search_chunks_keyword(scripcode, question, limit)