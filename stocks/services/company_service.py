from ..database.db_connection import get_connection

def search_company_data(query):
    """
    Search company_master by partial name, symbol, or fincode.
    Returns list of {compname, symbol, fincode} for frontend dropdown.
    """
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT compname, symbol, fincode
        FROM company_master
        WHERE LOWER(compname) LIKE %s
           OR LOWER(symbol) LIKE %s
           OR CAST(fincode AS TEXT) LIKE %s
        LIMIT 10
    """, [
        f"%{query.lower()}%",
        f"%{query.lower()}%",
        f"%{query}%"
    ])
    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    return [{"compname": r[0], "symbol": r[1], "fincode": r[2]} for r in rows]


def get_company_details_data(fincode):
    """
    Fetch full company profile for a given fincode.
    Returns dict or None if not found.
    """
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT fincode, compname, s_name, symbol, industry, house,
               chairman, mdir, cosec, status, isin
        FROM company_master
        WHERE fincode = %s
        LIMIT 1
    """, [fincode])
    row = cursor.fetchone()
    cursor.close()
    conn.close()

    if not row:
        return None

    return {
        "fincode": row[0],
        "compname": row[1],
        "s_name": row[2],
        "symbol": row[3],
        "industry": row[4],
        "house": row[5],
        "chairman": row[6],
        "mdir": row[7],
        "cosec": row[8],
        "status": row[9],
        "isin": row[10]
    }