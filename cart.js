// Giỏ hàng và khách hàng (legacy - giữ tương thích)
var cart = JSON.parse(localStorage.getItem('vnm_cart') || '{}');
var customers = JSON.parse(localStorage.getItem('vnm_kh') || '[]');

function saveCart() { localStorage.setItem('vnm_cart', JSON.stringify(cart)); }
function fmt(n) { return Math.round(n).toLocaleString('vi-VN'); }

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

function clearCart() { cart = {}; saveCart(); updateBadge(); if (window.renderOrder) window.renderOrder(); renderDon(); }
function updateBadge() { var n = getItems().length; var b = document.getElementById('don-badge'); if (b) { b.style.display = n ? '' : 'none'; b.textContent = n; } }

// ============================================================
// TAB ĐƠN HÀNG
// ============================================================
function renderDon() {
  var items = getItems();
  var el = document.getElementById('don-content'); if (!el) return;
  if (!items.length) { el.innerHTML = '<div class="empty">Chưa có sản phẩm<br><small>Vào Đặt hàng để thêm</small></div>'; return; }
  var totGoc = items.reduce(function(s, x) { return s + x.gocTotal; }, 0);
  var totAfter = items.reduce(function(s, x) { return s + x.afterKM; }, 0);
  var orderKM = calcOrderKM(items);
  var totAfterOrder = totAfter - orderKM.disc;
  var totSave = totGoc - totAfterOrder;

  // Fix: read _selectedCustomerMa from window
  var selMa = window._selectedCustomerMa || '';
  var cusList = (typeof CUS !== 'undefined' && Array.isArray(CUS)) ? CUS : [];
  var selKH = selMa ? cusList.find(function(k) { return k.ma === selMa; }) : null;

  var html = '<div class="ord-wrap"><div class="ord-hd"><span class="ord-hdT">Đơn · ' + items.length + ' SP</span><span class="ord-hdV">' + fmt(totAfterOrder) + 'đ</span></div>';

  items.forEach(function(it) {
    html += '<div class="oi"><div class="oi-top"><div class="oi-name">' + it.ten + '</div><button class="oi-del" onclick="removeCart(\'' + it.ma + '\')">✕</button></div>';
    html += '<div class="oi-sub">' + it.ma + ' · ' + it.donvi + '</div>';
    html += '<div class="oi-qty">' + (it.qT > 0 ? it.qT + ' thùng' : '') + (it.qT > 0 && it.qL > 0 ? ' + ' : '') + (it.qL > 0 ? it.qL + ' lẻ' : '') + ' = ' + it.totalLon + ' ' + it.donvi + (it.bonus > 0 ? ' + tặng ' + it.bonus : '') + '</div>';
    if (it.desc) html += '<div class="oi-km">' + it.desc + '</div>';
    html += '<div class="oi-pr"><span class="oi-pl">Thành tiền</span><span class="oi-pv">' + fmt(it.afterKM) + 'đ</span></div></div>';
  });

  html += '<div class="ord-ft">';
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

  html += '<button class="btn-submit" onclick="submitOrder()">📤 Tạo đơn hàng</button>';
  html += '<button class="btn-clear" onclick="clearCart()">🗑 Xoá tất cả</button>';
  html += '</div></div>';
  el.innerHTML = html;
}

function submitOrder() {
  var items = getItems(); if (!items.length) return;
  var makh = (window._selectedCustomerMa) ? window._selectedCustomerMa : ((document.getElementById('makh-inp') || {}).value || '').trim().toUpperCase();
  var orderKM = calcOrderKM(items);
  var tong = items.reduce(function(s, x) { return s + x.afterKM; }, 0) - orderKM.disc;

  if (makh) {
    var kh = customers.find(function(k) { return k.ma === makh; });
    if (!kh) { kh = { ma: makh, orders: [] }; customers.push(kh); }
    kh.orders.unshift({ id: Date.now(), ngay: new Date().toLocaleDateString('vi-VN'), items: items, tong: tong, orderDisc: orderKM.disc, bonusItems: orderKM.bonusItems });
    if (kh.orders.length > 30) kh.orders = kh.orders.slice(0, 30);
    localStorage.setItem('vnm_kh', JSON.stringify(customers));
  }

  alert('✅ Đã tạo đơn ' + fmt(tong) + 'đ' + (makh ? ' cho ' + makh : ''));
  clearCart();
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
