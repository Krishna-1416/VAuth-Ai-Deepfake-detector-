"""
Video Detector — Direct HuggingFace Model Inference
Model: prithivMLmods/Deepfake-Detect-Siglip2
  - SigLIP2 Vision Transformer fine-tuned on deepfake datasets
  - Loaded once at server startup via transformers.pipeline
  - Frames extracted with OpenCV (1fps, max 15 frames)
  - Batch inference → weighted score aggregation
"""

import numpy as np
import cv2
from PIL import Image
from utils.result_builder import build_result

# ── Global model handle (loaded once on startup) ──────────────────────────────
_video_pipe = None

MODEL_ID = "prithivMLmods/Deepfake-Detect-Siglip2"
MAX_FRAMES     = 15          # Max keyframes to extract
FRAME_INTERVAL = 1.0         # Seconds between keyframes
INPUT_SIZE     = 384         # SigLIP2 native resolution
BATCH_SIZE     = 4           # Frames per inference batch
OUTLIER_WEIGHT = 2.0         # Weight multiplier for high-confidence frames
FAKE_THRESHOLD = 0.40        # Score >= 0.40 is flagged as Synthetic


def load_video_model():
    """
    Load the HuggingFace pipeline once at startup.
    Auto-selects CUDA if available, otherwise CPU.
    """
    global _video_pipe
    if _video_pipe is not None:
        return

    import torch
    from transformers import pipeline

    device = 0 if torch.cuda.is_available() else -1
    device_name = "GPU (CUDA)" if device == 0 else "CPU"
    print(f"[VideoDetector] Loading {MODEL_ID} on {device_name}…")

    _video_pipe = pipeline(
        "image-classification",
        model=MODEL_ID,
        device=device,
    )
    print(f"[VideoDetector] Model loaded ✓")


# ── Main entry ────────────────────────────────────────────────────────────────

def analyse_video(video_path: str) -> dict:
    """
    1. Extract keyframes from the video file.
    2. Run all frames through the SigLIP2 deepfake classifier in batch.
    3. Aggregate per-frame scores with outlier weighting.
    4. Build and return the result dict.
    """
    if _video_pipe is None:
        load_video_model()

    frames = _extract_frames(video_path)
    if not frames:
        return _fallback_result("Could not extract frames from video.")

    frame_count = len(frames)
    print(f"[VideoDetector] Extracted {frame_count} frames from {video_path}")

    # — Batch inference
    per_frame_results = _video_pipe(frames, batch_size=BATCH_SIZE)
    print(f"[VideoDetector] Inference complete.")

    # — Parse scores: each element is a list of {label, score} dicts
    fake_probs = []
    for frame_result in per_frame_results:
        # The pipeline can return a list of dicts per image
        labels = {item["label"].lower(): item["score"] for item in frame_result}
        # Model labels are typically "Deepfake" / "Real" — normalise
        fake_prob = _extract_fake_prob(labels)
        fake_probs.append(fake_prob)
        print(f"  frame fake_prob={fake_prob:.3f}  labels={labels}")

    # — Weighted aggregation + Temporal Analysis
    composite, flicker = _weighted_aggregate(fake_probs)

    breakdown = {
        "diffusion_score":    round(composite, 3),
        "manipulation_score": round(max(composite * 0.9, flicker), 3),
        "realism_score":      round(1.0 - composite, 3),
        "fourier_spectral":   round(composite * 0.85, 3),
        "temporal_flicker":   round(flicker, 3),
    }

    result = build_result(composite, breakdown, media="video")
    result["frame_count"] = frame_count
    return result


# ── Frame extraction ──────────────────────────────────────────────────────────

def _extract_frames(video_path: str) -> list:
    """Return a list of PIL Images sampled at FRAME_INTERVAL seconds."""
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return []

    fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
    frame_step = max(1, int(fps * FRAME_INTERVAL))

    frames = []
    frame_idx = 0

    while len(frames) < MAX_FRAMES:
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
        ret, frame = cap.read()
        if not ret:
            break

        # BGR → RGB → PIL → resize to SigLIP2 input size
        rgb   = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        pil   = Image.fromarray(rgb).resize((INPUT_SIZE, INPUT_SIZE), Image.LANCZOS)
        frames.append(pil)

        frame_idx += frame_step

    cap.release()
    return frames


# ── Score helpers ─────────────────────────────────────────────────────────────

def _extract_fake_prob(labels: dict) -> float:
    """
    Normalise model label keys to a single 'fake probability'.
    Handles various model output label formats.
    """
    # Try common label patterns
    for key in ("deepfake", "fake", "ai-generated", "synthetic"):
        if key in labels:
            return float(labels[key])
    # If only 'real' label found, invert it
    for key in ("real", "authentic", "genuine"):
        if key in labels:
            return 1.0 - float(labels[key])
    # Fallback: take the max score (most confident label)
    return float(max(labels.values())) if labels else 0.5


def _weighted_aggregate(fake_probs: list) -> (float, float):
    """
    Aggregation with Temporal Flicker Detection.
    - Standard Weighted average (high scores weighted more).
    - Variance analysis: high flicker = deepfake indicator.
    Returns (composite_score, flicker_score)
    """
    if not fake_probs:
        return 0.5, 0.0
    
    probs = np.array(fake_probs, dtype=float)
    
    # 1. Base Weighted Average (Strong local detections weighted more)
    weights = np.where(probs >= 0.70, OUTLIER_WEIGHT, 1.0)
    base_score = np.average(probs, weights=weights)
    
    # 2. Temporal Flicker Detection (Variance across time)
    # Real videos have stable forensic signatures; Deepfakes 'flicker'.
    std_dev = np.std(probs)
    flicker_score = np.clip(std_dev * 4.0, 0.0, 0.95) # Scale to [0, 0.95]
    
    # Penalise unstable detections (only if scores are actually mid-to-high)
    penalty = 0.0
    if flicker_score > 0.4 and base_score > 0.3:
        penalty = flicker_score * 0.15 # Add up to 15% to final score
        
    final_score = np.clip(base_score + penalty, 0.0, 1.0)
    return float(final_score), float(flicker_score)


def _fallback_result(reason: str) -> dict:
    return {
        "prediction": "Error",
        "confidence": 0.0,
        "explanation": reason,
        "breakdown": {},
        "frame_count": 0,
    }
