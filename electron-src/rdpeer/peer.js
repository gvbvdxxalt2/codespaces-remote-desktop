var peerConfig = require("./peer-config.js");
var peer = require("simple-peer");
var desktopStream = null;

async function initStream() {
    desktopStream =
                              await navigator.mediaDevices.getDisplayMedia({
                                video: {
                                  displaySurface: "browser",
                                  cursor: "always",
                                },
                                audio: {
                                  suppressLocalAudioPlayback: false,
                                  echoCancellation: false,
                                  noiseSuppression: false,
                                  sampleRate: 44100,
                                },
                                preferCurrentTab: false,
                                selfBrowserSurface: "include",
                                systemAudio: "include",
                                surfaceSwitching: "include",
                                monitorTypeSurfaces: "include",
                              });
}

function getNewRDPeer() {
    if (!desktopStream) {
        throw new Error("Desktop stream is not ready.");
    }

    var peerConn = new peer({
        initiator: true,
        config: peerConfig,
        channelConfig: { ordered: false, maxRetransmits: 0 },
        trickle: true,
        stream: desktopStream
    });



    return peerConn;
}

module.exports = {getNewRDPeer};