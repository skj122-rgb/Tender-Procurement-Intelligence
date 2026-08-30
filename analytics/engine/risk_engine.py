"""
Risk Engine Orchestrator
========================
Coordinates all component analyzers to produce a complete risk assessment
for a given tender.
"""

import json
from processing.feature_engineer import extract_tender_features
from engine.price_analyzer import analyze as analyze_price
from engine.bid_pattern_analyzer import analyze as analyze_bid_pattern
from engine.boq_analyzer import analyze as analyze_boq
from engine.contractor_analyzer import analyze as analyze_contractor
from engine.document_analyzer import analyze as analyze_document
from engine.isolation_forest import detect_anomalies
from utils.helpers import classify_risk_level
from utils.db_connection import execute_query, fetch_all


def analyze_tender(tender_id):
    """
    Run full risk analysis on a tender.

    Args:
        tender_id: UUID of the tender to analyze.

    Returns:
        dict with overallScore, riskLevel, components, reasons, evidence.
    """
    # 1. Extract features
    features = extract_tender_features(tender_id)

    if not features:
        return {
            "tenderId": tender_id,
            "overallScore": 0,
            "riskLevel": "LOW",
            "components": {
                "price": 0,
                "bidPattern": 0,
                "boq": 0,
                "contractor": 0,
                "document": 0,
            },
            "reasons": ["Insufficient data to perform risk analysis"],
            "evidence": {},
        }

    # 2. Run each component analyzer
    price_res = analyze_price(features)
    bid_res = analyze_bid_pattern(features)
    boq_res = analyze_boq(features)
    contractor_res = analyze_contractor(features)
    doc_res = analyze_document(features)

    # 3. Run Isolation Forest anomaly detection if we have enough historical data
    anomaly_boost = 0
    try:
        historical_features = _get_historical_feature_matrix(tender_id)
        if len(historical_features) >= 10:
            # Build current feature vector from the numeric features
            current_vector = [
                features.get("price_deviation", 0),
                features.get("bid_estimate_ratio", 1),
                features.get("bid_spread", 0),
                features.get("num_bidders", 0),
                features.get("delay_rate", 0),
                features.get("win_rate", 0),
            ]
            anomaly_result = detect_anomalies(
                historical_features, [current_vector]
            )
            if anomaly_result.get("is_anomaly"):
                anomaly_boost = 5  # Add a small boost to the total score
    except Exception:
        # If anomaly detection fails, continue without it
        pass

    # 4. Aggregate scores
    raw_total = (
        price_res["score"]
        + bid_res["score"]
        + boq_res["score"]
        + contractor_res["score"]
        + doc_res["score"]
        + anomaly_boost
    )
    total_score = min(100, max(0, round(raw_total, 2)))
    risk_level = classify_risk_level(total_score)

    # 5. Collect reasons from all analyzers
    reasons = []
    reasons.extend(price_res.get("reasons", []))
    reasons.extend(bid_res.get("reasons", []))
    reasons.extend(boq_res.get("reasons", []))
    reasons.extend(contractor_res.get("reasons", []))
    reasons.extend(doc_res.get("reasons", []))

    if anomaly_boost > 0:
        reasons.append(
            "Potential anomaly: statistical anomaly detection flagged this "
            "tender for additional review"
        )

    # 6. Collect evidence
    evidence = {
        "price": price_res.get("evidence", {}),
        "bidPattern": bid_res.get("evidence", {}),
        "boq": boq_res.get("evidence", {}),
        "contractor": contractor_res.get("evidence", {}),
        "document": doc_res.get("evidence", {}),
    }

    # 7. Persist results to risk_results table
    _save_risk_result(
        tender_id=tender_id,
        overall_score=total_score,
        risk_level=risk_level,
        price_score=price_res["score"],
        bid_pattern_score=bid_res["score"],
        boq_score=boq_res["score"],
        contractor_score=contractor_res["score"],
        document_score=doc_res["score"],
        reasons=reasons,
        evidence=evidence,
    )

    return {
        "tenderId": tender_id,
        "overallScore": total_score,
        "riskLevel": risk_level,
        "components": {
            "price": price_res["score"],
            "bidPattern": bid_res["score"],
            "boq": boq_res["score"],
            "contractor": contractor_res["score"],
            "document": doc_res["score"],
        },
        "reasons": reasons,
        "evidence": evidence,
    }


def _save_risk_result(
    tender_id,
    overall_score,
    risk_level,
    price_score,
    bid_pattern_score,
    boq_score,
    contractor_score,
    document_score,
    reasons,
    evidence,
):
    """Persist the risk analysis result into the risk_results table."""
    try:
        execute_query(
            """INSERT INTO risk_results
               (tender_id, overall_score, risk_level,
                price_score, bid_pattern_score, boq_score,
                contractor_score, document_score,
                reasons, evidence)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
            (
                tender_id,
                overall_score,
                risk_level,
                price_score,
                bid_pattern_score,
                boq_score,
                contractor_score,
                document_score,
                json.dumps(reasons),
                json.dumps(evidence),
            ),
        )
    except Exception as e:
        # Log but don't crash — the analysis result is still returned
        print(f"Warning: Failed to save risk result: {e}")


def _get_historical_feature_matrix(exclude_tender_id):
    """
    Build a feature matrix from historical tenders for Isolation Forest.
    Excludes the tender being analyzed.

    Returns:
        list of lists: Each inner list is a feature vector.
    """
    try:
        rows = fetch_all(
            """SELECT t.id, t.estimated_value,
                      COUNT(b.id) AS num_bidders,
                      AVG(b.bid_amount) AS avg_bid,
                      MIN(b.bid_amount) AS min_bid,
                      MAX(b.bid_amount) AS max_bid
               FROM tenders t
               LEFT JOIN bids b ON b.tender_id = t.id
               WHERE t.id != %s
               GROUP BY t.id, t.estimated_value
               HAVING COUNT(b.id) > 0""",
            (exclude_tender_id,),
        )

        features = []
        for row in rows:
            estimated = float(row["estimated_value"]) if row.get("estimated_value") else 0
            avg_bid = float(row["avg_bid"]) if row.get("avg_bid") else 0
            min_bid = float(row["min_bid"]) if row.get("min_bid") else 0
            max_bid = float(row["max_bid"]) if row.get("max_bid") else 0
            num_bidders = int(row["num_bidders"]) if row.get("num_bidders") else 0

            price_deviation = (avg_bid - estimated) / estimated * 100 if estimated > 0 else 0
            bid_estimate_ratio = avg_bid / estimated if estimated > 0 else 1
            bid_spread = (max_bid - min_bid) / avg_bid if avg_bid > 0 else 0

            features.append([
                price_deviation,
                bid_estimate_ratio,
                bid_spread,
                num_bidders,
                0,  # delay_rate placeholder
                0,  # win_rate placeholder
            ])

        return features
    except Exception:
        return []
