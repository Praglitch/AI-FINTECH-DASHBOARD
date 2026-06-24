import csv
import requests
from django.core.management.base import BaseCommand
from stocks.models import InstrumentKeyMapping

class Command(BaseCommand):
    help = "Download Upstox instrument master CSV and populate InstrumentKeyMapping"

    def handle(self, *args, **options):
        # Upstox provides a static CSV file updated daily
        url = "https://assets.upstox.com/market-quote/instruments/file/NSE_EQ.csv"
        self.stdout.write("📥 Downloading instrument master CSV from Upstox...")

        try:
            resp = requests.get(url, timeout=30)
            resp.raise_for_status()
        except requests.RequestException as e:
            self.stderr.write(f"❌ Download failed: {e}")
            return

        # Parse CSV
        lines = resp.text.splitlines()
        reader = csv.DictReader(lines)

        # Determine column names (may vary, but typically 'SYMBOL' and 'INSTRUMENT_KEY')
        # Common columns: SYMBOL, TRADING_SYMBOL, INSTRUMENT_KEY, TOKEN
        # We'll use the first row to detect.
        fieldnames = reader.fieldnames
        self.stdout.write(f"📋 CSV columns: {fieldnames}")

        # Map known column names
        symbol_col = None
        key_col = None
        for col in fieldnames:
            if col.upper() in ('SYMBOL', 'TRADING_SYMBOL'):
                symbol_col = col
            if col.upper() in ('INSTRUMENT_KEY', 'TOKEN'):
                key_col = col

        if not symbol_col or not key_col:
            self.stderr.write(f"❌ Could not find symbol/key columns in CSV. Found: {fieldnames}")
            return

        # Build mapping
        symbol_to_key = {}
        for row in reader:
            symbol = row.get(symbol_col)
            key = row.get(key_col)
            if symbol and key:
                symbol_to_key[symbol] = key

        self.stdout.write(f"✅ Parsed {len(symbol_to_key)} instruments")

        # Now match with company_master symbols
        from stocks.services.company_service import get_connection
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT symbol FROM company_master WHERE symbol IS NOT NULL")
        rows = cursor.fetchall()

        updated = 0
        not_found = []
        for (symbol,) in rows:
            if not symbol:
                continue
            if symbol in symbol_to_key:
                obj, created = InstrumentKeyMapping.objects.update_or_create(
                    symbol=symbol,
                    defaults={"upstox_key": symbol_to_key[symbol]}
                )
                updated += 1
                self.stdout.write(f"✅ {'Added' if created else 'Updated'} {symbol} → {symbol_to_key[symbol]}")
            else:
                not_found.append(symbol)

        self.stdout.write(f"\n✅ Updated {updated} mappings.")
        if not_found:
            self.stdout.write(f"⚠️ Could not find keys for {len(not_found)} symbols.")
            # Print first 10 missing as sample
            self.stdout.write("Missing (sample): " + ", ".join(not_found[:10]))

        cursor.close()
        conn.close()