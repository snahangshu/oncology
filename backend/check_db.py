from app.dependencies import engine
from sqlalchemy import text

with engine.connect() as conn:
    users = conn.execute(text('SELECT id, email, full_name, role FROM users')).fetchall()
    doctors = conn.execute(text('SELECT id, email, first_name, last_name FROM doctors')).fetchall()
    
    print('--- USERS ---')
    for u in users:
        print(u)
        
    print('--- DOCTORS ---')
    for d in doctors:
        print(d)
