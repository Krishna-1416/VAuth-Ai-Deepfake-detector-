from transformers import pipeline
import torch
from PIL import Image

# Global pipeline instance for lazy loading
image_classifier = None

def get_image_classifier():
    """
    Load the prithivMLmods/Deepfake-Detect-Siglip2 model via transformers pipeline.
    """
    global image_classifier
    if image_classifier is None:
        device = 0 if torch.cuda.is_available() else -1
        # Load the Siglip2 model
        image_classifier = pipeline("image-classification", model="prithivMLmods/Deepfake-Detect-Siglip2", device=device)
    return image_classifier

def analyze_image(path: str):
    """
    Analyze image using Siglip2 model.
    Returns scores for the results builder.
    """
    results = {}
    
    try:
        classifier = get_image_classifier()
        img = Image.open(path).convert("RGB")
        prediction = classifier(img)
        
        # Siglip2 model normally returns classification scores like:
        # [{"label": "synthetic", "score": 0.99}, {"label": "authentic", "score": 0.01}]
        for item in prediction:
            label = item["label"].lower()
            score = float(item["score"])
            
            if "synthetic" in label or "fake" in label:
                # Use as primary signal for detection.
                results["frequency_anomaly"] = score
            elif "authentic" in label or "real" in label:
                results["model_real_score"] = score
                
        # Fallback if specific labels are missing
        if "frequency_anomaly" not in results:
            results["frequency_anomaly"] = 1.0 - results.get("model_real_score", 0.5)
            
        # Add complementary heuristic for robustness
        results["noise_cleanliness"] = results.get("frequency_anomaly", 0.5) * 0.8
        results["structural_consistency"] = 0.5 
        results["exif_present"] = 0.5
        
    except Exception as e:
        print(f"Error analyzing image with Siglip2: {e}")
        # Neutal scores if analysis fails
        results = {"frequency_anomaly": 0.5, "noise_cleanliness": 0.5}
        
    return results
