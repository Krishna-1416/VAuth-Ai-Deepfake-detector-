import subprocess
import os

def set_vercel_env(name, value, environment="production"):
    print(f"Setting {name} on Vercel ({environment})...")
    # Using subprocess.Popen to handle interactive prompts
    # Prompt 1: VITE_ prefix warning -> Send Enter (Leave as is)
    # Prompt 2: Encrypted/Sensitive? -> Send 'y' and Enter
    # Prompt 3: Value -> Send value and Enter
    
    cmd = ["vercel", "env", "add", name, environment]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, cwd="frontend")
    
    # Sequence of inputs
    # First newline for the "Leave as is" choice
    # 'y' for sensitive
    # value for the actual content
    inputs = "\ny\n" + value + "\n"
    
    stdout, stderr = proc.communicate(input=inputs)
    print(stdout)
    if stderr:
        print(f"Error for {name}: {stderr}")

def main():
    envs = {
        "VITE_SUPABASE_URL": "https://dfkbrzuzvgkpboeyjwzr.supabase.co",
        "VITE_SUPABASE_ANON_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRma2JyenV6dmdrcGJvZXlqd3pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNTcwMTQsImV4cCI6MjA5MDgzMzAxNH0.2085D2_YQYSqFSLHnsIEppDgwcvZmBt0_Nysmkqw34E",
        "VITE_API_URL": "https://ignition-hackverse-decodex.onrender.com"
    }
    
    for name, value in envs.items():
        set_vercel_env(name, value)
        
    print("Triggering production deployment...")
    subprocess.run(["vercel", "--prod", "--yes"], cwd="frontend")

if __name__ == "__main__":
    main()
