# SafeRoute – API Documentation

## 1. Overview
The SafeRoute backend provides an API for requesting a route safety score.

Base URL:

`http://localhost:5000/api`

## 2. Health Check API

**Endpoint:** `GET /health`

**Purpose:** Checks whether the backend server is running.

**Example response:**

```json
{
  "status": "ok",
  "message": "SafeRoute backend is running"
}
```

## 3. Safety Prediction API

**Endpoint:** `POST /safety/predict`

**Purpose:** Sends safety-related factors to the backend and receives a demonstration safety score.

**Request Content-Type:** `application/json`

### Request Body

```json
{
  "lighting": 8,
  "crime_risk": 2,
  "accident_risk": 3,
  "crowd_level": 7
}
```

### Input Parameters

- `lighting`: Street lighting level, from 0 to 10.
- `crime_risk`: Demonstration crime-risk input, from 0 to 10.
- `accident_risk`: Demonstration accident-risk input, from 0 to 10.
- `crowd_level`: Crowd level input, from 0 to 10.

### Example Response

```json
{
  "safety_score": 85,
  "model": "Random Forest",
  "data_type": "synthetic_demo",
  "warning": "Demonstration prediction only; not validated for real-world safety."
}
```

The score above is an illustrative example, not a guaranteed API result.

## 4. Error Handling

If the request fails, the API may return an HTTP error status. Check the response status and server logs to identify the problem.

## 5. Important Limitations

- The model uses synthetic demonstration data.
- Real-world safety data is not yet integrated.
- Scores should not be treated as guarantees that a route is safe.

**Note:** Confirm the endpoint paths and response fields against the current backend code if the implementation changes.