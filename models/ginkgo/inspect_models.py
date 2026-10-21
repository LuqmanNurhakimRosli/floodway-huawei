"""Inspect the four GINKGO Model 1 classifiers and check the facts MODEL_CARD.md states.

Run from the repo root with the scikit-learn version the files were saved with (1.7.2):
    backend\\.venv\\Scripts\\python.exe models/ginkgo/inspect_models.py

The .pkl files are the team's own trained models. joblib.load runs pickle, which can execute code, so load only these
files, never a .pkl from an unknown source.

What this can and cannot show: model type, inputs, classes, size, the first rules of the decision tree, feature
importances and prediction speed on random inputs. It cannot show accuracy: the training data is not in this repo.
"""
from __future__ import annotations

import platform
import sys
import time
import warnings
from pathlib import Path

import joblib
import numpy as np
import sklearn
from sklearn.tree import export_text

sys.path.insert(0, str(Path(__file__).parent))
from registry import ModelRegistry  # noqa: E402

TRAINED = Path(__file__).parent / "trained"
ROWS = 100_000


def main() -> None:
    reg = ModelRegistry(str(TRAINED))
    print(f"scikit-learn {sklearn.__version__} · Python {platform.python_version()} · {platform.processor() or platform.machine()}")
    x = np.random.default_rng(0).random((ROWS, 8)) * 100  # random inputs: timing only, never accuracy
    for model_id, filename in reg.FLOOD_MODELS.items():
        with warnings.catch_warnings(record=True) as caught:
            warnings.simplefilter("always")
            model = reg.load_flood_model(model_id)
        assert model is not None, f"{filename} did not load"
        saved = {str(w.message).split("version ")[1].split(" ")[0] for w in caught if "unpickle" in str(w.message)}
        size_kb = (TRAINED / filename).stat().st_size / 1024

        # Facts the model card relies on
        assert model.n_features_in_ == 8, model.n_features_in_
        assert list(model.classes_) == [0, 1], model.classes_
        assert getattr(model, "feature_names_in_", None) is None  # trained on a bare array: names were not saved

        model.predict_proba(x[:1000])  # warm-up
        t0 = time.perf_counter()
        model.predict_proba(x)
        ms = (time.perf_counter() - t0) * 1000

        print(f"\n{model_id}: {type(model).__name__}, {size_kb:.1f} KB, {ms:.1f} ms for {ROWS:,} random rows"
              + (f", saved with scikit-learn {', '.join(sorted(saved))}" if saved else ""))
        names = [f"x{i}" for i in range(8)]
        if hasattr(model, "feature_importances_"):
            order = np.argsort(model.feature_importances_)[::-1]
            print("  importance:", ", ".join(f"{names[i]} {model.feature_importances_[i]:.2f}" for i in order))
        if hasattr(model, "coef_"):
            print("  coefficients:", ", ".join(f"{n} {c:+.3f}" for n, c in zip(names, model.coef_[0])))
        if hasattr(model, "tree_"):
            print(f"  depth {model.get_depth()}, {model.get_n_leaves()} leaves; first rules:")
            print("\n".join("    " + line for line in export_text(model, feature_names=names, max_depth=2).splitlines()[:12]))

    dt = reg.load_flood_model("flood_dt")
    root = dt.tree_
    assert root.feature[0] == 3 and abs(root.threshold[0] - 1.5) < 1e-9
    left = root.children_left[0]
    assert root.children_left[left] == -1 and np.argmax(root.value[left]) == 0  # x3 <= 1.5 is a leaf: always class 0
    print("\nCheck passed: the decision tree's first split, x3 <= 1.5, is a leaf that always predicts class 0.")


if __name__ == "__main__":
    main()
