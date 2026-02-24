#!/bin/bash
set -e

APP_PATH="../src-tauri/target/release/gtaurus"

echo "Launching UI Preview server on port 1420..."
npx vite preview --port 1420 --host 0.0.0.0 > vite_preview.log 2>&1 &
VITE_PID=$!

echo "Launching Gtaurus on the virtual desktop..."
export LIBGL_ALWAYS_SOFTWARE=1
export WEBKIT_DISABLE_COMPOSITING_MODE=1
export WEBKIT_DISABLE_DMABUF_RENDERER=1
export WEBKIT_DISABLE_GPU_PROCESS=1
export WEBKIT_USE_GLX=1
export WEBKIT_DISABLE_SANDBOX=1
export GDK_BACKEND=x11
export MESA_DEBUG=silent

# Run gtaurus in background as well so script doesn't hang
xvfb-run --auto-servernum --server-args="-screen 0 1024x768x24" "$APP_PATH" "$@" > gtaurus_binary.log 2>&1 &
GTAURUS_PID=$!

echo "Processes started: Vite (PID $VITE_PID), Gtaurus (PID $GTAURUS_PID)"
echo "Waiting for ports to open..."

# Keep script running to maintain the background processes
wait $GTAURUS_PID $VITE_PID
