
const { eventNames } = require("process");
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
var mousePos = [null,null,0,0,0];
var previousMousePos = [null,null];

var ctx = appCanvas.getContext("2d");

var currentPeer = null;



video.addEventListener("loadedmetadata", (event) => {
  var width = event.target.videoWidth;
  var height = event.target.videoHeight;

  appCanvas.width = width*2;
  appCanvas.height = height*2;
});

function updateInterval(peerConn) {

    var scale = window.innerHeight / appCanvas.height;
    if (scale > (window.innerWidth / appCanvas.width)) {
        scale = window.innerWidth / appCanvas.width;
    }
    appCanvas.style.width = (appCanvas.width * scale)+"px";
    appCanvas.style.height = (appCanvas.height * scale)+"px";

    currentPeer = peerConn;

    if (video.srcObject) {
        ctx.drawImage(video, 0, 0, appCanvas.width, appCanvas.height);
    }
    try{
        video.play();
    }catch(e){}
    if (typeof mousePos[0] == "number") {
        var isDiff = JSON.stringify(mousePos) !== JSON.stringify(previousMousePos);
        if (isDiff) {
            peerConn.send(JSON.stringify({
                type: "mouse",
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
    }, 1000/32);

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

function getMousePosition(event, onElement, size) {
  var client = onElement.getBoundingClientRect();

  var relativeX = event.x - client.x;
  var relativeY = event.y - client.y;

  var scaleX = size[0] / client.width;
  var realX = relativeX * scaleX;

  var scaleY = size[1] / client.height;
  var realY = relativeY * scaleY;

  if (realX < 0) {
    realX = 0;
  }
  if (realY < 0) {
    realY = 0;
  }

  if (realX > size[0]) {
    realX = size[0];
  }
  if (realY > size[1]) {
    realY = size[1];
  }

  var pos = {
    x: realX,
    y: realY,
  };
  return pos;
}

appCanvas.addEventListener("mousemove",(event) => {
    if (appCanvas.hidden) {
        return;
    }

    var pos = getMousePosition(event, appCanvas, [appCanvas.width,appCanvas.height]);
    mousePos[0] = pos.x/appCanvas.width;
    mousePos[1] = pos.y/appCanvas.height;
});

appCanvas.addEventListener("mousedown",(event) => {
    if (appCanvas.hidden) {
        return;
    }

    if (event.button == 0) {
        mousePos[2] = true;
    }
    if (event.button == 1) {
        mousePos[3] = true;
    }
    if (event.button == 2) {
        mousePos[4] = true;
    }
    event.preventDefault();

    if (currentPeer) {updateInterval(currentPeer);}
});

document.addEventListener("mouseup",(event) => {
    if (event.button == 0) {
        mousePos[2] = false;
    }
    if (event.button == 1) {
        mousePos[3] = false;
    }
    if (event.button == 2) {
        mousePos[4] = false;
    }

    if (currentPeer) {updateInterval(currentPeer);}
});

document.addEventListener("contextmenu", (event) => {
    if (appCanvas.hidden) {
        return;
    }
    
    event.preventDefault();
    
    mousePos[4] = true;
});

document.addEventListener("keydown",(event) => {
    if (appCanvas.hidden) {
        return;
    }

    if (currentPeer) {

        if (event.key.toLowerCase() == "u" && event.ctrlKey && event.shiftKey) {
            window.alert("Special key pressed!");
            return;
        }

        try{
            currentPeer.send(JSON.stringify({
                type: "key",
                key: event.key,
                down: true
            }));
            event.preventDefault();
        }catch(e){}
    }
});

document.addEventListener("keyup",(event) => {
    if (currentPeer) {
        try{
            currentPeer.send(JSON.stringify({
                type: "key",
                key: event.key,
                down: false
            }));
            event.preventDefault();
        }catch(e){}
    }
});

document.addEventListener("wheel", (event) => {
    // 1. Prevent native browser scrolling/zooming
    event.preventDefault();

    if (appCanvas.hidden || !currentPeer) {
        return;
    }

    // 2. Normalize deltas (Standardizing to pixels)
    // Some browsers report lines (mode 1) or pages (mode 2). 
    // We convert them to a roughly consistent pixel value.
    let deltaX = event.deltaX;
    let deltaY = event.deltaY;

    if (event.deltaMode === 1) { // DOM_DELTA_LINE
        deltaX *= 40;
        deltaY *= 40;
    } else if (event.deltaMode === 2) { // DOM_DELTA_PAGE
        deltaX *= 800;
        deltaY *= 800;
    }

    // 3. Sensitivity Adjustment
    // Instead of raw division, use a factor that makes it feel natural.
    // If it's too fast, increase the divisor. If too slow, decrease it.
    var normalizedX = Math.round(deltaX / 15);
    var normalizedY = Math.round(deltaY / 15);

    try {
        currentPeer.send(JSON.stringify({
            type: "wheel",
            // We send the discrete 'ticks' for xdotool on the server side
            m: [-normalizedX, -normalizedY],
        }));
    } catch(e) {
        console.error("Failed to send wheel event:", e);
    }
}, { passive: false });

document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && video.srcObject) {
        
        // Re-assigning the stream forces the browser to flush its internal 
        // playback buffer and grab the absolute newest frame.
        let tempStream = video.srcObject;
        video.srcObject = null;
        try{video.play();}catch(e){}
        setTimeout(() => {
            video.srcObject = tempStream;
            video.play().catch(e => console.error("Playback failed on focus:", e)).then(() => {
                video.currentTime = video.duration;
                video.play().catch(e => {});
            });
        },100);
    }
});

appScreen.append(appCanvas);

module.exports = {handlePeerConnection};