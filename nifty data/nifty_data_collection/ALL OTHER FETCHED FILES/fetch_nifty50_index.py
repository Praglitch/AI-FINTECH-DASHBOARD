import pandas as pd
from pyzdata import PyZData, Interval

ENCTOKEN = "4taoScLRP8w4ULISplRBGsgo+K5BmdvRIDKut2ReOdvFGHv/tWfcGqc6nm23fiPJ4gpPhJ3XYDpktExHTdrcxfIJbwqexwshUORGmISJ9O/vUDWvBqukPg=="   # replace
START = "2026-03-01"
END = "2026-06-11"
OUTPUT = "nifty50/nifty50_index_1min.csv"   # relative to current directory

print("Fetching NIFTY 50 index data...")
client = PyZData(enctoken=ENCTOKEN)
token = client.get_instrument_token("NIFTY 50", "NSE")
if not token:
    print("❌ Token not found. Exiting.")
    exit(1)

df = client.get_data(token, START, END, Interval.MINUTE_1)
if df is not None and not df.empty:
    df['datetime'] = pd.to_datetime(df['datetime'])
    df.to_csv(OUTPUT, index=False)
    print(f"✅ Saved {len(df)} rows to {OUTPUT}")
    print(f"   Date range: {df['datetime'].min()} to {df['datetime'].max()}")
else:
    print("❌ No data returned.")