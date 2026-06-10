import yfinance as yf
from .company_service import get_company_details_data

def get_yfinance_data(fincode, period="1y", interval="1mo"):
    company = get_company_details_data(fincode)
    if not company:
        return None
    symbol = company["symbol"]
    ticker = f"{symbol}.NS"
    stock = yf.Ticker(ticker)
    info = stock.info
    history = stock.history(period=period, interval=interval)

    chart_data = []
    for index, row in history.iterrows():
        if interval in ['1m','2m','5m','15m','30m','60m','90m','1h']:
            date_str = index.strftime('%Y-%m-%d %H:%M:%S')
        else:
            date_str = str(index.date())
        chart_data.append({
            "date": date_str,
            "open": round(row["Open"], 2),
            "high": round(row["High"], 2),
            "low": round(row["Low"], 2),
            "close": round(row["Close"], 2),
            "volume": int(row["Volume"])
        })

    return {
        "ticker": ticker,
        "current_price": info.get("currentPrice"),
        "market_cap": info.get("marketCap"),
        "pe_ratio": info.get("trailingPE"),
        "fifty_two_week_high": info.get("fiftyTwoWeekHigh"),
        "fifty_two_week_low": info.get("fiftyTwoWeekLow"),
        "volume": info.get("volume"),
        "chart_data": chart_data,
        "period": period,
        "interval": interval
    }