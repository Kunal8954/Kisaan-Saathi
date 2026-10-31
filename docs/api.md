# API

Base URL locally: `http://localhost:8000`  
Interactive docs: `/docs`  
Feature prefix: `/api`

All unimplemented product endpoints currently return:

```json
{
  "detail": "<feature> is not implemented yet."
}
```

with HTTP status `501 Not Implemented`.

## Endpoints

| Method | Path | Purpose | Status |
| --- | --- | --- | --- |
| GET | `/health` | Liveness check | Working |
| POST | `/api/chat` | Text/voice turn through orchestrator | Stubbed |
| POST | `/api/diagnose` | Crop-photo diagnosis and grounded remedies | Stubbed |
| POST | `/api/soil` | Soil-test report analysis | Stubbed |
| GET | `/api/stress/{farm_id}` | Satellite crop-stress indicators | Stubbed |
| POST | `/api/schemes/advice` | Government-scheme RAG advice | Stubbed |
| GET | `/api/places/nearby` | Nearby agri-input shops/mandis | Stubbed |
| POST | `/api/reports/insurance` | Insurance evidence PDF | Stubbed |

## Health

```http
GET /health
```

```json
{
  "status": "ok",
  "service": "Kisan Saathi",
  "version": "0.1.0",
  "environment": "development"
}
```

## Chat

```http
POST /api/chat
Content-Type: application/json
```

```json
{
  "message": "मेरी गेहूं की फसल में पीले पत्ते हैं, क्या करूँ?",
  "farmer_id": "8f3c9d2a-2a0d-4f03-9e4d-8f2ef6f7f2a1",
  "farm_id": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
  "session_id": "11111111-2222-4333-8444-555555555555",
  "language": "hi",
  "experience_mode": "new_farmer",
  "context": {}
}
```

Planned response (`ChatResponse`): `reply`, `intent`, `agent`, `sources`,
optional `audio_url`, and `metadata`.

## Disease doctor

```http
POST /api/diagnose
Content-Type: multipart/form-data
```

Fields: `file` (JPEG/PNG), `farmer_id`, optional `crop`, optional `farm_id`,
`experience_mode` (`new_farmer` or `experienced`), `language` (`hi` or `en`).

Planned `DiagnosisResult` safety fields:

- `confidence` — number from 0 to 1.
- `disclaimer` — must mention consulting a local KVK.
- `sources` — non-empty list of retrieved document citations.
- `remedies` — exactly two: one chemical-fertilizer and one organic/cow-dung.

## Soil analyst

```http
POST /api/soil
Content-Type: multipart/form-data
```

Fields: `file` (PDF/image), `farmer_id`, optional `farm_id`, `language`.

## Stress monitor

```http
GET /api/stress/{farm_id}?start_date=2026-06-01&end_date=2026-07-01
```

Planned output includes NDVI, NDVI anomaly, NDMI, land-surface temperature, soil
moisture, stress score, source, and observation dates.

## Scheme advisor

```http
POST /api/schemes/advice
Content-Type: application/json
```

```json
{
  "question": "PMFBY में दावा कैसे करें?",
  "farmer_id": "8f3c9d2a-2a0d-4f03-9e4d-8f2ef6f7f2a1",
  "state": "Uttar Pradesh",
  "crop": "wheat",
  "language": "hi",
  "experience_mode": "new_farmer"
}
```

Answers must be grounded in retrieved scheme documents with citations.

## Local finder

```http
GET /api/places/nearby?latitude=26.8467&longitude=80.9462&radius_km=25&place_type=both
```

`place_type` is `shop`, `mandi`, or `both`.

## Insurance evidence report

```http
POST /api/reports/insurance
Content-Type: application/json
```

```json
{
  "farmer_id": "8f3c9d2a-2a0d-4f03-9e4d-8f2ef6f7f2a1",
  "farm_id": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
  "claim_reason": "Flood damage after heavy rainfall",
  "period_start": "2026-06-01",
  "period_end": "2026-07-15",
  "photo_uris": ["gs://bucket/evidence/photo-1.jpg"]
}
```

The generated report must include a disclaimer that satellite and weather evidence
is advisory and does not guarantee claim approval.
