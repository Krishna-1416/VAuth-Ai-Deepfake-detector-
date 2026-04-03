from transformers import pipeline
from PIL import Image
import torch
import os

# Global face detector (lazy loading)
face_detector = None

def get_face_detector():
    """
    Load the OwlViT Zero-Shot Detector (Robust 2026 Alternative).
    Unlike fixed DETR models, this can search for 'face' specifically.
    """
    global face_detector
    if face_detector is None:
        device = 0 if torch.cuda.is_available() else -1
        # OwlViT is extremely robust for finding objects via text prompts
        face_detector = pipeline("zero-shot-object-detection", model="google/owlvit-base-patch32", device=device)
    return face_detector

def detect_and_crop_face(image_path: str, output_path: str):
    """
    Detects the primary face in an image using Zero-Shot vision and crops it.
    Returns True if a face was detected and cropped, False otherwise.
    """
    try:
        detector = get_face_detector()
        img = Image.open(image_path).convert("RGB")
        
        # Run zero-shot detection for 'human face'
        results = detector(img, candidate_labels=["human face"])
        
        # Filter for quality
        faces = [r for r in results if r['score'] > 0.3]
        if not faces:
            return False
            
        # Get the best face
        best_face = max(faces, key=lambda x: x['score'])
        box = best_face['box']
        
        # Extract coordinates (OwlViT uses xmin, ymin, xmax, ymax)
        xmin, ymin, xmax, ymax = box['xmin'], box['ymin'], box['xmax'], box['ymax']
        
        # Add 25% padding for better deepfake context (SigLIP 2 likes skin context)
        width = xmax - xmin
        height = ymax - ymin
        pad_w = int(width * 0.25)
        pad_h = int(height * 0.25)
        
        left = max(0, xmin - pad_w)
        top = max(0, ymin - pad_h)
        right = min(img.width, xmax + pad_w)
        bottom = min(img.height, ymax + pad_h)
        
        # Crop and save
        face_img = img.crop((left, top, right, bottom))
        face_img.save(output_path)
        return True
        
    except Exception as e:
        print(f"Zero-Shot Face Detection failed: {e}")
        return False
