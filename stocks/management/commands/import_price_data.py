import csv
import os
from datetime import datetime
from django.core.management.base import BaseCommand
from stocks.models import PriceData

# Only these folder names will be processed
ALLOWED_FOLDERS = ['nifty50_SCRIPS', 'nifty50_indexes', 'nifty500_SCRIPS', 'nifty500_indexes']

class Command(BaseCommand):
    help = 'Import 1-minute OHLCV data from CSV files into PriceData'

    def add_arguments(self, parser):
        parser.add_argument('--path', required=True, help='Path to folder containing the four data folders')

    def handle(self, *args, **options):
        root_folder = options['path']
        total = 0

        # Walk through all subdirectories
        for dirpath, dirnames, filenames in os.walk(root_folder):
            # Only process if the folder name is in our allowed list
            folder_name = os.path.basename(dirpath)
            if folder_name not in ALLOWED_FOLDERS:
                continue

            self.stdout.write(f"📁 Processing folder: {folder_name}")

            for filename in filenames:
                if not filename.endswith('.csv'):
                    continue

                symbol = filename.replace('.csv', '')
                filepath = os.path.join(dirpath, filename)
                self.stdout.write(f"  📂 Importing {symbol}...")

                try:
                    with open(filepath, 'r') as f:
                        reader = csv.DictReader(f)
                        rows = []
                        row_count = 0

                        for row in reader:
                            # Ensure required columns exist
                            if not all(k in row for k in ['datetime', 'open', 'high', 'low', 'close', 'volume']):
                                self.stdout.write(self.style.ERROR(f"    ❌ Missing columns in {filepath}. Skipping file."))
                                break

                            dt = datetime.strptime(row['datetime'], '%Y-%m-%d %H:%M:%S')
                            rows.append(PriceData(
                                symbol=symbol,
                                interval='1m',
                                timestamp=dt,
                                open=float(row['open']),
                                high=float(row['high']),
                                low=float(row['low']),
                                close=float(row['close']),
                                volume=int(row['volume']) if row['volume'] else 0
                            ))
                            row_count += 1

                            if len(rows) >= 5000:
                                PriceData.objects.bulk_create(rows, ignore_conflicts=True)
                                total += len(rows)
                                rows = []

                        if rows:
                            PriceData.objects.bulk_create(rows, ignore_conflicts=True)
                            total += len(rows)

                        self.stdout.write(self.style.SUCCESS(f"    ✅ Imported {symbol}: {row_count} rows"))
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"    ❌ Error importing {symbol}: {e}"))

        self.stdout.write(self.style.SUCCESS(f"🎉 Total rows imported: {total}"))