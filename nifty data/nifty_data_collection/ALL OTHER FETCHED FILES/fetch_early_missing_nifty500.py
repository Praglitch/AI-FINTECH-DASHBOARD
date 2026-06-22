import os, time
import pandas as pd
from pyzdata import PyZData, Interval

# Name mapping (same as before)
NAME_MAPPING = {
    "AKZOINDIA": "JSWDULUX",
    "MMFIN": "M&MFIN",
    "MM": "M&M",
    "GSPL": "GUJGASLTD",
    "DBREALTY": "DBREALTY-BE",
    "GVTD": "GVT&D",
    "JKBANK": "J&KBANK",
    "LTIM": "LTM",
    "AREM": "ARE&M",
}

ENCTOKEN = "4taoScLRP8w4ULISplRBGsgo+K5BmdvRIDKut2ReOdvFGHv/tWfcGqc6nm23fiPJ4gpPhJ3XYDpktExHTdrcxfIJbwqexwshUORGmISJ9O/vUDWvBqukPg=="   # <-- replace with your real enctoken
START = "2026-03-01"
END = "2026-04-08"
SYMBOLS_FILE = "missing_kaggle_range.txt"
OUTPUT_DIR = "temp_early_fetched"
SUCCESS_LOG = "early_success.txt"
FAILED_LOG = "early_failed.txt"

os.makedirs(OUTPUT_DIR, exist_ok=True)

with open(SYMBOLS_FILE) as f:
    symbols = [line.strip() for line in f if line.strip()]

print(f"Fetching early data for {len(symbols)} symbols...")
client = PyZData(enctoken=ENCTOKEN)

success = []
failed = []

for old_sym in symbols:
    fetch_sym = NAME_MAPPING.get(old_sym, old_sym)
    print(f"Processing {old_sym} -> {fetch_sym}...")
    try:
        token = client.get_instrument_token(fetch_sym, "NSE")
        if not token:
            print(f"  No token for {fetch_sym}")
            failed.append(old_sym)
            continue
        df = client.get_data(token, START, END, Interval.MINUTE_1)
        if df is not None and not df.empty:
            out_path = os.path.join(OUTPUT_DIR, f"{old_sym}_early.csv")
            df.to_csv(out_path, index=False)
            print(f"  Saved {len(df)} rows")
            success.append(old_sym)
        else:
            print(f"  No data for {fetch_sym}")
            failed.append(old_sym)
    except Exception as e:
        print(f"  Error: {e}")
        failed.append(old_sym)
    time.sleep(0.5)

with open(SUCCESS_LOG, "w") as f:
    f.write("\n".join(success))
with open(FAILED_LOG, "w") as f:
    f.write("\n".join(failed))

print(f"✅ Early data fetched for {len(success)} symbols -> {OUTPUT_DIR}")
print(f"❌ Failed for {len(failed)} symbols -> {FAILED_LOG}")
