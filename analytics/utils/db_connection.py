import os
import urllib.parse
from pathlib import Path
from dotenv import load_dotenv
import psycopg2
import psycopg2.extras
from psycopg2 import pool
from contextlib import contextmanager

# Load environment variables from analytics/.env, backend/.env, or root .env
env_paths = [
    Path(__file__).resolve().parent.parent / ".env",
    Path(__file__).resolve().parent.parent.parent / "backend" / ".env",
    Path(__file__).resolve().parent.parent.parent / ".env"
]
for p in env_paths:
    if p.exists():
        load_dotenv(p)
        break

DATABASE_URL = os.getenv("DATABASE_URL")

connection_pool = None

if DATABASE_URL:
    try:
        db_url = DATABASE_URL
        if "supabase.co" in db_url or "pooler.supabase.com" in db_url:
            if "sslmode" not in db_url:
                db_url += "?sslmode=require" if "?" not in db_url else "&sslmode=require"
            
        connection_pool = psycopg2.pool.SimpleConnectionPool(1, 10, db_url, connect_timeout=5)
        print("[Analytics DB] Connected to Supabase PostgreSQL Database successfully.")
    except Exception as e:
        print(f"[Analytics DB] Database connection offline ({e.__class__.__name__}). Running in standalone dataset processing mode.")
        connection_pool = None
else:
    print("[Analytics DB] Active in standalone dataset processing mode.")

@contextmanager
def get_db_connection():
    if not connection_pool:
        raise Exception("Database connection pool is not initialized (operating in standalone mode)")
    
    conn = connection_pool.getconn()
    try:
        yield conn
    finally:
        connection_pool.putconn(conn)

def execute_query(sql, params=None):
    if not connection_pool:
        return
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, params)
            conn.commit()

def fetch_one(sql, params=None):
    if not connection_pool:
        return None
    with get_db_connection() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
            cur.execute(sql, params)
            return cur.fetchone()

def fetch_all(sql, params=None):
    if not connection_pool:
        return []
    with get_db_connection() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
            cur.execute(sql, params)
            return cur.fetchall()
