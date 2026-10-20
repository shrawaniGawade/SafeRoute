"""
SafeRoute Lightweight Random Forest Ensemble Trainer
Trains a 50-tree regression ensemble for multi-factor safety scoring.
Saves weights as clean JSON so it runs without C-extension DLL policy blocks on Windows/Linux.
"""

import json
from pathlib import Path
import numpy as np

def generate_training_data(n_samples=2500, seed=42):
    rng = np.random.default_rng(seed)
    lighting = rng.uniform(0, 10, n_samples)
    crime_risk = rng.uniform(0, 10, n_samples)
    accident_risk = rng.uniform(0, 10, n_samples)
    crowd_level = rng.uniform(0, 10, n_samples)
    
    # Ground truth formula with non-linear interaction noise
    base = (
        (lighting * 3.4)
        + (crowd_level * 2.3)
        + ((10 - crime_risk) * 2.6)
        + ((10 - accident_risk) * 1.7)
    )
    # Add interaction penalties (e.g., dark + high crime is extra penalized)
    interaction = np.where((lighting < 3) & (crime_risk > 7), -10, 0)
    interaction += np.where((crowd_level > 8) & (lighting > 7), 5, 0)
    
    noise = rng.normal(0, 1.5, n_samples)
    y = np.clip(base + interaction + noise, 0, 100)
    X = np.column_stack([lighting, crime_risk, accident_risk, crowd_level])
    return X, y

def train_decision_stump(X, y, rng):
    """Creates a random feature split tree node (decision stump/tree)."""
    n_features = X.shape[1]
    best_feat = rng.choice(n_features)
    min_val, max_val = np.min(X[:, best_feat]), np.max(X[:, best_feat])
    if min_val == max_val:
        threshold = min_val
    else:
        threshold = float(rng.uniform(min_val, max_val))
    
    left_mask = X[:, best_feat] <= threshold
    right_mask = ~left_mask
    
    left_val = float(np.mean(y[left_mask])) if np.any(left_mask) else float(np.mean(y))
    right_val = float(np.mean(y[right_mask])) if np.any(right_mask) else float(np.mean(y))
    
    return {
        "feature_idx": int(best_feat),
        "threshold": round(threshold, 4),
        "left_val": round(left_val, 4),
        "right_val": round(right_val, 4),
    }

def train_ensemble(n_trees=60):
    X, y = generate_training_data()
    rng = np.random.default_rng(42)
    trees = []
    
    for _ in range(n_trees):
        # Bootstrap sample
        indices = rng.choice(len(X), size=len(X), replace=True)
        X_boot, y_boot = X[indices], y[indices]
        tree = train_decision_stump(X_boot, y_boot, rng)
        trees.append(tree)
        
    model_data = {
        "model_name": "Random Forest Regressor (60-Tree Ensemble)",
        "features": ["lighting", "crime_risk", "accident_risk", "crowd_level"],
        "n_trees": len(trees),
        "trees": trees,
    }
    
    out_path = Path(__file__).resolve().parent / "safety_model.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(model_data, f, indent=2)
        
    print(f"Successfully trained and exported ensemble model to: {out_path}")

if __name__ == "__main__":
    train_ensemble()
