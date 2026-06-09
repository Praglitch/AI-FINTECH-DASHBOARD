from ..database.db_connection import get_connection


def get_insider_trading_data(fincode):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT
            trader,
            transtype,
            quantitybuy,
            quantitysell,
            transdatefrom,
            transdateto
        FROM insider_trading
        WHERE fincode = %s
        ORDER BY processdate DESC
        LIMIT 20
    """, [fincode])

    rows = cursor.fetchall()

    cursor.close()
    conn.close()

    data = []

    for row in rows:

        data.append({
            "trader": row[0],
            "transaction_type": row[1],
            "quantity_buy": row[2],
            "quantity_sell": row[3],
            "from_date": str(row[4]),
            "to_date": str(row[5])
        })

    return data