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
// TAB ĐƠN HÀNG — Giỏ hiện tại + Lịch sử đơn + Copy Zalo
// ============================================================
function renderDon() {
  var items = getItems();
  var el = document.getElementById('don-content'); if (!el) return;

  var html = '';

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

    html += '<button class="btn-submit" onclick="submitOrder()">📤 Tạo đơn hàng</button>';
    html += '<button class="btn-clear" onclick="clearCart()">🗑 Xoá giỏ</button>';
    html += '</div></div>';
  }

  // ─── PHẦN 2: Lịch sử đơn hàng ───
  var orders = getOrders();
  if (orders.length || !items.length) {
    html += '<div style="padding:16px 12px 8px"><div style="font-size:15px;font-weight:800;color:var(--n1)">📋 Lịch sử đơn hàng</div>';
    if (!orders.length) {
      html += '<div style="font-size:13px;color:var(--n3);margin-top:8px">Chưa có đơn nào' + (items.length ? '' : '<br><small>Vào Đặt hàng để thêm SP</small>') + '</div>';
    }
    html += '</div>';

    // Filter buttons
    if (orders.length) {
      html += '<div style="display:flex;gap:6px;padding:0 12px 8px;flex-wrap:wrap">';
      html += '<button onclick="filterOrders(\'today\')" class="pill on-all" style="font-size:11px">Hôm nay</button>';
      html += '<button onclick="filterOrders(\'week\')" class="pill" style="font-size:11px">Tuần này</button>';
      html += '<button onclick="filterOrders(\'month\')" class="pill" style="font-size:11px">Tháng này</button>';
      html += '<button onclick="filterOrders(\'all\')" class="pill" style="font-size:11px">Tất cả</button>';
      html += '</div>';
    }

    html += '<div id="orders-history">';
    html += renderOrdersList(orders, 'today');
    html += '</div>';
  }

  el.innerHTML = html;
}

function filterOrders(period) {
  var el = document.getElementById('orders-history'); if (!el) return;
  var orders = getOrders();
  el.innerHTML = renderOrdersList(orders, period);
  // Update active pill
  var buttons = el.parentElement.querySelectorAll('.pill');
  var labels = { today: 'Hôm nay', week: 'Tuần này', month: 'Tháng này', all: 'Tất cả' };
  buttons.forEach(function(b) {
    b.className = 'pill' + (b.textContent.trim() === labels[period] ? ' on-all' : '');
  });
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
    var khName = o.khTen || o.khMa || 'Không rõ KH';
    var itemCount = (o.items || []).length;
    var ngay = o.date ? new Date(o.date).toLocaleString('vi-VN', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' }) : o.ngay || '';

    html += '<div style="background:var(--card);margin:6px 12px;border-radius:var(--R);box-shadow:var(--shadow);overflow:hidden">';
    html += '<div style="padding:12px 14px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--n5)">';
    html += '<div><div style="font-size:14px;font-weight:800;color:var(--vm)">' + fmt(o.tong) + 'đ</div>';
    html += '<div style="font-size:11px;color:var(--n3)">' + ngay + ' · ' + itemCount + ' SP · ' + khName + '</div></div>';
    html += '<div style="display:flex;gap:6px">';
    html += '<button onclick="copyOrderZalo(' + i + ')" style="height:32px;padding:0 10px;border:1.5px solid var(--vm);background:var(--vmL);border-radius:8px;font-size:11px;font-weight:700;color:var(--vm);cursor:pointer">📋 Copy</button>';
    html += '<button onclick="viewOrderDetail(' + i + ')" style="height:32px;padding:0 10px;border:1.5px solid var(--n5);background:#fff;border-radius:8px;font-size:11px;font-weight:700;color:var(--n2);cursor:pointer">Chi tiết</button>';
    html += '<button onclick="deleteOrder(' + i + ')" style="height:32px;width:32px;border:1px solid var(--n5);background:#fff;border-radius:8px;font-size:12px;color:var(--n3);cursor:pointer;display:flex;align-items:center;justify-content:center">✕</button>';
    html += '</div></div>';

    // Mini item list
    html += '<div style="padding:8px 14px;font-size:11px;color:var(--n2)">';
    (o.items || []).slice(0, 3).forEach(function(it) {
      html += '<div style="display:flex;justify-content:space-between;margin-bottom:2px"><span>' + it.ten.slice(0, 30) + '</span><span style="font-weight:600">' + it.totalLon + ' ' + it.donvi + '</span></div>';
    });
    if (itemCount > 3) html += '<div style="color:var(--n3)">... +' + (itemCount - 3) + ' SP khác</div>';
    html += '</div></div>';
  });
  return html;
}

