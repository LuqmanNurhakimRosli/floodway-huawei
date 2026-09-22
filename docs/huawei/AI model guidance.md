# GEO-RESQ — AI Model Development Guidance
### Datasets, Notebooks, Training Pipeline, and Huawei Integration for Bi-Temporal Change/Damage Detection

---

## 0. Why this document exists — read this first

Everything built so far (Phase 1 dashboard, 60 installed skills, the design overhaul) is UI/UX and tooling. **None of it touches the actual AI model** — the Bi-Temporal Siamese U-Net that is GEO-RESQ's core technical claim, worth 40% of Preliminary scoring under "Innovation," and directly tied to the mandatory Huawei-technology eligibility gate (see the competition reference doc — this is still unresolved). Everything below exists to close that specific gap: where real data comes from, what notebooks to build, and how to get a trained, reproducible model.

**Recommendation on sequencing:** pause further design polish (Phase 3+ of the "Three Man Team"/design track) until at least Tier A below produces a working, evaluated model. A beautiful dashboard showing a change-detection layer that was never actually trained is the exact "reproducibility" failure mode the Regional round is designed to catch.

---

## 1. What the model actually needs to do

Input: a co-registered pair of satellite images of the same location, $T_1$ (before) and $T_2$ (after a flood event).
Output: a pixel-wise map classifying what changed — at minimum, flood/water extent; ideally, per-building damage state (no damage / minor / major / destroyed).

This is two related but distinct tasks, and you should be explicit about which one you're actually training for:
- **Flood/water segmentation** (single-timestamp or bi-temporal): "where is water now that wasn't before" — matches your Surge Engine and inundation layer.
- **Building damage classification** (bi-temporal, Siamese architecture): "how damaged is this specific building" — matches your damage-severity panel and rescue-routing corridor logic.

You don't have to solve both from scratch — see Tier A below.

---

## 2. Three tiers of ambition — pick based on your actual remaining time

| Tier | Approach | Effort | Risk | What it gives you |
|---|---|---|---|---|
| **A — Fine-tune an existing checkpoint** | Start from `ibm-nasa-geospatial/Prithvi-100M-sen1floods11` (Hugging Face) — a geospatial foundation model already fine-tuned for flood segmentation on Sen1Floods11 — and fine-tune it further on a small labeled subset or your specific AOI | Low | Low | A real, working, evaluated flood-segmentation model in days, not weeks — legitimate "we built on a foundation model" story |
| **B — Train Siamese U-Net from scratch on Sen1Floods11** | Full training run using the dataset's own provided notebooks as a starting point | Moderate | Moderate | A model you trained yourself, stronger "we built this" claim for judges, single-timestamp flood water only (not bi-temporal building damage) |
| **C — Bi-temporal building damage on xBD/xView2** | Train the actual Siamese U-Net (pre/post encoder, shared weights) for the 4-class damage scale your dashboard already displays | High | Higher (large dataset, registration gate, longer training) | Exact match to what your Right Analysis Panel already shows (Destroyed/Major/Minor) — the most complete story, if you have the runway |

**My honest recommendation given a Sept 27 Preliminary deadline:** do **Tier A now** to have something real and reproducible in hand for Preliminary submission, and treat **Tier C as the Regional-round target** (October) once you have more runway — it's the tier that actually matches your dashboard's damage-severity UI, but it's not achievable in days.

---

## 3. Dataset Guide (verified, real, currently accessible)

| Dataset | Gives you | Access | Size | License / cost |
|---|---|---|---|---|
| **Sen1Floods11** (Cloud to Street / Google, CVPR 2020) | 4,831 labeled 512×512 chips, Sentinel-1 + Sentinel-2, flood water masks, across 11 real flood events, 6 continents | `gsutil -m rsync -r gs://sen1floods11 /YOUR/LOCAL/DIR` — no registration required. GitHub: `cloudtostreet/Sen1Floods11` includes ready-to-run `Main_Training_Stuff.ipynb` and `Test_Models.ipynb` | ~14 GB full; 446-chip hand-labeled subset is much smaller and enough to start | Apache 2.0 — fully open, citable, no gate |
| **Prithvi-100M-sen1floods11** (IBM/NASA, Hugging Face) | A pretrained flood-segmentation checkpoint, already fine-tuned on Sen1Floods11 — use as your Tier A starting point | `huggingface.co/ibm-nasa-geospatial/Prithvi-100M-sen1floods11` — direct download via `transformers`/`huggingface_hub` | Model weights, no dataset download needed for Tier A | Open, citable — cite both this model card and the original Sen1Floods11 paper |
| **xBD / xView2** (Defense Innovation Unit) | 700,000+ building annotations, pre/post disaster imagery, 8 disaster types **including flood**, 4-class damage scale (No damage / Minor / Major / Destroyed) — exact match to your dashboard's severity categories | Free but **requires registration** at `xview2.org/dataset` → download links at `xview2.org/download-links` | ~10 GB compressed | Free for research use per challenge terms — read the usage agreement before any commercial framing |
| **Existing Siamese U-Net reference code for xBD** | Working PyTorch implementation with the exact architecture you need — "Siamese - share weights for pre and post disaster images; two variants" | GitHub: `michal2409/xview2` (also `DIUx-xView/xView2_baseline` for the official baseline) | — | Check each repo's license before reuse; treat as reference/starting point, adapt rather than submit verbatim |

