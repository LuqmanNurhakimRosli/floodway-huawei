# %% [markdown]
# # NB3 - Package the model for Huawei ModelArts (real-time service)
# Produces ./modelarts_pkg/ ready to upload to OBS:
#   model/{model.pt, meta.json, flood_core.py, customize_service.py, config.json}

# %% Cell 1 - assemble the package
import json, os, shutil
PKG = "modelarts_pkg/model"
os.makedirs(PKG, exist_ok=True)
for f in ["model_out/model.pt", "model_out/meta.json", "flood_core.py"]:
    shutil.copy(f, PKG)

customize_service = '''
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
'''
open(f"{PKG}/customize_service.py", "w").write(customize_service.lstrip())

arr = {"type": "array", "items": {"type": "number"}}
config = {
    "model_algorithm": "flood_level_forecaster",
    "model_type": "PyTorch",
    "runtime": "python3.7",            # pick whatever runtime the console offers for PyTorch; check the current docs
    "apis": [{
        "protocol": "https", "url": "/", "method": "post",
        "request": {"Content-type": "application/json",
                    "data": {"type": "object", "properties": {"rain_mm": arr, "level_m": arr}}},
        "response": {"Content-type": "application/json",
                     "data": {"type": "object", "properties": {"horizons_min": arr, "p10": arr, "p50": arr, "p90": arr}}},
    }],
    "dependencies": [{"installer": "pip", "packages": [{"package_name": "numpy", "package_version": "1.21.0", "restraint": "ATLEAST"}]}],
}
json.dump(config, open(f"{PKG}/config.json", "w"), indent=2)
print(sorted(os.listdir(PKG)))

# %% Cell 2 - local smoke test WITHOUT ModelArts (stubs the base class)
import sys, types, importlib
stub = types.ModuleType("model_service.pytorch_model_service")
class PTServingBaseService:                            # minimal stand-in
    def __init__(self, model_name, model_path): pass
stub.PTServingBaseService = PTServingBaseService
sys.modules["model_service"] = types.ModuleType("model_service")
sys.modules["model_service.pytorch_model_service"] = stub
sys.path.insert(0, PKG)
cs = importlib.import_module("customize_service")
svc = cs.FloodService("flood", os.path.join(PKG, "model.pt"))
payload = {"rain_mm": [0.0] * 20 + [4.0, 6.0, 8.0, 5.0], "level_m": [0.05 + 0.01 * i for i in range(24)]}
print(svc._postprocess(svc._inference(svc._preprocess(payload))))

# %% Cell 3 - upload to OBS and deploy (console path; the SDK path changes between releases)
print("""
1. OBS console -> create bucket (same region as ModelArts) -> upload modelarts_pkg/model/ as obs://<bucket>/floodway/model/
2. ModelArts -> Model Management -> Create model -> Import from OBS -> pick the folder above
   (engine: PyTorch; make sure config.json + customize_service.py sit next to model.pt)
3. Deploy -> Real-Time Service -> smallest CPU flavor is enough for a 64-unit GRU
4. Open the service's Prediction tab, paste the JSON payload from Cell 2, confirm p10<=p50<=p90
5. Copy the service's invocation URL into backend env MODELARTS_URL (see backend/.env.example)
""")
