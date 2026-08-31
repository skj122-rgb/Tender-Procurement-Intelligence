from utils.helpers import generate_reason

def analyze(features):
    score = 0
    reasons = []
    evidence = {}
    
    num_bidders = features.get("num_bidders", 0)
    spread = features.get("bid_spread", 1.0)
    
    if num_bidders == 1:
        score += 15
        reasons.append(generate_reason("single_bidder"))
        evidence["single_bidder"] = True
        
    if num_bidders > 1 and spread < 0.02:
        score += 10
        reasons.append(generate_reason("narrow_spread"))
        evidence["narrow_spread"] = True
        
    return {"score": min(score, 20), "reasons": reasons, "evidence": evidence}
