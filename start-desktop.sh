#!/bin/bash

# --- 0. PRE-FLIGHT: WAIT FOR APT LOCK ---
echo "⏳ Checking for system package locks..."
while fuser /var/lib/dpkg/lock-frontend >/dev/null 2>&1 || fuser /var/lib/apt/lists/lock >/dev/null 2>&1 ; do
    echo "Wait: System is performing background updates. Retrying in 3 seconds..."
    sleep 3
done

# --- 1. INSTALL THEME ENGINES (The "Magic" Step) ---
# Without these, Materia-light will never apply.

# --- 2. ROBUST CLEANUP ---
echo "🧹 Cleaning up existing sessions..."
pkill -9 Xvfb 2>/dev/null
pkill -9 fluxbox 2>/dev/null
pkill -9 lxpanel 2>/dev/null
pkill -9 pcmanfm 2>/dev/null
pkill -9 xsettingsd 2>/dev/null
pkill -9 dunst 2>/dev/null
pkill -9 picom 2>/dev/null
fuser -k 99/tcp 2>/dev/null
rm -rf /tmp/.X11-unix/X99 /tmp/.X99-lock /tmp/lxpanel.pid

# --- 3. ENVIRONMENT ---
export DISPLAY=:99
export RESOLUTION="1366x768"
export XDG_CONFIG_DIRS=/etc/xdg
export XDG_DATA_DIRS=/usr/share
# Force the theme in the environment
export GTK_THEME=Materia-light
WALLPAPER_PATH="./xp-wallpaper.jpg"

# --- 4. START Xvfb ---
echo "🖥️ Starting Xvfb on $DISPLAY..."
Xvfb $DISPLAY -screen 0 ${RESOLUTION}x24 -ac +extension GLX +render -noreset > /tmp/xvfb.log 2>&1 &

echo "⏳ Waiting for display $DISPLAY..."
until xdpyinfo -display $DISPLAY > /dev/null 2>&1; do sleep 0.5; done
echo "✅ Xvfb is running."

# --- 5. THEME CONFIGURATION (GTK 2 & 3) ---
echo "🎨 Applying Materia-light theme configs..."
mkdir -p "$HOME/.config/gtk-3.0"

cat <<EOF > "$HOME/.config/gtk-3.0/settings.ini"
[Settings]
gtk-theme-name=Materia-light
gtk-icon-theme-name=Adwaita
gtk-font-name=Roboto 10
gtk-cursor-theme-name=Adwaita
EOF

cat <<EOF > "$HOME/.gtkrc-2.0"
include "/usr/share/themes/Materia-light/gtk-2.0/gtkrc"
gtk-theme-name="Materia-light"
gtk-font-name="Roboto 10"
EOF

# --- 6. FLUXBOX & PANEL CONFIG ---
mkdir -p "$HOME/.config/lxpanel/LXDE/panels" "$HOME/.fluxbox" "$HOME/Desktop"

cat <<EOF > "$HOME/.config/lxpanel/LXDE/panels/panel"
Global {
    edge=bottom
    align=left
    margin=0
    widthtype=percent
    width=100
    height=46
    transparent=1
    tintcolor=#ffffff
    alpha=255
    autohide=0
    heightwhenhidden=2
    setdockwindow=1
    setpartialstrut=1
    usefontcolor=1
    fontcolor=#1a1a1a
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
    type=space
    Config {
        Size=20
    }
}

Plugin {
    type=taskbar
    expand=1
    Config {
        tooltips=1
        IconsOnly=1
        AcceptSkipPager=1
        ShowAllDesks=0
        UseCustomButton=1
    }
}

Plugin {
    type=tray
}

Plugin {
    type=clock
    Config {
        ClockFmt=%-I:%M %p
        TooltipFmt=%A %x
        BoldFont=0
        IconOnly=0
    }
}
EOF

# Force Fluxbox to use a lighter theme (Bloe matches white windows better)
cat <<EOF > "$HOME/.fluxbox/init"
session.screen0.toolbar.visible: false
session.screen0.workspaces: 1
session.screen0.focusModel: ClickToFocus
session.styleFile: /usr/share/fluxbox/styles/bloe
window.title.height: 28
window.justify: center
EOF

# Notification Config (Dunst)
mkdir -p "$HOME/.config/dunst"
cat <<EOF > "$HOME/.config/dunst/dunstrc"
[global]
    font = "Roboto 10"
    corner_radius = 12
    background = "#FFFFFF"
    foreground = "#1C1B1F"
    frame_color = "#E1E2EC"
    origin = "bottom-right"
    offset = "20x20"
    mouse_left_click = do_action, close_current
EOF

# --- 7. LAUNCH UI ---
export $(dbus-launch)
pulseaudio --start > /dev/null 2>&1 &
xsetroot -display $DISPLAY -cursor_name left_ptr -solid "#f0f0f0"

# Start the Settings Daemon (This makes the theme actually work)
cat <<EOF > "$HOME/.xsettingsd"
Net/ThemeName "Materia-light"
Net/IconThemeName "Adwaita"
Gtk/FontName "Roboto 10"
EOF
nohup xsettingsd > /dev/null 2>&1 &

# Start Compositor for rounded corners and shadows (Windows 11 feel)

# Fix Scaling for Chromebook (120 DPI = sharp 125% scale)
echo "Xft.dpi: 120" | xrdb -merge

echo "🪟 Launching Fluxbox..."
nohup fluxbox > /dev/null 2>&1 &
sleep 2 

echo "🛠️ Starting LXPanel & PCManFM..."
nohup lxpanel --profile LXDE > /tmp/lxpanel.log 2>&1 &
nohup pcmanfm --desktop > /dev/null 2>&1 &

# Final safety check: ensure Chrome shortcut has the correct icon and flags
cat <<EOF > "$HOME/Desktop/google-chrome.desktop"
[Desktop Entry]
Name=Google Chrome
# Optimized for smoother mouse input on low-core machines
Exec=google-chrome-stable \
  --user-data-dir="$HOME/.config/google-chrome" \
  --no-sandbox \
  --disable-dev-shm-usage \
  --disable-gpu \
  --disable-software-rasterizer \
  --disable-gpu-compositing \
  --disable-accelerated-2d-canvas \
  --num-raster-threads=1
Icon=google-chrome
Type=Application
EOF
chmod +x "$HOME/Desktop/"*.desktop

echo "🚀 Desktop Environment ready in Materia-Light."