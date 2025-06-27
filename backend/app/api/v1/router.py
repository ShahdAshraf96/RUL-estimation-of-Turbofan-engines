from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Dict, Any
import httpx
import structlog
from datetime import datetime
from fastapi import Query
from app.core.database import get_db, Engine, RULPrediction
from app.core.config import settings

logger = structlog.get_logger()
api_router = APIRouter()

@api_router.get("/health")
async def api_health():
    """API health check"""
    return {"status": "healthy", "api": "v1"}

@api_router.get("/engines", response_model=List[Dict[str, Any]])
async def get_engines(
    limit: int = Query(7, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    logger.info(f"GET /engines called (limit={limit})")
    result = await db.execute(select(Engine).limit(limit))
    engines = result.scalars().all()
    enriched = []
    async with httpx.AsyncClient() as client:
        for e in engines:
            rul = e.current_rul
            confidence = e.confidence
            status = e.status
            try:
                # Call ML service
                resp = await client.post(
                    f"{settings.ML_SERVICE_URL}/predict",
                    json={"unit_number": e.id, "use_real_data": True},
                    timeout=10.0,
                )
                resp.raise_for_status()
                pr = resp.json()
                rul = pr.get("predicted_rul", rul)
                confidence = pr.get("confidence", confidence)
                status = pr.get("status", status)
            except Exception as ml_err:
                logger.warning(
                    "ML call failed, using DB", engine_id=e.id, error=str(ml_err)
                )
            enriched.append({
                "id": e.id,
                "name": e.name,
                "model": e.model,
                "status": status,
                "current_rul": rul,
                "confidence": confidence,
                "last_updated": e.last_updated.isoformat() if e.last_updated else None,
                "is_active": e.is_active,
            })

    return enriched

@api_router.get("/engines/{engine_id}")
async def get_engine(engine_id: int, db: AsyncSession = Depends(get_db)):
    """Get engine details."""
    result = await db.execute(select(Engine).where(Engine.id == engine_id))
    e = result.scalar_one_or_none()
    if not e:
        raise HTTPException(404, "Engine not found")
    return {
        "id": e.id,
        "name": e.name,
        "model": e.model,
        "status": e.status,
        "current_rul": e.current_rul,
        "confidence": e.confidence,
        "last_updated": e.last_updated.isoformat() if e.last_updated else None,
        "is_active": e.is_active,
    }

@api_router.get("/engines/{engine_id}/rul")
async def get_engine_rul(engine_id: int, db: AsyncSession = Depends(get_db)):
    """Get latest RUL prediction or current RUL."""
    # verify engine
    result = await db.execute(select(Engine).where(Engine.id == engine_id))
    e = result.scalar_one_or_none()
    if not e:
        raise HTTPException(404, "Engine not found")
    # fetch latest prediction
    pred = await db.execute(
        select(RULPrediction)
        .where(RULPrediction.engine_id == engine_id)
        .order_by(RULPrediction.timestamp.desc())
        .limit(1)
    )
    latest = pred.scalar_one_or_none()
    if latest:
        return {
            "engine_id": engine_id,
            "engine_name": e.name,
            "rul": latest.predicted_rul,
            "confidence": latest.confidence,
            "timestamp": latest.timestamp.isoformat(),
            "model_version": latest.model_version,
            "prediction_time_ms": latest.prediction_time_ms,
            "status": e.status,
        }
    return {
        "engine_id": engine_id,
        "engine_name": e.name,
        "rul": e.current_rul,
        "confidence": e.confidence,
        "timestamp": e.last_updated.isoformat() if e.last_updated else None,
        "model_version": "current",
        "prediction_time_ms": None,
        "status": e.status,
    }

@api_router.get("/dashboard/summary")
async def summary(db: AsyncSession = Depends(get_db)):
    """Dashboard statistics."""
    result = await db.execute(select(Engine))
    engines = result.scalars().all()
    total = len(engines)
    healthy = sum(e.status == "healthy" for e in engines)
    warning = sum(e.status == "warning" for e in engines)
    critical = sum(e.status == "critical" for e in engines)
    active = [e for e in engines if e.is_active and e.current_rul is not None]
    avg_rul = sum(e.current_rul for e in active) / len(active) if active else 0
    return {
        "total_engines": total,
        "healthy_engines": healthy,
        "warning_engines": warning,
        "critical_engines": critical,
        "average_rul": round(avg_rul, 2),
        "active_engines": len(active),
    }
