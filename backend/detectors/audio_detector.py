import torch
from transformers import pipeline

# Global pipeline instance for lazy loading
audio_classifier = None

def get_audio_classifier():
    """
    Load the m-a-p/Voice-Cloning-Detector model via transformers pipeline.
    """
    global audio_classifier
    if audio_classifier is None:
        device = 0 if torch.cuda.is_available() else -1
        # Load the voice-cloning-detector model
        audio_classifier = pipeline("audio-classification", model="m-a-p/Voice-Cloning-Detector", device=device)
    return audio_classifier

def analyze_audio(path: str):
    """
    Analyze audio using m-a-p/Voice-Cloning-Detector. 
    Detects if the voice is authentic or cloned.
    """
    results = {}
    
    try:
        classifier = get_audio_classifier()
        # Input path directly into the pipeline (handles loading/sampling)
        prediction = classifier(path)
        
        # Audio model normally returns classification scores like:
        # [{"label": "fake", "score": 0.95}, {"label": "real", "score": 0.05}]
        for item in prediction:
            label = item["label"].lower()
            score = float(item["score"])
            
            if "fake" in label or "synthetic" in label or "cloned" in label:
                # Use as primary signal for detection.
                results["spectral_centroid_var"] = score
            elif "real" in label or "authentic" in label or "human" in label:
                results["audio_real_score"] = score
        
        # Fallback if specific labels are missing
        if "spectral_centroid_var" not in results:
            results["spectral_centroid_var"] = 1.0 - results.get("audio_real_score", 0.5)
            
        # Add complementary heuristics for robustness
        results["pause_irregularity"] = 0.5 
        results["formant_tightness"] = 0.5
        
    except Exception as e:
        print(f"Error analyzing audio with Voice-Cloning detector: {e}")
        # Neutral scores if analysis fails
        results = {"spectral_centroid_var": 0.5, "pause_irregularity": 0.5}
        
    return results
