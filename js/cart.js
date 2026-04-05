// Giỏ hàng và khách hàng (legacy - giữ tương thích)
var cart = JSON.parse(localStorage.getItem('vnm_cart') || '{}');
var customers = JSON.parse(localStorage.getItem('vnm_kh') || '[]');
var _orderDraftDate = getTodayDateInputValue();
var _ordersHistoryFilter = 'today';
var _editingOrderId = '';

function saveCart() { localStorage.setItem('vnm_cart', JSON.stringify(cart)); }
function fmt(n) { return Math.round(n).toLocaleString('vi-VN'); }

function escapeHtmlAttr(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

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
    localStorage.setItem('vnm_kh', JSON.stringify(customers));
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
  if (changed) localStorage.setItem('vnm_kh', JSON.stringify(customers));
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
function kmBuildRules(prog) {
  var rules = [];
  if (prog.type === 'bonus') {
    var r = { type: 'bonus', unit: prog.bUnit || 'lon', X: +prog.bX || 12, Y: +prog.bY || 1 };
    if (prog.bMa && prog.bMa !== 'same') { var bp = spFind(prog.bMa); if (bp) r.giaBonus = bp.giaNYLon; }
    if (+prog.bMax === 1) r.maxSets = 1;
    rules.push(r);
  } else if (prog.type === 'fixed') {
    rules.push({ type: 'fixed', ck: +prog.ck / 100 });
  } else if (prog.type === 'tier_qty') {
    var tiers = (prog.tiers || []).filter(function(t) { return +t.mn > 0 && +t.ck > 0; }).map(function(t) { return { minT: +t.mn, ck: +t.ck / 100 }; });
    if (tiers.length) rules.push({ type: 'tier_qty', unit: prog.tUnit || 'lon', tiers: tiers });
  } else if (prog.type === 'tier_money') {
    var tiers2 = (prog.tiers || []).map(function(t) {
      var ckPerc = +t.ck; if (!ckPerc || ckPerc <= 0) return null;
      var type = t.type || (t.mx != null ? 'below' : 'above');
      var value = 0;
      if (t.value != null && t.value !== '') { value = +t.value; if (!isNaN(value) && value > 0 && value < 10000) value = value * 1000; }
      else if (t.mx != null && t.mx !== '') { value = +t.mx; }
      else if (t.mn != null && t.mn !== '') { value = +t.mn * 1000; }
      if (isNaN(value) || value < 0) value = 0;
      return { type: type, value: value, ckPct: ckPerc };
    }).filter(function(t) { return t && t.ckPct > 0; });
    if (tiers2.length) rules.push({ type: 'tier_money', tiers: tiers2 });
  } else if (prog.type === 'order_money' || prog.type === 'order_bonus') { return []; }
  return rules;
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
  if (!applicable.length) return { disc: baseKM.disc, bonus: baseKM.bonus, nhan: baseKM.nhan, hopKM: baseKM.hopKM, thungKM: baseKM.thungKM, desc: baseKM.desc, appliedPromos: [] };

  var stackable = applicable.filter(function(prog) { return prog.stackable; });
  var nonStackable = applicable.filter(function(prog) { return !prog.stackable; });
  var allRules = [], appliedProgs = [];
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
    appliedProgs = stackable.filter(function(prog) {
      var pTest = {}; for (var k3 in p) pTest[k3] = p[k3]; pTest.kmRules = kmBuildRules(prog);
      var t = _calcKM_orig(pTest, qT, qL); return t.disc > 0 || t.bonus > 0;
    }).map(function(prog) { return prog.name || 'CT KM'; });
    if (bestNonStack) appliedProgs.push(bestNonStack.prog.name || 'CT KM');
  }
  return { disc: kmFinal.disc, bonus: kmFinal.bonus, nhan: kmFinal.nhan, hopKM: kmFinal.hopKM, thungKM: kmFinal.thungKM, desc: kmFinal.desc, appliedPromos: appliedProgs };
}

function parsePromoMoneyValue(value) { var num = +value; if (isNaN(num) || num <= 0) return 0; return num < 10000 ? num * 1000 : num; }

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

