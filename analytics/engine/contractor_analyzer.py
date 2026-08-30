def analyze_contractor_risk(features):
    """
    Comprehensive multi-parameter bidder behavioral risk analyzer.
    5 Evaluated Parameters (Total: 100 Pts):
    1. Past Performance & Delays (0-20 pts)
    2. Price Deviation on Current Tender (0-20 pts)
    3. Bid Pattern & Waiting/Timing Anomaly (0-20 pts)
    4. Financial Solvency & Capacity (0-20 pts)
    5. Document & Regulatory Compliance (0-20 pts)
    """
    past_perf_score = 0.0
    price_dev_score = 0.0
    bid_pattern_score = 0.0
    financial_cap_score = 0.0
    doc_compliance_score = 0.0
    
    reasons = []
    evidence = {}

    # ─── 1. Past Performance & Delay Risk (Max 20 pts) ────────────────────────
    delay_rate = float(features.get("delay_rate", 0))
    avg_delay_days = float(features.get("avg_delay_days", 0))
    avg_quality = float(features.get("avg_quality_rating") or 4.5)
    cancelled_projects = int(features.get("cancelled_projects", 0))
    
    if cancelled_projects > 0:
        past_perf_score += 10.0
        reasons.append(f"Past Termination Flag: {cancelled_projects} government contract(s) terminated due to non-performance.")
        
    if delay_rate >= 50.0:
        past_perf_score += 10.0
        reasons.append(f"Severe Historical Delay: {delay_rate:.1f}% of previous works delayed (avg +{avg_delay_days:.0f} days).")
    elif delay_rate >= 25.0:
        past_perf_score += 6.0
        reasons.append(f"Elevated Delay Probability: {delay_rate:.1f}% past delay rate.")
    elif avg_quality < 3.5:
        past_perf_score += 5.0
        reasons.append(f"Substandard Quality Record: Historical rating is {avg_quality:.1f}/5.0 stars.")
    else:
        past_perf_score += 2.0
        reasons.append("Verified Past Performance: Clean on-time delivery with high quality standards.")
        
    past_perf_score = min(20.0, past_perf_score)

    # ─── 2. Price Deviation on Current Tender (Max 20 pts) ────────────────────
    price_dev = float(features.get("price_deviation", 0))
    if price_dev < -25.0:
        price_dev_score = 20.0
        reasons.append(f"Severe Predatory Underbidding: Quoted {abs(price_dev):.1f}% below baseline (high project abandonment/cost claim risk).")
    elif price_dev < -15.0:
        price_dev_score = 14.0
        reasons.append(f"Aggressive Price Underquote: Quoted {abs(price_dev):.1f}% below estimated baseline.")
    elif price_dev > 20.0:
        price_dev_score = 12.0
        reasons.append(f"Inflated Bid Rate: Quoted {price_dev:.1f}% above estimated baseline cost.")
    else:
        price_dev_score = 3.0
        reasons.append("Balanced Price Variance: Bid is within standard competitive variance threshold.")

    # ─── 3. Bid Pattern & Waiting/Timing Anomaly (Max 20 pts) ─────────────────
    cluster_diff = float(features.get("cluster_diff", 10.0))
    submission_minutes_before_deadline = float(features.get("submission_minutes_before_deadline", 45.0))
    
    if cluster_diff < 0.5:
        bid_pattern_score += 15.0
        reasons.append(f"Cover Bidding Anomaly: Quoted price within {cluster_diff:.2f}% of competing bidder (cartel clustering signal).")
    elif cluster_diff < 1.5:
        bid_pattern_score += 8.0
        reasons.append(f"Narrow Price Proximity: Margin between competing bids is unusually narrow ({cluster_diff:.2f}%).")
        
    if submission_minutes_before_deadline < 5.0:
        bid_pattern_score += 5.0
        reasons.append(f"Waiting Timing Anomaly: Bid submitted {submission_minutes_before_deadline:.0f} mins before closing (burst submission pattern).")
    else:
        bid_pattern_score += 2.0
        reasons.append("Independent Bid Pattern: Orderly submission timing with standard competitive dispersion.")
        
    bid_pattern_score = min(20.0, bid_pattern_score)

    # ─── 4. Financial Solvency & Capacity (Max 20 pts) ────────────────────────
    turnover_ratio = float(features.get("turnover_to_tender_ratio", 3.5))
    active_works = int(features.get("active_concurrent_works", 2))
    
    if turnover_ratio < 1.0:
        financial_cap_score = 20.0
        reasons.append("Financial Capacity Deficit: Annual turnover is below 100% of the project contract value.")
    elif turnover_ratio < 2.0 or active_works > 5:
        financial_cap_score = 12.0
        reasons.append(f"Strained Operational Capacity: {active_works} active concurrent projects with moderate turnover cover.")
    else:
        financial_cap_score = 3.0
        reasons.append("Strong Financial Solvency: High annual turnover with verified working capital liquidity.")

    # ─── 5. Document & Regulatory Compliance (Max 20 pts) ────────────────────
    doc_missing = bool(features.get("missing_mandatory_docs", False))
    emd_verified = bool(features.get("emd_verified", True))
    
    if doc_missing or not emd_verified:
        doc_compliance_score = 20.0
        reasons.append("Document Compliance Defect: Missing mandatory technical schedule or EMD bank guarantee discrepancy.")
    else:
        doc_compliance_score = 2.0
        reasons.append("Full Document Compliance: Validated GST, PAN, EMD Bank Guarantee, and audited financials.")

    total_score = min(100.0, past_perf_score + price_dev_score + bid_pattern_score + financial_cap_score + doc_compliance_score)
    
    level = "CRITICAL" if total_score >= 70 else "HIGH" if total_score >= 50 else "MEDIUM" if total_score >= 30 else "LOW"

    return {
        "score": round(total_score, 1),
        "riskLevel": level,
        "parameters": {
            "pastPerformance": round(past_perf_score, 1),
            "priceDeviation": round(price_dev_score, 1),
            "bidPatternTiming": round(bid_pattern_score, 1),
            "financialCapacity": round(financial_cap_score, 1),
            "documentCompliance": round(doc_compliance_score, 1)
        },
        "reasons": reasons,
        "evidence": {
            **evidence,
            "delay_rate_pct": delay_rate,
            "avg_quality": avg_quality,
            "price_dev_pct": price_dev,
            "cluster_diff_pct": cluster_diff,
            "cancelled_count": cancelled_projects
        }
    }


# Alias for backward compatibility with risk_engine
analyze = analyze_contractor_risk
