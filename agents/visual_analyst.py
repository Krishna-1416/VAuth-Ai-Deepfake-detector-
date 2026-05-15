import os
from google import genai
from google.genai import types

class VisualAnalyst:
    """
    Forensic Agent using strictly Gemma 4 26B (Multimodal Vision).
    Natively analyzes images for pixel-level deepfake artifacts.
    """
    def __init__(self):
        api_key = os.getenv("GOOGLE_API_KEY")
        self.client = genai.Client(api_key=api_key)
        self.model_id = "models/gemma-4-26b-a4b-it"
        print(f"Visual Analyst: Connected to Google AI Studio (NATIVE VISION: Gemma 4 26B)")

    def analyze(self, heuristics_context: str, image_bytes: bytes = None) -> str:
        """
        Performs multimodal forensic reasoning using Gemma 4's native vision capabilities.
        """
        prompt = f"""You are the V-Auth Forensic AI. 
Analyze the provided image and computer vision heuristics to determine if this is a deepfake.

HEURISTICS CONTEXT:
{heuristics_context}

INSTRUCTIONS:
1. Examine the image pixels for GAN artifacts, blending inconsistencies, and unnatural biological markers.
2. Cross-reference your visual findings with the HEURISTICS DATA provided.
3. Provide a final verdict: AUTHENTIC, DEEPFAKE, or SUSPICIOUS.
4. Keep the explanation concise and technical (3-5 sentences max).

FORENSIC REPORT:"""

        try:
            content = [prompt]
            if image_bytes:
                # Gemma 4 26B supports native vision via Parts
                content.append(types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"))

            response = self.client.models.generate_content(
                model=self.model_id,
                contents=content,
                config=types.GenerateContentConfig(
                    max_output_tokens=512,
                    temperature=0.1,
                )
            )
            
            if response and response.text:
                return response.text.strip()
            return "Visual analysis failed to generate a report."
        except Exception as e:
            print(f"Visual Analyst Error: {str(e)}")
            return f"Forensic analysis error: {str(e)}"
