import psycopg2
try:
    conn = psycopg2.connect("postgresql://postgres.llejboqtnqlrnphcqtvm:Quan_jk_2026*@aws-0-sa-east-1.pooler.supabase.com:6543/postgres")
    print("Success!")
    conn.close()
except Exception as e:
    print(f"Error: {e}")
