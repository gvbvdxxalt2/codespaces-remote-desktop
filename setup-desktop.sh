#!/bin/bash
echo "📦 Installing Desktop Environment Layers..."

# Update and install core GUI components
sudo apt-get update
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
    libasound2

echo "✅ System dependencies installed."
