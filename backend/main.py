"""
V-Auth — FastAPI Deepfake Detection Backend (Compact Edition)
- Memory-optimized for Render Free Tier (<512MB RAM)
- No local ML frameworks (Hugging Face Inference API)
- Singleton Supabase Client
"""

import os
import sys
import time
import tempfile
import asyncio
import base64
import requests
import uvicorn
import json
from typing import Optional, List, Union, Any
from dotenv import load_dotenv

from fastapi import FastAPI, File, UploadFile, HTTPException, WebSocket, WebSocketDisconnect, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from detectors.image_detector import analyse_image
from detectors.video_detector import analyse_video

# Integrate Forensic Orchestrator (Gemma 4 powered)
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from agents.orchestrator import ForensicOrchestrator

# Load environment variables
load_dotenv()

# Instantiate Orchestrator
orchestrator = ForensicOrchestrator()

# ── Configuration ────────────────────────────────────────────────────────────

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://dfkbrzuzvgkpboeyjwzr.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRma2JyenV6dmdrcGJvZXlqd3pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNTcwMTQsImV4cCI6MjA5MDgzMzAxNH0.2085D2_YQYSqFSLHnsIEppDgwcvZmBt0_Nysmkqw34E")

# Global Singleton Client
_supabase_client: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ── Startup / Shutdown ────────────────────────────────────────────────────────

async def cleanup_tasks_loop():
    """Background task to clear old tasks and save memory."""
    while True:
        await asyncio.sleep(3600)  # Every hour
        now = time.time()
        # Remove tasks older than 1 hour
        to_delete = [tid for tid, t in tasks.items() if now - t.get("created_at", 0) > 3600]
        if to_delete:
            print(f"[V-Auth] Maintenance: Purging {len(to_delete)} old tasks.")
            for tid in to_delete:
                if tid in tasks:
                    del tasks[tid]

async def lifespan(app: FastAPI):
    """Startup - V-Auth Forensic Engine."""
    print("[V-Auth] Starting up...")
    # Start maintenance task
    maintenance_task = asyncio.create_task(cleanup_tasks_loop())
    yield
    maintenance_task.cancel()
    print("[V-Auth] Shutting down.")

# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="V-Auth — Deepfake Detection API (Gemma 4 Edition)",
    version="1.2.0",
    lifespan=lifespan,
)

# CORS: Whitelist + Global Wildcard Fallback for Dev
ALLOWED_ORIGINS = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))):
    """Optional Auth: Returns user if token is valid, else returns a guest identity."""
    if not credentials:
        return None # Guest
    
    token = credentials.credentials
    try:
        user = _supabase_client.auth.get_user(token)
        return user
    except Exception:
        return None # Invalid token also treated as guest

# — Constants ─────────────────────────────────────────────────────────────────
MAX_FILE_SIZE_MB = 100
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/bmp"}
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/quicktime", "video/webm"}

# ── Routes ────────────────────────────────────────────────────────────────────

import uuid
from sse_starlette.sse import EventSourceResponse

# ── State ─────────────────────────────────────────────────────────────────────
tasks = {}

async def run_analysis_task(task_id: str, contents: bytes, mime: str, filename: str, user_id: str, token: str):
    # Update existing task object rather than overwriting (to preserve 'logs')
    tasks[task_id].update({
        "status": "processing",
        "created_at": time.time()
    })
    
    media_type = "video" if mime in ALLOWED_VIDEO_TYPES else "image"
    query = f"Perform a deepfake forensic analysis on this {media_type}."
    
    try:
        # Use Orchestrator stream
        async for update in orchestrator.run_forensic_analysis_stream(query, contents, media_type, mime):
            if update["status"] == "failed":
                raise Exception(update["error"])
            
            if update["status"] == "Complete":
                result = update["result"]
                tasks[task_id]["result"] = result
                tasks[task_id]["status"] = "completed"
                tasks[task_id]["logs"].append("Forensic report generated.")
                
                # Persist to DB
                try:
                    if token:
                        _supabase_client.auth.set_session(token, refresh_token="")
                    _supabase_client.table("scans").insert({
                        "user_id": user_id,
                        "file_name": filename,
                        "media_type": media_type,
                        "prediction": result.get("prediction", "Unknown"),
                        "confidence": result.get("confidence", 0.5),
                        "explanation": result.get("explanation", ""),
                        "breakdown": result.get("breakdown", {})
                    }).execute()
                except Exception as db_err:
                    print(f"[V-Auth] DB Error: {db_err}")
            else:
                tasks[task_id]["logs"].append(update["message"])
        
    except Exception as e:
        print(f"[V-Auth] Task {task_id} Failed: {e}")
        tasks[task_id]["status"] = "failed"
        tasks[task_id]["logs"].append(f"Error: {str(e)}")

# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {"message": "V-Auth API is running", "docs": "/docs"}

@app.get("/health")
async def health():
    return {"status": "healthy", "timestamp": time.time()}

@app.post("/analyze")
async def analyze_v2(
    file: UploadFile = File(...),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False)),
    user=Depends(get_current_user)
):
    task_id = str(uuid.uuid4())
    contents = await file.read()
    
    tasks[task_id] = {
        "status": "queued",
        "logs": ["Forensic pipeline initialized..."],
    }
    
    # Try to preload local model (non-blocking if it fails)
    use_local = os.getenv("USE_LOCAL_MODEL", "false").lower() == "true"
    user_id = user.user.id if user and hasattr(user, 'user') else "guest"
    token = credentials.credentials if credentials else None
    
    # Start background task
    asyncio.create_task(run_analysis_task(
        task_id, contents, file.content_type, file.filename, user_id, token
    ))
    
    return {"task_id": task_id}

@app.post("/analyze/video")
async def analyze_video_v2(
    file: UploadFile = File(...),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False)),
    user=Depends(get_current_user)
):
    return await analyze_v2(file, credentials, user)

@app.get("/events/{task_id}")
async def events(task_id: str):
    async def event_generator():
        last_log_idx = 0
        while True:
            if task_id not in tasks:
                yield {"event": "error", "data": "Task not found"}
                break
            
            task = tasks[task_id]
            
            # Send new logs (with safety check)
            if "logs" in task:
                while last_log_idx < len(task["logs"]):
                yield {
                    "data": json.dumps({
                        "status": "processing", 
                        "message": task["logs"][last_log_idx]
                    })
                }
                last_log_idx += 1
            
            if task["status"] == "completed":
                yield {
                    "data": json.dumps({
                        "status": "Complete", 
                        "result": task["result"]
                    })
                }
                break
            
            if task["status"] == "failed":
                yield {
                    "data": json.dumps({
                        "status": "failed", 
                        "message": "Analysis failed"
                    })
                }
                break
                
            await asyncio.sleep(0.1)

    return EventSourceResponse(event_generator())




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
        print(f"[V-Auth] WS Error: {e}")


def _ext_from_mime(mime: str) -> str:
    return {
        "video/mp4": ".mp4", "video/quicktime": ".mov", "video/webm": ".webm"
    }.get(mime, ".mp4")


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8000)), reload=False)
