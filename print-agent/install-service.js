'use strict';

const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { svc } = require('./service');

const configPath = path.join(__dirname, 'config.json');
if (!fs.existsSync(configPath)) {
  console.error(
    'config.json not found.\n' +
    'Copy config.example.json to config.json and fill it in before installing the service.',
  );
  process.exit(1);
}

svc.on('install', () => {
  console.log('Service installed. Starting it now…');
  svc.start();
});

svc.on('alreadyinstalled', () => {
  console.log('The service is already installed. Nothing to do.');
  console.log('To reinstall, run uninstall-service.bat first.');
});

// node-windows' own wrapper restarts index.js if the script crashes, but if
// the wrapper or the service host itself dies the service just sits Stopped
// until someone reboots - which on an unattended restaurant PC means no
// tickets for the rest of the day. Hand that case to the Windows Service
// Control Manager, which restarts the whole service regardless of how it died.
function configureWindowsRecovery() {
  // node-windows registers the service under its id plus ".exe", while
  // svc.id itself carries no extension - passing the bare id makes sc fail
  // with "service does not exist".
  const serviceName = svc.id.endsWith('.exe') ? svc.id : `${svc.id}.exe`;
  const args = [
    'failure', serviceName,
    // Never stop counting failures as "the same incident", so the restart
    // actions below apply to every failure, not just the first few of a day.
    'reset=', '0',
    'actions=', 'restart/30000/restart/60000/restart/120000',
  ];
  execFile('sc.exe', args, (err) => {
    if (err) {
      console.log(`Note: could not set automatic restart on failure (${err.message}).`);
      console.log('The service still runs; it just will not self-heal from a hard crash.');
      return;
    }
    console.log('Automatic restart on failure configured.');
  });
}

svc.on('start', () => {
  configureWindowsRecovery();

  console.log('');
  console.log('Vivora Print Agent is running, and will start by itself every');
  console.log('time this computer is switched on - even before anyone logs in.');
  console.log('');
  console.log(`Activity is logged to ${path.join(__dirname, 'print-agent.log')}`);
});

svc.on('error', (err) => {
  console.error(`Service error: ${err?.message || err}`);
});

// node-windows dumps its raw service XML and config object to the console
// during install. Whoever runs this is a restaurant manager, not a developer,
// and a wall of internals reads like an error - keep only real messages.
const realLog = console.log;
console.log = (...args) => {
  if (args.every((a) => typeof a === 'string')) realLog(...args);
};

console.log('Installing the Vivora Print Agent service…');
svc.install();
