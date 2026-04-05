"""
Image Detector — Quality-Aware HuggingFace + Forensic Heuristic Fusion
Signals:
  0. HuggingFace AI-Image-Detector  (adaptive 35-85%) — Primary ML classifier
  1. FFT + Log-Polar Frequency                       — Grid/checkerboard artifacts
  2. Wavelet Noise DWT                               — Sub-band energy distribution
  3. Face + Iris Forensics                           — Symmetry & eye specularity
  4. EXIF Metadata                                   — Camera metadata presence
  5. ELA (Error Level Analysis)                      — Compression inconsistency
  6. LBP Texture Forensics                           — Micro-texture regularity
  7. Noise Residual (SRM-Lite)                       — Geometric noise fingerprints
"""

import io
import math
import struct
import numpy as np
from PIL import Image
import cv2
import piexif
import pywt
from utils.result_builder import build_result
from utils.forensics import (
    calculate_ela, calculate_lbp, calculate_srm, calculate_fft,
    calculate_face_alignment, get_face_mesh, calculate_wavelet
)

# ── HuggingFace Image Classifier (lazy load, cached globally) ────────────────
_hf_image_pipe = None
HF_IMAGE_MODEL  = "umm-maybe/AI-image-detector"

def _get_hf_image_pipe():
    global _hf_image_pipe
    if _hf_image_pipe is None:
        import torch
        from transformers import pipeline
        device = 0 if torch.cuda.is_available() else -1
        device_label = "GPU" if device == 0 else "CPU"
        print(f"[ImageDetector] Loading {HF_IMAGE_MODEL} on {device_label}…")
        _hf_image_pipe = pipeline(
            "image-classification",
            model=HF_IMAGE_MODEL,
            device=device,
        )
        print(f"[ImageDetector] HF model loaded ✓")
    return _hf_image_pipe


# ── MediaPipe (Moved to utils.forensics) ─────────────────────────────
# ── Main entry ────────────────────────────────────────────────────────────────

def analyse_image(raw_bytes: bytes, mime: str) -> dict:
    """Quality-aware HF model + adaptive forensic heuristic fusion."""
    pil_img = Image.open(io.BytesIO(raw_bytes)).convert("RGB")
    cv_img  = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)

    # ── Step 0: Assess image quality (drives weight adaptation) ──
    quality = _assess_quality(cv_img, pil_img)
    tier    = quality["tier"]  # 'high' | 'blurry' | 'old' | 'low'

    # ── Step 1: Primary HF Classifier ──
    model_score = _hf_model_score(pil_img)

    # ── Step 2: Forensic Heuristics ──
    fft_score, polar_score = calculate_fft(cv_img)
    wavelet_score = calculate_wavelet(cv_img)
    face_score, iris_score, face_results = _face_forensics(pil_img)
    exif_score    = _exif_metadata(raw_bytes)
    
    # New Signals
    ela_score     = calculate_ela(cv_img)
    texture_score = calculate_lbp(cv_img)
    noise_score   = calculate_srm(cv_img)
    
    # Advanced Misalignment Check
    face_alignment = 0.5
    if face_results and face_results.multi_face_landmarks:
        face_alignment = calculate_face_alignment(face_results.multi_face_landmarks[0].landmark)

    # ── Step 3: Adaptive Weight Fusion ──
    if tier == "high":
        w_model   = 0.50  # Balanced
        w_fft     = 0.20
        w_polar   = 0.15
        w_wavelet = 0.15
        w_face    = 0.10
        w_exif    = 0.05
        w_ela     = 0.15
        w_texture = 0.10
        w_noise   = 0.10
    elif tier == "blurry":
        w_model   = 0.70
        w_fft     = 0.05
        w_polar   = 0.05
        w_wavelet = 0.03
        w_face    = 0.10
        w_exif    = 0.05
        w_ela     = 0.02
        w_texture = 0.00
        w_noise   = 0.00
    elif tier == "old":
        w_model   = 0.75
        w_fft     = 0.05
        w_polar   = 0.05
        w_wavelet = 0.03
        w_face    = 0.05
        w_exif    = 0.05
        w_ela     = 0.02
        w_texture = 0.00
        w_noise   = 0.00
    else:  # 'low'
        w_model   = 0.85
        w_fft     = 0.03
        w_polar   = 0.02
        w_wavelet = 0.00
        w_face    = 0.05
        w_exif    = 0.00
        w_ela     = 0.05
        w_texture = 0.00
        w_noise   = 0.00

    # Normalise heuristic weights
    h_sum = w_fft + w_polar + w_wavelet + w_face + w_exif + w_ela + w_texture + w_noise
    heuristic_composite = (
        fft_score                     * (w_fft     / h_sum) +
        polar_score                   * (w_polar   / h_sum) +
        wavelet_score                 * (w_wavelet / h_sum) +
        max(face_score, iris_score)   * (w_face    / h_sum) +
        exif_score                    * (w_exif    / h_sum) +
        ela_score                     * (w_ela     / h_sum) +
        texture_score                 * (w_texture / h_sum) +
        noise_score                   * (w_noise   / h_sum)
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


# ── Quality Gate: Image Assessment ─────────────────────────────────────────────

def _assess_quality(cv_img: np.ndarray, pil_img: Image.Image) -> dict:
    gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)
    small = cv2.resize(gray, (256, 256)).astype(np.float32)
    laplacian_var = cv2.Laplacian(small, cv2.CV_32F).var()
    blur_score = float(np.clip(laplacian_var / 500.0, 0.0, 1.0))
    
    hsv = cv2.cvtColor(cv2.resize(cv_img, (256, 256)), cv2.COLOR_BGR2HSV)
    mean_saturation = float(hsv[:, :, 1].mean())
    is_grayscale = mean_saturation < 20
    
    b, g, r = cv2.split(cv2.resize(cv_img, (256, 256)).astype(np.float32))
    color_std = float(np.std([r.mean(), g.mean(), b.mean()]))
    is_sepia = (not is_grayscale) and (mean_saturation < 45) and (color_std < 15)
    
    blue_noise = cv2.Laplacian(b, cv2.CV_32F).var()
    has_film_grain = (blue_noise > 300) and (mean_saturation < 60)
    
    is_old = is_grayscale or is_sepia or has_film_grain
    
    if laplacian_var < 30:    tier = "low"
    elif laplacian_var < 100: tier = "blurry"
    elif is_old:              tier = "old"
    else:                     tier = "high"
    
    return {
        "tier": tier,
        "blur_score": blur_score,
        "is_old": is_old,
        "is_grayscale": is_grayscale
    }


