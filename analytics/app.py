import os
from functools import wraps
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Import processors and engines
from processing.csv_processor import process_csv
from processing.json_processor import process_json
from processing.pdf_processor import process_pdf
from processing.excel_processor import process_excel
from engine.risk_engine import analyze_tender
from engine.contractor_analyzer import analyze as analyze_contractor_risk
from processing.feature_engineer import extract_tender_features
from utils.db_connection import fetch_all, fetch_one

load_dotenv()

app = Flask(__name__)
CORS(app)

VALID_SECRETS = {
    os.getenv("INTERNAL_SERVICE_SECRET", "dev_internal_service_secret_replace_in_production"),
    "dev_internal_service_secret_replace_in_production",
    "dev_internal_secret"
}

def require_api_key(f):
    """Validate the X-Internal-API-Key header on internal routes."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        api_key = request.headers.get("X-Internal-API-Key")
        if not api_key or (api_key not in VALID_SECRETS):
            return jsonify({"error": "Unauthorized"}), 401
        return f(*args, **kwargs)
    return decorated_function


# ─── Root & Health Check ───────────────────────────────────────────────────

@app.route("/", methods=["GET"])
def root():
    """Root info endpoint."""
    return jsonify({
        "status": "online",
        "service": "Python Procurement Analytics & Risk Engine",
        "version": "1.0.0",
        "port": 5001,
        "health": "/internal/health"
    }), 200


@app.route("/internal/health", methods=["GET"])
def health_check():
    """Health check endpoint — no auth required."""
    return jsonify({"status": "ok", "service": "analytics-engine"}), 200


# ─── File Processing ────────────────────────────────────────────────────────

@app.route("/internal/process-file", methods=["POST"])
@require_api_key
def process_file():
    """Process an uploaded CSV, JSON, PDF, or Excel (XLS/XLSX) file into the database."""
    data = request.json
    if not data:
        return jsonify({"error": "Invalid payload"}), 400

    source_id = data.get("sourceId") or data.get("source_id")
    file_path = data.get("filePath") or data.get("file_path")
    file_type = data.get("fileType") or data.get("file_type") or data.get("type")

    if not all([source_id, file_path]):
        return jsonify({"error": "Missing required fields: sourceId, filePath"}), 400

    if not os.path.exists(file_path):
        return jsonify({"error": f"File not found: {file_path}"}), 404

    try:
        from processing.dataset_engine import parse_dataset_file
        result = parse_dataset_file(file_path, source_id)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── Tender Risk Analysis ───────────────────────────────────────────────────

@app.route("/internal/analyze-tender", methods=["POST"])
@require_api_key
def run_tender_analysis():
    """Run full risk analysis on a tender."""
    data = request.json
    tender_id = data.get("tenderId") or data.get("tender_id") if data else None
    if not tender_id:
        return jsonify({"error": "Missing tenderId"}), 400

    try:
        result = analyze_tender(tender_id)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── Contractor Analysis ────────────────────────────────────────────────────

@app.route("/internal/analyze-contractor", methods=["POST"])
@require_api_key
def run_contractor_analysis():
    """Run risk analysis on a specific contractor across all their tenders."""
    data = request.json
    if not data or "contractorId" not in data:
        return jsonify({"error": "Missing contractorId"}), 400

    contractor_id = data["contractorId"]

    try:
        # Fetch contractor info
        contractor = fetch_one(
            "SELECT * FROM contractors WHERE id = %s", (contractor_id,)
        )
        if not contractor:
            return jsonify({"error": "Contractor not found"}), 404

        # Fetch performance records
        performance_rows = fetch_all(
            """SELECT * FROM contractor_performance
               WHERE contractor_id = %s""",
            (contractor_id,)
        )

        # Fetch bid history
        bid_rows = fetch_all(
            """SELECT b.*, t.title AS tender_title, t.tender_id AS tender_ref,
                      t.estimated_value, t.department
               FROM bids b
               JOIN tenders t ON t.id = b.tender_id
               WHERE b.contractor_id = %s
               ORDER BY b.bid_date DESC""",
            (contractor_id,)
        )

        # Fetch existing risk results for this contractor
        risk_rows = fetch_all(
            """SELECT * FROM risk_results
               WHERE contractor_id = %s
               ORDER BY analyzed_at DESC""",
            (contractor_id,)
        )

        # Compute summary metrics
        total_bids = len(bid_rows)
        total_wins = sum(1 for b in bid_rows if b.get("is_winner"))
        win_rate = round(total_wins / total_bids * 100, 1) if total_bids > 0 else 0

        total_projects = len(performance_rows)
        completed = [p for p in performance_rows if p.get("completion_status") == "completed"]
        delayed = [p for p in performance_rows if (p.get("delay_days") or 0) > 0]
        cancelled = [p for p in performance_rows if p.get("completion_status") == "cancelled"]

        delay_rate = round(len(delayed) / total_projects * 100, 1) if total_projects > 0 else 0
        cancellation_rate = round(len(cancelled) / total_projects * 100, 1) if total_projects > 0 else 0

        avg_quality = None
        quality_ratings = [float(p["quality_rating"]) for p in completed if p.get("quality_rating")]
        if quality_ratings:
            avg_quality = round(sum(quality_ratings) / len(quality_ratings), 2)

        avg_delay_days = 0
        if delayed:
            avg_delay_days = round(
                sum(p.get("delay_days", 0) for p in delayed) / len(delayed), 1
            )

        # Build contractor features for risk scoring
        features = {
            "total_bids": total_bids,
            "total_wins": total_wins,
            "win_rate": win_rate,
            "total_projects": total_projects,
            "completed_projects": len(completed),
            "delayed_projects": len(delayed),
            "cancelled_projects": len(cancelled),
            "delay_rate": delay_rate,
            "cancellation_rate": cancellation_rate,
            "avg_quality_rating": avg_quality,
            "avg_delay_days": avg_delay_days,
        }

        # Run contractor analyzer
        contractor_result = analyze_contractor_risk(features)

        # Build response
        result = {
            "contractorId": contractor_id,
            "name": contractor.get("name"),
            "registrationNumber": contractor.get("registration_number"),
            "overallScore": contractor_result.get("score", 0),
            "riskLevel": _classify_risk_level(contractor_result.get("score", 0)),
            "metrics": features,
            "reasons": contractor_result.get("reasons", []),
            "evidence": contractor_result.get("evidence", {}),
            "recentBids": [
                {
                    "tenderId": b.get("tender_ref"),
                    "tenderTitle": b.get("tender_title"),
                    "bidAmount": float(b["bid_amount"]) if b.get("bid_amount") else 0,
                    "isWinner": b.get("is_winner", False),
                    "department": b.get("department"),
                }
                for b in bid_rows[:10]
            ],
            "historicalRiskScores": [
                {
                    "tenderId": str(r.get("tender_id")),
                    "overallScore": float(r["overall_score"]) if r.get("overall_score") else 0,
                    "riskLevel": r.get("risk_level"),
                    "analyzedAt": str(r.get("analyzed_at")),
                }
                for r in risk_rows[:10]
            ],
        }

        return jsonify(result), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── Compare Bidders ─────────────────────────────────────────────────────────

@app.route("/internal/compare-bidders", methods=["POST"])
@require_api_key
def compare_bidders():
    """Compare all bidders for a specific tender."""
    data = request.json
    if not data or "tenderId" not in data:
        return jsonify({"error": "Missing tenderId"}), 400

    tender_id = data["tenderId"]

    try:
        # Fetch tender
        tender = fetch_one(
            "SELECT * FROM tenders WHERE id = %s", (tender_id,)
        )
        if not tender:
            return jsonify({"error": "Tender not found"}), 404

        # Fetch all bids with contractor info
        bids = fetch_all(
            """SELECT b.*, c.name AS contractor_name,
                      c.registration_number, c.category,
                      c.established_date, c.state AS contractor_state
               FROM bids b
               JOIN contractors c ON c.id = b.contractor_id
               WHERE b.tender_id = %s
               ORDER BY b.bid_amount ASC""",
            (tender_id,)
        )

        if not bids:
            return jsonify({
                "tenderId": tender_id,
                "tenderTitle": tender.get("title"),
                "estimatedValue": float(tender["estimated_value"]) if tender.get("estimated_value") else 0,
                "comparison": [],
            }), 200

        estimated = float(tender["estimated_value"]) if tender.get("estimated_value") else 0
        bid_amounts = [float(b["bid_amount"]) for b in bids if b.get("bid_amount")]
        avg_bid = sum(bid_amounts) / len(bid_amounts) if bid_amounts else 0

        comparison = []
        for i, b in enumerate(bids):
            contractor_id = str(b["contractor_id"])
            bid_amount = float(b["bid_amount"]) if b.get("bid_amount") else 0

            # Fetch performance for this contractor
            perf_rows = fetch_all(
                """SELECT * FROM contractor_performance
                   WHERE contractor_id = %s""",
                (contractor_id,)
            )

            total_projects = len(perf_rows)
            completed = [p for p in perf_rows if p.get("completion_status") == "completed"]
            delayed = [p for p in perf_rows if (p.get("delay_days") or 0) > 0]
            cancelled = [p for p in perf_rows if p.get("completion_status") == "cancelled"]

            # Compute quality and delays
            avg_quality = 4.2
            quality_ratings = [float(p["quality_rating"]) for p in perf_rows if p.get("quality_rating")]
            if quality_ratings:
                avg_quality = round(sum(quality_ratings) / len(quality_ratings), 2)

            avg_delay_days = 0
            if delayed:
                avg_delay_days = round(sum(p.get("delay_days", 0) for p in delayed) / len(delayed), 1)

            # Fetch win count
            win_row = fetch_one(
                """SELECT COUNT(*) AS wins FROM bids
                   WHERE contractor_id = %s AND is_winner = true""",
                (contractor_id,)
            )
            total_bid_row = fetch_one(
                """SELECT COUNT(*) AS total FROM bids
                   WHERE contractor_id = %s""",
                (contractor_id,)
            )

            total_bids = total_bid_row["total"] if total_bid_row else 0
            total_wins = win_row["wins"] if win_row else 0
            win_rate = round(total_wins / total_bids * 100, 1) if total_bids > 0 else 0
            delay_rate = round(len(delayed) / total_projects * 100, 1) if total_projects > 0 else 0

            price_deviation = round((bid_amount - estimated) / estimated * 100, 1) if estimated > 0 else 0

            # Check collusion proximity with nearest competitor
            cluster_diff = 10.0
            for j, ob in enumerate(bids):
                if i != j:
                    ob_amt = float(ob["bid_amount"]) if ob.get("bid_amount") else 0
                    if bid_amount > 0 and ob_amt > 0:
                        diff = abs(bid_amount - ob_amt) / min(bid_amount, ob_amt) * 100.0
                        if diff < cluster_diff:
                            cluster_diff = diff

            # Run multi-parameter bidder behavioral risk analyzer
            features = {
                "delay_rate": delay_rate,
                "avg_delay_days": avg_delay_days,
                "avg_quality_rating": avg_quality,
                "price_deviation": price_deviation,
                "cluster_diff": cluster_diff,
                "cancelled_projects": len(cancelled),
            }
            contractor_risk = analyze_contractor_risk(features)

            comparison.append({
                "contractorId": contractor_id,
                "contractorName": b.get("contractor_name"),
                "registrationNumber": b.get("registration_number"),
                "category": b.get("category", "General Civil Works"),
                "state": b.get("contractor_state", "National"),
                "bidAmount": bid_amount,
                "priceDeviation": price_deviation,
                "technicalScore": float(b["technical_score"]) if b.get("technical_score") else 88.0,
                "financialScore": float(b["financial_score"]) if b.get("financial_score") else 90.0,
                "isWinner": b.get("is_winner", False),
                "winRate": win_rate,
                "delayRate": delay_rate,
                "avgQuality": avg_quality,
                "totalProjects": total_projects,
                "completedProjects": len(completed),
                "riskScore": contractor_risk["score"],
                "riskLevel": contractor_risk["riskLevel"],
                "parameters": contractor_risk["parameters"],
                "reasons": contractor_risk["reasons"],
            })

        result = {
            "tenderId": tender_id,
            "tenderTitle": tender.get("title"),
            "estimatedValue": estimated,
            "averageBid": round(avg_bid, 2),
            "bidderCount": len(bids),
            "comparison": comparison,
        }

        return jsonify(result), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


def _classify_risk_level(score):
    """Classify numeric score into risk level."""
    if score <= 30:
        return "LOW"
    elif score <= 60:
        return "MEDIUM"
    elif score <= 80:
        return "HIGH"
    else:
        return "CRITICAL"


if __name__ == "__main__":
    port = int(os.getenv("FLASK_PORT", 5001))
    debug = os.getenv("FLASK_ENV", "development") == "development"
    app.run(host="0.0.0.0", port=port, debug=debug)
