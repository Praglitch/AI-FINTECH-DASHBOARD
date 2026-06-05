# Feature Mapping

This document maps frontend features to backend APIs, database tables, and external services.

---

# 1. Login

Frontend:

* login.html

Backend:

* login_page()

Database:

* Django Authentication Tables

Purpose:

* Authenticate users and create session.

---

# 2. Home Dashboard

Frontend:

* home.html

Backend:

* home()

Database:

* None

Purpose:

* Main application dashboard.

---

# 3. Company Search

Frontend:

* Search Box
* Search Suggestions Dropdown

Backend API:

* search_companies()

Database Tables:

* company_master

Input:

* Company Name
* Symbol
* Fincode

Output:

* Matching company list

---

# 4. Company Details

Frontend:

* Company Profile Section

Backend API:

* company_details(fincode)

Database Tables:

* company_master

Output:

* Company Information
* Industry
* Symbol
* Management Details
* ISIN

---

# 5. Financial Analysis

Frontend:

* Financial Information Card

Backend API:

* company_financials(fincode)

Database Tables:

* finance_cons_pl

Output:

* Net Sales
* Operating Profit
* Profit After Tax
* EPS
* Dividend %

---

# 6. Market Snapshot

Frontend:

* Market Data Section

Backend API:

* company_market(fincode)

Database Tables:

* monthlyprice

Output:

* Open
* High
* Low
* Close
* Volume
* Value

---

# 7. Shareholding Pattern

Frontend:

* Shareholding Section

Backend API:

* company_shareholding(fincode)

Database Tables:

* shpsummary

Output:

* Promoter Holding
* Public Holding
* Mutual Fund Holding
* FPI Holding

---

# 8. Corporate Actions

Frontend:

* Corporate Actions Card

Backend API:

* company_corporate_actions(fincode)

Database Tables:

* corporate_actions_data

Output:

* Dividends
* Bonus Issues
* Splits
* Corporate Events

---

# 9. Company Announcements

Frontend:

* Announcements Section

Backend API:

* company_announcements(fincode)

Database Tables:

* company_master
* bse_announcements

Output:

* Latest Company Announcements

---

# 10. Company News

Frontend:

* News Section

Backend API:

* company_news(fincode)

Database Tables:

* news_master

Output:

* Latest Company News

---

# 11. AI Summary

Frontend:

* AI Summary Card
* Generate Summary Button

Backend API:

* company_ai_summary(fincode)

Internal Dependencies:

* company_details()
* company_financials()
* company_shareholding()
* company_market()

Database Tables:

* company_master
* finance_cons_pl
* shpsummary
* monthlyprice

External Services:

* Ollama
* Llama 3.2

Output:

* Business Overview
* Strengths
* Risks
* Investor Takeaway

---

# 12. Ollama Connectivity Test

Frontend:

* Developer/Test Feature

Backend API:

* test_ollama()

External Services:

* Ollama
* Llama 3.2

Purpose:

* Verify AI integration is working.

---

# Complete System Flow

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

AI Flow

User
↓
AI Summary Request
↓
company_ai_summary()
↓
Company APIs
↓
Prompt Construction
↓
Ollama REST API
↓
Llama 3.2
↓
Generated Summary
↓
Frontend
