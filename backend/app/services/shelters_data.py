"""Demo relief centres, all in Kuala Lumpur. ILLUSTRATIVE: not an official register. The list lives in
app/data/kl_shelters.json; the frontend keeps an identical copy (frontend/src/data/kl_shelters.json) for its offline
fallback, and tests/test_shelters.py fails if they drift apart."""
import json
from pathlib import Path

SHELTERS_DATA = json.loads((Path(__file__).resolve().parent.parent / "data" / "kl_shelters.json").read_text(encoding="utf-8"))
