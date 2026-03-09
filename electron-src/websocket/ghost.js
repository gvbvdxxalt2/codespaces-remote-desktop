
function handleGhost(ws) {
  var isAlive = true;
  var terminated = false;
  var last = performance.now();

  ws._pongspeed = 0;

  function heartbeat() {
    var now = performance.now();
    ws._pongspeed = last - now;
    last = performance.now();
    isAlive = true;
  }

  ws.on("pong", heartbeat);

  var interval = setInterval(() => {
    if (!isAlive) {
      if (!terminated) {
        terminated = true;
        clearInterval(interval);
        ws.terminate();
        //ws.emit("close");
      }
      return;
    }

    isAlive = false;
    try {
      ws.ping();
    } catch (err) {
      if (!terminated) {
        terminated = true;
        clearInterval(interval);
        ws.terminate();
        //ws.emit("close");
      }
    }
  }, 1500); // Check every 1500 miliseconds.

  ws.on("close", () => {
    if (!terminated) {
      terminated = true;
      clearInterval(interval);
    }
  });

  try {
    ws.ping();
  } catch (err) {
    // Socket might already be broken
    if (!terminated) {
      terminated = true;
      clearInterval(interval);
      ws.terminate();
    }
  }
}

module.exports = { handleGhost };
