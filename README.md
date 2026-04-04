<p align="center">
  <img src="https://img.shields.io/badge/SENTINEL-Deepfake%20Detection-00ff88?style=for-the-badge&logo=shield&logoColor=white" alt="Sentinel Badge"/>
</p>

<h1 align="center">🛡️ Sentinel — AI-Powered Deepfake Detection Platform</h1>

<p align="center">
  <b>Decode what's real. Expose what's not.</b><br/>
  A forensic-grade deepfake detection engine built for <b>Hackverse × Ignition Hackathon</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python&logoColor=white"/>
  <img src="https://img.shields.io/badge/FastAPI-0.110+-009688?style=flat-square&logo=fastapi&logoColor=white"/>
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black"/>
  <img src="https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white"/>
  <img src="https://img.shields.io/badge/PyTorch-2.2+-EE4C2C?style=flat-square&logo=pytorch&logoColor=white"/>
  <img src="https://img.shields.io/badge/HuggingFace-Transformers-FFD21E?style=flat-square&logo=huggingface&logoColor=black"/>
</p>

---

## 👥 Team — DecodeX

| # | Member | Role |
|---|--------|------|
| 1 | **Shubham More** 
| 2 | **Krishna Jadhav** 
| 3 | **Omraj Bhingale** 
| 4 | **Pranav Kale** 

---

## 🧠 What is V-Auth?

**V-Auth** is a real-time deepfake detection platform that combines **pre-trained AI classifiers** with **multi-signal forensic heuristics** to determine whether an image or video is authentic or synthetically generated.

Unlike tools that rely on a single model prediction, V-Auth uses an **ensemble fusion engine** — blending AI model confidence with frequency-domain analysis, wavelet decomposition, facial geometry forensics, and metadata inspection — all adaptively weighted based on the input's quality tier.

---

## ✨ Key Features

### 🔍 Image Detection Engine
- **AI Classifier** — HuggingFace [`umm-maybe/AI-image-detector`](https://huggingface.co/umm-maybe/AI-image-detector) (ViT fine-tuned on AI vs Real images)
- **FFT Spectral Analysis** — Detects periodic checkerboard artifacts from GAN/Diffusion upsampling
- **Log-Polar FFT** — Converts radial artifacts into detectable linear patterns
- **Wavelet Noise (DWT)** — Identifies unnaturally smooth sub-band energy (Daubechies-2)
- **Face & Iris Forensics** — MediaPipe landmark symmetry + bilateral iris consistency
- **EXIF Metadata Scoring** — Penalizes images lacking authentic camera metadata

### 🎬 Video Detection Engine
- **SigLIP2 Vision Transformer** — HuggingFace [`prithivMLmods/Deepfake-Detect-Siglip2`](https://huggingface.co/prithivMLmods/Deepfake-Detect-Siglip2) fine-tuned on deepfake datasets
- **Keyframe Sampling** — Extracts up to 15 frames at 1 FPS via OpenCV
- **Batch Inference** — Processes frames in batches of 4 for efficiency
- **Temporal Flicker Detection** — Measures forensic signature variance across the timeline
- **Outlier-Weighted Aggregation** — High-confidence frames carry 2× weight

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
- **Authentication** — Login/signup with persistent user sessions

---

## 🏗️ Architecture

```
Ignition-Hackverse-DecodeX-/
├── backend/                        # FastAPI + Python
│   ├── main.py                     # App entry, CORS, /detect & /health routes
│   ├── requirements.txt            # Python dependencies
│   ├── detectors/
│   │   ├── image_detector.py       # 5-signal ensemble fusion engine
│   │   └── video_detector.py       # SigLIP2 batch frame analysis
│   └── utils/
│       └── result_builder.py       # Verdict, confidence & explanation builder
│
├── frontend/                       # React 19 + Vite 8
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx                 # Router with nested dashboard layout
│       ├── main.jsx
│       ├── components/
│       │   ├── DashboardLayout.jsx # Sidebar navigation + content area
│       │   └── Layout.jsx          # Base layout wrapper
│       └── pages/
│           ├── Home.jsx            # Landing page
│           ├── Login.jsx           # Authentication
│           ├── Dashboard.jsx       # Overview & stats
│           ├── Engine.jsx          # Core detection interface
│           ├── LiveStream.jsx      # Real-time forensic monitor
│           ├── Settings.jsx        # User preferences
│           └── About.jsx           # Project information
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.10+** with pip
- **Node.js 18+** with npm
- ~2 GB disk space for AI model downloads (auto-fetched on first run)

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

The server loads both AI models on startup and listens at **`http://localhost:8000`**.

> ⚡ **First run** will download ~1.5 GB of model weights from HuggingFace. Subsequent starts use cached weights.

### 3. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

Opens at **`http://localhost:5173`**.

---

## 📡 API Reference

### `GET /health`
Liveness probe — confirms the server and models are ready.

```json
{ "status": "ok", "version": "1.0.0", "model": "SigLIP2-Deepfake" }
```

### `POST /detect`
Upload an image or video for deepfake analysis.

**Request:** `multipart/form-data` with a `file` field  
**Max file size:** 200 MB  
**Supported formats:**
- **Images:** JPEG, PNG, WebP, BMP, AVIF, HEIC, TIFF, GIF
- **Videos:** MP4, MOV, AVI, WebM, MKV, OGG

**Response:**
```json
{
  "prediction": "Authentic / Real",
  "confidence": 0.8745,
  "explanation": "Media verified as authentic based on forensic signatures. ...",
  "breakdown": {
    "model_score": 0.123,
    "diffusion_score": 0.089,
    "manipulation_score": 0.045,
    "realism_score": 0.891,
    "fourier_spectral": 0.067,
    "wavelet_sig": 0.034,
    "iris_consistency": 0.012,
    "image_quality": 0.945
  },
  "media_type": "image",
  "quality_tier": "high",
  "processing_time_ms": 1247
}
```

---

## 🧪 How Detection Works

```
Input Media
    │
    ▼
┌─────────────────────────────────────┐
│         Quality Assessment          │
│  Blur · Grain · Saturation · Age   │
└────────────────┬────────────────────┘
                 │ (determines weight tier)
    ┌────────────┴────────────┐
    ▼                         ▼
┌──────────┐       ┌──────────────────┐
│ HF Model │       │ Forensic Signals │
│ (Primary)│       │  FFT · Wavelet   │
│ 55–85%   │       │  Face · EXIF     │
└────┬─────┘       └────────┬─────────┘
     │                      │
     └──────────┬───────────┘
                ▼
     ┌──────────────────┐
     │  Adaptive Fusion  │
     │  Weighted Score   │
     └────────┬─────────┘
              ▼
     ┌──────────────────┐
     │  Verdict Engine   │
     │  Label+Confidence │
     │  +Explanation     │
     └──────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|:---|:---|:---|
| **Frontend** | React 19, Vite 8, React Router 7 | SPA with monochrome forensic UI |
| **Backend** | FastAPI, Uvicorn | Async REST API with hot-reload |
| **AI Models** | HuggingFace Transformers, PyTorch | Image & video classification |
| **Computer Vision** | OpenCV, MediaPipe | Frame extraction, face mesh |
| **Signal Processing** | NumPy, SciPy, PyWavelets | FFT, DWT, spectral analysis |
| **Metadata** | Piexif, Pillow | EXIF parsing, image I/O |

---

## 📄 License

MIT License — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Built with 🧠 and ☕ by <b>Team DecodeX</b> at <b>Hackverse × Ignition 2026</b>
</p>
