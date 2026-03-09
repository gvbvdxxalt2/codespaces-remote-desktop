require("./interface.js");

var elements = require("../gp2/elements.js");
var startButton = elements.getGPId("startButton");
var {start} = require("./main");

startButton.onclick = function () {
    startButton.hidden = true;
    start()
};