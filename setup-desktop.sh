#!/bin/bash
set -e # Exit on any error

echo "🔄 Fixing repository GPG errors and updating..."
sudo rm -f /etc/apt/sources.list.d/yarn.list
sudo apt-get clean
sudo apt-get update -y

echo "📦 Installing Desktop Environment Layers..."

# --- LAYER 1: X11 & CORE DISPLAY ---
# Added x11-utils (for xdpyinfo) and xfonts-base (to prevent Xvfb crash)
sudo apt-get install -y \
    xvfb x11-utils x11-xserver-utils xfonts-base \
    wmctrl xdotool dbus-x11 build-essential

# --- LAYER 2: GUI & WINDOW MANAGEMENT ---
sudo apt-get install -y \
    fluxbox lxpanel lxpanel-data lxmenu-data \
    pcmanfm thunar mousepad \
    adwaita-icon-theme-full hicolor-icon-theme dmz-cursor-theme \
    feh nitrogen dunst

# --- LAYER 3: AUDIO & MEDIA ---
# Noble uses libasound2t64
sudo apt-get install -y \
    pulseaudio pavucontrol libasound2t64 \
    libcanberra-gtk-module libcanberra-gtk3-module sound-theme-freedesktop \
    ffmpeg audacity gimp

# --- LAYER 4: SYSTEM TOOLS & BROWSERS ---
sudo apt-get install -y \
    synaptic chromium-browser \
    libnss3 libxtst-dev libpng-dev libxi-dev

echo "🌐 Installing Google Chrome..."
# Run the chrome script but keep it contained
bash ./install-chrome.sh

echo "✅ All dependencies installed successfully."