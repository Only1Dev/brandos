# Start BrandOS FastAPI Backend
$python = "C:\Users\Shivu\AppData\Local\Programs\Python\Python313\python.exe"
$backendDir = "$PSScriptRoot\backend"

Write-Host "Starting BrandOS Backend on http://localhost:8000..." -ForegroundColor Cyan
Set-Location $backendDir
& $python -m uvicorn app.main:app --reload --port 8000 --host 0.0.0.0
