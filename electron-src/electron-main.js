var electron = require('electron');
var app = electron.app;
var BrowserWindow = electron.BrowserWindow;
var session = electron.session;
var desktopCapturer = electron.desktopCapturer;

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

app.on('window-all-closed', () => {
  app.quit();
});

async function openRDWindow() {
    var win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    });
    win.hide();

    win.webContents.on('console-message', (event, level, message, line, sourceId) => {
        console.log(message);
    });
    
    await win.loadFile("electron-src/index.html");
}

var gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    console.log(`[NOTICE!]: There is an desktop instance already running.`);
    app.quit();
} else {
    app.on('ready', () => {
        openRDWindow();

        session.defaultSession.setDisplayMediaRequestHandler((request, callback) => {
            var sourcesPromise = desktopCapturer.getSources({ types: ['screen'] });
            sourcesPromise.then((sources) => {
                callback({ video: sources[0], audio: 'loopback' })
            });
        }, { useSystemPicker: false });
    });
}