function calcOrderKM(items) {
  if (!items || !items.length) return { disc: 0, desc: '', bonusItems: [] };
  var baseTotal = items.reduce(function(sum, item) { return sum + item.gocTotal; }, 0);
  var allMas = items.map(function(it) { return it.ma; });
  var orderPromos = kmProgs.filter(function(prog) { return prog.active && (prog.type === 'order_money' || prog.type === 'order_bonus'); });
  if (!orderPromos.length) return { disc: 0, desc: '', bonusItems: [] };
  var disc = 0; var descParts = []; var bonusItems = [];
  var moneyPromos = orderPromos.filter(function(p) { return p.type === 'order_money'; });
  moneyPromos.filter(function(p) { return p.stackable; }).forEach(function(prog) {
    var total = baseTotal; if (prog.spMas && prog.spMas.length) total = items.filter(function(it) { return prog.spMas.includes(it.ma); }).reduce(function(s, it) { return s + it.gocTotal; }, 0);
    var d = orderPromoDiscount(total, prog); if (d > 0) { disc += d; descParts.push(prog.name || 'CK đơn'); }
  });
  var bestDisc = 0, bestProg = null;
  moneyPromos.filter(function(p) { return !p.stackable; }).forEach(function(prog) {
    var total = baseTotal; if (prog.spMas && prog.spMas.length) total = items.filter(function(it) { return prog.spMas.includes(it.ma); }).reduce(function(s, it) { return s + it.gocTotal; }, 0);
    var d = orderPromoDiscount(total, prog); if (d > bestDisc) { bestDisc = d; bestProg = prog; }
  });
  if (bestDisc > 0 && bestProg) { disc += bestDisc; descParts.push(bestProg.name || 'CK đơn'); }
  orderPromos.filter(function(p) { return p.type === 'order_bonus'; }).forEach(function(prog) {
    var total = baseTotal; var progMas = prog.spMas || [];
    if (progMas.length) total = items.filter(function(it) { return progMas.includes(it.ma); }).reduce(function(s, it) { return s + it.gocTotal; }, 0);
    if (prog.minSKU) { var unique = []; var seen = {}; allMas.forEach(function(ma) { if (progMas.includes(ma) && !seen[ma]) { seen[ma] = true; unique.push(ma); } }); if (unique.length < +prog.minSKU) return; }
    var tiers = (prog.tiers || []).map(function(t) { return { minAmount: parsePromoMoneyValue(t.value || t.mn || 0), bonusQty: +t.bonusQty || +prog.bonusQty || 0, repeat: t.repeat !== false }; }).filter(function(t) { return t.minAmount > 0 && t.bonusQty > 0; }).sort(function(a, b) { return b.minAmount - a.minAmount; });
    if (!tiers.length) return;
    var best = tiers.find(function(t) { return total >= t.minAmount; }); if (!best) return;
    var sets = 1; if (best.repeat && best.minAmount > 0) { sets = Math.floor(total / best.minAmount); if (prog.maxSets) sets = Math.min(sets, +prog.maxSets); }
    var totalBonus = sets * best.bonusQty;
    if (totalBonus > 0) { var bName = prog.bonusName || (prog.bonusMa ? (spFind(prog.bonusMa) || {}).ten || prog.bonusMa : 'SP tặng'); bonusItems.push({ ma: prog.bonusMa, name: bName, qty: totalBonus, progName: prog.name || 'CT Ontop' }); descParts.push(prog.name + ': +' + totalBonus + ' ' + bName); }
  });
  return { disc: disc, desc: descParts.join(' | '), bonusItems: bonusItems };
}

