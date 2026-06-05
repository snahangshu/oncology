from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.v1.router import api_router

import cloudinary
from app.modules.audit.middleware import AuditLoggingMiddleware

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Configure Cloudinary
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True
    )
    yield
    # Shutdown tasks (e.g. close connections)

def create_app() -> FastAPI:
    """FastAPI Application Factory."""
    app = FastAPI(
        title="Oncology AI Clinical Scheduling & Intake Assistant",
        description="Core API for managing patient intake, clinical document completeness, scheduling, and chair/nurse allocation.",
        version="0.1.0",
        lifespan=lifespan,
    )

    # CORS Middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Audit Logging Middleware
    app.add_middleware(AuditLoggingMiddleware)

    # Register API routes
    app.include_router(api_router, prefix=settings.API_PREFIX)

    @app.get("/health", tags=["Health"])
    def health_check():
        return {"status": "healthy", "environment": settings.ENVIRONMENT}

    return app

app = create_app()
