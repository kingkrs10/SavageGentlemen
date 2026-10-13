#!/bin/bash
set -e

# Savage Gentlemen Persistent Server & Auto-Poster Launcher
cd /Users/sg/SavageGentlemen

export PATH="/usr/local/bin:/Users/sg/.npm-global/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
export NODE_ENV=production
export PORT=5000

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting Savage Gentlemen Daemon..."

# Execute production build with environment variables
exec /usr/local/bin/node --env-file=/Users/sg/SavageGentlemen/.env /Users/sg/SavageGentlemen/dist/index.js
