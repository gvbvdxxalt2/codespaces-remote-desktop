#!/bin/bash

# --- 1. ROBUST CLEANUP ---
echo "🧹 Cleaning up existing sessions..."
pkill -9 Xvfb 2>/dev/null
pkill -9 fluxbox 2>/dev/null
pkill -9 lxpanel 2>/dev/null
pkill -9 pcmanfm 2>/dev/null
fuser -k 99/tcp 2>/dev/null
rm -rf /tmp/.X11-unix/X99 /tmp/.X99-lock

# --- 2. ENVIRONMENT ---
export DISPLAY=:99
export RESOLUTION="1280x720"
export XDG_CONFIG_DIRS=/etc/xdg
export XDG_DATA_DIRS=/usr/share
export GTK_THEME=Adwaita
WALLPAPER_PATH="./xp-wallpaper.jpg"

# --- 3. START Xvfb WITH DIAGNOSTIC LOGGING ---
echo "🖥️ Starting Xvfb on $DISPLAY..."
Xvfb $DISPLAY -screen 0 ${RESOLUTION}x24 -ac +extension GLX +render -noreset > /tmp/xvfb.log 2>&1 &

echo "⏳ Waiting for display $DISPLAY..."
MAX_RETRIES=20
COUNT=0
until xdpyinfo -display $DISPLAY > /dev/null 2>&1; do
    sleep 0.5
    COUNT=$((COUNT+1))
    if [ $COUNT -ge $MAX_RETRIES ]; then
        echo "❌ ERROR: Xvfb failed to start. Check /tmp/xvfb.log"
        cat /tmp/xvfb.log
        exit 1
    fi
done
echo "✅ Xvfb is running."

# --- 4. THEME & ICON REPAIR (Fixes the 'White Box' Taskbar) ---
echo "🎨 Repairing Icon Caches..."
mkdir -p "$HOME/.config/gtk-3.0"
echo -e "[Settings]\ngtk-icon-theme-name=Adwaita" > "$HOME/.config/gtk-3.0/settings.ini"
echo 'gtk-icon-theme-name = "Adwaita"' > "$HOME/.gtkrc-2.0"

# Force refresh the system icon cache so LXPanel sees images
sudo gtk-update-icon-cache -f /usr/share/icons/hicolor 2>/dev/null
sudo gtk-update-icon-cache -f /usr/share/icons/Adwaita 2>/dev/null

# --- 5. CONFIGURATION (Overwrites) ---
mkdir -p "$HOME/.config/lxpanel/LXDE/panels" "$HOME/.fluxbox" "$HOME/Desktop"

# Fluxbox Config (Margins prevent windows from hiding behind taskbar)
cat <<EOF > "$HOME/.fluxbox/init"
session.screen0.margin: 30 0 45 0
session.screen0.edgeSnapThreshold: 15
EOF

# LXPanel Config (Taskbar)
cat <<EOF > "$HOME/.config/lxpanel/LXDE/panels/panel"
Global {
    edge=bottom
    allign=center
    margin=0
    widthtype=percent
    width=100
    height=45
    transparent=0
    background=0
    iconsize=32
}
Plugin {
    type=menu
    Config {
        image=start-here
        system=1
    }
}
Plugin {
    type=taskbar
    expand=1
    Config {
        tooltips=1
        IconsOnly=0
        AcceptSkipPager=1
        ShowAllDesks=0
    }
}
Plugin {
    type=tray
}
Plugin {
    type=clock
    Config {
        ClockFmt=%R
        TooltipFmt=%A %x
        BoldFont=0
        IconOnly=0
    }
}
EOF

# --- 6. APP STORE & CHROME SHORTCUTS ---
echo "🛒 Creating App Store and Chrome shortcuts..."

# App Store (Synaptic)
cat <<EOF > "$HOME/Desktop/AppStore.desktop"
[Desktop Entry]
Name=App Store
Exec=sudo synaptic
Icon=package-x-generic
Type=Application
Terminal=false
EOF

# Chrome Fix (Bypasses Keyring password prompt)
cat <<EOF > "$HOME/Desktop/google-chrome.desktop"
[Desktop Entry]
Name=Google Chrome
Exec=google-chrome-stable --password-store=basic --no-sandbox
Icon=google-chrome
Type=Application
Terminal=false
EOF

chmod +x "$HOME/Desktop/"*.desktop

# --- 7. LAUNCH UI ---
export $(dbus-launch)
pulseaudio --start > /dev/null 2>&1 &

# Set cursor and root background
xsetroot -display $DISPLAY -cursor_name left_ptr -solid "#2e3440"

echo "🪟 Launching Window Manager..."
nohup fluxbox > /dev/null 2>&1 &
sleep 1
nohup lxpanel --profile LXDE > /tmp/lxpanel.log 2>&1 &

# Wait for panel to appear, then set "sticky"
sleep 2
if command -v wmctrl &> /dev/null; then
    wmctrl -r "lxpanel" -b add,sticky,above
fi

# Set Wallpaper if feh is installed
if command -v feh > /dev/null && [ -f "$WALLPAPER_PATH" ]; then
    feh --bg-scale "$WALLPAPER_PATH"
fi

# Launch File Manager
nohup pcmanfm --desktop > /dev/null 2>&1 &

echo "🚀 Desktop Environment ready."