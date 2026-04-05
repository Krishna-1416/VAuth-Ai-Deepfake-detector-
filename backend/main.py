"""
V-Auth — FastAPI Deepfake Detection Backend (Compact Edition)
- Memory-optimized for Render Free Tier (<512MB RAM)
- No local ML frameworks (Hugging Face Inference API)
- Singleton Supabase Client
"""

import os
import time
import tempfile
import asyncio
import base64
import requests
import uvicorn
from contextlib import asynccontextmanager
from dotenv import load_dotenv

from fastapi import FastAPI, File, UploadFile, HTTPException, WebSocket, WebSocketDisconnect, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from detectors.image_detector import analyse_image
from detectors.video_detector import analyse_video, load_video_model

# Load environment variables
load_dotenv()

# ── Configuration ────────────────────────────────────────────────────────────

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://dfkbrzuzvgkpboeyjwzr.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRma2JyenV6dmdrcGJvZXlqd3pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNTcwMTQsImV4cCI6MjA5MDgzMzAxNH0.2085D2_YQYSqFSLHnsIEppDgwcvZmBt0_Nysmkqw34E")

# Global Singleton Client
_supabase_client: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ── Startup / Shutdown ────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lighter startup — no heavy models loaded locally."""
    print("[Sentinel] Running in Compact Mode (Remote Inference).")
    load_video_model() # Configures hints for video detector
    yield
    print("[Sentinel] Shutting down.")

# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="V-Auth — Deepfake Detection API",
    version="1.1.0",
    lifespan=lifespan,
)

# CORS: Whitelist + Global Wildcard Fallback for Dev
ALLOWED_ORIGINS = [
    "http://localhost:5173", 
    "http://127.0.0.1:5173",
    "https://frontend-rho-puce-idsoazw5wz.vercel.app",
    "https://v-auth-omega.vercel.app", # Added additional production domain
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Optimized Auth using the global client's auth methods."""
    token = credentials.credentials
    try:
        user = _supabase_client.auth.get_user(token)
        if not user:
            raise HTTPException(401, "Invalid session")
        return user
    except Exception as e:
        raise HTTPException(401, f"Auth Failed: {str(e)}")

# — Constants ─────────────────────────────────────────────────────────────────
MAX_FILE_SIZE_MB = 100
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/bmp"}
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/quicktime", "video/webm"}

# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {
        "status": "healthy", 
        "mode": "compact_inference", 
        "ram_target": "<512MB",
        "timestamp": time.time()
    }


@app.post("/detect")
async def detect(
    file: UploadFile = File(...), 
    credentials: HTTPAuthorizationCredentials = Depends(security), 
    user=Depends(get_current_user)
):
    t_start = time.time()

    contents = await file.read()
    size_mb = len(contents) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        raise HTTPException(413, f"File size ({size_mb:.1f}MB) exceeds limit.")

    mime = file.content_type or ""

    # — Process Image
    if mime in ALLOWED_IMAGE_TYPES:
        result = await asyncio.to_thread(analyse_image, contents, mime)
        result["media_type"] = "image"

    # — Process Video
    elif mime in ALLOWED_VIDEO_TYPES:
        suffix = _ext_from_mime(mime)
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(contents)
            tmp_path = tmp.name
        try:
            result = await asyncio.to_thread(analyse_video, tmp_path)
            result["media_type"] = "video"
        finally:
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)

    else:
        raise HTTPException(415, f"Unsupported Content-Type: {mime}")

    result["processing_time_ms"] = round((time.time() - t_start) * 1000)

    # — Persist forensic report (Fire & Forget to DB)
    try:
        # Re-use global client but authenticated with the user's token for RLS
        _supabase_client.postgrest.auth(credentials.credentials) 
        _supabase_client.table("scans").insert({
            "user_id": user.user.id,
            "file_name": file.filename,
            "media_type": result["media_type"],
            "prediction": result["prediction"],
            "confidence": result["confidence"],
            "explanation": result.get("explanation", ""),
            "breakdown": result.get("breakdown", {})
        }).execute()
    except Exception as e:
        print(f"[Sentinel] DB Insert Error: {e}")

    return JSONResponse(result)


@app.websocket("/live")
async def websocket_endpoint(websocket: WebSocket):
    """Real-time forensic stream."""
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=4001, reason="No Token")
        return

    try:
        user = _supabase_client.auth.get_user(token)
        if not user:
            await websocket.close(code=4001, reason="Invalid Session")
            return
        await websocket.accept()
        
        while True:
            data = await websocket.receive_text()
            if not data: continue
            
            t_frame = time.time()
            if "," in data:
                data = data.split(",")[1]
            
            img_bytes = base64.b64decode(data)
            result = await asyncio.to_thread(analyse_image, img_bytes, "image/jpeg")
            result["latency_ms"] = round((time.time() - t_frame) * 1000)
            await websocket.send_json(result)

    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"[Sentinel] WS Error: {e}")


def _ext_from_mime(mime: str) -> str:
    return {
        "video/mp4": ".mp4", "video/quicktime": ".mov", "video/webm": ".webm"
    }.get(mime, ".mp4")


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8000)), reload=False)
