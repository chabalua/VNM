// Giỏ hàng và khách hàng (legacy - giữ tương thích)
let cart = JSON.parse(localStorage.getItem('vnm_cart') || '{}');
let customers = JSON.parse(localStorage.getItem('vnm_kh') || '[]');

function saveCart() { localStorage.setItem('vnm_cart', JSON.stringify(cart)); }
function fmt(n) { return Math.round(n).toLocaleString('vi-VN'); }

// ============================================================
// KM ENGINE v2 (giữ nguyên từ bản trước)
// ============================================================
function kmBuildRules(prog) {
  const rules = [];
  if (prog.type === 'bonus') {
    const r = { type: 'bonus', unit: prog.bUnit || 'lon', X: +prog.bX || 12, Y: +prog.bY || 1 };
    if (prog.bMa && prog.bMa !== 'same') { const bp = spFind(prog.bMa); if (bp) r.giaBonus = bp.giaNYLon; }
    if (+prog.bMax === 1) r.maxSets = 1;
    rules.push(r);
  } else if (prog.type === 'fixed') {
    rules.push({ type: 'fixed', ck: +prog.ck / 100 });
  } else if (prog.type === 'tier_qty') {
    const tiers = (prog.tiers || []).filter(t => +t.mn > 0 && +t.ck > 0).map(t => ({ minT: +t.mn, ck: +t.ck / 100 }));
    if (tiers.length) rules.push({ type: 'tier_qty', unit: prog.tUnit || 'lon', tiers });
  } else if (prog.type === 'tier_money') {
    const tiers = (prog.tiers || []).map(t => {
      const ckPerc = +t.ck; if (!ckPerc || ckPerc <= 0) return null;
      let type = t.type || (t.mx != null ? 'below' : 'above');
      let value = 0;
      if (t.value != null && t.value !== '') { value = +t.value; if (!isNaN(value) && value > 0 && value < 10000) value = value * 1000; }
      else if (t.mx != null && t.mx !== '') { value = +t.mx; }
      else if (t.mn != null && t.mn !== '') { value = +t.mn * 1000; }
      if (isNaN(value) || value < 0) value = 0;
      return { type, value, ckPct: ckPerc };
    }).filter(t => t && t.ckPct > 0);
    if (tiers.length) rules.push({ type: 'tier_money', tiers });
  } else if (prog.type === 'order_money' || prog.type === 'order_bonus') { return []; }
  return rules;
}

function calcKM(p, qT, qL, orderContext) {
  const applicable = kmProgs.filter(prog => {
    if (!prog.active) return false;
    if (!(prog.spMas || []).includes(p.ma)) return false;
    if (prog.minSKU && orderContext) {
      const matchedSKUs = (orderContext.allMas || []).filter(ma => prog.spMas.includes(ma));
      if (matchedSKUs.length < +prog.minSKU) return false;
    }
    return true;
  });
  const baseKM = _calcKM_orig(p, qT, qL);
  if (!applicable.length) return { ...baseKM, appliedPromos: [] };

  const stackable = applicable.filter(prog => prog.stackable);
  const nonStackable = applicable.filter(prog => !prog.stackable);
  let allRules = [], appliedProgs = [];
  stackable.forEach(prog => { allRules.push(...kmBuildRules(prog)); });

  let bestNonStack = null, bestHop = p.giaNYLon;
  nonStackable.forEach(prog => {
    const testRules = kmBuildRules(prog);
    const testKM = _calcKM_orig({ ...p, kmRules: testRules }, qT, qL);
    if (testKM.hopKM < bestHop) { bestHop = testKM.hopKM; bestNonStack = { prog, rules: testRules }; }
  });
  if (bestNonStack) allRules.push(...bestNonStack.rules);

  const kmFinal = _calcKM_orig({ ...p, kmRules: allRules }, qT, qL);
  if (kmFinal.disc > 0 || kmFinal.bonus > 0) {
    appliedProgs = stackable.filter(prog => { const t = _calcKM_orig({ ...p, kmRules: kmBuildRules(prog) }, qT, qL); return t.disc > 0 || t.bonus > 0; }).map(prog => prog.name || 'CT KM');
    if (bestNonStack) appliedProgs.push(bestNonStack.prog.name || 'CT KM');
  }
  return { ...kmFinal, appliedPromos: appliedProgs };
}

