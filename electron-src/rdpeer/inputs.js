var codeReplacers = {
    'Semicolon': ';',
    'Quote': "'",
    'Comma': ',',
    'Period': '.',
    'Slash': '/',
    'Backslash': '\\',
    'Backquote': '`',
    'BracketLeft': '[',
    'BracketRight': ']',
    'Minus': '-',
    'Equal': '=',
    'Space': 'space', // 'space' is usually still a string in RobotJS
    'Enter': 'enter',
    'Tab': 'tab',
    'Backspace': 'backspace',
    'Delete': 'delete',
    'Escape': 'escape'
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
        var code = json.code; 
        var key;

        if (code.startsWith('Key')) {
            key = code.slice(3).toLowerCase();
        } else if (code.startsWith('Digit')) {
            key = code.slice(5);
        } else if (code.startsWith('Arrow')) {
            key = code.slice(5).toLowerCase(); 
        } else {
            if (code.includes('Shift')) {
                key = 'shift';
            } else if (code.includes('Control')) {
                key = 'control';
            } else if (code.includes('Alt')) {
                key = 'alt';
            } else {
                key = codeReplacers[code] || code.toLowerCase();
            }
        }

        if (!peerConn.__keysPressed) {
            peerConn.__keysPressed = {};
        }

        if (json.down) {
            peerConn.__keysPressed[key] = true;
            remote.app.___keyToggle(key, "down");
        } else {
            delete peerConn.__keysPressed[key];
            remote.app.___keyToggle(key, "up");
        }
    }
}

function handleInputClose(peerConn) {
    for (var keyName of Object.keys(peerConn.__keysPressed)) {
        try{
            remote.app.___keyToggle(
                keyName,
                "up"
            );
        }catch(e){}
    }
}

module.exports = { handleInputTypes, handleInputClose };
