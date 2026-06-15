# Code Review Notes

## Strengths

- **Clean separation of concerns**: Services layer isolates data retrieval logic from views.
- **Registry pattern** (`retrieval_registry.py`) makes adding new data sources trivial.
- **Multi‑intent detection** allows questions covering multiple topics (e.g., shareholding + investment analysis).
- **PDF ingestion pipeline** caches downloads, overlaps chunks, and stores full text for future re‑chunking.
- **Frontend uses progressive loading** – user sees critical data first, rest loads in background.
- **Conversation memory** (last 4 messages) sent to backend for follow‑up questions.
- **Chat markdown rendering** (bold, bullet points, headings) makes AI answers readable.
- **Action buttons** (copy, regenerate, like, dislike) improve user interaction.
- **Theme toggle** (dark/light) and responsive CSS.

## Areas for Improvement (Not Yet Implemented)

- **Vector search** (pgvector) – replace keyword search with semantic similarity.
- **Cross‑company comparison** – allow selecting two companies and asking AI to compare.
- **Better error handling** for Accord DB connection failures.
- **Session‑based conversation memory** on backend (currently only last 4 messages sent from frontend).
- **Unit tests** for services and views.
- **Production deployment** – move secrets to environment variables, set `DEBUG=False`, use Gunicorn + Nginx.

## Code Quality

- Consistent naming (services return dicts or None).
- Raw SQL queries use parameterised placeholders (safe from injection).
- Frontend uses `Promise.allSettled` to avoid crashing on partial failures.
- `@login_required` protects all API endpoints.
- CSRF exempt only on `company_chat` – can be improved by sending CSRF token from frontend.

## Dependencies

- All required packages listed in `requirements.txt`.
- No unused imports (cleaned up).
- No dead code (cleaned up).