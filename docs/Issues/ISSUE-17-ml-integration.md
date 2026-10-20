# ISSUE-17: ML Prediction API and Integration

| Field | Value |
|---|---|
| **Phase / Day** | Phase 7 · Day 7 |
| **Priority** | Must have |
| **Labels** | `ai-ml`, `backend`, `frontend`, `python` |
| **Status** | 🟡 Partly done (demo `/predict` and `aiService.ts` exist) |
| **Depends on** | ISSUE-13, ISSUE-16 |
| **Requirements** | FR-6.1 – FR-6.5, ML-09 – ML-11 · [AI01 §9](../AI_IMPLEMENTATION01.md#9-day-7--prediction-api-and-integration) |

## What is this?
This connects the trained model to the app. When a user searches routes, the backend sends the route points to the Python AI service, which returns a risk estimate. If the AI service is down, the app **still works** and shows a small "AI unavailable" note.

## User Story
**As a** user,
**I want** to see an AI risk estimate next to the Safety Score,
**so that** I get a second, data-learned opinion about each route.

## Workflow
1. The user searches routes.
2. The backend sends each route's points and the departure time to `POST /predict-route`.
3. The AI service finds each point's area, predicts the risk, and returns the average and highest risk.
4. The route card shows **"AI risk: Low (0.21)"** with the model version.
5. If the AI service doesn't answer within 3 seconds, the card shows **"AI estimate unavailable"**.

## Tasks
- [ ] FastAPI: `GET /health`, `GET /model-info`, `POST /predict-route`
- [ ] Load the model, metadata, and cell features once at startup
- [ ] Pydantic validation (lat/lng ranges, hour 0–23, at most 500 points)
- [ ] Return `coverage`; below 0.6 → "Insufficient data"
- [ ] Node: `predictRouteRisk()` in `aiService.ts` with a 3-second timeout
- [ ] Fallback returns `{aiEstimate: null, fallback: true}`, clearly labelled
- [ ] Add `aiEstimate` to each route in `/api/routes/search`
- [ ] UI chip, model version, warning text, fallback badge
- [ ] pytest for the API; Vitest for the fallback

## Acceptance Criteria
- [ ] **Given** the AI service is running, **when** I search, **then** each route shows an AI risk.
- [ ] **Given** I stop the AI service, **when** I search, **then** routes still load and show "AI estimate unavailable".
- [ ] **Given** an area outside the training data, **then** I see "Insufficient data".
- [ ] **Given** the AI chip, **then** I can see the model version and a warning.

## Technical Notes
- Environment variable: `AI_SERVICE_URL`
- Keep the old `/predict` for now, but it must stay labelled `synthetic_demo`
