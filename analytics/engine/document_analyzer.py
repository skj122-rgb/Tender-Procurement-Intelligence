from utils.helpers import generate_reason

def analyze(features):
    score = 0
    reasons = []
    evidence = {}
    
    missing_docs = features.get("missing_docs", False)
    
    if missing_docs:
        score += 15
        reasons.append(generate_reason("missing_docs"))
        evidence["missing_documents"] = True
        
    return {"score": min(score, 15), "reasons": reasons, "evidence": evidence}
