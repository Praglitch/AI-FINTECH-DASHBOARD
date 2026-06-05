# API Documentation

## Authentication APIs

### login_page()

Method:
POST

Purpose:
Authenticate user and create session.

---

## Company APIs

### search_companies()

Method:
GET

Purpose:
Search companies using company name, symbol, or fincode.

Database:
company_master

Response:
JSON List

---

### company_details(fincode)

Method:
GET

Purpose:
Fetch company profile information.

Database:
company_master

Response:
JSON Object

---

## Financial APIs

### company_financials(fincode)

Database:
finance_cons_pl

Purpose:
Fetch latest financial information.

---

## Market APIs

### company_market(fincode)

Database:
monthlyprice

Purpose:
Fetch latest market snapshot.

---

## Shareholding APIs

### company_shareholding(fincode)

Database:
shpsummary

Purpose:
Fetch latest shareholding pattern.

---

## Corporate APIs

### company_corporate_actions(fincode)

Database:
corporate_actions_data

Purpose:
Fetch latest corporate actions.

---

### company_announcements(fincode)

Databases:
company_master
bse_announcements

Purpose:
Fetch latest company announcements.

---

## News APIs

### company_news(fincode)

Database:
news_master

Purpose:
Fetch latest company news.

---

## AI APIs

### test_ollama()

Purpose:
Test Ollama connectivity.

---

### company_ai_summary(fincode)

Purpose:
Generate AI-powered company summary.

Dependencies:

* company_details()
* company_financials()
* company_shareholding()
* company_market()

External Service:

* Ollama
* Llama 3.2
