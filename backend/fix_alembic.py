import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()
db_url = os.environ.get("DATABASE_URL")
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

engine = create_engine(db_url)
with engine.connect() as conn:
    conn.execute(text("UPDATE alembic_version SET version_num='8249f29e97d8'"))
    conn.commit()
    print("Alembic version fixed in PostgreSQL.")
