var elements = require("../../gp2/elements.js");
var { getNewPeer } = require("./peer.js");

var loadingScreen = elements.getGPId("loadingScreen");
var appScreen = elements.getGPId("appScreen");

function initiateConnection() {
    loadingScreen.hidden = false;
    appScreen.hidden = true;

    var protocol = window.location.protocol.startsWith("https") ? "wss://" : "ws://";
    var host = window.location.host;
    var url = protocol + host + "/connect";

    var ws = new WebSocket(url);
    var canSend = false;
    var peerConn = null;
    var isReconnecting = false; 
    
    var intentionalWsClose = false; 

    function triggerReconnect() {
        if (isReconnecting) return;
        isReconnecting = true;
        canSend = false;

        if (peerConn) {
            try { peerConn.destroy(); } catch(e) {}
        }
        
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
            intentionalWsClose = true;
            try { ws.close(); } catch(e) {}
        }

        appScreen.hidden = true;
        
        setTimeout(() => {
            initiateConnection();
        }, 1000);
    }

    ws.onmessage = function (event) {
        if (!canSend) return;
        
        var data = event.data;
        var json = JSON.parse(data);

        if (peerConn && json.signal) {
            peerConn.signal(json.signal);
        }
    };

    ws.onopen = function () {
        canSend = true;

        peerConn = getNewPeer();
        
        peerConn.on("signal", (data) => {
            if (!canSend) return;
            ws.send(JSON.stringify({
                signal: data
            }));
        });
        
        peerConn.on("connect", () => {
            loadingScreen.hidden = true;
            appScreen.hidden = false;

            intentionalWsClose = true;
            canSend = false;
            ws.close(); 
        });

        peerConn.on("close", triggerReconnect);
        peerConn.on("error", triggerReconnect);

        if (peerConn._pc) {
            peerConn._pc.addEventListener("iceconnectionstatechange", () => {
                var state = peerConn._pc.iceConnectionState;

                if (state === "disconnected" || state === "failed" || state === "closed") {
                    triggerReconnect();
                }
            });
        }
    };

    ws.onclose = function() {
        if (!intentionalWsClose) triggerReconnect();
    };
    
    ws.onerror = function() {
        if (!intentionalWsClose) triggerReconnect();
    };
}

module.exports = {
    initiateConnection
};