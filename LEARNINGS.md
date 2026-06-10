models.py – Core database schema
Django ORM basics
Model = Python class that maps to a database table.

Field types:

CharField(max_length=…) – string with a limit.

TextField – unlimited text.

BooleanField – True/False.

DateTimeField – date + time.

ForeignKey – links one model to another (many‑to‑one relationship).

on_delete=models.CASCADE – when the referenced object (e.g., a PDF cache) is deleted, all related objects (e.g., its chunks) are also deleted.

related_name='chunks' – allows back‑reference: pdf.chunks.all().

Our tables
AnnouncementPdfCache
Stores the raw text of a downloaded BSE announcement PDF.

newsid (unique) – BSE identifier for the announcement.

scripcode – BSE security code of the company (used to join with bse_announcements).

pdf_text – the full extracted text.

processed – flag to indicate whether chunks have been created.

Timestamps: created_at, updated_at.

AnnouncementChunk
Stores overlapping pieces (chunks) of the PDF text.

pdf – foreign key back to AnnouncementPdfCache.

chunk_index – order of the chunk (0‑based).

chunk_text – the text of that chunk.

created_at – when the chunk was stored.

Indexes
Added on scripcode and newsid in AnnouncementPdfCache to speed up lookups (used frequently when retrieving PDFs).

Added on (pdf, chunk_index) in AnnouncementChunk to keep ordering fast.

__str__ vs __repr__
__str__ – human‑readable, used in Django admin and when printing an object.

__repr__ – developer‑friendly, used in interactive shell; we added it to show key fields.

Removal of Stock model
The Stock model was unused in any service or view.

Keeping it would cause confusion and an unnecessary table. We removed it with a migration.

Placeholder for vector search
A commented field embedding = VectorField(dimensions=384, null=True, blank=True) is prepared in AnnouncementChunk.

This will later store semantic embeddings for each chunk, enabling pgvector similarity search.

The decision to use pgvector (and which embedding model) is pending mentor discussion.



## Raw Database Connections (Accord DB)

- **Why raw `psycopg2`?** – The Accord database contains tables not managed by Django ORM. We need raw SQL access.
- **`psycopg2`** – PostgreSQL driver for Python.
- **Environment variables** – Credentials stored in `.env` for security.
- **Lifecycle** – Each call opens a new connection; the caller must close `cursor` and `conn`.
- **Error handling** – Currently minimal (will crash on failure). For production, consider retries or connection pooling.
- **No connection pooling** – For this scale it's fine; each query is short‑lived.

)
🧠 Key concepts to explain (for learnings.md)
Why raw psycopg2? – Your Django app connects to two databases: the internal Django DB (via ORM) and an external Accord DB (raw SQL). Raw connections are necessary when the external DB isn’t managed by Django’s ORM.

Environment variables – Sensitive credentials are stored in .env and loaded with python-dotenv for security.

Connection lifecycle – Each call to get_connection() opens a new connection. The caller must close it (conn.close()) to avoid resource leaks.

Error handling – No try/except – a failure would crash the view. We may add retry logic later.

Connection pooling – Not needed for low‑traffic development, but for production, using psycopg2.pool.SimpleConnectionPool would improve performance.






## `company_service.py` – Company search and details

- **Raw SQL queries** – Because data lives in external Accord DB, not Django ORM.
- **Search** – Case‑insensitive partial match on name, symbol, or fincode.
- **Parameterised queries** – Protect against SQL injection.
- **`fincode`** – Primary key for a company in Accord DB (numeric).  
  **`scripcode`** – BSE security code (used for announcements). They are different!
- **Error handling** – `get_company_details_data` returns `None` on missing company, letting the view return 404.
- **Connection management** – Each call opens/closes its own connection – acceptable for low/medium traffic.

🧠 Key concepts (for learnings.md)
Raw SQL with psycopg2 – Direct queries to the external Accord DB. No Django ORM involved.

Search logic – LOWER(compname) LIKE %s case‑insensitive partial match. Also searches symbol and fincode (converted to text with CAST).

Parameterised queries – Using %s placeholders prevents SQL injection.

LIMIT 10 – Only returns top 10 matches for the dropdown.

fincode vs scripcode – fincode is the internal unique identifier for a company in Accord DB. scripcode is the BSE code (used for announcements). Many services need to convert one to the other.

Missing data – get_company_details_data returns None if no row found; the view then returns 404.

Connection management – Each function opens and closes its own connection (proper but not optimal for very high traffic; fine for this scale).




## `financial_service.py` & similar data services

