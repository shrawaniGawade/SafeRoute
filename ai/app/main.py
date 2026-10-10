
from pathlib import Path

import numpy as np
from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI(
    title="SafeRoute AI Service",
    description="Demo route safety scoring service",
    version="1.0.0",
)

MODEL_PATH = (
    Path(__file__).resolve().parent.parent
    / "model"
    / "safety_model.joblib"
)

model = None
try:
    import joblib
    if MODEL_PATH.exists():
        model = joblib.load(MODEL_PATH)
except (Exception, BaseException) as e:
    print(f"[AIService] Model unpickler unavailable ({e}). Running with demonstration scoring engine.")


class SafetyRequest(BaseModel):
    lighting: float = Field(ge=0, le=10)
    crime_risk: float = Field(ge=0, le=10)
    accident_risk: float = Field(ge=0, le=10)
    crowd_level: float = Field(ge=0, le=10)


@app.get("/")
def home():
    return {"message": "SafeRoute AI service is running"}


@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": model is not None}


@app.post("/predict")
def predict_safety(data: SafetyRequest):
    score = None
    if model is not None:
        try:
            features = np.array([[
                data.lighting,
                data.crime_risk,
                data.accident_risk,
                data.crowd_level,
            ]])
            score = float(model.predict(features)[0])
        except Exception:
            score = None

    if score is None:
        # High lighting & crowd contribute positively; crime & accident contribute negatively
        raw_score = (
            (data.lighting * 3.5)
            + (data.crowd_level * 2.5)
            + ((10 - data.crime_risk) * 2.5)
            + ((10 - data.accident_risk) * 1.5)
        )
        score = float(raw_score)

    score = round(max(0.0, min(100.0, score)), 2)

    return {
        "safety_score": score,
        "model": "Random Forest" if model is not None else "Synthetic Demonstration Engine",
        "data_type": "synthetic_demo",
        "warning": (
            "Demonstration only. Not validated for real-world safety."
        ),
    }

