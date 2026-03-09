var elements = require("../../gp2/elements.js");
var { initiateConnection } = require("./connect.js");

function start() {
    initiateConnection();
}

module.exports = {start};
