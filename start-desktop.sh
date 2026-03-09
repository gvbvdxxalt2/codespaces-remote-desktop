#!/bin/bash

# --- CLEANUP SECTION ---
# 1. Safely stop processes if they are running
echo "🧹 Cleaning up existing processes..."
killall -q Xvfb fluxbox lxpanel thunar pulseaudio 2>/dev/null
# Give the processes a second to shut down gracefully
sleep 1

# 2. Remove stale X11 lock files (These cause "Display already exists" errors)
rm -f /tmp/.X99-lock
rm -f /tmp/.X11-unix/X99

# --- CONFIGURATION ---
export DISPLAY=:99
export RESOLUTION="1280x720x24"

# --- STARTUP SECTION ---
echo "🖥️ Starting Xvfb..."
nohup Xvfb $DISPLAY -screen 0 $RESOLUTION -ac -nolisten tcp +extension GLX +render -noreset > /dev/null 2>&1 &
sleep 2

echo "🔊 Starting PulseAudio..."
pulseaudio --start --exit-idle-time=-1 --disallow-exit > /dev/null 2>&1
pactl load-module module-null-sink sink_name=remote_audio sink_properties=device.description=remote_audio > /dev/null 2>&1
pactl set-default-sink remote_audio > /dev/null 2>&1

echo "🪟 Starting UI (Fluxbox & LXPanel)..."
if command -v xsetroot >/dev/null 2>&1; then
    xsetroot -solid "#334d5c"
fi

nohup fluxbox > /dev/null 2>&1 &
if command -v lxpanel >/dev/null 2>&1; then
    nohup lxpanel --profile LXDE > /dev/null 2>&1 &
fi
thunar --daemon > /dev/null 2>&1 &

echo "🚀 Environment ready."
exit 0