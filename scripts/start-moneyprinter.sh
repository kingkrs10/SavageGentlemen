#!/usr/bin/env bash
# ==============================================================================
# Savage Gentlemen - MoneyPrinterTurbo AI Video Sidecar Launcher
# ==============================================================================

set -e

echo "=========================================================="
echo "🎬 Savage Gentlemen: Starting MoneyPrinterTurbo Sidecar..."
echo "=========================================================="

if command -v docker &> /dev/null; then
  echo "🐳 Docker detected. Pulling & launching MoneyPrinterTurbo container (GHCR)..."
  docker compose -f docker-compose.moneyprinter.yml up -d
  echo "✅ MoneyPrinterTurbo container is active."
  echo "   - FastAPI Server: http://127.0.0.1:8090/docs"
  echo "   - WebUI Preview: http://127.0.0.1:8505"
else
  echo "⚠️ Docker is not installed. To run MoneyPrinterTurbo locally via Python:"
  echo "   1. git clone https://github.com/harry0703/MoneyPrinterTurbo.git"
  echo "   2. cd MoneyPrinterTurbo && pip install -r requirements.txt"
  echo "   3. python main.py"
fi
