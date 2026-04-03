import cv2
import os
import shutil
import numpy as np
from detectors.image_detector import analyze_image

def analyze_video(path: str):
    """
    Video deepfake analysis using frame-by-frame image detector and temporal delta analysis.
    """
    results = {}
    cap = cv2.VideoCapture(path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration = frame_count / (fps + 1e-6)
    
    # 1. Temporal Analysis (Flicker/Jitter) - Measure mean squared error between consecutive frames
    # High MSE often means jittery temporal artifacts common in video deepfakes.
    ret, prev_frame = cap.read()
    total_mse = 0
    sampled_count = 0
    max_frames_to_check = 60 # Check first 2 seconds (if 30FPS) to keep it fast
    
    while ret and sampled_count < max_frames_to_check:
        ret, curr_frame = cap.read()
        if not ret: break
        
        # Calculate frame-to-frame difference (normalized to resolution)
        diff = cv2.absdiff(prev_frame, curr_frame)
        mse = (diff**2).mean() / (255**2)
        total_mse += mse
        prev_frame = curr_frame
        sampled_count += 1
        
    results["temporal_jitter"] = (total_mse / (sampled_count + 1e-6)) * 100 # Multiplier for scaling
    
    # 2. Frame-level Analysis (Keyframe fusion using Model)
    # Extract 3 keyframes (start, middle, end) and run the Siglip2 image detector
    keyframe_indices = [int(p * (frame_count - 1)) for p in [0.1, 0.5, 0.9]]
    frame_scores = []
    
    for idx in keyframe_indices:
        cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
        ret, frame = cap.read()
        if not ret: continue
        
        # Save keyframe temporarily and analyze
        kf_path = f"kf_{idx}.jpg"
        cv2.imwrite(kf_path, frame)
        kf_score = analyze_image(kf_path)
        
        # Extract the synthetic/fake indicator (frequency_anomaly) from the model's scores
        frame_scores.append(kf_score.get("frequency_anomaly", 0.5))
        
        if os.path.exists(kf_path): os.remove(kf_path)
            
    # Aggregate frame scores (mean of all frames' model confidence)
    if frame_scores:
        results["mean_frame_inconsistency"] = float(np.mean(frame_scores))
    else:
        results["mean_frame_inconsistency"] = 0.5
        
    cap.release()
    return results
