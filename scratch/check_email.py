from sqlalchemy import create_engine, text
import os

# Database connection URL
db_url = "postgresql://postgres.llejboqtnqlrnphcqtvm:Quan_jk_2026*@aws-0-sa-east-1.pooler.supabase.com:6543/postgres"
engine = create_engine(db_url)

email = "cartera@fergquimsas.com.co"

def search_email():
    with engine.connect() as conn:
        # Check profiles
        print(f"Searching for {email} in profiles...")
        result = conn.execute(text("SELECT * FROM profiles WHERE email = :email"), {"email": email}).fetchone()
        if result:
            print(f"Found in profiles: {result._asdict()}")
        else:
            print("Not found in profiles.")

        # Check for tenants/companies - let's see what tables exist first
        print("\nChecking for tenant/company related tables...")
        tables_query = text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND (table_name ILIKE '%tenant%' OR table_name ILIKE '%company%' OR table_name ILIKE '%org%')
        """)
        tables = conn.execute(tables_query).fetchall()
        for table in tables:
            table_name = table[0]
            print(f"Checking table: {table_name}")
            try:
                # Try to find email or name in these tables
                search_query = text(f"SELECT * FROM {table_name} WHERE email = :email OR name ILIKE '%Fergquim%'")
                row = conn.execute(search_query, {"email": email}).fetchone()
                if row:
                    print(f"Found in {table_name}: {row._asdict()}")
            except Exception as e:
                print(f"Could not search in {table_name}: {e}")

if __name__ == "__main__":
    search_email()
