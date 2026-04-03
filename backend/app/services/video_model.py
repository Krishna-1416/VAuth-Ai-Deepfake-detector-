import cv2
import numpy as np
import torch
from PIL import Image
from .image_model import model, preprocess

def get_video_score(video_path: str, max_frames=20) -> float:
    """Process video frames and return average deepfake score."""
    try:
        cap = cv2.VideoCapture(video_path)
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        if frame_count <= 0:
            return 0.5
        
        # Take up to max_frames, spaced out evenly.
        frame_indices = np.linspace(0, frame_count - 1, min(max_frames, frame_count), dtype=int)
        frame_scores = []
        
        for i in frame_indices:
            cap.set(cv2.CAP_PROP_POS_FRAMES, i)
            ret, frame = cap.read()
            if not ret:
                continue
                
            # Convert OpenCV BGR to RGB and PIL
            img = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            img = Image.fromarray(img)
            
            input_tensor = preprocess(img).unsqueeze(0)
            
            with torch.no_grad():
                features = model(input_tensor)
                score = torch.mean(features).item()
                
                # Normalize to [0, 1]
                normalized_score = 1 / (1 + np.exp(-score))
                frame_scores.append(float(normalized_score))
                
        cap.release()
        
        if not frame_scores:
            return 0.5
            
        # Return average score across frames
        return float(np.mean(frame_scores))
        
    except Exception as e:
        print(f"Error in video processing: {e}")
        return 0.5
