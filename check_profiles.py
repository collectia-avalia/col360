import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv('c:/Users/c_pal/Antigravity/1.Automatizacion_Pasarelas/payment_gateway_etl/.env')
db_url = os.getenv('DATABASE_URL')
engine = create_engine(db_url)

with engine.connect() as conn:
    print("Checking profiles table...")
    res = conn.execute(text("SELECT id, email, company_name, role FROM public.profiles"))
    rows = res.fetchall()
    for row in rows:
        print(f"ID: {row[0]}, Email: {row[1]}, Company: {row[2]}, Role: {row[3]}")
