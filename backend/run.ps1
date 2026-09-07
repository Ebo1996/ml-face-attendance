#!/usr/bin/env pwsh
# ─────────────────────────────────────────────
#  Face Attendance Backend — Quick Start
#  Usage:  .\run.ps1
#          .\run.ps1 migrate
#          .\run.ps1 shell
# ─────────────────────────────────────────────

param(
    [string]$cmd = "serve"
)

$PYTHON = ".\venv\Scripts\python.exe"
$MANAGE = "$PYTHON manage.py"

# Ensure venv exists
if (-not (Test-Path $PYTHON)) {
    Write-Host "[setup] Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
    & .\venv\Scripts\pip install -r requirements.txt --quiet
}

switch ($cmd) {
    "serve" {
        Write-Host "[backend] Starting Django dev server..." -ForegroundColor Green
        & $PYTHON manage.py runserver
    }
    "migrate" {
        Write-Host "[backend] Running migrations..." -ForegroundColor Cyan
        & $PYTHON manage.py migrate
    }
    "shell" {
        Write-Host "[backend] Opening Django shell..." -ForegroundColor Cyan
        & $PYTHON manage.py shell
    }
    "install" {
        Write-Host "[backend] Installing dependencies..." -ForegroundColor Yellow
        & .\venv\Scripts\pip install -r requirements.txt
    }
    "models" {
        Write-Host "[backend] Downloading InsightFace models..." -ForegroundColor Yellow
        & $PYTHON -c "from insightface.app import FaceAnalysis; app = FaceAnalysis(name='buffalo_l'); app.prepare(ctx_id=0); print('Models ready!')"
    }
    default {
        Write-Host "Usage: .\run.ps1 [serve|migrate|shell|install|models]" -ForegroundColor Red
    }
}
