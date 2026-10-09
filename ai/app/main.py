
from pathlib import Path

import joblib
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

model = joblib.load(MODEL_PATH)


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
    return {"status": "ok", "model_loaded": True}


@app.post("/predict")
def predict_safety(data: SafetyRequest):
    features = np.array([[
        data.lighting,
        data.crime_risk,
        data.accident_risk,
        data.crowd_level,
    ]])

    score = float(model.predict(features)[0])
    score = round(max(0.0, min(100.0, score)), 2)

    return {
        "safety_score": score,
        "model": "Random Forest",
        "data_type": "synthetic_demo",
        "warning": (
            "Demonstration only. Not validated for real-world safety."
        ),
    }
