import numpy as np
import pandas as pd
from typing import Dict, List, Any, Optional, Tuple
import structlog
from sklearn.preprocessing import MinMaxScaler
logger = structlog.get_logger()


SELECTED_SENSORS = [2, 3, 4, 7, 8, 9, 11, 12, 13, 14, 15, 17, 20, 21]  # 14 sensors
SELECTED_SETTINGS = [1, 2]
SEQUENCE_LENGTH = 50
RUL_MAX = 125

def load_data(file_path):
    """Load data - EXACT match to your notebook"""
    df = pd.read_csv(file_path, sep=r'\s+', header=None)
    df = df.iloc[:, :26] # Select only the first 26 columns

    df.columns = ["unit_number", "time_in_cycles", "op_setting_1", "op_setting_2", "op_setting_3"] + \
                 [f"sensor_measurement_{i}" for i in range(1, 22)]
    return df

def calculate_rul(df):
    """Calculate RUL - EXACT match to your notebook"""
    max_cycles = df.groupby('unit_number')['time_in_cycles'].max().reset_index()
    max_cycles.columns = ['unit_number', 'max_cycles']
    df = pd.merge(df, max_cycles, on='unit_number', how='left')
    df['RUL'] = df['max_cycles'] - df['time_in_cycles']
    
    RUL_MAX = 125
    df['RUL'] = df['RUL'].apply(lambda x: min(x, RUL_MAX))
    
    df.drop(columns=['max_cycles'], inplace=True)
    return df

def select_features(df):
    drop_sensors = [f'sensor_measurement_{i}' for i in [1, 5, 6, 10, 16, 18, 19]]
    drop_settings = ['op_setting_3']
    
    features_to_keep = [col for col in df.columns if col not in drop_sensors + drop_settings]
    return df[features_to_keep]

def create_sequences(df, sequence_length, sensor_cols, op_setting_cols):
    X, y = [], []
    features = sensor_cols + op_setting_cols
    
    for unit_number in df['unit_number'].unique():
        unit_df = df[df['unit_number'] == unit_number].copy()
        unit_df = unit_df.sort_values(by='time_in_cycles')
        
        for i in range(len(unit_df) - sequence_length + 1):
            X.append(unit_df[features].iloc[i:i+sequence_length].values)
            y.append(unit_df['RUL'].iloc[i+sequence_length-1]) # RUL at the end of the sequence
            
    return np.array(X), np.array(y)

def preprocess_for_model(sensor_data: Dict[str, Any], scaler=None) -> np.ndarray:
    try:
        # Convert sensor data to the expected format
        if isinstance(sensor_data, dict):
            if 'sensors' in sensor_data:

                sensors = sensor_data['sensors']
                settings = sensor_data.get('settings', [0, 0, 0])
            else:
                sensors = []
                settings = []
                
                for i in range(1, 22):
                    key = f'sensor_measurement_{i}'
                    if key in sensor_data:
                        sensors.append(float(sensor_data[key]))
                    else:
                        sensors.append(0.0)
                
                for i in range(1, 4):
                    key = f'op_setting_{i}'
                    if key in sensor_data:
                        settings.append(float(sensor_data[key]))
                    else:
                        settings.append(0.0)
        
        if len(sensors) < 21:
            sensors.extend([0.0] * (21 - len(sensors)))
        if len(settings) < 3:
            settings.extend([0.0] * (3 - len(settings)))
        
        selected_features = []
        
        for sensor_idx in SELECTED_SENSORS:
            if sensor_idx <= len(sensors):
                selected_features.append(sensors[sensor_idx - 1]) 
            else:
                selected_features.append(0.0)
        
        for setting_idx in SELECTED_SETTINGS:
            if setting_idx <= len(settings):
                selected_features.append(settings[setting_idx - 1])
            else:
                selected_features.append(0.0)
        
        features = np.array(selected_features, dtype=np.float32)
        
        if scaler is not None:
            features = scaler.transform(features.reshape(1, -1)).flatten()
        
        sequence = np.tile(features, (SEQUENCE_LENGTH, 1))
        
        logger.debug(f"Preprocessed data shape: {sequence.shape}, features: {len(selected_features)}")
        
        return sequence
        
    except Exception as e:
        logger.error(f"Failed to preprocess sensor data: {e}")
        raise

def preprocess_fd002_sequence(engine_data: pd.DataFrame, scaler=None) -> np.ndarray:

    try:

        engine_data = engine_data.sort_values('time_in_cycles')
        
        sensor_cols = [f'sensor_measurement_{i}' for i in SELECTED_SENSORS]
        op_setting_cols = [f'op_setting_{i}' for i in SELECTED_SETTINGS]
        all_feature_cols = sensor_cols + op_setting_cols
        
        # Extract features
        features = engine_data[all_feature_cols].values.astype(np.float32)
        
        if scaler is not None:
            features = scaler.transform(features)
        
        if len(features) >= SEQUENCE_LENGTH:
            sequence = features[-SEQUENCE_LENGTH:]
        else:
            # Pad with zeros if not enough data 
            padded_sequence = np.zeros((SEQUENCE_LENGTH, len(all_feature_cols)))
            padded_sequence[-len(features):] = features
            sequence = padded_sequence
        
        logger.debug(f"FD002 sequence shape: {sequence.shape}")
        
        return sequence
        
    except Exception as e:
        logger.error(f"Failed to preprocess FD002 sequence: {e}")
        raise

