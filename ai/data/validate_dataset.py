"""
SafeRoute AI Dataset Validation Engine
Validates incident and safety datasets according to SafeRoute standards:
- Verifies point-level coordinates (latitude and longitude) on every single record
- Verifies ISO-8601 timestamps and calendar range
- Verifies non-null schemas and bounding boxes
- Confirms zero missing values in mandatory geospatial and temporal fields
"""

import argparse
import csv
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional, Tuple

# Chicago Bounding Box (Lat/Lon)
CHICAGO_BOUNDS = {
    "min_lat": 41.60,
    "max_lat": 42.10,
    "min_lon": -87.95,
    "max_lon": -87.50,
}

REQUIRED_COLUMNS = [
    "incident_id",
    "timestamp",
    "latitude",
    "longitude",
    "incident_type",
    "severity_score",
]


def parse_timestamp(ts_str: str) -> Optional[datetime]:
    """Attempts to parse an ISO-8601 or common standard timestamp format."""
    if not ts_str or not ts_str.strip():
        return None
    cleaned = ts_str.strip().replace("Z", "+00:00")
    try:
        return datetime.fromisoformat(cleaned)
    except Exception:
        # Fallback to standard date/time parser formats
        for fmt in ("%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M:%S", "%m/%d/%Y %I:%M:%S %p"):
            try:
                return datetime.strptime(ts_str.strip(), fmt)
            except ValueError:
                continue
    return None


