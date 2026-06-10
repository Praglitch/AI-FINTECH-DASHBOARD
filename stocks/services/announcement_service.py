from ..database.db_connection import get_connection
from .pdf_cache_service import get_or_create_pdf_cache


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
            newsid,
            attachmenturl,
            caption,
            datetime
        FROM bse_announcements
        WHERE scripcode = %s
        ORDER BY datetime DESC
        LIMIT 10
    """, [scripcode])

    rows = cursor.fetchall()

    announcements = []

    for row in rows:
        newsid = row[0]
        attachment_url = row[1]
        caption = row[2]
        datetime_val = row[3]

        # 🔥 NEW: Trigger PDF cache for announcements with attachments
        if attachment_url:
            print(f"Processing PDF for newsid: {newsid}")
            get_or_create_pdf_cache(newsid, scripcode, attachment_url)

        announcements.append({
            "newsid": newsid,
            "caption": caption,
            "datetime": datetime_val.strftime("%d %b %Y %H:%M")
        })

    cursor.close()
    conn.close()

    return announcements