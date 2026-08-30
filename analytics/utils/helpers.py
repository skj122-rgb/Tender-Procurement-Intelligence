def classify_risk_level(score):
    if score <= 30:
        return "LOW"
    elif score <= 60:
        return "MEDIUM"
    elif score <= 80:
        return "HIGH"
    else:
        return "CRITICAL"

def safe_divide(a, b):
    if not b or b == 0:
        return 0.0
    return float(a) / float(b)

def format_percentage(value):
    return f"{value * 100:.2f}%"

def generate_reason(template, **kwargs):
    # Ensure careful language is used
    safe_templates = {
        "price_deviation": "Potential anomaly detected: Bid price deviates from estimate by {deviation}.",
        "single_bidder": "Additional scrutiny suggested: Only a single bidder participated.",
        "narrow_spread": "Review recommended: Unusually narrow spread between bids.",
        "high_delay": "Review recommended: Contractor has a history of project delays.",
        "missing_docs": "Additional scrutiny suggested: Missing required documentation.",
        "boq_anomaly": "Potential anomaly: BOQ rates deviate significantly from historical averages."
    }
    
    t = safe_templates.get(template, template)
    return t.format(**kwargs)
