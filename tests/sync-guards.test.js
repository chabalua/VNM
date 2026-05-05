'use strict';
// Node.js test runner for sync master-data guards
// Run: node tests/sync-guards.test.js

const fs = require('fs');
const path = require('path');
const vm = require('vm');

function createLocalStorage() {
  const store = Object.create(null);
  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
    },
    setItem(key, value) {
      store[key] = String(value);
    },
    removeItem(key) {
      delete store[key];
    },
    clear() {
      Object.keys(store).forEach((key) => delete store[key]);
    }
  };
}

function createDocumentStub() {
  const el = () => ({
    id: '',
    style: {},
    classList: { add() {}, remove() {} },
    textContent: '',
    value: '',
    checked: false,
    innerHTML: '',
    appendChild() {},
    removeChild() {},
    setAttribute() {},
    addEventListener() {},
    querySelector() { return null; },
    querySelectorAll() { return []; },
    closest() { return null; },
    dataset: {}
  });
  return {
    body: { appendChild() {}, removeChild() {} },
    createElement() { return el(); },
    getElementById() { return null; },
    querySelector() { return null; },
    querySelectorAll() { return []; }
  };
}

const sandbox = {
  console,
  Math,
  Date,
  JSON,
  Object,
  Array,
  String,
  Number,
  Boolean,
  RegExp,
  parseInt,
  parseFloat,
  isNaN,
  setTimeout,
  clearTimeout,
  localStorage: createLocalStorage(),
  document: createDocumentStub(),
  navigator: { clipboard: { writeText() { return Promise.resolve(); } } },
  fetch: () => Promise.reject(new Error('fetch not available in test')),
  atob: (value) => Buffer.from(String(value), 'base64').toString('binary'),
  btoa: (value) => Buffer.from(String(value), 'binary').toString('base64'),
  escape: global.escape,
  unescape: global.unescape
};

sandbox.window = sandbox;
sandbox.global = sandbox;
sandbox.globalThis = sandbox;

const context = vm.createContext(sandbox);

function loadScript(relativePath) {
  const fullPath = path.resolve(__dirname, '..', relativePath);
  const code = fs.readFileSync(fullPath, 'utf8');
  vm.runInContext(code, context, { filename: fullPath });
}

loadScript('js/config.js');
loadScript('js/data.js');
loadScript('js/customer-data.js');
loadScript('js/sync.js');

const tests = [];
let passed = 0;
let failed = 0;
let currentGroup = '';

function group(name) {
  currentGroup = name;
}

function test(name, fn) {
  try {
    fn();
    tests.push({ group: currentGroup, name, pass: true });
    passed++;
  } catch (error) {
    tests.push({ group: currentGroup, name, pass: false, error: error.message });
    failed++;
  }
}

function eq(actual, expected, message) {
  if (actual !== expected) {
    throw new Error((message ? message + ': ' : '') + 'expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual));
  }
}

function deepEq(actual, expected, message) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    throw new Error((message ? message + ': ' : '') + 'expected ' + expectedJson + ', got ' + actualJson);
  }
}

function resetSyncState() {
  context.localStorage.clear();
  context.SP = [];
  context.kmProgs = [];
  context.CUS = [];
  context.ROUTES = [];
  context.cart = [];
}

group('Sync merge guards');

test('syncSanitizeMasterRecordsForMerge throws on non-array master payload', () => {
  let threw = false;
  try {
    context.syncSanitizeMasterRecordsForMerge('promotions.json', { broken: true }, 'probe');
  } catch (error) {
    threw = true;
  }
  eq(threw, true);
});

test('syncSanitizeMasterRecordsForMerge keeps deleted tombstones and sanitizes active promotions', () => {
  const input = [
    { name: 'Deleted promo', _deleted: true, _updatedAt: '2026-05-05T00:00:00.000Z' },
    { name: 'Good promo', type: 'bonus', spMas: ['OK1'] },
    { name: 'Broken promo', type: 'bonus' }
  ];
  const result = context.syncSanitizeMasterRecordsForMerge('promotions.json', input, 'probe-promotions');
  eq(result.length, 2);
  deepEq(result.map((item) => item.name), ['Deleted promo', 'Good promo']);
});

test('syncSanitizeMasterRecordsForMerge keeps deleted tombstones and sanitizes active customers', () => {
  const input = [
    { ma: 'KHX', _deleted: true, _updatedAt: '2026-05-05T00:00:00.000Z' },
    { ma: 'KH1', ten: 'Customer 1' },
    { foo: 'bar' }
  ];
  const result = context.syncSanitizeMasterRecordsForMerge('customers.json', input, 'probe-customers');
  eq(result.length, 2);
  deepEq(result.map((item) => item.ma), ['KHX', 'KH1']);
});

