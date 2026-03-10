#!/bin/bash

# --- 0. PRE-FLIGHT: WAIT FOR APT LOCK ---
echo "⏳ Checking for system package locks..."
while fuser /var/lib/dpkg/lock-frontend >/dev/null 2>&1 || fuser /var/lib/apt/lists/lock >/dev/null 2>&1 ; do
    echo "Wait: System is performing background updates. Retrying in 3 seconds..."
    sleep 3
done

# --- 1. ROBUST CLEANUP ---
echo "🧹 Cleaning up existing sessions..."
pkill -9 Xvfb 2>/dev/null
pkill -9 fluxbox 2>/dev/null
pkill -9 lxpanel 2>/dev/null
pkill -9 pcmanfm 2>/dev/null
fuser -k 99/tcp 2>/dev/null
rm -rf /tmp/.X11-unix/X99 /tmp/.X99-lock /tmp/lxpanel.pid

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

# --- 4. THEME & ICON REPAIR ---
echo "🎨 Repairing Icon Caches..."
mkdir -p "$HOME/.config/gtk-3.0"
echo -e "[Settings]\ngtk-icon-theme-name=Adwaita" > "$HOME/.config/gtk-3.0/settings.ini"
echo 'gtk-icon-theme-name = "Adwaita"' > "$HOME/.gtkrc-2.0"
sudo gtk-update-icon-cache -f /usr/share/icons/hicolor 2>/dev/null
sudo gtk-update-icon-cache -f /usr/share/icons/Adwaita 2>/dev/null

# --- 5. CONFIGURATION ---
mkdir -p "$HOME/.config/lxpanel/LXDE/panels" "$HOME/.fluxbox" "$HOME/Desktop"

cat <<EOF > "$HOME/.fluxbox/init"
session.screen0.margin: 30 0 45 0
session.screen0.edgeSnapThreshold: 15
EOF

mkdir -p "$HOME/.local/share/applications"

cat <<EOF > "$HOME/.local/share/applications/file-manager.desktop"
[Desktop Entry]
Name=File Manager
Exec=pcmanfm $HOME
Icon=user-home
Type=Application
Terminal=false
EOF

cat <<EOF > "$HOME/.config/lxpanel/LXDE/panels/panel"
Global {
    edge=bottom
    align=left
    margin=0
    widthtype=percent
    width=100
    height=45
    transparent=0
    tintcolor=#2e3440
    alpha=255
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
    type=launchbar
    Config {
        Button {
            id=file-manager.desktop
        }
        Button {
            id=google-chrome.desktop
        }
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
    type=clock
    Config {
        ClockFmt=%R
        TooltipFmt=%A %x
        BoldFont=0
        IconOnly=0
    }
}

Plugin {
    type=tray
}
EOF

# --- 6. APP STORE & OPTIMIZED CHROME SHORTCUTS ---
echo "🛒 Creating shortcuts..."

cat <<EOF > "$HOME/Desktop/google-chrome.desktop"
[Desktop Entry]
Name=Google Chrome
# Optimized for container/Xvfb environment
Exec=google-chrome-stable --password-store=basic --no-sandbox --disable-dev-shm-usage --disable-gpu --no-first-run
Icon=google-chrome
Type=Application
Terminal=false
EOF

chmod +x "$HOME/Desktop/"*.desktop

# --- 7. LAUNCH UI ---
export $(dbus-launch)
pulseaudio --start > /dev/null 2>&1 &
xsetroot -display $DISPLAY -cursor_name left_ptr -solid "#2e3440"

echo "🪟 Launching Window Manager..."
nohup fluxbox > /dev/null 2>&1 &
# Give Fluxbox a solid moment to initialize its geometry
sleep 2 

echo "🛠️ Starting LXPanel..."
# Retry loop to ensure the panel actually stays alive
for i in {1..3}; do
    nohup lxpanel --profile LXDE > /tmp/lxpanel.log 2>&1 &
    sleep 2
    if pgrep -x "lxpanel" > /dev/null; then
        echo "✅ LXPanel started successfully."
        break
    else
        echo "⚠️ LXPanel failed to start, retrying ($i/3)..."
        # clear any dead pid locks before retrying
        rm -f /tmp/lxpanel.pid 
    fi
done

# Ensure the panel stays on top if it survived the startup
if pgrep -x "lxpanel" > /dev/null && command -v wmctrl &> /dev/null; then
    wmctrl -r "lxpanel" -b add,sticky,above
fi

if command -v feh > /dev/null && [ -f "$WALLPAPER_PATH" ]; then
    feh --bg-scale "$WALLPAPER_PATH"
fi

nohup pcmanfm --desktop > /dev/null 2>&1 &

echo "🚀 Desktop Environment ready."