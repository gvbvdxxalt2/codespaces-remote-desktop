var ws = require("ws");
var { handleGhost } = require("./ghost.js");
var { handleRemoteDesktopConnect } = require("../rdpeer");
var wss = new ws.WebSocketServer({
  noServer: true
});

function handleUpgrade(request, socket, head) {
  var url = decodeURIComponent(request.url);
  var urlsplit = url.split("/");

  if (urlsplit[1] == "connect") {
    wss.handleUpgrade(request, socket, head, function done(ws) {
      handleGhost(ws);
      wss.emit("connection", ws, request);
      handleRemoteDesktopConnect(ws);
    });
    return;
  }

  wss.handleUpgrade(request, socket, head, function done(ws) {
    handleGhost(ws);
    wss.emit("connection", ws, request);
    ws.close();
  });
}

module.exports = { handleUpgrade };