# ISSUE-01: Project Setup and Foundation

| Field | Value |
|---|---|
| **Phase / Day** | Phase 1 · Day 1 |
| **Priority** | Must have |
| **Labels** | `setup`, `frontend`, `backend`, `devops` |
| **Status** | ✅ Done |
| **Depends on** | — |
| **Requirements** | NFR-12, NFR-14 |

## What is this?
This issue sets up the basic project: a frontend (React), a backend (Express), a database (MongoDB), and tools that check the code automatically. Every other feature is built on top of it, so it must be stable.

## User Story
**As a** developer,
**I want** a clean project setup that runs with one command,
**so that** I can start building features without setup problems.

## Workflow
1. The developer clones the repository.
2. The developer copies `.env.example` to `.env` and fills in the values.
3. Running `npm install` and then `npm run dev` starts the frontend and the backend.
4. The frontend calls `/api/health` and shows that the backend is running.
5. Every push to GitHub runs CI (lint, type-check, tests).

## Tasks
- [x] Create the monorepo with `frontend/`, `backend/`, `ai/`, `docs/`
- [x] Set up Vite + React + TypeScript
- [x] Set up Express + TypeScript with Helmet, CORS, cookie-parser
- [x] Connect to MongoDB Atlas (`config/db.ts`)
- [x] Add `.env.example` and `.gitignore`
- [x] Add the `GET /api/health` endpoint
- [x] Add the GitHub Actions CI workflow
- [x] Add Dockerfiles and `docker-compose.yml`
- [x] Add `vercel.json` for deployment

## Acceptance Criteria
- [x] **Given** a fresh clone, **when** I run `npm run dev`, **then** both apps start without errors.
- [x] **Given** the backend is running, **when** I open `/api/health`, **then** I get `{ "status": "ok" }`.
- [x] **Given** a push to GitHub, **when** CI runs, **then** lint and tests pass.

## Technical Notes
- **Files:** `backend/src/server.ts`, `backend/src/config/`, `.github/workflows/ci.yml`
- **Security:** no secrets are committed; all secrets are in `.env`
