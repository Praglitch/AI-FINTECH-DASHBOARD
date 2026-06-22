import os, time, requests, pandas as pd
from io import StringIO
from pyzdata import PyZData, Interval

def get_nifty50_symbols():
    url = "https://nsearchives.nseindia.com/content/indices/ind_nifty50list.csv"
    headers = {"User-Agent": "Mozilla/5.0"}
    session = requests.Session()
    session.headers.update(headers)
    session.get("https://www.nseindia.com", timeout=5)
    resp = session.get(url, timeout=10)
    if resp.status_code != 200:
        raise Exception("Failed to fetch symbol list")
    df = pd.read_csv(StringIO(resp.text))
    return df['Symbol'].tolist()

ENCTOKEN = "4taoScLRP8w4ULISplRBGsgo+K5BmdvRIDKut2ReOdvFGHv/tWfcGqc6nm23fiPJ4gpPhJ3XYDpktExHTdrcxfIJbwqexwshUORGmISJ9O/vUDWvBqukPg=="   # replace
START = "2026-03-01"
END = "2026-06-11"
OUT_DIR = "nifty_data_collection/nifty50/scrips"
os.makedirs(OUT_DIR, exist_ok=True)

print("Fetching NIFTY 50 symbol list...")
symbols = get_nifty50_symbols()
print(f"Found {len(symbols)} symbols.")

client = PyZData(enctoken=ENCTOKEN)

for idx, sym in enumerate(symbols, 1):
    print(f"[{idx}/{len(symbols)}] {sym}...")
    token = client.get_instrument_token(sym, "NSE")
    if not token:
        print(f"  No token for {sym}")
        continue
    df = client.get_data(token, START, END, Interval.MINUTE_1)
    if df is not None and not df.empty:
        out_path = os.path.join(OUT_DIR, f"{sym}.csv")
        df.to_csv(out_path, index=False)
        print(f"  Saved {len(df)} rows")
    else:
        print(f"  No data")
    time.sleep(0.5)

print("Done. Files in", OUT_DIR)