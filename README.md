# Tender Procurement Intelligence

### Smart India Hackathon 2026 - Procurement Risk \& Anomaly Detection

A decision-support platform for government procurement teams. The system adds an intelligence layer over tender data to help officers **prioritize which tenders need deeper scrutiny** using explainable risk signals, historical comparisons and contractor intelligence.

> **Important** The platform does not declare fraud/corruption and does not automatically award, reject or blacklist a tender. The final decision remains with the authorized officer.

\---

## 1\. What the Project Solves

Manual procurement screening becomes difficult when officers have to compare large numbers of tenders, bids and contractor histories.

This platform brings the relevant evidence into one workflow:

**Tender / History -> Cleaning -> Database -> Risk Analysis -> Explainable Score -> Dashboard -> Human Review**

\---

## 2\. Core Capabilities

### Risk \& Anomaly Intelligence

* **Price deviation** against tender estimates / baselines
* **Bid-pattern analysis** using bidder count and bid spread signals
* **BOQ deviation** analysis
* **Contractor history** including delays, cancellations, wins and quality indicators
* **Document / compliance** checks
* **Isolation Forest** as a supporting statistical anomaly signal when enough historical data is available

### Procurement Workspace

<<<<<<< HEAD
* Tender catalog with search/filtering
* Tender detail and bidder information
* Contractor profiles and execution history
* Bidder comparison / merit view
* Risk score breakdown with reasons and evidence
* Dashboard risk distribution and summary metrics

### Data Center
=======
>>>>>>> 0d6b435e96424ee3b21a34c920e3a12036f3bd65

Supports ingestion of:

* CSV
* XLSX / XLS
* JSON
* PDF

The ingestion pipeline extracts, cleans and stores procurement records for analysis.

### Reports / Exports

* Tender evaluation / review documents
* Bidder comparison exports
* Contractor profile / history exports
* BOQ price-bid exports

### Officer Security

* JWT-based authentication
* Role-based access checks
* Email OTP verification flow
* Protected application routes

\---

## 3\. Architecture

```text
                    +-------------------------+
                    |  React 18 + Vite        |
                    |  Tailwind + Plotly      |
                    |  Officer Web Client     |
                    +-----------+-------------+
                                |
                         REST / JSON / JWT
                                |
                    +-----------v-------------+
                    | Node.js + Express       |
                    | Auth / APIs / Business  |
                    +-----------+-------------+
                                |
                    +-----------v-------------+
                    | Python Analytics        |
                    | Flask + Pandas + NumPy  |
                    | Risk / Feature Engines  |
                    | Scikit-learn support    |
                    +-----------+-------------+
                                |
                    +-----------v-------------+
                    | PostgreSQL / Supabase   |
                    | Tenders / Bids / BOQ    |
                    | Contractors / Results   |
                    +-------------------------+
```

The analytics layer contains separate engines for price, bid pattern, BOQ, contractor and document signals. The main risk engine aggregates these into a bounded score and returns reasons/evidence.

\---

## 4\. Risk Model (Prototype)

The project currently uses five main dimensions:

|Dimension|What it checks|
|-|-|
|Past Performance|Delay, cancellation and quality history|
|Price Deviation|Current bid vs baseline / estimate|
|Bid Pattern|Bid spread, proximity and timing-related signals|
|Financial Capacity|Turnover / operational capacity indicators|
|Document Compliance|Mandatory-document and EMD-related checks|

The system exposes a **0-100 review-priority score**. The exact thresholds/weights are configurable and should be validated against the project dataset before any production use.

\---

## 5\. Current Data Strategy

* Use public / permitted procurement information where available.
* Clearly label synthetic or controlled demo records.
* Keep source and file references wherever possible.
* Do not make allegations about real contractors from an automated score alone.
* If historical data is insufficient, the system should surface limited confidence rather than fabricate a conclusion.

\---

## 6\. Local Setup

### Prerequisites

* Node.js 18+ (20 LTS recommended)
* Python 3.10+
* PostgreSQL / Supabase instance

