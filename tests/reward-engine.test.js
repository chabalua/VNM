'use strict';
// Node.js test runner for calcVNMShopReward / calcVIPShopReward / calcSBPSReward
// Run: node tests/reward-engine.test.js

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// ── sandbox ─────────────────────────────────────────────────────────────────
function createLocalStorage() {
  const store = Object.create(null);
  return {
    getItem(key)         { return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null; },
    setItem(key, value)  { store[key] = String(value); },
    removeItem(key)      { delete store[key]; },
    clear()              { Object.keys(store).forEach(k => delete store[k]); }
  };
}

function createDocumentStub() {
  const el = () => ({
    id: '', style: {}, classList: { add() {}, remove() {} },
    textContent: '', value: '', checked: false,
    innerHTML: '', placeholder: '',
    appendChild() {}, removeChild() {}, setAttribute() {},
    addEventListener() {}, querySelector() { return null; },
    querySelectorAll() { return []; }, closest() { return null; },
    dataset: {}
  });
  return {
    body: { appendChild() {}, removeChild() {} },
    createElement() { return el(); },
    getElementById() { return null; },
    querySelectorAll() { return []; }
  };
}

const sandbox = {
  console, Math, Date, JSON, Object, Array, String, Number, Boolean, RegExp,
  parseInt, parseFloat, isNaN, setTimeout, clearTimeout,
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
loadScript('js/cart.js');
loadScript('js/customer.js');

// ── test helpers ─────────────────────────────────────────────────────────────
const tests = [];
let passed = 0, failed = 0;
let _currentGroup = '';

function group(name) { _currentGroup = name; }

function test(name, fn) {
  try {
    fn();
    tests.push({ group: _currentGroup, name, pass: true });
    passed++;
  } catch (e) {
    tests.push({ group: _currentGroup, name, pass: false, error: e.message });
    failed++;
  }
}

function eq(actual, expected, msg) {
  if (actual !== expected) {
    throw new Error((msg ? msg + ': ' : '') + 'expected ' + expected + ', got ' + actual);
  }
}

function notNull(val, msg) {
  if (val == null) throw new Error((msg || 'value') + ' should not be null');
}

function isNull(val, msg) {
  if (val != null) throw new Error((msg || 'value') + ' should be null, got ' + JSON.stringify(val));
}

// Shortcuts to context functions
const calcVNM  = (kh, md) => context.calcVNMShopReward(kh, md);
const calcVIP  = (kh, md) => context.calcVIPShopReward(kh, md);
const calcSBPS = (kh, md) => context.calcSBPSReward(kh, md);
const calcAll  = (kh, md) => context.calcTotalReward(kh, md);

// Helpers for building test KH objects
function vnmKH(mucBayBan, mucTichLuy, ngayDangKy) {
  return { programs: { vnmShop: { dangKy: true, mucBayBan, mucTichLuy, ngayDangKy: ngayDangKy || 10 } } };
}
function vipKH(mucBayBan, mucTichLuy, ngayDangKy, coTuVNM) {
  return { coTuVNM: !!coTuVNM, programs: { vipShop: { dangKy: true, mucBayBan, mucTichLuy, ngayDangKy: ngayDangKy || 10 } } };
}
function sbpsKH(muc, mucTrungBay, ngayDangKy) {
  return { programs: { sbpsShop: { dangKy: true, muc, mucTrungBay: mucTrungBay || '', ngayDangKy: ngayDangKy || 10 } } };
}

// ── VNM Shop tests ───────────────────────────────────────────────────────────
group('VNM Shop Reward');

test('Returns null when not registered', () => {
  isNull(calcVNM({ programs: {} }, {}));
  isNull(calcVNM({ programs: { vnmShop: { dangKy: false } } }, {}));
});

test('Trung bay M6 on-time (ngay≤15) → full reward 150,000', () => {
  const kh = vnmKH('M6', '', 10);
  const md = { dsNhomC: 8000000, vnmShopTrungBay: true };
  const r = calcVNM(kh, md);
  notNull(r);
  eq(r.trungBay, 150000);
});

test('Trung bay M6 mid-month (16≤ngay≤19) → 50% reward = 75,000', () => {
  const kh = vnmKH('M6', '', 17);
  const md = { dsNhomC: 8000000, vnmShopTrungBay: true };
  const r = calcVNM(kh, md);
  eq(r.trungBay, 75000);
});

test('Trung bay M6 late (ngay>19) → 0 reward', () => {
  const kh = vnmKH('M6', '', 20);
  const md = { dsNhomC: 8000000, vnmShopTrungBay: true };
  const r = calcVNM(kh, md);
  eq(r.trungBay, 0);
});

test('Trung bay M6 but DS < dsMin (8M) → 0 reward', () => {
  const kh = vnmKH('M6', '', 10);
  const md = { dsNhomC: 6000000, vnmShopTrungBay: true };
  const r = calcVNM(kh, md);
  eq(r.trungBay, 0);
});

test('Trung bay M6 not achieved (datTrungBay=false) → 0 reward', () => {
  const kh = vnmKH('M6', '', 10);
  const md = { dsNhomC: 10000000, vnmShopTrungBay: false };
  const r = calcVNM(kh, md);
  eq(r.trungBay, 0);
});

test('Tich luy muc 7 (ckDS=1.2%), DS=7M → tichLuy=84,000', () => {
  // muc 7: dsMin=5M, dsMax=10M, ckDS=1.20%
  const kh = vnmKH('', '7', 10);
  const md = { dsNhomC: 7000000, vnmShopTrungBay: false };
  const r = calcVNM(kh, md);
  eq(r.tichLuy, 84000);  // round(7000000 * 1.20 / 100)
  eq(r.giaiDoan1, 0);    // no GD data
});

test('Tich luy muc 7 below dsMin → tichLuy=0', () => {
  const kh = vnmKH('', '7', 10);
  const md = { dsNhomC: 4500000, vnmShopTrungBay: false };
  const r = calcVNM(kh, md);
  eq(r.tichLuy, 0);
  eq(r.total, 0);
});

test('Tich luy muc 7 with all 3 giai doan passing → correct breakdown', () => {
  // muc 7: dsMin=5M, dsMax=10M, ckDS=1.2%, ckGD1=1.6%, ckGD2=1.2%, ckGD3=0.6%
  const kh = vnmKH('', '7', 10);
  const md = { dsNhomC: 7000000, vnmShopTrungBay: false, dsGD1: 2000000, dsGD2: 2000000, dsGD3: 1000000 };
  const r = calcVNM(kh, md);
  eq(r.tichLuy, 84000);   // round(7M * 1.2/100)
  eq(r.giaiDoan1, 32000); // round(min(2M,4M) * 1.6/100) = round(2M*1.6/100)
  eq(r.giaiDoan2, 24000); // round((min(4M,7M)-min(2M,4M)) * 1.2/100) = round(2M*1.2/100)
  eq(r.giaiDoan3, 6000);  // round((5M-min(4M,7M)) * 0.6/100) = round(1M*0.6/100)
  eq(r.total, 84000 + 32000 + 24000 + 6000);
});

test('Trung bay M6 + Tich luy muc 7 together → total = sum of both', () => {
  const kh = vnmKH('M6', '7', 10);
  const md = { dsNhomC: 8000000, vnmShopTrungBay: true };
  const r = calcVNM(kh, md);
  eq(r.trungBay, 150000);
  eq(r.tichLuy, Math.round(8000000 * 1.2 / 100));
  eq(r.total, r.trungBay + r.tichLuy + r.giaiDoan1 + r.giaiDoan2 + r.giaiDoan3);
});

// ── VIP Shop tests ───────────────────────────────────────────────────────────
group('VIP Shop Reward');

test('Returns null when not registered', () => {
  isNull(calcVIP({ programs: {} }, {}));
  isNull(calcVIP({ programs: { vipShop: { dangKy: false } } }, {}));
});

test('Trung bay TB4 (thuongVNM=200K) coTuVNM on-time → 200,000', () => {
  // TB4: dsMin=3M, skuMin=4, thuongVNM=200K, thuongKH=100K
  const kh = vipKH('TB4', '', 10, true);
  const md = { dsNhomDE: 5000000, skuNhomD: 5, vipShopTrungBay: true };
  const r = calcVIP(kh, md);
  notNull(r);
  eq(r.trungBay, 200000);
});

test('Trung bay TB4 no tu VNM (thuongKH=100K) → 100,000', () => {
  const kh = vipKH('TB4', '', 10, false);
  const md = { dsNhomDE: 5000000, skuNhomD: 5, vipShopTrungBay: true };
  const r = calcVIP(kh, md);
  eq(r.trungBay, 100000);
});

test('Trung bay TB4 mid-month (16≤ngay≤20) → 50% of thuongVNM = 100,000', () => {
  const kh = vipKH('TB4', '', 18, true);
  const md = { dsNhomDE: 5000000, skuNhomD: 5, vipShopTrungBay: true };
  const r = calcVIP(kh, md);
  eq(r.trungBay, 100000);
});

test('Trung bay TB4 late (ngay>20) → 0', () => {
  const kh = vipKH('TB4', '', 21, true);
  const md = { dsNhomDE: 5000000, skuNhomD: 5, vipShopTrungBay: true };
  const r = calcVIP(kh, md);
  eq(r.trungBay, 0);
});

test('Trung bay TB4 DS < dsMin (3M) → 0', () => {
  const kh = vipKH('TB4', '', 10, true);
  const md = { dsNhomDE: 2000000, skuNhomD: 5, vipShopTrungBay: true };
  const r = calcVIP(kh, md);
  eq(r.trungBay, 0);
});

test('Trung bay TB4 SKU < skuMin (4) → 0', () => {
  const kh = vipKH('TB4', '', 10, true);
  const md = { dsNhomDE: 5000000, skuNhomD: 3, vipShopTrungBay: true };
  const r = calcVIP(kh, md);
  eq(r.trungBay, 0);
});

test('Tich luy TL4 (ckN1=2.0%, ckN2=4.0%), DS=12M, N1=8M, N2=4M → tichLuy=320,000', () => {
  // TL4: dsMin=9M, ckN1=2.0%, ckN2=4.0%
  const kh = vipKH('', 'TL4', 10, false);
  const md = { dsNhomDE: 12000000, dsVipN1: 8000000, dsVipN2: 4000000, skuNhomD: 0, vipShopTrungBay: false };
  const r = calcVIP(kh, md);
  eq(r.tichLuy, 320000); // round(8M*2/100) + round(4M*4/100) = 160000+160000
});

test('Tich luy TL4 DS below dsMin (9M) → tichLuy=0', () => {
  const kh = vipKH('', 'TL4', 10, false);
  const md = { dsNhomDE: 8000000, dsVipN1: 5000000, dsVipN2: 3000000, vipShopTrungBay: false };
  const r = calcVIP(kh, md);
  eq(r.tichLuy, 0);
});

test('DS > 90M → vuot90 = 1% of excess amount', () => {
  const kh = vipKH('', 'TL1', 10, false);
  const md = { dsNhomDE: 95000000, dsVipN1: 0, dsVipN2: 0, vipShopTrungBay: false };
  const r = calcVIP(kh, md);
  eq(r.vuot90, 50000); // round((95M-90M) * 1.0/100)
});

test('DS ≤ 90M → vuot90 = 0', () => {
  const kh = vipKH('', 'TL2', 10, false);
  const md = { dsNhomDE: 90000000, dsVipN1: 30000000, dsVipN2: 0, vipShopTrungBay: false };
  const r = calcVIP(kh, md);
  eq(r.vuot90, 0);
});

// ── SBPS Shop tests ──────────────────────────────────────────────────────────
group('SBPS Shop Reward');

test('Returns null when not registered', () => {
  isNull(calcSBPS({ programs: {} }, {}));
  isNull(calcSBPS({ programs: { sbpsShop: { dangKy: false } } }, {}));
});

test('Trung bay TH-M5 (dsMin=5.5M, thuong=80K) on-time → 80,000', () => {
  const kh = sbpsKH('', 'TH-M5', 5);
  const md = { dsSBPS: 6000000, sbpsTrungBay: true };
  const r = calcSBPS(kh, md);
  notNull(r);
  eq(r.trungBay, 80000);
});

test('Trung bay TH-M5 mid-month (16≤ngay≤20) → 50% = 40,000', () => {
  const kh = sbpsKH('', 'TH-M5', 17);
  const md = { dsSBPS: 6000000, sbpsTrungBay: true };
  const r = calcSBPS(kh, md);
  eq(r.trungBay, 40000);
});

test('Trung bay TH-M5 late (ngay>20) → 0', () => {
  const kh = sbpsKH('', 'TH-M5', 21);
  const md = { dsSBPS: 6000000, sbpsTrungBay: true };
  const r = calcSBPS(kh, md);
  eq(r.trungBay, 0);
});

test('Trung bay TH-M5 DS < dsMin (5.5M) → 0', () => {
  const kh = sbpsKH('', 'TH-M5', 5);
  const md = { dsSBPS: 4000000, sbpsTrungBay: true };
  const r = calcSBPS(kh, md);
  eq(r.trungBay, 0);
});

test('Tich luy muc 8 (ckN1=4%,ckN2=4.5%,ckN3=4%,ck26=0), DS=5M, N1=3M N2=1M N3=1M → tichLuy=205,000', () => {
  // muc 8: dsMin=3.5M, ckN1=4%, ckN2=4.5%, ckN3=4%, ck26=0
  const kh = sbpsKH('8', '', 10);
  const md = { dsSBPS: 5000000, sbpsN1: 3000000, sbpsN2: 1000000, sbpsN3: 1000000, sbpsTo26: 0, sbpsTrungBay: false };
  const r = calcSBPS(kh, md);
  eq(r.tichLuy, 205000); // round(3M*4/100)+round(1M*4.5/100)+round(1M*4/100)=120000+45000+40000
  eq(r.thuong26, 0);     // ck26=0
});

test('Tich luy muc 8 DS below dsMin (3.5M) → tichLuy=0', () => {
  const kh = sbpsKH('8', '', 10);
  const md = { dsSBPS: 3000000, sbpsN1: 2000000, sbpsN2: 500000, sbpsN3: 500000, sbpsTrungBay: false };
  const r = calcSBPS(kh, md);
  eq(r.tichLuy, 0);
});

test('Tich luy muc 6 (ck26=0.6%), sbpsTo26 >= dsMin → thuong26 = round(DS_to26 * 0.6%)', () => {
  // muc 6: dsMin=9M, ckN1=5.3%, ckN2=5.8%, ckN3=5.3%, ck26=0.6%
  const kh = sbpsKH('6', '', 10);
  const md = { dsSBPS: 10000000, sbpsN1: 5000000, sbpsN2: 3000000, sbpsN3: 2000000, sbpsTo26: 10000000, sbpsTrungBay: false };
  const r = calcSBPS(kh, md);
  eq(r.thuong26, 60000); // round(10M * 0.6/100)
  const expectedTichLuy = Math.round(5000000 * 5.3/100) + Math.round(3000000 * 5.8/100) + Math.round(2000000 * 5.3/100);
  eq(r.tichLuy, expectedTichLuy);
});

test('Tich luy muc 7 (ck26=0) → thuong26 always 0 regardless of sbpsTo26', () => {
  // muc 7: dsMin=5.5M, ck26=0
  const kh = sbpsKH('7', '', 10);
  const md = { dsSBPS: 6000000, sbpsN1: 6000000, sbpsN2: 0, sbpsN3: 0, sbpsTo26: 6000000, sbpsTrungBay: false };
  const r = calcSBPS(kh, md);
  eq(r.thuong26, 0);
});

// ── calcTotalReward tests ─────────────────────────────────────────────────────
group('calcTotalReward (combined)');

test('Returns zeros when no programs registered', () => {
  const kh = { programs: {} };
  const r = calcAll(kh, {});
  eq(r.totalReward, 0);
  isNull(r.vnm);
  isNull(r.vip);
  isNull(r.sbps);
});

test('VNM only → totalReward equals VNM total', () => {
  const kh = vnmKH('M6', '7', 10);
  const md = { dsNhomC: 8000000, vnmShopTrungBay: true };
  const r = calcAll(kh, md);
  notNull(r.vnm);
  isNull(r.vip);
  isNull(r.sbps);
  eq(r.totalReward, r.vnm.total);
});

test('VIP only → totalReward equals VIP total', () => {
  const kh = vipKH('TB4', 'TL4', 10, true);
  const md = { dsNhomDE: 12000000, dsVipN1: 8000000, dsVipN2: 4000000, skuNhomD: 5, vipShopTrungBay: true };
  const r = calcAll(kh, md);
  isNull(r.vnm);
  notNull(r.vip);
  isNull(r.sbps);
  eq(r.totalReward, r.vip.total);
});

test('All 3 programs combined → totalReward = vnm.total + vip.total + sbps.total', () => {
  const kh = {
    coTuVNM: true,
    programs: {
      vnmShop:  { dangKy: true, mucBayBan: 'M6',    mucTichLuy: '7',   ngayDangKy: 10 },
      vipShop:  { dangKy: true, mucBayBan: 'TB4',   mucTichLuy: 'TL4', ngayDangKy: 10 },
      sbpsShop: { dangKy: true, muc: '8',           mucTrungBay: 'TH-M5', ngayDangKy: 10 }
    }
  };
  const md = {
    dsNhomC: 8000000,    vnmShopTrungBay: true,
    dsNhomDE: 12000000,  dsVipN1: 8000000, dsVipN2: 4000000, skuNhomD: 5, vipShopTrungBay: true,
    dsSBPS: 6000000,     sbpsN1: 4000000,  sbpsN2: 1000000,  sbpsN3: 1000000, sbpsTo26: 0, sbpsTrungBay: true
  };
  const r = calcAll(kh, md);
  notNull(r.vnm); notNull(r.vip); notNull(r.sbps);
  eq(r.totalReward, r.vnm.total + r.vip.total + r.sbps.total);
  if (r.totalReward <= 0) throw new Error('Expected combined reward > 0');
});

// ── report ────────────────────────────────────────────────────────────────────
const groups = new Map();
tests.forEach(t => {
  if (!groups.has(t.group)) groups.set(t.group, []);
  groups.get(t.group).push(t);
});

groups.forEach((groupTests, groupName) => {
  console.log('\n[' + groupName + ']');
  groupTests.forEach(t => {
    if (t.pass) console.log('  PASS ' + t.name);
    else        console.log('  FAIL ' + t.name + ' :: ' + t.error);
  });
});

console.log('\nSummary: ' + passed + '/' + (passed + failed) + ' passed');
if (failed) process.exitCode = 1;
