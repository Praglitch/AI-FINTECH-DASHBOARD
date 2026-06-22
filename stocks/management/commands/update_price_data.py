import yfinance as yf
from django.core.management.base import BaseCommand
from stocks.models import PriceData

class Command(BaseCommand):
    help = 'Update 1-minute price data for all symbols from Yahoo Finance'

    def handle(self, *args, **options):
        # Get distinct symbols from PriceData
        symbols = PriceData.objects.values_list('symbol', flat=True).distinct()
        self.stdout.write(f"Updating {len(symbols)} symbols...")

        for symbol in symbols:
            ticker = f"{symbol}.NS"
            self.stdout.write(f"Fetching {ticker}...")
            try:
                data = yf.Ticker(ticker).history(period='7d', interval='1m')
                if data.empty:
                    self.stdout.write(f"  ⚠️ No data for {ticker}")
                    continue

                count = 0
                for index, row in data.iterrows():
                    _, created = PriceData.objects.update_or_create(
                        symbol=symbol,
                        interval='1m',
                        timestamp=index.to_pydatetime(),
                        defaults={
                            'open': round(row['Open'], 2),
                            'high': round(row['High'], 2),
                            'low': round(row['Low'], 2),
                            'close': round(row['Close'], 2),
                            'volume': int(row['Volume']) if row['Volume'] else 0
                        }
                    )
                    if created:
                        count += 1
                self.stdout.write(f"  ✅ {ticker}: {count} new rows")
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"  ❌ {ticker}: {e}"))

        self.stdout.write(self.style.SUCCESS("✅ Daily update complete"))