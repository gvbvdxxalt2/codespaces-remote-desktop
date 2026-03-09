#!/bin/bash
echo "🔄 Fixing repository GPG errors and updating..."

# Disable the broken Yarn repo to stop it from blocking updates
sudo rm -f /etc/apt/sources.list.d/yarn.list

# Clean and update
sudo apt-get clean
sudo apt-get update -y

echo "📦 Installing Desktop Environment Layers for Ubuntu Noble..."

# We use libasound2t64 and include specific dependencies for native builds
sudo apt-get install -y \
    xvfb \
    fluxbox \
    xfce4-panel \
    xfce4-terminal \
    thunar \
    xdotool \
    pulseaudio \
    pavucontrol \
    ffmpeg \
    libnss3 \
    libasound2t64 \
    build-essential \
    python3 \
    libxtst-dev \
    libpng-dev \
    libx11-dev \
    libxi-dev \
    chromium

echo "✅ System dependencies installed."