def validate_incident_dataset(
    file_path: Path,
    bounds: Optional[Dict[str, float]] = CHICAGO_BOUNDS,
    min_rows: int = 100,
) -> Tuple[bool, Dict[str, Any]]:
    """
    Validates that a CSV dataset conforms to SafeRoute AI quality requirements.
    Every single row must possess valid coordinates and a valid date.
    """
    path = Path(file_path).resolve()
    if not path.exists():
        return False, {"error": f"File not found: {path}"}

    total_rows = 0
    valid_rows = 0
    invalid_rows = []
    
    min_ts: Optional[datetime] = None
    max_ts: Optional[datetime] = None
    min_lat, max_lat = 90.0, -90.0
    min_lon, max_lon = 180.0, -180.0
    
    incident_types: Dict[str, int] = {}
    categories: Dict[str, int] = {}

    with open(path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        if not reader.fieldnames:
            return False, {"error": "CSV contains no header row."}

        missing_cols = [col for col in REQUIRED_COLUMNS if col not in reader.fieldnames]
        if missing_cols:
            return False, {
                "error": f"Missing required columns in dataset: {missing_cols}",
                "present_columns": reader.fieldnames,
            }

        for row_idx, row in enumerate(reader, start=2):  # 1-indexed header is line 1
            total_rows += 1
            row_errors = []

            # 1. Validate Coordinate: Latitude
            raw_lat = row.get("latitude")
            try:
                lat = float(raw_lat)
                if not (-90.0 <= lat <= 90.0):
                    row_errors.append(f"Latitude out of global bounds (-90 to 90): {raw_lat}")
                elif bounds and not (bounds["min_lat"] <= lat <= bounds["max_lat"]):
                    row_errors.append(f"Latitude outside city boundary ({bounds['min_lat']} to {bounds['max_lat']}): {lat}")
                else:
                    min_lat = min(min_lat, lat)
                    max_lat = max(max_lat, lat)
            except (ValueError, TypeError):
                row_errors.append(f"Invalid or missing latitude: {raw_lat}")

            # 2. Validate Coordinate: Longitude
            raw_lon = row.get("longitude")
            try:
                lon = float(raw_lon)
                if not (-180.0 <= lon <= 180.0):
                    row_errors.append(f"Longitude out of global bounds (-180 to 180): {raw_lon}")
                elif bounds and not (bounds["min_lon"] <= lon <= bounds["max_lon"]):
                    row_errors.append(f"Longitude outside city boundary ({bounds['min_lon']} to {bounds['max_lon']}): {lon}")
                else:
                    min_lon = min(min_lon, lon)
                    max_lon = max(max_lon, lon)
            except (ValueError, TypeError):
                row_errors.append(f"Invalid or missing longitude: {raw_lon}")

            # 3. Validate Timestamp & Date
            raw_ts = row.get("timestamp")
            dt = parse_timestamp(raw_ts)
            if dt is None:
                row_errors.append(f"Invalid or unparsable timestamp: {raw_ts}")
            else:
                if min_ts is None or dt < min_ts:
                    min_ts = dt
                if max_ts is None or dt > max_ts:
                    max_ts = dt

            # 4. Validate Severity Score
            raw_sev = row.get("severity_score")
            try:
                sev = float(raw_sev)
                if not (0.0 <= sev <= 10.0):
                    row_errors.append(f"Severity score out of 0-10 bounds: {raw_sev}")
            except (ValueError, TypeError):
                row_errors.append(f"Invalid or missing severity score: {raw_sev}")

            # 5. Type and Category
            inc_type = row.get("incident_type", "UNKNOWN")
            incident_types[inc_type] = incident_types.get(inc_type, 0) + 1

            cat = row.get("category", "OTHER")
            categories[cat] = categories.get(cat, 0) + 1

            if row_errors:
                if len(invalid_rows) < 10:  # store sample of errors
                    invalid_rows.append({"line": row_idx, "id": row.get("incident_id"), "errors": row_errors})
            else:
                valid_rows += 1

    is_valid = (total_rows >= min_rows) and (len(invalid_rows) == 0)

    summary = {
        "file": str(path.name),
        "total_rows": total_rows,
        "valid_rows": valid_rows,
        "invalid_count": len(invalid_rows),
        "sample_invalid_rows": invalid_rows,
        "is_valid": is_valid,
        "latitude_range": (round(min_lat, 5), round(max_lat, 5)) if total_rows else None,
        "longitude_range": (round(min_lon, 5), round(max_lon, 5)) if total_rows else None,
        "start_date": min_ts.isoformat() if min_ts else None,
        "end_date": max_ts.isoformat() if max_ts else None,
        "incident_types_count": len(incident_types),
        "incident_types": incident_types,
        "categories": categories,
    }

    return is_valid, summary


def main():
    parser = argparse.ArgumentParser(description="Validate SafeRoute AI Incident Datasets")
    parser.add_argument(
        "--file",
        type=str,
        default=str(Path(__file__).resolve().parent / "sample" / "chicago_incidents_sample.csv"),
        help="Path to CSV dataset to validate",
    )
    args = parser.parse_args()

    csv_path = Path(args.file)
    print(f"\n[SafeRoute AI] Validating dataset at: {csv_path}...")
    success, summary = validate_incident_dataset(csv_path)

    if success:
        print("\n==========================================")
        print("  DATASET VALIDATION: PASSED")
        print("==========================================")
        print(f"File:                {summary['file']}")
        print(f"Total Rows:          {summary['total_rows']:,}")
        print(f"Valid Rows:          {summary['valid_rows']:,} (100%)")
        print(f"Invalid Rows:        0")
        print(f"Latitude Range:      {summary['latitude_range'][0]} to {summary['latitude_range'][1]}")
        print(f"Longitude Range:     {summary['longitude_range'][0]} to {summary['longitude_range'][1]}")
        print(f"Date Range:          {summary['start_date']} to {summary['end_date']}")
        print(f"Categories:          {summary['categories']}")
        print(f"Incident Types ({summary['incident_types_count']}):  {list(summary['incident_types'].keys())}")
        print("==========================================\n")
        exit(0)
    else:
        print("\n==========================================")
        print("  DATASET VALIDATION: FAILED")
        print("==========================================")
        print(summary)
        print("==========================================\n")
        exit(1)


if __name__ == "__main__":
    main()
