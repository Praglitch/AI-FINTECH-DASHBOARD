from ..database.db_connection import get_connection


def get_company_news_data(fincode):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT
            heading,
            date
        FROM news_master
        WHERE fincode = %s
        ORDER BY date DESC
        LIMIT 10
    """, [str(fincode)])

    rows = cursor.fetchall()

    cursor.close()
    conn.close()

    news = []

    for row in rows:
        news.append({
            "heading": row[0],
            "date": row[1].strftime("%d %b %Y")
        })

    return news