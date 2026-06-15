# Database Structure

## Django Internal Database (fintech_ai)

### `stocks_announcementpdfcache`
- `id` (PK)
- `newsid` (unique) – BSE announcement ID
- `scripcode` – BSE security code
- `attachment_url` – PDF link
- `pdf_text` – full extracted text
- `processed` – boolean flag
- `created_at`, `updated_at`

Indexes: `scripcode`, `newsid`

### `stocks_announcementchunk`
- `id` (PK)
- `pdf_id` (FK to announcementpdfcache)
- `chunk_index` – order in PDF
- `chunk_text` – text snippet
- `created_at`

Indexes: (`pdf_id`, `chunk_index`) for fast retrieval.

## External Accord Database (provided by company)

### `company_master`
- `fincode` (PK)
- `compname`, `s_name`, `symbol`, `industry`, `house`
- `chairman`, `mdir`, `cosec`, `status`, `isin`
- `scripcode`

### `finance_cons_pl`
- `fincode`
- `year_end`, `net_sales`, `operating_profit`, `profit_after_tax`, `reported_eps`, `dividend_perc`

### `monthlyprice`
- `fincode`
- `open`, `high`, `low`, `close`, `volume`, `value`, `month`, `year`

### `shpsummary`
- `fincode`
- `date_end`, `tpftotalpromoter`, `tptotalpublic`, `tpinmfuti`, `tpinforeignportinv`

### `bse_announcements`
- `newsid`, `scripcode`, `attachmenturl`, `caption`, `datetime`

### `news_master`
- `fincode`, `heading`, `date`

### `corporate_actions_data`
- `fincode`, `sdate`, `details`, `amount`, `ratio1`

### `insider_trading`, `bse_bulk_deals`, `bse_block_deals`, `board_of_directors`
- All filtered by `fincode`.

## Relationships

- `fincode` links Django DB tables to Accord DB (via `scripcode` conversion in services).
- `newsid` ensures PDFs are downloaded only once.