
var downloadTransfers = {};

function uint8ToText(uint8) {
    var i = 0;
    var txt = "";
    while (i < uint8.length) {
        txt += String.fromCharCode(uint8[i]);
        i += 1;
    }
    return txt;
}

function textToUint8(txt) {
    var i = 0;
    var uint8 = new Uint8Array(txt.length);
    while (i < uint8.length) {
        uint8[i] = txt[i].fromCharCode();
        i += 1;
    }
    return uint8;
}

function sendDownloadRequest(peerConn,filePath,ProgressMonitor) {
    var onProgress = ProgressMonitor || ((cur,max) => {});
    var id = "r"+Date.now()+"-"+Math.round(Math.random()*999999);
    var finished = () => {};
    var failed = () => {};

    var chunks = [];
    var chunkTimeout = null;
    function dispose() {
        finished = () => {};
        failed = () => {};
        clearTimeout(chunkTimeout);
        downloadTransfers[id] = null;
        delete downloadTransfers[id];
    }
    function setChunkTimeout() {
        clearTimeout(chunkTimeout);
        chunkTimeout = setTimeout(() => {
            failed();
            dispose();
        },1000);
    }

    setChunkTimeout();

    downloadTransfers[id] = function (chunkText,maximumChunks) {
        var chunk = textToUint8(chunkText);
        chunks.push(chunk);
        if (onProgress) {
            onProgress(chunks.length,maximumChunks);
        }
        if (chunks.length == maximumChunks) {
            finished();
            dispose();
        }
    };

    try{
        peerConn.send(JSON.stringify({
            type: "filereadreq",
            p: filePath,
            id
        }));
    }catch(e){
        downloadTransfers[id] = null;
        delete downloadTransfers[id];
        throw new Error("Was unable to send request. "+e);
        return;
    }
    
    return new Promise((resolve, reject) => {
        failed = function () {
            reject("Waiting for chunk timed out.");
        };
        finished = function () {
            var blob = new Blob(chunks);
            resolve(blob);
            dispose();
        };
    });
}

var uploadQueue = {};
var UPLOAD_SPEED = 15;
var CHUNK_SIZE = 4000;

function uploadFile(peerConn,targetPath,uint8array,onProgress = (cur,max) => {}) {
    return new Promise((resolve,reject) => {
        var id = "r"+Date.now()+"-"+Math.round(Math.random()*999999);
        uploadQueue[id] = {
            peerConn,
            targetPath,
            uint8array,
            progressCallback: onProgress || (() => {}),
            curByte: 0,
            resolve,
            reject,
            destroy: () => {
                uploadQueue[id] = null;
                delete uploadQueue[id];
            }
        };
    });
}

function handleUploadFile(id) {
    var {peerConn,targetPath,uint8array,resolve,reject,destroy,progressCallback} = uploadQueue[id];
    var curByte = uploadQueue[id];

    if (!peerConn) {
        reject("Peer connection is empty");
        destroy();
        return;
    }

    if (!uint8array) {
        reject("uint8array is empty");
        destroy();
        return;
    }

    var length = uint8array.length;
    var chunk = [];
    var size = 0;
    var chunkFinished = false;
    var finished = false;

    while (!chunkFinished) { 
        chunk.push(uint8array[curByte]);
        curByte += 1;
        size += 1;
        if (size > CHUNK_SIZE) {
            chunkFinished = true;
        }
        if (size > length) {
            chunkFinished = true;
            finished = true;
            resolve();
        }
    }

    var chunkUint = Uint8Array.from(chunk);

    try{
        peerConn.send(JSON.stringify({
            type: "upload",
            p: targetPath,
            c: uint8ToText(chunkUint)
        }));
        progressCallback(curByte,length);
    }catch(e){
        reject("Unable to send to peer: "+e);
        destroy();
        return;
    }

    uploadQueue[id].curByte = curByte;

    if (finished) {
        resolve();
        destroy();
    }
}

setInterval(() => {
    for (var id of Object.keys(uploadQueue)) {
        handleUploadFile(id);
    }
},UPLOAD_SPEED);

module.exports = {
    uploadFile,
    sendDownloadRequest
};