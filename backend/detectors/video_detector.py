"""
Video Detector — Framework-Less HF Inference API
Model: prithivMLmods/Deepfake-Detect-Siglip2
  - Frames extracted with OpenCV (1fps, max 10 frames)
  - Per-frame HF Inference API call (No local GPU/CPU model needed)
  - Batch performance through sequential API calls
"""

import io
import os
import time
import requests
import numpy as np
import cv2
from PIL import Image
from utils.result_builder import build_result
from utils.forensics import (
    calculate_ela, calculate_lbp, calculate_srm, calculate_fft,
    calculate_face_alignment, get_face_mesh, calculate_wavelet
)

# ── Configuration ────────────────────────────────────────────────────────────
MODEL_ID = "prithivMLmods/Deepfake-Detect-Siglip2"
API_URL  = f"https://api-inference.huggingface.co/models/{MODEL_ID}"
MAX_FRAMES     = 8           # Reduced for fast API turnaround
FRAME_INTERVAL = 1.0
INPUT_SIZE     = 384
OUTLIER_WEIGHT = 2.0

def load_video_model():
    """Stub for backwards compatibility in main.py lifespan."""
    print("[VideoDetector] Runtime configured for HF-Inference-API (Serverless).")

def _get_api_headers():
    token = os.getenv("HUGGINGFACE_API_KEY", "")
    if token:
        return {"Authorization": f"Bearer {token}"}
    return {}

# ── Main Entry ────────────────────────────────────────────────────────────────

def analyse_video(video_path: str) -> dict:
    """Extract frames and send to HF Inference API with forensic aggregation."""
    # 1. Extract frames
    frames_pil = _extract_frames(video_path)
    if not frames_pil:
        return _fallback_result("Could not extract frames from video.")

    print(f"[VideoDetector] Sampling {len(frames_pil)} frames for cloud inference...")
    
    # 2. Sequential Inference (Hugging Face API)
    fake_probs = []
    forensic_data = []
    face_mesh = get_face_mesh()
    
    api_headers = _get_api_headers()

    for idx, pil_img in enumerate(frames_pil):
        # — ML Inference (API)
        buf = io.BytesIO()
        pil_img.save(buf, format="JPEG", quality=85)
        img_bytes = buf.getvalue()
        
        prob = _query_api(img_bytes, api_headers)
        fake_probs.append(prob)
        
        # — Local Forensic Heuristics
        cv_frame = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
        alignment = 0.5
        if face_mesh:
            try:
                res = face_mesh.process(np.array(pil_img))
                if res and res.multi_face_landmarks:
                    alignment = calculate_face_alignment(res.multi_face_landmarks[0].landmark)
            except Exception: pass
            
        forensic_data.append({
            "ela": calculate_ela(cv_frame),
            "lbp": calculate_lbp(cv_frame),
            "srm": calculate_srm(cv_frame),
            "wavelet": calculate_wavelet(cv_frame),
            "fft": calculate_fft(cv_frame)[0],
            "alignment": alignment
        })
        
        print(f"  frame {idx+1}/{len(frames_pil)} → P(Fake): {prob:.3f}")

    # 3. Weighted Aggregation
    composite, flicker, forensic_means = _weighted_aggregate(fake_probs, forensic_data)

    breakdown = {
        "diffusion_score":    round(max(composite, forensic_means["srm"]), 3),
        "manipulation_score": round(max(composite * 0.9, flicker, forensic_means["alignment"]), 3),
        "realism_score":      round(1.0 - composite, 3),
        "fourier_spectral":   round(forensic_means["fft"], 3),
        "temporal_flicker":   round(flicker, 3),
        "ela_score":          round(forensic_means["ela"], 3),
        "texture_score":      round(forensic_means["lbp"], 3),
        "wavelet_sig":        round(forensic_means["wavelet"], 3),
        "geometric_alignment": round(forensic_means["alignment"], 3),
    }

    result = build_result(composite, breakdown, media="video")
    result["frame_count"] = len(frames_pil)
    return result


# ── Internal Helpers ──────────────────────────────────────────────────────────

def _query_api(img_bytes, headers):
    try:
        r = requests.post(API_URL, headers=headers, data=img_bytes, timeout=15)
        if r.status_code == 200:
            res = r.json()
            labels = {item["label"].lower(): item["score"] for item in res}
            # Model labels: "Fake" or "Real"
            for k in ("fake", "deepfake", "synthetic"):
                if k in labels: return float(labels[k])
            if "real" in labels: return 1.0 - float(labels["real"])
        return 0.5
    except Exception:
        return 0.5

def _extract_frames(video_path: str) -> list:
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened(): return []
    fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
    frame_step = max(1, int(fps * FRAME_INTERVAL))
    frames = []
    f_idx = 0
    while len(frames) < MAX_FRAMES:
        cap.set(cv2.CAP_PROP_POS_FRAMES, f_idx)
        ret, frame = cap.read()
        if not ret: break
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        pil = Image.fromarray(rgb).resize((INPUT_SIZE, INPUT_SIZE), Image.LANCZOS)
        frames.append(pil)
        f_idx += frame_step
    cap.release()
    return frames

def _weighted_aggregate(fake_probs, forensic_data):
    if not fake_probs: return 0.5, 0.0, {k: 0.5 for k in ["ela","lbp","srm","fft","alignment","wavelet"]}
    probs = np.array(fake_probs, dtype=float)
    weights = np.where(probs >= 0.70, OUTLIER_WEIGHT, 1.0)
    base_score = np.average(probs, weights=weights)
    
    means = {}
    stds  = {}
    for key in ["ela", "lbp", "srm", "fft", "alignment", "wavelet"]:
        vals = np.array([f[key] for f in forensic_data])
        means[key] = float(np.mean(vals))
        stds[key]  = float(np.std(vals))
        
    flicker = np.std(probs) + np.mean(list(stds.values()))
    flicker = np.clip(flicker * 2.0, 0.0, 1.0)
    
    final = np.clip(base_score + (flicker * 0.15), 0.0, 1.0)
    return float(final), float(flicker), means

def _fallback_result(reason: str) -> dict:
    return {"prediction": "Error", "confidence": 0.0, "explanation": reason, "breakdown": {}, "frame_count": 0}
