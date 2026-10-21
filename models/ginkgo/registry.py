"""
Ginkgo Rebuild — Model Registry
Centralized loader for all trained models.
No random pickle.load() calls scattered across the codebase.
All models load through here.
"""
import joblib
import logging
from typing import Optional, Dict, Any
from pathlib import Path

logger = logging.getLogger(__name__)


class ModelRegistry:
    """
    Centralized model registry.
    Loads models lazily on first access, caches them in memory.
    Handles missing models gracefully — returns None, never crashes.
    """

    FLOOD_MODELS = {
        "flood_rf":  "flood_rf_model.pkl",    # RandomForest (primary)
        "flood_hgb": "flood_hgb_model.pkl",   # HistGradientBoosting
        "flood_dt":  "flood_dt_model.pkl",    # DecisionTree (fast fallback)
        "flood_lr":  "flood_lr_model.pkl",    # LogisticRegression (baseline)
    }

    def __init__(self, models_dir: str):
        self.models_dir = Path(models_dir)
        self._cache: Dict[str, Any] = {}
        self._status: Dict[str, str] = {}  # model_id -> loaded|missing|error
        logger.info(f"ModelRegistry initialized. Models dir: {self.models_dir}")

    def load_flood_model(self, model_id: str = "flood_rf") -> Optional[Any]:
        """
        Load a flood model by ID. Returns None if unavailable.
        Never raises — caller handles None gracefully.
        """
        if model_id in self._cache:
            return self._cache[model_id]

        filename = self.FLOOD_MODELS.get(model_id)
        if not filename:
            logger.warning(f"Unknown model_id '{model_id}'. Available: {list(self.FLOOD_MODELS)}")
            return None

        path = self.models_dir / filename
        if not path.exists():
            logger.warning(f"Model file not found: {path}")
            self._status[model_id] = "missing"
            return None

        try:
            model = joblib.load(path)
            self._cache[model_id] = model
            self._status[model_id] = "loaded"
            logger.info(f"Loaded model '{model_id}' from {path}")
            return model
        except Exception as e:
            logger.error(f"Failed to load model '{model_id}': {e}")
            self._status[model_id] = "error"
            return None

    def get_all_status(self) -> Dict[str, Any]:
        """Return status of all registered models."""
        status = {}
        for model_id, filename in self.FLOOD_MODELS.items():
            path = self.models_dir / filename
            if model_id in self._cache:
                status[model_id] = {"status": "loaded", "file": filename, "path": str(path)}
            elif path.exists():
                status[model_id] = {"status": "available (not yet loaded)", "file": filename}
            else:
                status[model_id] = {"status": "missing", "file": filename, "path": str(path)}
        return status

    def validate_all(self) -> bool:
        """Try loading all models. Returns True if at least one loads successfully."""
        success_count = 0
        for model_id in self.FLOOD_MODELS:
            model = self.load_flood_model(model_id)
            if model is not None:
                success_count += 1
        logger.info(f"Model validation: {success_count}/{len(self.FLOOD_MODELS)} models loaded.")
        return success_count > 0


# Singleton: the caller initialises it with the models dir (models/ginkgo/trained in this repo)
_registry: Optional[ModelRegistry] = None


def init_registry(models_dir: str) -> ModelRegistry:
    global _registry
    _registry = ModelRegistry(models_dir)
    return _registry


def get_registry() -> Optional[ModelRegistry]:
    return _registry
