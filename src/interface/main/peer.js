var peerConfig = require("../../peer-config.js");
var elements = require("../../gp2/elements.js");
var peer = require("simple-peer");
var { handlePeerConnection } = require("./stream-video.js");
var currentPeer = null;

function getNewPeer() {
    currentPeer = new peer({
        initiator: false,
        config: peerConfig,
        channelConfig: { ordered: false, maxRetransmits: 0 },
        trickle: true,
    });

    handlePeerConnection(currentPeer);
    
    return currentPeer;
}

module.exports = {
    getNewPeer
};