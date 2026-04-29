from sqlalchemy import create_engine, text
import os

db_url = "postgresql://postgres.llejboqtnqlrnphcqtvm:Quan_jk_2026*@aws-0-sa-east-1.pooler.supabase.com:5432/postgres"
engine = create_engine(db_url)

def check_triggers():
    with engine.connect() as conn:
        print("Checking triggers on auth.users...")
        # Since auth schema is restricted, we might not see it from public connection easily
        # but let's try
        query = text("""
            SELECT trigger_name, event_manipulation, event_object_table, action_statement
            FROM information_schema.triggers
            WHERE event_object_schema = 'auth'
        """)
        try:
            results = conn.execute(query).fetchall()
            for row in results:
                print(row)
        except Exception as e:
            print(f"Error checking triggers: {e}")

        print("\nChecking function definition for handle_new_user...")
        query_func = text("""
            SELECT routine_definition 
            FROM information_schema.routines 
            WHERE routine_name = 'handle_new_user' 
            AND routine_schema = 'public'
        """)
        func = conn.execute(query_func).fetchone()
        if func:
            print(func[0])
        else:
            print("Function handle_new_user not found in public schema.")

if __name__ == "__main__":
    check_triggers()
