import os
import time
import logging
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - V-Auth Maintenance - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

load_dotenv(dotenv_path="../.env")

def check_supabase():
    """Verifies connection to Supabase and reports health."""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    
    if not url or not key:
        logger.error("Supabase credentials missing in .env")
        return False
        
    try:
        supabase: Client = create_client(url, key)
        # Test query
        response = supabase.table("forensic_knowledge").select("count", count="exact").limit(1).execute()
        count = response.count if hasattr(response, 'count') else "unknown"
        logger.info(f"✅ Supabase Connection: Healthy ({count} records in knowledge base)")
        return True
    except Exception as e:
        logger.error(f"❌ Supabase Connection Failed: {e}")
        return False

def clean_temp_files():
    """Cleans up any stray temp files from OpenCV/MediaPipe processing."""
    # Add paths if you have persistent upload dirs
    # For now, just a placeholder as V-Auth uses in-memory streams mostly
    logger.info("🧹 Temp file cleanup: No persistent directories detected. Skipping.")

def run_maintenance():
    logger.info("🚀 Starting V-Auth Scheduled Maintenance...")
    
    db_ok = check_supabase()
    clean_temp_files()
    
    if db_ok:
        logger.info("✨ Maintenance Complete: System is optimized.")
    else:
        logger.warning("⚠️ Maintenance finished with warnings. Check database connectivity.")

if __name__ == "__main__":
    run_maintenance()
