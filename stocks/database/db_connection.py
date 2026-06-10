import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def get_connection():
    """
    Returns a raw psycopg2 connection to the external Accord database.
    The caller MUST close the connection and cursor after use.
    """
    return psycopg2.connect(
        host=os.getenv("DB_HOST"),
        database=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD")
    )