function parsePromoMoneyValue(value) { const num = +value; if (isNaN(num) || num <= 0) return 0; return num < 10000 ? num * 1000 : num; }

function orderPromoDiscount(baseTotal, prog) {
  const tiers = (prog.tiers || []).map(t => {
    const type = t.type || 'above'; const value = parsePromoMoneyValue(t.value != null ? t.value : (t.mn != null ? t.mn : 0)); const ck = +t.ck / 100;
    if (!value || !ck) return null; return { type, value, ck };
  }).filter(t => t && t.ck > 0);
  if (!tiers.length) return 0;
  let disc = 0;
  tiers.forEach(t => { if (t.type === 'below' && baseTotal < t.value) disc = Math.max(disc, Math.round(baseTotal * t.ck)); if (t.type === 'above' && baseTotal >= t.value) disc = Math.max(disc, Math.round(baseTotal * t.ck)); });
  return disc;
}

function calcOrderKM(items) {
  if (!items || !items.length) return { disc: 0, desc: '', bonusItems: [] };
  const baseTotal = items.reduce((sum, item) => sum + item.gocTotal, 0);
  const allMas = items.map(it => it.ma);
  const orderPromos = kmProgs.filter(prog => prog.active && (prog.type === 'order_money' || prog.type === 'order_bonus'));
  if (!orderPromos.length) return { disc: 0, desc: '', bonusItems: [] };
  let disc = 0; const descParts = []; const bonusItems = [];
  const moneyPromos = orderPromos.filter(p => p.type === 'order_money');
  moneyPromos.filter(p => p.stackable).forEach(prog => {
    let total = baseTotal; if (prog.spMas && prog.spMas.length) total = items.filter(it => prog.spMas.includes(it.ma)).reduce((s, it) => s + it.gocTotal, 0);
    const d = orderPromoDiscount(total, prog); if (d > 0) { disc += d; descParts.push(prog.name || 'CK đơn'); }
  });
  let bestDisc = 0, bestProg = null;
  moneyPromos.filter(p => !p.stackable).forEach(prog => {
    let total = baseTotal; if (prog.spMas && prog.spMas.length) total = items.filter(it => prog.spMas.includes(it.ma)).reduce((s, it) => s + it.gocTotal, 0);
    const d = orderPromoDiscount(total, prog); if (d > bestDisc) { bestDisc = d; bestProg = prog; }
  });
  if (bestDisc > 0 && bestProg) { disc += bestDisc; descParts.push(bestProg.name || 'CK đơn'); }
  orderPromos.filter(p => p.type === 'order_bonus').forEach(prog => {
    let total = baseTotal; const progMas = prog.spMas || [];
    if (progMas.length) total = items.filter(it => progMas.includes(it.ma)).reduce((s, it) => s + it.gocTotal, 0);
    if (prog.minSKU) { const unique = [...new Set(allMas.filter(ma => progMas.includes(ma)))]; if (unique.length < +prog.minSKU) return; }
    const tiers = (prog.tiers || []).map(t => ({ minAmount: parsePromoMoneyValue(t.value || t.mn || 0), bonusQty: +t.bonusQty || +prog.bonusQty || 0, repeat: t.repeat !== false })).filter(t => t.minAmount > 0 && t.bonusQty > 0).sort((a, b) => b.minAmount - a.minAmount);
    if (!tiers.length) return;
    const best = tiers.find(t => total >= t.minAmount); if (!best) return;
    let sets = 1; if (best.repeat && best.minAmount > 0) { sets = Math.floor(total / best.minAmount); if (prog.maxSets) sets = Math.min(sets, +prog.maxSets); }
    const totalBonus = sets * best.bonusQty;
    if (totalBonus > 0) { const bName = prog.bonusName || (prog.bonusMa ? (spFind(prog.bonusMa) || {}).ten || prog.bonusMa : 'SP tặng'); bonusItems.push({ ma: prog.bonusMa, name: bName, qty: totalBonus, progName: prog.name || 'CT Ontop' }); descParts.push(prog.name + ': +' + totalBonus + ' ' + bName); }
  });
  return { disc, desc: descParts.join(' | '), bonusItems };
}

