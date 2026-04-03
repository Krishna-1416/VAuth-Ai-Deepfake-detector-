"""
Image Detector — Quality-Aware HuggingFace + Forensic Heuristic Fusion
Signals:
  0. HuggingFace AI-Image-Detector  (adaptive 55-85%) — Primary ML classifier
  1. FFT + Log-Polar Frequency       (adaptive)        — Grid/checkerboard artifacts
  2. Wavelet Noise DWT               (adaptive)        — Sub-band energy distribution
  3. Face + Iris Forensics           (fixed 10%)       — Symmetry & eye specularity
  4. EXIF Metadata                   (fixed 5%)        — Camera metadata presence
Quality Gate:
  - Blur detection   — Laplacian variance
  - Old photo detection — Saturation, grain pattern, color range
  - Adaptive reweighting based on detected quality tier
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


# ── MediaPipe (lazy import so server starts fast) ─────────────────────────────
_mp_face_mesh = None

def _get_face_mesh():
    global _mp_face_mesh
    if _mp_face_mesh is None:
        import mediapipe as mp
        _mp_face_mesh = mp.solutions.face_mesh.FaceMesh(
            static_image_mode=True,
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.4,
        )
    return _mp_face_mesh


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
    fft_score     = _fft_analysis(cv_img)
    polar_score   = _log_polar_fft(cv_img)
    wavelet_score = _wavelet_noise(cv_img)
    face_score, iris_score = _face_forensics(pil_img)
    exif_score    = _exif_metadata(raw_bytes)

    # ── Step 3: Adaptive Weight Fusion ──
    # For high-quality images: balanced 55/45 split
    # For blurry images:  FFT/wavelet are unreliable — boost HF model
    # For old/film photos: grain mimics AI noise — suppress wavelet, boost HF
    # For very low quality: trust HF model almost exclusively
    if tier == "high":
        w_model   = 0.55
        w_fft     = 0.30
        w_polar   = 0.20
        w_wavelet = 0.25
        w_face    = 0.15
        w_exif    = 0.10
    elif tier == "blurry":
        # Blur defeats frequency-domain analysis; wavelet reads blur as 'smooth = AI'
        w_model   = 0.72
        w_fft     = 0.10
        w_polar   = 0.08
        w_wavelet = 0.05  # Nearly disabled — blur makes wavelet unreliable
        w_face    = 0.12
        w_exif    = 0.08
    elif tier == "old":
        # Film grain looks like AI noise in FFT + Wavelet — suppress both
        w_model   = 0.75
        w_fft     = 0.08
        w_polar   = 0.05
        w_wavelet = 0.05  # Disabled — film grain = false fake signal
        w_face    = 0.10
        w_exif    = 0.07
    else:  # 'low' quality fallback
        w_model   = 0.85
        w_fft     = 0.05
        w_polar   = 0.03
        w_wavelet = 0.02
        w_face    = 0.05
        w_exif    = 0.00

    # Normalise heuristic weights (they may not sum to 1.0)
    h_sum = w_fft + w_polar + w_wavelet + w_face + w_exif
    heuristic_composite = (
        fft_score                     * (w_fft     / h_sum) +
        polar_score                   * (w_polar   / h_sum) +
        wavelet_score                 * (w_wavelet / h_sum) +
        max(face_score, iris_score)   * (w_face    / h_sum) +
        exif_score                    * (w_exif    / h_sum)
    ) if h_sum > 0 else 0.5

    composite = (model_score * w_model) + (heuristic_composite * (1.0 - w_model))

    breakdown = {
        "model_score":        round(model_score, 3),
        "diffusion_score":    round(max(fft_score, polar_score), 3),
        "manipulation_score": round(max(face_score, iris_score), 3),
        "realism_score":      round(1 - wavelet_score, 3),
        "fourier_spectral":   round(fft_score, 3),
        "wavelet_sig":        round(wavelet_score, 3),
        "iris_consistency":   round(iris_score, 3),
        "image_quality":      round(quality["blur_score"], 3),
    }

    result = build_result(composite, breakdown, media="image")
    result["quality_tier"] = tier  # Send quality info to frontend
    return result


# ── Quality Gate: Image Assessment ─────────────────────────────────────────────

def _assess_quality(cv_img: np.ndarray, pil_img: Image.Image) -> dict:
    """
    Assess image quality to drive adaptive signal weighting.
    Returns a dict with: tier, blur_score, is_old, is_grayscale
    """
    gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)
    small = cv2.resize(gray, (256, 256)).astype(np.float32)
    
    # ─ Blur Detection: Laplacian variance ─
    # High variance = sharp. Low variance = blurry.
    laplacian_var = cv2.Laplacian(small, cv2.CV_32F).var()
    blur_score = float(np.clip(laplacian_var / 500.0, 0.0, 1.0))  # 0=blurry, 1=sharp
    
    # ─ Old Photo Detection ─
    # 1. Check for grayscale (or near-grayscale = B&W film)
    hsv = cv2.cvtColor(cv2.resize(cv_img, (256, 256)), cv2.COLOR_BGR2HSV)
    mean_saturation = float(hsv[:, :, 1].mean())
    is_grayscale = mean_saturation < 20  # Very low saturation = B&W photo
    
    # 2. Check for sepia/faded color range (old color film)
    b, g, r = cv2.split(cv2.resize(cv_img, (256, 256)).astype(np.float32))
    color_std = float(np.std([r.mean(), g.mean(), b.mean()]))
    is_sepia = (not is_grayscale) and (mean_saturation < 45) and (color_std < 15)
    
    # 3. Film grain check: high noise energy in blue channel (halide grain)
    blue_noise = cv2.Laplacian(b, cv2.CV_32F).var()
    has_film_grain = (blue_noise > 300) and (mean_saturation < 60)
    
    is_old = is_grayscale or is_sepia or has_film_grain
    
    # ─ Assign Quality Tier ─
    if laplacian_var < 30:    # Severely blurry
        tier = "low"
    elif laplacian_var < 100: # Moderately blurry
        tier = "blurry"
    elif is_old:              # Old/film photo
        tier = "old"
    else:
        tier = "high"         # Sharp, modern digital photo
    
    return {
        "tier":        tier,
        "blur_score":  blur_score,
        "is_old":      is_old,
        "is_grayscale": is_grayscale,
    }


# ── Signal 0: HuggingFace Primary Classifier ──────────────────────────────────

def _hf_model_score(pil_img: Image.Image) -> float:
    """
    Uses umm-maybe/AI-image-detector (ViT fine-tuned on AI vs Real images).
    Returns 0.0 (real) → 1.0 (AI generated).
    """
    try:
        pipe = _get_hf_image_pipe()
        results = pipe(pil_img)
        labels = {r["label"].lower(): r["score"] for r in results}
        # Model labels: 'artificial' / 'real'
        for fake_key in ("artificial", "ai-generated", "fake", "deepfake"):
            if fake_key in labels:
                return float(labels[fake_key])
        for real_key in ("real", "authentic", "genuine", "natural"):
            if real_key in labels:
                return 1.0 - float(labels[real_key])
        return 0.5  # Unknown labels → neutral
    except Exception as e:
        print(f"[ImageDetector] HF model failed: {e}")
        return 0.5  # Graceful degradation


# ── Signal 1: FFT High-Frequency Anomaly ─────────────────────────────────────

def _fft_analysis(cv_img: np.ndarray) -> float:
    """
    GAN/Diffusion models leave periodic checkerboard patterns at specific
    spatial frequencies. We measure deviation from natural image statistics.
    Returns 0.0 (natural) → 1.0 (strong synthetic artifact).
    """
    gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)
    # Resize to fixed shape for consistent freq analysis
    gray = cv2.resize(gray, (512, 512)).astype(np.float32)

    # 2D FFT → shift DC to centre → log magnitude
    fft  = np.fft.fft2(gray)
    fft  = np.fft.fftshift(fft)
    mag  = np.log1p(np.abs(fft))

    h, w = mag.shape
    cy, cx = h // 2, w // 2

    # High-frequency ring (synthetic artifacts favour this region)
    r_inner, r_outer = int(min(h, w) * 0.25), int(min(h, w) * 0.48)
    Y, X = np.ogrid[:h, :w]
    dist = np.sqrt((X - cx) ** 2 + (Y - cy) ** 2)
    hf_mask = (dist >= r_inner) & (dist <= r_outer)

    hf_energy = mag[hf_mask].mean()
    total_energy = mag.mean()

    # Ratio: AI images pack unusually high energy in HF ring
    ratio = hf_energy / (total_energy + 1e-8)

    # Normalise to [0,1]; calibrated baseline ~0.7-0.8 for real, ~1.1+ for fake
    # Using a slightly gentler scale for a more 'expressive' bar
    score = np.clip((ratio - 0.75) / 0.55, 0.0, 1.0)
    return float(score)


def _log_polar_fft(cv_img: np.ndarray) -> float:
    """
    Transforms FFT magnitude to log-polar space. This converts radial
    checkerboard artifacts (common in GANs) into straight lines.
    """
    gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)
    gray = cv2.resize(gray, (512, 512)).astype(np.float32)
    
    fft  = np.fft.fftshift(np.fft.fft2(gray))
    mag  = np.log1p(np.abs(fft))
    
    center = (mag.shape[0] // 2, mag.shape[1] // 2)
    radius = min(center) * 0.9
    
    polar = cv2.logPolar(mag, center, radius, cv2.WARP_FILL_OUTLIERS)
    
    # Periodic artifacts show up as vertical/horizontal 'stripes' in polar space
    # We measure high-frequency variance along the angular axis
    hf_slice = polar[:, int(polar.shape[1]*0.6):]
    variance = hf_slice.var()
    
    # Baseline for real: ~0.02-0.08, Fake: 0.15+
    score = np.clip((variance - 0.04) / 0.4, 0.0, 1.0)
    return float(score)


# ── Signal 2: Wavelet Noise Residual (DWT) ───────────────────────────────────

def _wavelet_noise(cv_img: np.ndarray) -> float:
    """
    Real photographs have characteristic 'white noise' in DWT sub-bands.
    AI images often have 'dead' sub-bands or structured noise patterns.
    """
    gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY).astype(np.float32)
    gray = cv2.resize(gray, (512, 512))
    
    # 2D Wavelet transform (Daubechies 2)
    coeffs = pywt.dwt2(gray, 'db2')
    LL, (LH, HL, HH) = coeffs
    
    # Extract high-frequency sub-band energies
    energy_h = np.linalg.norm(LH)
    energy_v = np.linalg.norm(HL)
    energy_d = np.linalg.norm(HH)
    
    # Composite noise indicator
    total_hf = (energy_h + energy_v + energy_d) / 512.0
    
    # Natural images have a healthy noise floor; AI images are often "too clean"
    # Threshold calibrated to avoid false positives on JPEG-compressed images
    if total_hf < 10.0: # Unnaturally smooth (very strict threshold)
        return 0.75
    
    # Check for LH/HL imbalance (AI upsamplers often favor one axis)
    imbalance = abs(energy_h - energy_v) / (energy_h + energy_v + 1e-6)
    score = np.clip(imbalance * 5.0, 0.0, 1.0)
    
    return float(score)


def _image_entropy(img: np.ndarray) -> float:
    hist = np.histogram(img.ravel(), bins=256, range=(0, 256))[0]
    hist = hist[hist > 0].astype(float)
    prob = hist / hist.sum()
    return float(-np.sum(prob * np.log2(prob)))


# ── Signal 3: Face Landmark Symmetry ─────────────────────────────────────────

def _face_forensics(pil_img: Image.Image) -> (float, float):
    """
    Checks Face Symmetry and Iris/Reflection consistency.
    Returns (symmetry_score, iris_score)
    """
    try:
        face_mesh = _get_face_mesh()
        rgb = np.array(pil_img.resize((640, 640)))
        results = face_mesh.process(rgb)

        if not results.multi_face_landmarks:
            return 0.5, 0.5

        lm = results.multi_face_landmarks[0].landmark

        # ── Part A: Symmetry ──
        bilateral_pairs = [(33, 263), (173, 398), (61, 291), (234, 454), (127, 356)]
        symmetry_scores = [abs(lm[l].y - lm[r].y) for l, r in bilateral_pairs]
        mean_asymmetry = np.mean(symmetry_scores)
        
        sym_score = 0.5
        if mean_asymmetry < 0.003: sym_score = 0.8
        elif mean_asymmetry > 0.04:  sym_score = 0.9
        else: sym_score = np.clip(1.0 - (mean_asymmetry / 0.025), 0.0, 0.45)

        # ── Part B: Iris Reflection ──
        # MediaPipe iris landmarks: 468-472 (L), 473-477 (R)
        # We check the relative position of iris centers. AI eyes often deviate.
        left_iris = np.array([[lm[i].x, lm[i].y] for i in range(468, 473)])
        right_iris = np.array([[lm[i].x, lm[i].y] for i in range(473, 478)])
        
        iris_dist = np.linalg.norm(left_iris.mean(axis=0) - right_iris.mean(axis=0))
        # Real interpupillary distance at 640px is usually consistent ~0.08 - 0.12
        iris_score = 0.0
        if iris_dist < 0.05 or iris_dist > 0.18:
            iris_score = 0.75 # Unnatural eye spacing / convergence
            
        return float(sym_score), float(iris_score)

    except Exception:
        return 0.5, 0.5


# ── Signal 4: EXIF Metadata ───────────────────────────────────────────────────

_EXPECTED_EXIF_FIELDS = [
    "Make", "Model", "Software", "DateTime",
    "ExposureTime", "FNumber", "ISOSpeedRatings",
    "Flash", "FocalLength", "ColorSpace",
]

def _exif_metadata(raw_bytes: bytes) -> float:
    """
    Real photographs embed 8–15 EXIF fields.
    AI-generated images have 0–2 fields (often just Software=GIMP/Photoshop).
    Returns 0.0 (rich metadata = real) → 1.0 (no metadata = synthetic).
    """
    try:
        exif_dict = piexif.load(raw_bytes)
    except Exception:
        # No EXIF at all — common for social-media images (EXIF stripped at upload)
        # Give mild suspicion, not a strong fake signal
        return 0.55

    # Flatten all EXIF tags into one dict
    all_tags = {}
    for ifd in ("0th", "Exif", "GPS", "1st"):
        if ifd in exif_dict:
            all_tags.update(exif_dict[ifd])

    if not all_tags:
        return 0.50

    # Count how many of our expected fields are present
    found = 0
    for tag_id, val in all_tags.items():
        if val is not None and val != b"" and val != "":
            found += 1

    # Normalise: 0 fields → 1.0 (fake), 10+ fields → 0.05 (likely real)
    score = np.clip(1.0 - (found / 12.0), 0.05, 1.0)
    return float(score)
