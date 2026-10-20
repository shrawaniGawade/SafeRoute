# SafeRoute – Issue Tracker

This folder has **one file per issue (task)**. Each file explains, in simple words:

- **What is this?** A short explanation of the feature and why it is needed
- **User story:** who wants it and why ("As a … I want … so that …")
- **Workflow:** how the feature works, step by step, from the user's point of view
- **Tasks:** the development steps to build it
- **Acceptance criteria:** how to check it is finished (Given / When / Then)
- **Technical notes:** files, APIs, and security points

Related documents: [BRD01](../BRD01.md) · [SRS01](../SRS01.md) · [FRD01](../FRD01.md) · [IMPLEMENTATION_PLAN01](../IMPLEMENTATION_PLAN01.md) · [AI_IMPLEMENTATION01](../AI_IMPLEMENTATION01.md)

---

## Status Key

| Icon | Meaning |
|---|---|
| ✅ | Done |
| 🟡 | In progress or partly done |
| ⬜ | Not started |

**Priority:** **M** = Must have · **S** = Should have · **C** = Could have

---

## Issue List

| # | Issue | Phase / Day | Priority | Status |
|---|---|:---:|:---:|:---:|
| 01 | [Project setup and foundation](ISSUE-01-project-setup.md) | 1 | M | ✅ |
| 02 | [Select and document datasets](ISSUE-02-dataset-selection.md) | 1 | M | ⬜ |
| 03 | [User registration and OTP verification](ISSUE-03-registration-otp.md) | 2 | M | ✅ |
| 04 | [Login, session refresh and logout](ISSUE-04-login-session.md) | 2 | M | ✅ |
| 05 | [Forgot and reset password](ISSUE-05-password-reset.md) | 2 | S | ✅ |
| 06 | [Role-based access control](ISSUE-06-role-based-access.md) | 2 | M | ✅ |
| 07 | [Interactive map](ISSUE-07-interactive-map.md) | 3 | M | 🟡 |
| 08 | [Location search (geocoding)](ISSUE-08-location-search.md) | 3 | M | ⬜ |
| 09 | [Show a route on the map](ISSUE-09-single-route.md) | 3 | M | ⬜ |
| 10 | [Alternative routes and route cards](ISSUE-10-alternative-routes.md) | 4 | M | ⬜ |
| 11 | [Loading, error and empty states](ISSUE-11-route-ui-states.md) | 4 | M | ✅ |
| 12 | [Safety data models and seed data](ISSUE-12-safety-data.md) | 5 | M | ⬜ |
| 13 | [Safety Score engine](ISSUE-13-safety-score-engine.md) | 5 | M | ⬜ |
| 14 | [Route recommendation and explanation](ISSUE-14-recommendation.md) | 5 | M | ✅ |
| 15 | [ML dataset preparation](ISSUE-15-ml-dataset.md) | 5 | M | ⬜ |
| 16 | [ML model training and evaluation](ISSUE-16-ml-training.md) | 6 | M | ⬜ |
| 17 | [ML prediction API and integration](ISSUE-17-ml-integration.md) | 7 | M | 🟡 |
| 18 | [Safety analysis UI](ISSUE-18-safety-analysis-ui.md) | 8 | M | ⬜ |
| 19 | [Emergency locations and Emergency Mode](ISSUE-19-emergency.md) | 8 | S | ⬜ |
| 20 | [Route history](ISSUE-20-route-history.md) | 8 | M | ⬜ |
| 21 | [User preferences](ISSUE-21-user-preferences.md) | 8 | S | ⬜ |
| 22 | [Admin dashboard and user management](ISSUE-22-admin-dashboard.md) | 8 | M | ✅ |
| 23 | [Admin safety-record management](ISSUE-23-admin-safety-records.md) | 8 | S | ⬜ |
| 24 | [Admin scoring weights and audit log](ISSUE-24-admin-weights-audit.md) | 8 | S | ⬜ |
| 25 | [Testing and QA](ISSUE-25-testing.md) | 9 | M | 🟡 |
| 26 | [Security hardening](ISSUE-26-security.md) | 9 | M | 🟡 |
| 27 | [Responsive design and accessibility](ISSUE-27-responsive-a11y.md) | 9 | M | ⬜ |
| 28 | [Deployment](ISSUE-28-deployment.md) | 10 | M | 🟡 |
| 29 | [Documentation and presentation](ISSUE-29-docs-presentation.md) | 10 | M | 🟡 |

---

## How Issues Connect (Order of Work)

```
01 Setup ─┬─> 03 Register ─> 04 Login ─> 05 Reset ─> 06 Roles ─┬─> 20 History ─> 21 Preferences
          │                                                   └─> 22 Admin ─> 23 Records ─> 24 Weights
          │
          ├─> 07 Map ─> 08 Search ─> 09 Route ─> 10 Alternatives ─> 11 UI states
          │                                          │
          │                                          ▼
          ├─> 02 Datasets ─> 12 Safety data ─> 13 Score engine ─> 14 Recommendation ─> 18 Safety UI
          │         │                                │
          │         └─> 15 ML data ─> 16 Train ─> 17 ML integration
          │
          └─> 19 Emergency (needs 12)

All ─> 25 Testing ─> 26 Security ─> 27 Responsive ─> 28 Deploy ─> 29 Docs & demo
```

---

## How to Work on an Issue

1. Pick the next ⬜ issue whose dependencies are ✅.
2. Create a branch: `feature/<issue-name>` from `dev`.
3. Follow the **Tasks** list from top to bottom.
4. Check every **Acceptance criteria** item.
5. Open a pull request into `dev` that includes `Closes #<issue number>`.
6. Mark the issue ✅ in this README.

**Tip:** to copy an issue to GitHub, run
`gh issue create --title "<title>" --body-file docs/Issues/ISSUE-XX-name.md --label <labels>`
