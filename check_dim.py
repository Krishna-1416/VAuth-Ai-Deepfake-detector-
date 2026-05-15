import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

def check_dimensions():
    api_key = os.getenv("GOOGLE_API_KEY")
    client = genai.Client(api_key=api_key)
    model = "models/gemini-embedding-2"
    
    text = "Forensic testing"
    response = client.models.embed_content(
        model=model,
        contents=text
    )
    dim = len(response.embeddings[0].values)
    print(f"Model: {model}")
    print(f"Produced dimension: {dim}")

if __name__ == "__main__":
    check_dimensions()
