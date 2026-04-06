
var downloadTransfers = {};

function uint8ToJSONable(data) {
    return String.fromCharCode.apply(null, data);
}

function JSONableToUint8(data) {
    const binary = data;
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
}

function sendDownloadRequest(peerConn,filePath,sendOutside,ProgressMonitor) {
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
        var chunk = uint8ToJSONable(chunkText);
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
            outside: sendOutside ? true : undefined,
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
var CHUNK_SIZE = 17000;

function uploadFile(peerConn,targetPath,uint8array,sendOutside,onProgress = (cur,max) => {}) {
    return new Promise((resolve,reject) => {
        var id = "r"+Date.now()+"-"+Math.round(Math.random()*999999);
        uploadQueue[id] = {
            peerConn,
            targetPath,
            uint8array,
            sendOutside,
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
    var {
        peerConn,
        targetPath,
        uint8array,
        resolve,
        reject,
        destroy,
        progressCallback,
        curByte,
        sendOutside
    } = uploadQueue[id];

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
        if (size >= CHUNK_SIZE) {
            chunkFinished = true;
        }
        if (curByte >= length) {
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
            c: uint8ToJSONable(chunkUint),
            end: finished,
            outside: sendOutside ? true : undefined,
            id
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

var readdirRequests = {};

function requestReaddir(peerConn,readdirPath,isOutside) {
    var id = "r"+Date.now()+"-"+Math.round(Math.random()*999999);

    return new Promise((resolve, reject) => {
        var timeout = null;
        function resetTimeout() {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                reject("Request timeout");
                readdirRequests[id] = 0;
                delete readdirRequests[id];
            },10000);
        }

        resetTimeout();

        readdirRequests[id] = {
            resolve: function (r) {
                resolve(r);
                clearTimeout(timeout);
                readdirRequests[id] = 0;
                delete readdirRequests[id];
            }, reject, resetTimeout
        };

        peerConn.send(JSON.stringify({
                type: "readdir",
                p: readdirPath,
                outside: isOutside,
                id
            }));
    });
}

var mkdirRequests = {};

function requestMkdir(peerConn,targetPath,isOutside) {
    var id = "r"+Date.now()+"-"+Math.round(Math.random()*999999);

    return new Promise((resolve, reject) => {   
        var timeout = null;
        function resetTimeout() {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                reject("Request timeout");
                mkdirRequests[id] = 0;
                delete mkdirRequests[id];
            },2500);
        }

        resetTimeout();

        mkdirRequests[id] = {
            resolve: function (r) {
                resolve(r);
                clearTimeout(timeout);
                mkdirRequests[id] = 0;
                delete mkdirRequests[id];
            }, reject, resetTimeout
        };

        peerConn.send(JSON.stringify({
                type: "mkdir",
                p: targetPath,
                outside: isOutside,
                id
            }));
    });
}

var newfileRequests = {};

function requestNewFile(peerConn,targetPath,isOutside) {
    var id = "r"+Date.now()+"-"+Math.round(Math.random()*999999);

    return new Promise((resolve, reject) => {   
        var timeout = null;
        function resetTimeout() {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                reject("Request timeout");
                newfileRequests[id] = 0;
                delete newfileRequests[id];
            },2500);
        }

        resetTimeout();

        newfileRequests[id] = {
            resolve: function (r) {
                resolve(r);
                clearTimeout(timeout);
                newfileRequests[id] = 0;
                delete newfileRequests[id];
            }, reject, resetTimeout
        };

        peerConn.send(JSON.stringify({
                type: "newfile",
                p: targetPath,
                outside: isOutside,
                id
            }));
    });
}

var moveRequests = {};

function requestMove(peerConn,startPath,endPath,isOutside) {
    var id = "r"+Date.now()+"-"+Math.round(Math.random()*999999);

    return new Promise((resolve, reject) => {   
        var timeout = null;
        function resetTimeout() {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                reject("Request timeout");
                moveRequests[id] = 0;
                delete moveRequests[id];
            },2500);
        }

        resetTimeout();

        moveRequests[id] = {
            resolve: function (r) {
                resolve(r);
                clearTimeout(timeout);
                moveRequests[id] = 0;
                delete moveRequests[id];
            }, reject, resetTimeout
        };

        peerConn.send(JSON.stringify({
                type: "move",
                p: startPath,
                destp: endPath,
                outside: isOutside,
                id
            }));
    });
}

async function handleJSON(json) {
    if (json.type == "readdir-error") {
        var id = json.id;
        var request = readdirRequests[id];
        if (!request) {
            return;
        }

        request.reject("Response error");
        readdirRequests[id] = 0;
        delete readdirRequests[id];
        return;
    }

    if (json.type == "readdir-result") {
        var id = json.id;
        var request = readdirRequests[id];
        if (!request) {
            return;
        }

        if (!request.result) {
            request.result = "";
        }
        request.resetTimeout();

        request.result += json.c;

        if (json.end) {
            request.resolve(JSON.parse(request.result));
        }
        return;
    }

    if (json.type == "mkdir-error") {
        var id = json.id;
        var request = mkdirRequests[id];
        if (!request) {
            return;
        }

        request.reject("Response error");
        mkdirRequests[id] = 0;
        delete mkdirRequests[id];
        return;
    }

    if (json.type == "mkdir-success") {
        var id = json.id;
        var request = mkdirRequests[id];
        if (!request) {
            return;
        }

        request.resolve();
        return;
    }

    if (json.type == "newfile-error") {
        var id = json.id;
        var request = newfileRequests[id];
        if (!request) {
            return;
        }

        request.reject("Response error");
        newfileRequests[id] = 0;
        delete newfileRequests[id];
        return;
    }

    if (json.type == "newfile-success") {
        var id = json.id;
        var request = newfileRequests[id];
        if (!request) {
            return;
        }

        request.resolve();
        return;
    }

    if (json.type == "move-error") {
        var id = json.id;
        var request = moveRequests[id];
        if (!request) {
            return;
        }

        request.reject("Response error");
        moveRequests[id] = 0;
        delete moveRequests[id];
        return;
    }

    if (json.type == "move-finish") {
        var id = json.id;
        var request = moveRequests[id];
        if (!request) {
            return;
        }

        request.resolve();
        return;
    }

    if (json.type == "move-ping") {
        var id = json.id;
        var request = moveRequests[id];
        if (!request) {
            return;
        }

        request.resetTimeout();
        return;
    }
}

module.exports = {
    uploadFile,
    sendDownloadRequest,
    handleJSON,
    requestReaddir,
    requestMkdir,
    requestMove,
    requestNewFile
};