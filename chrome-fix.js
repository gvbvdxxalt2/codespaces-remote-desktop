const fs = require('fs');
const path = require('path');
const os = require('os');

const desktopFileContent = `[Desktop Entry]
Version=1.0
Name=Google Chrome
Comment=Access the Internet
Exec=/usr/bin/google-chrome-stable --no-sandbox --disable-dev-shm-usage --disable-gpu %U
Terminal=false
Type=Application
Icon=google-chrome
Categories=Network;WebBrowser;`;

const targetDir = path.join(os.homedir(), '.local/share/applications');
const filePath = path.join(targetDir, 'google-chrome.desktop');

// Ensure the directory exists
if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

// Write the file
fs.writeFileSync(filePath, desktopFileContent);
console.log('✅ Google Chrome desktop entry configured with stability flags.');