**Practical note:** Sen1Floods11's Google Cloud Storage access needs `gsutil` installed and a Google Cloud SDK — a small setup step, not a blocker. xBD's registration can take a little time to process, so start that request today regardless of which tier you pursue first.

---

## 4. Repository / Notebook Structure

Add this alongside your existing `backend/`, not inside it — this is training infrastructure, not the runtime API:

```
ml/
├── data/
│   ├── raw/                    # untouched downloads (Sen1Floods11, xBD)
│   └── processed/               # normalized, patched, split
├── notebooks/
│   ├── 01_data_exploration.ipynb       # visualize chips, check band stats, class balance
│   ├── 02_preprocessing.ipynb          # band math, normalization, patch/tile extraction
│   ├── 03_tier_a_finetune_prithvi.ipynb   # start here
│   ├── 04_tier_b_train_unet_sen1floods.ipynb
│   ├── 05_tier_c_train_siamese_xbd.ipynb
│   └── 06_evaluate.ipynb               # metrics, confusion matrix, sample predictions
├── src/
│   ├── model.py             # Siamese U-Net definition (reusable across notebooks/scripts)
│   ├── dataset.py           # PyTorch Dataset classes for Sen1Floods11 / xBD
│   ├── losses.py            # Dice + BCE / Focal loss for class imbalance
│   └── metrics.py           # IoU, F1, precision/recall per class
├── checkpoints/              # saved model weights, gitignored except a README
└── requirements.txt
```

```bash
# Environment
python -m venv ml_venv
ml_venv\Scripts\activate
pip install torch torchvision rasterio geopandas scikit-learn matplotlib jupyter huggingface_hub transformers gsutil
```

---

## 5. Preprocessing (what actually happens in notebook 02)

- **Band selection:** Sen1Floods11 provides both S1 (SAR, cloud-penetrating) and S2 (optical) — decide which you're training on and document why (S1 has the advantage of working through cloud cover, directly relevant to your "graceful degradation when satellite is unavailable" claim in the main proposal).
- **Normalization:** per-band min-max or z-score normalization — compute statistics from the training split only, never from validation/test, to avoid leakage.
- **Patch/tile handling:** the datasets already come pre-chipped (512×512) — don't re-tile unnecessarily; if you do need smaller patches for memory reasons, keep the split at the *chip* level, not the pixel level, so no patch from one chip leaks across train/val/test.
- **Split strategy:** split by **flood event / geographic region**, not randomly by chip — chips from the same flood event are spatially correlated, and random splitting will inflate your reported accuracy the same way the temporal-block-split issue does for time-series data. Document this choice explicitly; it's exactly the kind of methodological rigor a reproducibility-focused Regional review panel checks for.

---

## 6. Model Architecture — Siamese U-Net (concrete spec, PyTorch)

```
Input: T1 image patch, T2 image patch (same H×W, same bands)
        │                    │
   Encoder Branch A     Encoder Branch B     ← SHARED WEIGHTS (this is what makes it "Siamese")
        │                    │
        └────── Feature Differencing / Concatenation ──────┘
                          │
                    U-Net Decoder
                          │
                  Pixel-wise Output
         (flood/no-flood, or 4-class damage)
```

| Component | Spec |
|---|---|
| Encoder (shared) | ResNet-34 or a lightweight custom CNN encoder (4 downsampling blocks); pretrained ImageNet weights as init if using optical bands, random init or SAR-specific pretraining for radar |
| Feature fusion | Absolute difference or channel-wise concatenation of corresponding encoder feature maps at each scale (standard for Siamese change detection) |
| Decoder | U-Net-style upsampling path with skip connections from the fused encoder features |
| Output head | 1×1 conv → sigmoid (binary flood) or softmax (4-class damage) |
| Loss | Dice loss + weighted BCE (binary) or Dice + Focal loss (multi-class, to handle the natural rarity of "Destroyed" pixels vs. "No damage") |

