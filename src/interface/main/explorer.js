var FileExplorer = require("js-fileexplorer");

var explorerOpts = {
    initpath: [
			[ '', 'Projects (/)', { canmodify: false } ]
		],

		onrefresh: function(folder, required) {

            if (folder === this.GetCurrentFolder())
			{
			}

            if (this.IsMappedFolder(folder))  {
                folder.SetEntries([
                    
                ]);
            }
        }
};

var explorerContainer = elements.getGPId("appContent-explorer");


var explorer = new FileExplorer(explorerContainer,explorerOpts);

function handlePeerConnectionFM() {

}

module.exports = {handlePeerConnectionFM};