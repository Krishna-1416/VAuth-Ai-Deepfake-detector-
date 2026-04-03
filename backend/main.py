"""
Sentinel Core — FastAPI Deepfake Detection Backend
POST /detect  → analyse image or video file
GET  /health  → liveness probe

Run with:
    python main.py
"""

import os
import time
import tempfile
import asyncio
import uvicorn
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, UploadFile, HTTPException
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
    title="Sentinel Core — Deepfake Detection API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# ── Constants ─────────────────────────────────────────────────────────────────

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
async def detect(file: UploadFile = File(...)):
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
    return JSONResponse(result)


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