If using **Tier A (Prithvi fine-tune)**, you inherit the encoder from the pretrained checkpoint and only need to adapt/fine-tune the decoder head — this is most of why Tier A is dramatically faster.

---

## 7. Training Essentials

- **Metrics to report** (per class, not just overall — mirrors the FloodWay project's same discipline): IoU, F1, precision, recall.
- **Class imbalance:** flood/damaged pixels are almost always a small minority of any scene — use Dice or Focal loss, not plain cross-entropy alone, and report per-class F1 so "Destroyed" performance isn't hidden behind a high "No damage" accuracy.
- **Reproducibility artifacts to save from every run:** the exact train/val/test split (event/region IDs, not just chip IDs), the trained weights, and a metrics JSON — this is what the Regional round's "attempt to reproduce your results" check will need.

---

## 8. Huawei Integration — the part that satisfies eligibility, not just Phase 7

Two honest paths, pick based on time available:

**Path 1 — Train in PyTorch, deploy/host via ModelArts.** Train locally or on Colab using the spec above, then package the trained model and serve inference through **Huawei ModelArts** (which supports custom PyTorch model deployment, not only MindSpore-native training). Document this integration explicitly in your architecture diagram and code, per the competition's requirement to show Huawei tech "in the solution architecture diagram or in the process flow diagram or relevant codes." This is the faster path.

**Path 2 — Train natively in MindSpore.** Closer to your senior team's (HyperNeura) winning precedent — MindSpore for model development, ModelArts for deployment, OBS for dataset storage. More Huawei-native credit, but MindSpore has a smaller ecosystem and less Siamese-U-Net reference code than PyTorch, so expect more implementation friction, especially adapting the `michal2409/xview2` reference code (which is PyTorch).

**My recommendation:** Path 1 for Preliminary (time pressure), with a stated roadmap to Path 2 for Regional/Global — this mirrors exactly how your own GEO-RESQ proposal document already treats Huawei Cloud/ModelArts/Ascend as "Proposed" moving toward implemented, so the framing is consistent with what you've already written.

Either way: **store your dataset in Huawei OBS**, even if training happens elsewhere — that's a low-effort, genuine Huawei-technology touchpoint that's easy to actually do and easy to show in a diagram.

---

## 9. Producing the Competition's Required "Quantifiable Indicator"

The Preliminary template explicitly asks for quantifiable indicators demonstrating effectiveness — this is Section 6's evaluation notebook output, reported honestly:

- Overall and per-class IoU/F1 on your held-out test split (event-level split, per Section 5)
- A confusion matrix, with specific attention to the dangerous failure mode (real damage classified as "No damage")
- If time allows: a qualitative before/after visual — your trained model's predicted damage map next to the ground truth, for one held-out flood event, since judges respond well to seeing the actual output, not just a metrics table

**Do not report a number you haven't actually measured** — this is the same discipline already applied throughout the FloodWay and GEO-RESQ documents in this project, and it's what keeps you safe if a judge asks "how was this validated."

---

## 10. Wiring the Trained Model Back Into GEO-RESQ

This is Block 6 in your existing Phase 2 plan — add one more endpoint:

```
GET /api/change-detection/{scenario_id}
  → runs (or serves pre-computed) inference on the T1/T2 pair for that scenario
  → returns GeoJSON polygons tagged with damage class, matching the same
    OSM-compatible tagging convention already used elsewhere in the system
    (destroyed:highway, damaged:bridge, etc. — Section 6.3 of the master spec)
```

For the demo itself, **pre-computing inference results for your 2 demo scenarios (Kajang & Valencia) and serving them as static GeoJSON is a legitimate, honest choice** — it avoids live-inference latency/reliability risk during a judged demo, exactly the same "safety net" pattern already used elsewhere in this project (the Command view's fallback flag, FloodWay's `USE_TRAINED_MODELS` toggle). Just don't call it live inference in the pitch if it isn't.

---

## 11. What to literally tell Antigravity next

```
Set up the ml/ directory per this structure. Start with Tier A:
download the Prithvi-100M-sen1floods11 checkpoint from Hugging Face,
fine-tune it on a subset of Sen1Floods11 for our Kajang/Hulu Langat
and Valencia scenarios, and produce a real, measured evaluation
(IoU, F1, confusion matrix) in notebooks/06_evaluate.ipynb before
touching any more UI work. Document Huawei OBS/ModelArts usage in
the architecture diagram as we go, per Path 1 in the AI model
development guidance doc.
```

Do this before the next round of design/skill work — this is the piece that's actually missing.