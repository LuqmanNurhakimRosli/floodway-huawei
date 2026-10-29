"""
Compile and package all PDF, Markdown, and related submission documents
regarding the Huawei ICT Competition 2026-2027 into a structured zip archive.
"""
import os
import shutil
import subprocess
import zipfile
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
OUTPUT_ZIP = REPO_ROOT / "FloodWay_Huawei_Competition_Docs.zip"
STAGING_DIR = REPO_ROOT / "_temp_huawei_compilation"

def extract_git_blob(commit_ref: str, file_path: str, dest_path: Path):
    """Extract a file blob directly from git history into dest_path."""
    dest_path.parent.mkdir(parents=True, exist_ok=True)
    res = subprocess.run(
        ["git", "cat-file", "-p", f"{commit_ref}:{file_path}"],
        cwd=REPO_ROOT,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    if res.returncode == 0:
        with open(dest_path, "wb") as f:
            f.write(res.stdout)
        print(f"  [GIT] Extracted {file_path} ({len(res.stdout)} bytes)")
        return True
    else:
        print(f"  [ERR] Failed to extract {file_path} from git: {res.stderr.decode('utf-8', errors='ignore')}")
        return False

def copy_local_file(src_rel: str, dest_rel: str):
    """Copy a local file to staging."""
    src = REPO_ROOT / src_rel
    dest = STAGING_DIR / dest_rel
    dest.parent.mkdir(parents=True, exist_ok=True)
    if src.exists():
        shutil.copy2(src, dest)
        print(f"  [COPY] {src_rel} -> {dest_rel}")
        return True
    else:
        print(f"  [WARN] Source file not found: {src_rel}")
        return False

def main():
    print("=== Compiling Huawei Competition Documentation ===")
    if STAGING_DIR.exists():
        shutil.rmtree(STAGING_DIR)
    STAGING_DIR.mkdir(parents=True, exist_ok=True)

    # 1. Competition Guidelines & Forms
    cat1 = "01_Competition_Guidelines_and_Forms"
    copy_local_file(
        "docs/reference/competition/HUAWEI_ICT_COMPETITION_REFERENCE.md",
        f"{cat1}/HUAWEI_ICT_COMPETITION_REFERENCE.md",
    )
    copy_local_file(
        "docs/reference/competition/FloodWay2_Submission_Report.docx",
        f"{cat1}/FloodWay2_Submission_Report.docx",
    )
    copy_local_file(
        "docs/reference/competition/Innovation Competition - Entry Information Form - Malaysia - RESQ4ACE.docx",
        f"{cat1}/Innovation Competition - Entry Information Form - Malaysia - RESQ4ACE.docx",
    )
    extract_git_blob(
        "5f8fe11~1",
        "docs/reference/competition/Innovation Competition - Entry Information Form - Asia Pacific- RESQ4ACE.pdf",
        STAGING_DIR / cat1 / "Innovation Competition - Entry Information Form - Asia Pacific- RESQ4ACE.pdf",
    )
    copy_local_file(
        "docs/team/COMPETITION_CRITERIA_AND_JUDGES.local.md",
        f"{cat1}/COMPETITION_CRITERIA_AND_JUDGES.md",
    )

    # 2. Preliminary Round Submissions & Records
    cat2 = "02_Preliminary_Round_Submission"
    extract_git_blob(
        "5f8fe11~1",
        "docs/product/preliminary-round/MEETING_SUMMARY.pdf",
        STAGING_DIR / cat2 / "MEETING_SUMMARY.pdf",
    )
    copy_local_file(
        "docs/product/preliminary-round/MEETING_SUMMARY.md",
        f"{cat2}/MEETING_SUMMARY.md",
    )
    copy_local_file(
        "docs/product/preliminary-round/PITCH_SCRIPT.md",
        f"{cat2}/PITCH_SCRIPT.md",
    )
    copy_local_file(
        "docs/product/preliminary-round/JUDGES_QNA.md",
        f"{cat2}/JUDGES_QNA.md",
    )
    copy_local_file(
        "docs/product/preliminary-round/transcript/brief-transcript.txt",
        f"{cat2}/brief-transcript.txt",
    )
    copy_local_file(
        "docs/product/preliminary-round/transcript/brief-transcript.srt",
        f"{cat2}/brief-transcript.srt",
    )
    copy_local_file(
        "docs/product/preliminary-round/poster/FloodWay_Poster_1920x1080.png",
        f"{cat2}/FloodWay_Poster_1920x1080.png",
    )
    copy_local_file(
        "docs/product/preliminary-round/poster/FloodWay_Poster_1920x1080.pptx",
        f"{cat2}/FloodWay_Poster_1920x1080.pptx",
    )

    # 3. Pitch Decks & Presentation Slides
    cat3 = "03_Pitch_Decks_and_Presentations"
    extract_git_blob(
        "5f8fe11~1",
        "docs/product/pitch/FloodWay Five42 Slide Deck.pdf",
        STAGING_DIR / cat3 / "FloodWay Five42 Slide Deck.pdf",
    )
    extract_git_blob(
        "5f8fe11~1",
        "docs/product/pitch/Five42 - Refinement Changelog.pdf",
        STAGING_DIR / cat3 / "Five42 - Refinement Changelog.pdf",
    )
    copy_local_file(
        "docs/team/FloodWay_Canva_Addon.pdf",
        f"{cat3}/FloodWay_Canva_Addon.pdf",
    )
    copy_local_file(
        "docs/team/FloodWay_Semifinal_Slides.local.pptx",
        f"{cat3}/FloodWay_Semifinal_Slides.pptx",
    )
    copy_local_file(
        "docs/team/FloodWay_Investor_Pitch.local.pptx",
        f"{cat3}/FloodWay_Investor_Pitch.pptx",
    )
    copy_local_file(
        "docs/team/FloodWay_HyperNeura_Style.local.pptx",
        f"{cat3}/FloodWay_HyperNeura_Style.pptx",
    )
    copy_local_file(
        "docs/team/PITCH_SLIDES_5_17.local.md",
        f"{cat3}/PITCH_SLIDES_5_17.md",
    )
    copy_local_file(
        "docs/team/PITCH_DECK_DESIGN_BRIEF.local.md",
        f"{cat3}/PITCH_DECK_DESIGN_BRIEF.md",
    )
    copy_local_file(
        "docs/team/DEMO_PLAN_2MIN.local.md",
        f"{cat3}/DEMO_PLAN_2MIN.md",
    )

    # 4. Technical Architecture & Huawei Cloud Specifications
    cat4 = "04_Architecture_and_Huawei_Cloud_Specs"
    copy_local_file(
        "docs/product/preliminary-round/architecture/SYSTEM_SPECIFICATION.md",
        f"{cat4}/SYSTEM_SPECIFICATION.md",
    )
    copy_local_file(
        "docs/product/preliminary-round/architecture/URBAN_FLASH_FLOOD.md",
        f"{cat4}/URBAN_FLASH_FLOOD_PROBLEM_SPEC.md",
    )
    copy_local_file(
        "docs/product/preliminary-round/architecture/system_architecture.png",
        f"{cat4}/system_architecture.png",
    )
    copy_local_file(
        "docs/product/preliminary-round/architecture/system_architecture.svg",
        f"{cat4}/system_architecture.svg",
    )
    copy_local_file(
        "docs/plans/SEMIFINAL_FUSION_AND_HUAWEI_PLAN.md",
        f"{cat4}/SEMIFINAL_FUSION_AND_HUAWEI_PLAN.md",
    )
    copy_local_file(
        "deploy/ecs/README.md",
        f"{cat4}/HUAWEI_CLOUD_ECS_DEPLOYMENT_GUIDE.md",
    )
    copy_local_file(
        "docs/FLOODWAY_ARCHITECTURE.md",
        f"{cat4}/FLOODWAY_ARCHITECTURE.md",
    )
    copy_local_file(
        "docs/architecture/FLOODWAY_OVERVIEW.md",
        f"{cat4}/FLOODWAY_OVERVIEW.md",
    )
    copy_local_file(
        "docs/architecture/TECH_STACK.md",
        f"{cat4}/TECH_STACK.md",
    )
    copy_local_file(
        "docs/architecture/IOT_SYSTEM.md",
        f"{cat4}/IOT_SYSTEM.md",
    )
    copy_local_file(
        "docs/ops/DEMO_RUNBOOK.md",
        f"{cat4}/DEMO_RUNBOOK.md",
    )
    copy_local_file(
        "docs/ai/PROGRESS.md",
        f"{cat4}/PROJECT_STATUS_AND_PROGRESS.md",
    )

    # 5. AI Models, Benchmarks & Validation
    cat5 = "05_AI_Models_and_Benchmarks"
    copy_local_file(
        "RESULTS_5_MODEL_COMPARISON.md",
        f"{cat5}/RESULTS_5_MODEL_COMPARISON.md",
    )
    copy_local_file(
        "README-ML-BENCHMARK.md",
        f"{cat5}/README-ML-BENCHMARK.md",
    )
    copy_local_file(
        "docs/ml/STAGE_5_HANDOFF.md",
        f"{cat5}/STAGE_5_HANDOFF.md",
    )
    copy_local_file(
        "docs/team/ANALYSIS_CURRENT_VS_BENCHMARKS.md",
        f"{cat5}/ANALYSIS_CURRENT_VS_BENCHMARKS.md",
    )
    copy_local_file(
        "docs/team/RESEARCH_MALAYSIA_FLOOD_BENCHMARK.md",
        f"{cat5}/RESEARCH_MALAYSIA_FLOOD_BENCHMARK.md",
    )
    copy_local_file(
        "docs/team/MODEL_TRAINING_GUIDE.md",
        f"{cat5}/MODEL_TRAINING_GUIDE.md",
    )
    copy_local_file(
        "docs/team/TISYA_FLOOD_DATASET_TASK.md",
        f"{cat5}/TISYA_FLOOD_DATASET_TASK.md",
    )
    copy_local_file(
        "FloodWay_Handover/04_docs_and_research/GINKGO_Model1_card.md",
        f"{cat5}/GINKGO_Model1_card.md",
    )
    copy_local_file(
        "FloodWay_Handover/04_docs_and_research/Trained_model_evaluation.md",
        f"{cat5}/Trained_model_evaluation.md",
    )

    # 6. Hardware Blueprints & Node Integration
    cat6 = "06_Hardware_Blueprints_and_IoT"
    extract_git_blob(
        "5f8fe11~1",
        "FloodWay_Handover/02_blueprints/FloodWay_RiverNode_v1_Blueprints.pdf",
        STAGING_DIR / cat6 / "FloodWay_RiverNode_v1_Blueprints.pdf",
    )
    copy_local_file(
        "docs/team/NADI_IOT_INTEGRATION_GUIDE.md",
        f"{cat6}/NADI_IOT_INTEGRATION_GUIDE.md",
    )
    copy_local_file(
        "FloodWay_Handover/README_HANDOVER.md",
        f"{cat6}/README_HANDOVER.md",
    )
    copy_local_file(
        "FloodWay_Handover/04_docs_and_research/FloodWay_repo_overview.md",
        f"{cat6}/FloodWay_repo_overview.md",
    )

    # Generate a comprehensive master index README
    readme_content = """# FloodWay — Huawei ICT Competition 2026–2027 Documentation Pack
**Project:** FloodWay (AI Flood Early Warning & Safe Evacuation Routing for Malaysia)  
**Track:** Cloud & AI Track / Innovation Competition (RESQ4ACE)  
**Institution:** Universiti Teknologi MARA (UiTM)  
**Compiled Date:** October 2026  

---

## Overview

This compilation archive bundles all primary Markdown (`.md`) documentation, technical architecture specifications, pitch deck presentations (`.pdf`, `.pptx`), submission entry forms, and engineering blueprints associated with the **Huawei ICT Competition 2026–2027**.

---

## Directory Structure & Contents

### `01_Competition_Guidelines_and_Forms/`
Official competition reference, guidelines, scoring rubrics, and formal submission documents:
- `HUAWEI_ICT_COMPETITION_REFERENCE.md`: Competition overview, track requirements, and scoring categories.
- `Innovation Competition - Entry Information Form - Asia Pacific- RESQ4ACE.pdf`: Official entry form (Asia Pacific region).
- `Innovation Competition - Entry Information Form - Malaysia - RESQ4ACE.docx`: Malaysia national level entry form.
- `FloodWay2_Submission_Report.docx`: Submission report document.
- `COMPETITION_CRITERIA_AND_JUDGES.md`: Detailed judge evaluation criteria, scoring weights, and alignment strategy.

### `02_Preliminary_Round_Submission/`
Artifacts and records from the preliminary qualification stage:
- `MEETING_SUMMARY.pdf` & `MEETING_SUMMARY.md`: Strategic advisor meeting summary with Dr. Azliza (slide constraints, team responsibilities, demo requirements).
- `PITCH_SCRIPT.md`: Rehearsed spoken pitch script (3 speakers, ~4:30 duration).
- `JUDGES_QNA.md`: Prepared defensive Q&A answering technical, business, and deployment questions from competition judges.
- `brief-transcript.md`: Complete transcript of the competition brief.
- `FloodWay_Poster_1920x1080.png` & `.pptx`: Official competition poster (Problem, Solution, Impact, and Huawei Technology Stack).

### `03_Pitch_Decks_and_Presentations/`
Pitch presentations, slide notes, and visual storytelling assets:
- `FloodWay Five42 Slide Deck.pdf`: Core pitch deck (Five42 format).
- `Five42 - Refinement Changelog.pdf`: Presentation iteration notes.
- `FloodWay_Canva_Addon.pdf`: Canva slide deck addon.
- `FloodWay_Semifinal_Slides.pptx`: Semi-final presentation deck slides.
- `FloodWay_Investor_Pitch.pptx`: Comprehensive investor / commercial pitch deck.
- `FloodWay_HyperNeura_Style.pptx`: Alternate visual theme pitch deck.
- `PITCH_SLIDES_5_17.md`: In-depth slide-by-slide narration notes (Slides 5 through 17).
- `PITCH_DECK_DESIGN_BRIEF.md`: Visual guidelines and design system brief for pitch decks.
- `DEMO_PLAN_2MIN.md`: Choreographed 2-minute live demo runbook.

### `04_Architecture_and_Huawei_Cloud_Specs/`
Technical architecture, system diagrams, and Huawei Cloud infrastructure:
- `SYSTEM_SPECIFICATION.md`: End-to-end system specification for Huawei Cloud deployment.
- `URBAN_FLOOD_EARLY_WARNING_SYSTEM_HUAWEI.md`: Architectural specification for urban flood warning leveraging Huawei Cloud services.
- `SEMIFINAL_FUSION_AND_HUAWEI_PLAN.md`: Roadmap for Huawei Cloud ECS/OBS/SMN integration and four-factor risk fusion.
- `HUAWEI_CLOUD_ECS_DEPLOYMENT_GUIDE.md`: Step-by-step deployment guide for Docker Compose + Caddy HTTPS on Huawei Cloud ECS.
- `FLOODWAY_ARCHITECTURE.md`: Technical architecture and system boundaries.
- `FLOODWAY_OVERVIEW.md`: System capabilities and implementation overview.
- `TECH_STACK.md`: Complete hardware, cloud, AI, and software stack breakdown.
- `IOT_SYSTEM.md`: IoT river monitoring and telemetry system architecture.
- `DEMO_RUNBOOK.md`: Operational demo script, simulated vs. real component guide, and failover table.
- `PROJECT_STATUS_AND_PROGRESS.md`: Current development milestone log and validation status.

### `05_AI_Models_and_Benchmarks/`
Machine learning models, flood prediction algorithms, and validation benchmarks:
- `RESULTS_5_MODEL_COMPARISON.md`: Rigorous benchmark comparison of five flood risk prediction models (LR, RF, CatBoost, etc.).
- `README-ML-BENCHMARK.md`: Reproduction protocol and dataset documentation for the ML benchmark.
- `STAGE_5_HANDOFF.md`: Stage 5 flood-prone model handoff documentation.
- `ANALYSIS_CURRENT_VS_BENCHMARKS.md`: Comparative analysis against regional and academic flood early warning benchmarks.
- `RESEARCH_MALAYSIA_FLOOD_BENCHMARK.md`: Research paper survey on Malaysian flood telemetry and hydrological modeling.
- `MODEL_TRAINING_GUIDE.md`: Step-by-step model training and evaluation guide.
- `TISYA_FLOOD_DATASET_TASK.md`: Dataset extraction and feature engineering documentation.
- `GINKGO_Model1_card.md` & `Trained_model_evaluation.md`: GINKGO Model 1 model card and evaluation metrics.

### `06_Hardware_Blueprints_and_IoT/`
Hardware telemetry, physical enclosures, and IoT integration:
- `FloodWay_RiverNode_v1_Blueprints.pdf`: Dimensioned engineering blueprints for the solar-powered River Depth Node.
- `NADI_IOT_INTEGRATION_GUIDE.md`: Microcontroller sensor node wiring, ultrasonic transducer calibration, and MQTT telemetry protocol.
- `README_HANDOVER.md`: Engineering handover documentation for hardware and simulation modules.
- `FloodWay_repo_overview.md`: Repository layout and module relationships.

---
*Created for team review and competition archive.*
"""
    with open(STAGING_DIR / "README_COMPILATION.md", "w", encoding="utf-8") as f:
        f.write(readme_content.strip() + "\n")
    print("  [INDEX] Created README_COMPILATION.md")

    # Create zip archive
    if OUTPUT_ZIP.exists():
        OUTPUT_ZIP.unlink()

    print(f"Creating zip file: {OUTPUT_ZIP.name}...")
    with zipfile.ZipFile(OUTPUT_ZIP, "w", zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(STAGING_DIR):
            for file in files:
                full_path = Path(root) / file
                rel_path = full_path.relative_to(STAGING_DIR)
                zipf.write(full_path, arcname=str(rel_path))
                print(f"  + {rel_path}")

    # Cleanup staging directory
    shutil.rmtree(STAGING_DIR)

    zip_size_mb = OUTPUT_ZIP.stat().st_size / (1024 * 1024)
    print(f"=== Successfully built {OUTPUT_ZIP.name} ({zip_size_mb:.2f} MB) ===")

if __name__ == "__main__":
    main()
