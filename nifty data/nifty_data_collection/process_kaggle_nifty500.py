import os
import pandas as pd

KAGGLE_DIR = "/home/pratham/Downloads/NIFTY500"
SYMBOLS_FILE = "symbols_nifty500.txt"
OUTPUT_DIR = "temp_kaggle_filtered"
START_DATE = "2026-03-01"
END_DATE = "2026-04-08"

os.makedirs(OUTPUT_DIR, exist_ok=True)

with open(SYMBOLS_FILE) as f:
    symbols = [line.strip() for line in f if line.strip()]

print(f"Processing {len(symbols)} symbols from Kaggle...")

for sym in symbols:
    kaggle_file = os.path.join(KAGGLE_DIR, f"{sym}_minute.csv")
    if not os.path.exists(kaggle_file):
        print(f"Missing Kaggle file for {sym}")
        continue
    df = pd.read_csv(kaggle_file)
    # Rename 'date' column to 'datetime' for consistency
    if 'date' in df.columns:
        df = df.rename(columns={'date': 'datetime'})
    else:
        print(f"No 'date' column in {sym}_minute.csv, skipping")
        continue
    df['datetime'] = pd.to_datetime(df['datetime'])
    mask = (df['datetime'] >= START_DATE) & (df['datetime'] <= END_DATE)
    filtered = df.loc[mask].copy()
    if not filtered.empty:
        out_path = os.path.join(OUTPUT_DIR, f"{sym}_kaggle.csv")
        filtered.to_csv(out_path, index=False)
        print(f"Saved {len(filtered)} rows for {sym}")
    else:
        print(f"No data in range for {sym}")

print("Done. Kaggle filtered files in", OUTPUT_DIR)