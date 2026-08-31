from utils.helpers import generate_reason, format_percentage

def analyze(features):
    score = 0
    reasons = []
    evidence = {}
    
    dev = features.get("price_deviation", 0)
    
    if abs(dev) > 0.3:
        score += 20
        reasons.append(generate_reason("price_deviation", deviation=format_percentage(abs(dev))))
        evidence["extreme_deviation"] = True
    elif abs(dev) > 0.15:
        score += 10
        reasons.append(generate_reason("price_deviation", deviation=format_percentage(abs(dev))))
        evidence["moderate_deviation"] = True
        
    return {"score": min(score, 25), "reasons": reasons, "evidence": evidence}
