from distro import info
import yfinance as yf

from .company_service import get_company_details_data


def get_yfinance_data(fincode):

    company = get_company_details_data(fincode)

    print("COMPANY:", company)

    if not company:
        return None

    symbol = company["symbol"]

    print("SYMBOL:", symbol)

    ticker = f"{symbol}.NS"

    print("TICKER:", ticker)

    stock = yf.Ticker(ticker)

    info = stock.info
    history = stock.history(period="6mo")
    info.get("recommendationKey")
    info.get("averageAnalystRating")
    info.get("regularMarketChangePercent")

    
    chart_data = []
    
    for index, row in history.iterrows():

            chart_data.append({
                "date": str(index.date()),
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
        
}
    