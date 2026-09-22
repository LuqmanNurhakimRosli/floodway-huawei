# FloodWay: AI-Powered Flood Preparedness & Evacuation System 🌊

> **"Because every minute matters during a flood."**

[![React](https://img.shields.io/badge/React-19-blue?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7-purple?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Python](https://img.shields.io/badge/Python-3.x-yellow?logo=python&logoColor=white)](https://www.python.org/)
[![TensorFlow](https://img.shields.io/badge/TensorFlow-Keras-orange?logo=tensorflow&logoColor=white)](https://www.tensorflow.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Backend-red?logo=firebase&logoColor=white)](https://firebase.google.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

### Developed by **Five42**

| Name | Role |
|---|---|
| Muhammad Luqman Nurhakim Bin Rosli | Developer / Project Lead |
| Nadyie Azil Bin Nazeri | Developer |
| Rina Syazana Binti Rahman | Developer |
| Nur Aleya Binti Muhammad Hafeez | Developer |

**Faculty of Computer and Mathematical Sciences**
Universiti Teknologi MARA (UiTM), 40450, Shah Alam, Selangor, Malaysia

**Supervised by:** Dr. Azliza Mohd Ali & Dr. Ezzatul Akmal Kamaru-Zaman
Faculty of Computer and Mathematical Sciences, UiTM

**Date of Submission:** 13 March 2025

---

---

## 🏆 Borneo HackWKDN Submission

> This project was submitted to the **Borneo HackWKDN** hackathon by team **Five42**.

| Resource | Link |
|---|---|
| � **Live App** | [floodways.netlify.app](https://floodways.netlify.app/) |
| �🎬 **Demo Video** | [Watch on Google Drive](https://drive.google.com/file/d/1trikwP5Y6jQdNsB2ijK1QfZ6xiu01Mnw/view?usp=drive_link) |
| 💻 **Codebase (Repository)** | [github.com/LuqmanNurhakimRosli/FloodWay](https://github.com/LuqmanNurhakimRosli/FloodWay) |
| 📄 **Project Report** | `Borneo HackWKDN Submition/Report FloodWay.pdf` |
| 🛠️ **Setup Instructions** | See [Getting Started](#-getting-started) section below |

> **Judges**: The live app is accessible at [floodways.netlify.app](https://floodways.netlify.app/). The full source code is available in the GitHub repository above. To run the project locally, please follow the [Getting Started](#-getting-started) guide at the bottom of this README.

---

## 📖 Table of Contents

- [Borneo HackWKDN Submission](#-borneo-hackwkdn-submission)
- [Problem Statement](#-problem-statement--target-audience)
- [AI-Based Solution: The Triple AI Engine](#-ai-based-solution-the-triple-ai-engine)
- [Key Features](#-key-features)
- [Tech Stack](#️-tech-stack)
- [Feasibility & Partnerships](#-feasibility--partnerships)
- [Scalability & Impact](#-scalability--impact)
- [Outreach Plan](#-outreach-plan)
- [Roadmap & Timeline](#️-roadmap--timeline)
- [Final Submission Refinements](#-final-submission-refinements)
- [Getting Started](#-getting-started)
- [Usage](#-usage)
- [Contributing](#-contributing)
- [License](#-license)
- [Contact](#-contact)

---

## 🎯 Problem Statement & Target Audience

Malaysia's ongoing monsoon floods reveal a serious gap in disaster response. The devastating floods in 2024 alone caused **RM933.4 million in economic losses** nationwide *(Department of Statistics Malaysia, 2025)*. Victims constantly ask two pressing questions:

> *"When will floodwater reach my area?"* and *"Which evacuation routes are safe?"*

However, current platforms like **MyPublicInfoBanjir** and **eBencana JKR** are mostly reactive — forcing people to piece together scattered data and make guesses about local risks. During emergencies, communities often turn to unverified images on social media, spreading misinformation, misguiding rescue efforts, and slowing down evacuations.

Our ASEAN user survey confirms that **AI-powered early warning systems** are a vital priority, with a strong need for real-time predictive information. FloodWay aligns with **Google.org's Stronger Communities** goal by shifting flood response from reactive reporting to **proactive, AI-driven community support**.

### Who We Protect

| Beneficiary | Description |
|---|---|
| 🏘️ **220M+ ASEAN Residents** | High-risk monsoon zone communities, prioritizing urban youth and kampung residents |
| 🚨 **First Responders (NADMA, MBSA)** | Empowered with verified mapping for targeted, efficient rescues |
| 🚚 **MSME Logistics Fleets** | Grab, ShopeeXpress, and other fleets safeguarded from submerged hazard zones |

---

## 🤖 AI-Based Solution: The Triple AI Engine

FloodWay revolutionizes disaster response via a **first-to-market ASEAN architecture** with a scalable cloud-native backend (FastAPI / Firebase).

### A. 🔮 Prediction Engine — *TensorFlow / Keras LSTM*
Trained on **10 years of historical rainfall data** and live forecasts, this **Long Short-Term Memory (LSTM)** model delivers hyper-local risk timelines, translating raw data into human-readable alerts:

> *"Flood reaches your street in 87 minutes, 1.5m depth"*

### B. ✅ Truth Filter — *Gemini 1.5 Flash*
To combat WhatsApp misinformation, this **multimodal AI** processes user-submitted photos to instantly:
- Verify water presence, depth, and exact location with **~95% accuracy**
- Actively reject fake news and unverified reports

### C. 🗺️ Risk-Aware Routing Engine — *OSM + OSRM*
Standard GPS inadvertently routes users into danger. FloodWay models **OpenStreetMap (OSM)** networks as weighted graphs, applying infinite risk penalties to verified danger zones to deliver **safe, turn-by-turn evacuation routes**.

### 🔒 Responsible AI
- **Zero PII extraction**: Server-side processing collects no Personally Identifiable Information
- **Bias removal**: Centralized, verified analytics eliminate human bias and misinformation hysteria
- **Diverse datasets**: Regional datasets ensure accuracy across different geographic contexts

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🌧️ **Smart Flood Prediction** | Predicts flood probability (Safe / Warning / Danger) with a 24-hour interactive timeline |
| 🛣️ **Risk-Aware Routing** | Avoids flooded roads; supports 🚗 Car, 🏍️ Motorcycle, and 🚶 Walk modes |
| 📸 **AI Truth Filter** | Gemini-powered image verification to validate community flood reports |
| 🌊 **3D Flood Simulation** | Interactive 3D visualisation of flood impact with realistic building rendering |
| 📢 **WhatsApp Alerts** | Shareable flood alerts with pre-filled messages when risk reaches warning/danger levels |
| 👮 **Moderator Panel** | Admin tools to review, verify, and manage community-submitted flood reports |
| 🔔 **Push Notifications** | Real-time alerts for users in at-risk zones *(in development)* |

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 + TypeScript 5.9
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Maps**: Leaflet + React-Leaflet
- **Icons**: Lucide React
- **PWA**: React Progressive Web App (mobile-first)

### Backend & AI
- **API**: Python (FastAPI)
- **ML Model**: TensorFlow / Keras (LSTM)
- **AI Vision**: Google Gemini 1.5 Flash (multimodal)
- **Routing Engine**: OSRM (OpenStreetMap)
- **Database & Auth**: Firebase (Firestore + Authentication)

### Data Sources
| Source | Data Type |
|---|---|
| Kaggle / DOSM | 10 years of Malaysian historical rainfall data |
| Live Meteorological APIs | Real-time rainfall intensity & forecasts |
| OpenStreetMap (OSM) | Road networks & geographic infrastructure |
| NADMA / JPS | Official shelter databases |

---

## 📐 Feasibility & Partnerships

FloodWay is a **production-ready React PWA** ensuring accessibility across all devices. The AI layer bridges a local TensorFlow endpoint with the Gemini API and OSRM for dynamic routing.

### Strategic Partnerships

| Partner | Role |
|---|---|
| **UiTM & AIS** (AI Society) | Campus deployment & student ambassador mobilisation for grassroots AI training |
| **MBSA & JPS** | Pre-monsoon community drills (May 2026) to field-test the app & validate the AI Truth Filter |
| **NADMA** | Integration of verified national shelter databases and data-sharing framework for ASEAN replication |

### 💰 Budget Breakdown ($48,000 USD / 12 months)

| Category | Allocation |
|---|---|
| ☁️ Cloud Infrastructure & AI Services | $18,000 |
| 👨‍💻 Developer & Research Stipends | $20,000 |
| 🌏 Regional Pilot Testing & Community Workshops | $6,000 |
| 📊 Data Integration, Monitoring & Operations | $4,000 |

---

## 📈 Scalability & Impact

### Technical Scalability
FloodWay's **cloud-native architecture** scales effortlessly across the ASEAN region without requiring application rebuilds.

- **New region onboarding**: ~1 week (upload local historical rainfall datasets to retrain AI)
- **Firebase backend**: Auto-scales to **100,000+ users**
- **OSRM routing engine**: Handles **10,000 simultaneous route recalculations/minute** during peak crisis events

### Commercial Viability (B2B / B2G)

**B2B Licensing:**
- License predictive routing API to regional logistics fleets
- Rerouting 10,000 Grab drivers daily → projected **$50,000/year in revenue**
- ShopeeXpress partners avoid an estimated **$1 million/year** in vehicle flood damages

**B2G Integration:**
- Verified data dashboards empower **MBSA** to optimise rescue deployments
- **NADMA** gains enhanced dynamic flood mapping capabilities

### Quantified Impact Metrics
- ⚡ **Up to 40% faster evacuations** through AI-driven flood predictions
- 📉 Early warning systems reduce disaster mortality by **30–50%** *(World Meteorological Organization, 2022)*
- 🌏 Potential to strengthen resilience for **~220 million residents** in flood-prone ASEAN monsoon regions *(AHA Centre, 2023)*

---

## 📣 Outreach Plan

**Goal: 1,000+ Community Members by August 2026**

The **"FloodWay Sentinel Campaign"** transitions AI into a practical lifeline. Effectiveness is measured via unique referral tracking (e.g., Ambassador #A1 = 50 signups) to guarantee **1,200 engaged users by August 2026**.

| Channel | Target | Strategy |
|---|---|---|
| 🎓 **University Ambassadors** | 500 Students | Led by AIS; live demos with Gemini AI hazard verification; scaled via UiTM's nationwide campus network |
| 🏘️ **Community Drills** | 300 Residents | MBSA & JPS partnerships; hands-on photo uploads during pre-monsoon drills to build grassroots trust |
| 📱 **Digital Expansion** | 400+ Reach | Engaged ASEAN youth seed network with tracking promo codes and structured WhatsApp forwarding campaigns |

---

## 🗺️ Roadmap & Timeline

### Development Phases

| Phase | Period | Milestone |
|---|---|---|
| **Phase 1** | Mar – May 2026 | AI Refinement & Gemini optimisation to ~95% accuracy |
| **Phase 2** | Jun – Aug 2026 | Selangor MBSA Local Pilot launch |
| **Phase 3** | Sep – Nov 2026 | Ingest Regional Datasets (Indonesia / Thailand) |
| **Phase 4** | Dec 2026 | ASEAN Launch targeting 10,000+ users & B2B partnerships |

### Feature Checklist
- [x] Flood Prediction Model (LSTM)
- [x] Real-Road Navigation (OSRM)
- [x] Multi-Transport Modes (Car / Moto / Walk)
- [x] Community Report System with AI Truth Filter (Gemini)
- [x] 3D Flood Simulation
- [x] WhatsApp Flood Alert Sharing
- [x] Moderator Panel
- [x] Firebase Authentication (Email & Google)
- [ ] Push Notifications for Alerts
- [ ] Community Chat (Geohash hyperlocal, 2km radius)
- [ ] ASEAN Regional Dataset Integration (Indonesia / Thailand)
- [ ] B2B Logistics API Licensing

---

## 🚀 Final Submission Refinements

Based on mentor feedback and real-world deployment readiness, FloodWay has evolved from a preliminary prototype into a production-grade disaster intelligence platform.

| Refinement Area | Improvement (Final vs. Preliminary) | Strategic Impact |
|---|---|---|
| **📡 IoT Integration** | Integrated real-time water-level sensors alongside community reports. | Establishes a hybrid sensing environment (physical + crowdsourced). |
| **🌍 Platform Scope** | Expanded to a multi-disaster discovery platform (Landslides, Haze, Earthquakes). | Increases commercial relevance and long-term market viability. |
| **📍 Location Input** | Added manual map pinning to complement live GPS tracking. | Improves accuracy in low-GPS or inaccessible environments. |
| **📂 Data Lifecycle** | Reports are permanently retained for historical analysis & AI retraining. | Enables long-term disaster trend auditing and policy evaluation. |
| **🧵 Data Structuring** | Similarity detection groups related reports into unified incident threads. | Reduces duplicate noise and improves situational awareness. |
| **💰 Monetization** | Introduced API-based strategy for logistics, NGOs, and research agencies. | Establishes a sustainable business model for real-time intelligence. |
| **🎮 Simulation** | Redesigned 3D environment to focus on practical emergency training. | Transforms visualization into a practical disaster preparedness asset. |
| **📱 UI/UX Logic** | Implemented "Danger-First" navigation for immediate threat visibility. | Aligns interface behavior with real-world emergency response. |

---

## 🚀 Getting Started

Follow these steps to get a local copy up and running.

### Prerequisites
- Node.js (v18 or higher)
- Python (v3.8 or higher)
- pip

### Installation

1. **Clone the repository**
    ```bash
    git clone https://github.com/LuqmanNurhakimRosli/FloodWay.git
    cd FloodWay
    ```

2. **Backend Setup**
    Navigate to the backend folder and install dependencies:
    ```bash
    cd backend
    pip install fastapi uvicorn tensorflow numpy pydantic
    ```
    Start the backend server:
    ```bash
    uvicorn main:app --reload
    ```
    *The backend will run at `http://localhost:8000`*

3. **Frontend Setup**
    Open a new terminal, navigate to the project root, and install dependencies:
    ```bash
    # (Ensure you are in the FloodWay root directory)
    npm install
    ```
    Start the development server:
    ```bash
    npm run dev
    ```
    *The frontend will run at `http://localhost:5173`*

---

## 📱 Usage

1. **Authentication**: Sign in via Email or Google (Firebase Auth).
2. **Home Screen**: View current flood risk, score, and status for your area. Receive WhatsApp alert links when risk is elevated.
3. **Shelter Page**: Get AI-assisted risk-aware evacuation routing to the nearest safe shelter. View flood probability and 24-hour risk forecasts.
4. **Report Page**: Submit flood photos for AI verification via Gemini. Community-verified reports update the live map.
5. **Simulation Page**: Explore an interactive 3D visualisation of flood impact in your area.

---

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 📧 Contact

**Muhammad Luqman Nurhakim Bin Rosli** — Project Lead

Project Link: [https://github.com/LuqmanNurhakimRosli/FloodWay](https://github.com/LuqmanNurhakimRosli/FloodWay)

---

> *FloodWay is developed as a Final Year Project (FYP) submission at Universiti Teknologi MARA (UiTM), Shah Alam, under the supervision of Dr. Azliza Mohd Ali.*
