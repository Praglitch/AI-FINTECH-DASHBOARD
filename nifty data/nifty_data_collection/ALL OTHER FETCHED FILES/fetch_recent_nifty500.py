import os, time
import pandas as pd
from pyzdata import PyZData, Interval

# ===== ALL KNOWN SYMBOL CORRECTIONS =====
NAME_MAPPING = {
    "AKZOINDIA": "JSWDULUX",
    "MMFIN": "M&MFIN",
    "MM": "M&M",
    "GSPL": "GUJGASLTD",
    "DBREALTY": "DBREALTY-BE",   # corrected from earlier error
    "GVTD": "GVT&D",
    "JKBANK": "J&KBANK",
    "LTIM": "LTM",
    "AREM": "ARE&M",
    # Add any others discovered later
}

ENCTOKEN = "4taoScLRP8w4ULISplRBGsgo+K5BmdvRIDKut2ReOdvFGHv/tWfcGqc6nm23fiPJ4gpPhJ3XYDpktExHTdrcxfIJbwqexwshUORGmISJ9O/vUDWvBqukPg=="   # <-- REPLACE
START = "2026-04-09"
END = "2026-06-11"
SYMBOLS_FILE = "symbols_nifty500.txt"
OUTPUT_DIR = "temp_recent_fetched"
SUCCESS_LOG = "recent_success.txt"
MISSING_LOG = "missing_recent.txt"

os.makedirs(OUTPUT_DIR, exist_ok=True)

with open(SYMBOLS_FILE) as f:
    symbols = [line.strip() for line in f if line.strip()]

print(f"Total symbols: {len(symbols)}")
client = PyZData(enctoken=ENCTOKEN)

success = []
missing = []

for idx, old_sym in enumerate(symbols, 1):
    out_path = os.path.join(OUTPUT_DIR, f"{old_sym}_recent.csv")
    if os.path.exists(out_path):
        print(f"[{idx}/{len(symbols)}] Skipping {old_sym} (already fetched)")
        success.append(old_sym)   # assume existing file is good
        continue

    fetch_sym = NAME_MAPPING.get(old_sym, old_sym)
    print(f"[{idx}/{len(symbols)}] Processing {old_sym} -> {fetch_sym}...")
    try:
        token = client.get_instrument_token(fetch_sym, "NSE")
        if not token:
            print(f"  No token for {fetch_sym}")
            missing.append(old_sym)
            continue
        df = client.get_data(token, START, END, Interval.MINUTE_1)
        if df is not None and not df.empty:
            df.to_csv(out_path, index=False)
            print(f"  Saved {len(df)} rows")
            success.append(old_sym)
        else:
            print(f"  No data for {fetch_sym}")
            missing.append(old_sym)
    except Exception as e:
        print(f"  Error: {e}")
        missing.append(old_sym)
    time.sleep(0.5)

# Write logs
with open(SUCCESS_LOG, "w") as f:
    f.write("\n".join(success))
with open(MISSING_LOG, "w") as f:
    f.write("\n".join(missing))

print(f"\nDone. Success: {len(success)}, Missing: {len(missing)}")
print(f"Success list saved to {SUCCESS_LOG}")
print(f"Missing list saved to {MISSING_LOG}")