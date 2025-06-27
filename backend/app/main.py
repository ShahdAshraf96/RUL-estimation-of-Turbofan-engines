from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from contextlib import asynccontextmanager
import structlog
import asyncio
from datetime import datetime

from app.core.config import settings
from sqlalchemy import text
from app.core.database import engine, Base
from app.api.v1.router import api_router


structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    
    try:
        # Create database tables
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        
        logger.info("Database tables created successfully")
        
        # Initialize sample data
        await initialize_sample_data()
        
        logger.info("Sample data initialized")
        
    except Exception as e:
        logger.error("Failed to initialize database", error=str(e))
        raise
    
    yield



async def initialize_sample_data():
    from app.core.database import AsyncSessionLocal, Engine
    
    async with AsyncSessionLocal() as session:
        try:
            # Check if engines already exist
            result = await session.execute(text("SELECT COUNT(*) FROM engines"))
            count = result.scalar()
            if count == 0:
                from app.core.fd002_loader import initialize_fd002_data
                await initialize_fd002_data(session, force_reload=True)
            else:
                logger.info(f"Database already has {count} engines, skipping FD002 initialization")
        except Exception as e:
            logger.error("Failed to initialize sample data", error=str(e))
            await session.rollback()


# Create FastAPI application
app = FastAPI(
    title="RUL Dashboard API",
    description="Real-time Remaining Useful Life prediction dashboard for turbofan engines",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Add middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=settings.ALLOWED_HOSTS
)

# Include API router
app.include_router(api_router, prefix="/api/v1")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "RUL Dashboard API",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "operational"
    }


@app.get("/health")
async def health_check():
    #Health check endpoint
    try:
        # Test database connection
        async with engine.begin() as conn:
            result = await conn.execute(text("SELECT 1"))
            result.scalar()
        
        return {
            "status": "healthy",
            "database": "connected",
            "version": "1.0.0",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error("❌ Health check failed", error=str(e))
        raise HTTPException(status_code=503, detail="Service unhealthy")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower()
    )

