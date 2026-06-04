from app.dependencies import engine
from sqlalchemy import text
with engine.connect() as conn:
    res = conn.execute(text('SELECT * FROM staff_documents')).fetchall()
    print('Staff Documents:', res)
