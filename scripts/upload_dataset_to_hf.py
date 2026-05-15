import os
from huggingface_hub import HfApi

api = HfApi()

# We use the token from environment
TOKEN = os.getenv("HUGGINGFACE_API_KEY")

# We use the user's Hugging Face username
REPO_ID = "iamkrishna57/gemma4-deepfake-dataset"

print(f"Creating dataset repository {REPO_ID} on Hugging Face...")
api.create_repo(repo_id=REPO_ID, repo_type="dataset", token=TOKEN, exist_ok=True)

print("Uploading gemma4_finetune_dataset.jsonl...")
api.upload_file(
    path_or_fileobj="datasets/gemma4_finetune_dataset.jsonl",
    path_in_repo="gemma4_finetune_dataset.jsonl",
    repo_id=REPO_ID,
    repo_type="dataset",
    token=TOKEN
)

print(f"Success! Dataset uploaded to https://huggingface.co/datasets/{REPO_ID}")
