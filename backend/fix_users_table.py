from app.dependencies import engine
from sqlalchemy import text

with engine.connect() as conn:
    try:
        conn.execute(text("CREATE TYPE verificationstatus AS ENUM ('INVITED', 'PROFILE_INCOMPLETE', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'SUSPENDED');"))
        conn.commit()
    except Exception as e:
        print("Enum already exists or error:", e)
        conn.rollback()

    try:
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_status verificationstatus NOT NULL DEFAULT 'APPROVED';"))
        conn.commit()
    except Exception as e:
        print("Error altering table:", e)
        conn.rollback()
