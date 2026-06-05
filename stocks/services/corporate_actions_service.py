from ..database.db_connection import get_connection


def get_company_corporate_actions_data(fincode):

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT
            sdate,
            details,
            amount,
            ratio1
        FROM corporate_actions_data
        WHERE fincode = %s
        ORDER BY sdate DESC
        LIMIT 10
    """, [fincode])

    rows = cur.fetchall()

    actions = []

    for row in rows:
        actions.append({
            "date": row[0].strftime("%d %b %Y") if row[0] else "",
            "details": row[1],
            "amount": row[2],
            "ratio": row[3]
        })

    cur.close()
    conn.close()

    return actions