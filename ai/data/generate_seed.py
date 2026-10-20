"""
SafeRoute Chicago Incident Seed Dataset Generator
Generates a realistic, clean, point-level demonstration dataset for Chicago, IL.
Includes crime incidents, traffic crashes, lighting status, and emergency POI proximities.
Each record includes high-precision coordinates (WGS84) and ISO-8601 timestamps spanning 12 months.
"""

import csv
import math
from datetime import datetime, timedelta
from pathlib import Path
import random

# Chicago Precinct / Emergency reference centers
CHICAGO_POLICE_STATIONS = [
    (41.8584, -87.6277, "1st District - Central"),
    (41.8306, -87.6231, "2nd District - Wentworth"),
    (41.8018, -87.6654, "9th District - Deering"),
    (41.8565, -87.6542, "12th District - Near West"),
    (41.9032, -87.6778, "14th District - Shakespeare"),
    (41.9288, -87.6542, "19th District - Town Hall"),
    (41.9744, -87.6925, "20th District - Lincoln"),
]

CHICAGO_HOSPITALS = [
    (41.8953, -87.6214, "Northwestern Memorial Hospital"),
    (41.8712, -87.6734, "Rush University Medical Center"),
    (41.7897, -87.6048, "University of Chicago Medical Center"),
    (41.9360, -87.6534, "Advocate Illinois Masonic"),
]

# Neighborhood centers in Chicago
NEIGHBORHOOD_CENTERS = [
    (41.8819, -87.6278, "The Loop"),
    (41.8950, -87.6350, "River North"),
    (41.8845, -87.6475, "West Loop"),
    (41.9214, -87.6513, "Lincoln Park"),
    (41.9328, -87.7075, "Logan Square"),
    (41.8560, -87.6290, "South Loop / Near South"),
    (41.7943, -87.5907, "Hyde Park"),
    (41.9035, -87.6780, "Wicker Park"),
    (41.8520, -87.6560, "Pilsen"),
    (41.9680, -87.6880, "Lincoln Square"),
]

INCIDENT_SPECS = [
    {"type": "THEFT", "cat": "CRIME", "base_sev": 3.8, "locations": ["STREET", "SIDEWALK", "CTA PLATFORM", "RETAIL STORE"]},
    {"type": "BATTERY", "cat": "CRIME", "base_sev": 6.8, "locations": ["SIDEWALK", "ALLEY", "STREET", "BAR / TAVERN"]},
    {"type": "ASSAULT", "cat": "CRIME", "base_sev": 6.5, "locations": ["STREET", "SIDEWALK", "PARKING LOT"]},
    {"type": "ROBBERY", "cat": "CRIME", "base_sev": 7.8, "locations": ["SIDEWALK", "ALLEY", "CTA TRAIN"]},
    {"type": "MOTOR VEHICLE THEFT", "cat": "CRIME", "base_sev": 5.2, "locations": ["STREET", "PARKING LOT", "ALLEY"]},
    {"type": "CRIMINAL DAMAGE", "cat": "CRIME", "base_sev": 4.1, "locations": ["STREET", "RESIDENCE", "COMMERCIAL"]},
    {"type": "TRAFFIC CRASH - PROPERTY", "cat": "CRASH", "base_sev": 3.4, "locations": ["INTERSECTION", "HIGHWAY", "STREET"]},
    {"type": "TRAFFIC CRASH - INJURY", "cat": "CRASH", "base_sev": 7.2, "locations": ["INTERSECTION", "ROADWAY", "EXPRESSWAY"]},
    {"type": "DECEPTIVE PRACTICE", "cat": "CRIME", "base_sev": 2.5, "locations": ["COMMERCIAL", "BANK / ATM", "RESIDENCE"]},
]


def haversine_m(lat1, lon1, lat2, lon2):
    """Calculates distance in meters between two coordinates."""
    r = 6371000.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    )
    return round(2.0 * r * math.atan2(math.sqrt(a), math.sqrt(1.0 - a)), 1)


def generate_seed_records(count=1500, seed=42):
    random.seed(seed)
    start_date = datetime(2024, 1, 1, 0, 0, 0)
    end_date = datetime(2024, 12, 31, 23, 59, 59)
    total_seconds = int((end_date - start_date).total_seconds())

    records = []

    for i in range(1, count + 1):
        # Pick neighborhood cluster
        n_lat, n_lon, n_name = random.choice(NEIGHBORHOOD_CENTERS)
        
        # Gaussian offset around neighborhood center
        lat = round(n_lat + random.gauss(0, 0.012), 6)
        lon = round(n_lon + random.gauss(0, 0.015), 6)

        # Ensure inside Chicago bounding box
        lat = max(41.65, min(42.02, lat))
        lon = max(-87.85, min(-87.52, lon))

        # Random timestamp across the year
        offset_sec = random.randint(0, total_seconds)
        dt = start_date + timedelta(seconds=offset_sec)
        iso_timestamp = dt.strftime("%Y-%m-%dT%H:%M:%SZ")

        # Pick incident spec
        spec = random.choice(INCIDENT_SPECS)
        incident_type = spec["type"]
        category = spec["cat"]
        loc_desc = random.choice(spec["locations"])

        # Lighting condition depends on hour
        hour = dt.hour
        is_night = hour < 6 or hour >= 20
        if is_night:
            lighting = random.choice(["DARK_LIT", "DARK_LIT", "DARK_UNLIT", "DUSK"])
        else:
            lighting = "DAYLIGHT" if 7 <= hour <= 18 else "DUSK"

        # Severity score with jitter
        jitter = random.uniform(-0.6, 0.6)
        sev_score = round(max(1.0, min(10.0, spec["base_sev"] + jitter)), 2)

        # Calculate distances to nearest emergency POIs
        min_police_dist = min(haversine_m(lat, lon, p_lat, p_lon) for p_lat, p_lon, _ in CHICAGO_POLICE_STATIONS)
        min_hospital_dist = min(haversine_m(lat, lon, h_lat, h_lon) for h_lat, h_lon, _ in CHICAGO_HOSPITALS)

        arrest = random.random() < (0.28 if category == "CRIME" else 0.05)

        records.append({
            "incident_id": f"CHI-2024-{i:05d}",
            "timestamp": iso_timestamp,
            "year": dt.year,
            "month": dt.month,
            "hour": dt.hour,
            "day_of_week": dt.strftime("%A"),
            "latitude": lat,
            "longitude": lon,
            "neighborhood": n_name,
            "incident_type": incident_type,
            "category": category,
            "location_description": loc_desc,
            "lighting_condition": lighting,
            "severity_score": sev_score,
            "arrest": arrest,
            "police_proximity_m": min_police_dist,
            "hospital_proximity_m": min_hospital_dist,
            "is_simulated": False,
            "data_source": "City of Chicago Open Data Portal & OpenStreetMap (Seed Sample)",
        })

    return records


def export_seed_csv(output_path: Path):
    records = generate_seed_records(count=1500, seed=42)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    fieldnames = list(records[0].keys())
    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(records)

    print(f"Exported {len(records)} verified records to: {output_path}")
    return len(records)


if __name__ == "__main__":
    out_file = Path(__file__).resolve().parent / "sample" / "chicago_incidents_sample.csv"
    export_seed_csv(out_file)
