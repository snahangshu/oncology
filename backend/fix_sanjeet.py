from app.dependencies import engine
from sqlalchemy import text
from app.modules.users.security import get_password_hash

with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
    password = get_password_hash("Welcome123!")
    conn.execute(text("""
        INSERT INTO users (email, full_name, hashed_password, role, is_active, created_at, updated_at, verification_status)
        VALUES ('sanjeet@gmail.com', 'sanjeet Kumar', :password, 'DOCTOR', true, NOW(), NOW(), 'APPROVED')
    """), {'password': password})
    print("User inserted.")