function _calcKM_orig(p, qT, qL) {
  const totalLon = qT * p.slThung + qL; const base = p.giaNYLon * totalLon;
  if (!totalLon) return { disc: 0, bonus: 0, nhan: 0, hopKM: p.giaNYLon, thungKM: p.giaNYThung, desc: '' };
  let ckDisc = 0, lines = [];
  for (const r of p.kmRules) {
    if (r.type === 'tier_money') {
      let applicableTier = null;
      const belowTiers = r.tiers.filter(t => t.type === 'below' && base < t.value);
      if (belowTiers.length) applicableTier = belowTiers.reduce((prev, curr) => !prev || curr.value < prev.value ? curr : prev);
      const aboveTiers = r.tiers.filter(t => t.type === 'above' && base >= t.value);
      if (aboveTiers.length) applicableTier = aboveTiers.reduce((prev, curr) => !prev || curr.value > prev.value ? curr : prev);
      if (applicableTier && applicableTier.ckPct > 0) { ckDisc += Math.round(base * applicableTier.ckPct / 100); lines.push('CK ' + applicableTier.ckPct + '%'); }
    } else if (r.type === 'tier_qty') {
      const cq = r.unit === 'thung' ? qT : totalLon;
      const t = [...r.tiers].sort((a, b) => b.minT - a.minT).find(x => cq >= x.minT);
      if (t) { ckDisc += Math.round(base * t.ck); lines.push('CK ' + Math.round(t.ck * 100) + '%'); }
    } else if (r.type === 'fixed') { ckDisc += Math.round(base * r.ck); lines.push('CK ' + Math.round(r.ck * 100) + '%'); }
  }
  let bestBonus = null;
  for (const r of p.kmRules) {
    if (r.type === 'bonus') {
      const cq = r.unit === 'thung' ? qT : totalLon;
      const sets = r.maxSets ? Math.min(Math.floor(cq / r.X), r.maxSets) : Math.floor(cq / r.X);
      if (sets > 0) {
        const bu = sets * r.Y; const bl = r.unit === 'thung' ? bu * p.slThung : bu;
        let hopTry, nhanTry;
        if (r.giaBonus != null) { hopTry = r.giaBonus === 0 ? Math.round((base - ckDisc) / totalLon) : Math.round((base - ckDisc - Math.round(bl * r.giaBonus)) / totalLon); nhanTry = totalLon; }
        else { nhanTry = totalLon + bl; hopTry = Math.round((base - ckDisc) / nhanTry); }
        const bd = (r.giaBonus != null && r.giaBonus > 0) ? Math.round(bl * r.giaBonus) : 0;
        if (!bestBonus || hopTry < bestBonus.hopKM) bestBonus = { hopKM: hopTry, bl: (r.giaBonus != null) ? 0 : bl, bu, unit: r.unit === 'thung' ? 'thùng' : p.donvi, nhan: nhanTry, bonusDisc: bd };
      }
    }
  }
  let hopKM, bonusLon = 0, bonusDisc = 0;
  if (bestBonus) { hopKM = bestBonus.hopKM; bonusLon = bestBonus.bl; bonusDisc = bestBonus.bonusDisc || 0; lines.unshift('Tặng ' + bestBonus.bu + ' ' + bestBonus.unit); }
  else { hopKM = totalLon ? Math.round((base - ckDisc) / totalLon) : p.giaNYLon; }
  return { disc: ckDisc + bonusDisc, bonus: bonusLon, nhan: totalLon + bonusLon, hopKM, thungKM: hopKM * p.slThung, desc: lines.join(' + ') };
}

// ============================================================
// GIỎ HÀNG — auto-link với KH đã chọn
// ============================================================
function getItems() {
  const allMas = Object.entries(cart).filter(([, q]) => q.qT > 0 || q.qL > 0).map(([ma]) => ma);
  const orderContext = { allMas, skuCount: allMas.length };
  return Object.entries(cart).filter(([, q]) => q.qT > 0 || q.qL > 0).map(([ma, q]) => {
    const p = spFind(ma); if (!p) return null;
    const totalLon = q.qT * p.slThung + q.qL; const gocTotal = p.giaNYLon * totalLon;
    const km = calcKM(p, q.qT, q.qL, orderContext);
    return { ...p, qT: q.qT, qL: q.qL, totalLon, gocTotal, disc: km.disc, desc: km.desc, bonus: km.bonus, afterKM: gocTotal - km.disc, appliedPromos: km.appliedPromos };
  }).filter(Boolean);
}

