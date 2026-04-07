var peerConfig = require("../../peer-config.js");
var elements = require("../../gp2/elements.js");
var peer = require("simple-peer");
var { handlePeerConnection } = require("./stream-video.js");
var { handlePeerConnectionFM } = require("./explorer.js");
var currentPeer = null;

function getNewPeer() {
    currentPeer = new peer({
        initiator: true,
        config: peerConfig,
        trickle: true,
        sdpTransform: function (sdp) {
            return sdp.replace(/a=mid:video\r\n/g, 'a=mid:video\r\na=extmap-allow-mixed\r\n');
        }
    });

    handlePeerConnection(currentPeer);
    handlePeerConnectionFM(currentPeer);
    
    return currentPeer;
}

module.exports = {
    getNewPeer
};