### Backend

```bash
cd backend
npm install
npm start
```

Default development port: `3000`

### Analytics service

```bash
cd analytics
python -m venv .venv
# Windows PowerShell
.\\\\\\\\.venv\\\\\\\\Scripts\\\\\\\\Activate.ps1

pip install -r requirements.txt
python app.py
```

Default port: `5001`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Default Vite port: `5173`

Open:

`http://localhost:5173`

\---

## 7\. Main API Areas

### Authentication

* `POST /api/auth/signup`
* `POST /api/auth/verify-email-otp`
* `POST /api/auth/login`
* `GET /api/auth/me`

### Tenders / Contractors

* `GET /api/tenders`
* `GET /api/tenders/:id`
* `GET /api/contractors`
* `GET /api/contractors/:id`

### Risk / Analysis

* `GET /api/tenders/:id/analysis`
* `POST /api/tenders/:id/analyze`
* `GET /api/tenders/:id/compare`
* `GET /api/contractors/:id/risk`

### Ingestion

* `POST /api/ingest/upload`
* `GET /api/ingest/sources`
* `POST /api/ingest/sources/:id/run-model`
* `POST /api/ingest/reanalyze-all`

> The project also contains an internal Python analytics service used by the backend. Live government API ingestion is not assumed for the hackathon MVP.

\---

## 8\. Prototype Demo Flow

1. Officer logs in.
2. Dashboard shows tender / risk summary.
3. Open the tender catalog and filter records.
4. Open a tender and inspect bidders / BOQ / procurement details.
5. Open contractor history.
6. Run / view risk analysis.
7. Inspect the score breakdown and reasons.
8. Compare bidders.
9. Export the relevant review document.
10. Officer performs the final human review.

\---

## 9\. Recommended MVP Boundary

The strongest demonstrable path is:

**Upload -> Clean -> Store -> Search -> Tender -> Bidder -> Analyse -> Score -> Explain -> Compare -> Review**

Advanced items such as live government APIs, richer bidder graphs, OCR/LLM extraction and automated report generation should remain secondary until the core end-to-end flow is stable.

\---

## 10\. Project Structure

```text
Tender-Procurement-Intelligence/
├── frontend/          # React UI, dashboards, routes, charts
├── backend/           # Express API, auth, ingestion, services
├── analytics/         # Python analytics + feature/risk engines
├── README.md
└── .env.example
```

### Frontend highlights

* `src/pages/` - application screens
* `src/components/` - reusable UI and dashboard components
* `src/api/client.js` - API client
* `src/context/AuthContext.jsx` - authentication state

### Backend highlights

* `src/routes/` - API routes
* `src/controllers/` - request handling
* `src/services/` - application logic
* `src/middleware/` - auth, validation, upload and error handling
* `src/config/` - environment/database/mock configuration

### Analytics highlights

* `processing/` - data ingestion and cleaning
* `engine/` - risk/anomaly analysis
* `app.py` - Flask analytics service

\---

## 11\. Engineering \& Governance Principles

* **Explainability first:** show what caused a score.
* **Evidence over accusation:** an anomaly is a review signal, not proof of wrongdoing.
* **Human in the loop:** authorized officers retain decision authority.
* **Source awareness:** preserve provenance and distinguish demo data from production data.
* **Reliable MVP first:** do not sacrifice the core vertical slice for flashy but fragile features.

\---

## 12\. Authors / Team

* **Project:** Tender Procurement Intelligence  
* **Track**: Software
* 
* **Team Members:**
* **Shreyansh Maurya** — Team Leader \& Frontend
* **Soumya Singh** — Frontend
* **Shravan Kumar Jaiswal** — Database \& Backend
* **Darsheel Singh** — Backend
* **Mayank Jain** — Data Processing, Risk Engine \& Python Features
* **Shubham Prajapat** — Data Processing, Risk Engine \& Python Features
* 
* **Purpose:** Explainable procurement-risk decision support for human review

