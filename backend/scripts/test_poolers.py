import psycopg2
import urllib.parse

password = urllib.parse.quote_plus("#shravan123456789@")
project_ref = "llizggrehojvloltegve"
user = f"postgres.{project_ref}"

regions = [
    "aws-0-ap-south-1.pooler.supabase.com",      # Mumbai / India
    "aws-0-ap-southeast-1.pooler.supabase.com",  # Singapore
    "aws-0-us-east-1.pooler.supabase.com",       # N. Virginia
    "aws-0-eu-central-1.pooler.supabase.com",    # Frankfurt
    "aws-0-us-west-1.pooler.supabase.com",       # N. California
    "aws-0-ap-northeast-1.pooler.supabase.com",  # Tokyo
]

for host in regions:
    for port in [6543, 5432]:
        uri = f"postgresql://{user}:{password}@{host}:{port}/postgres?sslmode=require"
        print(f"Testing {host}:{port} ...")
        try:
            conn = psycopg2.connect(uri, connect_timeout=4)
            cur = conn.cursor()
            cur.execute("SELECT current_database(), current_user, version();")
            res = cur.fetchone()
            print(f"\n==========================================")
            print(f"SUCCESS CONNECTED via {host}:{port}!")
            print(f"Result: {res}")
            print(f"WORKING CONNECTION URI:")
            print(uri)
            print(f"==========================================\n")
            conn.close()
            exit(0)
        except Exception as e:
            print(f"  -> Error: {e}")
