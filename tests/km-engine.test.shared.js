(function(root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory;
  root.runKmEngineTests = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  var globalRoot = typeof globalThis !== 'undefined' ? globalThis : this;

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function sortByMa(items) {
    return items.slice().sort(function(a, b) {
      return String(a.ma || '').localeCompare(String(b.ma || ''));
    });
  }

  function createFixtures() {
    return {
      ma: {
        nspn: '01SB10',
        stt: '03SN01',
        bot: '01AA01',
        suaChua: '04SC01'
      },
      products: [
        { ma: '01SB10', ten: 'Creamer dac NSPN xanh bien 1284g', nhom: 'B', giaNYLon: 55404, donvi: 'hop', slThung: 24, giaNYThung: 1329696, kmRules: [] },
        { ma: '03SN01', ten: 'Sua tuoi STT co duong 180ml', nhom: 'C', giaNYLon: 6800, donvi: 'hop', slThung: 48, giaNYThung: 326400, kmRules: [] },
        { ma: '01AA01', ten: 'Dielac Grow Plus 900g', nhom: 'A', giaNYLon: 125000, donvi: 'hop', slThung: 12, giaNYThung: 1500000, kmRules: [] },
        { ma: '04SC01', ten: 'Sua chua probi 100g', nhom: 'D', giaNYLon: 12000, donvi: 'hop', slThung: 48, giaNYThung: 576000, kmRules: [] }
      ]
    };
  }

  function findProduct(scope, ma) {
    return (scope.SP || []).find(function(product) {
      return product.ma === ma;
    });
  }

  function installGlobals(scope, fixtures, progs) {
    scope.SP = clone(fixtures.products);
    scope.kmProgs = clone(progs || []);
    scope.cart = {};
    scope.spFind = function(ma) {
      return findProduct(scope, ma);
    };
    if (scope.window) {
      scope.window.SP = scope.SP;
      scope.window.kmProgs = scope.kmProgs;
      scope.window.cart = scope.cart;
      scope.window.spFind = scope.spFind;
    }
  }

  function runKmEngineTests(targetRoot) {
    var scope = targetRoot || globalRoot;
    var fixtures = createFixtures();
    var tests = [];
    var passed = 0;
    var failed = 0;
    var currentGroup = '';

    function group(name) {
      currentGroup = name;
    }

    function record(pass, name, error) {
      tests.push({ group: currentGroup, name: name, pass: pass, error: error || '' });
      if (pass) passed += 1;
      else failed += 1;
    }

    function test(name, fn) {
      try {
        fn();
        record(true, name);
      } catch (error) {
        record(false, name, error && error.message ? error.message : String(error));
      }
    }

    function assert(condition, message) {
      if (!condition) throw new Error(message || 'Assertion failed');
    }

    function assertEqual(actual, expected, message) {
      if (actual !== expected) {
        throw new Error((message ? message + ' :: ' : '') + 'expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual));
      }
    }

    function assertIncludes(text, fragment, message) {
      if (String(text || '').indexOf(fragment) < 0) {
        throw new Error((message ? message + ' :: ' : '') + 'missing fragment ' + JSON.stringify(fragment) + ' in ' + JSON.stringify(text));
      }
    }

    function assertBonusItems(actual, expected, message) {
      var simplifiedActual = sortByMa(actual || []).map(function(item) {
        return { ma: item.ma || '', qty: item.qty || 0 };
      });
      var simplifiedExpected = sortByMa(expected || []).map(function(item) {
        return { ma: item.ma || '', qty: item.qty || 0 };
      });
      if (JSON.stringify(simplifiedActual) !== JSON.stringify(simplifiedExpected)) {
        throw new Error((message ? message + ' :: ' : '') + 'expected ' + JSON.stringify(simplifiedExpected) + ', got ' + JSON.stringify(simplifiedActual));
      }
    }

    function reset(progs) {
      installGlobals(scope, fixtures, progs);
    }

    function resetWithFixtures(customProducts, progs) {
      installGlobals(scope, { products: clone(customProducts || []) }, progs);
    }

    function product(ma) {
      var result = findProduct(scope, ma);
      assert(result, 'Missing fixture product ' + ma);
      return result;
    }

    function itemBaseTotal(ma, qT, qL) {
      var p = product(ma);
      return p.giaNYLon * (qT * p.slThung + qL);
    }

    function buildItems(cartState, progs) {
      reset(progs);
      return scope.getItemsFromCartState(clone(cartState));
    }

    group('Per-item pricing');

    test('No promotion keeps base price unchanged', function() {
      reset([]);
      var p = product(fixtures.ma.nspn);
      var result = scope.calcKM(p, 2, 0, { allMas: [fixtures.ma.nspn], skuCount: 1 });
      assertEqual(result.disc, 0);
      assertEqual(result.bonus, 0);
      assertEqual(result.hopKM, p.giaNYLon);
      assertEqual(result.nhan, 48);
    });

    test('Stackable fixed + tier_qty add discounts correctly', function() {
      reset([
        { name: 'Fixed 5', type: 'fixed', active: true, stackable: true, spMas: [fixtures.ma.nspn], ck: 5 },
        { name: 'Tier 2T', type: 'tier_qty', active: true, stackable: true, spMas: [fixtures.ma.nspn], tUnit: 'thung', tiers: [{ mn: 2, ck: 3 }] }
      ]);
      var p = product(fixtures.ma.nspn);
      var base = itemBaseTotal(fixtures.ma.nspn, 2, 0);
      var expectedDisc = Math.round(base * 0.05) + Math.round(base * 0.03);
      var result = scope.calcKM(p, 2, 0, { allMas: [fixtures.ma.nspn], skuCount: 1 });
      assertEqual(result.disc, expectedDisc);
      assertEqual(result.hopKM, Math.round((base - expectedDisc) / 48));
      assertIncludes(result.desc, 'CK 5%');
      assertIncludes(result.desc, 'CK 3%');
    });

    test('Non-stackable promotions choose the lowest final unit price', function() {
      reset([
        { name: 'Fixed 8', type: 'fixed', active: true, stackable: false, spMas: [fixtures.ma.nspn], ck: 8 },
        { name: 'Buy48Get8', type: 'bonus', active: true, stackable: false, spMas: [fixtures.ma.nspn], bX: 48, bY: 8, bUnit: 'lon', bMa: 'same' }
      ]);
      var p = product(fixtures.ma.nspn);
      var result = scope.calcKM(p, 2, 0, { allMas: [fixtures.ma.nspn], skuCount: 1 });
      assertEqual(result.bonus, 8);
      assertEqual(result.appliedPromos.length, 1);
      assertEqual(result.appliedPromos[0], 'Buy48Get8');
    });

    test('Stackable fixed + same-product bonus compute final price correctly', function() {
      reset([
        { name: 'Fixed 5', type: 'fixed', active: true, stackable: true, spMas: [fixtures.ma.nspn], ck: 5 },
        { name: 'Buy48Get8', type: 'bonus', active: true, stackable: true, spMas: [fixtures.ma.nspn], bX: 48, bY: 8, bUnit: 'lon', bMa: 'same' }
      ]);
      var p = product(fixtures.ma.nspn);
      var base = itemBaseTotal(fixtures.ma.nspn, 2, 0);
      var fixedDisc = Math.round(base * 0.05);
      var result = scope.calcKM(p, 2, 0, { allMas: [fixtures.ma.nspn], skuCount: 1 });
      assertEqual(result.disc, fixedDisc);
      assertEqual(result.bonus, 8);
      assertEqual(result.nhan, 56);
      assertEqual(result.hopKM, Math.round((base - fixedDisc) / 56));
    });

    test('Stackable fixed + gift-other-product include gift value in final price', function() {
      reset([
        { name: 'Fixed 5', type: 'fixed', active: true, stackable: true, spMas: [fixtures.ma.nspn], ck: 5 },
        { name: 'Tang STT', type: 'bonus', active: true, stackable: true, spMas: [fixtures.ma.nspn], bX: 48, bY: 4, bUnit: 'lon', bMa: fixtures.ma.stt }
      ]);
      var p = product(fixtures.ma.nspn);
      var giftProduct = product(fixtures.ma.stt);
      var base = itemBaseTotal(fixtures.ma.nspn, 2, 0);
      var expectedDisc = Math.round(base * 0.05) + (4 * giftProduct.giaNYLon);
      var result = scope.calcKM(p, 2, 0, { allMas: [fixtures.ma.nspn], skuCount: 1 });
      assertEqual(result.disc, expectedDisc);
      assertEqual(result.bonus, 0);
      assertEqual(result.nhan, 48);
      assertEqual(result.hopKM, Math.round((base - expectedDisc) / 48));
      assertBonusItems(result.bonusItems, [{ ma: fixtures.ma.stt, qty: 4 }]);
    });

    test('Multiple stackable bonus programs aggregate same-product and gifted items', function() {
      reset([
        { name: 'Same 48+4', type: 'bonus', active: true, stackable: true, spMas: [fixtures.ma.nspn], bX: 48, bY: 4, bUnit: 'lon', bMa: 'same' },
        { name: 'Tang STT', type: 'bonus', active: true, stackable: true, spMas: [fixtures.ma.nspn], bX: 48, bY: 2, bUnit: 'lon', bMa: fixtures.ma.stt }
      ]);
      var p = product(fixtures.ma.nspn);
      var giftValue = 2 * product(fixtures.ma.stt).giaNYLon;
      var base = itemBaseTotal(fixtures.ma.nspn, 2, 0);
      var result = scope.calcKM(p, 2, 0, { allMas: [fixtures.ma.nspn], skuCount: 1 });
      assertEqual(result.disc, giftValue);
      assertEqual(result.bonus, 4);
      assertEqual(result.nhan, 52);
      assertEqual(result.hopKM, Math.round((base - giftValue) / 52));
      assertBonusItems(result.bonusItems, [{ ma: fixtures.ma.stt, qty: 2 }]);
    });

    test('minSKU blocks per-item promotion until enough matching SKUs exist in cart', function() {
      reset([
        { name: 'Need 2 SKU', type: 'fixed', active: true, stackable: true, spMas: [fixtures.ma.nspn, fixtures.ma.stt], ck: 10, minSKU: 2 }
      ]);
      var p = product(fixtures.ma.nspn);
      var base = itemBaseTotal(fixtures.ma.nspn, 2, 0);
      var blocked = scope.calcKM(p, 2, 0, { allMas: [fixtures.ma.nspn], skuCount: 1 });
      var allowed = scope.calcKM(p, 2, 0, { allMas: [fixtures.ma.nspn, fixtures.ma.stt], skuCount: 2 });
      assertEqual(blocked.disc, 0);
      assertEqual(allowed.disc, Math.round(base * 0.10));
    });

    group('Order-level promotions');

    test('Stackable order_money adds with best non-stackable order_money', function() {
      var items = buildItems({
        '01SB10': { qT: 2, qL: 0 },
        '03SN01': { qT: 1, qL: 0 }
      }, []);
      var baseNspn = itemBaseTotal(fixtures.ma.nspn, 2, 0);
      var baseStt = itemBaseTotal(fixtures.ma.stt, 1, 0);
      reset([
        { name: 'CK 1% NSPN', type: 'order_money', active: true, stackable: true, spMas: [fixtures.ma.nspn], tiers: [{ type: 'above', value: 1000, ck: 1 }] },
        { name: 'CK don 2%', type: 'order_money', active: true, stackable: false, spMas: [], tiers: [{ type: 'above', value: 2000, ck: 2 }] },
        { name: 'CK STT 5%', type: 'order_money', active: true, stackable: false, spMas: [fixtures.ma.stt], tiers: [{ type: 'above', value: 300, ck: 5 }] }
      ]);
      var result = scope.calcOrderKM(items);
      var expectedDisc = Math.round(baseNspn * 0.01) + Math.max(Math.round((baseNspn + baseStt) * 0.02), Math.round(baseStt * 0.05));
      assertEqual(result.disc, expectedDisc);
      assertIncludes(result.desc, 'CK 1% NSPN');
      assertIncludes(result.desc, 'CK don 2%');
    });

    test('minSKU is respected for order_money promotions', function() {
      var items = buildItems({
        '01SB10': { qT: 2, qL: 0 }
      }, []);
      reset([
        { name: 'CK don can 2 SKU', type: 'order_money', active: true, stackable: true, spMas: [], minSKU: 2, tiers: [{ type: 'above', value: 1000, ck: 3 }] }
      ]);
      var result = scope.calcOrderKM(items);
      assertEqual(result.disc, 0);
      assertEqual(result.desc, '');
    });

    test('order_bonus range tier gives one package when total is inside bounded range', function() {
      var items = buildItems({
        '01SB10': { qT: 2, qL: 0 }
      }, []);
      reset([
        { name: 'Tang STT theo don', type: 'order_bonus', active: true, stackable: false, bonusMa: fixtures.ma.stt, tiers: [{ value: 1000, maxValue: 3000, bonusQty: 4 }, { value: 3000, bonusQty: 8 }] }
      ]);
      var result = scope.calcOrderKM(items);
      assertBonusItems(result.bonusItems, [{ ma: fixtures.ma.stt, qty: 4 }]);
      assertIncludes(result.desc, 'Tang STT theo don');
    });

    test('order_bonus repeat obeys maxSets on open-ended tier', function() {
      var items = buildItems({
        '01SB10': { qT: 2, qL: 0 },
        '03SN01': { qT: 1, qL: 0 }
      }, []);
      reset([
        { name: 'Moi 1M tang 2', type: 'order_bonus', active: true, stackable: true, bonusMa: fixtures.ma.stt, repeat: true, maxSets: 2, tiers: [{ value: 1000, bonusQty: 2 }] }
      ]);
      var result = scope.calcOrderKM(items);
      assertBonusItems(result.bonusItems, [{ ma: fixtures.ma.stt, qty: 4 }]);
    });

    group('Cart integration');

    test('getItemsFromCartState keeps item-level gift details', function() {
      var items = buildItems({
        '01SB10': { qT: 2, qL: 0 }
      }, [
        { name: 'Tang STT', type: 'bonus', active: true, stackable: true, spMas: [fixtures.ma.nspn], bX: 48, bY: 4, bUnit: 'lon', bMa: fixtures.ma.stt }
      ]);
      assertEqual(items.length, 1);
      assertBonusItems(items[0].bonusItems, [{ ma: fixtures.ma.stt, qty: 4 }]);
    });

    test('Combined item KM and order KM produce the expected grand total', function() {
      var progs = [
        { name: 'Fixed 5', type: 'fixed', active: true, stackable: true, spMas: [fixtures.ma.nspn], ck: 5 },
        { name: 'Tang STT', type: 'bonus', active: true, stackable: true, spMas: [fixtures.ma.nspn], bX: 48, bY: 4, bUnit: 'lon', bMa: fixtures.ma.stt },
        { name: 'Fixed 10 STT', type: 'fixed', active: true, stackable: true, spMas: [fixtures.ma.stt], ck: 10 },
        { name: 'CK don 1%', type: 'order_money', active: true, stackable: true, spMas: [], tiers: [{ type: 'above', value: 2000, ck: 1 }] }
      ];
      var cartState = {
        '01SB10': { qT: 2, qL: 0 },
        '03SN01': { qT: 1, qL: 0 }
      };
      var items = buildItems(cartState, progs);
      reset(progs);
      var orderResult = scope.calcOrderKM(items);
      var nspnBase = itemBaseTotal(fixtures.ma.nspn, 2, 0);
      var sttBase = itemBaseTotal(fixtures.ma.stt, 1, 0);
      var nspnExpectedDisc = Math.round(nspnBase * 0.05) + (4 * product(fixtures.ma.stt).giaNYLon);
      var sttExpectedDisc = Math.round(sttBase * 0.10);
      var subtotal = (nspnBase - nspnExpectedDisc) + (sttBase - sttExpectedDisc);
      var expectedOrderDisc = Math.round((nspnBase + sttBase) * 0.01);
      var grandTotal = items.reduce(function(sum, item) { return sum + item.afterKM; }, 0) - orderResult.disc;
      assertEqual(items[0].afterKM, nspnBase - nspnExpectedDisc);
      assertEqual(items[1].afterKM, sttBase - sttExpectedDisc);
      assertEqual(orderResult.disc, expectedOrderDisc);
      assertEqual(grandTotal, subtotal - expectedOrderDisc);
    });

    group('Pricing UI helpers');

    test('buildCartDisplaySnapshot keeps gross and subtotal equal when no promotions apply', function() {
      var cartState = {
        '01SB10': { qT: 2, qL: 0 }
      };
      reset([]);
      var nspn = product(fixtures.ma.nspn);
      var snapshot = scope.buildCartDisplaySnapshot(nspn, cartState, 2, 0);
      var expectedGross = itemBaseTotal(fixtures.ma.nspn, 2, 0);
      assertEqual(snapshot.gross, expectedGross);
      assertEqual(snapshot.kmInfo.disc, 0);
      assertEqual(snapshot.orderExtraDisc, 0);
      assertEqual(snapshot.subtotal, expectedGross);
      assertEqual(snapshot.kmForTable.hopKM, nspn.giaNYLon);
    });

    test('buildOrderAwareKmDisplay allocates order_money discount by item proportion', function() {
      var progs = [
        { name: 'CK don 10%', type: 'order_money', active: true, stackable: true, spMas: [], tiers: [{ type: 'above', value: 1000, ck: 10 }] }
      ];
      var cartState = {
        '01SB10': { qT: 2, qL: 0 },
        '03SN01': { qT: 1, qL: 0 }
      };
      var items = buildItems(cartState, progs);
      reset(progs);
      var orderResult = scope.calcOrderKM(items);
      var nspn = product(fixtures.ma.nspn);
      var nspnItem = items.find(function(item) { return item.ma === fixtures.ma.nspn; });
      var totalAfter = items.reduce(function(sum, item) { return sum + item.afterKM; }, 0);
      var expectedAllocated = Math.round(orderResult.disc * (nspnItem.afterKM / totalAfter));
      var display = scope.buildOrderAwareKmDisplay(nspn, scope.calcKM(nspn, 2, 0, scope.buildOrderContextFromCartState(cartState, fixtures.ma.nspn)), items, orderResult);
      assertEqual(display.orderDiscAllocated, expectedAllocated);
      assertEqual(display.orderGiftValueAllocated, 0);
      assertEqual(display.hopKM, Math.round((nspnItem.afterKM - expectedAllocated) / nspnItem.totalLon));
    });

    test('buildOrderAwareKmDisplay converts order bonus gift value into proportional virtual discount', function() {
      var progs = [
        { name: 'Tang bot theo don', type: 'order_bonus', active: true, stackable: true, bonusMa: fixtures.ma.bot, repeat: false, tiers: [{ value: 1000, bonusQty: 2 }] }
      ];
      var cartState = {
        '01SB10': { qT: 2, qL: 0 },
        '03SN01': { qT: 1, qL: 0 }
      };
      var items = buildItems(cartState, progs);
      reset(progs);
      var orderResult = scope.calcOrderKM(items);
      var stt = product(fixtures.ma.stt);
      var sttItem = items.find(function(item) { return item.ma === fixtures.ma.stt; });
      var totalAfter = items.reduce(function(sum, item) { return sum + item.afterKM; }, 0);
      var totalGiftValue = 2 * product(fixtures.ma.bot).giaNYLon;
      var expectedAllocated = Math.round(totalGiftValue * (sttItem.afterKM / totalAfter));
      var display = scope.buildOrderAwareKmDisplay(stt, scope.calcKM(stt, 1, 0, scope.buildOrderContextFromCartState(cartState, fixtures.ma.stt)), items, orderResult);
      assertEqual(display.orderDiscAllocated, 0);
      assertEqual(display.orderGiftValueAllocated, expectedAllocated);
      assertEqual(display.hopKM, Math.round((sttItem.afterKM - expectedAllocated) / sttItem.totalLon));
    });

    test('buildOrderAwareKmDisplay adds same-product order bonus qty into effective unit price', function() {
      var progs = [
        { name: 'Tang NSPN theo don', type: 'order_bonus', active: true, stackable: true, bonusMa: fixtures.ma.nspn, repeat: false, tiers: [{ value: 1000, bonusQty: 6 }] }
      ];
      var cartState = {
        '01SB10': { qT: 2, qL: 0 },
        '03SN01': { qT: 1, qL: 0 }
      };
      var items = buildItems(cartState, progs);
      reset(progs);
      var orderResult = scope.calcOrderKM(items);
      var nspn = product(fixtures.ma.nspn);
      var nspnItem = items.find(function(item) { return item.ma === fixtures.ma.nspn; });
      var display = scope.buildOrderAwareKmDisplay(nspn, scope.calcKM(nspn, 2, 0, scope.buildOrderContextFromCartState(cartState, fixtures.ma.nspn)), items, orderResult);
      assertEqual(display.orderBonusQty, 6);
      assertEqual(display.orderDiscAllocated, 0);
      assertEqual(display.orderGiftValueAllocated, 0);
      assertEqual(display.hopKM, Math.round(nspnItem.afterKM / (nspnItem.totalLon + 6)));
    });

    test('buildCartDisplaySnapshot subtotal includes both item discount and allocated order discount', function() {
      var progs = [
        { name: 'Fixed 5', type: 'fixed', active: true, stackable: true, spMas: [fixtures.ma.nspn], ck: 5 },
        { name: 'CK don 1%', type: 'order_money', active: true, stackable: true, spMas: [], tiers: [{ type: 'above', value: 2000, ck: 1 }] }
      ];
      var cartState = {
        '01SB10': { qT: 2, qL: 0 },
        '03SN01': { qT: 1, qL: 0 }
      };
      reset(progs);
      var nspn = product(fixtures.ma.nspn);
      var snapshot = scope.buildCartDisplaySnapshot(nspn, cartState, 2, 0);
      var expectedGross = itemBaseTotal(fixtures.ma.nspn, 2, 0);
      var expectedItemDisc = Math.round(expectedGross * 0.05);
      assertEqual(snapshot.gross, expectedGross);
      assertEqual(snapshot.kmInfo.disc, expectedItemDisc);
      assertEqual(snapshot.orderExtraDisc, snapshot.kmForTable.orderDiscAllocated + snapshot.kmForTable.orderGiftValueAllocated);
      assertEqual(snapshot.subtotal, expectedGross - expectedItemDisc - snapshot.orderExtraDisc);
    });

    test('buildCartDisplaySnapshot keeps same-product bonus as effective qty instead of virtual discount', function() {
      var progs = [
        { name: 'Mua 48 tang 8', type: 'bonus', active: true, stackable: true, spMas: [fixtures.ma.nspn], bX: 48, bY: 8, bUnit: 'lon', bMa: 'same' }
      ];
      var cartState = {
        '01SB10': { qT: 2, qL: 0 }
      };
      reset(progs);
      var nspn = product(fixtures.ma.nspn);
      var snapshot = scope.buildCartDisplaySnapshot(nspn, cartState, 2, 0);
      var expectedGross = itemBaseTotal(fixtures.ma.nspn, 2, 0);
      assertEqual(snapshot.gross, expectedGross);
      assertEqual(snapshot.kmInfo.disc, 0);
      assertEqual(snapshot.kmInfo.bonus, 8);
      assertEqual(snapshot.orderExtraDisc, 0);
      assertEqual(snapshot.subtotal, expectedGross);
      assertEqual(snapshot.kmForTable.hopKM, Math.round(expectedGross / (48 + 8)));
    });

    test('buildCartDisplaySnapshot subtotal includes both allocated order discount and order bonus gift value', function() {
      var progs = [
        { name: 'Fixed 5', type: 'fixed', active: true, stackable: true, spMas: [fixtures.ma.nspn], ck: 5 },
        { name: 'CK don 1%', type: 'order_money', active: true, stackable: true, spMas: [], tiers: [{ type: 'above', value: 2000, ck: 1 }] },
        { name: 'Tang bot theo don', type: 'order_bonus', active: true, stackable: true, bonusMa: fixtures.ma.bot, repeat: false, tiers: [{ value: 1000, bonusQty: 2 }] }
      ];
      var cartState = {
        '01SB10': { qT: 2, qL: 0 },
        '03SN01': { qT: 1, qL: 0 }
      };
      reset(progs);
      var stt = product(fixtures.ma.stt);
      var snapshot = scope.buildCartDisplaySnapshot(stt, cartState, 1, 0);
      assert(snapshot.kmForTable.orderDiscAllocated > 0, 'Expected allocated order discount');
      assert(snapshot.kmForTable.orderGiftValueAllocated > 0, 'Expected allocated order gift value');
      assertEqual(snapshot.orderExtraDisc, snapshot.kmForTable.orderDiscAllocated + snapshot.kmForTable.orderGiftValueAllocated);
      assertEqual(snapshot.subtotal, snapshot.gross - snapshot.kmInfo.disc - snapshot.orderExtraDisc);
    });

    group('Real data regressions');

    test('Live tier_qty promo blocks until enough SKUs are in cart', function() {
      var liveProducts = [
        { ma: '02EA35', ten: 'Dielac Alpha 3 HT 900g', nhom: 'A', donvi: 'Lon', slThung: 12, giaNYLon: 243972, giaNYThung: 2927664, kmRules: [] },
        { ma: '02EA45', ten: 'Dielac Alpha 4 HT 900g', nhom: 'A', donvi: 'Lon', slThung: 12, giaNYLon: 243972, giaNYThung: 2927664, kmRules: [] }
      ];
      var livePromo = {
        name: 'T05·A·SBTE Alpha/Yoko/SBNL Canxi/Mama/SBNK: 2 lon+ giảm 3% [MR05263002]',
        type: 'tier_qty', nhoms: 'A', active: true, stackable: false, tUnit: 'lon', minSKU: 2,
        tiers: [{ mn: 2, ck: 3 }], spMas: ['02EA35', '02EA45']
      };
      resetWithFixtures(liveProducts, [livePromo]);
      var result = scope.calcKM(scope.spFind('02EA35'), 2, 0, { allMas: ['02EA35'], skuCount: 1 });
      assertEqual(result.disc, 0);
      assertEqual(result.desc, '');
    });

    test('Live tier_qty promo applies once minSKU is satisfied', function() {
      var liveProducts = [
        { ma: '02EA35', ten: 'Dielac Alpha 3 HT 900g', nhom: 'A', donvi: 'Lon', slThung: 12, giaNYLon: 243972, giaNYThung: 2927664, kmRules: [] },
        { ma: '02EA45', ten: 'Dielac Alpha 4 HT 900g', nhom: 'A', donvi: 'Lon', slThung: 12, giaNYLon: 243972, giaNYThung: 2927664, kmRules: [] }
      ];
      var livePromo = {
        name: 'T05·A·SBTE Alpha/Yoko/SBNL Canxi/Mama/SBNK: 2 lon+ giảm 3% [MR05263002]',
        type: 'tier_qty', nhoms: 'A', active: true, stackable: false, tUnit: 'lon', minSKU: 2,
        tiers: [{ mn: 2, ck: 3 }], spMas: ['02EA35', '02EA45']
      };
      resetWithFixtures(liveProducts, [livePromo]);
      var result = scope.calcKM(scope.spFind('02EA35'), 1, 0, { allMas: ['02EA35', '02EA45'], skuCount: 2 });
      assertEqual(result.disc, 87830);
      assertEqual(result.hopKM, 236653);
      assertIncludes(result.desc, 'CK 3%');
    });

    test('Live SBPS same-product bonus 7+1 keeps discount at zero and increases received qty', function() {
      resetWithFixtures([
        { ma: '02HG18', ten: 'Dielac Alpha Gold 180ml', nhom: 'A', donvi: 'Hộp', slThung: 48, giaNYLon: 12852, giaNYThung: 616896, kmRules: [] }
      ], [{
        name: 'T05·A·SBPS Mẹ&Bé: 7+1 cùng loại [MR05263013]',
        type: 'bonus', nhoms: 'A', active: true, stackable: false,
        bX: 7, bY: 1, bUnit: 'lon', bMa: 'same', bMax: 0, spMas: ['02HG18']
      }]);
      var result = scope.calcKM(scope.spFind('02HG18'), 0, 7, { allMas: ['02HG18'], skuCount: 1 });
      assertEqual(result.disc, 0);
      assertEqual(result.bonus, 1);
      assertEqual(result.nhan, 8);
      assertEqual(result.hopKM, 11246);
    });

    test('Live snapshot keeps same-product bonus as effective qty for SBPS 7+1', function() {
      resetWithFixtures([
        { ma: '02HG18', ten: 'Dielac Alpha Gold 180ml', nhom: 'A', donvi: 'Hộp', slThung: 48, giaNYLon: 12852, giaNYThung: 616896, kmRules: [] }
      ], [{
        name: 'T05·A·SBPS Mẹ&Bé: 7+1 cùng loại [MR05263013]',
        type: 'bonus', nhoms: 'A', active: true, stackable: false,
        bX: 7, bY: 1, bUnit: 'lon', bMa: 'same', bMax: 0, spMas: ['02HG18']
      }]);
      var productLive = scope.spFind('02HG18');
      var snapshot = scope.buildCartDisplaySnapshot(productLive, { '02HG18': { qT: 0, qL: 7 } }, 0, 7);
      assertEqual(snapshot.gross, 89964);
      assertEqual(snapshot.kmInfo.disc, 0);
      assertEqual(snapshot.kmInfo.bonus, 1);
      assertEqual(snapshot.orderExtraDisc, 0);
      assertEqual(snapshot.subtotal, 89964);
      assertEqual(snapshot.kmForTable.hopKM, 11246);
    });

    test('Live stackable gift-other bonus converts gift value into discount', function() {
      resetWithFixtures([
        { ma: '01SX05', ten: 'Creamer đặc NSPN xanh lá lon 380g', nhom: 'B', donvi: 'hộp', slThung: 48, giaNYLon: 19926, giaNYThung: 956448, kmRules: [] },
        { ma: '04FT32', ten: 'SDD không đường Vinamilk F220ml', nhom: 'C', donvi: 'Hộp', slThung: 48, giaNYLon: 7668, giaNYThung: 368064, kmRules: [] }
      ], [{
        name: 'T05·B·NSPN XL 380g HT: 14+1 Fino [MR05263016-M1]',
        type: 'bonus', nhoms: 'B', active: true, stackable: true,
        bX: 14, bY: 1, bUnit: 'lon', bMa: '04FT32', bMax: 0, spMas: ['01SX05']
      }]);
      var result = scope.calcKM(scope.spFind('01SX05'), 0, 14, { allMas: ['01SX05'], skuCount: 1 });
      assertEqual(result.disc, 7668);
      assertEqual(result.bonus, 0);
      assertBonusItems(result.bonusItems, [{ ma: '04FT32', qty: 1 }]);
    });

    test('Live NSPN combo aggregates stackable gift-other with non-stackable gift program', function() {
      resetWithFixtures([
        { ma: '01SX05', ten: 'Creamer đặc NSPN xanh lá lon 380g', nhom: 'B', donvi: 'hộp', slThung: 48, giaNYLon: 19926, giaNYThung: 956448, kmRules: [] },
        { ma: '04FT32', ten: 'SDD không đường Vinamilk F220ml', nhom: 'C', donvi: 'Hộp', slThung: 48, giaNYLon: 7668, giaNYThung: 368064, kmRules: [] }
      ], [
        {
          name: 'T05·B·NSPN XL 380g HT: 14+1 Fino [MR05263016-M1]',
          type: 'bonus', nhoms: 'B', active: true, stackable: true,
          bX: 14, bY: 1, bUnit: 'lon', bMa: '04FT32', bMax: 0, spMas: ['01SX05']
        },
        {
          name: 'T05·B·NSPN XL 380g HT: 28+1 NSPN/ÔT Tuýp [MR05263016-M2]',
          type: 'bonus', nhoms: 'B', active: true, stackable: false,
          bX: 28, bY: 1, bUnit: 'lon', bMa: '01SX05', bMax: 0, spMas: ['01SX05']
        }
      ]);
      var result = scope.calcKM(scope.spFind('01SX05'), 0, 28, { allMas: ['01SX05'], skuCount: 1 });
      assertEqual(result.disc, 35262);
      assertIncludes(result.desc, 'Tặng 2 hộp SP khác + 1 hộp SP khác');
      assertBonusItems(result.bonusItems, [{ ma: '04FT32', qty: 2 }, { ma: '01SX05', qty: 1 }]);
    });

    test('Live order_bonus promo gives one gift pack at 250k threshold', function() {
      resetWithFixtures([
        { ma: '02HG38', ten: 'Dielac Alpha Gold 110ml', nhom: 'A', donvi: 'Hộp', slThung: 48, giaNYLon: 8586, giaNYThung: 412128, kmRules: [] },
        { ma: '02HL37', ten: 'Dielac Grow Plus 110ml', nhom: 'A', donvi: 'Hộp', slThung: 48, giaNYLon: 9450, giaNYThung: 453600, kmRules: [] }
      ], [{
        name: 'T05·A·SBPS TE Ontop ĐH: 250k → 4h GP/Optimum 110ml (DS T1+T2≥5tr) [MR05263012-OB]',
        type: 'order_bonus', nhoms: 'A', active: true, bonusMa: '02HL36', bonusName: 'Grow Plus/Optimum 110ml',
        repeat: true, maxSets: 0, tiers: [{ value: 250, bonusQty: 4 }], spMas: ['02HG38', '02HL37']
      }]);
      var items = scope.getItemsFromCartState({ '02HG38': { qT: 0, qL: 30 } });
      var result = scope.calcOrderKM(items);
      assertBonusItems(result.bonusItems, [{ ma: '02HL36', qty: 4 }]);
      assertIncludes(result.desc, '+4 Grow Plus/Optimum 110ml');
    });

    test('Live snapshot converts order_bonus gift into virtual discount when cart has one qualifying SKU', function() {
      resetWithFixtures([
        { ma: '02HG38', ten: 'Dielac Alpha Gold 110ml', nhom: 'A', donvi: 'Hộp', slThung: 48, giaNYLon: 8586, giaNYThung: 412128, kmRules: [] },
        { ma: '02HL37', ten: 'Dielac Grow Plus 110ml', nhom: 'A', donvi: 'Hộp', slThung: 48, giaNYLon: 9450, giaNYThung: 453600, kmRules: [] },
        { ma: '02HL36', ten: 'Grow Plus/Optimum 110ml', nhom: 'A', donvi: 'Hộp', slThung: 48, giaNYLon: 9450, giaNYThung: 453600, kmRules: [] }
      ], [{
        name: 'T05·A·SBPS TE Ontop ĐH: 250k → 4h GP/Optimum 110ml (DS T1+T2≥5tr) [MR05263012-OB]',
        type: 'order_bonus', nhoms: 'A', active: true, bonusMa: '02HL36', bonusName: 'Grow Plus/Optimum 110ml',
        repeat: true, maxSets: 0, tiers: [{ value: 250, bonusQty: 4 }], spMas: ['02HG38', '02HL37']
      }]);
      var productLive = scope.spFind('02HG38');
      var snapshot = scope.buildCartDisplaySnapshot(productLive, { '02HG38': { qT: 0, qL: 30 } }, 0, 30);
      assertEqual(snapshot.gross, 257580);
      assertEqual(snapshot.kmInfo.disc, 0);
      assertEqual(snapshot.kmForTable.orderDiscAllocated, 0);
      assertEqual(snapshot.kmForTable.orderGiftValueAllocated, 37800);
      assertEqual(snapshot.orderExtraDisc, 37800);
      assertEqual(snapshot.subtotal, 219780);
    });

    test('Live order_bonus promo repeats on every 250k block', function() {
      resetWithFixtures([
        { ma: '02HG38', ten: 'Dielac Alpha Gold 110ml', nhom: 'A', donvi: 'Hộp', slThung: 48, giaNYLon: 8586, giaNYThung: 412128, kmRules: [] },
        { ma: '02HL37', ten: 'Dielac Grow Plus 110ml', nhom: 'A', donvi: 'Hộp', slThung: 48, giaNYLon: 9450, giaNYThung: 453600, kmRules: [] }
      ], [{
        name: 'T05·A·SBPS TE Ontop ĐH: 250k → 4h GP/Optimum 110ml (DS T1+T2≥5tr) [MR05263012-OB]',
        type: 'order_bonus', nhoms: 'A', active: true, bonusMa: '02HL36', bonusName: 'Grow Plus/Optimum 110ml',
        repeat: true, maxSets: 0, tiers: [{ value: 250, bonusQty: 4 }], spMas: ['02HG38', '02HL37']
      }]);
      var items = scope.getItemsFromCartState({ '02HG38': { qT: 1, qL: 12 } });
      var result = scope.calcOrderKM(items);
      assertBonusItems(result.bonusItems, [{ ma: '02HL36', qty: 8 }]);
      assertIncludes(result.desc, '+8 Grow Plus/Optimum 110ml');
    });

    test('Live SCA order_bonus promo is blocked when order lacks required SKUs', function() {
      resetWithFixtures([
        { ma: '07KD12', ten: 'SCA không đường VNM 100g', nhom: 'D', donvi: 'hộp', slThung: 48, giaNYLon: 6210, giaNYThung: 298080, kmRules: [] },
        { ma: '07TR33', ten: 'Sữa chua ăn có đường VNM 100g', nhom: 'D', donvi: 'Hũ', slThung: 48, giaNYLon: 6210, giaNYThung: 298080, kmRules: [] }
      ], [{
        name: 'T05·D·SCA Ontop ĐH 600k (≥2 SKU): 1 SCA Nha đam mỗi 300k [MR05263053-M1]',
        type: 'order_bonus', nhoms: 'D', active: true, bonusMa: '07ND12', bonusName: 'SCA Nha đam có đường',
        repeat: true, maxSets: 0, minSKU: 2, tiers: [{ value: 300, bonusQty: 1 }], spMas: ['07KD12', '07TR33']
      }]);
      var items = scope.getItemsFromCartState({ '07KD12': { qT: 0, qL: 60 } });
      var result = scope.calcOrderKM(items);
      assertEqual(result.desc, '');
      assertBonusItems(result.bonusItems, []);
    });

    test('Live SCA order_bonus promo applies after minSKU gate is met', function() {
      resetWithFixtures([
        { ma: '07KD12', ten: 'SCA không đường VNM 100g', nhom: 'D', donvi: 'hộp', slThung: 48, giaNYLon: 6210, giaNYThung: 298080, kmRules: [] },
        { ma: '07TR33', ten: 'Sữa chua ăn có đường VNM 100g', nhom: 'D', donvi: 'Hũ', slThung: 48, giaNYLon: 6210, giaNYThung: 298080, kmRules: [] }
      ], [{
        name: 'T05·D·SCA Ontop ĐH 600k (≥2 SKU): 1 SCA Nha đam mỗi 300k [MR05263053-M1]',
        type: 'order_bonus', nhoms: 'D', active: true, bonusMa: '07ND12', bonusName: 'SCA Nha đam có đường',
        repeat: true, maxSets: 0, minSKU: 2, tiers: [{ value: 300, bonusQty: 1 }], spMas: ['07KD12', '07TR33']
      }]);
      var items = scope.getItemsFromCartState({ '07KD12': { qT: 1, qL: 0 }, '07TR33': { qT: 1, qL: 1 } });
      var result = scope.calcOrderKM(items);
      assertBonusItems(result.bonusItems, [{ ma: '07ND12', qty: 2 }]);
      assertIncludes(result.desc, '+2 SCA Nha đam có đường');
    });

    test('Live Green Farm order_money promo applies 1% once threshold is reached', function() {
      resetWithFixtures([
        { ma: '04GI34', ten: 'STTT rất ít đường Green Farm 110ml', nhom: 'C', donvi: 'Hộp', slThung: 48, giaNYLon: 6156, giaNYThung: 295488, kmRules: [] },
        { ma: '04GI14', ten: 'STTT rất ít đường Green Farm 180ml', nhom: 'C', donvi: 'Hộp', slThung: 48, giaNYLon: 9612, giaNYThung: 461376, kmRules: [] }
      ], [{
        name: 'T05·C·GF MPP: ĐH 1.5tr giảm 1% [MR0526MPPGFSN-M1]',
        type: 'order_money', nhoms: 'C', active: true,
        tiers: [{ type: 'above', value: 1500, ck: 1 }], spMas: ['04GI34', '04GI14']
      }]);
      var items = scope.getItemsFromCartState({ '04GI14': { qT: 3, qL: 20 } });
      var result = scope.calcOrderKM(items);
      assertEqual(result.disc, 15764);
      assertIncludes(result.desc, 'GF MPP');
    });

    test('Live snapshot allocates Green Farm order_money discount into subtotal', function() {
      resetWithFixtures([
        { ma: '04GI34', ten: 'STTT rất ít đường Green Farm 110ml', nhom: 'C', donvi: 'Hộp', slThung: 48, giaNYLon: 6156, giaNYThung: 295488, kmRules: [] },
        { ma: '04GI14', ten: 'STTT rất ít đường Green Farm 180ml', nhom: 'C', donvi: 'Hộp', slThung: 48, giaNYLon: 9612, giaNYThung: 461376, kmRules: [] }
      ], [{
        name: 'T05·C·GF MPP: ĐH 1.5tr giảm 1% [MR0526MPPGFSN-M1]',
        type: 'order_money', nhoms: 'C', active: true,
        tiers: [{ type: 'above', value: 1500, ck: 1 }], spMas: ['04GI34', '04GI14']
      }]);
      var productLive = scope.spFind('04GI14');
      var snapshot = scope.buildCartDisplaySnapshot(productLive, { '04GI14': { qT: 3, qL: 20 } }, 3, 20);
      assertEqual(snapshot.gross, 1576368);
      assertEqual(snapshot.kmInfo.disc, 0);
      assertEqual(snapshot.kmForTable.orderDiscAllocated, 15764);
      assertEqual(snapshot.orderExtraDisc, 15764);
      assertEqual(snapshot.subtotal, 1560604);
    });

    return {
      passed: passed,
      failed: failed,
      total: passed + failed,
      tests: tests
    };
  }

  return runKmEngineTests;
});