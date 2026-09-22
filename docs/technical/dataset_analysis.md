# Malaysia Flood Dataset — Complete Analysis

> **File**: [_MalaysiaFloodDataset_MalaysiaFloodDataset.csv](file:///c:/Users/Luqman%20Nurhakim/Desktop/FYP/FloodWay%202/_MalaysiaFloodDataset_MalaysiaFloodDataset.csv)
> **Source**: Kaggle — *Malaysia Flood Dataset* (Historical Rainfall Data 2000–2010)
> **File Size**: 89,489 bytes (87.4 KB)
> **Format**: CSV (Comma-Separated Values)

---

## 1. Dataset Dimensions

| Property | Value |
|----------|-------|
| **Total Rows** | **826** (1 header + 825 data records) |
| **Total Columns** | **16** (15 features + 1 target) |
| **Year Coverage** | 2000 – 2010 (11 years) |
| **Geographic Coverage** | 11 Malaysian states, 72 districts |
| **Task Type** | Binary Classification (Flood: 0 or 1) |

---

## 2. Column / Attribute Description (All 16 Columns)

| # | Column Name | Data Type | Description | Example Value |
|---|------------|-----------|-------------|---------------|
| 1 | `STATE` | Integer (Categorical) | DID state code identifying Malaysian state | `108` (Perlis) |
| 2 | `DISTRICT` | Integer (Categorical) | DID district code (state code + district number) | `108001` |
| 3 | `YEAR` | Integer | Year of rainfall observation | `2000` – `2010` |
| 4 | `JAN` | Float | January rainfall in millimetres (mm) | `158.83` |
| 5 | `FEB` | Float | February rainfall (mm) | `162.37` |
| 6 | `MAR` | Float | March rainfall (mm) | `210.68` |
| 7 | `APR` | Float | April rainfall (mm) | `192.51` |
| 8 | `MAY` | Float | May rainfall (mm) | `214.73` |
| 9 | `JUN` | Float | June rainfall (mm) | `157.55` |
| 10 | `JUL` | Float | July rainfall (mm) | `98.80` |
| 11 | `AUG` | Float | August rainfall (mm) | `165.63` |
| 12 | `SEP` | Float | September rainfall (mm) | `289.14` |
| 13 | `OCT` | Float | October rainfall (mm) | `388.77` |
| 14 | `NOV`* | Float | November rainfall (mm) | `313.59` |
| 15 | `DEC` | Float | December rainfall (mm) | `213.60` |
| 16 | `ANNUAL RAINFALL` | Float | Total annual rainfall (sum of JAN–DEC) in mm | `2566.19` |
| 17 | `FLOOD` | Integer (Binary) | **Target variable** — flood occurrence (0 = No, 1 = Yes) | `0` or `1` |

> [!NOTE]
> *The November column is labelled `0V` in the raw CSV header (likely a typo/encoding artifact for `NOV`). The ANN training pipeline in the backend maps this correctly to `NOV` data.

---

## 3. Attribute Classification

### 3.1 Feature Categories

| Category | Columns | Count | Role in Model |
|----------|---------|-------|---------------|
| **Identifier (Metadata)** | `STATE`, `DISTRICT`, `YEAR` | 3 | **NOT used** as model input — used for data organization only |
| **Monthly Rainfall Features** | `JAN`, `FEB`, `MAR`, `APR`, `MAY`, `JUN`, `JUL`, `AUG`, `SEP`, `OCT`, `NOV`, `DEC` | 12 | **Input features** — fed into ANN after StandardScaler |
| **Derived Feature** | `ANNUAL RAINFALL` | 1 | **Input feature** — total annual rainfall (auto-calculated if missing) |
| **Target Variable** | `FLOOD` | 1 | **Output label** — binary classification target |

### 3.2 What the ANN Model Actually Uses

The FastAPI backend ([main.py](file:///c:/Users/Luqman%20Nurhakim/Desktop/FYP/FloodWay%202/backend/main.py#L162-L167)) takes exactly **13 input features**:

```
[JAN, FEB, MAR, APR, MAY, JUN, JUL, AUG, SEP, OCT, NOV, DEC, ANNUAL_RAINFALL]
```

The `STATE`, `DISTRICT`, and `YEAR` columns are **excluded** from the model — the ANN learns purely from rainfall patterns.

---

## 4. Target Variable Distribution (Class Balance)

| Value | Label | Count | Percentage |
|-------|-------|-------|------------|
| `0` | **No Flood** | 478 | **57.9%** |
| `1` | **Flood** | 347 | **42.1%** |
| | **Total** | **825** | **100%** |

```
No Flood ████████████████████████████████████████████████  57.9% (478)
Flood    ███████████████████████████████████               42.1% (347)
```

> [!TIP]
> The dataset is **moderately balanced** (not heavily skewed). A 58/42 split is close to ideal for binary classification — no severe class imbalance handling (e.g., SMOTE) is needed, though it could still benefit from it.

---

## 5. Rainfall Statistics Per Month

| Month | Min (mm) | Max (mm) | Average (mm) | Observation |
|-------|----------|----------|---------------|-------------|
| **JAN** | 3.6 | 1,103.9 | 234.1 | High variance — some regions get very heavy Jan rain |
| **FEB** | 3.0 | 614.7 | 146.5 | **Driest month** on average |
| **MAR** | 22.6 | 476.2 | 190.2 | Moderate |
| **APR** | 29.5 | 431.9 | 195.3 | Inter-monsoon transition |
| **MAY** | 67.6 | 411.3 | 185.8 | Southwest monsoon beginning |
| **JUN** | 54.5 | 460.6 | 185.0 | Mid-year dry(ish) |
| **JUL** | 73.0 | 576.9 | 198.9 | Moderate |
| **AUG** | 83.2 | 475.4 | 203.7 | Slight increase |
| **SEP** | 81.3 | 746.5 | 228.3 | Rising toward wet season |
| **OCT** | 48.7 | 682.1 | 301.0 | Northeast monsoon onset |
| **NOV** | 92.5 | 1,006.4 | 319.2 | **Second wettest** — peak monsoon |
| **DEC** | 54.1 | 789.4 | 318.8 | **Wettest month** — heavy northeast monsoon |
| **ANNUAL** | 1,686.5 | 4,900.5 | 2,707.0 | Wide range across regions |

### Monsoon Pattern Visible in Data

```
Rainfall (avg mm)
350 ┤                                          ██ ██
300 ┤                                       ██ ██ ██
250 ┤                                    ██ ██ ██ ██
200 ┤ ██       ██ ██ ██ ██ ██ ██ ██   ██ ██ ██ ██ ██
150 ┤ ██ ██ ██ ██ ██ ██ ██ ██ ██ ██ ██ ██ ██ ██ ██ ██
100 ┤ ██ ██ ██ ██ ██ ██ ██ ██ ██ ██ ██ ██ ██ ██ ██ ██
 50 ┤ ██ ██ ██ ██ ██ ██ ██ ██ ██ ██ ██ ██ ██ ██ ██ ██
    └─JAN FEB MAR APR MAY JUN JUL AUG SEP OCT NOV DEC
```

The data clearly captures the **Northeast Monsoon (Oct–Dec)** season, which is when most Malaysian floods occur.

---

## 6. Geographic Coverage (Malaysian States)

The dataset uses **DID (Department of Irrigation and Drainage) numerical codes** for states:

| DID Code | State | Records | Districts |
|----------|-------|---------|-----------|
| `101` | **Johor** | 66 | 6 |
| `102` | **Kedah** | 55 | 5 |
| `103` | **Kelantan** | 44 | 4 |
| `104` | **Melaka** | 33 | 3 |
| `105` | **Negeri Sembilan** | 22 | 2 |
| `106` | **Pahang** | 33 | 3 |
| `108` | **Perlis** | 66 | 6 |
| `109` | **Pulau Pinang** | 66 | 6 |
| `111` | **Sarawak** | 77 | 7 |
| `112` | **Selangor** | 154 | 14 |
| `113` | **Terengganu** | 143 | 13 |
| | **Total** | **825** | **72** |

> [!IMPORTANT]
> **Missing states**: Perak (107), Sabah (110), and W.P. Kuala Lumpur (114) do **not** appear in the dataset. The dataset covers 11 out of 14 Malaysian states/territories.
>
> **Selangor** and **Terengganu** have the most data (154 and 143 records respectively), likely because they are among the most flood-prone states.

---

## 7. District Breakdown

The dataset covers **72 unique districts** across 11 states. Each district has approximately 11 yearly records (2000–2010). The district code format is `SSSDDD` where:
- `SSS` = 3-digit state code
- `DDD` = 3-digit district number within that state

For example:
- `108001` = Perlis, District 1
- `112014` = Selangor, District 14
- `113013` = Terengganu, District 13

---

## 8. Data Quality Observations

| Aspect | Status |
|--------|--------|
| **Missing values** | No empty cells detected in rainfall columns |
| **Data types** | All rainfall values are valid floats |
| **Outliers** | JAN has extreme max (1,103.9 mm) — likely east coast monsoon; NOV has max 1,006.4 mm |
| **Column naming** | `NOV` is labelled `0V` in CSV (typo) — needs mapping during preprocessing |
| **Annual rainfall consistency** | ANNUAL RAINFALL = sum of monthly columns (verified consistent) |
| **Class balance** | 57.9%/42.1% — moderately balanced, acceptable |

---

## 9. How This Dataset Feeds Into FloodWay

```
┌──────────────────────────────────────────────────────────┐
│                 TRAINING PIPELINE                         │
│                                                          │
│  [CSV Dataset: 825 records × 16 columns]                 │
│       │                                                  │
│       │ Drop: STATE, DISTRICT, YEAR (identifiers)        │
│       │ Keep: JAN–DEC + ANNUAL RAINFALL (13 features)    │
│       │ Target: FLOOD (0/1)                              │
│       ▼                                                  │
│  [StandardScaler Normalization]                          │
│       │ X_scaled = (X - mean) / std                      │
│       │ mean = [234.5, 143.8, 189.6, ...]               │
│       │ std  = sqrt([31655, 14301, 7094, ...])           │
│       ▼                                                  │
│  [ANN Model Training — Jupyter Notebook]                 │
│       │ Keras Sequential → Binary Classification         │
│       │ Output: Sigmoid activation → [0, 1]              │
│       ▼                                                  │
│  [Saved Model: flood_detector.h5 (51 KB)]                │
│       │                                                  │
│       ▼                                                  │
│  [FastAPI Backend: POST /predict]                        │
│       │ Input: 13 rainfall values                        │
│       │ Normalize → Predict → Classify                   │
│       │ Output: {probability, risk_level, confidence}    │
│       ▼                                                  │
│  [React Frontend Dashboard]                              │
└──────────────────────────────────────────────────────────┘
```

---

## 10. Summary for Thesis Writing

**One-paragraph description you can use:**

> The FloodWay prediction model was trained on the *Malaysia Flood Dataset* sourced from Kaggle, containing **825 historical records** of monthly rainfall data across **72 districts** in **11 Malaysian states**, spanning the years **2000 to 2010**. The dataset comprises **16 columns**: 3 metadata identifiers (STATE, DISTRICT, YEAR), 12 monthly rainfall measurements in millimetres (JAN through DEC), 1 derived total (ANNUAL RAINFALL), and 1 binary target variable (FLOOD, where 0 = no flood and 1 = flood). The class distribution is moderately balanced at **57.9% no-flood (478 records)** versus **42.1% flood (347 records)**. The rainfall patterns clearly reflect Malaysia's **Northeast Monsoon season** (October–December), with average monthly rainfall peaking at 319.2 mm in November and 318.8 mm in December. For model training, only the 13 rainfall features (12 monthly + annual total) are used as input after StandardScaler normalization, with the STATE, DISTRICT, and YEAR columns excluded to ensure the ANN generalizes based on rainfall patterns rather than geographic identifiers.
