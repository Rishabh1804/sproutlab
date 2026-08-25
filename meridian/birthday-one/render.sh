#!/usr/bin/env bash
# render.sh — proof PNGs + print-ready PDFs from the poster HTML.
#
# The proof window is rendered taller than the artwork and then cropped to the
# exact aspect box, so browser chrome can never leave a band of page
# background along the bottom edge of a proof.
set -euo pipefail
CHROME=/opt/pw-browsers/chromium-1194/chrome-linux/chrome
FLAGS="--headless --no-sandbox --disable-gpu --hide-scrollbars --force-device-scale-factor=1"
HERE="$(cd "$(dirname "$0")" && pwd)"

render () { # name  width  height
  local name=$1 w=$2 h=$3 pad=200
  "$CHROME" $FLAGS --screenshot="$HERE/proof-$name.png" --window-size="$w,$((h + pad))" \
    --virtual-time-budget=8000 "file://$HERE/$name.html" 2>/dev/null
  python3 - "$HERE/proof-$name.png" "$w" "$h" <<'PY'
import sys
from PIL import Image
path, w, h = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
im = Image.open(path).convert("RGB")
im.crop((0, 0, w, h)).save(path)
px = im.load()
# The very bottom row of the artwork must be snowfield, never page background.
print(f"  {path.split('/')[-1]}: bottom-centre pixel {px[w//2, h-2]}")
PY
  "$CHROME" $FLAGS --print-to-pdf="$HERE/print-$name.pdf" --no-pdf-header-footer \
    --virtual-time-budget=8000 "file://$HERE/$name.html" 2>/dev/null
}

render backdrop      2400 1600
render welcome-board 1600 1600
ls -la "$HERE"/proof-*.png "$HERE"/print-*.pdf
