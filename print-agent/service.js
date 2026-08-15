'use strict';

// Shared definition of the Windows service, used by both install-service.js
// and uninstall-service.js so the two can never drift apart and leave an
// orphaned service nobody can remove.

const path = require('path');
const { Service } = require('node-windows');

const svc = new Service({
  name: 'Vivora Print Agent',
  description:
    'Listens for new Vivora orders and prints kitchen tickets to the local printer.',
  script: path.join(__dirname, 'index.js'),
  // The restaurant PC is switched off nightly and its WiFi comes up late, so
  // a first-boot failure is normal. Restart persistently rather than letting
  // Windows mark the service failed and stop trying.
  wait: 5,
  grow: 0.25,
  maxRestarts: 40,
});

module.exports = { svc };
