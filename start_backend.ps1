# start_backend.ps1
# One-command: install deps + launch Sentinel Core backend
# Usage: .\start_backend.ps1

Set-Location "$PSScriptRoot\backend"

Write-Host "`n[Sentinel] Checking Python..." -ForegroundColor Cyan
python --version

if (-not (Test-Path "venv")) {
    Write-Host "[Sentinel] Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
}

Write-Host "[Sentinel] Activating venv..." -ForegroundColor Yellow
& ".\venv\Scripts\Activate.ps1"

Write-Host "[Sentinel] Installing requirements..." -ForegroundColor Yellow
pip install -r requirements.txt --quiet

Write-Host "`n[Sentinel] Starting FastAPI server on http://localhost:8000`n" -ForegroundColor Green
uvicorn main:app --reload --host 0.0.0.0 --port 8000
