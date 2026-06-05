from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from redis import Redis
from app.config import settings

# Database setup optimized for Neon Serverless Postgres
engine = create_engine(
    settings.DATABASE_URL, 
    pool_pre_ping=True, 
    pool_recycle=300,        # Recycle connections every 5 mins instead of 30
    pool_size=5,             # Keep pool small
    max_overflow=10,         # Allow temporary spikes
    pool_timeout=30          # Wait up to 30s for a connection
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Redis setup
redis_client = Redis.from_url(settings.REDIS_URL, decode_responses=True)

def get_db() -> Generator[Session, None, None]:
    """FastAPI Dependency for database session injection."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_redis() -> Redis:
    """FastAPI Dependency for redis connection injection."""
    return redis_client
