# System Architecture

## High‑Level Overview


User → Browser (HTML/JS) → Django (REST APIs) → PostgreSQL (2 DBs) → External Accord DB


- **Frontend**: HTML/CSS/JS (Chart.js, vanilla JS)
- **Backend**: Django 6.0.5, Gunicorn (WSGI)
- **Databases**:
  - **Django DB (fintech_ai)**: user auth, PDF cache (`AnnouncementPdfCache`), chunks (`AnnouncementChunk`).
  - **Accord DB**: company_master, financials, shareholding, announcements, news, corporate actions, insider trading, bulk/block deals.
- **AI Integration**:
  - Intent detection (keyword‑based, 6 intents) → multi‑intent union.
  - Context building from multiple sources (financials, market, news, PDF chunks).
  - LLM: OpenAI GPT‑4o‑mini (chat, summaries) and Ollama Llama 3.2 (local summaries).

## Data Flow

### Company Search & Dashboard
1. User searches → `search_companies()` → Accord DB → frontend dropdown.
2. Select company → `selectCompany()` fetches critical data (company + market) first, then background‑loads other APIs.
3. Dashboard renders KPI cards, market snapshot, shareholding, financials, news, announcements.
4. Chart loads OHLC data from Yahoo Finance (or CSV fallback).

### PDF Ingestion (RAG)
1. `get_company_announcements_data()` fetches latest announcements.
2. For each announcement with PDF attachment → `get_or_create_pdf_cache()`.
3. Downloads PDF, extracts text (PyMuPDF), stores full text in `AnnouncementPdfCache`.
4. `create_chunks_for_pdf()` splits text into overlapping chunks (1000 char, overlap 200) and stores in `AnnouncementChunk`.

### AI Chat (RAG)
1. User asks question → `company_chat()`.
2. `build_context()`:
   - Detects all matching intents (multi‑intent).
   - Collects source keys (e.g., financials, shareholding, announcement_pdf_chunks).
   - Fetches data from services (including PDF chunks via keyword search).
3. Constructs prompt with context and conversation history.
4. Calls OpenAI GPT‑4o‑mini (or Ollama).
5. Returns formatted markdown answer to frontend.

## Component Diagram

```mermaid
graph TD
    A[Frontend] -->|HTTP| B[Django Views]
    B --> C[Services]
    C --> D[Accord DB]
    C --> E[Django DB]
    C --> F[External APIs: yfinance, pyzdata]
    B --> G[OpenAI API / Ollama]
    G --> B
    E --> H[PDF Cache & Chunks]
    H --> C

Security
@login_required on all sensitive endpoints.

CSRF protection enabled (except company_chat uses @csrf_exempt – for production, send CSRF token from frontend).

Environment variables for secrets.

Future
pgvector for semantic search.

Cross‑company comparison.

Deployment to AWS with RDS, EC2, Nginx, Gunicorn.