group('Sync setLocal sanitizers');

test('promotions sync setLocal drops malformed active records', () => {
  resetSyncState();
  const file = context.getSyncFileConfig('promotions.json');
  file.setLocal([
    { name: 'Good promo', type: 'bonus', spMas: ['OK1'] },
    { name: 'Broken promo', type: 'bonus' }
  ]);
  eq(context.kmProgs.length, 1);
  eq(context.kmProgs[0].name, 'Good promo');
});

test('customers sync setLocal drops malformed active records', () => {
  resetSyncState();
  const file = context.getSyncFileConfig('customers.json');
  file.setLocal([
    { ma: 'KH1', ten: 'Customer 1' },
    { foo: 'bar' }
  ]);
  eq(context.CUS.length, 1);
  eq(context.CUS[0].ma, 'KH1');
});

group('Backup restore guards');

test('syncRestoreBackupData rejects malformed top-level backup sections', () => {
  resetSyncState();
  let threw = false;
  try {
    context.syncRestoreBackupData({ _backup: true, products: { broken: true } });
  } catch (error) {
    threw = /products/.test(error.message);
  }
  eq(threw, true);
});

test('syncRestoreBackupData sanitizes active backup records before applying', () => {
  resetSyncState();
  const restored = context.syncRestoreBackupData({
    _backup: true,
    _date: '2026-05-05T00:00:00.000Z',
    products: [
      { ma: 'SP1', ten: 'San pham 1', giaNYLon: 1000 },
      { ten: 'Broken product' }
    ],
    promotions: [
      { name: 'Promo 1', type: 'bonus', spMas: ['SP1'] },
      { name: 'Broken promo', type: 'bonus' }
    ],
    customers: [
      { ma: 'KH1', ten: 'Khach 1' },
      { foo: 'bar' }
    ],
    routes: [
      { id: 'R1', ten: 'Route 1' },
      { name: 'Broken route' }
    ],
    orders: [
      { id: 1, date: '2026-05-01T00:00:00.000Z', items: [{ ma: 'SP1', qty: 1 }] }
    ],
    favorites: ['SP1'],
    cart: [{ ma: 'SP1', qty: 2 }]
  });
  eq(restored.products, 1);
  eq(restored.promotions, 1);
  eq(restored.customers, 1);
  eq(restored.routes, 1);
  eq(restored.orders, 1);
  eq(context.SP.length, 1);
  eq(context.kmProgs.length, 1);
  eq(context.CUS.length, 1);
  eq(context.ROUTES.length, 1);
  eq(context.cart.length, 1);
  deepEq(JSON.parse(context.localStorage.getItem(context.LS_KEYS.FAVORITES)), ['SP1']);
});

group('Order sync guards');

test('setOrdersFromSync rejects non-array payloads', () => {
  resetSyncState();
  let threw = false;
  try {
    context.setOrdersFromSync({ broken: true });
  } catch (error) {
    threw = /orders\.json/.test(error.message);
  }
  eq(threw, true);
});

test('mergeOrders prefers record with newer _updatedAt for the same order id', () => {
  resetSyncState();
  const merged = context.mergeOrders(
    [{ id: 1, _updatedAt: '2026-05-01T00:00:00.000Z', date: '2026-05-01T00:00:00.000Z', items: [{ ma: 'SP1', qty: 1 }] }],
    [{ id: 1, _updatedAt: '2026-05-02T00:00:00.000Z', date: '2026-05-01T00:00:00.000Z', items: [{ ma: 'SP1', qty: 3 }] }]
  );
  eq(merged.length, 1);
  eq(merged[0].items[0].qty, 3);
});

test('mergeOrders keeps newer deleted tombstone over older active order', () => {
  resetSyncState();
  const merged = context.mergeOrders(
    [{ id: 1, _updatedAt: '2026-05-01T00:00:00.000Z', date: '2026-05-01T00:00:00.000Z', items: [{ ma: 'SP1', qty: 1 }] }],
    [{ id: 1, _updatedAt: '2026-05-03T00:00:00.000Z', date: '2026-05-01T00:00:00.000Z', _deleted: true, items: [] }]
  );
  eq(merged.length, 1);
  eq(merged[0]._deleted, true);
});

const groups = new Map();
tests.forEach((item) => {
  if (!groups.has(item.group)) groups.set(item.group, []);
  groups.get(item.group).push(item);
});

groups.forEach((groupTests, groupName) => {
  console.log('\n[' + groupName + ']');
  groupTests.forEach((item) => {
    if (item.pass) console.log('  PASS ' + item.name);
    else console.log('  FAIL ' + item.name + ' :: ' + item.error);
  });
});

console.log('\nSummary: ' + passed + '/' + (passed + failed) + ' passed');
if (failed) process.exitCode = 1;