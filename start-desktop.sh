#!/bin/bash

# Configuration
export DISPLAY=:99
export RESOLUTION="1280x720x24"

echo "🖥️ Starting Xvfb..."
# Redirecting output to /dev/null ensures the shell doesn't hang on buffer
nohup Xvfb $DISPLAY -screen 0 $RESOLUTION -ac -nolisten tcp +extension GLX +render -noreset > /dev/null 2>&1 &
sleep 2

echo "🔊 Starting PulseAudio..."
# PulseAudio handles its own background daemonization
pulseaudio --start --exit-idle-time=-1 --disallow-exit > /dev/null 2>&1
pactl load-module module-null-sink sink_name=remote_audio sink_properties=device.description=remote_audio > /dev/null 2>&1
pactl set-default-sink remote_audio > /dev/null 2>&1

echo "🪟 Starting UI (Fluxbox & Panel)..."
# Using nohup and redirecting to /dev/null is key here
nohup fluxbox > /dev/null 2>&1 &
nohup xfce4-panel > /dev/null 2>&1 &
thunar --daemon > /dev/null 2>&1 &

echo "🚀 Environment ready. Processes are detached."
# Exit the script while leaving the children running
exit 0