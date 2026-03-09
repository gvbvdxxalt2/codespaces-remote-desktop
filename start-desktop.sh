#!/bin/bash

# --- CLEANUP SECTION ---
echo "🧹 Cleaning up existing processes..."
killall -q Xvfb fluxbox lxpanel thunar pulseaudio dbus-daemon pacmanfm 2>/dev/null
sleep 2

rm -rf /tmp/.X11-unix/X99
rm -f /tmp/.X99-lock

# --- CONFIGURATION ---
export DISPLAY=:99
export RESOLUTION="1280x720" # Simplified for parsing
export XDG_CONFIG_DIRS=/etc/xdg
export XDG_DATA_DIRS=/usr/share

WALLPAPER_PATH="./xp-wallpaper.jpg"

# --- BOOTSTRAP & GEOMETRY FIX ---
echo "🛠️ Configuring Desktop Environment..."
mkdir -p "$HOME/.config/lxpanel/LXDE/panels"

# Create a clean panel config that forces 100% width
# --- DYNAMIC CONFIGURATION ---
cat <<EOF > "$HOME/.config/lxpanel/LXDE/panels/panel"
Global {
    edge=bottom
    allign=left
    margin=0
    widthtype=percent
    width=100
    height=30
}

# 1. Start Menu (Raspbian style)
Plugin {
    type=menu
    Config {
        image=/usr/share/pixmaps/raspi-logo.png
    }
}

# 2. Quicklaunch (Pin your favorite apps here)
Plugin {
    type=launchbar
    Config {
        Button {
            id=pcmanfm.desktop
        }
        Button {
            id=lxterminal.desktop
        }
    }
}

# 3. Taskbar (Shows open windows, like Windows)
Plugin {
    type=taskbar
    expand=1
    Config {
        tooltips=1
        IconsOnly=0
    }
}

# 4. System Tray (Shows background apps/network)
Plugin {
    type=tray
}

# 5. Clock (Date and Time)
Plugin {
    type=clock
}

Plugin {
    type=launchbar
    Config {
        Button {
            id=pcmanfm.desktop
        }
    }
}
EOF

# --- STARTUP SECTION ---
echo "🖥️ Starting Xvfb..."
Xvfb $DISPLAY -screen 0 ${RESOLUTION}x24 -ac -nolisten tcp +extension GLX +render -noreset > /dev/null 2>&1 &

echo "⏳ Waiting for display $DISPLAY..."
sleep 2

echo "🔊 Starting Session..."
export $(dbus-launch)
pulseaudio --start > /dev/null 2>&1 &

echo "🪟 Starting UI..."
xsetroot -display $DISPLAY -cursor_name left_ptr -solid "#334d5c"
nohup fluxbox > /dev/null 2>&1 &

# Launching Panel with explicit session variables
export XDG_CURRENT_DESKTOP=LXDE
nohup lxpanel --profile LXDE > /tmp/lxpanel.log 2>&1 &

thunar --daemon > /dev/null 2>&1 &


nohup dunst > /tmp/dunst.log 2>&1 &

if [ -f "$WALLPAPER_PATH" ]; then
    feh --bg-scale "$WALLPAPER_PATH"
fi

nohup pcmanfm --desktop 2>&1 &

echo "🚀 Environment ready."
exit 0