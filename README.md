<p align="center">
  <img src="https://img.shields.io/badge/SENTINEL-Deepfake%20Detection-00ff88?style=for-the-badge&logo=shield&logoColor=white" alt="Sentinel Badge"/>
  <img src="https://img.shields.io/badge/Gemma%204%20Good-Submitted-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Gemma 4 Good Badge"/>
</p>

<h1 align="center">🛡️ V-Auth — AI-Powered Deepfake Detection Platform</h1>

<p align="center">
  <b>Decode what's real. Expose what's not.</b><br/>
  A forensic-grade deepfake detection engine powered by <b>Gemma 4 26B</b> — built for <b>Gemma 4 Good Hackathon</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python&logoColor=white"/>
  <img src="https://img.shields.io/badge/FastAPI-0.110+-009688?style=flat-square&logo=fastapi&logoColor=white"/>
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black"/>
  <img src="https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white"/>
  <img src="https://img.shields.io/badge/Gemma%204-26B-4285F4?style=flat-square&logo=google&logoColor=white"/>
  <img src="https://img.shields.io/badge/LangGraph-0.3-FFD21E?style=flat-square"/>
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white"/>
  <img src="https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white"/>
  <img src="https://img.shields.io/badge/Render-46E3B7?style=flat-square&logo=render&logoColor=white"/>
</p>

---

## 🧠 What is V-Auth?

**V-Auth** is a real-time deepfake detection platform powered by **Gemma 4 26B (Multimodal MoE)**. It combines Gemma 4's native vision reasoning with multi-signal forensic heuristics (FFT, Wavelet, ELA, LBP, SRM, face geometry) to determine whether an image or video is authentic or synthetically generated.

Unlike black-box detectors, V-Auth uses a **Gemma 4-centric ensemble architecture**: forensic signals are extracted mathematically, but the final verdict and explanation come from Gemma 4's multimodal reasoning — producing transparent, explainable results. A LangGraph multi-agent workflow orchestrates CV engines, a Gemma 4 Visual Analyst, and a RAG-based Fact-Checker.

---

## ✨ Key Features

### 🔍 Image Detection Engine
- **Gemma 4 26B Multimodal Reasoning** — `google.gemini` SDK calls `gemma-4-26b-a4b-it` with image + heuristic context for structured forensic verdict
- **FFT Spectral Analysis** — Detects periodic checkerboard artifacts from GAN/Diffusion upsampling
- **Log-Polar FFT** — Converts radial artifacts into detectable linear patterns
- **Wavelet Noise (DWT)** — Identifies unnaturally smooth sub-band energy (Daubechies-2)
- **Error Level Analysis (ELA)** — Detects local compression inconsistencies
- **LBP Texture Forensics** — Measures micro-texture regularity in synthetic skin/surfaces
- **SRM Noise Residuals** — Geometric noise fingerprint analysis
- **Face & Iris Forensics** — MediaPipe landmark symmetry + bilateral iris consistency
- **EXIF Metadata Scoring** — Penalizes images lacking authentic camera metadata

### 🎬 Video Detection Engine
- **Gemma 4 26B Temporal Analysis** — Same model as image; analyzes multi-frame storyboard for temporal consistency
- **Keyframe Sampling** — Extracts up to 8 frames at 1 FPS via OpenCV for storyboard construction
- **Per-Frame Heuristics** — FFT, ELA, LBP, SRM, Wavelet, and face alignment extracted per frame
- **Gemma 4 Storyboard Fusion** — Frames composited into a grid; Gemma 4 evaluates cross-frame flicker, texture drift, and lip-sync consistency
- **Temporal Flicker Detection** — Measures forensic signature variance across the timeline as additional signal

### 🧬 Quality-Aware Adaptive Fusion
The engine automatically detects image quality tiers and rebalances signal weights:

| Quality Tier | AI Model Weight | Heuristic Weight | Rationale |
|:---|:---:|:---:|:---|
| **High** (sharp, modern) | 55% | 45% | Balanced — all signals reliable |
| **Blurry** | 72% | 28% | Frequency analysis unreliable on blur |
| **Old / Film** | 75% | 25% | Film grain mimics AI noise patterns |
| **Low Quality** | 85% | 15% | Trust the model almost exclusively |

### 🖥️ Frontend Dashboard
- **Landing Page** — Monochrome-themed with animated hero section
- **Detection Engine** — Drag-and-drop upload for images & videos with real-time analysis
- **Dashboard Overview** — Scan history and aggregate statistics
- **Live Stream Monitor** — Real-time forensic feed with manual start/stop controls
- **Settings Panel** — User preferences and configuration
- **Authentication** — Supabase-powered authentication with persistent user sessions, forgot password & reset functionality

---

## 🏗️ Architecture

```mermaid
%%{init: {'flowchart': {'nodeSpacing': 60, 'rankSpacing': 60}}}%%
graph TB

    subgraph Frontend["🌐 Frontend (React 19 + Vite 8)"]
        UI["Engine.jsx — Drag-and-drop detection"]
        WS["LiveStream.jsx — WebSocket real-time feed"]
        AUTH["Login.jsx — Supabase Auth"]
    end

    subgraph Backend["⚡ Backend (FastAPI)"]
        API["main.py — REST + SSE + WebSocket"]
        ORCH["orchestrator.py — LangGraph multi-agent DAG"]
        VA["visual_analyst.py — Gemma 4 26B reasoning"]
        FC["fact_checker.py — RAG forensic context retrieval"]
        ID["image_detector.py — Heuristics + Gemma 4 fusion"]
        VD["video_detector.py — Storyboard + Gemma 4 analysis"]
        FW["forensics.py — FFT · Wavelet · ELA · LBP · SRM"]
        RB["result_builder.py — Verdict assembly"]
    end

    subgraph External["☁️ External Services"]
        GEMMA["Google AI — Gemma 4 26B (MoE)"]
        SUPABASE["Supabase — Auth + pgvector RAG"]
    end

    UI --> API
    WS --> API
    AUTH --> SUPABASE

    API --> ORCH

    ORCH --> ID
    ORCH --> VD
    ORCH --> VA
    ORCH --> FC

    ID --> FW
    VD --> FW

    ID --> GEMMA
    VD --> GEMMA
    VA --> GEMMA

    FC --> SUPABASE

    ID --> RB
    VD --> RB
```

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.10+** with pip
- **Node.js 18+** with npm
- **Google AI API key** — set as `GOOGLE_API_KEY` in `.env`

