from ..database.db_connection import get_connection


def get_company_financials_data(fincode):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT
            year_end,
            net_sales,
            operating_profit,
            profit_after_tax,
            reported_eps,
            dividend_perc
        FROM finance_cons_pl
        WHERE fincode = %s
        ORDER BY year_end DESC
        LIMIT 1
    """, [str(fincode)])

    row = cursor.fetchone()

    cursor.close()
    conn.close()

    if not row:
        return None

    return {
        "year_end": row[0],
        "net_sales": row[1],
        "operating_profit": row[2],
        "profit_after_tax": row[3],
        "reported_eps": row[4],
        "dividend_perc": row[5]
    }