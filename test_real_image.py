import asyncio
import os
import sys
from dotenv import load_dotenv

# Ensure we can find the agents and backend
sys.path.append(os.getcwd())

from agents.orchestrator import ForensicOrchestrator

load_dotenv()

async def test_real_image():
    print("🚀 Starting real image forensic test...")
    orchestrator = ForensicOrchestrator()
    
    image_path = 'frontend/src/assets/hero.png'
    if not os.path.exists(image_path):
        print(f"❌ Error: {image_path} not found.")
        return

    with open(image_path, 'rb') as f:
        image_data = f.read()
    
    query = "Perform a deepfake forensic analysis on this image."
    
    print(f"Scanning {image_path} ({len(image_data)} bytes)...")
    try:
        async for update in orchestrator.run_forensic_analysis_stream(query, image_data, "image", "image/png"):
            print(f"[{update['status']}] {update.get('message', '')}")
            if update['status'] == 'Complete':
                print("\n✅ ANALYSIS COMPLETE!")
                res = update['result']
                print(f"VERDICT: {res['prediction']}")
                print(f"CONFIDENCE: {res['confidence']}")
                print(f"EXPLANATION: {res['explanation'][:200]}...")
            elif update['status'] == 'failed':
                print(f"❌ FAILED: {update['error']}")
    except Exception as e:
        print(f"❌ EXECUTION ERROR: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_real_image())
