// Giỏ hàng và khách hàng (legacy - giữ tương thích)
var cart = JSON.parse(localStorage.getItem(LS_KEYS.CART) || '{}');
var customers = JSON.parse(localStorage.getItem(LS_KEYS.LEGACY_KH) || '[]');
var _orderDraftDate = getTodayDateInputValue();
var _ordersHistoryFilter = 'today';
var _editingOrderId = '';

function saveCart() { localStorage.setItem(LS_KEYS.CART, JSON.stringify(cart)); }
function fmt(n) { return Math.round(n).toLocaleString('vi-VN'); }

function getTodayDateInputValue() {
  var now = new Date();
  var offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function buildOrderDateISO(dateValue) {
  var safeDate = dateValue || getTodayDateInputValue();
  return new Date(safeDate + 'T12:00:00').toISOString();
}

function getSelectedOrderDateValue() {
  var input = document.getElementById('order-date-input');
  if (input && input.value) {
    _orderDraftDate = input.value;
    return input.value;
  }
  return _orderDraftDate || getTodayDateInputValue();
}

function onOrderDateChange(value) {
  _orderDraftDate = value || getTodayDateInputValue();
}

function setEditingOrderId(orderId) {
  _editingOrderId = orderId ? String(orderId) : '';
}

function clearOrderDraftState() {
  setEditingOrderId('');
  _orderDraftDate = getTodayDateInputValue();
}

function normalizeTierMoneyRule(tier) {
  var ckPerc = +tier.ck;
  if (!ckPerc || ckPerc <= 0) return null;

  var type = tier.type || (tier.mx != null ? 'below' : 'above');
  var value = 0;

  // Unit guard: persisted promotion thresholds are in VND, but some legacy
  // fields are authored in K. Preserve the existing conversion rules exactly
  // so tier_money never reintroduces the old double-divide bug.
  if (tier.value != null && tier.value !== '') {
    value = +tier.value;
    if (!isNaN(value) && value > 0 && value < 10000) value = value * 1000;
  } else if (tier.mx != null && tier.mx !== '') {
    value = +tier.mx;
  } else if (tier.mn != null && tier.mn !== '') {
    value = +tier.mn * 1000;
  }

  if (isNaN(value) || value < 0) value = 0;
  return { type: type, value: value, ckPct: ckPerc };
}

function syncLegacyCustomerOrder(order, previousOrder) {
  if (!order || !order.id) return;
  var targetKhMa = order.khMa || '';
  var previousKhMa = previousOrder && previousOrder.khMa ? previousOrder.khMa : '';

  customers.forEach(function(customer) {
    if (!customer || !Array.isArray(customer.orders)) return;
    customer.orders = customer.orders.filter(function(existingOrder) {
      return String(existingOrder.id) !== String(order.id);
    });
  });

  if (targetKhMa) {
    var targetCustomer = customers.find(function(customer) { return customer.ma === targetKhMa; });
    if (!targetCustomer) {
      targetCustomer = { ma: targetKhMa, orders: [] };
      customers.push(targetCustomer);
    }
    if (!Array.isArray(targetCustomer.orders)) targetCustomer.orders = [];
    targetCustomer.orders.unshift(order);
    if (targetCustomer.orders.length > 30) targetCustomer.orders = targetCustomer.orders.slice(0, 30);
  }

  if (previousKhMa || targetKhMa) {
    localStorage.setItem(LS_KEYS.LEGACY_KH, JSON.stringify(customers));
  }
}

function removeLegacyCustomerOrder(orderRef) {
  var order = resolveOrder(orderRef);
  if (!order) return;
  var changed = false;
  customers.forEach(function(customer) {
    if (!customer || !Array.isArray(customer.orders)) return;
    var nextOrders = customer.orders.filter(function(existingOrder) {
      return String(existingOrder.id) !== String(order.id);
    });
    if (nextOrders.length !== customer.orders.length) {
      customer.orders = nextOrders;
      changed = true;
    }
  });
  if (changed) localStorage.setItem(LS_KEYS.LEGACY_KH, JSON.stringify(customers));
}

function getEditOrderSummary(order) {
  if (!order) return '';
  var dateText = order.ngay || (order.date ? new Date(order.date).toLocaleDateString('vi-VN') : '');
  return 'Đang sửa đơn ' + (dateText ? 'ngày ' + dateText : '#' + order.id) + (order.khTen ? ' · ' + order.khTen : '');
}

function startEditOrder(orderRef) {
  var order = resolveOrder(orderRef);
  if (!order) return;
  var currentItems = getItems();
  var isSameEditing = _editingOrderId && String(_editingOrderId) === String(order.id);
  // auto-proceed (không hỏi confirm)

  var nextCart = {};
  (order.items || []).forEach(function(item) {
    if (!item || !item.ma) return;
    var qT = Math.max(0, parseInt(item.qT, 10) || 0);
    var qL = Math.max(0, parseInt(item.qL, 10) || 0);
    if (!qT && !qL && item.totalLon) qL = Math.max(0, parseInt(item.totalLon, 10) || 0);
    if (!qT && !qL) return;
    nextCart[item.ma] = { qT: qT, qL: qL };
  });

  cart = nextCart;
  saveCart();
  updateBadge();
  setEditingOrderId(order.id);
  _orderDraftDate = (order.date || '').slice(0, 10) || getTodayDateInputValue();

  if (typeof onSelectCustomer === 'function') onSelectCustomer(order.khMa || '');
  else window._selectedCustomerMa = order.khMa || '';

  var modal = document.getElementById('km-modal');
  if (modal) modal.style.display = 'none';

  if (window.renderOrder) renderOrder();
  renderDon();
  if (typeof gotoTab === 'function') gotoTab('order');
  showToast('✏️ Đã nạp đơn vào giỏ để chỉnh sửa');
}

function cancelEditOrder() {
  clearOrderDraftState();
  if (typeof onSelectCustomer === 'function') onSelectCustomer('');
  else window._selectedCustomerMa = '';
  cart = {};
  saveCart();
  updateBadge();
  if (window.renderOrder) renderOrder();
  renderDon();
}

// ============================================================
// KM ENGINE v2 (giữ nguyên)
// ============================================================
function buildBonusRules(prog) {
  var rule = { type: 'bonus', unit: prog.bUnit || 'lon', X: +prog.bX || 12, Y: +prog.bY || 1 };
  if (prog.bMa && prog.bMa !== 'same') {
    var bonusProduct = spFind(prog.bMa);
    rule.giaBonus = bonusProduct ? bonusProduct.giaNYLon : null;
  }
  if (+prog.bMax === 1) rule.maxSets = 1;
  return [rule];
}

function buildFixedRules(prog) {
  return [{ type: 'fixed', ck: +prog.ck / 100 }];
}

function buildTierQtyRules(prog) {
  var tiers = (prog.tiers || []).filter(function(t) { return +t.mn > 0 && +t.ck > 0; }).map(function(t) {
    return { minT: +t.mn, ck: +t.ck / 100 };
  });
  return tiers.length ? [{ type: 'tier_qty', unit: prog.tUnit || 'lon', tiers: tiers }] : [];
}

function buildTierMoneyRules(prog) {
  var tiers = (prog.tiers || []).map(normalizeTierMoneyRule).filter(function(t) { return t && t.ckPct > 0; });
  return tiers.length ? [{ type: 'tier_money', tiers: tiers }] : [];
}

var KM_RULE_BUILDERS = {
  bonus: buildBonusRules,
  fixed: buildFixedRules,
  tier_qty: buildTierQtyRules,
  tier_money: buildTierMoneyRules
};

function kmBuildRules(prog) {
  var builder = KM_RULE_BUILDERS[prog.type];
  return builder ? builder(prog) : [];
}

function calcBonusGiftItemFromProgram(prog, p, qT, qL) {
  if (!prog || prog.type !== 'bonus') return null;
  if (!prog.bMa || prog.bMa === 'same') return null;
  var X = Math.max(1, parseInt(prog.bX, 10) || 12);
  var Y = Math.max(0, parseInt(prog.bY, 10) || 0);
  if (!Y) return null;
  var unit = prog.bUnit || 'lon';
  var cqb = unit === 'thung' ? qT : (qT * p.slThung + qL);
  var sets = Math.floor(cqb / X);
  if (+prog.bMax === 1) sets = Math.min(sets, 1);
  if (sets <= 0) return null;
  var qty = sets * Y;
  if (qty <= 0) return null;
  var bonusProduct = spFind(prog.bMa);
  return {
    ma: prog.bMa,
    name: (bonusProduct && bonusProduct.ten) || prog.bonusName || prog.bMa || 'SP tặng',
    qty: qty,
    progName: prog.name || 'CT KM'
  };
}

function mergeBonusGiftItems(items) {
  if (!Array.isArray(items) || !items.length) return [];
  var merged = {};
  items.forEach(function(item) {
    if (!item || !item.ma || !item.qty) return;
    var key = item.ma;
    if (!merged[key]) merged[key] = { ma: item.ma, name: item.name || 'SP tặng', qty: 0, progNames: [] };
    merged[key].qty += Math.max(0, parseInt(item.qty, 10) || 0);
    if (item.progName && merged[key].progNames.indexOf(item.progName) < 0) merged[key].progNames.push(item.progName);
  });
  return Object.keys(merged).map(function(key) {
    return {
      ma: merged[key].ma,
      name: merged[key].name,
      qty: merged[key].qty,
      progName: merged[key].progNames.join(' + ')
    };
  }).filter(function(item) { return item.qty > 0; });
}

function calcKM(p, qT, qL, orderContext) {
  var applicable = kmProgs.filter(function(prog) {
    if (!prog.active) return false;
    if (!(prog.spMas || []).includes(p.ma)) return false;
    if (prog.minSKU && orderContext) {
      var matchedSKUs = (orderContext.allMas || []).filter(function(ma) { return prog.spMas.includes(ma); });
      if (matchedSKUs.length < +prog.minSKU) return false;
    }
    return true;
  });
  var baseKM = _calcKM_orig(p, qT, qL);
  if (!applicable.length) return { disc: baseKM.disc, bonus: baseKM.bonus, nhan: baseKM.nhan, hopKM: baseKM.hopKM, thungKM: baseKM.thungKM, desc: baseKM.desc, appliedPromos: [], bonusItems: [] };

  var stackable = applicable.filter(function(prog) { return prog.stackable; });
  var nonStackable = applicable.filter(function(prog) { return !prog.stackable; });
  var allRules = [], appliedProgs = [];
  var selectedPromoObjects = [];
  stackable.forEach(function(prog) { allRules.push.apply(allRules, kmBuildRules(prog)); });

  var bestNonStack = null, bestHop = p.giaNYLon;
  nonStackable.forEach(function(prog) {
    var testRules = kmBuildRules(prog);
    var pCopy = {}; for (var k in p) pCopy[k] = p[k]; pCopy.kmRules = testRules;
    var testKM = _calcKM_orig(pCopy, qT, qL);
    if (testKM.hopKM < bestHop) { bestHop = testKM.hopKM; bestNonStack = { prog: prog, rules: testRules }; }
  });
  if (bestNonStack) allRules.push.apply(allRules, bestNonStack.rules);

  var pFinal = {}; for (var k2 in p) pFinal[k2] = p[k2]; pFinal.kmRules = allRules;
  var kmFinal = _calcKM_orig(pFinal, qT, qL);
  if (kmFinal.disc > 0 || kmFinal.bonus > 0) {
    selectedPromoObjects = stackable.filter(function(prog) {
      var pTest = {}; for (var k3 in p) pTest[k3] = p[k3]; pTest.kmRules = kmBuildRules(prog);
      var t = _calcKM_orig(pTest, qT, qL); return t.disc > 0 || t.bonus > 0;
    });
    appliedProgs = selectedPromoObjects.map(function(prog) { return prog.name || 'CT KM'; });
    if (bestNonStack) {
      selectedPromoObjects.push(bestNonStack.prog);
      appliedProgs.push(bestNonStack.prog.name || 'CT KM');
    }
  }
  var bonusItems = mergeBonusGiftItems(selectedPromoObjects.map(function(prog) {
    return calcBonusGiftItemFromProgram(prog, p, qT, qL);
  }));
  return { disc: kmFinal.disc, bonus: kmFinal.bonus, nhan: kmFinal.nhan, hopKM: kmFinal.hopKM, thungKM: kmFinal.thungKM, desc: kmFinal.desc, appliedPromos: appliedProgs, bonusItems: bonusItems };
}

function parsePromoMoneyValue(value) {
  var num = +value;
  if (isNaN(num) || num <= 0) return 0;

  // Order-level thresholds are stored in VND after normalization. Values below
  // 10000 are treated as K-based authoring input and converted once here.
  return num < 10000 ? num * 1000 : num;
}

function orderPromoDiscount(baseTotal, prog) {
  var tiers = (prog.tiers || []).map(function(t) {
    var type = t.type || 'above'; var value = parsePromoMoneyValue(t.value != null ? t.value : (t.mn != null ? t.mn : 0)); var ck = +t.ck / 100;
    if (!value || !ck) return null; return { type: type, value: value, ck: ck };
  }).filter(function(t) { return t && t.ck > 0; });
  if (!tiers.length) return 0;
  var disc = 0;
  tiers.forEach(function(t) { if (t.type === 'below' && baseTotal < t.value) disc = Math.max(disc, Math.round(baseTotal * t.ck)); if (t.type === 'above' && baseTotal >= t.value) disc = Math.max(disc, Math.round(baseTotal * t.ck)); });
  return disc;
}

function getOrderPromoEligibleTotal(items, baseTotal, prog) {
  var progMas = prog.spMas || [];
  if (!progMas.length) return baseTotal;
  return items.filter(function(it) { return progMas.includes(it.ma); }).reduce(function(sum, it) { return sum + it.gocTotal; }, 0);
}

function hasOrderPromoMinSKU(allMas, progMas, minSKU) {
  if (!minSKU) return true;
  var unique = [];
  var seen = {};
  allMas.forEach(function(ma) {
    if (progMas.length && !progMas.includes(ma)) return;
    if (seen[ma]) return;
    seen[ma] = true;
    unique.push(ma);
  });
  return unique.length >= +minSKU;
}

function normalizeOrderBonusTier(tier, prog) {
  var rawMin = tier.value != null ? tier.value : (tier.mn != null ? tier.mn : 0);
  var rawMax = tier.maxValue != null ? tier.maxValue : (tier.mx != null ? tier.mx : (tier.max != null ? tier.max : 0));
  var minAmount = 0;
  var maxAmount = 0;
  if (rawMax) {
    minAmount = parsePromoMoneyValue(rawMin);
    maxAmount = parsePromoMoneyValue(rawMax);
  } else if (tier.type === 'below') {
    maxAmount = parsePromoMoneyValue(rawMin);
  } else {
    minAmount = parsePromoMoneyValue(rawMin);
  }
  if (maxAmount > 0 && minAmount > 0 && maxAmount <= minAmount) return null;
  return {
    minAmount: minAmount,
    maxAmount: maxAmount,
    bonusQty: +tier.bonusQty || +prog.bonusQty || 0,
    repeat: (tier.repeat == null) ? (prog.repeat !== false) : (tier.repeat !== false),
    maxSets: +tier.maxSets || +prog.maxSets || 0
  };
}

function buildOrderBonusResult(items, allMas, baseTotal, prog) {
  var total = getOrderPromoEligibleTotal(items, baseTotal, prog);
  var progMas = prog.spMas || [];
  if (!hasOrderPromoMinSKU(allMas, progMas, prog.minSKU)) return null;

  // Cascade mode: tier cao nhất trước, phần dư tiếp tục áp tier thấp hơn
  if (prog.cascade) {
    var cascTiers = (prog.tiers || []).map(function(t) {
      var val = t.value != null ? t.value : (t.mn != null ? t.mn : 0);
      return { minAmount: parsePromoMoneyValue(val), bonusQty: +t.bonusQty || 0 };
    }).filter(function(t) { return t.minAmount > 0 && t.bonusQty > 0; })
      .sort(function(a, b) { return b.minAmount - a.minAmount; });
    if (!cascTiers.length) return null;
    var remaining = total;
    var totalBonus = 0;
    for (var ci = 0; ci < cascTiers.length; ci++) {
      var ct = cascTiers[ci];
      var sets = Math.floor(remaining / ct.minAmount);
      totalBonus += sets * ct.bonusQty;
      remaining -= sets * ct.minAmount;
    }
    if (totalBonus <= 0) return null;
    var cascProduct = prog.bonusMa ? spFind(prog.bonusMa) : null;
    var cascName = prog.bonusName || (cascProduct ? cascProduct.ten : '') || prog.bonusMa || 'SP tặng';
    var cascUnitValue = cascProduct ? (+cascProduct.giaNYLon || 0) : 0;
    return {
      ma: prog.bonusMa,
      name: cascName,
      qty: totalBonus,
      progName: prog.name || 'CT Ontop',
      value: cascUnitValue > 0 ? cascUnitValue * totalBonus : totalBonus
    };
  }

  var tiers = (prog.tiers || []).map(function(t) {
    return normalizeOrderBonusTier(t, prog);
  }).filter(function(t) {
    return t && t.bonusQty > 0 && (t.minAmount > 0 || t.maxAmount > 0);
  }).sort(function(a, b) {
    if (b.minAmount !== a.minAmount) return b.minAmount - a.minAmount;
    return (a.maxAmount || Infinity) - (b.maxAmount || Infinity);
  });
  if (!tiers.length) return null;
  var best = tiers.find(function(t) {
    return total >= t.minAmount && (!t.maxAmount || total < t.maxAmount);
  });
  if (!best) return null;
  var sets = 1;
  if (best.repeat && best.minAmount > 0 && !best.maxAmount) {
    // Chỉ repeat khi tier KHÔNG có cận trên (tức là "mỗi X đồng tặng Y");
    // khi có maxAmount (range) thì luôn là 1 suất
    sets = Math.floor(total / best.minAmount);
    if (best.maxSets) sets = Math.min(sets, best.maxSets);
  }
  var totalBonus = sets * best.bonusQty;
  if (totalBonus <= 0) return null;
  var bonusProduct = prog.bonusMa ? spFind(prog.bonusMa) : null;
  var bonusName = prog.bonusName || (bonusProduct ? bonusProduct.ten : '') || prog.bonusMa || 'SP tặng';
  var unitValue = bonusProduct ? (+bonusProduct.giaNYLon || 0) : 0;
  return {
    ma: prog.bonusMa,
    name: bonusName,
    qty: totalBonus,
    progName: prog.name || 'CT Ontop',
    value: unitValue > 0 ? unitValue * totalBonus : totalBonus
  };
}

function formatOrderBonusItemText(bi) {
  if (!bi) return '';
  var product = bi.ma ? spFind(bi.ma) : null;
  if (product && typeof window.formatQtyByCarton === 'function') {
    return window.formatQtyByCarton(product, bi.qty) + ' ' + (bi.name || product.ten || '');
  }
  return bi.qty + ' ' + (bi.name || 'SP tặng');
}

function applyOrderMoneyPromo(items, allMas, baseTotal, prog) {
  if (!hasOrderPromoMinSKU(allMas, prog.spMas || [], prog.minSKU)) return null;
  var total = getOrderPromoEligibleTotal(items, baseTotal, prog);
  var disc = orderPromoDiscount(total, prog);
  if (disc <= 0) return null;
  return { disc: disc, name: prog.name || 'CK đơn' };
}

function applyOrderBonusPromo(items, allMas, baseTotal, prog) {
  var result = buildOrderBonusResult(items, allMas, baseTotal, prog);
  if (!result) return null;
  return {
    item: { ma: result.ma, name: result.name, qty: result.qty, progName: result.progName },
    desc: result.progName + ': +' + result.qty + ' ' + result.name,
    value: result.value
  };
}

var ORDER_PROMO_HANDLERS = {
  order_money: applyOrderMoneyPromo,
  order_bonus: applyOrderBonusPromo
};

function calcOrderKM(items) {
  if (!items || !items.length) return { disc: 0, desc: '', bonusItems: [], discProgNames: [] };
  var baseTotal = items.reduce(function(sum, item) { return sum + item.gocTotal; }, 0);
  var allMas = items.map(function(it) { return it.ma; });
  var orderPromos = kmProgs.filter(function(prog) { return prog.active && (prog.type === 'order_money' || prog.type === 'order_bonus'); });
  if (!orderPromos.length) return { disc: 0, desc: '', bonusItems: [], discProgNames: [] };
  var disc = 0; var descParts = []; var bonusItems = []; var discProgNames = [];
  var moneyPromos = orderPromos.filter(function(p) { return p.type === 'order_money'; });
  moneyPromos.filter(function(p) { return p.stackable; }).forEach(function(prog) {
    var result = ORDER_PROMO_HANDLERS[prog.type](items, allMas, baseTotal, prog);
    if (!result) return;
    disc += result.disc;
    descParts.push(result.name);
    discProgNames.push(result.name);
  });
  var bestDisc = 0, bestProg = null;
  moneyPromos.filter(function(p) { return !p.stackable; }).forEach(function(prog) {
    var result = ORDER_PROMO_HANDLERS[prog.type](items, allMas, baseTotal, prog);
    if (!result) return;
    if (result.disc > bestDisc) { bestDisc = result.disc; bestProg = result.name; }
  });
  if (bestDisc > 0 && bestProg) { disc += bestDisc; descParts.push(bestProg); discProgNames.push(bestProg); }
  var bonusPromos = orderPromos.filter(function(p) { return p.type === 'order_bonus'; });
  bonusPromos.filter(function(p) { return p.stackable; }).forEach(function(prog) {
    var result = ORDER_PROMO_HANDLERS[prog.type](items, allMas, baseTotal, prog);
    if (!result) return;
    bonusItems.push(result.item);
    descParts.push(result.desc);
  });
  var bestBonus = null;
  bonusPromos.filter(function(p) { return !p.stackable; }).forEach(function(prog) {
    var result = ORDER_PROMO_HANDLERS[prog.type](items, allMas, baseTotal, prog);
    if (!result) return;
    if (!bestBonus || result.value > bestBonus.value) bestBonus = result;
  });
  if (bestBonus) {
    bonusItems.push(bestBonus.item);
    descParts.push(bestBonus.desc);
  }
  return { disc: disc, desc: descParts.join(' | '), bonusItems: bonusItems, discProgNames: discProgNames };
}

function applyTierMoneyDiscountRule(rule, base) {
  var belowTiers = rule.tiers.filter(function(t) { return t.type === 'below' && base < t.value; });
  var bestBelow = belowTiers.length ? belowTiers.reduce(function(prev, curr) { return !prev || curr.value < prev.value ? curr : prev; }) : null;
  var aboveTiers = rule.tiers.filter(function(t) { return t.type === 'above' && base >= t.value; });
  var bestAbove = aboveTiers.length ? aboveTiers.reduce(function(prev, curr) { return !prev || curr.value > prev.value ? curr : prev; }) : null;
  var bestTier = (bestBelow && bestAbove) ? (bestBelow.ckPct >= bestAbove.ckPct ? bestBelow : bestAbove) : (bestBelow || bestAbove);
  if (!bestTier || bestTier.ckPct <= 0) return null;
  return { disc: Math.round(base * bestTier.ckPct / 100), line: 'CK ' + bestTier.ckPct + '%' };
}

function applyTierQtyDiscountRule(rule, base, qT, totalLon) {
  var compareQty = rule.unit === 'thung' ? qT : totalLon;
  var bestTier = rule.tiers.slice().sort(function(a, b) { return b.minT - a.minT; }).find(function(tier) { return compareQty >= tier.minT; });
  if (!bestTier) return null;
  return { disc: Math.round(base * bestTier.ck), line: 'CK ' + Math.round(bestTier.ck * 100) + '%' };
}

function applyFixedDiscountRule(rule, base) {
  return { disc: Math.round(base * rule.ck), line: 'CK ' + Math.round(rule.ck * 100) + '%' };
}

var ITEM_DISCOUNT_RULE_HANDLERS = {
  tier_money: applyTierMoneyDiscountRule,
  tier_qty: applyTierQtyDiscountRule,
  fixed: applyFixedDiscountRule
};

function _calcDiscountRules(rules, base, qT, totalLon) {
  var ckDisc = 0, lines = [];
  for (var ri = 0; ri < rules.length; ri++) {
    var r = rules[ri];
    var handler = ITEM_DISCOUNT_RULE_HANDLERS[r.type];
    var partial = handler ? handler(r, base, qT, totalLon) : null;
    if (!partial) continue;
    ckDisc += partial.disc;
    lines.push(partial.line);
  }
  return { ckDisc: ckDisc, lines: lines };
}

function applyBonusRule(rule, product, qT, totalLon) {
  var compareQty = rule.unit === 'thung' ? qT : totalLon;
  var sets = rule.maxSets ? Math.min(Math.floor(compareQty / rule.X), rule.maxSets) : Math.floor(compareQty / rule.X);
  if (sets <= 0) return null;

  var bonusUnits = sets * rule.Y;
  var bonusLon = rule.unit === 'thung' ? bonusUnits * product.slThung : bonusUnits;
  var unitLabel = rule.unit === 'thung' ? 'thùng' : product.donvi;
  if (rule.giaBonus != null) {
    return {
      sameBl: 0,
      diffBonusValue: rule.giaBonus > 0 ? Math.round(bonusLon * rule.giaBonus) : 0,
      desc: bonusUnits + ' ' + unitLabel + ' SP khác'
    };
  }

  return {
    sameBl: bonusLon,
    diffBonusValue: 0,
    desc: bonusUnits + ' ' + unitLabel
  };
}

function _calcBestBonus(rules, p, qT, totalLon, base, ckDisc) {
  // Gộp TẤT CẢ bonus rules (stackable đã được chọn trước ở calcKM)
  // — cùng SP: cộng vào mẫu số (nhận thêm lons)
  // — SP khác: trừ giá trị SP tặng khỏi tử số
  var sameBl = 0;
  var diffBonusValue = 0;
  var descParts = [];
  var anyHit = false;
  for (var bi = 0; bi < rules.length; bi++) {
    var rb = rules[bi];
    if (rb.type !== 'bonus') continue;
    var partial = applyBonusRule(rb, p, qT, totalLon);
    if (!partial) continue;
    anyHit = true;
    sameBl += partial.sameBl;
    diffBonusValue += partial.diffBonusValue;
    descParts.push(partial.desc);
  }
  if (!anyHit) return null;
  var nhanTry = totalLon + sameBl;
  var hopTry = nhanTry > 0 ? Math.round((base - ckDisc - diffBonusValue) / nhanTry) : p.giaNYLon;
  return { hopKM: hopTry, bl: sameBl, bu: descParts.join(' + '), unit: '', nhan: nhanTry, bonusDisc: diffBonusValue };
}

function _calcKM_orig(p, qT, qL) {
  var totalLon = qT * p.slThung + qL; var base = p.giaNYLon * totalLon;
  if (!totalLon) return { disc: 0, bonus: 0, nhan: 0, hopKM: p.giaNYLon, thungKM: p.giaNYThung, desc: '' };
  var result = _calcDiscountRules(p.kmRules, base, qT, totalLon);
  var ckDisc = result.ckDisc, lines = result.lines;
  var bestBonus = _calcBestBonus(p.kmRules, p, qT, totalLon, base, ckDisc);
  var hopKM, bonusLon = 0, bonusDisc = 0;
  if (bestBonus) { hopKM = bestBonus.hopKM; bonusLon = bestBonus.bl; bonusDisc = bestBonus.bonusDisc || 0; lines.unshift('Tặng ' + bestBonus.bu + (bestBonus.unit ? ' ' + bestBonus.unit : '')); }
  else { hopKM = totalLon ? Math.round((base - ckDisc) / totalLon) : p.giaNYLon; }
  return { disc: ckDisc + bonusDisc, bonus: bonusLon, nhan: totalLon + bonusLon, hopKM: hopKM, thungKM: hopKM * p.slThung, desc: lines.join(' + ') };
}

// ============================================================
// GIỎ HÀNG — auto-link với KH đã chọn
// ============================================================
function getItemsFromCartState(cartState) {
  var sourceCart = cartState || {};
  var allMas = Object.entries(sourceCart).filter(function(e) { return e[1].qT > 0 || e[1].qL > 0; }).map(function(e) { return e[0]; });
  var orderContext = { allMas: allMas, skuCount: allMas.length };
  return Object.entries(sourceCart).filter(function(e) { return e[1].qT > 0 || e[1].qL > 0; }).map(function(e) {
    var ma = e[0], q = e[1];
    var p = spFind(ma); if (!p) return null;
    var totalLon = q.qT * p.slThung + q.qL; var gocTotal = p.giaNYLon * totalLon;
    var km = calcKM(p, q.qT, q.qL, orderContext);
    return { ma: p.ma, ten: p.ten, nhom: p.nhom, donvi: p.donvi, slThung: p.slThung, giaNYLon: p.giaNYLon, giaNYThung: p.giaNYThung, qT: q.qT, qL: q.qL, totalLon: totalLon, gocTotal: gocTotal, disc: km.disc, desc: km.desc, bonus: km.bonus, bonusItems: km.bonusItems || [], afterKM: gocTotal - km.disc, appliedPromos: km.appliedPromos };
  }).filter(Boolean);
}

function getItems() {
  return getItemsFromCartState(cart);
}

// Build orderContext từ cart hiện tại để truyền vào calcKM. extraMa để bao gồm
// SP đang được preview (chưa add cart) — minSKU sẽ check như thể SP đã trong giỏ.
function buildOrderContextFromCart(extraMa) {
  var allMas = [];
  var seen = {};
  Object.keys(cart || {}).forEach(function(ma) {
    var c = cart[ma];
    if (!c || (c.qT <= 0 && c.qL <= 0)) return;
    if (seen[ma]) return;
    seen[ma] = true; allMas.push(ma);
  });
  if (extraMa && !seen[extraMa]) allMas.push(extraMa);
  return { allMas: allMas, skuCount: allMas.length };
}

function removeCart(ma) {
  delete cart[ma]; saveCart(); updateBadge();
  var card = document.getElementById('card_' + ma); if (card) card.className = 'sp-card';
  ['qT_', 'qL_'].forEach(function(pre) { var el = document.getElementById(pre + ma); if (el) el.value = ''; });
  var pv = document.getElementById('pv_' + ma); if (pv) pv.style.display = 'none';
  renderDon();
}

function clearCart() {
  cart = {};
  saveCart();
  updateBadge();
  clearOrderDraftState();
  if (typeof onSelectCustomer === 'function') onSelectCustomer('');
  else window._selectedCustomerMa = '';
  if (window.renderOrder) window.renderOrder();
  renderDon();
}
function updateBadge() { var n = getItems().length; var b = document.getElementById('don-badge'); if (b) { b.style.display = n ? '' : 'none'; b.textContent = n; } }

// ============================================================
// TAB ĐƠN HÀNG — Giỏ hiện tại + Lịch sử đơn + Copy Zalo
// ============================================================
function renderDon() {
  var items = getItems();
  var el = document.getElementById('don-content'); if (!el) return;
  var cloudReady = typeof syncHasToken === 'function' && syncHasToken();

  var html = '';
  var editingOrder = _editingOrderId ? resolveOrder(_editingOrderId) : null;
  if (_editingOrderId && !editingOrder) clearOrderDraftState();

  // ─── PHẦN 1: Giỏ hàng hiện tại ───
  if (items.length) {
    var totGoc = items.reduce(function(s, x) { return s + x.gocTotal; }, 0);
    var totAfter = items.reduce(function(s, x) { return s + x.afterKM; }, 0);
    var orderKM = calcOrderKM(items);
    var totAfterOrder = totAfter - orderKM.disc;
    var totSave = totGoc - totAfterOrder;

    var selMa = window._selectedCustomerMa || '';
    var cusList = (typeof CUS !== 'undefined' && Array.isArray(CUS)) ? CUS : [];
    var selKH = selMa ? cusList.find(function(k) { return k.ma === selMa; }) : null;

    html += '<div class="ord-wrap"><div class="ord-hd"><span class="ord-hdT">🛒 Giỏ hàng · ' + items.length + ' SP</span><span class="ord-hdV">' + fmt(totAfterOrder) + 'đ</span></div>';

    items.forEach(function(it) {
      html += '<div class="oi"><div class="oi-top"><div class="oi-name">' + escapeHtml(it.ten) + '</div><button class="oi-del" onclick="removeCart(\'' + escapeHtmlAttr(it.ma) + '\')">✕</button></div>';
      html += '<div class="oi-sub">' + escapeHtml(it.ma) + ' · ' + escapeHtml(it.donvi) + '</div>';
      html += '<div class="oi-qty">' + (it.qT > 0 ? it.qT + ' thùng' : '') + (it.qT > 0 && it.qL > 0 ? ' + ' : '') + (it.qL > 0 ? it.qL + ' lẻ' : '') + ' = ' + it.totalLon + ' ' + escapeHtml(it.donvi) + (it.bonus > 0 ? ' + tặng ' + it.bonus : '') + '</div>';
      if (it.bonusItems && it.bonusItems.length) { it.bonusItems.forEach(function(bi) { html += '<div class="oi-km">🎁 Tặng kèm: ' + bi.qty + ' ' + escapeHtml(bi.name || 'SP tặng') + '</div>'; }); }
      if (it.desc) html += '<div class="oi-km">' + escapeHtml(it.desc) + '</div>';
      html += '<div class="oi-pr"><span class="oi-pl">Thành tiền</span><span class="oi-pv">' + fmt(it.afterKM) + 'đ</span></div></div>';
    });

    html += '<div class="ord-ft">';
    if (editingOrder) {
      html += '<div style="background:var(--oL);border:1.5px solid var(--o);border-radius:var(--Rs);padding:10px 12px;margin-bottom:12px">';
      html += '<div style="font-size:12px;font-weight:800;color:var(--o);margin-bottom:4px">✏️ Chế độ sửa đơn</div>';
      html += '<div style="font-size:11px;color:var(--n2);line-height:1.5">' + getEditOrderSummary(editingOrder) + '</div>';
      html += '<button onclick="cancelEditOrder()" style="margin-top:8px;height:34px;padding:0 12px;border:1.5px solid var(--o);border-radius:8px;background:var(--card);color:var(--o);font-size:11px;font-weight:700;cursor:pointer">Huỷ sửa</button>';
      html += '</div>';
    }
    if (totSave > 0) {
      html += '<div class="ft-row"><span class="ft-l">Giá gốc</span><span class="ft-v">' + fmt(totGoc) + 'đ</span></div>';
      html += '<div class="ft-row"><span class="ft-l">Tiết kiệm KM</span><span class="ft-save">-' + fmt(totSave) + 'đ</span></div>';
    }
    if (orderKM.disc > 0) html += '<div class="ft-row"><span class="ft-l">CK đơn hàng</span><span class="ft-save">-' + fmt(orderKM.disc) + 'đ</span></div>';
    if (orderKM.bonusItems && orderKM.bonusItems.length) {
      orderKM.bonusItems.forEach(function(bi) { html += '<div class="ft-row"><span class="ft-l" style="color:var(--vm)">🎁 ' + escapeHtml(bi.progName) + '</span><span style="color:var(--vm);font-weight:700">+' + escapeHtml(formatOrderBonusItemText(bi)) + '</span></div>'; });
    }
    html += '<div class="ft-grand"><div class="ft-gr"><span class="ft-gl">Tổng cộng</span><span class="ft-gv">' + fmt(totAfterOrder) + 'đ</span></div>';
    html += '<div class="ft-gr"><span class="ft-vl">+VAT 1.5%</span><span class="ft-vv">' + fmt(Math.round(totAfterOrder * 1.015)) + 'đ</span></div></div>';

    html += '<div class="order-meta-grid">';
    html += '<label class="order-meta-field"><span class="order-meta-label">Ngày đặt hàng</span><input class="order-date-input" type="date" id="order-date-input" value="' + getSelectedOrderDateValue() + '" onchange="onOrderDateChange(this.value)"></label>';
    html += '</div>';

    // KH
    html += '<div style="margin:12px 0 8px">';
    if (selKH) {
      html += '<div style="background:var(--vmL);border:1.5px solid var(--vm);border-radius:var(--R);padding:12px 14px">';
      html += '<div style="font-size:13px;font-weight:800;color:var(--vm)">👤 ' + escapeHtml(selKH.ten || selKH.ma) + '</div>';
      html += '<div style="font-size:10.5px;color:var(--n2)">' + escapeHtml(selKH.ma) + (selKH.tuyen ? ' · ' + escapeHtml(selKH.tuyen) : '') + '</div>';
      html += '</div>';
    } else {
      html += '<input class="makh-inp" type="text" id="makh-inp" placeholder="Mã KH (hoặc chọn KH ở tab Đặt hàng)">';
    }
    html += '</div>';

    html += '<button class="btn-submit" onclick="submitOrder()">' + (editingOrder ? '💾 Lưu chỉnh sửa đơn' : '📤 Tạo đơn hàng') + '</button>';
    html += '<button class="btn-clear" onclick="clearCart()">🗑 Xoá giỏ</button>';
    html += '</div></div>';
  }

  // ─── PHẦN 2: Lịch sử đơn hàng ───
  var orders = getOrders();
  if (orders.length || !items.length) {
    html += '<div style="padding:16px 12px 8px"><div style="font-size:15px;font-weight:800;color:var(--n1);display:flex;align-items:center;gap:6px">' + (window.renderIcon ? window.renderIcon('list', 16, 2) : '') + 'Lịch sử đơn hàng</div>';
    html += '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">';
    if (cloudReady) {
    } else {
      html += '<button onclick="syncOpenSettings()" style="height:34px;padding:0 12px;border:1.5px solid var(--o);border-radius:8px;background:var(--card);color:var(--o);font-size:11px;font-weight:700;cursor:pointer">☁️ Cài cloud GitHub</button>';
    }
    html += '</div>';
    if (!orders.length) {
      html += '<div style="font-size:13px;color:var(--n3);margin-top:8px">Chưa có đơn nào' + (items.length ? '' : '<br><small>Vào Đặt hàng để thêm SP</small>') + '</div>';
    }
    html += '</div>';

    // Filter buttons
    if (orders.length) {
      html += '<div style="display:flex;gap:6px;padding:0 12px 8px;flex-wrap:wrap">';
      html += '<button onclick="filterOrders(\'today\')" class="pill' + (_ordersHistoryFilter === 'today' ? ' on-all' : '') + '" style="font-size:11px">Hôm nay</button>';
      html += '<button onclick="filterOrders(\'week\')" class="pill' + (_ordersHistoryFilter === 'week' ? ' on-all' : '') + '" style="font-size:11px">Tuần này</button>';
      html += '<button onclick="filterOrders(\'month\')" class="pill' + (_ordersHistoryFilter === 'month' ? ' on-all' : '') + '" style="font-size:11px">Tháng này</button>';
      html += '<button onclick="filterOrders(\'all\')" class="pill' + (_ordersHistoryFilter === 'all' ? ' on-all' : '') + '" style="font-size:11px">Tất cả</button>';
      html += '</div>';
    }

    html += '<div id="orders-history">';
    html += renderOrdersList(orders, _ordersHistoryFilter);
    html += '</div>';
  }

  el.innerHTML = html;
}

function buildDesktopOrderSidebarHTML() {
  var items = getItems();
  var orders = getOrders();
  var html = '';

  html += '<div class="desktop-panel-card desktop-cart-panel">';
  html += '<div class="desktop-panel-head"><div><div class="desktop-panel-kicker">Giỏ hàng</div><div class="desktop-panel-title">Tóm tắt đơn</div></div></div>';

  if (items.length) {
    var totGoc = items.reduce(function(sum, item) { return sum + item.gocTotal; }, 0);
    var totAfter = items.reduce(function(sum, item) { return sum + item.afterKM; }, 0);
    var orderKM = calcOrderKM(items);
    var total = totAfter - orderKM.disc;
    html += '<div class="desktop-cart-total">' + fmt(total) + 'đ</div>';
    html += '<div class="desktop-cart-meta">' + items.length + ' SP · VAT ' + fmt(Math.round(total * 1.015)) + 'đ</div>';
    html += '<div class="desktop-cart-items">';
    items.slice(0, 6).forEach(function(item) {
      html += '<div class="desktop-cart-row">';
      html += '<div class="desktop-cart-name">' + escapeHtml(item.ten) + '</div>';
      html += '<div class="desktop-cart-sub">' + item.totalLon + ' ' + escapeHtml(item.donvi) + '</div>';
      html += '<div class="desktop-cart-value">' + fmt(item.afterKM) + 'đ</div>';
      html += '</div>';
    });
    html += '</div>';
    html += '<div class="desktop-cart-actions">';
    html += '<button class="desktop-primary-btn" onclick="gotoTab(\'don\')">Xem giỏ đầy đủ</button>';
    html += '<button class="desktop-secondary-btn" onclick="submitOrder()">Xác nhận đơn</button>';
    html += '</div>';
  } else {
    html += '<div class="desktop-empty">Chưa có sản phẩm trong giỏ. Chọn số lượng ở danh sách bên trái để tạo đơn.</div>';
  }
  html += '</div>';

  html += '<div class="desktop-panel-card">';
  html += '<div class="desktop-panel-head"><div><div class="desktop-panel-kicker">Lịch sử</div><div class="desktop-panel-title">Đơn gần đây</div></div></div>';
  if (orders.length) {
    orders.slice(0, 5).forEach(function(order) {
      html += '<div class="desktop-order-history-row">';
      html += '<div><div class="desktop-order-history-code">' + escapeHtml(order.khTen || order.khMa || 'Không rõ KH') + '</div><div class="desktop-order-history-meta">' + escapeHtml((order.ngay || '').toString()) + '</div></div>';
      html += '<div class="desktop-order-history-value">' + fmt(order.tong || 0) + 'đ</div>';
      html += '</div>';
    });
  } else {
    html += '<div class="desktop-empty">Chưa có đơn hàng nào được lưu.</div>';
  }
  html += '</div>';

  return html;
}

function filterOrders(period) {
  _ordersHistoryFilter = period || 'all';
  var el = document.getElementById('orders-history'); if (!el) return;
  var orders = getOrders();
  el.innerHTML = renderOrdersList(orders, _ordersHistoryFilter);
  // Update active pill
  var buttons = el.parentElement.querySelectorAll('.pill');
  var labels = { today: 'Hôm nay', week: 'Tuần này', month: 'Tháng này', all: 'Tất cả' };
  buttons.forEach(function(b) {
    b.className = 'pill' + (b.textContent.trim() === labels[_ordersHistoryFilter] ? ' on-all' : '');
  });
}

function getVisibleOrderIndexById(orderId) {
  return getOrders().findIndex(function(order) { return String(order.id) === String(orderId); });
}

function resolveOrder(orderRef) {
  if (orderRef && typeof orderRef === 'object') {
    if (orderRef.id == null) return null;
    return orderRef;
  }
  if (orderRef == null || orderRef === '') return null;
  var orders = getOrders();
  return orders.find(function(order) { return String(order.id) === String(orderRef); }) || null;
}

function handleOrderActionClick(button) {
  if (!button) return;
  var orderId = button.getAttribute('data-order-id');
  var action = button.getAttribute('data-order-action');
  if (!orderId || !action) return;

  if (action === 'copy') copyOrderZalo(orderId);
  else if (action === 'edit') startEditOrder(orderId);
  else if (action === 'detail') viewOrderDetail(orderId);
  else if (action === 'delete') deleteOrder(orderId);
}

function renderOrdersList(orders, period) {
  var now = new Date();
  var today = now.toISOString().slice(0, 10);
  var weekAgo = new Date(now - 7 * 86400000).toISOString().slice(0, 10);
  var monthStart = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-01';

  var filtered = orders.filter(function(o) {
    if (!period || period === 'all') return true;
    var d = (o.date || '').slice(0, 10);
    if (period === 'today') return d === today;
    if (period === 'week') return d >= weekAgo;
    if (period === 'month') return d >= monthStart;
    return true;
  });

  if (!filtered.length) return '<div style="padding:12px;font-size:13px;color:var(--n3);text-align:center">Không có đơn trong khoảng này</div>';

  var html = '';
  filtered.forEach(function(o, i) {
    var orderIdAttr = escapeHtmlAttr(o.id);
    var khName = o.khTen || o.khMa || 'Không rõ KH';
    var itemCount = (o.items || []).length;
    var ngay = o.date ? new Date(o.date).toLocaleString('vi-VN', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' }) : o.ngay || '';

    html += '<div class="history-card">';
    html += '<div class="history-card-head">';
    html += '<div class="history-card-total">' + fmt(o.tong) + 'đ</div>';
    html += '<div class="history-card-meta">' + escapeHtml(ngay) + ' · ' + itemCount + ' SP · ' + escapeHtml(khName) + '</div>';
    html += '</div>';

    html += '<div class="history-item-list">';
    (o.items || []).slice(0, 3).forEach(function(it) {
      html += '<div class="history-item-row"><span>' + escapeHtml(it.ten) + '</span><span style="font-weight:600">' + it.totalLon + ' ' + escapeHtml(it.donvi) + '</span></div>';
    });
    if (itemCount > 3) html += '<div class="history-more">... +' + (itemCount - 3) + ' SP khác</div>';
    html += '</div>';

    html += '<div class="history-card-actions">';
    html += '<button type="button" data-order-id="' + orderIdAttr + '" data-order-action="copy" onclick="handleOrderActionClick(this)" class="history-card-btn copy"><span style="display:inline-flex;align-items:center;gap:4px">' + (window.renderIcon ? window.renderIcon('copy', 12, 2) : '') + 'Copy</span></button>';
    html += '<button type="button" data-order-id="' + orderIdAttr + '" data-order-action="edit" onclick="handleOrderActionClick(this)" class="history-card-btn edit"><span style="display:inline-flex;align-items:center;gap:4px">' + (window.renderIcon ? window.renderIcon('edit', 12, 2) : '') + 'Sửa đơn</span></button>';
    html += '<button type="button" data-order-id="' + orderIdAttr + '" data-order-action="detail" onclick="handleOrderActionClick(this)" class="history-card-btn view"><span style="display:inline-flex;align-items:center;gap:4px">' + (window.renderIcon ? window.renderIcon('detail', 12, 2) : '') + 'Chi tiết</span></button>';
    html += '<button type="button" data-order-id="' + orderIdAttr + '" data-order-action="delete" onclick="handleOrderActionClick(this)" class="history-card-btn delete">' + (window.renderIcon ? window.renderIcon('trash', 14, 2) : '🗑') + '</button>';
    html += '</div>';

    html += '</div>';
  });
  return html;
}

// ============================================================
// TẠO ĐƠN — Lưu vào orders + xóa giỏ
// ============================================================
async function submitOrder() {
  var items = getItems(); if (!items.length) return;
  var existingOrder = _editingOrderId ? resolveOrder(_editingOrderId) : null;
  var makh = (window._selectedCustomerMa) ? window._selectedCustomerMa : ((document.getElementById('makh-inp') || {}).value || '').trim().toUpperCase();
  var orderDateValue = getSelectedOrderDateValue();
  var orderDateISO = buildOrderDateISO(orderDateValue);
  var orderKM = calcOrderKM(items);
  var tong = items.reduce(function(s, x) { return s + x.afterKM; }, 0) - orderKM.disc;

  // Tìm tên KH
  var khTen = '';
  if (makh) {
    var cusList = (typeof CUS !== 'undefined' && Array.isArray(CUS)) ? CUS : [];
    var kh = cusList.find(function(k) { return k.ma === makh; });
    if (kh) khTen = kh.ten || '';
  }

  // Tạo order object
  var order = {
    id: existingOrder ? existingOrder.id : Date.now(),
    date: orderDateISO,
    ngay: new Date(orderDateISO).toLocaleDateString('vi-VN'),
    _updatedAt: new Date().toISOString(),
    khMa: makh,
    khTen: khTen,
    items: items.map(function(it) {
      return { ma: it.ma, ten: it.ten, donvi: it.donvi, nhom: it.nhom, qT: it.qT, qL: it.qL, totalLon: it.totalLon, gocTotal: it.gocTotal, afterKM: it.afterKM, disc: it.disc, desc: it.desc, bonus: it.bonus };
    }),
    tong: tong,
    tongGoc: items.reduce(function(s, x) { return s + x.gocTotal; }, 0),
    orderDisc: orderKM.disc,
    bonusItems: orderKM.bonusItems
  };

  // Lưu vào orders history — giữ lại record _deleted cho sync cloud
  var rawOrders = (typeof getOrdersRaw === 'function') ? getOrdersRaw() : getOrders();
  var filteredRaw = rawOrders.filter(function(o) { return String(o.id) !== String(order.id); });
  filteredRaw.unshift(order);
  saveOrders(filteredRaw);
  syncLegacyCustomerOrder(order, existingOrder);

  var todayValue = getTodayDateInputValue();
  _ordersHistoryFilter = orderDateValue === todayValue ? 'today' : (orderDateValue.slice(0, 7) === todayValue.slice(0, 7) ? 'month' : 'all');

  var cloudMessage = '';
  if (typeof syncAutoPushOrder === 'function') {
    var cloudResult = await syncAutoPushOrder(order);
    if (cloudResult && cloudResult.ok) cloudMessage = '\n☁️ Đã lưu đơn lên GitHub';
    else if (cloudResult && cloudResult.error) cloudMessage = '\n⚠️ Đơn đã lưu máy này, nhưng chưa đẩy được lên GitHub: ' + cloudResult.error;
  }

  // Tạo đơn xong — thông báo toast, không hỏi copy
  showToast((existingOrder ? '✅ Đã cập nhật đơn ' : '✅ Đã tạo đơn ') + fmt(tong) + 'đ' + (khTen ? ' · ' + khTen : '') + (cloudMessage ? '\n' + cloudMessage.trim() : ''));

  clearCart();
  if (window.renderCusTab) renderCusTab();
  if (window.renderHomeDashboard) renderHomeDashboard();
}

// ============================================================
function copyOrderZalo(orderRef) {
  var o = resolveOrder(orderRef); if (!o) return;
  var lines = [];
  lines.push('ĐƠN HÀNG' + (o.khTen ? ' — ' + o.khTen : '') + (o.khMa ? ' (' + o.khMa + ')' : ''));
  lines.push('Ngày: ' + (o.ngay || new Date(o.date).toLocaleDateString('vi-VN')));
  lines.push('─────────────────');

  (o.items || []).forEach(function(it, i) {
    var line = (i + 1) + '. ' + it.ten;
    line += '\n   ' + (it.qT > 0 ? it.qT + 'T' : '') + (it.qT > 0 && it.qL > 0 ? '+' : '') + (it.qL > 0 ? it.qL + 'L' : '') + ' = ' + it.totalLon + ' ' + it.donvi;
    if (it.bonus > 0) line += ' + tặng ' + it.bonus;
    if (it.desc) line += '\n   KM: ' + it.desc;
    line += '\n   → ' + fmt(it.afterKM) + 'đ';
    lines.push(line);
  });

  lines.push('─────────────────');
  if (o.tongGoc && o.tongGoc > o.tong) {
    lines.push('Giá gốc: ' + fmt(o.tongGoc) + 'đ');
    lines.push('Tiết kiệm: -' + fmt(o.tongGoc - o.tong) + 'đ');
  }
  lines.push('TỔNG: ' + fmt(o.tong) + 'đ');
  lines.push('+VAT: ' + fmt(Math.round(o.tong * 1.015)) + 'đ');

  if (o.bonusItems && o.bonusItems.length) {
    lines.push('');
    o.bonusItems.forEach(function(bi) {
      lines.push('🎁 ' + bi.progName + ': +' + formatOrderBonusItemText(bi));
    });
  }

  var text = lines.join('\n');

  // Copy to clipboard
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function() {
      showToast('✅ Đã copy đơn! Dán vào Zalo để gửi.');
    }).catch(function() {
      fallbackCopy(text);
    });
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  var ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
  document.body.appendChild(ta);
  ta.select();
  ta.setSelectionRange(0, text.length);
  try {
    document.execCommand('copy');
    showToast('✅ Đã copy đơn! Dán vào Zalo để gửi.');
  } catch(e) {
    showToast('Không copy được tự động. Vui lòng copy thủ công.');
  }
  document.body.removeChild(ta);
}

// ============================================================
// XEM CHI TIẾT / XÓA ĐƠN
// ============================================================
function viewOrderDetail(orderRef) {
  var o = resolveOrder(orderRef); if (!o) return;
  var orderIdAttr = escapeHtmlAttr(o.id);
  var orderIndex = getVisibleOrderIndexById(o.id);

  var modal = document.getElementById('km-modal');
  document.getElementById('km-modal-t').textContent = '📋 Chi tiết đơn #' + ((orderIndex >= 0) ? (getOrders().length - orderIndex) : o.id);
  modal.style.display = 'block';

  var body = document.getElementById('km-modal-body');
  var html = '';

  html += '<div style="background:var(--vmL);border-radius:var(--Rs);padding:12px 14px;margin-bottom:12px;border:1px solid #C9D7FF">';
  html += '<div style="display:flex;justify-content:space-between;align-items:center">';
  html += '<div><div style="font-size:11px;color:var(--n3)">' + (o.ngay || '') + '</div>';
  html += '<div style="font-size:14px;font-weight:800;color:var(--vm)">' + escapeHtml(o.khTen || o.khMa || 'Không rõ KH') + '</div></div>';
  html += '<div style="font-size:20px;font-weight:900;color:var(--vm)">' + fmt(o.tong) + 'đ</div>';
  html += '</div></div>';

  (o.items || []).forEach(function(it, i) {
    html += '<div style="padding:8px 0;border-bottom:1px solid var(--n5)">';
    html += '<div style="display:flex;justify-content:space-between"><div style="font-size:13px;font-weight:700">' + (i+1) + '. ' + escapeHtml(it.ten) + '</div><div style="font-size:13px;font-weight:800;color:var(--vm)">' + fmt(it.afterKM) + 'đ</div></div>';
    html += '<div style="font-size:11px;color:var(--n3)">' + escapeHtml(it.ma) + ' · ' + it.totalLon + ' ' + escapeHtml(it.donvi) + (it.bonus > 0 ? ' + tặng ' + it.bonus : '') + '</div>';
    if (it.desc) html += '<div style="font-size:11px;color:var(--vm);font-weight:600">' + escapeHtml(it.desc) + '</div>';
    html += '</div>';
  });

  if (o.bonusItems && o.bonusItems.length) {
    html += '<div style="margin-top:10px;padding:10px 0;border-top:1px solid var(--n5)">';
    o.bonusItems.forEach(function(bi) {
      html += '<div style="display:flex;justify-content:space-between;gap:8px;padding:6px 0"><div style="font-size:12px;font-weight:700;color:var(--vm)">🎁 ' + escapeHtml(bi.progName) + '</div><div style="font-size:12px;color:var(--vm);text-align:right">+' + escapeHtml(formatOrderBonusItemText(bi)) + '</div></div>';
    });
    html += '</div>';
  }

  html += '<div style="margin-top:12px;padding-top:12px;border-top:2px solid var(--n5)">';
  html += '<div style="display:flex;justify-content:space-between;font-size:14px;font-weight:800"><span>Tổng cộng</span><span style="color:var(--vm)">' + fmt(o.tong) + 'đ</span></div>';
  html += '<div style="display:flex;justify-content:space-between;font-size:12px;color:var(--b);margin-top:4px"><span>+VAT 1.5%</span><span>' + fmt(Math.round(o.tong * 1.015)) + 'đ</span></div>';
  html += '</div>';

  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:16px">';
  html += '<button type="button" data-order-id="' + orderIdAttr + '" data-order-action="edit" onclick="handleOrderActionClick(this)" style="height:46px;border:1.5px solid var(--o);border-radius:var(--R);background:var(--card);color:var(--o);font-size:14px;font-weight:800;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px">' + (window.renderIcon ? window.renderIcon('edit', 16, 2) : '') + 'Sửa đơn</button>';
  html += '<button type="button" data-order-id="' + orderIdAttr + '" data-order-action="copy" onclick="handleOrderActionClick(this)" style="height:46px;background:linear-gradient(135deg,var(--vm),var(--vm2));color:#fff;border:none;border-radius:var(--R);font-size:14px;font-weight:800;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px">' + (window.renderIcon ? window.renderIcon('copy', 16, 2) : '') + 'Copy Zalo</button>';
  html += '</div>';
  html += '<button type="button" data-order-id="' + orderIdAttr + '" data-order-action="delete" onclick="handleOrderActionClick(this)" style="width:100%;height:42px;border:1.5px solid var(--r);border-radius:var(--R);background:var(--card);color:var(--r);font-size:13px;font-weight:700;cursor:pointer;margin-top:8px;display:flex;align-items:center;justify-content:center;gap:6px">' + (window.renderIcon ? window.renderIcon('trash', 15, 2) : '') + 'Xóa đơn này</button>';

  body.innerHTML = html;
}

function deleteOrder(orderRef) {
  var order = resolveOrder(orderRef);
  if (!order) return;
  removeLegacyCustomerOrder(order);
  if (window.softDeleteOrder) softDeleteOrder(order.id);
  if (_editingOrderId && String(_editingOrderId) === String(order.id)) clearOrderDraftState();
  var modal = document.getElementById('km-modal');
  if (modal) modal.style.display = 'none';
  if (window.syncAutoPushOrder) syncAutoPushOrder();
  if (window.renderHomeDashboard) renderHomeDashboard();
  if (window.renderCusTab) renderCusTab();
  if (window.renderOrder) renderOrder();
  renderDon();
}

function renderKH() { if (window.renderCusTab) window.renderCusTab(); }
function addKH() {}
function delKH() {}

// ============================================================
// DEBUG TRACE GIÁ — paste vào Safari/Chrome console:
//   debugCalcPrice('01SX05', 2, 0)   // SP, qT, qL
// In ra: SP info, applicable promos, skipped (do minSKU), per-SP KM,
// order-level KM cho cả giỏ. Dùng khi giá hiển thị sai để gửi cho AI verify.
// ============================================================
function debugCalcPrice(ma, qT, qL) {
  qT = parseInt(qT, 10) || 0; qL = parseInt(qL, 10) || 0;
  var p = (typeof spFind === 'function') ? spFind(ma) : null;
  if (!p) { console.error('[debugCalcPrice] Không tìm thấy SP:', ma); return null; }

  var ctx = buildOrderContextFromCart(ma);
  var progs = (typeof kmProgs !== 'undefined') ? kmProgs : [];

  console.group('🔍 debugCalcPrice: ' + p.ma + ' (qT=' + qT + ', qL=' + qL + ')');
  console.log('SP:', p.ten, '| nhóm:', p.nhom, '| donvi:', p.donvi);
  console.log('giaNYLon:', p.giaNYLon, '| giaNYThung:', p.giaNYThung, '| slThung:', p.slThung);
  console.log('Context allMas (' + ctx.allMas.length + '):', ctx.allMas);

  var applicable = [], skipped = [];
  progs.forEach(function(prog) {
    if (!prog.active) return;
    if (!(prog.spMas || []).includes(p.ma)) return;
    if (prog.minSKU) {
      var matched = ctx.allMas.filter(function(m) { return prog.spMas.includes(m); });
      if (matched.length < +prog.minSKU) {
        skipped.push({ prog: prog, reason: 'minSKU=' + prog.minSKU + ' nhưng chỉ ' + matched.length + ' SKU khớp' });
        return;
      }
    }
    applicable.push(prog);
  });
  console.log('Applicable (' + applicable.length + '):');
  applicable.forEach(function(prog, i) {
    console.log('  ' + (i+1) + '. [' + prog.type + ']' + (prog.stackable ? ' STACK' : ' NON-stack') + ' — ' + (prog.name || 'CT KM'));
  });
  if (skipped.length) {
    console.log('Skipped (' + skipped.length + '):');
    skipped.forEach(function(s) { console.log('  - ' + (s.prog.name || 'CT KM') + ' [' + s.reason + ']'); });
  }

  var km = calcKM(p, qT, qL, ctx);
  var totalLon = qT * p.slThung + qL;
  var goc = p.giaNYLon * totalLon;
  var afterKM = goc - km.disc;
  var vat = Math.round(afterKM * 0.015);
  console.log('--- Per-SP result ---');
  console.log('Tổng lon:', totalLon, '| Gốc:', fmt(goc) + 'đ');
  console.log('disc:', fmt(km.disc) + 'đ', '| bonus:', km.bonus, '| nhan:', km.nhan);
  console.log('hopKM:', fmt(km.hopKM) + 'đ', '| thungKM:', fmt(km.thungKM) + 'đ');
  console.log('Sau KM (chưa VAT):', fmt(afterKM) + 'đ');
  console.log('VAT 1.5%:', fmt(vat) + 'đ');
  console.log('TẠM TÍNH:', fmt(afterKM + vat) + 'đ');
  console.log('appliedPromos:', km.appliedPromos);
  console.log('bonusItems:', km.bonusItems);
  console.log('desc:', km.desc);

  var draftCart = {};
  Object.keys(cart || {}).forEach(function(m) {
    var c = cart[m]; if (c && (c.qT > 0 || c.qL > 0)) draftCart[m] = { qT: c.qT, qL: c.qL };
  });
  if (qT > 0 || qL > 0) draftCart[ma] = { qT: qT, qL: qL };
  var items = getItemsFromCartState(draftCart);
  var orderKM = calcOrderKM(items);
  console.log('--- Order-level KM (cả giỏ ' + items.length + ' SP) ---');
  console.log('Order disc:', fmt(orderKM.disc) + 'đ');
  console.log('Order bonusItems:', orderKM.bonusItems);
  console.log('Order desc:', orderKM.desc);

  console.groupEnd();
  return { km: km, orderKM: orderKM, ctx: ctx, applicable: applicable, skipped: skipped, items: items };
}

window.cart = cart; window.customers = customers;
window.saveCart = saveCart; window.fmt = fmt;
window.calcKM = calcKM; window.calcOrderKM = calcOrderKM;
window.getItems = getItems;
window.getItemsFromCartState = getItemsFromCartState;
window.buildOrderContextFromCart = buildOrderContextFromCart;
window.debugCalcPrice = debugCalcPrice;
window.removeCart = removeCart; window.clearCart = clearCart;
window.renderDon = renderDon; window.submitOrder = submitOrder;
window.renderKH = renderKH; window.addKH = addKH; window.delKH = delKH;
window.updateBadge = updateBadge;
window.kmBuildRules = kmBuildRules;
window._calcKM_orig = _calcKM_orig;
window.copyOrderZalo = copyOrderZalo;
window.startEditOrder = startEditOrder;
window.cancelEditOrder = cancelEditOrder;
window.viewOrderDetail = viewOrderDetail;
window.deleteOrder = deleteOrder;
window.handleOrderActionClick = handleOrderActionClick;
window.filterOrders = filterOrders;
window.onOrderDateChange = onOrderDateChange;
window.buildDesktopOrderSidebarHTML = buildDesktopOrderSidebarHTML;
