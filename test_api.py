import os
import sys
from dotenv import load_dotenv
from google import genai

# Load environment variables
load_dotenv()

def test_api():
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        print("❌ Error: GOOGLE_API_KEY not found in environment!")
        return

    print(f"Connecting to Google AI Studio with key: {api_key[:10]}...")
    client = genai.Client(api_key=api_key)
    model_id = "models/gemma-4-26b-a4b-it"

    try:
        print(f"Testing model: {model_id}...")
        response = client.models.generate_content(
            model=model_id,
            contents="Say 'API is active' if you can hear me."
        )
        
        if response and response.text:
            print(f"✅ Success! Model responded: {response.text.strip()}")
        else:
            print("⚠️ Warning: API responded but returned no text.")
            
    except Exception as e:
        print(f"❌ API Error: {str(e)}")

if __name__ == "__main__":
    test_api()
