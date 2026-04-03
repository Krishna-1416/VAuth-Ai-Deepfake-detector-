import os
import shutil
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from detectors.image_detector import analyze_image
from detectors.audio_detector import analyze_audio
from detectors.video_detector import analyze_video
from utils.result_builder import build_detection_result

app = FastAPI(
    title="Ignition Model-Driven Deepfake Detection API",
    description="Full-stack AI backend for analyzing media authenticity using Siglip2 and Voice-Cloning detectors."
)

# Enable CORS for frontend flexibility
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Temp storage for processing
TEMP_DIR = "temp_uploads"
os.makedirs(TEMP_DIR, exist_ok=True)

@app.get("/api/health")
async def health_check():
    """Returns the backend health status."""
    return {"status": "active", "models": ["Siglip2", "Voice-Cloning-Detector"]}

@app.post("/analyze")
async def analyze_v2_route(file: UploadFile = File(...)):
    """
    Standardize direct /analyze route for JSON model scores as requested.
    """
    ext = file.filename.split(".")[-1].lower()
    temp_path = os.path.join(TEMP_DIR, f"v2_job.{ext}")
    
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        mime = file.content_type
        
        # Determine media type and call appropriate detector
        if mime.startswith("image/"):
            raw_scores = analyze_image(temp_path)
            media_type = "image"
        elif mime.startswith("audio/"):
            raw_scores = analyze_audio(temp_path)
            media_type = "audio"
        elif mime.startswith("video/"):
            raw_scores = analyze_video(temp_path)
            media_type = "video"
        else:
            # Fallback by extension if MIME is vague
            if ext in ['jpg', 'jpeg', 'png']:
                raw_scores = analyze_image(temp_path)
                media_type = "image"
            elif ext in ['mp3', 'wav']:
                raw_scores = analyze_audio(temp_path)
                media_type = "audio"
            elif ext in ['mp4', 'mov']:
                raw_scores = analyze_video(temp_path)
                media_type = "video"
            else:
                raise HTTPException(status_code=400, detail=f"Unsupported file format: {ext}")
            
        # Fuse results into final response
        result = build_detection_result(media_type, raw_scores)
        
        return {
            "media_type": media_type,
            "verdict": result["verdict"],
            "confidence_score": result["confidence"],
            "vulnerability_analysis": result["explanation"]
        }
        
    except Exception as e:
        print(f"Server-side error: {e}")
        raise HTTPException(status_code=500, detail="Internal model analysis failure.")
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

@app.post("/api/detect")
async def legacy_api_route(file: UploadFile = File(...)):
    """
    Wrapper endpoint for backward compatibility with frontend/app.js.
    """
    return await analyze_v2_route(file)

if __name__ == "__main__":
    import uvicorn
    # In a hackathon setting, --reload is useful for rapid prototyping.
    uvicorn.run(app, host="0.0.0.0", port=8000)
