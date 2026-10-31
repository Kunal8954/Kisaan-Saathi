# Kisan Saathi — Agent Guide

## Product

Kisan Saathi is a Hindi-first AI farming advisor for Indian farmers, built for both
experienced farmers and people new to farming. It helps farmers adapt to climate
change through voice, text, photos, and PDF reports.

### Features

1. **Crop planner** — recommends crops from climate history, season, and mandi
   price/demand signals.
2. **Disease doctor** — accepts a crop photo and returns likely causes
   (deficiency/excess), a chemical-fertilizer remedy, an organic/cow-dung remedy,
   a confidence score, sources, and a "consult your local KVK" disclaimer.
3. **Soil analyst** — accepts a soil-test PDF/image, parses it, and produces
   mineral recommendations.
4. **Stress monitor** — shows satellite crop-stress maps for a farm polygon
   (NDVI anomaly, NDMI, land surface temperature, soil moisture).
5. **Scheme advisor** — retrieval-augmented generation over PMFBY, PM-KISAN,
   Soil Health Card, KCC, and related government documents; returns eligibility
   hints and insurance-claim help.
6. **Local finder** — finds nearby agri-input shops and mandis.
7. **Insurance evidence report** — combines satellite stress changes, weather,
   and farmer photos into a PDF suitable for a crop-insurance claim.

### Experience modes

- `new_farmer`: step-by-step guidance with explanations.
- `experienced`: short, action-oriented alerts.

## Stack

- **Backend:** Python 3.11, FastAPI, Pydantic v2.
- **Agents:** LangGraph + LangChain; one orchestrator and one specialist agent per
  feature.
- **Models:** Google Cloud Vertex AI Gemini, Speech-to-Text, Text-to-Speech
  (`hi-IN`), behind provider abstractions.
- **Satellite:** Google Earth Engine (primary); Bhoonidhi STAC and MOSDAC are
  optional sources.
- **Database:** MongoDB Atlas (profiles, geospatial indexes, Atlas Vector Search).
- **Storage:** Google Cloud Storage.
- **Frontend:** Next.js (TypeScript) PWA, Leaflet, mobile-first.
- **Delivery:** Docker, Google Cloud Run, GitHub Actions.

## Folder map

```text
kisan-saathi/
├── AGENTS.md
├── README.md
├── .env.example
├── docker-compose.yml
├── .github/workflows/          CI and Cloud Run deployment
├── backend/
│   ├── app/
│   │   ├── main.py             FastAPI app and /health
│   │   ├── config.py           Environment-backed settings
│   │   ├── api/routes/         One router per feature
│   │   ├── agents/             Orchestrator + specialist agents
│   │   ├── tools/              Satellite, weather, mandi, places, OCR
│   │   ├── rag/                Ingestion, retrieval, embeddings, prompts
│   │   ├── llm/                Provider-agnostic model and speech layer
│   │   ├── models/             Pydantic request/domain schemas
│   │   ├── db/                 Mongo connection and repositories
│   │   └── services/           Stress scoring and PDF report generation
│   └── tests/                  unit, integration, RAG evals
├── frontend/src/               Next.js PWA shell
├── data/                       Raw scheme/crop documents and samples
├── scripts/                    Seed and ingestion entry points
└── docs/                       Architecture and API notes
```

## Conventions

- Python modules start with a docstring describing their purpose.
- Public functions have typed signatures.
- Scaffolded functions raise `NotImplementedError` or carry an explicit `# TODO`.
  Do not add plausible-looking fake business logic.
- Specialist agents expose exactly one `async def run(state: AgentState) -> AgentState`.
  The orchestrator registers them as LangGraph nodes behind a placeholder router.
- All model access goes through `app/llm/provider.py`; never call a vendor SDK from
  an agent or route directly.
- Keep `app.main` import-safe without optional/heavy dependencies so `/health`
  remains available.
- Secrets belong in environment variables, never in source or committed files.

## Safety rules

- Diagnosis output must always include `confidence: float`, `disclaimer: str`, and
  `sources: list[str]`.
- Disease remedies must be grounded in retrieved documents. Never generate remedies
  free-form.
- Every diagnosis includes the local KVK consultation disclaimer.
- Satellite and weather outputs are advisory evidence, not proof of loss. Insurance
  reports must state their limitations.
- Do not log farmer PII, precise coordinates, images, or API keys.

## Commands

```bash
# Backend (from backend/)
python3.11 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
uvicorn app.main:app --reload
pytest
ruff check .

# Frontend (from frontend/)
npm install
npm run dev
npm run lint
npm run typecheck
```
