'use strict';

const net = require('net');
const fs = require('fs');
const { execFile } = require('child_process');

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

/**
 * Sends a raw ESC/POS buffer to a printer on a serial (COM) port.
 *
 * Plenty of POS printers have no network port at all - the one this was
 * written for reports `Interface: USB & Serial 9600,n,8,1` on its self-test
 * and hangs off the till's COM1. Windows exposes a COM port as the file
 * \\.\COM1, so the bytes can be written with nothing but fs: no native
 * module to compile on a restaurant PC, no driver to install.
 *
 * `mode.com` sets the line settings first. Without it the port keeps whatever
 * baud rate the last program left behind, and a mismatch prints pages of
 * garbage rather than failing outright.
 */
function printToSerial(portName, buffer, opts = {}) {
  const {
    baud = 9600,
    dataBits = 8,
    parity = 'n',
    stopBits = 1,
    timeoutMs = 10000,
  } = opts;
  const port = String(portName).toUpperCase();

  if (!/^COM\d+$/.test(port)) {
    return Promise.reject(
      new Error(`"${portName}" is not a COM port name (expected e.g. COM1).`),
    );
  }

  return new Promise((resolve, reject) => {
    execFile(
      'mode.com',
      [
        `${port}:`,
        `BAUD=${baud}`,
        `PARITY=${parity}`,
        `DATA=${dataBits}`,
        `STOP=${stopBits}`,
        // Hardware flow control off, DTR/RTS asserted: a receipt printer that
        // is not asserting DSR/CTS would otherwise block the write forever.
        'to=off',
        'xon=off',
        'odsr=off',
        'octs=off',
        'dtr=on',
        'rts=on',
        'idsr=off',
      ],
      // `mode` itself can sit waiting on a wedged port, so cap it too.
      { timeout: 5000 },
      () => {
        // A `mode` failure is not fatal - the port may already be configured,
        // and some machines refuse it while still accepting the write. The
        // write below is the real test.

        // \\.\COM1 is the Win32 device path. Node opens it like any file.
        fs.open(`\\\\.\\${port}`, 'w', (openErr, fd) => {
          if (openErr) {
            return reject(
              new Error(
                `Could not open ${port}: ${openErr.message}` +
                  (openErr.code === 'EBUSY' || openErr.code === 'EACCES'
                    ? ' - another program (usually the POS software) is holding the port open.'
                    : ''),
              ),
            );
          }

          let settled = false;
          const finish = (err) => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            // Closing releases the handle and unblocks any write still parked
            // in the thread pool, so a dead printer cannot leak one per ticket.
            fs.close(fd, () => (err ? reject(err) : resolve()));
          };

          // A printer that stops asserting its ready line accepts the handle
          // and then never takes the bytes: without this the write parks
          // forever, the ticket neither prints nor errors, and on an
          // unattended PC it just looks like printing quietly stopped.
          const timer = setTimeout(
            () =>
              finish(
                new Error(
                  `Timed out after ${timeoutMs}ms writing to ${port} - the printer ` +
                    'is switched off, out of paper, or not asserting ready.',
                ),
              ),
            timeoutMs,
          );

          fs.write(fd, buffer, 0, buffer.length, null, (writeErr) =>
            finish(writeErr || null),
          );
        });
      },
    );
  });
}

module.exports = { printToNetwork, printToSerial };
