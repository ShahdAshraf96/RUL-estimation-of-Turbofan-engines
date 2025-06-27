import pandas as pd
import numpy as np
import pickle
import torch
from pathlib import Path
from typing import Dict, List, Tuple, Optional
import logging
from sklearn.preprocessing import MinMaxScaler


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class FD002DataProcessorExact:

    def __init__(self, data_path: str, scaler_path: str, sequence_length: int = 50, rul_max: int = 125):
        self.data_path = Path(data_path)
        self.scaler_path = Path(scaler_path)
        self.sequence_length = sequence_length
        self.rul_max = rul_max
        self.scaler = None
        self.data = None
        self.engine_data = {}

        self.all_columns = ["unit_number", "time_in_cycles", "op_setting_1", "op_setting_2", "op_setting_3"] + \
                          [f"sensor_measurement_{i}" for i in range(1, 22)]
        

        self.drop_sensors = [f'sensor_measurement_{i}' for i in [1, 5, 6, 10, 16, 18, 19]]
        self.drop_settings = ['op_setting_3']

        self.sensor_cols = [f"sensor_measurement_{i}" for i in range(1, 22) if i not in [1, 5, 6, 10, 16, 18, 19]]
        self.op_setting_cols = ["op_setting_1", "op_setting_2"]
        self.all_feature_cols = self.sensor_cols + self.op_setting_cols
        
        logger.info(f"Using {len(self.sensor_cols)} sensors: {self.sensor_cols}")
        logger.info(f"Using {len(self.op_setting_cols)} settings: {self.op_setting_cols}")
        logger.info(f"Total features: {len(self.all_feature_cols)}")
        
        self.load_data()
        self.load_scaler()
    
    def load_data(self):
        try:
            logger.info(f"Loading FD002 data from {self.data_path}")
            

            df = pd.read_csv(self.data_path, sep=r'\s+', header=None)
            df = df.iloc[:, :26] 
            df.columns = self.all_columns
            
            logger.info(f"Loaded {len(df)} records for {df['unit_number'].nunique()} engines")
            
            df = self.select_features(df)

            self.data = df

            self.group_by_engine()
            
        except Exception as e:
            logger.error(f"Error loading data: {e}")
            raise
    
    def select_features(self, df):

        features_to_keep = [col for col in df.columns if col not in self.drop_sensors + self.drop_settings]
        return df[features_to_keep]
    
    def load_scaler(self):

        try:
            logger.info(f"Loading scaler from {self.scaler_path}")
            with open(self.scaler_path, 'rb') as f:
                self.scaler = pickle.load(f)
            logger.info("Scaler loaded successfully")
            logger.info(f"Scaler feature names: {getattr(self.scaler, 'feature_names_in_', 'Not available')}")
        except Exception as e:
            logger.error(f"Error loading scaler: {e}")
            raise
    
    def group_by_engine(self):
        for unit_id in self.data['unit_number'].unique():
            engine_data = self.data[self.data['unit_number'] == unit_id].copy()
            engine_data = engine_data.sort_values('time_in_cycles')
            
            max_cycles = engine_data['time_in_cycles'].max()
            

            engine_data['simulated_rul'] = max_cycles - engine_data['time_in_cycles']
            engine_data['simulated_rul'] = engine_data['simulated_rul'].apply(lambda x: min(x, self.rul_max))
            
            self.engine_data[unit_id] = engine_data
    
    def get_engine_sequence_exact(self, unit_number: int, up_to_cycle: Optional[int] = None) -> Optional[np.ndarray]:
        if unit_number not in self.engine_data:
            logger.warning(f"Engine {unit_number} not found in dataset")
            return None
        
        engine_data = self.engine_data[unit_number].copy()
        
        if up_to_cycle is not None:
            engine_data = engine_data[engine_data['time_in_cycles'] <= up_to_cycle]
        
        if len(engine_data) == 0:
            logger.warning(f"No data found for engine {unit_number} up to cycle {up_to_cycle}")
            return None
        
        if len(engine_data) >= self.sequence_length:
            sequence_data = engine_data[self.all_feature_cols].iloc[-self.sequence_length:].values
        else:
            padded_sequence = np.zeros((self.sequence_length, len(self.all_feature_cols)))
            padded_sequence[-len(engine_data):] = engine_data[self.all_feature_cols].values
            sequence_data = padded_sequence
        
        if self.scaler is not None:
            try:
                sequence_data = self.scaler.transform(sequence_data)
            except Exception as e:
                logger.error(f"Error applying scaler: {e}")
                return None
        
        return sequence_data
    
    def get_engine_list(self) -> List[Dict]:
        engines = []
        for unit_id, engine_data in self.engine_data.items():
            max_cycles = engine_data['time_in_cycles'].max()
            current_cycle = engine_data['time_in_cycles'].iloc[-1]
            
            engines.append({
                'unit_number': int(unit_id),
                'max_cycles': int(max_cycles),
                'current_cycle': int(current_cycle),
                'total_records': len(engine_data),
                'status': 'active',
                'available_features': len(self.all_feature_cols)
            })
        
        return sorted(engines, key=lambda x: x['unit_number'])
    
    def get_engine_data(self, unit_number: int, cycle: Optional[int] = None) -> Optional[Dict]:
        if unit_number not in self.engine_data:
            return None
        
        engine_data = self.engine_data[unit_number]
        
        if cycle is None:
            latest_data = engine_data.iloc[-1]
        else:
            cycle_data = engine_data[engine_data['time_in_cycles'] == cycle]
            if cycle_data.empty:
                return None
            latest_data = cycle_data.iloc[0]
        
        result = {
            'unit_number': int(latest_data['unit_number']),
            'time_in_cycles': int(latest_data['time_in_cycles']),
        }
        
        for col in self.all_feature_cols:
            if col in latest_data:
                result[col] = float(latest_data[col])
        
        return result
    
    def get_all_cycles_for_engine(self, unit_number: int) -> Optional[List[Dict]]:
        if unit_number not in self.engine_data:
            return None
        
        engine_data = self.engine_data[unit_number]
        
        cycles = []
        for _, row in engine_data.iterrows():
            cycle_data = {
                'unit_number': int(row['unit_number']),
                'time_in_cycles': int(row['time_in_cycles']),
                'simulated_rul': float(row['simulated_rul'])
            }
            
            for col in self.all_feature_cols:
                if col in row:
                    cycle_data[col] = float(row[col])
            
            cycles.append(cycle_data)
        
        return cycles
    
    def simulate_real_time_predictions(self, unit_number: int, start_cycle: int = 1, max_cycles: int = 50) -> List[Dict]:
        if unit_number not in self.engine_data:
            return []
        
        engine_data = self.engine_data[unit_number]
        available_cycles = engine_data['time_in_cycles'].tolist()

        cycles_to_process = [c for c in available_cycles if start_cycle <= c <= start_cycle + max_cycles - 1]
        
        simulation_data = []
        
        for cycle in cycles_to_process:

            sequence = self.get_engine_sequence_exact(unit_number, up_to_cycle=cycle)
            
            if sequence is not None:

                cycle_data = self.get_engine_data(unit_number, cycle)
                
                simulation_point = {
                    'unit_number': unit_number,
                    'cycle': cycle,
                    'sequence_data': sequence,  
                    'raw_data': cycle_data,
                    'timestamp': f"2024-06-{(cycle % 30) + 1:02d}T{(cycle % 24):02d}:00:00"
                }
                
                simulation_data.append(simulation_point)
        
        return simulation_data
    
    def get_dataset_summary(self) -> Dict:
        #Get summary statistics of the dataset
        return {
            'total_engines': len(self.engine_data),
            'total_records': len(self.data),
            'sequence_length': self.sequence_length,
            'rul_max': self.rul_max,
            'feature_count': len(self.all_feature_cols),
            'sensor_features': self.sensor_cols,
            'setting_features': self.op_setting_cols,
            'dropped_sensors': self.drop_sensors,
            'dropped_settings': self.drop_settings,
            'avg_cycles_per_engine': self.data.groupby('unit_number')['time_in_cycles'].max().mean(),
            'max_cycles': self.data['time_in_cycles'].max(),
            'min_cycles': self.data['time_in_cycles'].min(),
            'engines_range': f"{self.data['unit_number'].min()}-{self.data['unit_number'].max()}"
        }
    
    def validate_preprocessing(self) -> Dict:
        validation = {
            'feature_count_correct': len(self.all_feature_cols) == 16, 
            'sequence_length_correct': self.sequence_length == 50,
            'rul_max_correct': self.rul_max == 125,
            'scaler_loaded': self.scaler is not None,
            'data_loaded': self.data is not None,
            'engines_available': len(self.engine_data) > 0
        }
        
        validation['all_checks_passed'] = all(validation.values())
        
        return validation

