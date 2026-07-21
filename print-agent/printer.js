'use strict';

const net = require('net');

/**
 * Sends a raw ESC/POS buffer to a network printer (port 9100 — the "raw"
 * JetDirect-style port nearly every thermal kitchen printer listens on,
 * including the SAM4S and Sewoo models this agent targets).
 */
function printToNetwork(ip, port, buffer, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    let settled = false;

    const finish = (err) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      err ? reject(err) : resolve();
    };

    socket.setTimeout(timeoutMs);
    socket.once('timeout', () => finish(new Error(`Timed out connecting to printer ${ip}:${port}`)));
    socket.once('error', (err) => finish(err));

    socket.connect(port, ip, () => {
      socket.write(buffer, (err) => {
        if (err) return finish(err);
        // Give the printer a moment to accept the bytes before we hang up.
        socket.end();
      });
    });
    socket.once('close', () => finish());
  });
}

module.exports = { printToNetwork };
