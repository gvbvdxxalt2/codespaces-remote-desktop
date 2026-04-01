var elements = require("../../gp2/elements.js");
var menuBar = elements.getGPId("menuBar");

var menuItems = [
    {
        text: "Desktop",
        icon: "images/desktop.svg",
        id: "desktop"
    },
    {
        text: "Explorer",
        icon: "images/explorer.svg",
        id: "explorer"
    }
]

function createTab(isSelected,text,imgSrc,id) {
    return {
        element: "div",
        className: isSelected ? "menuBarItem menuBarItemSelected" : "menuBarItem",
        eventListeners: [
            {
                event: "click",
                func: (() => {
                    selectedId = id;
                    renderTabs();
                })
            }
        ],
        children: [
            {
                element: "img",
                src: imgSrc,
                className: "menuBarIcon"
            },
            {
                element: "span",
                textContent: text
            }
        ]
    };
}

var selectedId = menuItems[0].id;

function renderTabs() {
    menuItems.forEach((item) => {
        var elm = elements.getGPId("appContent-"+item.id);
        if (elm) {
            if (selectedId == item.id) {
                elm.hidden = false;
            } else {
                elm.hidden = true;
            }
        }
    });

    elements.setInnerJSON(menuBar, menuItems.map((item) => {
        return createTab(
            selectedId == item.id,
            item.text,
            item.icon,
            item.id
        );
    }));
}

renderTabs();