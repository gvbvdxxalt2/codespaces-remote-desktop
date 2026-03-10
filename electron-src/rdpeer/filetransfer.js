var fs = require("fs");
var os = require("os");
var path = require("path");
var {exec} = require("child_process");

var UPLOAD_FOLDER = path.resolve(path.join(os.homedir(),"Downloads"));

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
                filePath = json.outside;
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
    if (json.p !== transfer.filePath) {
        //Reject the packet because the path doesn't match up.
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
    },1000);

    if (json.end) {
        transfer.close();
    }
}

function handleFileTransferMessages(json,peerConn) {
    if (json.type == "upload") {
        handleUploadChunk(json,peerConn);
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