function addCart(ma) {
  const p = spFind(ma); if (!p) return;
  let qT = parseInt(document.getElementById('qT_' + ma)?.value) || 0;
  let qL = parseInt(document.getElementById('qL_' + ma)?.value) || 0;
  if (qT < 0) qT = 0; if (qL < 0) qL = 0;
  if (!qT && !qL) return;
  cart[ma] = { qT, qL }; saveCart(); updateBadge();
  const card = document.getElementById('card_' + ma);
  if (card) card.className = 'sp-card inCart';
  const pv = document.getElementById('pv_' + ma);
  if (pv) {
    const km = calcKM(p, qT, qL);
    const after = p.giaNYLon * (qT * p.slThung + qL) - km.disc;
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
function updateBadge() { const n = getItems().length; const b = document.getElementById('don-badge'); if (b) { b.style.display = n ? '' : 'none'; b.textContent = n; } }

// ============================================================
// TAB ĐƠN HÀNG — auto-fill KH từ selector
// ============================================================
function renderDon() {
  const items = getItems();
  const el = document.getElementById('don-content'); if (!el) return;
  if (!items.length) { el.innerHTML = '<div class="empty">Chưa có sản phẩm<br><small>Vào Đặt hàng để thêm</small></div>'; return; }
  const totGoc = items.reduce(function(s, x) { return s + x.gocTotal; }, 0);
  const totAfter = items.reduce(function(s, x) { return s + x.afterKM; }, 0);
  const orderKM = calcOrderKM(items);
  const totAfterOrder = totAfter - orderKM.disc;
  const totSave = totGoc - totAfterOrder;

  // Auto-detect selected customer
  var selMa = (typeof _selectedCustomerMa !== 'undefined') ? _selectedCustomerMa : '';
  var selKH = selMa ? ((typeof CUS !== 'undefined' ? CUS : []).find(function(k) { return k.ma === selMa; })) : null;

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
    orderKM.bonusItems.forEach(function(bi) { html += '<div class="ft-row"><span class="ft-l" style="color:var(--g)">🎁 ' + bi.progName + '</span><span style="color:var(--g);font-weight:700">+' + bi.qty + ' ' + bi.name + '</span></div>'; });
  }

  html += '<div class="ft-grand"><div class="ft-gr"><span class="ft-gl">Tổng cộng</span><span class="ft-gv">' + fmt(totAfterOrder) + 'đ</span></div>';
  html += '<div class="ft-gr"><span class="ft-vl">+VAT 1.5%</span><span class="ft-vv">' + fmt(Math.round(totAfterOrder * 1.015)) + 'đ</span></div></div>';

  // KH — auto từ selector hoặc nhập tay
  html += '<div style="margin:10px 0 8px">';
  if (selKH) {
    html += '<div style="background:var(--gL);border:1.5px solid var(--g);border-radius:var(--R);padding:10px 12px">';
    html += '<div style="font-size:12px;font-weight:800;color:var(--g)">👤 ' + (selKH.ten || selKH.ma) + '</div>';
    html += '<div style="font-size:10px;color:var(--t2)">' + selKH.ma + (selKH.tuyen ? ' · ' + selKH.tuyen : '') + '</div>';
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
  const items = getItems(); if (!items.length) return;
  // Lấy mã KH: ưu tiên từ selector, nếu không thì từ input
  var makh = (typeof _selectedCustomerMa !== 'undefined' && _selectedCustomerMa) ? _selectedCustomerMa : ((document.getElementById('makh-inp') || {}).value || '').trim().toUpperCase();
  const orderKM = calcOrderKM(items);
  const tong = items.reduce(function(s, x) { return s + x.afterKM; }, 0) - orderKM.disc;

  // Lưu vào legacy customers (tương thích)
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

// Legacy KH functions (giữ tương thích với tab cũ)
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
