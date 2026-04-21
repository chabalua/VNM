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
  return {
    body: {
      appendChild() {},
      removeChild() {}
    },
    createElement() {
      return {
        id: '',
        style: {},
        classList: { add() {}, remove() {} },
        textContent: '',
        appendChild() {},
        removeChild() {},
        setAttribute() {}
      };
    },
    getElementById() {
      return null;
    }
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
  navigator: { clipboard: { writeText() { return Promise.resolve(); } } }
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
loadScript('js/cart.js');
loadScript('tests/km-engine.test.shared.js');

const result = context.runKmEngineTests(context);
const groups = new Map();

result.tests.forEach((test) => {
  if (!groups.has(test.group)) groups.set(test.group, []);
  groups.get(test.group).push(test);
});

groups.forEach((groupTests, groupName) => {
  console.log('\n[' + groupName + ']');
  groupTests.forEach((test) => {
    if (test.pass) console.log('  PASS ' + test.name);
    else console.log('  FAIL ' + test.name + ' :: ' + test.error);
  });
});

console.log('\nSummary: ' + result.passed + '/' + result.total + ' passed');
if (result.failed) process.exitCode = 1;