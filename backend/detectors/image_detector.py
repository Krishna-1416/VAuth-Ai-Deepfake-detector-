"""
Image Detector — Quality-Aware HF Inference API + Forensic Heuristic Fusion
Signals:
  0. HuggingFace Inference API      (Adaptive Weight)  — Primary ML classifier
  1. FFT + Log-Polar Frequency                       — Grid/checkerboard artifacts
  2. Wavelet Noise DWT                               — Sub-band energy distribution
  3. Face + Iris Forensics                           — Symmetry & eye specularity
  4. EXIF Metadata                                   — Camera metadata presence
  5. ELA (Error Level Analysis)                      — Compression inconsistency
  6. LBP Texture Forensics                           — Micro-texture regularity
  7. Noise Residual (SRM-Lite)                       — Geometric noise fingerprints
"""

import io
import os
import time
import requests
import numpy as np
from PIL import Image
import cv2
import piexif
import logging
from urllib3.util.retry import Retry
from requests.adapters import HTTPAdapter

# Suppress noisy logs
logging.getLogger("matplotlib").setLevel(logging.WARNING)
from utils.result_builder import build_result
from utils.forensics import (
    calculate_ela, calculate_lbp, calculate_srm, calculate_fft,
    calculate_face_alignment, get_face_mesh, calculate_wavelet
)

# ── Configuration ────────────────────────────────────────────────────────────
HF_MODEL_ID = "umm-maybe/AI-image-detector"
HF_API_URL  = f"https://api-inference.huggingface.co/models/{HF_MODEL_ID}"

def _get_api_headers():
    token = os.getenv("HUGGINGFACE_API_KEY", "")
    if token:
        return {"Authorization": f"Bearer {token}"}
    return {}

# ── API Session Configuration ────────────────────────────────────────────────
_session = requests.Session()
_retries = Retry(
    total=3,
    backoff_factor=1,
    status_forcelist=[502, 503, 504],
    raise_on_status=False
)
_session.mount("https://", HTTPAdapter(max_retries=_retries))

# ── Main Entry ────────────────────────────────────────────────────────────────

def analyse_image(raw_bytes: bytes, mime: str) -> dict:
    """Quality-aware HF API + adaptive forensic heuristic fusion."""
    pil_img = Image.open(io.BytesIO(raw_bytes)).convert("RGB")
    cv_img  = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)

    # ── Step 0: Assess image quality ──
    quality = _assess_quality(cv_img, pil_img)
    tier    = quality["tier"]

    # ── Step 1: Primary HF API Classifier ──
    model_score = _hf_api_score(raw_bytes)

    # ── Step 2: Forensic Heuristics ──
    fft_score, polar_score = calculate_fft(cv_img)
    wavelet_score = calculate_wavelet(cv_img)
    face_score, iris_score, face_results = _face_forensics(pil_img)
    exif_score    = _exif_metadata(raw_bytes)
    ela_score     = calculate_ela(cv_img)
    texture_score = calculate_lbp(cv_img)
    noise_score   = calculate_srm(cv_img)
    
    face_alignment = 0.5
    if face_results and face_results.multi_face_landmarks:
        face_alignment = calculate_face_alignment(face_results.multi_face_landmarks[0].landmark)

    # ── Step 3: Adaptive Weight Fusion ──
    if tier == "high":
        w_model = 0.50
        h_weights = {"fft": 0.20, "polar": 0.15, "wave": 0.15, "face": 0.10, "exif": 0.05, "ela": 0.15, "tex": 0.10, "noise": 0.10}
    elif tier == "blurry":
        w_model = 0.70
        h_weights = {"fft": 0.05, "polar": 0.05, "wave": 0.03, "face": 0.10, "exif": 0.05, "ela": 0.02, "tex": 0.00, "noise": 0.00}
    else: # old/low
        w_model = 0.85
        h_weights = {"fft": 0.03, "polar": 0.02, "wave": 0.00, "face": 0.05, "exif": 0.00, "ela": 0.05, "tex": 0.00, "noise": 0.00}

    h_sum = sum(h_weights.values())
    heuristic_composite = (
        fft_score     * (h_weights["fft"]   / h_sum) +
        polar_score   * (h_weights["polar"] / h_sum) +
        wavelet_score * (h_weights["wave"]  / h_sum) +
        max(face_score, iris_score) * (h_weights["face"] / h_sum) +
        exif_score    * (h_weights["exif"]  / h_sum) +
        ela_score     * (h_weights["ela"]   / h_sum) +
        texture_score * (h_weights["tex"]   / h_sum) +
        noise_score   * (h_weights["noise"] / h_sum)
    ) if h_sum > 0 else 0.5

    composite = (model_score * w_model) + (heuristic_composite * (1.0 - w_model))

    breakdown = {
        "model_score":        round(model_score, 3),
        "diffusion_score":    round(max(fft_score, polar_score, noise_score), 3),
        "manipulation_score": round(max(face_score, iris_score, ela_score, face_alignment), 3),
        "realism_score":      round(1 - max(wavelet_score, texture_score), 3),
        "fourier_spectral":   round(fft_score, 3),
        "wavelet_sig":        round(wavelet_score, 3),
        "ela_score":          round(ela_score, 3),
        "texture_score":      round(texture_score, 3),
        "noise_score":        round(noise_score, 3),
        "iris_consistency":   round(iris_score, 3),
        "geometric_alignment": round(face_alignment, 3),
        "image_quality":      round(quality["blur_score"], 3),
    }

    result = build_result(composite, breakdown, media="image")
    result["quality_tier"] = tier
    return result

