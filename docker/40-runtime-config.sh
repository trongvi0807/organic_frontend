#!/bin/sh
set -eu

: "${VITE_API_BASE_URL:=/api/v1}"
: "${VITE_DEMO_MODE:=false}"
: "${VITE_ADDRESS_BOUNDARY_BASE_URL:=https://tinhthanhpho.com/data}"

# Allow only URL-safe characters before writing values into JavaScript.
case "$VITE_API_BASE_URL" in
  *[!a-zA-Z0-9:/._~-]*|'') echo "Invalid VITE_API_BASE_URL" >&2; exit 1 ;;
esac
case "$VITE_API_BASE_URL" in
  /api/*|http://*|https://*) ;;
  *) echo "VITE_API_BASE_URL must be /api/... or an HTTP(S) URL" >&2; exit 1 ;;
esac
case "$VITE_DEMO_MODE" in true|false) ;; *) echo "VITE_DEMO_MODE must be true or false" >&2; exit 1 ;; esac
case "$VITE_ADDRESS_BOUNDARY_BASE_URL" in *[!a-zA-Z0-9:/._~-]*|'') echo "Invalid address boundary URL" >&2; exit 1 ;; esac
case "$VITE_ADDRESS_BOUNDARY_BASE_URL" in /data/*|https://*) ;; *) echo "Address boundary URL must use HTTPS or /data/..." >&2; exit 1 ;; esac
{
  printf 'globalThis.__MOC_CONFIG__ = {"VITE_API_BASE_URL":"%s","VITE_DEMO_MODE":"%s"' "$VITE_API_BASE_URL" "$VITE_DEMO_MODE"
  printf ',"VITE_ADDRESS_BOUNDARY_BASE_URL":"%s"' "$VITE_ADDRESS_BOUNDARY_BASE_URL"
  for key in VITE_FIREBASE_API_KEY VITE_FIREBASE_AUTH_DOMAIN VITE_FIREBASE_PROJECT_ID VITE_FIREBASE_STORAGE_BUCKET VITE_FIREBASE_MESSAGING_SENDER_ID VITE_FIREBASE_APP_ID VITE_FIREBASE_MEASUREMENT_ID VITE_FIREBASE_VAPID_KEY; do
    value="$(printenv "$key" || true)"
    case "$value" in *[!a-zA-Z0-9:._-]*) echo "Invalid $key" >&2; exit 1 ;; esac
    printf ',"%s":"%s"' "$key" "$value"
  done
  printf '};\n'
} > /usr/share/nginx/html/runtime-config.js
