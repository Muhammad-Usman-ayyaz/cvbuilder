@echo off
REM Windows batch script to run ATS microservice and restart on exit
cd /d "%~dp0"

set PYTHON=.\venv\Scripts\python.exe
if not exist "%PYTHON%" (
    set PYTHON=python
)

:loop
echo [%TIME%] Starting ATS service on port 8001...
"%PYTHON%" -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload
echo [%TIME%] ATS service exited. Restarting in 2s...
timeout /t 2 /nobreak >nul
goto loop
