import os
import sys

# Add the project root to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine
from app.config import settings
from app.modules.intake.models import Base

def migrate():
    print(f"Connecting to {settings.DATABASE_URL}...")
    engine = create_engine(settings.DATABASE_URL)
    
    print("Creating new tables...")
    # This will create tables that don't exist yet, but won't drop/modify existing ones.
    Base.metadata.create_all(bind=engine)
    
    print("Migration complete!")

if __name__ == "__main__":
    migrate()
