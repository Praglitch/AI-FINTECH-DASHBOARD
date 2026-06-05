# Project Flow

## Company Search

User
↓
Search Box
↓
search_companies()
↓
company_master
↓
JSON Response
↓
Dropdown Suggestions

---

## Company Details

User
↓
Company Selection
↓
company_details()
↓
company_master
↓
JSON Response
↓
Company Information Card

---

## Financial Data

User
↓
Financial Section
↓
company_financials()
↓
finance_cons_pl
↓
JSON Response
↓
Financial Card

---

## Market Snapshot

User
↓
Market Section
↓
company_market()
↓
monthlyprice
↓
JSON Response
↓
Market Card

---

## Shareholding Pattern

User
↓
Shareholding Section
↓
company_shareholding()
↓
shpsummary
↓
JSON Response
↓
Shareholding Card

---

## Corporate Actions

User
↓
Corporate Actions Section
↓
company_corporate_actions()
↓
corporate_actions_data
↓
JSON Response
↓
Corporate Actions Card

---

## Announcements

User
↓
Announcements Section
↓
company_announcements()
↓
company_master
↓
bse_announcements
↓
JSON Response
↓
Announcements Card

---

## News

User
↓
News Section
↓
company_news()
↓
news_master
↓
JSON Response
↓
News Card

---

## AI Summary

User
↓
AI Summary Button
↓
company_ai_summary()
↓
Company API
Financial API
Shareholding API
Market API
↓
Prompt Construction
↓
Ollama API
↓
Llama 3.2
↓
Generated Summary
↓
Frontend
