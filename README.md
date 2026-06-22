# AI‑Powered Financial Research Dashboard

An AI‑driven platform to analyze Indian listed companies using structured market data, BSE announcement PDFs, and large language models.

## Features

- **Company Search** – by name, symbol, or fincode with real‑time suggestions.
- **Financial Dashboard** – KPI cards (Revenue, PAT, Promoter %, Public %, Mutual Fund %, FII/FPI %), market snapshot, shareholding pattern, company details.
- **Interactive OHLC Chart** – period/interval selection (1d … 5y), hover tooltip, temporary price update on the KPI.
- **News, Announcements & Corporate Actions** – latest updates from BSE.
- **AI Analysis** – Ollama & OpenAI summaries (toggle between models).
- **AI Research Copilot** – chat with conversation memory (last 4 messages), markdown formatting (bold, bullet points, headings), copy/regenerate/like/dislike buttons, suggested prompts.
- **PDF Ingestion & RAG** – automatic download of BSE announcement PDFs, text extraction (PyMuPDF), overlapping chunking (size 1000, overlap 200), keyword search (preparation for vector search).
- **Dual Database Architecture** – Django DB (fintech_ai) stores PDF caches & chunks; external Accord DB stores company fundamentals, announcements, news, etc.
- **Responsive Dark Theme** – with light/dark toggle, mobile‑friendly layout.

## Tech Stack

### Backend
- Python 3.14, Django 6.0.5
- PostgreSQL (two databases: Django DB + external Accord DB)
- Raw SQL via psycopg2 (for Accord DB)
- REST‑style APIs with `@login_required`
- OpenAI GPT‑4o‑mini, Ollama Llama 3.2

### Frontend
- HTML5, CSS3 (custom dark theme, CSS variables, flex/grid)
- JavaScript (ES6: async/await, Promise.allSettled, fetch)
- Chart.js + date‑fns adapter + chartjs‑chart‑financial (OHLC line chart)

### Data Sources
- Accord DB (company_master, financials, shareholding, announcements, news, deals)
- Yahoo Finance (yfinance)
- Zerodha (pyzdata) for 1‑minute historical data
- Kaggle (NIFTY 500 baseline)

## Project Structure

stockapp/
├── manage.py
├── stockapp/ # project settings
├── stocks/ # main app
│ ├── models.py
│ ├── views.py
│ ├── urls.py
│ ├── services/ # data retrieval & RAG
│ ├── static/ # CSS, JS
│ ├── templates/ # HTML
│ ├── management/ # custom commands
│ └── migrations/
└── templates/ # project‑level templates




## Setup

1. Clone the repository.
2. Create virtual environment: `python -m venv venv`
3. Activate: `source venv/bin/activate`
4. Install dependencies: `pip install -r requirements.txt`
5. Set up `.env` file with:
   - `OPENAI_API_KEY`
   - Accord DB credentials (`DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`)
   - Django secret key
6. Run migrations: `python manage.py migrate`
7. Create superuser: `python manage.py createsuperuser`
8. Run server: `python manage.py runserver`

## Deployment

Use Gunicorn + Nginx on a VPS (e.g., AWS EC2). Set `DEBUG=False`, `ALLOWED_HOSTS`, and use environment variables for secrets.

## Future Enhancements

- Vector search (pgvector) for semantic retrieval over PDF chunks.
- Cross‑company comparison.
- Watchlist / portfolio tracking.
- Real‑time WebSocket updates.# SCRUM-7 test
