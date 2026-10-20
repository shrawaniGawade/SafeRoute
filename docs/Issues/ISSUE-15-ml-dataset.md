# ISSUE-15: ML Dataset Preparation

| Field | Value |
|---|---|
| **Phase / Day** | Phase 5 · Day 5 |
| **Priority** | Must have |
| **Labels** | `ai-ml`, `data`, `python` |
| **Status** | ⬜ Not started |
| **Depends on** | ISSUE-02 |
| **Requirements** | ML-01 – ML-04 · [AI01 §7](../AI_IMPLEMENTATION01.md#7-day-5--dataset-and-feature-engineering) |

## What is this?
Before training an AI model, the data must be cleaned and turned into **features** (inputs) and **labels** (answers). The model will learn: *"Given an area's history, will it be high-incident in the future?"*

## User Story
**As a** developer,
**I want** a clean, repeatable training dataset,
**so that** the ML model learns from real patterns and can be checked fairly.

## Workflow
1. Load the raw incident data.
2. Remove bad rows (missing location, duplicates, points outside the city).
3. Split the city into small squares (about 250 m), called cells.
4. Split the day into 4 time bands: Night, Morning, Afternoon, Evening.
5. **Features** (from older months): past incident counts, neighbour counts, lighting, POIs, and so on.
6. **Label** (from newer months): is this cell in the top 25% for incidents? (1 = yes, 0 = no)
7. Split the data into train (70%), validation (15%), and test (15%).

## Tasks
- [ ] `ai/model/prepare_data.py`
- [ ] Cleaning and timestamp parsing
- [ ] Cell IDs (rounded grid or H3)
- [ ] Time-band column
- [ ] History-period features and label-period targets
- [ ] Group split by cell, so neighbouring areas don't leak
- [ ] Save `train.csv`, `val.csv`, `test.csv`, `cell_features.csv`
- [ ] Update `ai/data/README.md` with the row counts

## Acceptance Criteria
- [ ] **Given** I run `python model/prepare_data.py`, **then** the same files are created every time.
- [ ] **Given** the features, **then** none of them use data from the label period (no leakage).
- [ ] **Given** the dataset, **then** there are no empty values in the feature columns.

## Technical Notes
- "Leakage" means the model accidentally sees the answer; the time-based split prevents it
