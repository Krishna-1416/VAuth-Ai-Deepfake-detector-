import os
from dotenv import load_dotenv
from supabase import create_client, Client
from google import genai
import numpy as np

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

if not SUPABASE_URL or "your-project" in SUPABASE_URL:
    print("❌ Error: Please update your .env file with real Supabase credentials!")
    exit(1)

if not GOOGLE_API_KEY:
    print("❌ Error: Please set GOOGLE_API_KEY in your .env file!")
    exit(1)

# Initialize Supabase and Google GenAI Client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
client = genai.Client(api_key=GOOGLE_API_KEY)
EMBEDDING_MODEL = "models/gemini-embedding-2"

# Curated Forensic Knowledge Base for Deepfake Detection
FORENSIC_DATA = [
    {
        "content": "Specular reflections in the eyes of GAN-generated faces are often physically inconsistent or missing matching patterns across both eyes.",
        "category": "Visual",
        "source_link": "https://arxiv.org/abs/2009.11924"
    },
    {
        "content": "Deepfake videos frequently exhibit temporal flickering or 'jitter' around the jawline and hair edges where the mask blending occurs.",
        "category": "Visual",
        "source_link": "https://ieeexplore.ieee.org/document/9022530"
    },
    {
        "content": "Inconsistent head poses or 'floating' facial features relative to the background often indicate frame-by-frame facial replacement.",
        "category": "Visual",
        "source_link": "Scientific American: How to Spot a Deepfake"
    },
    {
        "content": "Lip-sync errors where the 'M', 'B', and 'P' sounds are made without the lips touching (non-occlusive) are common in early-stage lip-sync models.",
        "category": "Audio/Visual",
        "source_link": "Forensic Science International"
    },
    {
        "content": "Biological signals such as the lack of natural blinking (the 'blinking problem') or missing pulse-induced skin color changes (PPG) are strong fake indicators.",
        "category": "Biological",
        "source_link": "https://arxiv.org/abs/1806.02877"
    },
    {
        "content": "Metadata analysis showing missing EXIF data or camera-specific fingerprinting (PRNU) mismatches suggests the image was not captured by a physical sensor.",
        "category": "Metadata",
        "source_link": "Digital Image Forensics"
    }
]

def populate():
    print(f"Starting population of {len(FORENSIC_DATA)} forensic facts using Google Embeddings...")
    
    for item in FORENSIC_DATA:
        print(f"Processing: {item['content'][:50]}...")
        
        # Generate embedding using Google API
        try:
            response = client.models.embed_content(
                model=EMBEDDING_MODEL,
                contents=item['content']
            )
            embedding = response.embeddings[0].values
        except Exception as e:
            print(f"Embedding error for item: {item['content'][:20]}... Error: {e}")
            continue
        
        # Insert into Supabase - matching the schema: content, embedding, metadata
        data = {
            "content": item['content'],
            "embedding": embedding,
            "metadata": {
                "category": item['category'],
                "source_link": item['source_link']
            }
        }
        
        try:
            response = supabase.table("forensic_knowledge").insert(data).execute()
        except Exception as insert_error:
            print(f"Insert error for item: {item['content'][:20]}... Error: {insert_error}")
            raise insert_error
        
    print("Successfully populated forensic_knowledge table!")

if __name__ == "__main__":
    try:
        populate()
    except Exception as e:
        print(f"Error occurred: {e}")
        print("\nTip: Make sure you ran the SQL schema in Supabase first!")
