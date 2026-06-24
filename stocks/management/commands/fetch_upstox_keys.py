import time
import requests
from django.core.management.base import BaseCommand
from stocks.models import InstrumentKeyMapping
from stocks.services.upstox_service import get_valid_access_token
from stocks.services.company_service import get_connection

class Command(BaseCommand):
    help = "Fetch Upstox instrument keys for all companies using Search API"

    def handle(self, *args, **options):
        # 1. Get a valid token
        token = get_valid_access_token()
        if not token:
            self.stderr.write("❌ Could not obtain access token.")
            return

        # 2. Fetch all symbols from company_master
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT symbol FROM company_master WHERE symbol IS NOT NULL")
        rows = cursor.fetchall()
        cursor.close()
        conn.close()

        self.stdout.write(f"📋 Found {len(rows)} symbols to process.")

        updated = 0
        not_found = []

        # 3. For each symbol, call the Search API
        for (symbol,) in rows:
            if not symbol:
                continue

            # Skip if already mapped
            if InstrumentKeyMapping.objects.filter(symbol=symbol).exists():
                continue

            key = self.get_instrument_key(symbol, token)
            if key:
                InstrumentKeyMapping.objects.create(
                    symbol=symbol,
                    upstox_key=key
                )
                self.stdout.write(f"✅ {symbol} → {key}")
                updated += 1
            else:
                self.stdout.write(f"❌ Could not find key for {symbol}")
                not_found.append(symbol)

            # Avoid rate limits – 0.5 second between requests
            time.sleep(0.5)

        self.stdout.write(f"\n✅ Completed: {updated} symbols mapped.")
        if not_found:
            self.stdout.write(f"⚠️ {len(not_found)} symbols not found.")
            self.stdout.write("Sample missing: " + ", ".join(not_found[:10]))

    def get_instrument_key(self, symbol, token):
        """Call Upstox Search API and return the instrument_key."""
        url = "https://api.upstox.com/v2/instruments/search"
        params = {
            "query": symbol,
            "exchanges": "NSE",
            "segments": "EQ",
            "records": 5
        }
        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/json"
        }

        try:
            resp = requests.get(url, params=params, headers=headers, timeout=10)
            if resp.status_code != 200:
                return None
            data = resp.json()
            if data.get("status") != "success":
                return None
            items = data.get("data", [])
            # Prefer exact match on trading_symbol
            for item in items:
                if item.get("trading_symbol") == symbol:
                    return item.get("instrument_key")
            # Fallback: return the first key if any
            if items:
                return items[0].get("instrument_key")
            return None
        except Exception as e:
            self.stderr.write(f"Error searching {symbol}: {e}")
            return None