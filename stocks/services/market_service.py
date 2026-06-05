from ..database.db_connection import get_connection


def get_company_market_data(fincode):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT
            open,
            high,
            low,
            close,
            volume,
            value,
            month,
            year
        FROM monthlyprice
        WHERE fincode = %s
        ORDER BY year DESC, month DESC
        LIMIT 1
    """, [fincode])

    row = cursor.fetchone()

    cursor.close()
    conn.close()

    if not row:
        return None

    return {
        "open": row[0],
        "high": row[1],
        "low": row[2],
        "close": row[3],
        "volume": row[4],
        "value": row[5],
        "month": row[6],
        "year": row[7]
    }