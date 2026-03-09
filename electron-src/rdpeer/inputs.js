
var inputReplacers = {
    'Enter': 'enter',
    'Escape': 'escape',
    'ArrowUp': 'up',
    'ArrowDown': 'down',
    'ArrowLeft': 'left',
    'ArrowRight': 'right',
    'Backspace': 'backspace',
    'Tab': 'tab',
    'Shift': 'shift',
    ' ': 'space',
    'Control': 'control',
};

var remote = require("@electron/remote");
var ipcRenderer = require('electron').ipcRenderer;

var screenSize = remote.app.___getScreenSize();

function handleInputTypes(json, peerConn) {
    if (json.type == "mouse") {
        var pos = json.p;
        if (!Array.isArray(pos)) {
            return;
        }

        var xDecimal = pos[0];
        if (xDecimal < 0) {
            xDecimal = 0;
        }
        if (xDecimal > 1) {
            xDecimal = 1;
        }

        var yDecimal = pos[1];
        if (yDecimal < 0) {
            yDecimal = 0;
        }
        if (yDecimal > 1) {
            yDecimal = 1;
        }

        remote.app.___mouseMove(
            Math.round(xDecimal*screenSize.width),
            Math.round(yDecimal*screenSize.height)
        );

        remote.app.___mouseToggle(
            pos[2] ? "down" : "up",
            "left"
        );
        remote.app.___mouseToggle(
            pos[3] ? "down" : "up",
            "middle"
        );
        remote.app.___mouseToggle(
            pos[4] ? "down" : "up",
            "right"
        );
    }

    if (json.type == "wheel") {
        if (!Array.isArray(json.m)) {
            return;
        }
        remote.app.___scrollMouse(
            json.m[0],
            json.m[1]
        );
    }

    if (json.type == "key") {
        var key = inputReplacers[json.key];
        if (!key) {
            key = ""+json.key;
        }
        if (!peerConn.__keysPressed) {
            peerConn.__keysPressed = {};
        }
        if (json.down) {
            peerConn.__keysPressed[key] = true;
        } else {
            delete peerConn.__keysPressed[key];
        }
        remote.app.___keyToggle(
            key,
            json.down ? "down" : "up"
        );
    }
}

function handleInputClose(peerConn) {
    for (var keyName of Object.keys(peerConn.__keysPressed)) {
        remote.app.___keyToggle(
            keyName,
            "up"
        );
    }
}

module.exports = { handleInputTypes, handleInputClose };