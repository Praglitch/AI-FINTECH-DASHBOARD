from ..database.db_connection import get_connection


def get_company_announcements_data(fincode):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT scripcode
        FROM company_master
        WHERE fincode = %s
        LIMIT 1
    """, [fincode])

    company = cursor.fetchone()

    if not company:
        cursor.close()
        conn.close()
        return None

    scripcode = company[0]

    cursor.execute("""
        SELECT
            caption,
            datetime
        FROM bse_announcements
        WHERE scripcode = %s
        ORDER BY datetime DESC
        LIMIT 10
    """, [scripcode])

    rows = cursor.fetchall()

    cursor.close()
    conn.close()

    announcements = []

    for row in rows:
        announcements.append({
            "caption": row[0],
            "datetime": row[1].strftime("%d %b %Y %H:%M")
        })

    return announcements