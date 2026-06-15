# Feature Mapping

| Frontend Feature | Backend API | Database | Notes |
|----------------|-------------|----------|-------|
| Company Search | `search_companies()` | Accord: company_master | Returns list of matches |
| Company Details | `company_details()` | Accord: company_master | Profile info |
| Financial Summary | `company_financials()` | Accord: finance_cons_pl | Latest year |
| Market Snapshot | `company_market()` | Accord: monthlyprice | Latest month |
| Shareholding Pattern | `company_shareholding()` | Accord: shpsummary | Latest date |
| Latest News | `company_news()` | Accord: news_master | 10 latest |
| Announcements | `company_announcements()` | Accord: bse_announcements | Triggers PDF download |
| Corporate Actions | `company_corporate_actions()` | Accord: corporate_actions_data | List of events |
| OHLC Chart | `company_yfinance()` | Yahoo Finance / CSV cache | Period/interval |
| AI Summary (Ollama) | `company_ai_summary()` | Multiple services | Summarises company |
| AI Summary (OpenAI) | `company_openai_summary()` | Multiple services | Summarises company |
| AI Copilot Chat | `company_chat()` | All sources + PDF chunks | RAG with multi‑intent |
| Logout | `logout_view()` | – | Clears session |
| Help Page | `help_page()` | – | Static placeholder |

## UI Components

- **Search bar** – calls `search_companies` on input.
- **Empty state** – example chips call `selectCompany`.
- **Dashboard** – lazy loads data, skeleton placeholders.
- **Tabs** – overview, financials, news, AI analysis.
- **Chart** – period/interval controls, refresh button, hover tooltip.
- **AI Analysis panel** – toggle Ollama/OpenAI, summary text.
- **Chat panel** – message bubbles, typing indicator, action buttons, suggested prompts.
- **Settings dropdown** – Help and Logout.
- **Back arrow** – resets to empty state.