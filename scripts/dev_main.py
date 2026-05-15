import os
import asyncio
import json
import cv2
import uuid
from typing import List, Optional

from fastapi import FastAPI, UploadFile, File, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from sse_starlette.sse import EventSourceResponse

from agents.orchestrator import ForensicOrchestrator
from utils.video_processor import VideoProcessor

load_dotenv()

app = FastAPI(title="VAuth AI Forensic Backend")

# Enable CORS for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# NOTE: ForensicOrchestrator takes ~22s to initialize due to
# langchain_huggingface (torch/transformers) being loaded.
# This is a one-time cost at startup — all subsequent requests are fast.
print("VAuth: Initializing forensic agents (this takes ~20-25s on first boot)...")
orchestrator = ForensicOrchestrator()
print("VAuth: All agents ready. Server accepting requests.")

# Response model
class AnalysisResponse(BaseModel):
    task_id: str
    status: str
    message: str

# In-memory task store
tasks = {}
task_queues = {}


@app.get("/health")
async def health():
    return {"status": "ok", "agents": "ready"}


@app.get("/events/{task_id}")
async def events(task_id: str):
    """SSE endpoint to stream forensic agent progress."""
    if task_id not in task_queues:
        raise HTTPException(status_code=404, detail="Task not found")

    async def event_generator():
        queue = task_queues[task_id]
        while True:
            data = await queue.get()
            yield {"data": json.dumps(data)}
            if data.get("status") in ("Complete", "failed"):
                break

    return EventSourceResponse(event_generator())


@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_image(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    query: Optional[str] = "Perform a general deepfake forensic analysis.",
):
    """Endpoint for single image analysis."""
    task_id = str(uuid.uuid4())
    tasks[task_id] = {"status": "processing", "result": None}
    task_queues[task_id] = asyncio.Queue()

    image_bytes = await file.read()
    background_tasks.add_task(run_forensic_task, task_id, query, image_bytes)

    return {
        "task_id": task_id,
        "status": "processing",
        "message": f"Forensic agents dispatched. Listen to /events/{task_id}",
    }


async def run_forensic_task(task_id: str, query: str, image_bytes: bytes):
    """Background worker for image analysis."""
    try:
        queue = task_queues[task_id]
        async for update in orchestrator.run_forensic_analysis_stream(query, image_bytes, "image", "image/jpeg"):
            await queue.put(update)
            if update["status"] == "Complete":
                tasks[task_id] = {"status": "completed", "result": update["result"]}
    except Exception as e:
        error_msg = {"status": "failed", "error": str(e)}
        await task_queues[task_id].put(error_msg)
        tasks[task_id] = error_msg


@app.post("/analyze/video", response_model=AnalysisResponse)
async def analyze_video(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    query: Optional[str] = "Perform a general deepfake forensic analysis on this video.",
):
    """Endpoint for video analysis using random frame sampling."""
    task_id = str(uuid.uuid4())
    tasks[task_id] = {"status": "processing", "result": None}
    task_queues[task_id] = asyncio.Queue()

    video_bytes = await file.read()
    temp_video_path = VideoProcessor.save_temp_video(video_bytes)
    background_tasks.add_task(run_video_forensic_task, task_id, query, temp_video_path)

    return {
        "task_id": task_id,
        "status": "processing",
        "message": f"Video frames being extracted. Listen to /events/{task_id}",
    }


async def run_video_forensic_task(task_id: str, query: str, video_path: str):
    """Background worker for video analysis."""
    try:
        queue = task_queues[task_id]
        await queue.put({"status": "Extracting Frames", "message": "Selecting random frames from video..."})

        frames = VideoProcessor.extract_random_frames(video_path, num_frames=3)
        if os.path.exists(video_path):
            os.remove(video_path)

        await queue.put({"status": "Frames Ready", "message": f"Extracted {len(frames)} frames. Analyzing primary sample..."})

        # Analyze first frame
        _, buffer = cv2.imencode(".jpg", cv2.cvtColor(frames[0], cv2.COLOR_RGB2BGR))
        image_bytes = buffer.tobytes()

        async for update in orchestrator.run_forensic_analysis_stream(query, image_bytes, "image", "image/jpeg"):
            await queue.put(update)
            if update["status"] == "Complete":
                tasks[task_id] = {"status": "completed", "result": update["result"]}

    except Exception as e:
        error_msg = {"status": "failed", "error": str(e)}
        await task_queues[task_id].put(error_msg)
        tasks[task_id] = error_msg
        if os.path.exists(video_path):
            os.remove(video_path)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
