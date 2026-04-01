var elements = require("../../gp2/elements.js");
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
                    {
                        "name": "srb2-mod.pk3",   // The text displayed in the list
                        "type": "file",          // Must be exactly "file" or "folder"
                        "size": 1024,            // Number in bytes (the UI formats this automatically)
                        "hash": "unique_id_1"    // A unique string (filename or ID) so the UI can track it
                    },
                    {
                        "name": "Addons",
                        "type": "folder",
                        "size": 0,
                        "hash": "unique_id_2"
                    }
                ]);
            }
        }
};

var explorerContainer = elements.getGPId("appContent-explorer");


var explorer = new FileExplorer(explorerContainer,explorerOpts);

function handlePeerConnectionFM() {

}

module.exports = {handlePeerConnectionFM};