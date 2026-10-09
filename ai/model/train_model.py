
import numpy as np
import joblib

from pathlib import Path
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error

# DEMO DATA ONLY — not real-world safety data
np.random.seed(42)

number_of_samples = 2000

lighting = np.random.uniform(0, 10, number_of_samples)
crime_risk = np.random.uniform(0, 10, number_of_samples)
accident_risk = np.random.uniform(0, 10, number_of_samples)
crowd_level = np.random.uniform(0, 10, number_of_samples)

X = np.column_stack([
    lighting,
    crime_risk,
    accident_risk,
    crowd_level
])

# Generate illustrative target scores for learning purposes.
y = (
    lighting * 0.35
    + (10 - crime_risk) * 0.30
    + (10 - accident_risk) * 0.25
    + crowd_level * 0.10
) * 10

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

model = RandomForestRegressor(
    n_estimators=100,
    random_state=42
)

model.fit(X_train, y_train)

predictions = model.predict(X_test)
mae = mean_absolute_error(y_test, predictions)

model_path = Path(__file__).resolve().parent / "safety_model.joblib"
joblib.dump(model, model_path)

print("Random Forest model trained successfully!")
print(f"Model saved to: {model_path}")
print(f"Demo test MAE: {mae:.2f}")
