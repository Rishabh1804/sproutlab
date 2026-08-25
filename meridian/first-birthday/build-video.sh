#!/usr/bin/env bash
# One-command pipeline: frames + soundtrack -> ziva-first-birthday-invite.mp4
# Env overrides: FFMPEG (ffmpeg binary), CHROMIUM (chrome binary), WORK (temp dir).
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
WORK="${WORK:-/tmp/invite-build}"
FFMPEG="${FFMPEG:-ffmpeg}"
FPS=30
DUR=10

mkdir -p "$WORK/frames"
echo "[1/3] soundtrack"
python3 "$HERE/make-audio.py" "$WORK/audio.wav"
echo "[2/3] frames ($((FPS * DUR)) @ ${FPS}fps)"
node "$HERE/render.mjs" "$HERE/invite.html" "$WORK/frames" "$FPS" "$DUR"
echo "[3/3] encode"
"$FFMPEG" -y -loglevel error \
  -framerate "$FPS" -i "$WORK/frames/f%04d.jpg" \
  -i "$WORK/audio.wav" \
  -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
  -c:a aac -b:a 192k -shortest -movflags +faststart \
  "$HERE/ziva-first-birthday-invite.mp4"
echo "wrote $HERE/ziva-first-birthday-invite.mp4"
