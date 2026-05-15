import os
import sys
import json
import tempfile
import asyncio
from typing import TypedDict, List, Union, Optional
from dotenv import load_dotenv
from langgraph.graph import StateGraph, END
from agents.visual_analyst import VisualAnalyst
from agents.fact_checker import FactChecker

# Ensure we can import from the backend directory
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from backend.detectors.image_detector import analyse_image
from backend.detectors.video_detector import analyse_video

load_dotenv()

# Define the state of our forensic workflow
class ForensicState(TypedDict):
    query: str
    media_data: bytes
    media_type: str # 'image' or 'video'
    mime_type: str
    retrieved_heuristics: str
    cv_scores: dict
    visual_analysis: str
    final_report: Union[str, dict]

class ForensicOrchestrator:
    """
    Orchestrator Agent: Manages the multi-agent workflow using LangGraph.
    Coordinates between the CV Engine, Fact-Checker (RAG) and Visual Analyst (Gemma 4).
    """
    def __init__(self):
        self.analyst = VisualAnalyst()
        self.fact_checker = FactChecker()
        self.workflow = self._build_workflow()

    def _build_workflow(self):
        graph = StateGraph(ForensicState)

        # Node 1: Run CV Scan + Retrieve forensic knowledge
        async def retrieve_heuristics_node(state: ForensicState):
            print(f"Agent: Fact-Checker is searching knowledge base for {state['media_type']}...")
            
            # 1. Run CV Engine
            cv_results = {}
            if state.get("media_data"):
                try:
                    if state["media_type"] == "image":
                        print("Engine: Computer Vision is scanning image for artifacts...")
                        # Run blocking CV code in a thread
                        cv_results = await asyncio.to_thread(analyse_image, state["media_data"], state["mime_type"])
                    else:
                        print("Engine: Video Processor is sampling keyframes...")
                        suffix = ".mp4" if "mp4" in state["mime_type"] else ".mov"
                        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
                            tmp.write(state["media_data"])
                            tmp_path = tmp.name
                        try:
                            # Run blocking video code in a thread
                            cv_results = await asyncio.to_thread(analyse_video, tmp_path)
                        finally:
                            if os.path.exists(tmp_path):
                                os.unlink(tmp_path)
                except Exception as e:
                    print(f"DEBUG: CV Engine error: {e}")
            
            # 2. Run RAG Search (also blocking, so to_thread)
            heuristics = await asyncio.to_thread(self.fact_checker.retrieve_context, state["query"])
            
            return {
                "retrieved_heuristics": heuristics,
                "cv_scores": cv_results
            }

        # Node 2: Analyze visuals with Gemma 4
        async def analyze_visuals_node(state: ForensicState):
            print("Agent: Visual Analyst (Gemma 4) is performing forensic reasoning...")
            
            cv_data = json.dumps(state.get("cv_scores", {}), indent=2)
            context = f"""[COMPUTER VISION SIGNALS]
{cv_data}

[FORENSIC KNOWLEDGE BASE]
{state['retrieved_heuristics']}

[USER QUERY]
{state['query']}"""

            image_bytes = state["media_data"] if state["media_type"] == "image" else None
            # The genai SDK call is blocking, so use to_thread
            analysis = await asyncio.to_thread(self.analyst.analyze, context, image_bytes)
            return {"visual_analysis": analysis}

        # Node 3: Synthesize final forensic report
        async def synthesize_report_node(state: ForensicState):
            print("Agent: Orchestrator is synthesizing final report...")
            
            analysis_text = state['visual_analysis'].lower()
            
            # 1. Start with engine results or defaults
            engine_result = state.get("cv_scores", {})
            
            # 2. Determine fallback prediction based on agent reasoning if engine failed
            if not engine_result or not engine_result.get("prediction"):
                is_fake = any(word in analysis_text for word in ["deepfake", "artificial", "synthetic", "manipulated", "artifact", "fake"])
                prediction = "Synthetic" if is_fake else "Authentic"
                confidence = 0.85 if is_fake else 0.88
                
                report = {
                    "prediction": prediction,
                    "confidence": confidence,
                    "breakdown": {
                        "model_score": confidence if is_fake else 1 - confidence
                    }
                }
            else:
                report = engine_result.copy()
            
            # 3. Always enrich with agent reasoning
            report["explanation"] = state['visual_analysis']
            report["heuristics_used"] = state['retrieved_heuristics']
            
            return {"final_report": report}

        # Define the structure
        graph.add_node("retrieve", retrieve_heuristics_node)
        graph.add_node("analyze", analyze_visuals_node)
        graph.add_node("synthesize", synthesize_report_node)

        graph.set_entry_point("retrieve")
        graph.add_edge("retrieve", "analyze")
        graph.add_edge("analyze", "synthesize")
        graph.add_edge("synthesize", END)

        return graph.compile()

    async def run_forensic_analysis_stream(self, query: str, media_data: bytes, media_type: str, mime_type: str):
        """
        Executes the workflow and streams status updates asynchronously.
        """
        print(f"DEBUG: Starting forensic analysis for {media_type}...")
        initial_state = {
            "query": query,
            "media_data": media_data,
            "media_type": media_type,
            "mime_type": mime_type,
            "retrieved_heuristics": "",
            "cv_scores": {},
            "visual_analysis": "",
            "final_report": ""
        }
        
        try:
            async for output in self.workflow.astream(initial_state):
                for key, value in output.items():
                    if key == "retrieve":
                        yield {"status": "Processing Media", "message": "Extracting forensic signatures and querying knowledge base..."}
                    elif key == "analyze":
                        yield {"status": "Neural Analysis", "message": "Gemma 4 is performing pixel-level forensic reasoning..."}
                    elif key == "synthesize":
                        yield {"status": "Finalizing", "message": "Synthesizing forensic report..."}
                        yield {"status": "Complete", "result": value["final_report"]}
        except Exception as e:
            print(f"DEBUG: Workflow stream error: {str(e)}")
            yield {"status": "failed", "error": f"Orchestrator Error: {str(e)}"}

if __name__ == "__main__":
    orchestrator = ForensicOrchestrator()
    print("Forensic Orchestrator ready.")
