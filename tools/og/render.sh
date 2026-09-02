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

# CHROME_PATH (or CHROME) wins; with neither set the first candidate that exists
# is used — the macOS path first, so this machine behaves exactly as before,
# then the usual Linux install locations. Newline-separated because the macOS
# path contains a space.
CHROME_CANDIDATES="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome
/usr/bin/google-chrome
/usr/bin/google-chrome-stable
/usr/bin/chromium-browser
/usr/bin/chromium"

HERE=$(cd "$(dirname "$0")" && pwd)
OUT=$(cd "$HERE/../../public/assets/og" && pwd)

# A subshell function, so setting IFS to a newline here cannot leak into the
# whitespace-split loop over $CARDS below.
first_existing_chrome() (
  IFS="
"
  for candidate in $CHROME_CANDIDATES; do
    if [ -x "$candidate" ]; then printf '%s\n' "$candidate"; return 0; fi
  done
  return 1
)

CHROME="${CHROME_PATH:-${CHROME:-}}"
if [ -n "$CHROME" ]; then
  [ -x "$CHROME" ] || {
    echo "Chrome not found at $CHROME (from CHROME_PATH/CHROME)" >&2
    exit 1
  }
else
  CHROME=$(first_existing_chrome) || {
    echo "Chrome not found; tried:" >&2
    echo "$CHROME_CANDIDATES" >&2
    echo "set CHROME_PATH to point at one" >&2
    exit 1
  }
fi

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
