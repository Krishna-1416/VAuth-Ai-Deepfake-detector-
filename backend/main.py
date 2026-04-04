"""
V-Auth — FastAPI Deepfake Detection Backend
POST /detect  → analyse image or video file
GET  /health  → liveness probe

Run with:
    python main.py
"""

import os
import time
import tempfile
import asyncio
import base64
import uvicorn
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, UploadFile, HTTPException, WebSocket, WebSocketDisconnect, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from detectors.image_detector import analyse_image, _get_hf_image_pipe
from detectors.video_detector import analyse_video, load_video_model

# ── Startup / shutdown ────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load HuggingFace models once on server start."""
    print("[Sentinel] Loading image AI classifier…")
    _get_hf_image_pipe()
    print("[Sentinel] Loading video deepfake model…")
    load_video_model()
    print("[Sentinel] All models ready. Server is live.")
    yield
    print("[Sentinel] Shutting down.")

# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="V-Auth — Deepfake Detection API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://127.0.0.1:5173",
        "https://frontend-rho-puce-idsoazw5wz.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# — Supabase Auth config
SUPABASE_URL = "https://dfkbrzuzvgkpboeyjwzr.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRma2JyenV6dmdrcGJvZXlqd3pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNTcwMTQsImV4cCI6MjA5MDgzMzAxNH0.2085D2_YQYSqFSLHnsIEppDgwcvZmBt0_Nysmkqw34E"
supabaseClient: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Extract and verify token with Supabase API."""
    token = credentials.credentials
    try:
        # Simple verification by fetching current user data
        # Note: We use the client initialized with the static key to verify the user's token
        user = supabaseClient.auth.get_user(token)
        if not user:
            raise HTTPException(401, "Invalid authentication token")
        return user
    except Exception as e:
        raise HTTPException(401, f"Authentication failed: {str(e)}")

# — Constants ─────────────────────────────────────────────────────────────────
MAX_FILE_SIZE_MB = 200
ALLOWED_IMAGE_TYPES = {
    "image/jpeg", "image/png", "image/webp", "image/bmp", 
    "image/avif", "image/heic", "image/heif", "image/tiff", "image/gif"
}
ALLOWED_VIDEO_TYPES = {
    "video/mp4", "video/quicktime", "video/x-msvideo", "video/webm", "video/x-matroska", "video/ogg"
}

# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok", "version": "1.0.0", "model": "SigLIP2-Deepfake"}


@app.post("/detect")
async def detect(file: UploadFile = File(...), credentials: HTTPAuthorizationCredentials = Depends(security), user=Depends(get_current_user)):
    t_start = time.time()

    # — Validate size
    contents = await file.read()
    size_mb = len(contents) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        raise HTTPException(413, f"File too large ({size_mb:.1f} MB). Max {MAX_FILE_SIZE_MB} MB.")

    mime = file.content_type or ""

    # — Route by MIME type
    if mime in ALLOWED_IMAGE_TYPES:
        result = await asyncio.to_thread(analyse_image, contents, mime)
        result["media_type"] = "image"

    elif mime in ALLOWED_VIDEO_TYPES:
        # Write to temp file so OpenCV can open it
        suffix = _ext_from_mime(mime)
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(contents)
            tmp_path = tmp.name
        try:
            result = await asyncio.to_thread(analyse_video, tmp_path)
            result["media_type"] = "video"
        finally:
            os.unlink(tmp_path)

    else:
        raise HTTPException(415, f"Unsupported media type: {mime}. Send image/* or video/*.")

    result["processing_time_ms"] = round((time.time() - t_start) * 1000)

    # — Persist forensic report to Database
    try:
        # Create a request-specific client with the user's token
        # This ensures RLS allows the insert for this user_id
        auth_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        auth_client.postgrest.auth(credentials.credentials) 

        auth_client.table("scans").insert({
            "user_id": user.user.id,
            "file_name": file.filename,
            "media_type": result["media_type"],
            "prediction": result["prediction"],
            "confidence": result["confidence"],
            "explanation": result.get("explanation", ""),
            "breakdown": result.get("breakdown", {})
        }).execute()
        print(f"[Sentinel] Forensic report persisted for {user.user.email} ✓")
    except Exception as e:
        print(f"[Sentinel] Database persistence failed: {str(e)}")

    return JSONResponse(result)


@app.websocket("/live")
async def websocket_endpoint(websocket: WebSocket):
    """Real-time forensic analysis stream with authentication."""
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=4001, reason="Missing authentication token")
        return

    try:
        user = supabaseClient.auth.get_user(token)
        if not user:
            await websocket.close(code=4001, reason="Invalid authentication token")
            return
    except Exception as e:
        await websocket.close(code=4001, reason=f"Authentication failed: {str(e)}")
        return

    await websocket.accept()
    print(f"[Sentinel] Live monitor link validated for {user.user.email} ✓")
    
    try:
        while True:
            # Receive frame as base64 string
            data = await websocket.receive_text()
            if not data: continue
            
            t_frame = time.time()
            
            try:
                # Strip base64 header if present
                if "," in data:
                    data = data.split(",")[1]
                
                # Decode and analyse
                img_bytes = base64.b64decode(data)
                result = await asyncio.to_thread(analyse_image, img_bytes, "image/jpeg")
                
                # Add metadata
                result["latency_ms"] = round((time.time() - t_frame) * 1000)
                result["timestamp"]  = time.time()
                
                # Stream back
                await websocket.send_json(result)
                
            except Exception as e:
                print(f"[Sentinel] Frame error: {str(e)}")
                await websocket.send_json({"error": "processing_failed", "msg": str(e)})

    except WebSocketDisconnect:
        print("[Sentinel] Live monitor disconnected.")


# ── Helpers ───────────────────────────────────────────────────────────────────

def _ext_from_mime(mime: str) -> str:
    return {
        "video/mp4": ".mp4",
        "video/quicktime": ".mov",
        "video/x-msvideo": ".avi",
        "video/webm": ".webm",
        "video/x-matroska": ".mkv",
    }.get(mime, ".mp4")


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
