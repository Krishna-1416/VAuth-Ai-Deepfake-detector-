import os
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from ..utils.file_handler import save_upload_file
from ..services.image_model import get_image_score
from ..services.video_model import get_video_score
from ..services.audio_model import get_audio_score
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

# Initialize Supabase client
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase: Client = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

@router.post("/detect")
async def detect_media(file: UploadFile = File(...)):
    """Analyze media (image/video/audio) and return deepfake result."""
    try:
        # Save file to disk
        file_path = save_upload_file(file)
        
        # Identify file type
        content_type = file.content_type or ""
        score = 0.5
        
        if content_type.startswith("image"):
            score = get_image_score(file_path)
            file_type = "image"
        elif content_type.startswith("video"):
            score = get_video_score(file_path)
            file_type = "video"
        elif content_type.startswith("audio"):
            score = get_audio_score(file_path)
            file_type = "audio"
        else:
            # Fallback to extension check
            ext = file.filename.split('.')[-1].lower()
            if ext in ["jpg", "jpeg", "png"]:
                score = get_image_score(file_path)
                file_type = "image"
            elif ext in ["mp4", "avi", "mov"]:
                score = get_video_score(file_path)
                file_type = "video"
            elif ext in ["mp3", "wav", "m4a"]:
                score = get_audio_score(file_path)
                file_type = "audio"
            else:
                raise HTTPException(status_code=400, detail="Unsupported media format")
        
        # Prediction Logic
        if score > 0.7:
            prediction = "Fake"
            confidence = float(score)
            explanation = "Facial or temporal inconsistencies detected"
        elif score < 0.3:
            prediction = "Real"
            confidence = float(1 - score)
            explanation = "No visible manipulation detected"
        else:
            prediction = "Uncertain"
            confidence = 0.5
            explanation = "Inconclusive media analysis"
            
        # Store result in Supabase
        result_data = {
            "filename": file.filename,
            "file_type": file_type,
            "prediction": prediction,
            "confidence": confidence,
            "timestamp": datetime.now().isoformat()
        }
        
        if supabase:
            try:
                supabase.table("detections").insert(result_data).execute()
            except Exception as e:
                print(f"Supabase storage error: {e}")
        
        return JSONResponse(content={
            "prediction": prediction,
            "confidence": confidence,
            "explanation": explanation
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
