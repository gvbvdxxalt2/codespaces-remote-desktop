var peerConfig = require("./peer-config.js");
var peer = require("simple-peer");
var desktopStream = null;

var { handleInputTypes, handleInputClose } = require("./inputs.js");
var { handleFileTransferMessages, handleFTClose } = require("./filetransfer.js");

async function initStream() {
    desktopStream = await navigator.mediaDevices.getDisplayMedia({
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
      elfBrowserSurface: "include",
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

    peerConn.on("data", (data) => {
      var text = data.toString();
      try{
        var json = JSON.parse(text);
      }catch(e){
        return;
      }

      handleInputTypes(json, peerConn);
      handleFileTransferMessages(json, peerConn);
    });

    peerConn.on("close", () => {
      handleInputClose(peerConn);
    });

    return peerConn;
}

initStream();

module.exports = {getNewRDPeer};