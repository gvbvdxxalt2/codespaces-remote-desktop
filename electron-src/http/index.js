var { serveStatic, setCorsHeaders } = require("../serve");
var URL = require("url");

function onHttpRequest(req, res) {
  setCorsHeaders(res);

  var url = decodeURIComponent(req.url);
  var urlsplit = url.split("/");

  serveStatic(req, res);
}

module.exports = { onHttpRequest };