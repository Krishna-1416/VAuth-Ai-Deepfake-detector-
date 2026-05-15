import os
from typing import List
from dotenv import load_dotenv
from supabase import create_client, Client
from langchain_community.vectorstores import SupabaseVectorStore
from langchain_core.embeddings import Embeddings
from google import genai

load_dotenv()

class GoogleGenAIEmbeddings(Embeddings):
    """
    LangChain-compatible embeddings using the new google.genai SDK.
    """
    def __init__(self, api_key: str):
        self.client = genai.Client(api_key=api_key)
        self.model = "models/gemini-embedding-2"

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        # Google API supports batching
        response = self.client.models.embed_content(
            model=self.model,
            contents=texts
        )
        return [item.values for item in response.embeddings]

    def embed_query(self, text: str) -> List[float]:
        response = self.client.models.embed_content(
            model=self.model,
            contents=text
        )
        return response.embeddings[0].values

class FactChecker:
    """
    Fact-Checker Agent: Retrieves grounded forensic heuristics from 
    Supabase pgvector using Google Embeddings.
    """
    def __init__(self):
        self.supabase_url = os.getenv("SUPABASE_URL")
        self.supabase_key = os.getenv("SUPABASE_KEY")
        self.supabase: Client = create_client(self.supabase_url, self.supabase_key)
        
        # Consolidate on Google AI for maximum reliability
        api_key = os.getenv("GOOGLE_API_KEY")
        self.embeddings = GoogleGenAIEmbeddings(api_key=api_key)
        
        self.vector_store = SupabaseVectorStore(
            client=self.supabase,
            embedding=self.embeddings,
            table_name="forensic_knowledge",
            query_name="match_documents"
        )

    def retrieve_context(self, query: str, k: int = 3):
        """
        Performs semantic search to find forensic artifacts in our DB.
        """
        try:
            results = self.vector_store.similarity_search(query, k=k)
            if not results:
                return "No specific forensic matches found. Proceed with direct visual inspection."
            return "\n".join([f"- {doc.page_content}" for doc in results])
        except Exception as e:
            print(f"ERROR: FactChecker retrieval failed: {e}")
            return "Knowledge base unavailable. Relying on visual artifacts only."

if __name__ == "__main__":
    checker = FactChecker()
    print("Fact-Checker Agent ready with Google Embeddings.")
