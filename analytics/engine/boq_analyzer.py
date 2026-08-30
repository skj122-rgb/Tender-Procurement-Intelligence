from utils.helpers import generate_reason

def analyze(features):
    score = 0
    reasons = []
    evidence = {}
    
    boq_dev = features.get("boq_total_deviation", 0)
    
    if abs(boq_dev) > 0.2:
        score += 10
        reasons.append(generate_reason("boq_anomaly"))
        evidence["high_boq_deviation"] = True
        
    return {"score": min(score, 15), "reasons": reasons, "evidence": evidence}
