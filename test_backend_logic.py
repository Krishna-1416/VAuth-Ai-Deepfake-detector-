import asyncio
import os
import sys
from dotenv import load_dotenv

# Add project root to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from agents.orchestrator import ForensicOrchestrator

load_dotenv()

async def test_orchestrator():
    print("Testing Forensic Orchestrator...")
    orchestrator = ForensicOrchestrator()
    
    # Create a dummy image (just for testing logic, won't be a real face)
    dummy_data = b"fake image data"
    
    query = "Analyze this image for deepfakes."
    
    print("Starting analysis stream...")
    try:
        async for update in orchestrator.run_forensic_analysis_stream(query, dummy_data, "image", "image/jpeg"):
            print(f"Update: {update['status']} - {update.get('message', '')}")
            if update['status'] == 'Complete':
                print("✅ Test Successful!")
                print(f"Result: {update['result']['prediction']} with {update['result']['confidence']} confidence")
            elif update['status'] == 'failed':
                print(f"❌ Test Failed: {update['error']}")
    except Exception as e:
        print(f"❌ Execution Error: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_orchestrator())
