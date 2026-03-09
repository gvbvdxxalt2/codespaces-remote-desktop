var elements = require("../gp2/elements.js");

var elementJSON = [
    {
        element: "style",
        textContent: require("./styles.css")
    },
    {
        element: "style",
        textContent: `[hidden] { display: none !important; user-select: none; pointer-events: none; opacity: 0; }`
    },


    {
        element: "div",
        className: "middleOfScreen startButton",
        gid: "startButton",
        textContent: "Connect"
    },

    {
        element: "img",
        src: "images/spinner.gif",
        className: "middleOfScreen loadingSpinnerGif",
        gid: "loadingScreen",
        hidden: true,
    },

    {
        element: "div",
        gid: "appScreen",
        hidden: true,
    }
];

elements.appendElementsFromJSON(document.body, elementJSON);