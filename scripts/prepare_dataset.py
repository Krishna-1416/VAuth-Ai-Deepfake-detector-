import csv
import json
import random
import os

def generate_fake_reasoning(method):
    if 'GAN' in method:
        return "Analysis reveals unnatural background blending, asymmetric specular highlights in the eyes, and inconsistent hair textures which are hallmark artifacts of GAN-based synthesis."
    elif 'Diffusion' in method:
        return "The image contains minor structural impossibilities and over-smoothed skin patches typical of latent diffusion models."
    elif 'FaceSwap' in method:
        return "Detected distinct edge anomalies around the jawline and inconsistent lighting on the central face compared to the environment, indicating a potential face swap."
    else:
        return "Visual inspection indicates abnormal high-frequency noise patterns and inconsistent lighting cues suggestive of digital manipulation."

def generate_real_reasoning():
    reasons = [
        "The image exhibits natural lighting dynamics, consistent shadows, and realistic skin texture with no visible blending artifacts.",
        "Analysis shows appropriate depth of field, consistent specular reflections, and biologically plausible facial geometry.",
        "No digital tampering or generative artifacts detected. The frequency distribution matches natural photography."
    ]
    return random.choice(reasons)

def process_datasets():
    os.makedirs('datasets', exist_ok=True)
    output_path = 'datasets/gemma4_finetune_dataset.jsonl'
    
    with open('datasets/FINAL_DATASET.csv', 'r', encoding='utf-8') as f_in, open(output_path, 'w', encoding='utf-8') as f_out:
        reader = csv.DictReader(f_in)
        for row in reader:
            image_url = row.get('image_url', '')
            label = row.get('label', '').upper()
            method = row.get('fake_method', 'None')
            
            if label == 'FAKE':
                reasoning = generate_fake_reasoning(method)
                prob = round(random.uniform(0.85, 0.99), 2)
            else:
                reasoning = generate_real_reasoning()
                prob = round(random.uniform(0.01, 0.15), 2)
                
            assistant_response = {
                "score": prob,
                "reasoning": reasoning
            }
            
            # OpenAI / Hugging Face conversation format for Vision models
            item = {
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": "Analyze this image for deepfake artifacts. Return JSON with 'score' (probability of fake) and 'reasoning'."},
                            {"type": "image_url", "image_url": {"url": image_url}}
                        ]
                    },
                    {
                        "role": "assistant",
                        "content": json.dumps(assistant_response)
                    }
                ]
            }
            
            f_out.write(json.dumps(item) + '\n')
            
    print(f"Successfully generated dataset at {output_path}")

if __name__ == '__main__':
    process_datasets()
