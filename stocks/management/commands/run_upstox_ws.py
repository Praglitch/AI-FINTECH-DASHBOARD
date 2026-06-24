import asyncio
import json
import ssl
import logging
import aiohttp
from django.core.management.base import BaseCommand
from django.utils import timezone
from asgiref.sync import sync_to_async
from stocks.models import LivePriceSnapshot, InstrumentKeyMapping
from stocks.services.upstox_service import get_valid_access_token
import websockets

try:
    from stocks.proto import MarketDataFeedV3_pb2 as market_feed
except ImportError:
    raise ImportError(
        "Protobuf module not found. Please compile MarketDataFeedV3.proto "
        "and place the generated _pb2.py in stocks/proto/"
    )

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = "Connect to Upstox WebSocket V3 and ingest real‑time market data"

    def add_arguments(self, parser):
        parser.add_argument(
            '--instrument-keys',
            nargs='+',
            type=str,
            default=['NSE_EQ|INE002A01018'],
            help='List of Upstox instrument keys to subscribe to'
        )
        parser.add_argument(
            '--mode',
            type=str,
            default='ltpc',
            choices=['ltpc', 'full', 'quote'],
            help='Subscription mode'
        )

    def handle(self, *args, **options):
        instrument_keys = options['instrument_keys']
        mode = options['mode']
        asyncio.run(self.run_websocket(instrument_keys, mode))

    async def run_websocket(self, instrument_keys, mode):
        while True:
            try:
                token = await sync_to_async(get_valid_access_token)()
                if not token:
                    self.stderr.write("❌ Could not obtain access token.")
                    await asyncio.sleep(10)
                    continue

                auth_url = "https://api.upstox.com/v3/feed/market-data-feed/authorize"
                headers = {
                    "Authorization": f"Bearer {token}",
                    "Accept": "application/json"
                }
                async with aiohttp.ClientSession() as session:
                    async with session.get(auth_url, headers=headers) as resp:
                        if resp.status != 200:
                            text = await resp.text()
                            self.stderr.write(f"Authorization failed: {text}")
                            await asyncio.sleep(10)
                            continue
                        data = await resp.json()
                        if data.get("status") != "success":
                            self.stderr.write(f"API error: {data}")
                            await asyncio.sleep(10)
                            continue
                        ws_url = data["data"]["authorized_redirect_uri"]
                        self.stdout.write(f"🔗 Obtained WebSocket URL: {ws_url}")

                ssl_context = ssl.create_default_context()
                async with websockets.connect(ws_url, ssl=ssl_context) as websocket:
                    self.stdout.write("✅ WebSocket connected")

                    sub_msg = {
                        "guid": "stockai-sub-001",
                        "method": "sub",
                        "data": {
                            "mode": mode,
                            "instrumentKeys": instrument_keys
                        }
                    }
                    binary_payload = json.dumps(sub_msg).encode('utf-8')
                    await websocket.send(binary_payload)
                    self.stdout.write(f"📡 Subscribed to {len(instrument_keys)} instruments (binary)")

                    async for message in websocket:
                        feed = market_feed.FeedResponse()
                        feed.ParseFromString(message)
                        await self.process_feed(feed)

            except websockets.ConnectionClosed:
                self.stderr.write("⚠️ WebSocket connection closed. Reconnecting in 5s...")
                await asyncio.sleep(5)
            except Exception as e:
                self.stderr.write(f"❌ Error: {e}. Retrying in 10s...")
                await asyncio.sleep(10)

    async def process_feed(self, feed):
        for instrument_key, feed_data in feed.feeds.items():
            if not feed_data.HasField('ltpc'):
                continue
            ltp = feed_data.ltpc.ltp
            if ltp is None:
                continue

            volume = feed_data.ltpc.ltq if feed_data.ltpc.ltq > 0 else None

            symbol = await self.map_key_to_symbol(instrument_key)
            if not symbol:
                self.stdout.write(f"⚠️ No mapping found for key: {instrument_key}")
                continue

            await sync_to_async(LivePriceSnapshot.objects.update_or_create, thread_sensitive=True)(
                symbol=symbol,
                defaults={
                    'price': ltp,
                    'volume': volume,
                    'timestamp': timezone.now(),
                    'source': 'upstox_ws'
                }
            )
            self.stdout.write(f"🔄 Updated {symbol} @ {ltp} (vol: {volume})")

    async def map_key_to_symbol(self, instrument_key):
        """
        Get symbol from InstrumentKeyMapping. If duplicates exist, return the first.
        """
        try:
            # Use filter().first() to avoid MultipleObjectsReturned
            mapping = await sync_to_async(
                lambda: InstrumentKeyMapping.objects.filter(upstox_key=instrument_key).first(),
                thread_sensitive=True
            )()
            return mapping.symbol if mapping else None
        except Exception as e:
            self.stdout.write(f"⚠️ Error mapping key {instrument_key}: {e}")
            return None
        