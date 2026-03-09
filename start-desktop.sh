#!/bin/bash

# Configuration
export DISPLAY=:99
export RESOLUTION="1280x720x24"

echo "🖥️ Starting Xvfb..."
nohup Xvfb $DISPLAY -screen 0 $RESOLUTION -ac -nolisten tcp +extension GLX +render -noreset > /dev/null 2>&1 &
sleep 2

echo "🔊 Starting PulseAudio..."
pulseaudio --start --exit-idle-time=-1 --disallow-exit > /dev/null 2>&1
pactl load-module module-null-sink sink_name=remote_audio sink_properties=device.description=remote_audio > /dev/null 2>&1
pactl set-default-sink remote_audio > /dev/null 2>&1

echo "🪟 Starting UI (Fluxbox & LXPanel)..."

# Set background color
if command -v xsetroot >/dev/null 2>&1; then
    xsetroot -solid "#334d5c"
fi

# Start Fluxbox for window management
nohup fluxbox > /dev/null 2>&1 &

# Start LXPanel (The Raspbian-style taskbar)
# We check if it exists first to avoid errors
if command -v lxpanel >/dev/null 2>&1; then
    nohup lxpanel --profile LXDE > /dev/null 2>&1 &
else
    echo "⚠️ lxpanel not found. Please run: sudo apt-get install lxpanel"
fi

# Start Thunar as a daemon
thunar --daemon > /dev/null 2>&1 &

echo "🚀 Environment ready with LXPanel."
exit 0