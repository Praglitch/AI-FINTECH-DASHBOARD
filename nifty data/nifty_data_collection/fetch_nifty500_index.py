import requests
import pandas as pd
import os

# ==============================================
# ✏️ YOUR CONFIGURATION (Only 2 Things to Change)
# ==============================================

# 1. YOUR ACCESS TOKEN (required)
ACCESS_TOKEN = "eyJ0eXAiOiJKV1QiLCJrZXlfaWQiOiJza192MS4wIiwiYWxnIjoiSFMyNTYifQ.eyJzdWIiOiIyNEM0QlkiLCJqdGkiOiI2YTJiOTkxOGI4NDVhYTEzZDQyNWZhNDMiLCJpc011bHRpQ2xpZW50IjpmYWxzZSwiaXNQbHVzUGxhbiI6ZmFsc2UsImlhdCI6MTc4MTI0MjEzNiwiaXNzIjoidWRhcGktZ2F0ZXdheS1zZXJ2aWNlIiwiZXhwIjoxNzgxMzAxNjAwfQ.DNJydThzO7txYek7bYK5OZOx1reoOE5Tt-9PVTKx7bQ"  # ← Paste your actual token here

# 2. (Optional) Adjust date range – minute-level data is usually available only
#    for the last ~6 months. Upstox may return a 400 error if the range is too long.
FROM_DATE = "2026-06-01"      # start date (YYYY-MM-DD)
TO_DATE   = "2026-06-12"      # end date (YYYY-MM-DD)

# ==============================================
# NO CHANGES NEEDED BELOW (unless you want different intervals)
# ==============================================

# Instrument details
INSTRUMENT_KEY = "NSE_INDEX|Nifty 500"

# Interval options: '1minute', '30minute', 'day', 'week', 'month'
INTERVAL = "1minute"            # or "30minute" for 30-minute candles

# Ensure the target folder exists
output_folder = "nifty500_indexes"
os.makedirs(output_folder, exist_ok=True)
csv_filename = os.path.join(output_folder, "nifty500_index_1minute_data.csv")

# ==============================================
# API CALL – Upstox v2 Historical Candle
# ==============================================

# Construct the URL: 
# https://api.upstox.com/v2/historical-candle/{instrument_key}/{interval}/{to_date}/{from_date}
url = f"https://api.upstox.com/v2/historical-candle/{INSTRUMENT_KEY}/{INTERVAL}/{TO_DATE}/{FROM_DATE}"

headers = {"Authorization": f"Bearer {ACCESS_TOKEN}"}

print(f"Fetching {INTERVAL} data for {INSTRUMENT_KEY} from {FROM_DATE} to {TO_DATE}...")
response = requests.get(url, headers=headers)

if response.status_code != 200:
    print(f"❌ API Error: {response.status_code}")
    print("Response body:", response.text)

    # Provide a helpful note if the range is likely too long
    if response.status_code == 400 and "from_date" in response.text.lower():
        print("\n⚠️  Note: Minute-level data may not be available for such a long period.")
        print("   Try reducing the date range or use a daily interval instead.")
    exit()

data = response.json()

# ==============================================
# PARSE & SAVE TO CSV
# ==============================================
if 'data' in data and 'candles' in data['data']:
    candles = data['data']['candles']
    columns = ['timestamp', 'open', 'high', 'low', 'close', 'volume', 'open_interest']
    df = pd.DataFrame(candles, columns=columns)
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    df = df.sort_values('timestamp')

    df.to_csv(csv_filename, index=False)
    print(f"\n✅ Success! Saved {len(df)} rows to {csv_filename}")
    print(f"   Time range in file: {df['timestamp'].min()} to {df['timestamp'].max()}")
else:
    print("❌ Unexpected response format")
    print(data)