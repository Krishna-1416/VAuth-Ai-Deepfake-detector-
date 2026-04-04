"""
Result Builder
Converts a composite 0–1 fake score into:
  - prediction label
  - confidence percentage
  - natural language explanation
"""

import math
from typing import Literal

# Strict Binary Threshold (0.40 Core)
_BANDS = [
    (0.40, "Synthetic / Deepfake"),
    (0.00, "Authentic / Real"),
]

# Signal-specific explanation snippets
_SIGNAL_TIPS = {
    "model_score": {
        "high": "The AI image classifier flagged this as machine-generated with high confidence.",
        "low":  "The AI image classifier found no synthetic generation signatures.",
    },
    "diffusion_score": {
        "high": "High-frequency spectral patterns consistent with diffusion-model upsampling were detected.",
        "low":  "No significant diffusion fingerprints found in the spectrum.",
    },
    "manipulation_score": {
        "high": "Facial geometry shows deviations typical of face-swap or generative morphing.",
        "low":  "Facial structure appears consistent with a real human face.",
    },
    "realism_score": {
        "low":  "Pixel noise texture is unnaturally flat, lacking organic sensor patterns.",
        "high": "Pixel noise texture shows natural camera-sensor characteristics.",
    },
    "fourier_spectral": {
        "high": "Fourier transform reveals artificial periodic artifacts (checkerboarding).",
        "low":  "Frequency domain shows no unusual periodic patterns.",
    },
    "wavelet_sig": {
        "high": "Wavelet decomposition detects structured noise signatures specific to AI generators.",
        "low":  "Sub-band energy distribution matches organic photography.",
    },
    "ela_score": {
        "high": "ELA reveals inconsistent compression levels, suggesting generative patching or local edits.",
        "low":  "Uniform compression error levels typical of single-source capture.",
    },
    "texture_score": {
        "high": "Unnatural micro-texture regularity (LBP) detected, often found in synthetic skin/surfaces.",
        "low":  "Organic micro-texture complexity consistent with real-world photography.",
    },
    "noise_score": {
        "high": "SRM-based noise residuals show geometric fingerprints characteristic of AI generators.",
        "low":  "Noise residuals exhibit random sensor behavior expected from real cameras.",
    },
    "iris_consistency": {
        "high": "Specular highlights and iris positioning show unnatural bilateral divergence.",
        "low":  "Eye reflections are physically consistent with real-world optics.",
    },
    "temporal_flicker": {
        "high": "High temporal variance detected: forensic indices 'flicker' between frames.",
        "low":  "Forensic signatures remain stable across the timeline.",
    },
}



def build_result(
    composite_raw: float,
    breakdown: dict,
    media: Literal["image", "video"] = "image",
) -> dict:
    fused_score = float(max(0.0, min(1.0, composite_raw)))
    prediction = _label(fused_score)
    confidence = _confidence(fused_score, prediction)
    explanation = _explain(fused_score, breakdown, prediction, media)

    return {
        "prediction":  prediction,
        "confidence":  round(confidence, 4),
        "explanation": explanation,
        "breakdown":   {k: round(v, 3) for k, v in breakdown.items()},
    }


def _label(score: float) -> str:
    for threshold, label in _BANDS:
        if score >= threshold:
            return label
    return "Real"


def _confidence(score: float, prediction: str) -> float:
    if score >= 0.40:
        conf = 0.50 + (score - 0.40) / 0.60 * 0.49
    else:
        conf = 0.50 + (0.40 - score) / 0.40 * 0.49
    return float(max(0.50, min(0.99, conf)))


def _explain(
    composite: float,
    breakdown: dict,
    prediction: str,
    media: str,
) -> str:
    parts = []
    if composite >= 0.40:
        parts.append("Synthetic indicators detected above the forensic threshold.")
    else:
        parts.append("Media verified as authentic based on forensic signatures.")

    for sig_key, tips in _SIGNAL_TIPS.items():
        val = breakdown.get(sig_key, None)
        if val is None: continue
        if sig_key == "realism_score":
            if val < 0.35: parts.append(tips["low"])
        elif val >= 0.65: parts.append(tips["high"])
        elif val < 0.20: parts.append(tips["low"])

    if media == "video":
        parts.append(f"Analysis averaged across up to {15} sampled frames.")

    return " ".join(parts)