function _calcKM_orig(p, qT, qL) {
  var totalLon = qT * p.slThung + qL; var base = p.giaNYLon * totalLon;
  if (!totalLon) return { disc: 0, bonus: 0, nhan: 0, hopKM: p.giaNYLon, thungKM: p.giaNYThung, desc: '' };
  var ckDisc = 0, lines = [];
  for (var ri = 0; ri < p.kmRules.length; ri++) {
    var r = p.kmRules[ri];
    if (r.type === 'tier_money') {
      var applicableTier = null;
      var belowTiers = r.tiers.filter(function(t) { return t.type === 'below' && base < t.value; });
      if (belowTiers.length) applicableTier = belowTiers.reduce(function(prev, curr) { return !prev || curr.value < prev.value ? curr : prev; });
      var aboveTiers = r.tiers.filter(function(t) { return t.type === 'above' && base >= t.value; });
      if (aboveTiers.length) applicableTier = aboveTiers.reduce(function(prev, curr) { return !prev || curr.value > prev.value ? curr : prev; });
      if (applicableTier && applicableTier.ckPct > 0) { ckDisc += Math.round(base * applicableTier.ckPct / 100); lines.push('CK ' + applicableTier.ckPct + '%'); }
    } else if (r.type === 'tier_qty') {
      var cq = r.unit === 'thung' ? qT : totalLon;
      var t2 = r.tiers.slice().sort(function(a, b) { return b.minT - a.minT; }).find(function(x) { return cq >= x.minT; });
      if (t2) { ckDisc += Math.round(base * t2.ck); lines.push('CK ' + Math.round(t2.ck * 100) + '%'); }
    } else if (r.type === 'fixed') { ckDisc += Math.round(base * r.ck); lines.push('CK ' + Math.round(r.ck * 100) + '%'); }
  }
  var bestBonus = null;
  for (var bi = 0; bi < p.kmRules.length; bi++) {
    var rb = p.kmRules[bi];
    if (rb.type === 'bonus') {
      var cqb = rb.unit === 'thung' ? qT : totalLon;
      var sets = rb.maxSets ? Math.min(Math.floor(cqb / rb.X), rb.maxSets) : Math.floor(cqb / rb.X);
      if (sets > 0) {
        var bu = sets * rb.Y; var bl = rb.unit === 'thung' ? bu * p.slThung : bu;
        var hopTry, nhanTry;
        if (rb.giaBonus != null) { hopTry = rb.giaBonus === 0 ? Math.round((base - ckDisc) / totalLon) : Math.round((base - ckDisc - Math.round(bl * rb.giaBonus)) / totalLon); nhanTry = totalLon; }
        else { nhanTry = totalLon + bl; hopTry = Math.round((base - ckDisc) / nhanTry); }
        var bd = (rb.giaBonus != null && rb.giaBonus > 0) ? Math.round(bl * rb.giaBonus) : 0;
        if (!bestBonus || hopTry < bestBonus.hopKM) bestBonus = { hopKM: hopTry, bl: (rb.giaBonus != null) ? 0 : bl, bu: bu, unit: rb.unit === 'thung' ? 'thùng' : p.donvi, nhan: nhanTry, bonusDisc: bd };
      }
    }
  }
  var hopKM, bonusLon = 0, bonusDisc = 0;
  if (bestBonus) { hopKM = bestBonus.hopKM; bonusLon = bestBonus.bl; bonusDisc = bestBonus.bonusDisc || 0; lines.unshift('Tặng ' + bestBonus.bu + ' ' + bestBonus.unit); }
  else { hopKM = totalLon ? Math.round((base - ckDisc) / totalLon) : p.giaNYLon; }
  return { disc: ckDisc + bonusDisc, bonus: bonusLon, nhan: totalLon + bonusLon, hopKM: hopKM, thungKM: hopKM * p.slThung, desc: lines.join(' + ') };
}

// ============================================================
// GIỎ HÀNG — auto-link với KH đã chọn
// ============================================================
function getItems() {
  var allMas = Object.entries(cart).filter(function(e) { return e[1].qT > 0 || e[1].qL > 0; }).map(function(e) { return e[0]; });
  var orderContext = { allMas: allMas, skuCount: allMas.length };
  return Object.entries(cart).filter(function(e) { return e[1].qT > 0 || e[1].qL > 0; }).map(function(e) {
    var ma = e[0], q = e[1];
    var p = spFind(ma); if (!p) return null;
    var totalLon = q.qT * p.slThung + q.qL; var gocTotal = p.giaNYLon * totalLon;
    var km = calcKM(p, q.qT, q.qL, orderContext);
    return { ma: p.ma, ten: p.ten, nhom: p.nhom, donvi: p.donvi, slThung: p.slThung, giaNYLon: p.giaNYLon, giaNYThung: p.giaNYThung, qT: q.qT, qL: q.qL, totalLon: totalLon, gocTotal: gocTotal, disc: km.disc, desc: km.desc, bonus: km.bonus, afterKM: gocTotal - km.disc, appliedPromos: km.appliedPromos };
  }).filter(Boolean);
}

