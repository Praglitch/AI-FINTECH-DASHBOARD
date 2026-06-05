from ..database.db_connection import get_connection


def get_company_shareholding_data(fincode):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT
            date_end,
            tpftotalpromoter,
            tptotalpublic,
            tpinmfuti,
            tpinforeignportinv
        FROM shpsummary
        WHERE fincode = %s
        ORDER BY date_end DESC
        LIMIT 1
    """, [fincode])

    row = cursor.fetchone()

    cursor.close()
    conn.close()

    if not row:
        return None

    return {
        "date_end": row[0],
        "promoter": row[1],
        "public": row[2],
        "mutual_fund": row[3],
        "fpi": row[4]
    }