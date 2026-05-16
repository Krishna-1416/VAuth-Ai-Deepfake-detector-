"""
Video Detector — Gemma 4 Forensic Reasoning Engine
- Storyboard generation from video frames
- Gemma 4 26B multimodal temporal analysis
- Strict model-based verdict
"""

import io
import os
import cv2
import numpy as np
from PIL import Image

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

# ── Configuration ────────────────────────────────────────────────────────────
MAX_FRAMES     = 8
FRAME_INTERVAL = 1.0
STORYBOARD_COLS = 4
INPUT_SIZE     = 384

def query_gemma4_video(storyboard_bytes: bytes, heuristics: list) -> dict:
    """Uses Gemma 4 26B (Multimodal MoE) for expert temporal reasoning on a video storyboard."""
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        return {"fake_probability": 0.5, "forensic_reasoning": "Gemma 4 API key missing."}

    client = genai.Client(api_key=api_key)
    
    # Summarize heuristics for the prompt
    h_summary = []
    for i, h in enumerate(heuristics):
        h_summary.append(f"Frame {i+1}: FFT={h['fft']:.3f}, ELA={h['ela']:.3f}, Noise={h['srm']:.3f}")
    
    prompt = f"""
    [TEMPORAL FORENSIC AUDIT]
    You are the Gemma 4 Forensic Engine. Analyze this video storyboard (8 sampled frames).
    
    HEURISTIC TIMELINE:
    {chr(10).join(h_summary)}
    
    YOUR OBJECTIVE:
    1. Detect temporal flickering, frame-to-frame texture shifts, or artificial blending around facial boundaries.
    2. Check for spectral anomalies (FFT spikes) that appear and disappear, indicating frame-based generative patching.
    3. Verify if lip-sync or eye specularity remains consistent across the storyboard.
    
    Output a valid JSON only with:
    {{
      "fake_probability": float (0.0 to 1.0),
      "forensic_reasoning": "A professional 2-3 sentence summary of the temporal forensic findings."
    }}
    """
    
    try:
        response = client.models.generate_content(
            model="gemma-4-26b-a4b-it",
            contents=[
                types.Part.from_bytes(data=storyboard_bytes, mime_type="image/jpeg"),
                prompt
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            )
        )
        import json
        return json.loads(response.text)
    except Exception as e:
        print(f"[V-Auth] Gemma 4 Video Error: {e}")
        return {"fake_probability": 0.5, "forensic_reasoning": "Gemma 4 analysis failed."}

def analyse_video(video_path: str) -> dict:
    """Extract frames, create storyboard, and call Gemma 4."""
    # 1. Extract frames
    frames_pil = _extract_frames(video_path)
    if not frames_pil:
        return _fallback_result("Could not extract frames from video.")

    print(f"[VideoDetector] Sampling {len(frames_pil)} frames for storyboard analysis...")
    
    # 2. Extract Heuristics
    forensic_data = []
    face_mesh = get_face_mesh()
    
    for pil_img in frames_pil:
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

    # 3. Create Storyboard
    storyboard = _create_storyboard(frames_pil)
    buf = io.BytesIO()
    storyboard.save(buf, format="JPEG", quality=85)
    storyboard_bytes = buf.getvalue()

    # 4. Call Gemma 4
    gemma_result = query_gemma4_video(storyboard_bytes, forensic_data)
    
    # 5. Composite Scoring (Strictly model-based)
    model_score = gemma_result.get("fake_probability", 0.5)
    
    # Calculate means and quality for the breakdown (UI)
    means = {k: float(np.mean([f[k] for f in forensic_data])) for k in forensic_data[0].keys()}
    flicker = float(np.std([f["fft"] for f in forensic_data]) * 2.0)
    
    # Assess overall video quality
    quality_results = [_assess_frame_quality(cv2.cvtColor(np.array(f), cv2.COLOR_RGB2BGR)) for f in frames_pil]
    avg_blur = np.mean([q["blur_score"] for q in quality_results])
    
    # Determine consensus tier
    tiers = [q["tier"] for q in quality_results]
    video_tier = max(set(tiers), key=tiers.count) # Majority vote

    breakdown = {
        "model_score":        round(model_score, 3),
        "diffusion_score":    round(max(model_score, means["srm"]), 3),
        "manipulation_score": round(max(model_score * 0.9, means["alignment"]), 3),
        "realism_score":      round(1.0 - model_score, 3),
        "fourier_spectral":   round(means["fft"], 3),
        "temporal_flicker":   round(np.clip(flicker, 0.0, 1.0), 3),
        "ela_score":          round(means["ela"], 3),
        "texture_score":      round(means["lbp"], 3),
        "wavelet_sig":        round(means["wavelet"], 3),
        "geometric_alignment": round(means["alignment"], 3),
        "video_quality":      round(avg_blur, 3),
    }

    result = build_result(model_score, breakdown, media="video", quality=video_tier)
    result["frame_count"] = len(frames_pil)
    result["quality_tier"] = video_tier
    result["explanation"] = gemma_result.get("forensic_reasoning", result["explanation"])
    return result

def _assess_frame_quality(cv_img: np.ndarray) -> dict:
    gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)
    laplacian_var = cv2.Laplacian(gray, cv2.CV_32F).var()
    blur_score = float(np.clip(laplacian_var / 500.0, 0.0, 1.0))
    
    if laplacian_var < 30:    tier = "low"
    elif laplacian_var < 100: tier = "blurry"
    else:                     tier = "high"
    
    return {"tier": tier, "blur_score": blur_score}

def _create_storyboard(frames: list) -> Image.Image:
    """Combines frames into a grid."""
    n = len(frames)
    cols = STORYBOARD_COLS
    rows = (n + cols - 1) // cols
    
    w, h = frames[0].size
    grid = Image.new("RGB", (cols * w, rows * h))
    
    for i, frame in enumerate(frames):
        r = i // cols
        c = i % cols
        grid.paste(frame, (c * w, r * h))
        
    return grid

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

def load_video_model():
    """
    Stub to initialize video detection configuration.
    Called by main.py on startup.
    """
    print("[VideoDetector] Gemma 4 Forensic Engine Initialized.")
    return True

def _fallback_result(reason: str) -> dict:
    return {"prediction": "Error", "confidence": 0.0, "explanation": reason, "breakdown": {}, "frame_count": 0}
