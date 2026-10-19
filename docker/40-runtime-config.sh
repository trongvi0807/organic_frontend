#!/bin/sh
set -eu

: "${VITE_API_BASE_URL:=/api/v1}"
: "${VITE_DEMO_MODE:=false}"

# Allow only URL-safe characters before writing values into JavaScript.
case "$VITE_API_BASE_URL" in
  *[!a-zA-Z0-9:/._~-]*|'') echo "Invalid VITE_API_BASE_URL" >&2; exit 1 ;;
esac
case "$VITE_API_BASE_URL" in
  /api/*|http://*|https://*) ;;
  *) echo "VITE_API_BASE_URL must be /api/... or an HTTP(S) URL" >&2; exit 1 ;;
esac
case "$VITE_DEMO_MODE" in true|false) ;; *) echo "VITE_DEMO_MODE must be true or false" >&2; exit 1 ;; esac
printf 'window.__MOC_CONFIG__ = {"VITE_API_BASE_URL":"%s","VITE_DEMO_MODE":"%s"};\n' \
  "$VITE_API_BASE_URL" "$VITE_DEMO_MODE" > /usr/share/nginx/html/runtime-config.js
