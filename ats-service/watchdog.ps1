# PowerShell script to run ATS microservice and restart on exit
Set-Location -Path $PSScriptRoot

$python = ".\venv\Scripts\python.exe"
if (-not (Test-Path $python)) {
    $python = "python"
}

while ($true) {
    $timestamp = Get-Date -Format "HH:mm:ss"
    Write-Host "[$timestamp] Starting ATS service on port 8001..." -ForegroundColor Cyan
    & $python -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload
    $exitCode = $LASTEXITCODE
    $timestamp = Get-Date -Format "HH:mm:ss"
    Write-Host "[$timestamp] ATS service exited (code $exitCode) — restarting in 2s..." -ForegroundColor Yellow
    Start-Sleep -Seconds 2
}