### 1. Clone the repository

```bash
git clone https://github.com/Krishna-1416/Ignition-Hackverse-DecodeX-.git
cd Ignition-Hackverse-DecodeX-
```

### 2. Start the Backend

```bash
cd backend
pip install -r requirements.txt
python main.py
```

The server initializes the Gemma 4 forensic engine and listens at **`http://localhost:8000`**.

> ⚡ **Requires a `GOOGLE_API_KEY`** in your `.env` file (Gemma 4 is accessed via Google AI Studio API). No local model weights needed.

### 3. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

Opens at **`http://localhost:5173`**.

### ☁️ Deployment Guides

- **Backend (Render):** A `render.yaml` configuration is included to seamlessly deploy the FastAPI service on Render as a Web Service.
- **Frontend (Vercel):** The included `vercel.json` and React router setup directly map to Vercel's SPA routing. Run `python setup_vercel.py` or import the project directory to automatically deploy.

---

## 📡 API Reference

### `GET /health`
Liveness probe — confirms the server and models are ready.

```json
{ "status": "healthy", "timestamp": 1717000000.0 }
```

### `POST /analyze`
Upload an image or video for deepfake analysis. Returns a `task_id` for polling via SSE.

**Request:** `multipart/form-data` with a `file` field (optional `query` text)  
**Max file size:** 100 MB  
**Supported formats:**
- **Images:** JPEG, PNG, WebP, BMP
- **Videos:** MP4, MOV, WebM

**Response (SSE stream at `/events/{task_id}`):**
```json
{
  "status": "Complete",
  "result": {
    "prediction": "Authentic / Real",
    "confidence": 0.8745,
    "explanation": "Gemma 4 forensic report explaining the verdict...",
    "breakdown": {
      "model_score": 0.123,
      "diffusion_score": 0.089,
      "manipulation_score": 0.045,
      "realism_score": 0.891,
      "fourier_spectral": 0.067,
      "ela_score": 0.032,
      "texture_score": 0.021,
      "noise_score": 0.045,
      "wavelet_sig": 0.034,
      "iris_consistency": 0.012,
      "geometric_alignment": 0.023,
      "image_quality": 0.945
    }
  }
}
```

---

## 🧪 How Detection Works

```mermaid
flowchart TD
    INPUT["Input Media<br/>Image or Video"] --> QUALITY["Quality Assessment<br/>Blur · Grain · Saturation · Age"]
    QUALITY --> TIER{"Quality Tier"}
    TIER -->|High / Sharp| W1[Weight: 55% AI · 45% Heuristics]
    TIER -->|Blurry| W2[Weight: 72% AI · 28% Heuristics]
    TIER -->|Old / Film| W3[Weight: 75% AI · 25% Heuristics]
    TIER -->|Low Quality| W4[Weight: 85% AI · 15% Heuristics]

    W1 & W2 & W3 & W4 --> PARALLEL

    subgraph PARALLEL["Parallel Analysis"]
        HEURISTICS["Forensic Signals<br/>FFT · Log-Polar FFT<br/>Wavelet DWT · ELA<br/>LBP Texture · SRM Noise<br/>Face Symmetry · EXIF"]
        GEMMA_VISION["Gemma 4 26B Vision<br/>Multimodal MoE<br/>Pixel-level artifact detection<br/>GAN/diffusion fingerprints"]
    end

    HEURISTICS --> FUSION
    GEMMA_VISION --> FUSION

    FUSION["Gemma 4 Reasoning Engine<br/>Cross-references heuristics + visual analysis<br/>Outputs structured JSON verdict"] --> VERDICT["Verdict Engine<br/>Label · Confidence Score<br/>Explainable Forensic Report"]
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|:---|:---|:---|
| **Multimodal AI** | Gemma 4 26B (`google-genai` SDK) | Native vision + heuristic fusion forensic reasoning |
| **Agent Orchestration** | LangGraph | Multi-agent DAG: CV → Visual Analyst → Synthesis |
| **RAG / Knowledge Base** | Supabase pgvector + `google-embedding-2` | Forensic knowledge retrieval |
| **Frontend** | React 19, Vite 8, React Router 7 | SPA with monochrome forensic UI |
| **Backend** | FastAPI, Uvicorn | Async REST API with SSE streaming |
| **Computer Vision** | OpenCV, MediaPipe | Frame extraction, face mesh landmarking |
| **Signal Processing** | NumPy, SciPy, PyWavelets | FFT, DWT, spectral analysis |
| **Metadata** | Piexif, Pillow | EXIF parsing, image I/O |
| **Authentication** | Supabase API | Secured persistent user accounts, session handling |
| **Deployment** | Vercel, Render | Frontend CDN + Serverless Backend hosting |

---

## 📄 License

MIT License — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Built with 🧠 and ☕ by <b>Team DecodeX</b> for <b>Gemma 4 Good Hackathon 2026</b>
</p>
