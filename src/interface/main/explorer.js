var elements = require("../../gp2/elements.js");
var FileExplorer = require("../../file-explorer/file-explorer.js");
if (window.FileExplorer) {
    FileExplorer = window.FileExplorer; //Weridly it defines window.FileExplorer but doesn't export to module.
}

var {requestReaddir,requestMkdir,requestMove} = require("./filesend.js");

var currentPeerConn = null;

function getPathFromJSFMFolder(folder) {
	return getPathFromIds(folder.GetPathIDs());
}

function getPathFromIds(ids) {
				var pathParts = ids;
			pathParts = pathParts.filter((p) => !!p); //Removes empty parts.
			
			var baseDir = pathParts.join("/");
			baseDir = baseDir.split("/").filter((p) => !!p).join("/"); //Double run to remove empty paths (again).
			if (!baseDir.endsWith("/")) baseDir += "/";
			return baseDir;
}

var explorerOpts = {
    group: 'desktop-fm',
    capturebrowser: false,

    initpath: [
			[ '/', '/', {} ]
		],

        tools: {
        item_checkboxes: true,
        rename: true,
        delete: true,
        new_folder: true,
        new_file: true,
        upload: true,
        download: true
    },

		onrefresh: async function(folder, required) {

			if (!currentPeerConn) {
				this.SetNamedStatusBarText('folder', this.EscapeHTML('No connection to view files on.'));
				return;
			}

            if (folder === this.GetCurrentFolder())
			{
			}

            if (this.IsMappedFolder(folder))  {
				try{
					var baseDir = getPathFromJSFMFolder(folder);
					var response = await requestReaddir(currentPeerConn,baseDir);

					folder.SetEntries(
						response.map((file) => {
							var preview = file.stat.preview ? file.stat.preview : undefined;
							//window.alert(preview);
							return {
								"name": file.name,   // The text displayed in the list
								"type": file.stat.dir ? "folder" : "file",
								"size": file.stat.size || 0,
								"id":file.name,
								"hash":file.name,
								"thumb": preview
							};
						}));
				}catch(e){
					console.error(e);
					this.SetNamedStatusBarText('folder', this.EscapeHTML('Failed to load folder.  '+e));
					folder.SetEntries([]);
				}
            }
        },

        onrename: async function(renamed, folder, entry, newname) {
			if (!currentPeerConn) {
				renamed(entry);
				return;
			}

			var baseDir = getPathFromJSFMFolder(folder);

			var oldPath = baseDir + entry.name;
			var newPath = baseDir + newname;

			try{
				await requestMove(currentPeerConn,oldPath,newPath);
				entry.name = newname;
				entry.id = newname;
				setTimeout(() => {
					renamed(entry);
				},10);
			}catch(e){
				console.error("Rename error: "+e);
				renamed(entry);
				this.SetNamedStatusBarText('folder', this.EscapeHTML('Failed to rename.  '+e));
			}
		},

		onopenfile: function(folder, entry) {
		},

		onnewfolder: async function(created, folder) {
			if (!currentPeerConn) {
				created("No peer connection to make new folder on.");
				return;
			}
			try{
				var defaultName = 'New Folder '+Date.now();
				var entry = { name: defaultName, type: 'folder', id: defaultName, hash: defaultName };
				var paths = folder.GetPath();
				var actualPath = paths[paths.length-1][0];
				if (!actualPath.endsWith("/")) {
					actualPath += "/";
				}
				actualPath += entry.name;
				await requestMkdir(currentPeerConn,actualPath);
				setTimeout(() => {
					created(entry);
				},10);
			}catch(e){
				console.error(e);
				created(""+e);
			}
		},

		onnewfile: function(created, folder) {
console.log('onnewfile');
			// Simulate network delay.
			setTimeout(function() {
				var entry = { name: 'New File.txt', type: 'file', id: 'asdfasdffile123', hash: 'asdfasdffile123' };

				created(entry);
			}, 250);
		},

		oninitupload: function(startupload, fileinfo) {
console.log('oninitupload');
console.log(fileinfo.file);
console.log(JSON.stringify(fileinfo.folder.GetPathIDs()));

			if (fileinfo.type === 'dir')
			{
				// Create a directory.  This type only shows up if the directory is empty.

				// Simulate network delay.
				setTimeout(function() {

					// Passing false as the second parameter to startupload will remove the item from the queue.
					startupload(false);
				}, 250);
			}
			else
			{
				// For those who wish to handle file uploads via external libraries, fileinfo.file contains the File object.

				// Simulate network delay.
				setTimeout(function() {
					// Set a URL, headers, and params to send with the file data to the server.
					fileinfo.url = 'filemanager/';

					fileinfo.headers = {
					};

					fileinfo.params = {
						action: 'upload',
						id: 'temp-12345',
						path: JSON.stringify(fileinfo.folder.GetPathIDs()),
						name: fileinfo.fullPath,
						size: fileinfo.file.size,
						xsrftoken: 'asdfasdf'
					};

					fileinfo.fileparam = 'file';

					// Optional:  Send chunked uploads.  Requires the server to know how to put chunks back together.
					fileinfo.chunksize = 1000000;

					// Optional:  Automatic retry count for the file on failure.
					fileinfo.retries = 3;

					// Start the upload.
					startupload(true);
				}, 250);
			}
		},

		// Optional upload handler function to finalize an uploaded file on a server (e.g. move from a temporary directory to the final location).
		onfinishedupload: function(finalize, fileinfo) {
            finalize(true);
		},

		// Optional upload handler function to receive permanent error notifications.
		onuploaderror: function(fileinfo, e) {
console.log('onuploaderror');
console.log(e);
console.log(fileinfo);
		},

		oninitdownload: function(startdownload, folder, ids, entries) {
				var options = {};

				// Optional:  HTTP method to use.
//				options.method = 'POST';

				options.url = 'filemanager/';

				options.params = {
					action: 'download',
					path: JSON.stringify(folder.GetPathIDs()),
					ids: JSON.stringify(ids),
					xsrftoken: 'asdfasdf'
				};

				// Optional:  Control the download via an in-page iframe (default) vs. form only (new tab).
//				options.iframe = false;

				startdownload(options);
		},

		ondownloadstarted: function(options) {
		},

		ondownloaderror: function(options) {

		},

		// Calculated information must be fully synchronous (i.e. no AJAX calls).  Chromium only.
		ondownloadurl: function(result, folder, ids, entry) {
			result.name = (ids.length === 1 ? (entry.type === 'file' ? entry.name : entry.name + '.zip') : 'download-' + Date.now() + '.zip');
			result.url = 'http://127.0.0.1/filemanager/?action=download&xsrfdata=asdfasdfasdf&xsrftoken=asdfasdf&path=' + encodeURIComponent(JSON.stringify(folder.GetPathIDs())) + '&ids=' + encodeURIComponent(JSON.stringify(ids));
		},

		oncopy: function(copied, srcpath, srcids, destfolder) {
            var entries = [];
            copied(true, entries);
		},

		onmove: function(moved, srcpath, srcids, destfolder) {
            var entries = [];
			moved(true, entries);
		},

		ondelete: function(deleted, folder, ids, entries, recycle) {
			deleted(true);
		},
};

var explorerContainer = elements.getGPId("appContent-explorer");
var fmAppContent = elements.getGPId("fmAppContent");
var fileExplorer = null;
function refreshOrLoadExplorer () {
	if (!fileExplorer) {
		fileExplorer = new FileExplorer(fmAppContent,explorerOpts);
	} else {
		fileExplorer.SetPath(this.GetCurrentFolder().GetPath());
	}
}
function handlePeerConnectionFM(peerConn) {
	currentPeerConn = peerConn;
	peerConn.on("connect", () => {
		refreshOrLoadExplorer();
		setInterval(() => {
			refreshOrLoadExplorer();
		},10);
	});
}

module.exports = {handlePeerConnectionFM};