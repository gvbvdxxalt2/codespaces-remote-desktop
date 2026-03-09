#!/bin/bash

# 1. Environment Variables
export DISPLAY=:99
export RESOLUTION="1280x720x24"

echo "🖥️ Starting Virtual Display ($DISPLAY) at $RESOLUTION..."
# Start Xvfb - the virtual monitor
Xvfb $DISPLAY -screen 0 $RESOLUTION -ac +extension GLX +render -noreset &
sleep 2

echo "🔊 Initializing Virtual Audio (PulseAudio)..."
# Start PulseAudio and create a 'null-sink' to capture system sound
pulseaudio --start --exit-idle-time=-1
pactl load-module module-null-sink sink_name=remote_audio sink_properties=device.description=remote_audio
pactl set-default-sink remote_audio

echo "🪟 Launching Window Manager (Fluxbox)..."
fluxbox &
sleep 1

echo "📋 Launching UI Shell (Taskbar)..."
xfce4-panel &

echo "📂 Initializing File Manager Daemon..."
thunar --daemon &

echo "🚀 Desktop Environment is LIVE."
echo "Terminating this script will NOT kill the background processes."
