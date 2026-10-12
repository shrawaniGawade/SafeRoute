# ISSUE-29: Documentation and Presentation

| Field | Value |
|---|---|
| **Phase / Day** | Phase 10 · Day 10 (+ optional Days 11–12) |
| **Priority** | Must have |
| **Labels** | `docs`, `presentation` |
| **Status** | 🟡 Partly done (BRD, SRS, FRD, plans, slides exist) |
| **Depends on** | ISSUE-28 |
| **Requirements** | BRD §20 |

## What is this?
Good documentation and a practised demo show that you understand what you built, including its limits. This is what evaluators and interviewers remember most.

## User Story
**As an** evaluator or interviewer,
**I want** clear documents and a smooth demo,
**so that** I can quickly understand the project and its quality.

## Workflow (7–10 Minute Demo)
1. **Introduction (1 min):** the problem: routes should consider safety, not just speed.
2. **Route search (2 min):** search two places and compare the routes.
3. **Safety analysis (2 min):** show the score, recommendation, breakdown, AI estimate, and limits.
4. **User and admin (1 min):** login, saved history, admin dashboard.
5. **Technical (2 min):** architecture, scoring formula, ML model, and testing.
6. **Questions.**

## Tasks
- [x] BRD, SRS, FRD, Implementation Plan, AI Plan
- [ ] README: summary, screenshots, features, setup, live link, limitations
- [ ] `docs/ML_MODEL.md`: dataset, metrics table, limitations
- [ ] `docs/TEST_RESULTS.md`: TC-01 – TC-16 results
- [ ] Architecture diagram image
- [ ] Update `PRESENTATION_SLIDES.md` and `DEMO_WALKTHROUGH.md`
- [ ] Record a backup demo video
- [ ] Practise the interview questions (see [AI01 §14](../AI_IMPLEMENTATION01.md#14-interview-questions-and-answers))

## Acceptance Criteria
- [ ] **Given** the README, **then** a new developer can run the project locally.
- [ ] **Given** a rehearsal, **then** the demo fits in 10 minutes.
- [ ] **Given** the question "Is the score a safety guarantee?", **then** the answer is clear: **No**, and here is why.

## Technical Notes
- **Key message:** "I built a working full-stack app with an explainable safety score and a genuinely evaluated ML model, and I can explain what the data does and doesn't prove."