// ============================================================
// TẠO ĐƠN — Lưu vào orders + xóa giỏ
// ============================================================
function submitOrder() {
  var items = getItems(); if (!items.length) return;
  var makh = (window._selectedCustomerMa) ? window._selectedCustomerMa : ((document.getElementById('makh-inp') || {}).value || '').trim().toUpperCase();
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
    id: Date.now(),
    date: new Date().toISOString(),
    ngay: new Date().toLocaleDateString('vi-VN'),
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

  // Lưu vào orders history
  var orders = getOrders();
  orders.unshift(order);
  if (orders.length > 200) orders = orders.slice(0, 200);
  saveOrders(orders);

  // Legacy KH orders (tương thích)
  if (makh) {
    var khLegacy = customers.find(function(k) { return k.ma === makh; });
    if (!khLegacy) { khLegacy = { ma: makh, orders: [] }; customers.push(khLegacy); }
    khLegacy.orders.unshift(order);
    if (khLegacy.orders.length > 30) khLegacy.orders = khLegacy.orders.slice(0, 30);
    localStorage.setItem('vnm_kh', JSON.stringify(customers));
  }

  // Hỏi copy Zalo không
  var copyNow = confirm('✅ Đã tạo đơn ' + fmt(tong) + 'đ' + (khTen ? ' cho ' + khTen : '') + '\n\nCopy đơn để gửi Zalo?');
  if (copyNow) copyOrderZalo(0); // copy đơn vừa tạo (index 0 = mới nhất)

  clearCart();
}

// ============================================================
// COPY ĐƠN → ZALO (format text đẹp)
// ============================================================
function copyOrderZalo(idx) {
  var orders = getOrders();
  var o = orders[idx]; if (!o) return;

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
      alert('✅ Đã copy đơn!\nDán vào Zalo để gửi.');
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
    alert('✅ Đã copy đơn!\nDán vào Zalo để gửi.');
  } catch(e) {
    alert('Không copy được tự động. Đây là nội dung:\n\n' + text);
  }
  document.body.removeChild(ta);
}

// ============================================================
// XEM CHI TIẾT / XÓA ĐƠN
// ============================================================
function viewOrderDetail(idx) {
  var orders = getOrders();
  var o = orders[idx]; if (!o) return;

  var modal = document.getElementById('km-modal');
  document.getElementById('km-modal-t').textContent = '📋 Chi tiết đơn #' + (orders.length - idx);
  modal.style.display = 'block';

  var body = document.getElementById('km-modal-body');
  var html = '';

  html += '<div style="background:var(--vmL);border-radius:var(--Rs);padding:12px 14px;margin-bottom:12px;border:1px solid #B8E0CB">';
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

  html += '<button onclick="copyOrderZalo(' + idx + ')" style="width:100%;height:48px;background:linear-gradient(135deg,var(--vm),#008A50);color:#fff;border:none;border-radius:var(--R);font-size:15px;font-weight:800;cursor:pointer;margin-top:16px">📋 Copy gửi Zalo</button>';

  body.innerHTML = html;
}

function deleteOrder(idx) {
  var orders = getOrders();
  if (!orders[idx]) return;
  if (!confirm('Xóa đơn này?')) return;
  orders.splice(idx, 1);
  saveOrders(orders);
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
window.viewOrderDetail = viewOrderDetail;
window.deleteOrder = deleteOrder;
window.filterOrders = filterOrders;
