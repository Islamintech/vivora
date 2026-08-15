'use strict';

const { svc } = require('./service');

svc.on('uninstall', () => {
  console.log('Service uninstalled. The print agent will no longer start automatically.');
});

svc.on('doesnotexist', () => {
  console.log('The service is not installed. Nothing to do.');
});

svc.on('error', (err) => {
  console.error(`Service error: ${err?.message || err}`);
});

console.log('Removing the Vivora Print Agent service…');
svc.uninstall();
