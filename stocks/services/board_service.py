from ..database.db_connection import get_connection


def get_board_of_directors_data(fincode):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT
            dirname,
            reported_dsg
        FROM board_of_directors
        WHERE fincode = %s
        ORDER BY serialno
    """, [fincode])

    rows = cursor.fetchall()

    cursor.close()
    conn.close()

    directors = []

    for row in rows:

        directors.append({
            "name": row[0],
            "designation": row[1]
        })

    return directors