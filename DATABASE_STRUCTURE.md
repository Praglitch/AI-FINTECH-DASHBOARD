# Database Structure

Database: PostgreSQL

Connection File:
stocks/db_connection.py

---

## company_master

Purpose:
Stores master company information.

Important Columns:

* fincode
* compname
* symbol
* s_name
* industry
* house
* chairman
* mdir
* cosec
* status
* isin
* scripcode

Used By:

* search_companies()
* company_details()
* company_announcements()

---

## finance_cons_pl

Purpose:
Stores company financial information.

Important Columns:

* year_end
* net_sales
* operating_profit
* profit_after_tax
* reported_eps
* dividend_perc

Used By:

* company_financials()

---

## monthlyprice

Purpose:
Stores latest market price information.

Important Columns:

* open
* high
* low
* close
* volume
* value
* month
* year

Used By:

* company_market()

---

## shpsummary

Purpose:
Stores shareholding pattern.

Important Columns:

* date_end
* tpftotalpromoter
* tptotalpublic
* tpinmfuti
* tpinforeignportinv

Used By:

* company_shareholding()

---

## corporate_actions_data

Purpose:
Stores corporate actions.

Important Columns:

* sdate
* details
* amount
* ratio1

Used By:

* company_corporate_actions()

---

## bse_announcements

Purpose:
Stores company announcements.

Important Columns:

* caption
* datetime
* scripcode

Used By:

* company_announcements()

---

## news_master

Purpose:
Stores company news.

Important Columns:

* heading
* date
* fincode

Used By:

* company_news()
