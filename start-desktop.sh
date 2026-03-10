#!/bin/bash

# --- 1. CLEANUP ---
echo "🧹 Cleaning up..."
# Force kill existing processes and clear lock files
fuser -k 99/tcp 2>/dev/null
pkill -9 Xvfb fluxbox lxpanel pcmanfm
rm -rf /tmp/.X11-unix/X99 /tmp/.X99-lock

# --- 2. CONFIGURATION ---
export DISPLAY=:99
export RESOLUTION="1280x720"
export XDG_CONFIG_DIRS=/etc/xdg
export XDG_DATA_DIRS=/usr/share
WALLPAPER_PATH="./xp-wallpaper.jpg"

# --- 3. START XVFB WITH READINESS CHECK ---
echo "🖥️ Starting Xvfb..."
Xvfb $DISPLAY -screen 0 ${RESOLUTION}x24 -ac -nolisten tcp +extension GLX +render -noreset > /tmp/xvfb.log 2>&1 &

# Wait for X server to be responsive
echo "⏳ Waiting for display $DISPLAY..."
until xdpyinfo -display $DISPLAY > /dev/null 2>&1; do
    sleep 0.5
done
echo "✅ Display $DISPLAY is ready."

# --- 4. APPLY SETTINGS (Overwrite method) ---
mkdir -p "$HOME/.config/lxpanel/LXDE/panels" "$HOME/.fluxbox"

# Panel Config
cat <<EOF > "$HOME/.config/lxpanel/LXDE/panels/panel"
Global {
    edge=bottom
    allign=center
    margin=0
    widthtype=percent
    width=100
    height=45
    iconsize=40
    menu_icon_size=32
}
# ... (rest of your panel config)
EOF

# Fluxbox Config (The Fix for off-screen windows)
cat <<EOF > "$HOME/.fluxbox/init"
session.screen0.margin: 30 0 45 0
session.screen0.edgeSnapThreshold: 15
EOF

# --- 5. LAUNCH UI ---
echo "🔊 Starting Session..."
export $(dbus-launch)
pulseaudio --start > /dev/null 2>&1 &

echo "🪟 Launching UI components..."
xsetroot -display $DISPLAY -solid "#2e3440"
nohup fluxbox > /dev/null 2>&1 &
nohup lxpanel --profile LXDE > /tmp/lxpanel.log 2>&1 &

# Wait briefly for panel to register before moving it
sleep 2
wmctrl -r "lxpanel" -b add,sticky,above

# Desktop Management
nohup pcmanfm --desktop 2>&1 &
if [ -f "$WALLPAPER_PATH" ]; then
    feh --bg-scale "$WALLPAPER_PATH"
fi

echo "🚀 Environment ready."