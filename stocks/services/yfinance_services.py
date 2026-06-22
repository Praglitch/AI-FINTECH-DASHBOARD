import yfinance as yf
from datetime import datetime, timedelta
from django.utils import timezone
from stocks.models import PriceData
from .company_service import get_company_details_data


def get_yfinance_data(fincode, period="1y", interval="1d"):
    """
    Fetch OHLCV data for a company.
    - Check local DB first.
    - If missing or stale, fetch from Yahoo and store.
    """
    company = get_company_details_data(fincode)
    if not company:
        return None

    symbol = company["symbol"]
    ticker = f"{symbol}.NS"

    # --- 1. Determine date range from period ---
    now = timezone.now()
    if period.endswith('d'):
        days = int(period[:-1])
        start_date = now - timedelta(days=days)
    elif period.endswith('mo'):
        months = int(period[:-2])
        start_date = now - timedelta(days=months*30)
    elif period.endswith('y'):
        years = int(period[:-1])
        start_date = now - timedelta(days=years*365)
    else:
        start_date = now - timedelta(days=365)

    # --- 2. Query local DB ---
    local_data = PriceData.objects.filter(
        symbol=symbol,
        interval=interval,
        timestamp__gte=start_date
    ).order_by('timestamp')

    # --- 3. Check if we have fresh data ---
    # For 1m: if we have data from the last 2 days, assume it's fresh (since yfinance only gives 7 days)
    # For daily: if latest is today or yesterday, it's fresh
    is_fresh = False
    if local_data.exists():
        latest = local_data.last().timestamp
        if interval == '1m' and (now - latest).days <= 2:
            is_fresh = True
        elif interval == '1d' and (now - latest).days <= 1:
            is_fresh = True

    if is_fresh:
        return format_from_db(local_data, symbol, interval)

    # --- 4. Fetch missing data from Yahoo ---
    try:
        stock = yf.Ticker(ticker)
        history = stock.history(period=period, interval=interval, timeout=10)
    except Exception as e:
        print(f"Yahoo fetch error: {e}")
        if local_data.exists():
            return format_from_db(local_data, symbol, interval)
        return None

    if history.empty:
        return None

    # --- 5. Store fetched data into DB (upsert) ---
    for index, row in history.iterrows():
        PriceData.objects.update_or_create(
            symbol=symbol,
            interval=interval,
            timestamp=index.to_pydatetime(),
            defaults={
                'open': round(row['Open'], 2),
                'high': round(row['High'], 2),
                'low': round(row['Low'], 2),
                'close': round(row['Close'], 2),
                'volume': int(row['Volume']) if row['Volume'] else 0
            }
        )

    # --- 6. Fetch complete range from DB again ---
    complete_data = PriceData.objects.filter(
        symbol=symbol,
        interval=interval,
        timestamp__gte=start_date
    ).order_by('timestamp')

    return format_from_db(complete_data, symbol, interval)


def format_from_db(queryset, symbol, interval):
    """Convert PriceData queryset to the expected JSON format."""
    chart_data = []
    for item in queryset:
        if interval in ['1m','2m','5m','15m','30m','60m','90m','1h']:
            date_str = item.timestamp.strftime('%Y-%m-%d %H:%M:%S')
        else:
            date_str = item.timestamp.strftime('%Y-%m-%d')
        chart_data.append({
            "date": date_str,
            "open": item.open,
            "high": item.high,
            "low": item.low,
            "close": item.close,
            "volume": item.volume
        })

    # Fetch current price info from Yahoo (separate, not cached)
    try:
        ticker = f"{symbol}.NS"
        stock = yf.Ticker(ticker)
        info = stock.info
    except Exception:
        info = {}

    return {
        "ticker": f"{symbol}.NS",
        "current_price": info.get("currentPrice"),
        "market_cap": info.get("marketCap"),
        "pe_ratio": info.get("trailingPE"),
        "fifty_two_week_high": info.get("fiftyTwoWeekHigh"),
        "fifty_two_week_low": info.get("fiftyTwoWeekLow"),
        "volume": info.get("volume"),
        "chart_data": chart_data,
        "period": None,
        "interval": interval
    }