function addCart(ma) {
  var p = spFind(ma); if (!p) return;
  var qT = parseInt(document.getElementById('qT_' + ma)?.value) || 0;
  var qL = parseInt(document.getElementById('qL_' + ma)?.value) || 0;
  if (qT < 0) qT = 0; if (qL < 0) qL = 0;
  if (!qT && !qL) return;
  cart[ma] = { qT: qT, qL: qL }; saveCart(); updateBadge();
  var card = document.getElementById('card_' + ma);
  if (card) card.className = 'sp-card inCart';
  var pv = document.getElementById('pv_' + ma);
  if (pv) {
    var km = calcKM(p, qT, qL);
    var after = p.giaNYLon * (qT * p.slThung + qL) - km.disc;
    pv.innerHTML = '<div class="pv-row"><span class="pv-l">✓ Đã thêm</span><span class="pv-v">' + fmt(after) + 'đ</span></div>';
    setTimeout(function() { if (pv) pv.style.display = 'none'; }, 1500);
  }
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
      html += '<div class="oi"><div class="oi-top"><div class="oi-name">' + it.ten + '</div><button class="oi-del" onclick="removeCart(\'' + it.ma + '\')">✕</button></div>';
      html += '<div class="oi-sub">' + it.ma + ' · ' + it.donvi + '</div>';
      html += '<div class="oi-qty">' + (it.qT > 0 ? it.qT + ' thùng' : '') + (it.qT > 0 && it.qL > 0 ? ' + ' : '') + (it.qL > 0 ? it.qL + ' lẻ' : '') + ' = ' + it.totalLon + ' ' + it.donvi + (it.bonus > 0 ? ' + tặng ' + it.bonus : '') + '</div>';
      if (it.desc) html += '<div class="oi-km">' + it.desc + '</div>';
      html += '<div class="oi-pr"><span class="oi-pl">Thành tiền</span><span class="oi-pv">' + fmt(it.afterKM) + 'đ</span></div></div>';
    });

    html += '<div class="ord-ft">';
    if (editingOrder) {
      html += '<div style="background:var(--oL);border:1.5px solid var(--o);border-radius:var(--Rs);padding:10px 12px;margin-bottom:12px">';
      html += '<div style="font-size:12px;font-weight:800;color:var(--o);margin-bottom:4px">✏️ Chế độ sửa đơn</div>';
      html += '<div style="font-size:11px;color:var(--n2);line-height:1.5">' + getEditOrderSummary(editingOrder) + '</div>';
      html += '<button onclick="cancelEditOrder()" style="margin-top:8px;height:34px;padding:0 12px;border:1.5px solid var(--o);border-radius:8px;background:#fff;color:var(--o);font-size:11px;font-weight:700;cursor:pointer">Huỷ sửa</button>';
      html += '</div>';
    }
    if (totSave > 0) {
      html += '<div class="ft-row"><span class="ft-l">Giá gốc</span><span class="ft-v">' + fmt(totGoc) + 'đ</span></div>';
      html += '<div class="ft-row"><span class="ft-l">Tiết kiệm KM</span><span class="ft-save">-' + fmt(totSave) + 'đ</span></div>';
    }
    if (orderKM.disc > 0) html += '<div class="ft-row"><span class="ft-l">CK đơn hàng</span><span class="ft-save">-' + fmt(orderKM.disc) + 'đ</span></div>';
    if (orderKM.bonusItems && orderKM.bonusItems.length) {
      orderKM.bonusItems.forEach(function(bi) { html += '<div class="ft-row"><span class="ft-l" style="color:var(--vm)">🎁 ' + bi.progName + '</span><span style="color:var(--vm);font-weight:700">+' + bi.qty + ' ' + bi.name + '</span></div>'; });
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
      html += '<div style="font-size:13px;font-weight:800;color:var(--vm)">👤 ' + (selKH.ten || selKH.ma) + '</div>';
      html += '<div style="font-size:10.5px;color:var(--n2)">' + selKH.ma + (selKH.tuyen ? ' · ' + selKH.tuyen : '') + '</div>';
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
    html += '<div style="padding:16px 12px 8px"><div style="font-size:15px;font-weight:800;color:var(--n1)">📋 Lịch sử đơn hàng</div>';
    html += '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">';
    if (cloudReady) {
      html += '<button onclick="syncPullOrdersOnly()" style="height:34px;padding:0 12px;border:1.5px solid var(--b);border-radius:8px;background:#fff;color:var(--b);font-size:11px;font-weight:700;cursor:pointer">⬇️ Tải đơn cloud</button>';
      html += '<button onclick="syncPushOrdersOnly()" style="height:34px;padding:0 12px;border:1.5px solid var(--vm);border-radius:8px;background:#fff;color:var(--vm);font-size:11px;font-weight:700;cursor:pointer">⬆️ Lưu đơn cloud</button>';
    } else {
      html += '<button onclick="syncOpenSettings()" style="height:34px;padding:0 12px;border:1.5px solid var(--o);border-radius:8px;background:#fff;color:var(--o);font-size:11px;font-weight:700;cursor:pointer">☁️ Cài cloud GitHub</button>';
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
    html += '<div class="history-card-meta">' + ngay + ' · ' + itemCount + ' SP · ' + khName + '</div>';
    html += '</div>';

    html += '<div class="history-item-list">';
    (o.items || []).slice(0, 3).forEach(function(it) {
      html += '<div class="history-item-row"><span>' + it.ten + '</span><span style="font-weight:600">' + it.totalLon + ' ' + it.donvi + '</span></div>';
    });
    if (itemCount > 3) html += '<div class="history-more">... +' + (itemCount - 3) + ' SP khác</div>';
    html += '</div>';

    html += '<div class="history-card-actions">';
    html += '<button type="button" data-order-id="' + orderIdAttr + '" data-order-action="copy" onclick="handleOrderActionClick(this)" class="history-card-btn copy">📋 Copy</button>';
    html += '<button type="button" data-order-id="' + orderIdAttr + '" data-order-action="edit" onclick="handleOrderActionClick(this)" class="history-card-btn edit">✏️ Sửa đơn</button>';
    html += '<button type="button" data-order-id="' + orderIdAttr + '" data-order-action="detail" onclick="handleOrderActionClick(this)" class="history-card-btn view">📄 Chi tiết</button>';
    html += '<button type="button" data-order-id="' + orderIdAttr + '" data-order-action="delete" onclick="handleOrderActionClick(this)" class="history-card-btn delete">🗑</button>';
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
      lines.push('🎁 ' + bi.progName + ': +' + bi.qty + ' ' + bi.name);
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
  html += '<div style="font-size:14px;font-weight:800;color:var(--vm)">' + (o.khTen || o.khMa || 'Không rõ KH') + '</div></div>';
  html += '<div style="font-size:20px;font-weight:900;color:var(--vm)">' + fmt(o.tong) + 'đ</div>';
  html += '</div></div>';

  (o.items || []).forEach(function(it, i) {
    html += '<div style="padding:8px 0;border-bottom:1px solid var(--n5)">';
    html += '<div style="display:flex;justify-content:space-between"><div style="font-size:13px;font-weight:700">' + (i+1) + '. ' + it.ten + '</div><div style="font-size:13px;font-weight:800;color:var(--vm)">' + fmt(it.afterKM) + 'đ</div></div>';
    html += '<div style="font-size:11px;color:var(--n3)">' + it.ma + ' · ' + it.totalLon + ' ' + it.donvi + (it.bonus > 0 ? ' + tặng ' + it.bonus : '') + '</div>';
    if (it.desc) html += '<div style="font-size:11px;color:var(--vm);font-weight:600">' + it.desc + '</div>';
    html += '</div>';
  });

  html += '<div style="margin-top:12px;padding-top:12px;border-top:2px solid var(--n5)">';
  html += '<div style="display:flex;justify-content:space-between;font-size:14px;font-weight:800"><span>Tổng cộng</span><span style="color:var(--vm)">' + fmt(o.tong) + 'đ</span></div>';
  html += '<div style="display:flex;justify-content:space-between;font-size:12px;color:var(--b);margin-top:4px"><span>+VAT 1.5%</span><span>' + fmt(Math.round(o.tong * 1.015)) + 'đ</span></div>';
  html += '</div>';

  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:16px">';
  html += '<button type="button" data-order-id="' + orderIdAttr + '" data-order-action="edit" onclick="handleOrderActionClick(this)" style="height:46px;border:1.5px solid var(--o);border-radius:var(--R);background:#fff;color:var(--o);font-size:14px;font-weight:800;cursor:pointer">✏️ Sửa đơn</button>';
  html += '<button type="button" data-order-id="' + orderIdAttr + '" data-order-action="copy" onclick="handleOrderActionClick(this)" style="height:46px;background:linear-gradient(135deg,var(--vm),var(--vm2));color:#fff;border:none;border-radius:var(--R);font-size:14px;font-weight:800;cursor:pointer">📋 Copy gửi Zalo</button>';
  html += '</div>';
  html += '<button type="button" data-order-id="' + orderIdAttr + '" data-order-action="delete" onclick="handleOrderActionClick(this)" style="width:100%;height:42px;border:1.5px solid var(--r);border-radius:var(--R);background:#fff;color:var(--r);font-size:13px;font-weight:700;cursor:pointer;margin-top:8px">🗑 Xóa đơn này</button>';

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

window.cart = cart; window.customers = customers;
window.saveCart = saveCart; window.fmt = fmt;
window.calcKM = calcKM; window.calcOrderKM = calcOrderKM;
window.getItems = getItems; window.addCart = addCart;
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
