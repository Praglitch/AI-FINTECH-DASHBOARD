# System Architecture

## High-Level Architecture

User
↓
Frontend (HTML + JavaScript)
↓
Django APIs (views.py)
↓
PostgreSQL Database
↓
JSON Response
↓
Frontend Rendering

---

## AI Architecture

User
↓
AI Summary Request
↓
company_ai_summary()
↓
company_details()
company_financials()
company_shareholding()
company_market()
↓
Prompt Construction
↓
Ollama REST API
↓
Llama 3.2
↓
Generated Summary
↓
JSON Response
↓
Frontend

---

## Backend Components

### Authentication

* login_page()
* Django Authentication System

### Company Data APIs

* search_companies()
* company_details()

### Market & Financial APIs

* company_financials()
* company_market()

### Corporate Information APIs

* company_shareholding()
* company_corporate_actions()
* company_announcements()

### News APIs

* company_news()

### AI APIs

* test_ollama()
* company_ai_summary()

---

## Database Layer

Database: PostgreSQL

Connection Manager:

* db_connection.py

Connection Flow:

Django API
↓
get_connection()
↓
PostgreSQL
↓
Query Execution
↓
JSON Response
