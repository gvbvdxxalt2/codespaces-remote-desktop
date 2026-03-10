const fs = require('fs');
const path = require('path');
const { execSync, exec } = require('child_process');
const os = require('os');

// ==========================================
// 🛠️ CONFIGURE YOUR TASKBAR ICONS HERE 🛠️
// ==========================================
// Add or reorder the exact names of your .desktop files.
const PINNED_APPS = [
    'google-chrome.desktop',
];
// ==========================================

const homeDir = os.homedir();
const appsDir = path.join(homeDir, '.local/share/applications');
const panelConfigPath = path.join(homeDir, '.config/lxpanel/LXDE/panels/panel');

console.log('📌 Generating LXPanel configuration...');

// 1. Make sure the system can see your custom desktop shortcuts
if (!fs.existsSync(appsDir)) fs.mkdirSync(appsDir, { recursive: true });
try {
    execSync(`cp ${path.join(homeDir, 'Desktop/*.desktop')} ${appsDir}/ 2>/dev/null || true`);
} catch (e) {
    // Ignore if no desktop files exist yet
}

// 2. Start building the strict LXPanel config format
let configContent = `Global {
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
`;

// 3. Loop through your array and inject the pinned icons
PINNED_APPS.forEach(app => {
    configContent += `        Button {\n            id=${app}\n        }\n`;
});

// 4. Finish off the config with the active tasks, tray, and clock
configContent += `    }
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
`;

// 5. Save the file and restart the panel on Display :99
try {
    fs.mkdirSync(path.dirname(panelConfigPath), { recursive: true });
    fs.writeFileSync(panelConfigPath, configContent);
    
    console.log('🔄 Restarting Taskbar...');
    execSync('pkill -9 lxpanel || true');
    execSync('rm -f /tmp/lxpanel.pid || true');
    
    // Give the old process a split second to die, then boot the new one
    setTimeout(() => {
        exec('export DISPLAY=:99 && nohup lxpanel --profile LXDE > /tmp/lxpanel.log 2>&1 &', (err) => {
            if (err) {
                console.error('❌ Failed to start panel:', err);
            } else {
                console.log('✅ Taskbar successfully updated with custom icons!');
                
                // Force the panel to stay on top
                setTimeout(() => {
                    execSync('export DISPLAY=:99 && wmctrl -r "lxpanel" -b add,sticky,above || true');
                }, 2000);
            }
        });
    }, 1000);

} catch (err) {
    console.error('❌ Error writing configuration:', err);
}