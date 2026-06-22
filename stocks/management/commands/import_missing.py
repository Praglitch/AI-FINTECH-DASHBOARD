import csv
from datetime import datetime
from django.core.management.base import BaseCommand
from stocks.models import PriceData

class Command(BaseCommand):
    help = 'Import missing files: BRIGADE_1min, COROMANDEL_1min, NIFTY50_INDEX'

    def handle(self, *args, **options):
        root = "/home/pratham/Django/stockapp/nifty data/nifty_data_collection/"
        missing_files = {
            'BRIGADE_1min': f'{root}nifty500_SCRIPS/BRIGADE_1min.csv',
            'COROMANDEL_1min': f'{root}nifty500_SCRIPS/COROMANDEL_1min.csv',
            'NIFTY50_INDEX': f'{root}nifty50_indexes/nifty50_index_1min.csv',
        }

        total = 0
        for symbol, filepath in missing_files.items():
            self.stdout.write(f"Importing {symbol} from {filepath}...")
            try:
                with open(filepath, 'r') as f:
                    reader = csv.DictReader(f)
                    rows = []
                    count = 0
                    for row in reader:
                        # Determine date column
                        if 'datetime' in row:
                            dt_str = row['datetime']
                        else:
                            dt_str = row['timestamp']
                        dt = datetime.strptime(dt_str.split('+')[0], '%Y-%m-%d %H:%M:%S')

                        rows.append(PriceData(
                            symbol=symbol,
                            interval='1m',
                            timestamp=dt,
                            open=float(row['open']),
                            high=float(row['high']),
                            low=float(row['low']),
                            close=float(row['close']),
                            volume=int(float(row['volume'])) if row['volume'] else 0
                        ))
                        count += 1
                        if len(rows) >= 5000:
                            PriceData.objects.bulk_create(rows, ignore_conflicts=True)
                            total += len(rows)
                            rows = []
                    if rows:
                        PriceData.objects.bulk_create(rows, ignore_conflicts=True)
                        total += len(rows)
                    self.stdout.write(self.style.SUCCESS(f"✅ Imported {count} rows for {symbol}"))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"❌ Error importing {symbol}: {e}"))

        self.stdout.write(self.style.SUCCESS(f"🎉 Total rows imported: {total}"))
