'use strict';

const path = require('path');
const { spawnSync } = require('child_process');

const testFiles = [
  'km-engine.test.js',
  'reward-engine.test.js',
  'data-validation.test.js',
  'sync-guards.test.js'
];

let failed = false;

testFiles.forEach((file) => {
  const fullPath = path.resolve(__dirname, file);
  console.log('\n=== ' + file + ' ===');
  const result = spawnSync(process.execPath, [fullPath], { stdio: 'inherit' });
  if (result.status !== 0) failed = true;
});

if (failed) process.exitCode = 1;