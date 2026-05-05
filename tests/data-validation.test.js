'use strict';
// Node.js test runner for data / customer-data sanitizers
// Run: node tests/data-validation.test.js

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
  fetch: () => Promise.reject(new Error('fetch not available in test'))
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

group('Product sanitizers');

test('sanitizeProductList keeps valid products and drops invalid records', () => {
  const input = [
    { ma: 'OK1', giaNYLon: 1000 },
    { ma: '', giaNYLon: 2000 },
    { ma: 'OK2', giaNYLon: 3000 },
    { foo: 'bar' }
  ];
  const result = context.sanitizeProductList(input, 'test-products');
  eq(result.length, 2);
  deepEq(result.map((item) => item.ma), ['OK1', 'OK2']);
});

test('validateProductList accepts mixed lists when at least one valid product remains', () => {
  const input = [{ ma: 'OK1', giaNYLon: 1000 }, { foo: 'bar' }];
  eq(context.validateProductList(input), true);
});

test('validateProductList rejects lists without any valid product', () => {
  const input = [{ ma: '', giaNYLon: 1000 }, { foo: 'bar' }];
  eq(context.validateProductList(input), false);
});

group('Promotion sanitizers');

test('sanitizePromotionList removes metadata and invalid promotions but keeps valid ones', () => {
  const input = [
    { _meta: true },
    { name: 'Good bonus', type: 'bonus', spMas: ['OK1'] },
    { name: 'Broken bonus', type: 'bonus' },
    { name: 'Good order bonus', type: 'order_bonus' }
  ];
  const result = context.sanitizePromotionList(input, 'test-promotions');
  eq(result.length, 2);
  deepEq(result.map((item) => item.name), ['Good bonus', 'Good order bonus']);
});

test('sanitizePromotionList drops identical duplicate promotions even when sync metadata differs', () => {
  const input = [
    { name: 'Hero 22+2', type: 'bonus', stackable: true, spMas: ['08HA31'], bX: 22, bY: 2, bUnit: 'lon', bMa: 'same', _syncId: 'km_1', _updatedAt: '2026-05-05T12:52:45.934Z' },
    { name: 'Hero 22+2', type: 'bonus', stackable: true, spMas: ['08HA31'], bX: 22, bY: 2, bUnit: 'lon', bMa: 'same', _syncId: 'km_2', _updatedAt: '2026-05-05T12:55:11.150Z' },
    { name: 'Hero 129+15', type: 'bonus', stackable: false, spMas: ['08HA31'], bX: 129, bY: 15, bUnit: 'lon', bMa: 'same' }
  ];
  const result = context.sanitizePromotionList(input, 'duplicate-promotions');
  eq(result.length, 2);
  deepEq(result.map((item) => item.name), ['Hero 22+2', 'Hero 129+15']);
});

test('collectPromotionReferenceIssues reports actionable missing gifted product refs', () => {
  const products = [
    { ma: 'TRIGGER1', giaNYLon: 1000 },
    { ma: 'TRIGGER2', giaNYLon: 2000 }
  ];
  const promos = [
    { name: 'Good gift', type: 'bonus', active: true, spMas: ['TRIGGER1'], bMa: 'same' },
    { name: 'Broken gift', type: 'bonus', active: true, spMas: ['TRIGGER1'], bMa: 'GIFT404' },
    { name: 'Broken order gift', type: 'order_bonus', active: true, spMas: ['TRIGGER2'], bonusMa: 'GIFT405' },
    { name: 'Only missing trigger', type: 'bonus', active: true, spMas: ['OLD404'], bMa: 'GIFT406' }
  ];
  const issues = context.collectPromotionReferenceIssues(promos, products);
  eq(issues.activePromotions, 4);
  eq(issues.promotionsWithMissingSpMas, 1);
  eq(issues.promotionsWithMissingBonusMa, 3);
  eq(issues.actionableBrokenBonusRefs, 2);
  eq(issues.samples[0].name, 'Broken gift');
});

test('validatePromotionList returns false when non-metadata invalid promotions are present', () => {
  const input = [
    { name: 'Good bonus', type: 'bonus', spMas: ['OK1'] },
    { name: 'Broken bonus', type: 'bonus' }
  ];
  eq(context.validatePromotionList(input), false);
});

test('validatePromotionList returns true when only valid promotions and metadata exist', () => {
  const input = [
    { _meta: true },
    { name: 'Good bonus', type: 'bonus', spMas: ['OK1'] },
    { name: 'Good order money', type: 'order_money' }
  ];
  eq(context.validatePromotionList(input), true);
});

group('Customer sanitizers');

test('sanitizeCustomerList keeps customers with ma and drops malformed records', () => {
  const input = [
    { ma: 'KH1', ten: 'Khach 1' },
    { ma: '' },
    { foo: 'bar' },
    { ma: 'KH2' }
  ];
  const result = context.sanitizeCustomerList(input, 'test-customers');
  eq(result.length, 2);
  deepEq(result.map((item) => item.ma), ['KH1', 'KH2']);
});

test('sanitizeCustomerList drops duplicate customer codes and keeps first valid record', () => {
  const input = [
    { ma: 'KH1', ten: 'Khach 1' },
    { ma: 'kh1', ten: 'Khach 1 duplicate' },
    { ma: 'KH2', ten: 'Khach 2' }
  ];
  const result = context.sanitizeCustomerList(input, 'duplicate-customers');
  eq(result.length, 2);
  deepEq(result.map((item) => item.ma), ['KH1', 'KH2']);
  eq(result[0].ten, 'Khach 1');
});

group('Route sanitizers');

test('sanitizeRouteList keeps routes with id and ten and drops malformed records', () => {
  const input = [
    { id: 'T1', ten: 'Tuyen 1' },
    { id: '', ten: 'No id' },
    { id: 'T2', ten: 'Tuyen 2' },
    { ten: 'Missing id' }
  ];
  const result = context.sanitizeRouteList(input, 'test-routes');
  eq(result.length, 2);
  deepEq(result.map((item) => item.id), ['T1', 'T2']);
});

test('sanitizeRouteList drops duplicate route ids and keeps first valid record', () => {
  const input = [
    { id: 'T1', ten: 'Tuyen 1' },
    { id: 't1', ten: 'Tuyen 1 duplicate' },
    { id: 'T2', ten: 'Tuyen 2' }
  ];
  const result = context.sanitizeRouteList(input, 'duplicate-routes');
  eq(result.length, 2);
  deepEq(result.map((item) => item.id), ['T1', 'T2']);
  eq(result[0].ten, 'Tuyen 1');
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