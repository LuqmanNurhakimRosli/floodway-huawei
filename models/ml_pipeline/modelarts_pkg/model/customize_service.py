import os
try:                                   # ModelArts asks for relative imports of custom modules
    from .flood_core import FloodPredictor
except ImportError:
    from flood_core import FloodPredictor
from model_service.pytorch_model_service import PTServingBaseService


class FloodService(PTServingBaseService):
    def __init__(self, model_name, model_path):
        self.model_name = model_name
        self.model_path = model_path
        model_dir = model_path if os.path.isdir(model_path) else os.path.dirname(model_path)
        self.predictor = FloodPredictor(model_dir)

    def _preprocess(self, data):
        # JSON body: {"rain_mm": [24 floats], "level_m": [24 floats]}
        if not isinstance(data, dict) or "rain_mm" not in data or "level_m" not in data:
            raise ValueError("body must be JSON with rain_mm and level_m")
        return data

    def _inference(self, data):
        return self.predictor.predict(data["rain_mm"], data["level_m"])

    def _postprocess(self, data):
        return data
