from ..database.db_connection import get_connection


def get_bulk_deals_data(fincode):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT
            date,
            clientname,
            dealtype,
            volume,
            price
        FROM bse_bulk_deals
        WHERE fincode = %s
        ORDER BY date DESC
        LIMIT 20
    """, [fincode])

    rows = cursor.fetchall()

    cursor.close()
    conn.close()

    deals = []

    for row in rows:

        deals.append({
            "date": str(row[0]),
            "client": row[1],
            "deal_type": row[2],
            "volume": row[3],
            "price": row[4]
        })

    return deals