# ── HuggingFace Inference API ──────────────────────────────────────────────────

def _hf_api_score(data: bytes) -> float:
    """Send image to HF Inference API with resilience. Fallback to 0.5 if fails."""
    try:
        # Using Session with retries and specific timeout
        # stream=False ensures we read the whole response into memory
        response = _session.post(HF_API_URL, headers=_get_api_headers(), data=data, timeout=30, stream=False)
        
        # If model is loading, wait up to 10s or return 0.5
        if response.status_code == 503:
            print("[ImageDetector] Model loading on HF side... waiting 10s.")
            time.sleep(10)
            response = _session.post(HF_API_URL, headers=_get_api_headers(), data=data, timeout=30, stream=False)

        if response.status_code != 200:
            print(f"[ImageDetector] API Error {response.status_code}: {response.text[:200]}")
            return 0.5
        
        results = response.json()
        if not isinstance(results, list): return 0.5
        
        labels = {r["label"].lower(): r["score"] for r in results}
        for fake_key in ("artificial", "ai-generated", "fake", "deepfake"):
            if fake_key in labels: return float(labels[fake_key])
        for real_key in ("real", "authentic", "genuine", "natural"):
            if real_key in labels: return 1.0 - float(labels[real_key])
            
        return 0.5
    except requests.exceptions.ChunkedEncodingError as e:
        print(f"[ImageDetector] Connection interrupted (IncompleteRead): {e}. Falling back to 0.5.")
        return 0.5
    except Exception as e:
        print(f"[ImageDetector] API request failed: {e}")
        return 0.5


# ── Internal Helpers ──────────────────────────────────────────────────────────

def _assess_quality(cv_img: np.ndarray, pil_img: Image.Image) -> dict:
    gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)
    small = cv2.resize(gray, (256, 256)).astype(np.float32)
    laplacian_var = cv2.Laplacian(small, cv2.CV_32F).var()
    blur_score = float(np.clip(laplacian_var / 500.0, 0.0, 1.0))
    
    if laplacian_var < 30:    tier = "low"
    elif laplacian_var < 100: tier = "blurry"
    else:                     tier = "high"
    
    return {"tier": tier, "blur_score": blur_score}

def _face_forensics(pil_img: Image.Image) -> (float, float, object):
    try:
        face_mesh = get_face_mesh()
        if face_mesh is None: return 0.5, 0.5, None
        rgb = np.array(pil_img.resize((640, 640)))
        results = face_mesh.process(rgb)
        if not results or not results.multi_face_landmarks: return 0.5, 0.5, None
        
        lm = results.multi_face_landmarks[0].landmark
        bilateral_pairs = [(33, 263), (173, 398), (61, 291), (234, 454)]
        symmetry_scores = [abs(lm[l].y - lm[r].y) for l, r in bilateral_pairs]
        mean_asymmetry = np.mean(symmetry_scores)
        sym_score = np.clip(1.0 - (mean_asymmetry / 0.025), 0.0, 1.0)
        
        iris_score = 0.5 # Simplified iris for compact mode
        return float(sym_score), float(iris_score), results
    except Exception:
        return 0.5, 0.5, None

def _exif_metadata(raw_bytes: bytes) -> float:
    try:
        exif_dict = piexif.load(raw_bytes)
        tags_count = sum(len(exif_dict.get(ifd, {})) for ifd in ("0th", "Exif", "GPS", "1st"))
        if tags_count == 0: return 0.55 # Small suspicion if missing
        return float(np.clip(1.0 - (tags_count / 15.0), 0.05, 1.0))
    except Exception:
        return 0.55
