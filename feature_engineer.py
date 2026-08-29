from utils.db_connection import fetch_one, fetch_all
from utils.helpers import safe_divide

def extract_tender_features(tender_id):
    # Mocking database fetch for features
    # In production, use execute_query/fetch_all with parameterized queries
    features = {
        "tender_id": tender_id,
        "price_deviation": 0.15,
        "bid_estimate_ratio": 0.85,
        "bid_spread": 0.05,
        "num_bidders": 3,
        "historical_avg_price": 1000000,
        "boq_total_deviation": 0.10,
        "delay_rate": 0.05,
        "cancellation_rate": 0.0,
        "missing_docs": False,
        "doc_completeness": 0.95
    }
    
    tender_record = fetch_one("SELECT estimated_value FROM tenders WHERE tender_id = %s", (tender_id,))
    if tender_record:
        # Compute actual features based on db values
        pass
        
    return features
