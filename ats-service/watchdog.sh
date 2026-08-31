#!/usr/bin/env bash
# Runs the ATS microservice and restarts it automatically if it crashes or
# exits for any reason, so it can't silently stay down during local dev.
# Every start/crash/restart is printed with a timestamp so "is it actually
# running" is visible in this terminal without digging further.

cd "$(dirname "$0")"

PYTHON="./venv/Scripts/python.exe"
if [ ! -f "$PYTHON" ]; then
    PYTHON="./venv/bin/python"
fi

while true; do
    echo "[watchdog $(date '+%H:%M:%S')] starting ATS service..."
    "$PYTHON" -m uvicorn main:app --host 0.0.0.0 --port "${PORT:-8001}"
    code=$?
    echo "[watchdog $(date '+%H:%M:%S')] ATS service exited (code $code) — restarting in 2s"
    sleep 2
done
