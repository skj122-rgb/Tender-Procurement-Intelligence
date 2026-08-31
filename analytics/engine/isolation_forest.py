from sklearn.ensemble import IsolationForest
import numpy as np

def detect_anomalies(feature_matrix):
    if len(feature_matrix) < 10:
        # Not enough data for isolation forest
        return [0] * len(feature_matrix)
        
    # Clean data (remove nan/inf)
    clean_matrix = np.nan_to_num(feature_matrix, nan=0.0, posinf=0.0, neginf=0.0)
    
    clf = IsolationForest(contamination=0.1, random_state=42)
    predictions = clf.fit_predict(clean_matrix)
    
    # 1 for normal, -1 for anomaly. Convert to 0 for normal, 1 for anomaly
    anomalies = [1 if p == -1 else 0 for p in predictions]
    return anomalies
