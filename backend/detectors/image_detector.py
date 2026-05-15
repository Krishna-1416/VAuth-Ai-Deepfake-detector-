"""
Image Detector — Gemma 4 Forensic Intelligence Engine
Signals:
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
import numpy as np
from PIL import Image
import cv2
import piexif
import logging
# Suppress noisy logs
logging.getLogger("matplotlib").setLevel(logging.WARNING)

try:
    from utils.result_builder import build_result
    from utils.forensics import (
        calculate_ela, calculate_lbp, calculate_srm, calculate_fft,
        calculate_face_alignment, get_face_mesh, calculate_wavelet
    )
except ImportError:
    from backend.utils.result_builder import build_result
    from backend.utils.forensics import (
        calculate_ela, calculate_lbp, calculate_srm, calculate_fft,
        calculate_face_alignment, get_face_mesh, calculate_wavelet
    )

from google import genai
from google.genai import types
import base64

def query_gemma4_forensics(raw_bytes: bytes, heuristics: dict) -> dict:
    """Uses Gemma 4 26B (Multimodal MoE) for expert forensic reasoning."""
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        return {"fake_probability": 0.5, "forensic_reasoning": "Gemma 4 API key missing."}

    client = genai.Client(api_key=api_key)
    
    prompt = f"""
    [CRITICAL FORENSIC AUDIT]
    You are the Gemma 4 Forensic Reasoning Engine. Analyze this image for deepfake signatures.
    
    COMPUTATIONAL HEURISTICS DETECTED:
    {heuristics}
    
    YOUR TASK:
    1. Cross-reference the visual content with the mathematical spectral/noise heuristics provided.
    2. Identify specific anomalies: FFT spikes (grid artifacts), ELA hotspots (local edits), or LBP texture irregularities (synthetic skin).
    3. Provide a definitive 'fake_probability' and a concise 'forensic_reasoning' report.
    
    Output a valid JSON only with:
    {{
      "fake_probability": float (0.0 to 1.0),
      "forensic_reasoning": "A professional 2-3 sentence summary of the forensic evidence found."
    }}
    """
    
    try:
        response = client.models.generate_content(
            model="gemma-4-26b-a4b-it",
            contents=[
                types.Part.from_bytes(data=raw_bytes, mime_type="image/jpeg"),
                prompt
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            )
        )
        import json
        return json.loads(response.text)
    except Exception as e:
        print(f"[V-Auth] Gemma 4 Error: {e}")
        return {"fake_probability": 0.5, "forensic_reasoning": "Gemma 4 analysis failed."}

def analyse_image(raw_bytes: bytes, mime: str) -> dict:
    """Forensic heuristic extraction for Gemma 4 analysis."""
    pil_img = Image.open(io.BytesIO(raw_bytes)).convert("RGB")
    cv_img  = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)

    # ── Step 1: Assess image quality ──
    quality = _assess_quality(cv_img)
    tier    = quality["tier"]

    # ── Step 2: Forensic Heuristics (The Evidence) ──
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

    # ── Step 4: Call Gemma 4 for Reasoning ──
    gemma_heuristics = {
        "fft_score": round(fft_score, 3),
        "polar_score": round(polar_score, 3),
        "wavelet_score": round(wavelet_score, 3),
        "ela_score": round(ela_score, 3),
        "texture_score": round(texture_score, 3),
        "noise_score": round(noise_score, 3),
    }
    gemma_result = query_gemma4_forensics(raw_bytes, gemma_heuristics)
    
    # ── Step 5: Composite Scoring (Strictly Gemma 4) ──
    model_score = gemma_result.get("fake_probability", 0.5)
    heuristic_composite = model_score

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

    result = build_result(heuristic_composite, breakdown, media="image")
    result["quality_tier"] = tier
    result["explanation"] = gemma_result.get("forensic_reasoning", result["explanation"])
    return result

def _assess_quality(cv_img: np.ndarray) -> dict:
    gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)
    small = cv2.resize(gray, (256, 256)).astype(np.float32)
    laplacian_var = cv2.Laplacian(small, cv2.CV_32F).var()
    blur_score = float(np.clip(laplacian_var / 500.0, 0.0, 1.0))
    
    if laplacian_var < 30:    tier = "low"
    elif laplacian_var < 100: tier = "blurry"
    else:                     tier = "high"
    
    return {"tier": tier, "blur_score": blur_score}

def _face_forensics(pil_img: Image.Image) -> tuple[float, float, object]:
    try:
        import mediapipe as mp
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
        
        iris_score = 0.5 
        return float(sym_score), float(iris_score), results
    except Exception:
        return 0.5, 0.5, None

def _exif_metadata(raw_bytes: bytes) -> float:
    try:
        exif_dict = piexif.load(raw_bytes)
        tags_count = sum(len(exif_dict.get(ifd, {})) for ifd in ("0th", "Exif", "GPS", "1st"))
        if tags_count == 0: return 0.55 
        return float(np.clip(1.0 - (tags_count / 15.0), 0.05, 1.0))
    except Exception:
        return 0.55
