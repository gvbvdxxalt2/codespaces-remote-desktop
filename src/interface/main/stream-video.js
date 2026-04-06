
const { eventNames } = require("process");
var elements = require("../../gp2/elements.js");
var appContent = elements.getGPId("appContent-desktop");

var MENU_BAR_HEIGHT = 30;

var appCanvas = elements.getGPId("appDesktopScreen");

function isSortaHidden(elm) {
    var rect = elm.getBoundingClientRect();
    var isHidden = rect.width === 0 && rect.height === 0;
    return isHidden;
}

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
    var bounding = appContent.getBoundingClientRect();
    var scale = bounding.height / appCanvas.height;
    if (scale > (bounding.width / appCanvas.width)) {
        scale = bounding.width / appCanvas.width;
    }
    appCanvas.style.width = (appCanvas.width * scale)+"px";
    appCanvas.style.height = (appCanvas.height * scale)+"px";

    currentPeer = peerConn;

    if (video.srcObject) {
        ctx.drawImage(video, 0, 0, appCanvas.width, appCanvas.height);
        if (video.buffered.length > 0) {
            video.currentTime = video.buffered.end(video.buffered.length - 1);
        }
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
    const videoTrack = currentStream.getVideoTracks()[0];
    const settings = videoTrack.getSettings();

    // 1. Set the internal resolution immediately based on the track
    appCanvas.width = settings.width || 1280;
    appCanvas.height = settings.height || 720;

    // 2. Start the Input/Sizing loop (Logic previously in updateInterval)
    startInputLoop(peerConn);

    if (window.MediaStreamTrackProcessor) {
        const processor = new MediaStreamTrackProcessor(videoTrack);
        const reader = processor.readable.getReader();

        async function readFrame() {
            try{
                video.play();
            }catch(e){}
            const { done, value: frame } = await reader.read();
            if (done) return;
            if (frame) {
                ctx.drawImage(frame, 0, 0, appCanvas.width, appCanvas.height);
                frame.close(); 
            } else {
                try{frame.close();}catch(e){}
            }
        }
        setInterval(readFrame,1000/100);
    } else {
        // Fallback for non-supported browsers
        video.srcObject = currentStream;
        video.play().catch(()=>{});
        
        function renderVideo() {
            if (video.srcObject) {
                ctx.drawImage(video, 0, 0, appCanvas.width, appCanvas.height);
                // Sync to latest buffer
                if (video.buffered.length > 0) {
                    video.currentTime = video.buffered.end(video.buffered.length - 1);
                }
            }
            requestAnimationFrame(renderVideo);
        }
        renderVideo();
    }
}

function startInputLoop(peerConn) {
    currentPeer = peerConn;
    clearInterval(interval);
    
    interval = setInterval(() => {
        // --- RESIZING LOGIC (Fixes the "Tiny Screen") ---
        var bounding = appContent.getBoundingClientRect();
        var scale = bounding.height / appCanvas.height;
        if (scale > (bounding.width / appCanvas.width)) {
            scale = bounding.width / appCanvas.width;
        }
        appCanvas.style.width = (appCanvas.width * scale) + "px";
        appCanvas.style.height = (appCanvas.height * scale) + "px";

        // --- INPUT LOGIC ---
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
    }, 1000 / 64);
}

function handlePeerConnection(peerConn) {
    peerConn.on("stream", (stream) => {
        currentStream = stream;
        if (currentStream) {
            startUpdateLoop(peerConn);
        }
    });
    peerConn.on("data", (data) => {
        var json = JSON.parse(data);

        handleJSON(json);
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
    if (isSortaHidden(appCanvas)) {
        return;
    }

    var pos = getMousePosition(event, appCanvas, [appCanvas.width,appCanvas.height]);
    mousePos[0] = pos.x/appCanvas.width;
    mousePos[1] = pos.y/appCanvas.height;
});

appCanvas.addEventListener("mousedown",(event) => {
    if (isSortaHidden(appCanvas)) {
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
    if (isSortaHidden(appCanvas)) {
        return;
    }
    
    event.preventDefault();
    
    mousePos[4] = true;
});

document.addEventListener("keydown",(event) => {
    if (isSortaHidden(appCanvas)) {
        return;
    }

    if (currentPeer) {

        /*if (event.key.toLowerCase() == "u" && event.ctrlKey && event.shiftKey) {
            sendUploadTest(currentPeer);
            return;
        }*/

        try{
            currentPeer.send(JSON.stringify({
                type: "key",
                code: event.code,
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
                code: event.code,
                down: false
            }));
            event.preventDefault();
        }catch(e){}
    }
});

document.addEventListener("wheel", (event) => {
    event.preventDefault();

    if (isSortaHidden(appCanvas) || !currentPeer) {
        return;
    }

    let deltaX = event.deltaX;
    let deltaY = event.deltaY;

    if (event.deltaMode === 1) { // DOM_DELTA_LINE
        deltaX *= 40;
        deltaY *= 40;
    } else if (event.deltaMode === 2) { // DOM_DELTA_PAGE
        deltaX *= 800;
        deltaY *= 800;
    }

    var normalizedX = Math.round(deltaX / 15);
    var normalizedY = Math.round(deltaY / 15);

    try {
        currentPeer.send(JSON.stringify({
            type: "wheel",
            m: [-normalizedX, -normalizedY],
        }));
    } catch(e) {
        console.error("Failed to send wheel event:", e);
    }
}, { passive: false });

var {uploadFile,handleJSON} = require("./filesend.js");

function sendUploadTest(peerConn) {
    var input = document.createElement("input");
    input.type = "file";

    input.onchange = function () {
        var files = input.files;
        if (files && files[0]) {
            var file = files[0];

            var reader = new FileReader();
            reader.onload = async function () {
                var uint8array = new Uint8Array(reader.result);

                await uploadFile(
                    peerConn,
                    file.name || "upload.file",
                    uint8array
                );
                window.alert("File was uploaded!");
            };
            reader.readAsArrayBuffer(file);

        }
        input.value = "";
    };

    input.click();
}

var isFixingVideo = false;

document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
        if (!video.srcObject || !currentStream || !currentPeer || isFixingVideo) {
            return;
        }
        isFixingVideo = true;
        const stream = video.srcObject;
        
        video.srcObject = null;
        video.load();
        video.srcObject = stream;
        video.play().catch(e => console.error("Recovery failed:", e));
        
        isFixingVideo = false;
    }
});

require("./tab.js");

module.exports = {handlePeerConnection};