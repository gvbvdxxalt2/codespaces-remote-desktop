
var elements = require("../../gp2/elements.js");
var appScreen = elements.getGPId("appScreen");

var appCanvas = elements.createElementsFromJSON([
    {
        element: "canvas",
        className: "rdScreenCanvas"
    }
])[0];

var currentStream = null;
var video = document.createElement("video");

var interval = null;
var mousePos = [null,null];
var previousMousePos = [null,null];

var ctx = appCanvas.getContext("2d");

video.addEventListener("loadedmetadata", (event) => {
  var width = event.target.videoWidth;
  var height = event.target.videoHeight;

  appCanvas.width = width;
  appCanvas.height = height;
});

function updateInterval(peerConn) {
    if (video.srcObject) {
        ctx.drawImage(video, 0, 0, appCanvas.width, appCanvas.height);
    }
    try{
        video.play();
    }catch(e){}
    if (typeof mousePos[0] == "number") {
        var isDiff = mousePos.some((p,i) => p !== previousMousePos[i]);
        if (isDiff) {
            peerConn.send(JSON.stringify({
                type: "pos",
                p: mousePos
            }));
            previousMousePos = Array.from(mousePos);
        }
    }
}

function startUpdateLoop(peerConn) {
    video.srcObject = currentStream;
    clearInterval(interval);
    interval = setInterval(() => {
        updateInterval(peerConn);
    }, 1000/65);

    previousMousePos = [null,null];
}

function handlePeerConnection(peerConn) {
    peerConn.on("stream", (stream) => {
        currentStream = stream;
        if (currentStream) {
            startUpdateLoop(peerConn);
        }
    });
}

appScreen.append(appCanvas);

module.exports = {handlePeerConnection};