# ── Signal 0: HuggingFace Primary Classifier ──────────────────────────────────

def _hf_model_score(pil_img: Image.Image) -> float:
    try:
        pipe = _get_hf_image_pipe()
        results = pipe(pil_img)
        labels = {r["label"].lower(): r["score"] for r in results}
        for fake_key in ("artificial", "ai-generated", "fake", "deepfake"):
            if fake_key in labels: return float(labels[fake_key])
        for real_key in ("real", "authentic", "genuine", "natural"):
            if real_key in labels: return 1.0 - float(labels[real_key])
        return 0.5
    except Exception as e:
        print(f"[ImageDetector] HF model failed: {e}")
        return 0.5

# ── Signal 1 & 2: Frequency & Wavelet (Moved to utils.forensics) ──────────────

# ── Signal 3: Face Landmark Symmetry ─────────────────────────────────────────

def _face_forensics(pil_img: Image.Image) -> (float, float, object):
    try:
        face_mesh = get_face_mesh()
        if face_mesh is None:
            return 0.5, 0.5, None
        rgb = np.array(pil_img.resize((640, 640)))
        results = face_mesh.process(rgb)
        if not results or not results.multi_face_landmarks: return 0.5, 0.5, None
        lm = results.multi_face_landmarks[0].landmark
        bilateral_pairs = [(33, 263), (173, 398), (61, 291), (234, 454), (127, 356)]
        symmetry_scores = [abs(lm[l].y - lm[r].y) for l, r in bilateral_pairs]
        mean_asymmetry = np.mean(symmetry_scores)
        sym_score = 0.5
        if mean_asymmetry < 0.003: sym_score = 0.8
        elif mean_asymmetry > 0.04:  sym_score = 0.9
        else: sym_score = np.clip(1.0 - (mean_asymmetry / 0.025), 0.0, 0.45)
        left_iris = np.array([[lm[i].x, lm[i].y] for i in range(468, 473)])
        right_iris = np.array([[lm[i].x, lm[i].y] for i in range(473, 478)])
        iris_dist = np.linalg.norm(left_iris.mean(axis=0) - right_iris.mean(axis=0))
        iris_score = 0.0
        if iris_dist < 0.05 or iris_dist > 0.18: iris_score = 0.75
        return float(sym_score), float(iris_score), results
    except Exception:
        return 0.5, 0.5, None


# ── Signal 4: EXIF Metadata ───────────────────────────────────────────────────

def _exif_metadata(raw_bytes: bytes) -> float:
    try:
        exif_dict = piexif.load(raw_bytes)
    except Exception:
        return 0.55
    all_tags = {}
    for ifd in ("0th", "Exif", "GPS", "1st"):
        if ifd in exif_dict: all_tags.update(exif_dict[ifd])
    if not all_tags: return 0.50
    found = sum(1 for v in all_tags.values() if v not in (None, b"", ""))
    score = np.clip(1.0 - (found / 12.0), 0.05, 1.0)
    return float(score)



# ── Signal 5, 6, 7: ELA, LBP, SRM (Moved to utils.forensics) ──────────────────
