import numpy as np

def build_detection_result(media_type: str, raw_scores: dict):
    """
    Fuses raw model/heuristic signals into a final score, a decision (FAKE vs REAL),
    and a generated natural-language explanation.
    """
    # 1. Final Scoring Configuration (Weighted Voting)
    # Higher scores mean more likely synthetic/fake.
    weights = {
        "image": {
            "frequency_anomaly": 0.70, # Heavily weight the Siglip2 model result
            "noise_cleanliness": 0.15,
            "structural_consistency": 0.10,
            "exif_present": 0.05
        },
        "audio": {
            "spectral_centroid_var": 0.80, # Heavily weight the m-a-p model result
            "pause_irregularity": 0.10,
            "formant_tightness": 0.10
        },
        "video": {
            "temporal_jitter": 0.40,
            "mean_frame_inconsistency": 0.60 # Weight the image-model-on-frame results
        }
    }
    
    # 2. Score Normalization
    weighted_score = 0
    media_weights = weights.get(media_type, {})
    
    for signal, weight in media_weights.items():
        val = raw_scores.get(signal, 0.5)
        # Higher score = more likely fake
        weighted_score += val * weight
        
    confidence = min(max(float(weighted_score * 100), 0), 100)
    # Threshold for detection: > 50% = FAKE
    decision = "FAKE" if confidence > 50 else "REAL"
    
    # 3. Generating Insights/Explanation Based on Model/Signals
    explanation_bullets = []
    # Combine signals and their values
    sorted_signals = sorted(raw_scores.items(), key=lambda x: x[1], reverse=True)
    
    # Text mapping based on what triggered the decision
    labels = {
        "frequency_anomaly": "Siglip2 Detection: High confidence in synthetic generation/deepfake fingerprints.",
        "noise_cleanliness": "Pixel noise patterns are too uniform for a real camera sensor.",
        "structural_consistency": "Detected anatomical or mesh inconsistencies (common in AI generations).",
        "exif_present": "Cameral-level metadata is absent, a classic red flag for AI-authored images.",
        "spectral_centroid_var": "Voice-Cloning Detector: Spectral centroid anomaly consistent with synthetic vocoders.",
        "pause_irregularity": "Speech pauses and breath patterns are overly clean (typical of TTS models).",
        "formant_tightness": "Narrow resonance tracking (formants) suggestive of a cloned voice.",
        "temporal_jitter": "Detected temporal flicker between video frames (jitter indicator).",
        "mean_frame_inconsistency": "Cross-frame model analysis confirms persistent synthetic artifacts."
    }
    
    # If confidence is high, prioritize model-based insights
    for signal, val in sorted_signals:
        if val > 0.5 and signal in labels:
            explanation_bullets.append(labels[signal])
            if len(explanation_bullets) >= 3: break
            
    if not explanation_bullets:
        explanation_bullets.append(" media signals are within the expected range for authentic capture.")
        
    return {
        "verdict": decision,
        "confidence": round(confidence, 1),
        "explanation": explanation_bullets,
        "media_type": media_type,
        "timestamp": "Analysis Complete"
    }
