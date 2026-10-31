# Kisan Saathi

Hindi-first AI farming advisor for Indian farmers facing climate change. This
repository is a hackathon scaffold: the structure, contracts, and configuration
are in place, while feature logic is intentionally stubbed.

## What works now

- FastAPI app starts and `GET /health` returns `200`.
- API route contracts return `501 Not Implemented`.
- Pydantic schemas, including the diagnosis safety contract, are defined.
- Next.js PWA shell, navigation, and empty feature pages render.
- `pytest` runs with a health-check test and schema tests.
- CI and Cloud Run deployment workflows are defined.

## Quick start

### Backend

```bash
cd backend
python3.11 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
cp ../.env.example ../.env
uvicorn app.main:app --reload
```

Health check: <http://localhost:8000/health>  
OpenAPI docs: <http://localhost:8000/docs>

### Frontend

```bash
cd frontend
npm install
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000 npm run dev
```

Open <http://localhost:3000>.

### Docker Compose

```bash
cp .env.example .env
docker compose up --build
```

## Documentation

- [Architecture](docs/architecture.md)
- [API](docs/api.md)
- [Agent conventions](AGENTS.md)

## Status

All product behavior is stubbed. No live Gemini, Earth Engine, MongoDB, storage,
speech, OCR, or report generation calls are implemented yet.
