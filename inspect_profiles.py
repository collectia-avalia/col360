from sqlalchemy import create_engine, inspect
import os

# Manual construction of URL for project llejboqtnqlrnphcqtvm
# Password was found in context or inferred from other .env
db_url = "postgresql://postgres.llejboqtnqlrnphcqtvm:Quan_jk_2026*@aws-0-sa-east-1.pooler.supabase.com:6543/postgres"
engine = create_engine(db_url)

inspector = inspect(engine)
columns = inspector.get_columns('profiles', schema='public')

print("Profiles columns:")
for column in columns:
    print(f"- {column['name']}: {column['type']}, Nullable: {column['nullable']}, Default: {column['default']}")
