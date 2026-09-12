#!/bin/sh
# Render every article hero in this directory to public/assets/hero/<name>.png.
#
# Same machinery as the share cards — only the source directory, the output
# directory and the canvas size differ, so this delegates to tools/og/render.sh
# rather than carrying a second copy of the Chrome-finding logic.
#
# A hero is 1200x360: the article column is 38rem (608px), so the band renders
# at 2x on that column and stays crisp on a retina display.
#
# Usage:  sh tools/hero/render.sh          # all heroes
#         sh tools/hero/render.sh <name>   # one, by basename

set -eu

HERE=$(cd "$(dirname "$0")" && pwd)
mkdir -p "$HERE/../../public/assets/hero"

SRC_DIR="$HERE" \
OUT_DIR=$(cd "$HERE/../../public/assets/hero" && pwd) \
CARD_SIZE=1200,360 \
  sh "$HERE/../og/render.sh" "$@"
