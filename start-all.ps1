# BrandOS One-Click Launcher
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "         BrandOS Governance Platform         " -ForegroundColor Yellow
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "Starting Backend on http://localhost:8000" -ForegroundColor White
Write-Host "Starting Frontend on http://localhost:3000" -ForegroundColor White
Write-Host "=============================================" -ForegroundColor Cyan

$backendScript = "$PSScriptRoot\start-backend.ps1"
$frontendScript = "$PSScriptRoot\start-frontend.ps1"

Start-Process powershell -ArgumentList "-NoExit", "-File", "`"$backendScript`""
Start-Process powershell -ArgumentList "-NoExit", "-File", "`"$frontendScript`""

Write-Host "Both servers launched in dedicated PowerShell windows!" -ForegroundColor Green
Write-Host "Open http://localhost:3000 in your browser." -ForegroundColor Cyan