def preprocess_dataset_exact(dataset_id, sequence_length=50, rul_max=125):

    sensor_cols = [f"sensor_measurement_{i}" for i in range(1, 22) if i not in [1, 5, 6, 10, 16, 18, 19]]
    op_setting_cols = ["op_setting_1", "op_setting_2"]
    all_feature_cols = sensor_cols + op_setting_cols

    train_file_path = f"/kaggle/input/nasa-cmaps/cmaps/CMaps/train_{dataset_id}.txt"
    train_df = load_data(train_file_path)
    train_df = calculate_rul(train_df)
    train_df = select_features(train_df)


    scaler = MinMaxScaler()
    train_df[all_feature_cols] = scaler.fit_transform(train_df[all_feature_cols])


    X_train, y_train = create_sequences(train_df, sequence_length, sensor_cols, op_setting_cols)


    test_file_path = f"/kaggle/input/nasa-cmaps/cmaps/CMaps/test_{dataset_id}.txt"
    test_df = load_data(test_file_path)
    test_df = select_features(test_df)

    test_df[all_feature_cols] = scaler.transform(test_df[all_feature_cols])


    X_test_list = []
    for unit_number in test_df['unit_number'].unique():
        unit_df = test_df[test_df['unit_number'] == unit_number].copy()
        unit_df = unit_df.sort_values(by='time_in_cycles')
        
        if len(unit_df) >= sequence_length:
            X_test_list.append(unit_df[all_feature_cols].iloc[-sequence_length:].values)
        else:
            padded_sequence = np.zeros((sequence_length, len(all_feature_cols)))
            padded_sequence[-len(unit_df):] = unit_df[all_feature_cols].values
            X_test_list.append(padded_sequence)

    X_test = np.array(X_test_list)


    rul_test_file_path = f"/kaggle/input/nasa-cmaps/cmaps/CMaps/RUL_{dataset_id}.txt"
    y_test_true = pd.read_csv(rul_test_file_path, sep=r'\s+', header=None)
    y_test_true = y_test_true.iloc[:, 0].values 
    y_test_true = np.array([min(x, rul_max) for x in y_test_true]) 
    return X_train, y_train, X_test, y_test_true, scaler

def create_mock_sensor_data(engine_id: int = 1) -> Dict[str, float]:

    np.random.seed(engine_id) 

    mock_data = {
        'unit_number': engine_id,
        'time_in_cycles': 1,
        'op_setting_1': np.random.choice([0, 10, 20, 25, 35, 42]),
        'op_setting_2': np.random.choice([0.25, 0.62, 0.70, 0.84]),
        'op_setting_3': np.random.choice([60, 100]),
        'sensor_measurement_1': np.random.normal(518.67, 10),
        'sensor_measurement_2': np.random.normal(641.82, 20),
        'sensor_measurement_3': np.random.normal(1589.70, 50),
        'sensor_measurement_4': np.random.normal(1400.60, 100),
        'sensor_measurement_5': np.random.normal(14.62, 2),
        'sensor_measurement_6': np.random.normal(21.61, 3),
        'sensor_measurement_7': np.random.normal(554.36, 20),
        'sensor_measurement_8': np.random.normal(2388.06, 50),
        'sensor_measurement_9': np.random.normal(9046.19, 200),
        'sensor_measurement_10': np.random.normal(1.30, 0.2),
        'sensor_measurement_11': np.random.normal(47.47, 5),
        'sensor_measurement_12': np.random.normal(521.66, 20),
        'sensor_measurement_13': np.random.normal(2388.02, 50),
        'sensor_measurement_14': np.random.normal(8138.62, 200),
        'sensor_measurement_15': np.random.normal(8.4195, 1),
        'sensor_measurement_16': np.random.normal(0.03, 0.01),
        'sensor_measurement_17': np.random.normal(392, 20),
        'sensor_measurement_18': np.random.normal(2388, 50),
        'sensor_measurement_19': np.random.normal(100.00, 5),
        'sensor_measurement_20': np.random.normal(39.06, 5),
        'sensor_measurement_21': np.random.normal(23.4190, 3),
    }
    
    return mock_data

def validate_preprocessing(features: np.ndarray) -> bool:
    try:
        # Check shape
        if features.shape != (SEQUENCE_LENGTH, 16):
            logger.error(f"Invalid shape: {features.shape}, expected: ({SEQUENCE_LENGTH}, 16)")
            return False
        
        # Check for NaN or infinite values
        if np.isnan(features).any() or np.isinf(features).any():
            logger.error("Features contain NaN or infinite values")
            return False
        
        logger.debug("Preprocessing validation passed")
        return True
        
    except Exception as e:
        logger.error(f"Preprocessing validation failed: {e}")
        return False

def get_feature_names():
    """Get the exact feature names used in your model"""
    sensor_names = [f'sensor_measurement_{i}' for i in SELECTED_SENSORS]
    setting_names = [f'op_setting_{i}' for i in SELECTED_SETTINGS]
    return sensor_names + setting_names

def print_preprocessing_info():
    """Print preprocessing information for debugging"""
    print("Preprocessing Configuration (EXACT match to notebook):")
    print(f"Selected sensors: {SELECTED_SENSORS} (14 sensors)")
    print(f"Selected settings: {SELECTED_SETTINGS} (2 settings)")
    print(f"Total features: {len(SELECTED_SENSORS) + len(SELECTED_SETTINGS)} (16)")
    print(f"Sequence length: {SEQUENCE_LENGTH}")
    print(f"RUL max: {RUL_MAX}")
    print(f"Dropped sensors: [1, 5, 6, 10, 16, 18, 19]")
    print(f"Dropped settings: [3]")
    print(f"Feature names: {get_feature_names()}")

preprocess_sensor_data = preprocess_for_model

