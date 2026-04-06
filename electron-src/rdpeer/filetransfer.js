var fs = require("fs");
var os = require("os");
var path = require("path");
var {exec} = require("child_process");

var UPLOAD_FOLDER = path.join(os.homedir());

var remote = require("@electron/remote");
//var icon = await remote.app.getFileIcon(filePath, { size: 'normal' });

var downloadingFiles = {};

function handleUploadChunk(json,peerConn) {
    if (!peerConn.__ftId) {
        peerConn.__ftId = Date.now();
    }
    if (!downloadingFiles[json.id]) {
        //Init the data.

        initUploadDir();

        var filePath = json.p;

        try{
            if (!json.outside) {
                filePath = path.join(UPLOAD_FOLDER,json.p);
            }
        }catch(e){
            console.log(`[FT]: Unable to generate path for ${json.p}. Error: ${e}`);
            return;
        }

        var transfer = {
            filePath,
            peerConn: peerConn,
            writeStream: null,
            id: json.id,
            timeout: null,
            close: function () {
                delete downloadingFiles[json.id];
                clearTimeout(transfer.timeout);
                if (transfer.writeStream) {
                    transfer.writeStream.end();
                }
            }
        };
        downloadingFiles[json.id] = transfer;
    }

    var transfer = downloadingFiles[json.id];

    if (peerConn.__ftId !== transfer.peerConn.__ftId) {
        //Another peer is trying to upload to the same id.
        //Reject it's packets.
        return;
    }

    var writeStream = transfer.writeStream;
    if (!writeStream) {
        try{
            fs.writeFileSync(transfer.filePath,"");
            writeStream = fs.createWriteStream(transfer.filePath);
            transfer.writeStream = writeStream;
        }catch(e){
            console.log(`[FT]: Unable to transfer file ${transfer.filePath}`);
            return;
        }
    }

    if (!Array.isArray(json.c)) {
        return;
    }

    var chunk = Uint8Array.from(json.c);
    try{
        writeStream.write(chunk);
    }catch(e){
        return;
    }

    clearTimeout(transfer.timeout);

    transfer.timeout = setTimeout(() => {
        transfer.timeout = null;
        transfer.close();
    },2000);

    if (json.end) {
        transfer.close();
    }
}

function handleReaddir(json,peerConn) {
    var id = json.id;

    var filePath = json.p;
    var sentPath = json.p;

        try{
            if (!json.outside) {
                filePath = path.join(UPLOAD_FOLDER,json.p);
            }
        }catch(e){
            try{
                peerConn.send(JSON.stringify({
                    type: "readdir-error",
                    id,
                }));
            }catch(e){}
            console.log(`[FT]: Unable to generate path for ${json.p}. Error: ${e}`);
            return;
        }

    function generateFiles(files) {
        var output = [];
        for (var file of files) {
            var stat = {};
            try{
                var s = fs.statSync(path.join(filePath,file));
                stat = {
                    dir: s.isDirectory(),
                    size: s.size
                };
            }catch(e){}
            output.push({
                name: file,
                path: path.join(sentPath,file),
                stat
            });
        }

        return output;
    }

    fs.readdir(filePath, (err,files) => {
        if (err) {
            try{
                peerConn.send(JSON.stringify({
                    type: "readdir-error",
                    id,
                }));
            }catch(e){}
        } else {
            var resultObject = generateFiles(files);
            var resultSend = JSON.stringify(resultObject);

            var chunkNum = 0;
            var maxSize = 100;

            var interval = setInterval(() => {
                var chunk = "";
                var size = 0;
                var chunkDone = false;
                var isEnd = false;
                while (!chunkDone) {
                    chunk += resultSend[chunkNum];
                    chunkNum += 1;
                    size += 1;
                    if (size >= maxSize) {
                        chunkDone = true;
                    }
                    if (chunkNum >= resultSend.length) {
                        chunkDone = true;
                        clearInterval(interval);
                        isEnd = true;
                    }
                }
                try{
                peerConn.send(JSON.stringify({
                    type: "readdir-result",
                    id,
                    c: chunk,
                    end: isEnd
                }));
            }catch(e){
                clearInterval(interval);
            }
            },5);
        }
    });
}

function handleMkdir(json,peerConn) {
    var id = json.id;

    var filePath = json.p;
    var sentPath = json.p;
    console.log("Requesting mkdir on: "+sentPath);
    
        try{
            if (!json.outside) {
                filePath = path.join(UPLOAD_FOLDER,json.p);
            }
        }catch(e){
            console.log(`[FT]: Unable to generate path for ${json.p}. Error: ${e}`);
            return;
        }

    fs.mkdir(filePath, { recursive: true }, (err) => {
        if (err) {
            try{
                    peerConn.send(JSON.stringify({
                        type: "mkdir-error",
                        id,
                    }));
                }catch(e){}
        } else {
            try{
                    peerConn.send(JSON.stringify({
                        type: "mkdir-success",
                        id,
                    }));
                }catch(e){}
        }
    });
}

function handleFileTransferMessages(json,peerConn) {
    if (json.type == "upload") {
        handleUploadChunk(json,peerConn);
    }
    if (json.type == "readdir") {
        handleReaddir(json,peerConn);
    }
    if (json.type == "mkdir") {
        handleMkdir(json,peerConn);
    }
}

function handleFTClose(json,peerConn) {

}

function initUploadDir() {
    if (!fs.existsSync(UPLOAD_FOLDER)) {
        fs.mkdirSync(UPLOAD_FOLDER);
    }
    UPLOAD_FOLDER = path.resolve(UPLOAD_FOLDER);
}

module.exports = {
    handleFileTransferMessages,
    handleFTClose
};