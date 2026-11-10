# Start BrandOS Next.js Frontend
$nodeDir = "C:\Users\Shivu\AppData\Local\Programs\nodejs\node-v22.11.0-win-x64"
$env:PATH = "$nodeDir;$env:PATH"
$frontendDir = "$PSScriptRoot\frontend"

Write-Host "Starting BrandOS Frontend on http://localhost:3000..." -ForegroundColor Green
Set-Location $frontendDir
& "$nodeDir\npm.cmd" run dev
