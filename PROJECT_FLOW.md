# Project Flow

## User Authentication

1. User visits `/` → login page.
2. Enters credentials → Django authenticates.
3. On success → redirect to `/home/`.

## Empty Search State

- User sees search bar and example chips.
- Typing triggers `performSearch()` → fetches matching companies from Accord DB → displays dropdown.

## Company Selection

- Click on a company → `selectCompany(fincode)`.
- Critical data (company details + market snapshot) fetched first → dashboard appears with loading skeletons.
- Remaining data (shareholding, financials, news, announcements, AI summary, chart) fetched in background.
- Chart loads from Yahoo Finance (or CSV cache).
- PDFs from announcements are downloaded and chunked automatically.

## AI Analysis Tab

- User can toggle between Ollama and OpenAI summaries.
- In the chat panel, user types a question → sent to `company_chat`.
- Backend builds context (multi‑intent, including PDF chunks) and prompts GPT‑4o‑mini.
- Answer returned in markdown, displayed with action buttons (copy, regenerate, like, dislike).
- Suggested prompt chips insert predefined questions.

## Settings & Navigation

- Back arrow (←) appears when a company is loaded; clicking clears selection and returns to empty state.
- Settings gear (⚙️) toggles dropdown with Help (static page) and Logout (logs out to login page).

## Data Flow Summary

- **Search**: Frontend → `search_companies` → Accord DB → dropdown.
- **Dashboard**: Frontend → multiple API endpoints → Accord DB + Django DB + yfinance → render.
- **PDFs**: Announcements → `announcement_service` → `pdf_cache_service` → download → chunk → store in Django DB.
- **Chat**: User question → `company_chat` → `build_context` → intent detection → gather sources (including PDF chunks) → LLM → answer.