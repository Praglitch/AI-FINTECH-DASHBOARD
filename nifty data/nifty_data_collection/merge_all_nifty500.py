import os
import pandas as pd

# Directories
KAGGLE_DIR = "temp_kaggle_filtered"      # files: {sym}_kaggle.csv
EARLY_DIR = "temp_early_fetched"         # files: {sym}_early.csv
RECENT_DIR = "temp_recent_fetched"       # files: {sym}_recent.csv
FINAL_DIR = "nifty500/final"

os.makedirs(FINAL_DIR, exist_ok=True)

# Get all symbols from the recent fetch (all 531 symbols)
# Alternatively, use symbols_nifty500.txt
SYMBOLS_FILE = "symbols_nifty500.txt"
with open(SYMBOLS_FILE) as f:
    symbols = [line.strip() for line in f if line.strip()]

print(f"Processing {len(symbols)} symbols...")

for sym in symbols:
    dfs = []

    # 1. Load Kaggle filtered (if exists) – covers 1 Mar – 8 Apr
    kaggle_path = os.path.join(KAGGLE_DIR, f"{sym}_kaggle.csv")
    if os.path.exists(kaggle_path):
        df_k = pd.read_csv(kaggle_path)
        df_k['datetime'] = pd.to_datetime(df_k['datetime'])
        dfs.append(df_k)

    # 2. Load early fetched (if exists) – also 1 Mar – 8 Apr, for missing symbols
    early_path = os.path.join(EARLY_DIR, f"{sym}_early.csv")
    if os.path.exists(early_path):
        df_e = pd.read_csv(early_path)
        df_e['datetime'] = pd.to_datetime(df_e['datetime'])
        dfs.append(df_e)

    # 3. Load recent fetched (always exists for all symbols) – 9 Apr – 11 Jun
    recent_path = os.path.join(RECENT_DIR, f"{sym}_recent.csv")
    if os.path.exists(recent_path):
        df_r = pd.read_csv(recent_path)
        df_r['datetime'] = pd.to_datetime(df_r['datetime'])
        dfs.append(df_r)

    if not dfs:
        print(f"No data for {sym}")
        continue

    # Merge all available data (concat, deduplicate, sort)
    merged = pd.concat(dfs, ignore_index=True)
    merged = merged.drop_duplicates(subset=['datetime']).sort_values('datetime')

    # Save final CSV
    out_path = os.path.join(FINAL_DIR, f"{sym}_1min.csv")
    merged.to_csv(out_path, index=False)
    print(f"{sym}: {len(merged)} rows")

print("All done. Final files in", FINAL_DIR)
