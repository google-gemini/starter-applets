#!/usr/bin/env bash
# Simple helper to upload a file to a running local dev server
# Usage: ./test-upload.sh /path/to/file.mp4

set -eu
if [ $# -ne 1 ]; then
  echo "Usage: $0 /path/to/video.mp4"
  exit 1
fi

FILE=$1
ENDPOINT=${ENDPOINT:-http://localhost:8000/api/upload}

if [ ! -f "$FILE" ]; then
  echo "File not found: $FILE"
  exit 1
fi

curl -v -F "video=@${FILE}" "$ENDPOINT" | jq || true
