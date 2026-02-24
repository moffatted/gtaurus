#!/bin/bash

# This script checks for and installs a virtual desktop (Xvfb) if missing,
# then launches the Gtaurus application within it.
# Note: Xvfb is a virtual framebuffer that allows graphical applications 
# to run headlessly. If you are looking to access a full remote desktop UI, 
# you may want to install 'xrdp' and 'ubuntu-desktop' instead and run the app directly.

set -e

# Define required packages
# - xvfb: Provides the virtual desktop (X virtual framebuffer)
# - libwebkit2gtk-4.1-0 & libgtk-3-0: Dependencies for running Tauri apps on Ubuntu
REQUIRED_PKGS="xvfb libwebkit2gtk-4.1-0 libgtk-3-0"

echo "Checking if virtual desktop and dependencies are installed..."

INSTALL_NEEDED=false
for pkg in $REQUIRED_PKGS; do
    if ! dpkg -s "$pkg" >/dev/null 2>&1; then
        echo "Missing package: $pkg"
        INSTALL_NEEDED=true
    fi
done

if [ "$INSTALL_NEEDED" = true ]; then
    echo "Installing virtual desktop packages via apt..."
    sudo apt-get update
    sudo apt-get install -y $REQUIRED_PKGS
else
    echo "Virtual desktop packages are already installed."
fi

# Locate the compiled Gtaurus binary
# Checking if script is run from project root or inside the scripts directory
if [ -f "./src-tauri/target/release/gtaurus" ]; then
    APP_PATH="./src-tauri/target/release/gtaurus"
elif [ -f "../src-tauri/target/release/gtaurus" ]; then
    APP_PATH="../src-tauri/target/release/gtaurus"
else
    echo "Error: Gtaurus binary not found."
    echo "Please build the app first. For example, run 'npm run tauri build' from the project root."
    exit 1
fi

echo "Launching Gtaurus on the virtual desktop..."
# xvfb-run automatically finds a free server number and runs the app on it
xvfb-run --auto-servernum "$APP_PATH" "$@"
