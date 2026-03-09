var { serveStatic, setCorsHeaders } = require("./serve");

var http = require("http");
var process = require("process");

var { onHttpRequest } = require("./http");
var server = http.createServer(onHttpRequest);

var currentPort = +process.env.PORT || 3000;
server.listen(currentPort);

var { handleUpgrade } = require("./websocket");
server.on("upgrade", handleUpgrade);

console.log(`Remote desktop server is now active on port ${currentPort}`);