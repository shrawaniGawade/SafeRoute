import sys
from pathlib import Path

# Ensure ai root directory is in sys.path so 'app.main' is reliably resolved by Vercel's Python runtime
CURRENT_DIR = Path(__file__).resolve().parent
ROOT_DIR = CURRENT_DIR.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from app.main import app
