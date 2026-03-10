var electron = require('electron');
var app = electron.app;
var BrowserWindow = electron.BrowserWindow;
var session = electron.session;
var ipcMain = electron.ipcMain;
var desktopCapturer = electron.desktopCapturer;

require('@electron/remote/main').initialize()

var path = require("path");

app.on('window-all-closed', () => {
  app.quit();
});

var robot = require("robotjs");
robot.setMouseDelay(0);
robot.setKeyboardDelay(0);

function addIPCListeners() {
    app.___getScreenSize = () => {
        return robot.getScreenSize();
    };

    app.___mouseMove = (x,y) => {
        robot.moveMouse(x,y);
    };
    app.___mouseToggle = (state,button) => {
        robot.mouseToggle(state,button);
    };

    app.___keyToggle = (state,button) => {
        robot.keyToggle(state,button);
    };

    app.___scrollMouse = (x,y) => {
        robot.scrollMouse(x,y);
    };
}

async function openRDWindow() {
    var win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            backgroundThrottling: false
        },
        preload: path.join(__dirname, 'preload.js')
    });

    setTimeout(() => {
        win.hide();
    },1);

    win.webContents.on('console-message', (event, level, message, line, sourceId) => {
        console.log(message);
    });

    win.webContents.on('crashed', (event, killed) => {
        console.log("!!! RENDERER CRASHED !!!");
    });

    require("@electron/remote/main").enable(win.webContents);
    
    addIPCListeners();    
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