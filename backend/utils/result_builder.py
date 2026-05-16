"""
Result Builder
Converts a composite 0–1 fake score into:
  - prediction label
  - confidence percentage
  - natural language explanation
"""

import math
from typing import Literal

# Dynamic Threshold Configuration
# For high quality media, we use a higher threshold (0.35) to avoid false positives.
# For low quality/blurry media, we use a lower threshold (0.25) to be more sensitive to hidden artifacts.
_QUALITY_THRESHOLDS = {
    "high":    0.45,
    "medium":  0.42,
    "low":     0.40,
    "blurry":  0.38
}
_DEFAULT_THRESHOLD = 0.42

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
    quality: str = "medium"
) -> dict:
    fused_score = float(max(0.0, min(1.0, composite_raw)))
    
    # Dynamic Threshold Selection
    threshold = _QUALITY_THRESHOLDS.get(quality, _DEFAULT_THRESHOLD)
    
    prediction = "Synthetic / Deepfake" if fused_score >= threshold else "Authentic / Real"
    confidence = _confidence(fused_score, threshold)
    explanation = _explain(fused_score, breakdown, threshold, media, quality)

    return {
        "prediction":  prediction,
        "confidence":  round(confidence, 4),
        "explanation": explanation,
        "threshold_used": threshold,
        "quality_detected": quality,
        "breakdown":   {k: round(v, 3) for k, v in breakdown.items()},
    }


def _confidence(score: float, threshold: float) -> float:
    """Calculates confidence based on distance from the dynamic threshold."""
    if score >= threshold:
        # Scale score from [threshold, 1.0] to [0.50, 0.99]
        conf = 0.50 + (score - threshold) / (1.0 - threshold + 1e-6) * 0.49
    else:
        # Scale score from [0.0, threshold] to [0.99, 0.50]
        conf = 0.50 + (threshold - score) / (threshold + 1e-6) * 0.49
    return float(max(0.50, min(0.99, conf)))


def _explain(
    composite: float,
    breakdown: dict,
    threshold: float,
    media: str,
    quality: str
) -> str:
    parts = []
    
    # 1. Primary Verdict
    if composite >= threshold:
        parts.append(f"Synthetic indicators detected above the {quality} quality forensic threshold ({threshold}).")
    else:
        parts.append(f"Media verified as authentic based on {quality} quality forensic baseline.")

    # 2. Quality context
    if quality in ["low", "blurry"]:
        parts.append("Note: Analysis sensitivity increased due to low media quality.")
    elif quality == "high":
        parts.append("High-fidelity analysis confirms forensic stability.")

    # 3. Signal-specific tips
    for sig_key, tips in _SIGNAL_TIPS.items():
        val = breakdown.get(sig_key, None)
        if val is None: continue
        if sig_key == "realism_score":
            if val < 0.35: parts.append(tips["low"])
        elif val >= 0.65: parts.append(tips["high"])
        elif val < 0.20: parts.append(tips["low"])

    if media == "video":
        parts.append("Analysis averaged across multiple sampled frames.")

    return " ".join(parts)

