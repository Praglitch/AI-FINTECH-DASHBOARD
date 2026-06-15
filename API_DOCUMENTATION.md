
---

## 📡 Updated `API_DOCUMENTATION.md`

```markdown
# API Documentation

## Authentication

### `login_page()`
- **Method**: POST
- **Purpose**: Authenticate user and start session.

### `logout_view()`
- **Method**: GET
- **Purpose**: Log out user and redirect to login page.

## Company Data

### `search_companies()`
- **Method**: GET
- **Query param**: `q` (string)
- **Response**: List of `{compname, symbol, fincode}`

### `company_details(fincode)`
- **Method**: GET
- **Response**: Company profile (name, symbol, industry, chairman, etc.)

### `company_financials(fincode)`
- **Method**: GET
- **Response**: Latest financials (year_end, net_sales, operating_profit, PAT, EPS, dividend_perc)

### `company_market(fincode)`
- **Method**: GET
- **Response**: Latest market snapshot (open, high, low, close, volume, value)

### `company_shareholding(fincode)`
- **Method**: GET
- **Response**: Latest shareholding pattern (promoter, public, mutual_fund, fpi)

### `company_news(fincode)`
- **Method**: GET
- **Response**: List of latest news (heading, date)

### `company_announcements(fincode)`
- **Method**: GET
- **Response**: List of latest announcements (caption, datetime). Also triggers PDF download for attached PDFs.

### `company_corporate_actions(fincode)`
- **Method**: GET
- **Response**: List of corporate actions (date, details, amount, ratio)

### `company_yfinance(fincode)`
- **Method**: GET
- **Query params**: `period`, `interval` (default: `1y`, `1mo`)
- **Response**: OHLC data for chart and current price, PE, market cap, etc.

## AI APIs

### `test_ollama()`
- **Method**: GET
- **Purpose**: Test Ollama connectivity.

### `company_ai_summary(fincode)`
- **Method**: GET
- **Response**: AI‑generated company summary using Ollama (Llama 3.2).

### `company_openai_summary(fincode)`
- **Method**: GET
- **Response**: AI‑generated company summary using OpenAI GPT‑4o‑mini.

### `company_chat(fincode)`
- **Method**: POST
- **Body**: `{ "question": "string", "history": [...] }`
- **Response**: `{ "answer": "string" }`
- **Purpose**: RAG chat with conversation memory.

## Utility

### `help_page()`
- **Method**: GET
- **Purpose**: Display help documentation (static placeholder).