# AI-Based Deepfake Detection System (PS0201)
**Hackverse DecodeX | Sponsored by Vulnuris**

A full-stack web prototype that analyzes images, audio, and video for deepfake authenticity — returning a decision, confidence score, and explanation with reasoning.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│          Frontend (HTML/CSS/JS)                  │
│  - Drag-and-drop media upload                    │
│  - Real-time analysis progress                   │
│  - Confidence meter + explanation card           │
└────────────────┬────────────────────────────────┘
                 │ REST API (multipart upload)
┌────────────────▼────────────────────────────────┐
│         FastAPI Backend (Python)                 │
│  ┌──────────┬──────────────┬──────────────┐     │
│  │  Image   │   Audio      │   Video      │     │
│  │ Detector │  Detector    │  Detector    │     │
│  └──────────┴──────────────┴──────────────┘     │
│       Multi-signal fusion → Final Decision       │
└─────────────────────────────────────────────────┘
```

---

## Detection Strategy (What actually runs)

### 🖼️ Image Detection (multi-signal fusion)
| Signal | Method | Weight |
|--------|---------|--------|
| Frequency artifacts | FFT/DCT anomaly analysis (GAN leave high-freq fingerprints) | 35% |
| Noise pattern | Pixel-level noise residual analysis (Laplacian filter) | 25% |
| Face mesh consistency | MediaPipe face landmarks — asymmetry/blinking artifacts | 25% |
| EXIF metadata | Missing/inconsistent camera metadata common in AI images | 15% |

### 🔊 Audio Detection (multi-signal fusion)
| Signal | Method | Weight |
|--------|---------|--------|
| Mel-spectrogram irregularities | Librosa spectral analysis — detect vocoder artifacts | 40% |
| Formant consistency | F1/F2/F3 formant tracking — AI speech has flat formants | 30% |
| Silence/breath patterns | Natural speech has irregular pauses; TTS is too clean | 30% |

### 🎬 Video Detection
- Extract keyframes (every 1s) using OpenCV
- Run image detector on each frame
- Apply temporal consistency analysis (inter-frame delta)
- Aggregate results with weighted voting

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla HTML5 + CSS3 + JS (glassmorphism dark UI) |
| Backend API | Python 3.11 + FastAPI |
| Image ML | OpenCV, NumPy, Pillow, SciPy (FFT), MediaPipe |
| Audio ML | Librosa, Parselmouth (Praat formants), NumPy |
| Video ML | OpenCV (frame extraction) + Image pipeline |
| Server | Uvicorn (dev), supports Render/Railway deploy |

> **Why no large pre-trained model?** Hackathon constraint — we use multi-signal heuristic fusion which is explainable, fast (<3s), and runs without GPU. The confidence scores are derived from real signal deviations, making it transparent and demo-ready.

---

## Project File Structure

```
Ignition (Hackverse)/
├── backend/
│   ├── main.py                  # FastAPI app + CORS + endpoints
│   ├── detectors/
│   │   ├── __init__.py
│   │   ├── image_detector.py    # Image analysis pipeline
│   │   ├── audio_detector.py    # Audio analysis pipeline
│   │   └── video_detector.py    # Video frame pipeline
│   ├── utils/
│   │   ├── __init__.py
│   │   └── result_builder.py    # Score fusion + explanation generator
│   └── requirements.txt
├── frontend/
│   ├── index.html               # Main SPA
│   ├── style.css                # Dark glassmorphism theme
│   └── app.js                   # Upload handler + results UI
└── README.md                    # Updated with setup instructions
```

---

## Proposed Changes

### Backend

#### [NEW] `backend/requirements.txt`
FastAPI, uvicorn, python-multipart, opencv-python-headless, librosa, Pillow, numpy, scipy, mediapipe, praat-parselmouth

#### [NEW] `backend/main.py`
- `POST /api/detect` — accepts multipart file upload, routes by MIME type, returns JSON result
- `GET /api/health` — health check

#### [NEW] `backend/detectors/image_detector.py`
- FFT frequency analysis
- Laplacian noise residual
- MediaPipe face landmark consistency
- EXIF metadata inspection
- Weighted score fusion

#### [NEW] `backend/detectors/audio_detector.py`
- Librosa mel-spectrogram analysis
- Spectral centroid/rolloff variance
- Silence gap pattern analysis
- Formant tracking via parselmouth

#### [NEW] `backend/detectors/video_detector.py`
- OpenCV frame extraction
- Temporal consistency scoring
- Per-frame image detection

#### [NEW] `backend/utils/result_builder.py`
- Confidence score normalization (0-100%)
- Decision threshold (>55% = FAKE)
- Natural language explanation generator

---

### Frontend

#### [MODIFY] `README.md`
Update with full setup/run instructions

#### [NEW] `frontend/index.html`
- Hero section with animated logo
- Drag-and-drop upload zone (image/audio/video)
- Live file preview
- Animated progress ring during analysis
- Results card: verdict badge + confidence meter + explanation bullets

#### [NEW] `frontend/style.css`
- Dark mode with deep purple/teal gradient palette
- Glassmorphism panels with backdrop-filter blur
- Animated shimmer on upload zone
- Smooth CSS transitions on result reveal
- Responsive mobile layout

#### [NEW] `frontend/app.js`
- Drag-and-drop + click-to-browse upload
- File type validation (image/audio/video)
- Animated analysis progress (with fake intermediate steps for UX)
- Fetch POST to `/api/detect`
- Dynamic result rendering with verdict color coding

---

## Verification Plan

### Automated
- Start backend: `uvicorn main:app --reload`
- Upload a real photo → expect REAL with high confidence
- Upload an obvious AI image → expect FAKE with high confidence

### Hackathon Demo Flow
1. Upload a real selfie → **REAL** (green badge)
2. Upload a known AI-generated face (e.g., thispersondoesnotexist.com screenshot) → **FAKE** (red badge)
3. Upload a synthetic voice audio clip → **FAKE**
4. Upload a real voice recording → **REAL**

---

## Open Questions

> [!IMPORTANT]
> **Do you want a local-only prototype or deployable to cloud?** I'll add a `render.yaml` / `railway.json` if you want one-click deploy for the hackathon demo.

> [!NOTE]
> **Video analysis** will be slower (~5–15s depending on length). Should I add a max duration cap (e.g., 30s clips) for the hackathon demo to keep it snappy?

> [!TIP]
> Want me to add a **sample media panel** with pre-loaded test files (real vs fake) for judges to click and test instantly without uploading anything?
