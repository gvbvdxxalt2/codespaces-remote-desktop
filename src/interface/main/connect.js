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

    ws.onmessage = function (event) {
        if (!canSend) {
            return;
        }
        
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
            if (!canSend) {
                return;
            }
            ws.send(JSON.stringify({
                signal: data
            }));
        });
        peerConn.on("connect", () => {
            loadingScreen.hidden = true;
            appScreen.hidden = false;
        });

        peerConn.on("close", () => {
            appScreen.hidden = true;
            setTimeout(() => {
                initiateConnection();
            },500);
        });
    };
    ws.onclose = function () {
        canSend = false;
    };
}

module.exports = {
    initiateConnection
};