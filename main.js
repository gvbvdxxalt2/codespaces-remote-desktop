var path = require("path");
var fs = require("fs");
var process = require("process");
var {spawn} = require("child_process");
var readline = require("readline");
const { resolve } = require("path-browserify");

function newRL() {
    return new readline.Interface(process.stdin, process.stdout);
}

const NODE_MODULES = "./node_modules/";
const SETUP_DESKTOP = "./setup-desktop.sh";
const SETUP_DESKTOP_CHMOD = "setup-desktop.sh";
const START_DESKTOP = "./start-desktop.sh";
const START_DESKTOP_CHMOD = "start-desktop.sh";

var processes = {};

function quickChmod(file) {
    return new Promise((resolve, reject) => {
        var proc = spawn("chmod",["+x",file], {cwd: __dirname});
        proc.on("exit", (code) => {
            if (code !== 0) {
                console.log("Non zero exit code for chmod: "+code);
                process.exit(1);
                return;
            }

            resolve();
        });
    });
}

function npmInstall(resolve, reject) {
    var proc = spawn("npm",["install"], {cwd: __dirname});
    proc.stdout.on("data", (content) => {
        //console.log(""+content);
    });
    proc.on("exit", (code) => {
        if (code !== 0) {
            console.log("Non zero exit code for npm install: "+code);
            process.exit(1);
            return;
        }

        npmRebuild(resolve, reject);
    });
}

function npmRebuild(resolve, reject) {
    var proc = spawn("npm",["run","rebuild"], {cwd: __dirname});
    proc.stdout.on("data", (content) => {
    });
    proc.on("exit", (code) => {
        if (code !== 0) {
            console.log("Non zero exit code for npm run rebuild: "+code);
            process.exit(1);
            return;
        }

        resolve();
    });
}

function setupDesktop(resolve, reject) {
    var proc = spawn(SETUP_DESKTOP,[], {cwd: __dirname});
    proc.stdout.on("data", (content) => {
        //console.log(""+content);
    });
    proc.on("exit", (code) => {
        if (code !== 0) {
            console.log("Non zero exit code for setup desktop: "+code);
            process.exit(1);
            return;
        }

        npmInstall(resolve, reject);
    });
}

function install() {
    var resolve = null;
    var reject = null;
    var promise = new Promise((a,b) => {resolve = a; reject = b;});
    console.log("[PLEASE WAIT...] Setting up virtual dekstop... DO NOT CLOSE!");
    
    quickChmod(SETUP_DESKTOP_CHMOD).then(() => {
        setupDesktop(resolve, reject);
    });

    return promise;
}

function startDesktop(next) {
    var proc = spawn(START_DESKTOP,[], {cwd: __dirname});
    proc.stdout.on("data", (content) => {
        //console.log(""+content);
    });
    proc.on("exit", (code) => {
        if (code !== 0) {
            console.log("Non zero exit code for start desktop: "+code);
            process.exit(1);
            return;
        }

        next();
    });
}

function desktopServer() {
    try{processes.serv.exit();}catch(e){}
    var proc = spawn("npm",["run","startserv"], {cwd: __dirname});
    processes.serv = proc;
    proc.stdout.on("data", (content) => {
        if ((""+content).indexOf("[desktop stream ready]") > -1) {
            console.log("[STARTED] Desktop is started! CTRL+C to exit.");
        }
        //console.log(""+content);
    });
    proc.on("exit", (code) => {
        if (code == 1000) {
            startDesktop(desktopServer);
            return;
        }
        if (code !== 0) {
            console.log("Non zero exit code for npm run startserv: "+code);
            process.exit(1);
            return;
        }

    });
}

function desktop() {
    quickChmod(SETUP_DESKTOP_CHMOD).then(() => {
        startDesktop(desktopServer);
    });
}

process.on('SIGINT', () => {
    console.log("exit\n");
    try{
        processes.serv.stdin.write("^C\n");
    }catch(e){}
    try{
        processes.serv.exit();
    }catch(e){}
    process.exit(0);
});

(async function () {
    console.log("[PLEASE WAIT...] Checking...");
    
    if (!fs.existsSync(NODE_MODULES)) {
        await install();
    }

    console.log("[STARTING] Desktop is starting...");

    //newRL();

    setTimeout(() => {},8000)

    desktop();
    
})();