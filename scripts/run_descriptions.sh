#!/bin/bash
cd /Users/jcnino/Documents/jcnino || exit 1
mkdir -p ~/Library/Logs/gallery-desc
LOG_FILE=~/Library/Logs/gallery-desc/$(date +%Y-%m-%d_%H%M%S).log
/opt/homebrew/bin/node --env-file=.env scripts/generate_descriptions_gemini.mjs >> "$LOG_FILE" 2>&1
exit 0
