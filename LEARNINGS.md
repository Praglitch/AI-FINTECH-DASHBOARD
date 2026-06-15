# Learnings

## Django & Database

- Two‑database architecture: Django ORM for internal tables, raw SQL for external Accord DB.
- Indexes on frequently queried columns (`scripcode`, `newsid`, `pdf_id`, `chunk_index`) speed up lookups.
- Using `related_name` simplifies foreign key traversal.

## RAG Pipeline

- PDF ingestion: cache by `newsid` to avoid re‑downloading.
- Chunking with overlap (size 1000, overlap 200) preserves context across boundaries.
- Keyword search (`__icontains`) is case‑insensitive but limited – vector search will improve semantics.

## Intent Detection

- Rule‑based keyword matching is fast and sufficient.
- Multi‑intent union allows questions like “shareholdings and should I invest?” to fetch both ownership and analysis sources.

## Frontend

- Parallel loading with `Promise.all` for critical data, `Promise.allSettled` for non‑critical.
- Skeleton loading improves perceived performance.
- Chat markdown rendering uses custom regex to convert **bold**, `### headings`, and bullet points.
- Tab persistence via `localStorage`.

## Deployment

- Environment variables for secrets.
- `DEBUG=False`, `ALLOWED_HOSTS` for production.
- Static files collected with `collectstatic`.
- Use Gunicorn + Nginx for production.

## Future

- pgvector for semantic chunk search.
- Cross‑company comparison endpoint.
- Celery for background PDF processing.
- WebSockets for real‑time updates.