# ISSUE-16: ML Model Training and Evaluation

| Field | Value |
|---|---|
| **Phase / Day** | Phase 6 · Day 6 |
| **Priority** | Must have |
| **Labels** | `ai-ml`, `python` |
| **Status** | ⬜ Not started |
| **Depends on** | ISSUE-15 |
| **Requirements** | ML-05 – ML-08 · [AI01 §8](../AI_IMPLEMENTATION01.md#8-day-6--model-training-and-evaluation) |

## What is this?
Train the AI model and **prove it is useful** by comparing it with simple rules (baselines). If the model can't beat a simple rule, it isn't adding value. The current demo model learns from random numbers, so it has to be replaced.

## User Story
**As a** project evaluator,
**I want** to see a real model with honest test results,
**so that** I can trust that the "AI" part is genuine.

## Workflow
1. Train **Baseline 1**: always guess the most common answer.
2. Train **Baseline 2**: "high-risk if past incidents were high".
3. Train **Logistic Regression**, which is simple and easy to explain.
4. Train **Random Forest**, which is more powerful.
5. Tune each model on the validation data.
6. Test **once** on the test data.
7. Pick the best model (the simpler one if the results are close) and save it.

## Tasks
- [ ] Rewrite `ai/model/train_model.py`
- [ ] sklearn `Pipeline` (scaler + model)
- [ ] `class_weight="balanced"` for uneven classes
- [ ] Choose the threshold on validation (best F1)
- [ ] Measure precision, recall, F1, ROC-AUC, PR-AUC, and the confusion matrix
- [ ] Save `safety_model.joblib` + `model_meta.json`
- [ ] Write the results table in `docs/ML_MODEL.md`

## Acceptance Criteria
- [ ] **Given** the test set, **then** the chosen model beats both baselines on F1 and ROC-AUC.
- [ ] **Given** `model_meta.json`, **then** it shows the version, date, dataset, features, and metrics.
- [ ] **Given** the train and test scores, **then** the gap is small (no strong overfitting).

## Technical Notes

| Metric | Simple meaning |
|---|---|
| Precision | Of the areas predicted "high-risk", how many really were |
| Recall | Of the real high-risk areas, how many we caught |
| F1 | A balance of the two |
| ROC-AUC | How well it ranks risky areas above safe ones (0.5 = guessing) |
