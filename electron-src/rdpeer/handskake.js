var { getNewRDPeer } = require("./peer.js");

var signalTimeout = 3000;

function handleRemoteDesktopConnect(ws) {
    try{
        var peer = getNewRDPeer();
    }catch(e){
        try{ws.close()}catch(e){};
        return;
    }
    var canSignal = true;
    var timeout = setTimeout(cleanupWebsocket, signalTimeout);
    
    peer.on("signal", (data) => {
        ws.send(JSON.stringify({signal: data}));
        clearTimeout(timeout);
        timeout = setTimeout(cleanupWebsocket, signalTimeout);
    });

    ws.on("message", (data, isBinary) => {
        if (isBinary) {
            return;
        }

        try{
            var json = JSON.parse(data.toString());
        }catch(e){return;}

        if (json.signal) {
            peer.signal(json.signal);
        }
    });
    
    ws.on("close", () => {
        canSignal = false;
        clearTimeout(timeout);
    });

    function cleanupWebsocket() {
        canSignal = false;
        clearTimeout(timeout);
        try{ws.close();}catch(e){}
    }
}

module.exports = { handleRemoteDesktopConnect };