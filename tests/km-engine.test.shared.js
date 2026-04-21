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

    return {
      passed: passed,
      failed: failed,
      total: passed + failed,
      tests: tests
    };
  }

  return runKmEngineTests;
});