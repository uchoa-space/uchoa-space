#!/bin/sh
# Render every share card in this directory to public/assets/og/<name>.png.
#
# Intent decision 4 (docs/intent/share-cards.md): the cards are drawn by hand
# and committed as PNGs: no build-time generation, no npm dependency. This
# script exists so that re-drawing one is cheap: edit its HTML, run this.
#
# Headless Chrome is the only tool involved. It ships with the browser already
# on this machine; rsvg-convert, ImageMagick and Inkscape are not installed and
# are not needed. Chrome prints a couple of harmless `task_policy_set` errors
# on stderr under macOS; ignore them.
#
# Usage:  sh tools/og/render.sh            # all cards
#         sh tools/og/render.sh default    # one card, by basename

set -eu

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
HERE=$(cd "$(dirname "$0")" && pwd)
OUT=$(cd "$HERE/../../public/assets/og" && pwd)

[ -x "$CHROME" ] || { echo "Chrome not found at $CHROME" >&2; exit 1; }

if [ "$#" -gt 0 ]; then
  CARDS="$*"
else
  CARDS=$(cd "$HERE" && ls *.html | sed 's/\.html$//')
fi

for card in $CARDS; do
  src="$HERE/$card.html"
  [ -f "$src" ] || { echo "no such card: $src" >&2; exit 1; }
  "$CHROME" --headless --disable-gpu --hide-scrollbars \
    --force-device-scale-factor=1 --window-size=1200,630 \
    --screenshot="$OUT/$card.png" "file://$src" 2>/dev/null
  # The card is only correct at exactly 1200x630, because og:image:width and
  # og:image:height are published as those numbers.
  size=$(sips -g pixelWidth -g pixelHeight "$OUT/$card.png" | awk '/pixel/ {printf "%s", $2 " "}')
  bytes=$(wc -c < "$OUT/$card.png" | tr -d ' ')
  echo "$card.png  ${size}px  ${bytes} bytes"
  case "$size" in
    "1200 630 ") ;;
    *) echo "  ^ WRONG SIZE, expected 1200 630" >&2; exit 1 ;;
  esac
done
