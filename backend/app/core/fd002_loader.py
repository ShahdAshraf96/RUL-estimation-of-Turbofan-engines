import pandas as pd
import numpy as np
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.core.database import Engine, SensorReading
import structlog
from typing import List, Dict, Any
import os

logger = structlog.get_logger()

CMAPSS_COLUMNS = [
    'unit_number', 'cycle', 'setting_1', 'setting_2', 'setting_3',
    'sensor_1', 'sensor_2', 'sensor_3', 'sensor_4', 'sensor_5',
    'sensor_6', 'sensor_7', 'sensor_8', 'sensor_9', 'sensor_10',
    'sensor_11', 'sensor_12', 'sensor_13', 'sensor_14', 'sensor_15',
    'sensor_16', 'sensor_17', 'sensor_18', 'sensor_19', 'sensor_20', 'sensor_21'
]

def load_fd002_data(file_path: str) -> pd.DataFrame:
    """Load FD002 test data from file"""
    try:

        df = pd.read_csv(file_path, sep='\s+', header=None, names=CMAPSS_COLUMNS)
        logger.info(f"Loaded FD002 data: {len(df)} records, {df['unit_number'].nunique()} engines")
        return df
    except Exception as e:
        logger.error(f"Failed to load FD002 data: {e}")
        raise

def calculate_rul_for_engine(df: pd.DataFrame, unit_number: int, max_rul: int = 125) -> Dict[int, float]:
    """Calculate RUL for each cycle of an engine"""
    engine_data = df[df['unit_number'] == unit_number].sort_values('cycle')
    max_cycle = engine_data['cycle'].max()
    
    rul_dict = {}
    for _, row in engine_data.iterrows():
        cycle = int(row['cycle'])

        rul = min(max_rul, max_cycle - cycle)
        rul_dict[cycle] = float(rul)
    
    return rul_dict

def determine_engine_status(current_rul: float, confidence: float) -> str:
    """Determine engine status based on RUL and confidence"""
    if current_rul < 50:
        return "critical"
    elif current_rul < 100:
        return "warning"
    else:
        return "healthy"

async def populate_fd002_engines(session: AsyncSession, data_file_path: str) -> List[Engine]:
    """Populate database with FD002 engines and their latest data"""
    try:
        # Load FD002 data
        df = load_fd002_data(data_file_path)
        
        engines = []
        unique_units = df['unit_number'].unique()
        
        logger.info(f"Processing {len(unique_units)} engines from FD002 dataset")
        
        for unit_number in unique_units:
            # Get latest cycle data for this engine
            engine_data = df[df['unit_number'] == unit_number]
            latest_cycle_data = engine_data.loc[engine_data['cycle'].idxmax()]
            
            # Calculate RUL for this engine
            rul_dict = calculate_rul_for_engine(df, unit_number)
            latest_cycle = int(latest_cycle_data['cycle'])
            current_rul = rul_dict[latest_cycle]
            
            sensor_cols = [f'sensor_{i}' for i in range(1, 22)]
            sensor_values = engine_data[sensor_cols].iloc[-5:].std().mean() 
            confidence = max(0.6, min(0.95, 1.0 - (sensor_values / 1000))) 
            
            # Determine status
            status = determine_engine_status(current_rul, confidence)
            
            # Create engine record
            engine = Engine(
                name=f"Engine_{unit_number:03d}",
                model="CFM56-7B",
                status=status,
                current_rul=current_rul,
                confidence=confidence,
                is_active=True
            )
            
            session.add(engine)
            engines.append(engine)
            
            logger.debug(f"Created engine {engine.name}: RUL={current_rul:.1f}, Status={status}, Confidence={confidence:.3f}")
        
        await session.commit()
        logger.info(f"Successfully created {len(engines)} engines from FD002 dataset")
        
        return engines
        
    except Exception as e:
        logger.error(f"Failed to populate FD002 engines: {e}")
        await session.rollback()
        raise

async def populate_sensor_readings(session: AsyncSession, data_file_path: str, limit_per_engine: int = 50):
    """Populate sensor readings for engines (limited to recent cycles)"""
    try:
        df = load_fd002_data(data_file_path)
        
        # Get engine IDs from database
        result = await session.execute(text("SELECT id, name FROM engines"))
        engine_mapping = {name: id for id, name in result.fetchall()}
        
        readings_count = 0
        unique_units = df['unit_number'].unique()
        
        for unit_number in unique_units:
            engine_name = f"Engine_{unit_number:03d}"
            if engine_name not in engine_mapping:
                continue
                
            engine_id = engine_mapping[engine_name]
            engine_data = df[df['unit_number'] == unit_number].sort_values('cycle')
            
            recent_data = engine_data.tail(limit_per_engine)
            
            for _, row in recent_data.iterrows():
                reading = SensorReading(
                    engine_id=engine_id,
                    cycle=int(row['cycle']),
                    setting_1=float(row['setting_1']),
                    setting_2=float(row['setting_2']),
                    setting_3=float(row['setting_3']),
                    sensor_1=float(row['sensor_1']),
                    sensor_2=float(row['sensor_2']),
                    sensor_3=float(row['sensor_3']),
                    sensor_4=float(row['sensor_4']),
                    sensor_5=float(row['sensor_5']),
                    sensor_6=float(row['sensor_6']),
                    sensor_7=float(row['sensor_7']),
                    sensor_8=float(row['sensor_8']),
                    sensor_9=float(row['sensor_9']),
                    sensor_10=float(row['sensor_10']),
                    sensor_11=float(row['sensor_11']),
                    sensor_12=float(row['sensor_12']),
                    sensor_13=float(row['sensor_13']),
                    sensor_14=float(row['sensor_14'])
                )
                
                session.add(reading)
                readings_count += 1
        
        await session.commit()
        logger.info(f"Successfully created {readings_count} sensor readings")
        
    except Exception as e:
        logger.error(f"Failed to populate sensor readings: {e}")
        await session.rollback()
        raise

async def initialize_fd002_data(session: AsyncSession, force_reload: bool = False):
    """Initialize database with FD002 data"""
    try:
        result = await session.execute(text("SELECT COUNT(*) FROM engines"))
        engine_count = result.scalar()
        
        if engine_count > 0 and not force_reload:
            logger.info(f"Database already has {engine_count} engines, skipping FD002 initialization")
            return
        
        if force_reload:
            await session.execute(text("DELETE FROM sensor_readings"))
            await session.execute(text("DELETE FROM rul_predictions"))
            await session.execute(text("DELETE FROM engines"))
            await session.commit()
            logger.info("Cleared existing data for FD002 reload")
        
        data_file_paths = [
            "/home/ubuntu/rul_project/test_FD002.txt",
            "/home/ubuntu/upload/test_FD002.txt",
            "data/test_FD002.txt",
            "../data/test_FD002.txt",
            "../../test_FD002.txt"
        ]
        
        data_file_path = None
        for path in data_file_paths:
            if os.path.exists(path):
                data_file_path = path
                break
        
        if not data_file_path:
            logger.warning("FD002 data file not found")
            return
        
        logger.info(f"Initializing FD002 data from {data_file_path}")
        

        engines = await populate_fd002_engines(session, data_file_path)
        
        await populate_sensor_readings(session, data_file_path, limit_per_engine=20)
        
        logger.info("FD002 data initialization completed successfully")
        
    except Exception as e:
        logger.error(f"Failed to initialize FD002 data: {e}")
        raise

