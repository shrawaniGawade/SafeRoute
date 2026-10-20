import json
import time
from pathlib import Path
from typing import Optional, Dict, Any, List

import numpy as np
from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI(
    title="SafeRoute AI Safety Service",
    description="Multi-factor route safety scoring engine and random forest inference",
    version="1.0.0",
)

MODEL_DIR = Path(__file__).resolve().parent.parent / "model"
JSON_MODEL_PATH = MODEL_DIR / "safety_model.json"
JOBLIB_MODEL_PATH = MODEL_DIR / "safety_model.joblib"

class EnsembleModel:
    def __init__(self, data: Dict[str, Any]):
        self.model_name = data.get("model_name", "Random Forest Regressor")
        self.trees: List[Dict[str, Any]] = data.get("trees", [])
        self.n_trees = len(self.trees)

    def predict_one(self, lighting: float, crime_risk: float, accident_risk: float, crowd_level: float) -> float:
        feats = [lighting, crime_risk, accident_risk, crowd_level]
        if not self.trees:
            # Mathematical baseline fallback
            return (
                (lighting * 3.4)
                + (crowd_level * 2.3)
                + ((10 - crime_risk) * 2.6)
                + ((10 - accident_risk) * 1.7)
            )

        tree_preds = []
        for tree in self.trees:
            val = feats[tree["feature_idx"]]
            if val <= tree["threshold"]:
                tree_preds.append(tree["left_val"])
            else:
                tree_preds.append(tree["right_val"])

        return float(np.mean(tree_preds))


ensemble_model: Optional[EnsembleModel] = None

# 1. Attempt loading trained JSON ensemble weights
if JSON_MODEL_PATH.exists():
    try:
        with open(JSON_MODEL_PATH, "r", encoding="utf-8") as f:
            ensemble_model = EnsembleModel(json.load(f))
        print(f"[AIService] Loaded {ensemble_model.model_name} with {ensemble_model.n_trees} decision trees.")
    except Exception as e:
        print(f"[AIService] Failed to load JSON model: {e}")

# 2. Attempt joblib if JSON ensemble is not loaded
joblib_model = None
if ensemble_model is None and JOBLIB_MODEL_PATH.exists():
    try:
        import joblib
        joblib_model = joblib.load(JOBLIB_MODEL_PATH)
        print("[AIService] Loaded Scikit-Learn Joblib Model successfully.")
    except Exception as e:
        # Expected on Windows when system DLL policy restricts C-extension unpickler
        pass


class SafetyRequest(BaseModel):
    lighting: float = Field(ge=0, le=10, description="Lighting quality score (0 to 10)")
    crime_risk: float = Field(ge=0, le=10, description="Crime risk severity index (0 to 10)")
    accident_risk: float = Field(ge=0, le=10, description="Accident probability index (0 to 10)")
    crowd_level: float = Field(ge=0, le=10, description="Pedestrian crowd density (0 to 10)")


@app.get("/")
def home():
    return {
        "service": "SafeRoute AI Engine",
        "status": "online",
        "model_loaded": ensemble_model is not None or joblib_model is not None,
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "model_loaded": ensemble_model is not None or joblib_model is not None,
        "model_architecture": ensemble_model.model_name if ensemble_model else ("Scikit-Learn Joblib" if joblib_model else "Mathematical Baseline"),
        "features": ["lighting", "crime_risk", "accident_risk", "crowd_level"],
    }


@app.post("/predict")
def predict_safety(data: SafetyRequest):
    t_start = time.perf_counter()
    score: Optional[float] = None
    model_used = "Mathematical Cloud Fallback"

    if joblib_model is not None:
        try:
            feats = np.array([[data.lighting, data.crime_risk, data.accident_risk, data.crowd_level]])
            score = float(joblib_model.predict(feats)[0])
            model_used = "Random Forest Regressor (Scikit-Learn)"
        except Exception:
            score = None

    if score is None and ensemble_model is not None:
        try:
            score = ensemble_model.predict_one(
                lighting=data.lighting,
                crime_risk=data.crime_risk,
                accident_risk=data.accident_risk,
                crowd_level=data.crowd_level,
            )
            model_used = ensemble_model.model_name
        except Exception:
            score = None

    if score is None:
        raw_score = (
            (data.lighting * 3.5)
            + (data.crowd_level * 2.5)
            + ((10 - data.crime_risk) * 2.5)
            + ((10 - data.accident_risk) * 1.5)
        )
        score = float(raw_score)
        model_used = "Mathematical Heuristic Engine"

    # Clamp to valid 0-100 range
    final_score = round(max(0.0, min(100.0, score)), 2)
    latency_ms = round((time.perf_counter() - t_start) * 1000, 2)

    # Classify rating badge
    if final_score >= 80:
        rating = "Optimal (Safe Route)"
    elif final_score >= 55:
        rating = "Moderate Caution"
    else:
        rating = "High Risk (Avoid if possible)"

    return {
        "safety_score": final_score,
        "rating": rating,
        "model": model_used,
        "latency_ms": latency_ms,
        "factors": {
            "lighting_contribution": round(data.lighting * 3.4, 2),
            "crowd_contribution": round(data.crowd_level * 2.3, 2),
            "crime_deduction": round(data.crime_risk * 2.6, 2),
            "accident_deduction": round(data.accident_risk * 1.7, 2),
        },
        "data_type": "synthetic_ml_inference",
        "warning": "Demonstration only. Not validated for real-world emergency dispatch.",
    }
