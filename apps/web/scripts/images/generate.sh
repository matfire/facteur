#!/usr/bin/env bash
# Renders the share image and app icons from the HTML templates next to this script.
# Needs a Chromium-based browser: set CHROME to its binary, for example
#   CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" ./scripts/images/generate.sh
set -euo pipefail

here="$(cd "$(dirname "$0")" && pwd)"
public="$here/../../public"
: "${CHROME:?Set CHROME to a Chromium or Chrome binary}"

shot() { # template, output, width, height
  "$CHROME" --headless --hide-scrollbars --force-device-scale-factor=1 --virtual-time-budget=2000 \
    --window-size="$3,$4" --screenshot="$public/$2" "file://$here/$1" >/dev/null 2>&1
  echo "wrote public/$2"
}

shot og.html og.png 1200 630
shot icon.html apple-touch-icon.png 180 180
shot icon.html icon-192.png 192 192
shot icon.html icon-512.png 512 512
