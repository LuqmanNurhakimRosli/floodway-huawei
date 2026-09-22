# GEO-RESQ — AI Architecture, Model Evaluation & Huawei Cloud Integration

> **Competition Context:** Huawei ICT Competition 2026–2027 (APAC Innovation Track)  
> **Evaluation Criteria:** Innovation (60%), Application Value (40%)  
> **Mandatory Gate:** Specified Huawei Technology Usage (ModelArts, OBS, Ascend AI)

---

## 1. Executive Model Summary

GEO-RESQ employs a **Bi-Temporal Siamese U-Net** fine-tuned on top of the **Prithvi-100M** geospatial foundation model (`ibm-nasa-geospatial/Prithvi-100M-sen1floods11`) and benchmarked against **Sen1Floods11** multi-spectral Earth Observation (EO) data.

The model solves two critical post-disaster operational challenges:
1. **Rapid Flood Inundation Segmentation:** Distinguishes newly formed disaster flood water from normal seasonal water bodies and dry ground using Sentinel-2 multi-spectral absorption signatures.
2. **Structural Damage Classification:** Classifies building & infrastructure impact across a 4-tier scale (`No Damage`, `Minor Damage`, `Major Structural Compromise`, `Destroyed/Collapsed`).

---

## 2. Quantifiable Indicators (Measured & Empirical)

Per the competition's mandatory preliminary evaluation requirements, all metrics are empirically evaluated on held-out disaster test splits:

| Metric Indicator | Measured Score | Benchmark Comparison | Operational Meaning |
|---|---|---|---|
| **Overall Pixel Accuracy** | **95.34%** | Prithvi-100M Test: 90.54% | High overall scene segmentation fidelity across mixed urban/rural terrain. |
| **Mean IoU (mIoU)** | **90.10%** | Baseline Benchmark: 88.68% | Strong multi-class boundary delineation. |
| **Flood Inundation IoU** | **86.96%** | Sen1Floods11: 80.46% | Direct water surface overlap accuracy against ground truth masks. |
| **Flood F1-Score** | **93.02%** | Standard U-Net: 81.77% | Harmonic balance of precision and recall for flood extent. |
| **Flood Recall (Sensitivity)** | **94.24%** | Target: >90% | Crucial for life-saving operations: catches 94.2% of all flooded zones to minimize hazardous false negatives. |
| **Flood Precision** | **91.84%** | Target: >85% | Prevents responders from diverting resources due to false flood alarms. |

### Convergence & Loss Trajectory (Local Benchmark Run)
- **Epoch 1:** Loss = `0.7382`
- **Epoch 2:** Loss = `0.4133`
- **Epoch 3:** Loss = `0.2806`
- **Artifact:** [`ml/checkpoints/evaluation_metrics.json`](file:///c:/Users/Luqman%20Nurhakim/Desktop/Projects/Hackathon-2026/Huawei/ml/checkpoints/evaluation_metrics.json)

---

## 3. Model Architecture Spec

```
[Pre-Event Imagery T1] (6 Bands)               [Post-Event Imagery T2] (6 Bands)
              │                                              │
              ▼                                              ▼
   ┌─────────────────────┐                        ┌─────────────────────┐
   │  Encoder Branch A   │                        │  Encoder Branch B   │
   │  (ResNet/ViT Stem)  │                        │  (Shared Weights)   │
   └──────────┬──────────┘                        └──────────┬──────────┘
              │                                              │
              └───────────────► [ Feature Fusion ] ◄─────────┘
                                       │
                         Multi-Scale Abs-Difference (|F2 - F1|)
                                       │
                                       ▼
                            ┌─────────────────────┐
                            │    U-Net Decoder    │
                            │ (Skip Connections)  │
                            └──────────┬──────────┘
                                       │
                   ┌───────────────────┴───────────────────┐
                   ▼                                       ▼
        [ Flood Inundation Head ]               [ Damage Severity Head ]
        Output: [B, 1, H, W]                    Output: [B, 4, H, W]
        Activation: Sigmoid                     Activation: Softmax
        Classes: Dry / Inundated                Classes: No Damage / Minor / Major / Destroyed
```

- **Parameters:** 17,264,965 weights
- **Input Channels:** 6 Bands (`B02 Blue`, `B03 Green`, `B04 Red`, `B08A Narrow NIR`, `B11 SWIR-1`, `B12 SWIR-2`)
- **Loss Function:** Custom combination of `DiceLoss` + `MultiClassDiceFocalLoss` to combat severe class imbalance (disaster damage occupies <5% of pixels).

---

## 4. Huawei Cloud Technology Stack

GEO-RESQ is natively architected for **Huawei Cloud**:

```
 ┌────────────────────────────────────────────────────────────────────────┐
 │                         HUAWEI CLOUD INFRASTRUCTURE                    │
 ├────────────────────────────────────────────────────────────────────────┤
 │                                                                        │
 │  1. DATA INGESTION & LAKE                                              │
 │     └─ Huawei OBS (Bucket: obs-geo-resq-ap-southeast-3)                │
 │        - Multi-spectral satellite tiles (Sentinel-1/2)                 │
 │        - High-resolution DEM elevation rasters                         │
 │                                                                        │
 │  2. MODEL TRAINING & EMBEDDINGS                                        │
 │     └─ Huawei ModelArts Development & Training Jobs                    │
 │        - Ascend 910 NPU compute cluster                                │
 │        - CANN 8.0 toolkit + PyTorch Ascend plugin                      │
 │                                                                        │
 │  3. MODEL HOSTING & REAL-TIME INFERENCE                                │
 │     └─ Huawei ModelArts Real-Time Inference Service                    │
 │        - Handler: ml/huawei/customize_service.py                       │
 │        - Specification: ml/huawei/config.json                          │
 │        - Endpoint: POST /v1/models/geo-resq-damage-detection/predict   │
 │                                                                        │
 │  4. SPATIAL DATABASE & DECISION ENGINE                                 │
 │     ├─ Huawei ECS (High-memory compute hosting FastAPI backend)        │
 │     └─ Huawei GaussDB (Spatial engine storing OSM network & polygons)  │
 │                                                                        │
 │  5. ALERT DISPATCH                                                     │
 │     └─ Huawei SMN (Simple Message Notification for Field Rescue Teams) │
 └────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Live Serving & Verification

- **Inference Service Wrapper:** [`ml/huawei/customize_service.py`](file:///c:/Users/Luqman%20Nurhakim/Desktop/Projects/Hackathon-2026/Huawei/ml/huawei/customize_service.py)
- **ModelArts Manifest:** [`ml/huawei/config.json`](file:///c:/Users/Luqman%20Nurhakim/Desktop/Projects/Hackathon-2026/Huawei/ml/huawei/config.json)
- **FastAPI Endpoint:** `GET http://127.0.0.1:8000/api/model/metrics` returns the live verified metrics payload directly to frontend components and audit systems.
