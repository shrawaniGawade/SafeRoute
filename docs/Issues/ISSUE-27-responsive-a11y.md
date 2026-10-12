# ISSUE-27: Responsive Design and Accessibility

| Field | Value |
|---|---|
| **Phase / Day** | Phase 9 · Day 9 |
| **Priority** | Must have |
| **Labels** | `ux`, `frontend`, `accessibility` |
| **Status** | ⬜ Not started |
| **Depends on** | All frontend issues |
| **Requirements** | NFR-9 – NFR-11 |

## What is this?
The app must work well on phones, tablets, and computers, and be usable by everyone, including people who use a keyboard or are colour-blind.

## User Story
**As a** mobile user,
**I want** the app to fit my screen and be easy to tap,
**so that** I can plan routes on the go.

## Workflow (Check Each Screen)
1. Open each page at **320, 360, 768, 1024, and 1440 px** wide.
2. Make sure nothing scrolls sideways.
3. On mobile, route cards appear in a **bottom sheet**; on desktop, in a **sidebar**.
4. Use the app with the **keyboard only** (Tab, Enter, Esc).
5. Make sure text is easy to read (good contrast).
6. Make sure risk is shown with text and numbers, not just colours.

## Tasks
- [ ] Fix layouts at each breakpoint (640 / 768 / 1024 / 1280)
- [ ] Touch targets of at least 40 px
- [ ] Visible focus rings on all buttons and inputs
- [ ] `aria-label` on icon-only buttons; `alt` on images
- [ ] Contrast check (WCAG AA)
- [ ] `prefers-reduced-motion`: turn off animations
- [ ] Semantic HTML (`main`, `nav`, `section`, one `h1` per page)

## Acceptance Criteria
- [ ] **Given** a 320 px screen, **then** no page scrolls sideways.
- [ ] **Given** keyboard only, **then** I can search and select a route.
- [ ] **Given** a contrast checker, **then** all text passes AA.
- [ ] **Given** reduced motion is set, **then** the animations are skipped.

## Technical Notes
- Use Lighthouse (Accessibility score ≥ 90) as a quick check
