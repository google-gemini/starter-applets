#!/usr/bin/env bash
# Helper to upload using application/octet-stream to test MIME fallback behavior
# Usage: ./test-mime-fallback.sh /path/to/file.mp4
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

# Force the file content-type to application/octet-stream when sending the multipart form
curl -v -F "video=@${FILE};type=application/octet-stream" "$ENDPOINT" | jq || true
