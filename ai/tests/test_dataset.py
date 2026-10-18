"""
SafeRoute AI Dataset & Data Integrity Test Suite
Verifies acceptance criteria for ISSUE-02 / Issue #6:
- Validates that ai/data/README.md documents source, licence, period, and fallback rules.
- Validates that the sample dataset has point-level coordinates and timestamps for EVERY row.
- Validates that the validator script correctly accepts valid data and rejects corrupt data.
- Validates raw data git-ignore rules.
"""

import csv
import sys
import tempfile
import unittest
from pathlib import Path

AI_ROOT = Path(__file__).resolve().parent.parent
if str(AI_ROOT) not in sys.path:
    sys.path.insert(0, str(AI_ROOT))

from data.validate_dataset import validate_incident_dataset, parse_timestamp, CHICAGO_BOUNDS


class TestDatasetSelection(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data_dir = AI_ROOT / "data"
        cls.readme_path = cls.data_dir / "README.md"
        cls.sample_path = cls.data_dir / "sample" / "chicago_incidents_sample.csv"
        cls.raw_dir = cls.data_dir / "raw"

    def test_readme_exists_and_documents_dataset_metadata(self):
        """Acceptance Criteria 1: ai/data/README.md documents source, license, period, and fallback."""
        self.assertTrue(self.readme_path.exists(), "ai/data/README.md must exist")
        content = self.readme_path.read_text(encoding="utf-8")
        
        # Verify Demo City
        self.assertIn("Chicago", content)
        # Verify Data Sources
        self.assertIn("Chicago Open Data Portal", content)
        self.assertIn("Crimes", content)
        self.assertIn("Traffic Crashes", content)
        self.assertIn("OpenStreetMap", content)
        # Verify License
        self.assertIn("License", content)
        self.assertTrue("ODbL" in content or "Open Data" in content)
        # Verify Time Period
        self.assertIn("2024", content)
        # Verify Fallback Strategy
        self.assertIn("Fallback", content)
        self.assertIn("simulated", content.lower())

    def test_raw_directory_and_git_ignore_rules(self):
        """ai/data/raw/ exists and contains gitignore preventing raw file commits."""
        self.assertTrue(self.raw_dir.exists(), "ai/data/raw/ directory must exist")
        raw_gitignore = self.raw_dir / ".gitignore"
        raw_gitkeep = self.raw_dir / ".gitkeep"
        self.assertTrue(raw_gitignore.exists(), "ai/data/raw/.gitignore must exist")
        self.assertTrue(raw_gitkeep.exists(), "ai/data/raw/.gitkeep must exist")

        gitignore_text = raw_gitignore.read_text(encoding="utf-8")
        self.assertIn("*", gitignore_text)
        self.assertIn("!.gitignore", gitignore_text)
        self.assertIn("!.gitkeep", gitignore_text)

    def test_sample_dataset_exists_and_passes_validation(self):
        """Acceptance Criteria 2: When dataset is loaded, validation passes completely."""
        self.assertTrue(self.sample_path.exists(), "Seed sample dataset must exist")
        is_valid, summary = validate_incident_dataset(self.sample_path)
        
        self.assertTrue(is_valid, f"Dataset validation failed: {summary.get('sample_invalid_rows')}")
        self.assertGreaterEqual(summary["total_rows"], 1000, "Dataset should have at least 1,000 seed rows")
        self.assertEqual(summary["invalid_count"], 0, "There should be zero invalid rows")
        self.assertEqual(summary["total_rows"], summary["valid_rows"])

    def test_every_row_has_valid_coordinates_and_date(self):
        """Acceptance Criteria 2: Every single row has non-null coordinates and valid timestamp."""
        with open(self.sample_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            rows = list(reader)

        self.assertGreater(len(rows), 0)
        for idx, row in enumerate(rows, start=1):
            # Coordinates
            self.assertIn("latitude", row, f"Row {idx} missing latitude column")
            self.assertIn("longitude", row, f"Row {idx} missing longitude column")
            lat = float(row["latitude"])
            lon = float(row["longitude"])
            self.assertTrue(CHICAGO_BOUNDS["min_lat"] <= lat <= CHICAGO_BOUNDS["max_lat"],
                            f"Row {idx} latitude {lat} outside Chicago bounds")
            self.assertTrue(CHICAGO_BOUNDS["min_lon"] <= lon <= CHICAGO_BOUNDS["max_lon"],
                            f"Row {idx} longitude {lon} outside Chicago bounds")

            # Timestamp
            self.assertIn("timestamp", row, f"Row {idx} missing timestamp column")
            dt = parse_timestamp(row["timestamp"])
            self.assertIsNotNone(dt, f"Row {idx} has unparsable timestamp: {row['timestamp']}")
            self.assertEqual(dt.year, 2024, f"Row {idx} timestamp year should be 2024")

            # Incident type & severity
            self.assertTrue(row.get("incident_type"), f"Row {idx} missing incident_type")
            sev = float(row["severity_score"])
            self.assertTrue(0.0 <= sev <= 10.0, f"Row {idx} severity score out of bounds")

    def test_validator_rejects_missing_coordinates(self):
        """Validator flags records with missing or corrupted coordinates."""
        with tempfile.NamedTemporaryFile(mode="w", suffix=".csv", delete=False) as tf:
            tf.write("incident_id,timestamp,latitude,longitude,incident_type,severity_score\n")
            tf.write("TEST-001,2024-05-01T12:00:00Z,,,-87.62,THEFT,5.0\n")  # bad lat
            temp_path = Path(tf.name)

        try:
            is_valid, summary = validate_incident_dataset(temp_path, min_rows=1)
            self.assertFalse(is_valid)
            self.assertGreater(summary["invalid_count"], 0)
        finally:
            temp_path.unlink(missing_ok=True)

    def test_validator_rejects_out_of_bound_coordinates(self):
        """Validator flags records located outside the city bounds."""
        with tempfile.NamedTemporaryFile(mode="w", suffix=".csv", delete=False) as tf:
            tf.write("incident_id,timestamp,latitude,longitude,incident_type,severity_score\n")
            tf.write("TEST-002,2024-05-01T12:00:00Z,28.6139,77.2090,THEFT,5.0\n")  # Delhi coords, not Chicago
            temp_path = Path(tf.name)

        try:
            is_valid, summary = validate_incident_dataset(temp_path, min_rows=1)
            self.assertFalse(is_valid)
            self.assertGreater(summary["invalid_count"], 0)
        finally:
            temp_path.unlink(missing_ok=True)

    def test_validator_rejects_invalid_timestamp(self):
        """Validator flags records with missing or corrupt timestamps."""
        with tempfile.NamedTemporaryFile(mode="w", suffix=".csv", delete=False) as tf:
            tf.write("incident_id,timestamp,latitude,longitude,incident_type,severity_score\n")
            tf.write("TEST-003,NOT_A_DATE,41.8819,-87.6278,BATTERY,7.0\n")
            temp_path = Path(tf.name)

        try:
            is_valid, summary = validate_incident_dataset(temp_path, min_rows=1)
            self.assertFalse(is_valid)
            self.assertGreater(summary["invalid_count"], 0)
        finally:
            temp_path.unlink(missing_ok=True)


if __name__ == "__main__":
    unittest.main()
