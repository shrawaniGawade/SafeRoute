"""
SafeRoute AI Safety Service — Automated Test Suite
Tests FastAPI endpoints, model inference, safety scoring logic, factor math, and input validation.
"""

import sys
import unittest
from pathlib import Path
from fastapi.testclient import TestClient

# Ensure ai root is in sys.path
AI_ROOT = Path(__file__).resolve().parent.parent
if str(AI_ROOT) not in sys.path:
    sys.path.insert(0, str(AI_ROOT))

from app.main import app, ensemble_model, EnsembleModel


class TestAIService(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_root_endpoint(self):
        """Root endpoint returns service identification and online status."""
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["service"], "SafeRoute AI Engine")
        self.assertEqual(data["status"], "online")
        self.assertTrue(data["model_loaded"])

    def test_health_endpoint(self):
        """Health endpoint reports operational status and feature schema."""
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "ok")
        self.assertTrue(data["model_loaded"])
        self.assertIn("Random Forest", data["model_architecture"])
        self.assertEqual(data["features"], ["lighting", "crime_risk", "accident_risk", "crowd_level"])

    def test_predict_optimal_safety(self):
        """High lighting, low crime, low accidents, high crowd yields higher safety score."""
        payload = {
            "lighting": 9.5,
            "crime_risk": 0.5,
            "accident_risk": 1.0,
            "crowd_level": 8.5
        }
        response = self.client.post("/predict", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreaterEqual(data["safety_score"], 55.0)
        self.assertLessEqual(data["safety_score"], 100.0)
        self.assertIn("factors", data)
        self.assertGreater(data["factors"]["lighting_contribution"], 0)
        self.assertGreater(data["factors"]["crowd_contribution"], 0)
        self.assertIn("latency_ms", data)

    def test_predict_high_risk_route(self):
        """Dark, high crime, dangerous accident corridor yields significantly lower score than safe route."""
        safe_res = self.client.post("/predict", json={
            "lighting": 9.5,
            "crime_risk": 0.5,
            "accident_risk": 1.0,
            "crowd_level": 8.5
        }).json()

        risky_res = self.client.post("/predict", json={
            "lighting": 1.0,
            "crime_risk": 9.0,
            "accident_risk": 8.5,
            "crowd_level": 1.0
        }).json()

        self.assertLess(risky_res["safety_score"], safe_res["safety_score"])
        self.assertLess(risky_res["safety_score"], 50.0)
        self.assertEqual(risky_res["rating"], "High Risk (Avoid if possible)")

    def test_predict_moderate_caution(self):
        """Average parameters yield moderate caution classification."""
        payload = {
            "lighting": 5.0,
            "crime_risk": 5.0,
            "accident_risk": 5.0,
            "crowd_level": 5.0
        }
        response = self.client.post("/predict", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreaterEqual(data["safety_score"], 45.0)
        self.assertLess(data["safety_score"], 80.0)

    def test_boundary_zeroes(self):
        """All zero values evaluate gracefully without crashing."""
        payload = {
            "lighting": 0.0,
            "crime_risk": 0.0,
            "accident_risk": 0.0,
            "crowd_level": 0.0
        }
        response = self.client.post("/predict", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreaterEqual(data["safety_score"], 0.0)
        self.assertLessEqual(data["safety_score"], 100.0)

    def test_boundary_tens(self):
        """All maximal values evaluate cleanly within 0-100 score bounds."""
        payload = {
            "lighting": 10.0,
            "crime_risk": 10.0,
            "accident_risk": 10.0,
            "crowd_level": 10.0
        }
        response = self.client.post("/predict", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreaterEqual(data["safety_score"], 0.0)
        self.assertLessEqual(data["safety_score"], 100.0)

    def test_validation_rejects_out_of_bounds_high(self):
        """Input exceeding 10 is rejected with 422 Unprocessable Entity."""
        payload = {
            "lighting": 15.0,  # Invalid: max is 10
            "crime_risk": 3.0,
            "accident_risk": 2.0,
            "crowd_level": 5.0
        }
        response = self.client.post("/predict", json=payload)
        self.assertEqual(response.status_code, 422)

    def test_validation_rejects_negative_value(self):
        """Negative value is rejected with 422 Unprocessable Entity."""
        payload = {
            "lighting": 7.0,
            "crime_risk": -2.0,  # Invalid: min is 0
            "accident_risk": 2.0,
            "crowd_level": 5.0
        }
        response = self.client.post("/predict", json=payload)
        self.assertEqual(response.status_code, 422)

    def test_validation_rejects_missing_field(self):
        """Missing required feature is rejected with 422 Unprocessable Entity."""
        payload = {
            "lighting": 7.0,
            "crime_risk": 3.0
            # missing accident_risk and crowd_level
        }
        response = self.client.post("/predict", json=payload)
        self.assertEqual(response.status_code, 422)

    def test_direct_ensemble_model_logic(self):
        """Directly verify the EnsembleModel scoring arithmetic and tree traversal."""
        test_model = EnsembleModel({
            "model_name": "Test Forest",
            "trees": [
                {"feature_idx": 0, "threshold": 5.0, "left_val": 40.0, "right_val": 80.0},
                {"feature_idx": 1, "threshold": 5.0, "left_val": 90.0, "right_val": 30.0}
            ]
        })
        self.assertEqual(test_model.n_trees, 2)
        # lighting=8 (right -> 80), crime_risk=2 (left -> 90) -> mean = 85.0
        score = test_model.predict_one(lighting=8.0, crime_risk=2.0, accident_risk=5.0, crowd_level=5.0)
        self.assertEqual(score, 85.0)


if __name__ == "__main__":
    unittest.main()