- **Purpose** – Fetch the latest financial snapshot (revenue, profit, EPS, dividend) for a company.
- **Pattern** – `get_connection()`, execute query with `%s` placeholder, fetch one row, close, return dict.
- **`ORDER BY year_end DESC LIMIT 1`** – get the most recent financial year.
- **`str(fincode)`** – ensures the query works even if the column type is numeric.
- **Similar services** – `market_service`, `shareholding_service`, `corporate_actions_service`, `news_service`, `insider_service`, `bulk_deals_service`, `block_deals_service` all follow the same pattern, differing only in the table and columns.
- **Error handling** – Returning `None` when no data exists. The caller (view or context builder) must handle it gracefully (e.g., show “No data” in the frontend or omit the source from AI context).


🧠 Key concepts (for learnings.md)
Single‑row aggregation – The query picks the most recent financial year (ORDER BY year_end DESC LIMIT 1).

str(fincode) – Explicit conversion to string because the database may store fincode as a numeric type; casting avoids type mismatch.

Consistent pattern – All “latest data” services (financial_service, market_service, shareholding_service, corporate_actions_service, etc.) follow the same structure:

Connect → execute → fetch one row → close → return dict or None.

Missing data handling – If no row exists, return None. The view then returns a 404 or uses fallback values (already handled in frontend and AI context).

Other similar services:

market_service.py – monthlyprice table.

shareholding_service.py – shpsummary table.

corporate_actions_service.py – corporate_actions_data (list of actions, not just one).

news_service.py, insider_service.py, bulk_deals_service.py, block_deals_service.py – return lists (multiple rows).





## `announcement_service.py` – PDF ingestion trigger

- **Purpose** – Fetch latest announcements and, if a PDF is attached, download and chunk it.
- **Key step** – `scripcode` lookup (convert `fincode` to BSE security code).
- **PDF ingestion hook** – Calls `get_or_create_pdf_cache()` which handles download, text extraction, chunking, and caching.
- **Caching** – PDFs are stored in Django DB (`AnnouncementPdfCache`); chunks in `AnnouncementChunk`. Subsequent requests use cached version.
- **Limiting** – Only last 10 announcements are processed (prevents performance issues).
- **Failure handling** – If PDF download fails, only a console warning is printed; announcements are still returned to frontend.
- **RAG start** – This function is the entry point for the Retrieval‑Augmented Generation pipeline for PDF documents.


🧠 Key concepts (for learnings.md)
Two‑step lookup – First get scripcode from company_master using the fincode. Then fetch announcements from bse_announcements using that scripcode.

PDF ingestion hook – If an announcement has an attachmenturl (a PDF link), we call get_or_create_pdf_cache(). That function downloads the PDF, extracts text, creates chunks, and stores them in the Django database (AnnouncementPdfCache and AnnouncementChunk).

RAG pipeline start – This is where your Retrieval‑Augmented Generation pipeline begins. The raw PDF text becomes searchable chunks, which are later used by the AI to answer questions.

Caching – get_or_create_pdf_cache checks if the PDF is already cached (by newsid) before downloading. Subsequent views of the same company do not re‑download.

Limiting – Only the 10 most recent announcements are fetched (and potentially ingested). Prevents overloading the system with old PDFs.

Returned data – Even without attachments, announcements are returned to the frontend (caption and datetime). The PDF chunks are a side effect, stored separately.


## PDF Ingestion Pipeline (`pdf_cache_service`, `pdf_service`, `chunking_service`)

- **`get_or_create_pdf_cache`** – Cache‑first pattern: check Django DB, else download, extract, store, and chunk.
- **Download** – `requests` with custom headers to bypass BSE restrictions.
- **Text extraction** – `PyMuPDF` (fitz) extracts plain text from PDF.
- **Chunking** – Overlapping sliding window (`1000` chars, `200` overlap) to preserve context.
- **Storage** – Full PDF text in `AnnouncementPdfCache`, chunks in `AnnouncementChunk` with index.
- **Failure tolerance** – Returns `None` on error; announcement service still returns caption/date to frontend.
- **Why overlapping?** – Ensures that if a sentence or paragraph is split across chunk boundaries, the overlap captures it in at least one chunk.

🧠 Key concepts (for learnings.md)
Caching pattern – get_or_create_pdf_cache checks existence by newsid before downloading. Avoids repeated downloads.

PDF download – Uses requests with custom headers (User‑Agent, Referer) to mimic a browser, required by BSE website.

Text extraction – PyMuPDF (fitz) extracts raw text from PDF. No OCR; works only for selectable text PDFs.

Chunking – Overlapping windows (chunk_size=1000, overlap=200) to preserve context across chunk boundaries. Overlap prevents information loss at cut points.

Persistence – Extracted text stored in AnnouncementPdfCache (full text) and AnnouncementChunk (overlapping pieces). The full text is kept for potential re‑chunking later.

Error handling – If PDF download or extraction fails, returns None; caller (announcement service) continues without crashing.

Chunk size trade‑off – 1000 characters is roughly 150‑250 tokens, suitable for embedding models and LLM context windows.



