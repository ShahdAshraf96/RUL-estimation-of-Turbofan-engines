from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean
from datetime import datetime
from app.core.config import settings
from sqlalchemy.ext.asyncio import create_async_engine
# Create async engine
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    future=True,
    connect_args={"check_same_thread": False},  
)

# Create async session factory
AsyncSessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# Create declarative base
Base = declarative_base()


# Database Models
class Engine(Base):
    __tablename__ = "engines"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    model = Column(String)
    status = Column(String, default="healthy")
    current_rul = Column(Float)
    confidence = Column(Float)
    last_updated = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)


class SensorReading(Base):
    __tablename__ = "sensor_readings"
    
    id = Column(Integer, primary_key=True, index=True)
    engine_id = Column(Integer, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    cycle = Column(Integer)
    setting_1 = Column(Float)
    setting_2 = Column(Float)
    setting_3 = Column(Float)
    sensor_1 = Column(Float)
    sensor_2 = Column(Float)
    sensor_3 = Column(Float)
    sensor_4 = Column(Float)
    sensor_5 = Column(Float)
    sensor_6 = Column(Float)
    sensor_7 = Column(Float)
    sensor_8 = Column(Float)
    sensor_9 = Column(Float)
    sensor_10 = Column(Float)
    sensor_11 = Column(Float)
    sensor_12 = Column(Float)
    sensor_13 = Column(Float)
    sensor_14 = Column(Float)


class RULPrediction(Base):
    __tablename__ = "rul_predictions"
    
    id = Column(Integer, primary_key=True, index=True)
    engine_id = Column(Integer, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    predicted_rul = Column(Float)
    confidence = Column(Float)
    model_version = Column(String)
    prediction_time_ms = Column(Float)


async def get_db():
    #Dependency to get database session
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

