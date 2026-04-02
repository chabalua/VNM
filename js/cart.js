// Giỏ hàng và khách hàng
let cart = JSON.parse(localStorage.getItem('vnm_cart') || '{}');
let customers = JSON.parse(localStorage.getItem('vnm_kh') || '[]');

function saveCart() { localStorage.setItem('vnm_cart', JSON.stringify(cart)); }
function fmt(n) { return Math.round(n).toLocaleString('vi-VN'); }

// ============================================================
// KM ENGINE v2 — Tháng 4/2026
// Hỗ trợ: bonus, fixed, tier_qty, tier_money, order_money, order_bonus
// Mới: minSKU (điều kiện số SKU tối thiểu trong đơn/nhóm)
// Fix: tier_money không còn chia 100 hai lần
// ============================================================

function kmBuildRules(prog) {
  const rules = [];
  if (prog.type === 'bonus') {
    const r = { type: 'bonus', unit: prog.bUnit || 'lon', X: +prog.bX || 12, Y: +prog.bY || 1 };
    if (prog.bMa && prog.bMa !== 'same') {
      const bp = spFind(prog.bMa);
      if (bp) r.giaBonus = bp.giaNYLon;
    }
    if (+prog.bMax === 1) r.maxSets = 1;
    rules.push(r);
  } else if (prog.type === 'fixed') {
    rules.push({ type: 'fixed', ck: +prog.ck / 100 });
  } else if (prog.type === 'tier_qty') {
    const tiers = (prog.tiers || []).filter(t => +t.mn > 0 && +t.ck > 0).map(t => ({ minT: +t.mn, ck: +t.ck / 100 }));
    if (tiers.length) rules.push({ type: 'tier_qty', unit: prog.tUnit || 'lon', tiers });
  } else if (prog.type === 'tier_money') {
    const tiers = (prog.tiers || []).map(t => {
      const ckPerc = +t.ck;
      if (!ckPerc || ckPerc <= 0) return null;
      let type = t.type || (t.mx != null ? 'below' : 'above');
      let value = 0;
      if (t.value != null && t.value !== '') {
        value = +t.value;
        if (!isNaN(value) && value > 0) {
          if (value < 10000) value = value * 1000;
        } else value = 0;
      } else if (t.mx != null && t.mx !== '') {
        value = +t.mx;
      } else if (t.mn != null && t.mn !== '') {
        value = +t.mn * 1000;
      }
      if (isNaN(value) || value < 0) value = 0;
      // *** FIX: Lưu ck dưới dạng phần trăm nguyên (VD: 12 = 12%), KHÔNG chia 100 ở đây ***
      // Sẽ chia 100 duy nhất trong _calcKM_orig
      return { type, value, ckPct: ckPerc };
    }).filter(t => t && t.ckPct > 0);
    if (tiers.length) rules.push({ type: 'tier_money', tiers });
  } else if (prog.type === 'order_money' || prog.type === 'order_bonus') {
    // order-level: không tạo item-level rules
    return [];
  }
  return rules;
}

// Hàm tính KM chính
function calcKM(p, qT, qL, orderContext) {
  // orderContext: { skuCount, allMas } - dùng cho minSKU check
  const applicable = kmProgs.filter(prog => {
    if (!prog.active) return false;
    if (!(prog.spMas || []).includes(p.ma)) return false;
    // Check minSKU: prog yêu cầu tối thiểu N SKU khác nhau trong đơn
    if (prog.minSKU && orderContext) {
      const progMas = prog.spMas || [];
      const matchedSKUs = (orderContext.allMas || []).filter(ma => progMas.includes(ma));
      if (matchedSKUs.length < +prog.minSKU) return false;
    }
    return true;
  });

  const baseKM = _calcKM_orig(p, qT, qL);
  if (!applicable.length) {
    return { ...baseKM, appliedPromos: [] };
  }

  const stackable = applicable.filter(prog => prog.stackable);
  const nonStackable = applicable.filter(prog => !prog.stackable);
  let allRules = [];
  let appliedProgs = [];

  const stackableRules = stackable.map(prog => ({ prog, rules: kmBuildRules(prog) }));
  stackableRules.forEach(({ rules }) => { allRules.push(...rules); });

  // Tìm CT KM non-stackable tốt nhất
  let bestNonStack = null, bestHop = p.giaNYLon;
  nonStackable.forEach(prog => {
    const testRules = kmBuildRules(prog);
    const testKM = _calcKM_orig({ ...p, kmRules: testRules }, qT, qL);
    if (testKM.hopKM < bestHop) { bestHop = testKM.hopKM; bestNonStack = { prog, rules: testRules }; }
  });
  if (bestNonStack) { allRules.push(...bestNonStack.rules); }

  const pTest = { ...p, kmRules: allRules };
  const kmFinal = _calcKM_orig(pTest, qT, qL);

  if (kmFinal.disc > 0 || kmFinal.bonus > 0) {
    appliedProgs = stackableRules.filter(({ prog, rules }) => {
      const testKM = _calcKM_orig({ ...p, kmRules: rules }, qT, qL);
      return testKM.disc > 0 || testKM.bonus > 0;
    }).map(({ prog }) => prog.name || 'CT KM');
    if (bestNonStack) appliedProgs.push(bestNonStack.prog.name || 'CT KM');
  }

  return { ...kmFinal, appliedPromos: appliedProgs };
}

function parsePromoMoneyValue(value) {
  const num = +value;
  if (isNaN(num) || num <= 0) return 0;
  return num < 10000 ? num * 1000 : num;
}

function orderPromoDiscount(baseTotal, prog) {
  const tiers = (prog.tiers || []).map(t => {
    const type = t.type || 'above';
    const value = parsePromoMoneyValue(t.value != null ? t.value : (t.mn != null ? t.mn : 0));
    const ck = +t.ck / 100;
    if (!value || !ck) return null;
    return { type, value, ck };
  }).filter(t => t && t.ck > 0);
  if (!tiers.length) return 0;

  let disc = 0;
  tiers.forEach(t => {
    if (t.type === 'below' && baseTotal < t.value) disc = Math.max(disc, Math.round(baseTotal * t.ck));
    if (t.type === 'above' && baseTotal >= t.value) disc = Math.max(disc, Math.round(baseTotal * t.ck));
  });
  return disc;
}

// ============================================================
// ORDER-LEVEL KM (CK tiền + tặng SP)
// Hỗ trợ: order_money (CK %), order_bonus (tặng SP khi đạt mức tiền)
// ============================================================
function calcOrderKM(items) {
  if (!items || !items.length) return { disc: 0, desc: '', bonusItems: [] };
  const baseTotal = items.reduce((sum, item) => sum + item.gocTotal, 0);
  const allMas = items.map(it => it.ma);
  
  const orderPromos = kmProgs.filter(prog => prog.active && (prog.type === 'order_money' || prog.type === 'order_bonus'));
  if (!orderPromos.length) return { disc: 0, desc: '', bonusItems: [] };

  let disc = 0;
  const descParts = [];
  const bonusItems = []; // Mới: danh sách SP được tặng

  // Xử lý order_money (CK %)
  const moneyPromos = orderPromos.filter(p => p.type === 'order_money');
  const stackableMoney = moneyPromos.filter(p => p.stackable);
  const nonStackMoney = moneyPromos.filter(p => !p.stackable);

  stackableMoney.forEach(prog => {
    // Nếu prog có spMas, chỉ tính baseTotal từ các SP trong spMas
    let total = baseTotal;
    if (prog.spMas && prog.spMas.length) {
      total = items.filter(it => prog.spMas.includes(it.ma)).reduce((s, it) => s + it.gocTotal, 0);
    }
    const d = orderPromoDiscount(total, prog);
    if (d > 0) { disc += d; descParts.push(prog.name || 'CK đơn hàng'); }
  });

  let bestDisc = 0, bestProg = null;
  nonStackMoney.forEach(prog => {
    let total = baseTotal;
    if (prog.spMas && prog.spMas.length) {
      total = items.filter(it => prog.spMas.includes(it.ma)).reduce((s, it) => s + it.gocTotal, 0);
    }
    const d = orderPromoDiscount(total, prog);
    if (d > bestDisc) { bestDisc = d; bestProg = prog; }
  });
  if (bestDisc > 0 && bestProg) { disc += bestDisc; descParts.push(bestProg.name || 'CK đơn hàng'); }

  // Xử lý order_bonus (tặng SP khi đạt mức tiền đơn hàng)
  const bonusPromos = orderPromos.filter(p => p.type === 'order_bonus');
  bonusPromos.forEach(prog => {
    // Tính tổng tiền các SP thuộc nhóm CT này
    let total = baseTotal;
    const progMas = prog.spMas || [];
    if (progMas.length) {
      total = items.filter(it => progMas.includes(it.ma)).reduce((s, it) => s + it.gocTotal, 0);
    }

    // Check minSKU
    if (prog.minSKU) {
      const matchedSKUs = allMas.filter(ma => progMas.includes(ma));
      const uniqueSKUs = [...new Set(matchedSKUs)];
      if (uniqueSKUs.length < +prog.minSKU) return;
    }

    // Tìm mức phù hợp (mức cao nhất đạt được)
    const tiers = (prog.tiers || []).map(t => ({
      minAmount: parsePromoMoneyValue(t.value || t.mn || 0),
      bonusMa: t.bonusMa || prog.bonusMa || '',
      bonusQty: +t.bonusQty || +prog.bonusQty || 0,
      bonusName: t.bonusName || prog.bonusName || '',
      repeat: t.repeat !== false // mặc định cho phép lặp (mỗi X đồng tặng Y)
    })).filter(t => t.minAmount > 0 && t.bonusQty > 0)
      .sort((a, b) => b.minAmount - a.minAmount);

    if (!tiers.length) return;

    // Tìm tier tốt nhất
    const best = tiers.find(t => total >= t.minAmount);
    if (!best) return;

    // Tính số suất
    let sets = 1;
    if (best.repeat && best.minAmount > 0) {
      sets = Math.floor(total / best.minAmount);
      if (prog.maxSets) sets = Math.min(sets, +prog.maxSets);
    }

    const totalBonus = sets * best.bonusQty;
    if (totalBonus > 0) {
      const bName = best.bonusName || (best.bonusMa ? (spFind(best.bonusMa) || {}).ten || best.bonusMa : 'SP tặng');
      bonusItems.push({
        ma: best.bonusMa,
        name: bName,
        qty: totalBonus,
        progName: prog.name || 'CT Ontop'
      });
      descParts.push(prog.name + ': tặng ' + totalBonus + ' ' + bName);
    }
  });

  return { disc, desc: descParts.join(' | '), bonusItems };
}

// ============================================================
// Core KM calc (_calcKM_orig) — FIX tier_money
// ============================================================
function _calcKM_orig(p, qT, qL) {
  const totalLon = qT * p.slThung + qL;
  const base = p.giaNYLon * totalLon;
  if (!totalLon) return { disc: 0, bonus: 0, nhan: 0, hopKM: p.giaNYLon, thungKM: p.giaNYThung, desc: '' };

  let ckDisc = 0, lines = [];
  for (const r of p.kmRules) {
    if (r.type === 'tier_money') {
      let applicableTier = null;
      // 'below': tìm tier có value NHỎ NHẤT mà base < value
      const belowTiers = r.tiers.filter(t => t.type === 'below' && base < t.value);
      if (belowTiers.length) {
        applicableTier = belowTiers.reduce((prev, curr) => !prev || curr.value < prev.value ? curr : prev);
      }
      // 'above': tìm tier có value LỚN NHẤT mà base >= value
      const aboveTiers = r.tiers.filter(t => t.type === 'above' && base >= t.value);
      if (aboveTiers.length) {
        applicableTier = aboveTiers.reduce((prev, curr) => !prev || curr.value > prev.value ? curr : prev);
      }
      // *** FIX: ckPct là phần trăm nguyên (VD: 12 = 12%), chia 100 MỘT LẦN DUY NHẤT ở đây ***
      if (applicableTier && applicableTier.ckPct > 0) {
        ckDisc += Math.round(base * applicableTier.ckPct / 100);
        lines.push('CK ' + applicableTier.ckPct + '%');
      }
    } else if (r.type === 'tier_qty') {
      const cq = r.unit === 'thung' ? qT : totalLon;
      const t = [...r.tiers].sort((a, b) => b.minT - a.minT).find(x => cq >= x.minT);
      if (t) { ckDisc += Math.round(base * t.ck); lines.push('CK ' + Math.round(t.ck * 100) + '%'); }
    } else if (r.type === 'fixed') {
      ckDisc += Math.round(base * r.ck); lines.push('CK ' + Math.round(r.ck * 100) + '%');
    }
  }

  // Bonus rules — best bonus wins
  let bestBonus = null;
  for (const r of p.kmRules) {
    if (r.type === 'bonus') {
      const cq = r.unit === 'thung' ? qT : totalLon;
      const sets = r.maxSets ? Math.min(Math.floor(cq / r.X), r.maxSets) : Math.floor(cq / r.X);
      if (sets > 0) {
        const bu = sets * r.Y;
        const bl = r.unit === 'thung' ? bu * p.slThung : bu;
        let hopTry, nhanTry;
        if (r.giaBonus != null) {
          if (r.giaBonus === 0) hopTry = Math.round((base - ckDisc) / totalLon);
          else hopTry = Math.round((base - ckDisc - Math.round(bl * r.giaBonus)) / totalLon);
          nhanTry = totalLon;
        } else {
          nhanTry = totalLon + bl;
          hopTry = Math.round((base - ckDisc) / nhanTry);
        }
        const bd = (r.giaBonus != null && r.giaBonus > 0) ? Math.round(bl * r.giaBonus) : 0;
        if (!bestBonus || hopTry < bestBonus.hopKM)
          bestBonus = { hopKM: hopTry, bl: (r.giaBonus != null) ? 0 : bl, bu, unit: r.unit === 'thung' ? 'thùng' : p.donvi, nhan: nhanTry, bonusDisc: bd };
      }
    }
  }

  let hopKM, bonusLon = 0, bonusDisc = 0;
  if (bestBonus) {
    hopKM = bestBonus.hopKM;
    bonusLon = bestBonus.bl;
    bonusDisc = bestBonus.bonusDisc || 0;
    lines.unshift('Tặng ' + bestBonus.bu + ' ' + bestBonus.unit);
  } else {
    hopKM = totalLon ? Math.round((base - ckDisc) / totalLon) : p.giaNYLon;
  }

  return { disc: ckDisc + bonusDisc, bonus: bonusLon, nhan: totalLon + bonusLon, hopKM, thungKM: hopKM * p.slThung, desc: lines.join(' + ') };
}

// ============================================================
// Giỏ hàng
// ============================================================
function getItems() {
  // Build order context for minSKU checks
  const allMas = Object.entries(cart).filter(([, q]) => q.qT > 0 || q.qL > 0).map(([ma]) => ma);
  const orderContext = { allMas, skuCount: allMas.length };

  return Object.entries(cart).filter(([, q]) => q.qT > 0 || q.qL > 0).map(([ma, q]) => {
    const p = spFind(ma); if (!p) return null;
    const totalLon = q.qT * p.slThung + q.qL;
    const gocTotal = p.giaNYLon * totalLon;
    const km = calcKM(p, q.qT, q.qL, orderContext);
    return { ...p, qT: q.qT, qL: q.qL, totalLon, gocTotal, disc: km.disc, desc: km.desc, bonus: km.bonus, afterKM: gocTotal - km.disc, appliedPromos: km.appliedPromos };
  }).filter(Boolean);
}

function addCart(ma) {
  const p = spFind(ma); if (!p) return;
  let qT = parseInt(document.getElementById('qT_' + ma)?.value) || 0;
  let qL = parseInt(document.getElementById('qL_' + ma)?.value) || 0;
  // Validation: không cho số âm, giới hạn hợp lý
  if (qT < 0) qT = 0;
  if (qL < 0) qL = 0;
  if (qT > 999) qT = 999;
  if (qL > 9999) qL = 9999;
  if (!qT && !qL) return;
  cart[ma] = { qT, qL }; saveCart(); updateBadge();
  const card = document.getElementById('card_' + ma);
  if (card) card.className = 'sp-card inCart';
  const pv = document.getElementById('pv_' + ma);
  if (pv) {
    const km = calcKM(p, qT, qL);
    const after = p.giaNYLon * (qT * p.slThung + qL) - km.disc;
    pv.innerHTML = '<div class="pv-row"><span class="pv-l">✓ Đã thêm vào đơn</span><span class="pv-v">' + fmt(after) + 'đ</span></div>';
    setTimeout(function() { if (pv) pv.style.display = 'none'; }, 2000);
  }
}

function removeCart(ma) {
  delete cart[ma]; saveCart(); updateBadge();
  const card = document.getElementById('card_' + ma);
  if (card) card.className = 'sp-card';
  ['qT_', 'qL_'].forEach(function(pre) { var el = document.getElementById(pre + ma); if (el) el.value = ''; });
  const pv = document.getElementById('pv_' + ma); if (pv) pv.style.display = 'none';
  const pt = document.getElementById('pt_' + ma);
  const p = spFind(ma); if (pt && p) pt.innerHTML = ptbl(p, calcKM(p, 0, 0));
  renderDon();
}

function clearCart() { cart = {}; saveCart(); updateBadge(); if (window.renderOrder) window.renderOrder(); renderDon(); }

function updateBadge() {
  const n = getItems().length;
  const b = document.getElementById('don-badge');
  if (b) { b.style.display = n ? '' : 'none'; b.textContent = n; }
}

// Render tab đơn hàng
function renderDon() {
  const items = getItems();
  const el = document.getElementById('don-content'); if (!el) return;
  if (!items.length) { el.innerHTML = '<div class="empty">Chưa có sản phẩm<br><small>Vào Đặt hàng để thêm</small></div>'; return; }
  const totGoc = items.reduce(function(s, x) { return s + x.gocTotal; }, 0);
  const totAfter = items.reduce(function(s, x) { return s + x.afterKM; }, 0);
  const orderKM = calcOrderKM(items);
  const totAfterOrder = totAfter - orderKM.disc;
  const totSave = totGoc - totAfterOrder;

  var html = '<div class="ord-wrap"><div class="ord-hd"><span class="ord-hdT">Đơn · ' + items.length + ' SP</span><span class="ord-hdV">' + fmt(totAfterOrder) + 'đ</span></div>';

  items.forEach(function(it) {
    html += '<div class="oi"><div class="oi-top"><div class="oi-name">' + it.ten + '</div><button class="oi-del" onclick="removeCart(\'' + it.ma + '\')">✕</button></div>';
    html += '<div class="oi-sub">' + it.ma + ' · ' + it.donvi + '</div>';
    html += '<div class="oi-qty">' + (it.qT > 0 ? it.qT + ' thùng' : '') + (it.qT > 0 && it.qL > 0 ? ' + ' : '') + (it.qL > 0 ? it.qL + ' ' + it.donvi + ' lẻ' : '') + ' = ' + it.totalLon + ' ' + it.donvi + (it.bonus > 0 ? ' + tặng ' + it.bonus : '') + '</div>';
    if (it.desc) html += '<div class="oi-km">' + it.desc + '</div>';
    if (it.appliedPromos && it.appliedPromos.length) {
      html += '<div style="font-size:10px;color:var(--b);padding:2px 0">' + it.appliedPromos.join(' + ') + '</div>';
    }
    html += '<div class="oi-pr"><span class="oi-pl">Thành tiền</span><span class="oi-pv">' + fmt(it.afterKM) + 'đ</span></div></div>';
  });

  html += '<div class="ord-ft">';
  if (totSave > 0) {
    html += '<div class="ft-row"><span class="ft-l">Giá gốc</span><span class="ft-v">' + fmt(totGoc) + 'đ</span></div>';
    html += '<div class="ft-row"><span class="ft-l">Tiết kiệm</span><span class="ft-save">- ' + fmt(totSave) + 'đ</span></div>';
  }
  if (orderKM.disc > 0) {
    html += '<div class="ft-row"><span class="ft-l">CK đơn hàng</span><span class="ft-save">- ' + fmt(orderKM.disc) + 'đ</span></div>';
  }
  // Hiển thị SP tặng từ order_bonus
  if (orderKM.bonusItems && orderKM.bonusItems.length) {
    orderKM.bonusItems.forEach(function(bi) {
      html += '<div class="ft-row"><span class="ft-l" style="color:var(--g)">🎁 ' + bi.progName + '</span><span class="ft-save" style="color:var(--g)">+' + bi.qty + ' ' + bi.name + '</span></div>';
    });
  }
  if (orderKM.desc) {
    html += '<div class="ft-row"><span class="ft-l">CTKM đơn</span><span class="ft-v" style="font-size:10px">' + orderKM.desc + '</span></div>';
  }

  html += '<div class="ft-grand"><div class="ft-gr"><span class="ft-gl">Tổng cộng</span><span class="ft-gv">' + fmt(totAfterOrder) + 'đ</span></div>';
  html += '<div class="ft-gr"><span class="ft-vl">Đã bao gồm VAT 1,5%</span><span class="ft-vv">' + fmt(Math.round(totAfterOrder * 1.015)) + 'đ</span></div></div>';
  html += '<input class="makh-inp" type="text" id="makh-inp" placeholder="Mã khách hàng (tuỳ chọn)">';
  html += '<button class="btn-submit" onclick="submitOrder()">📤 Tạo đơn hàng</button>';
  html += '<button class="btn-clear" onclick="clearCart()">🗑 Xoá tất cả</button>';
  html += '</div></div>';

  el.innerHTML = html;
}

function submitOrder() {
  const items = getItems(); if (!items.length) return;
  const makh = (document.getElementById('makh-inp') || {}).value || '';
  const orderKM = calcOrderKM(items);
  const tong = items.reduce(function(s, x) { return s + x.afterKM; }, 0) - orderKM.disc;
  if (makh) {
    var kh = customers.find(function(k) { return k.ma === makh; });
    if (!kh) { kh = { ma: makh, orders: [] }; customers.push(kh); }
    kh.orders.unshift({ id: Date.now(), ngay: new Date().toLocaleDateString('vi-VN'), items: items, tong: tong, orderDisc: orderKM.disc, orderDesc: orderKM.desc, bonusItems: orderKM.bonusItems });
    if (kh.orders.length > 30) kh.orders = kh.orders.slice(0, 30);
    localStorage.setItem('vnm_kh', JSON.stringify(customers));
  }
  alert('✅ Đã tạo đơn ' + fmt(tong) + 'đ' + (makh ? ' cho ' + makh : ''));
  clearCart();
}

// Khách hàng
function renderKH() {
  const el = document.getElementById('kh-list'); if (!el) return;
  if (!customers.length) { el.innerHTML = '<div class="empty">Chưa có khách hàng</div>'; return; }
  el.innerHTML = customers.map(function(kh, ki) {
    var total = kh.orders.reduce(function(s, o) { return s + o.tong; }, 0);
    var rows = kh.orders.slice(0, 4).map(function(o) {
      return '<div class="kh-ord"><div class="ko-d">' + o.ngay + ' · ' + o.items.length + ' SP</div><div class="ko-s">' + fmt(o.tong) + 'đ</div><div class="ko-i">' + o.items.slice(0, 3).map(function(x) { return x.ten; }).join(', ') + (o.items.length > 3 ? ' +' + (o.items.length - 3) + ' SP' : '') + '</div></div>';
    }).join('');
    return '<div class="kh-card"><div class="kh-head"><span class="kh-ma">' + kh.ma + '</span><span class="kh-total">' + fmt(total) + 'đ</span></div>' + rows +
      (kh.orders.length > 4 ? '<div style="padding:5px 13px;font-size:11px;color:var(--t3)">+' + (kh.orders.length - 4) + ' đơn nữa</div>' : '') +
      '<div style="padding:6px 13px"><button onclick="delKH(' + ki + ')" style="background:none;border:none;color:var(--r);font-size:11px;cursor:pointer">✕ Xoá</button></div></div>';
  }).join('');
}

function addKH() {
  var inp = document.getElementById('new-makh');
  var ma = inp.value.trim().toUpperCase(); if (!ma) return;
  if (customers.find(function(k) { return k.ma === ma; })) { alert('Mã đã tồn tại!'); return; }
  customers.push({ ma: ma, orders: [] });
  localStorage.setItem('vnm_kh', JSON.stringify(customers));
  inp.value = ''; renderKH();
}

function delKH(ki) {
  if (!confirm('Xoá khách hàng?')) return;
  customers.splice(ki, 1);
  localStorage.setItem('vnm_kh', JSON.stringify(customers));
  renderKH();
}

// Export
window.cart = cart;
window.customers = customers;
window.saveCart = saveCart;
window.fmt = fmt;
window.calcKM = calcKM;
window.calcOrderKM = calcOrderKM;
window.getItems = getItems;
window.addCart = addCart;
window.removeCart = removeCart;
window.clearCart = clearCart;
window.renderDon = renderDon;
window.submitOrder = submitOrder;
window.renderKH = renderKH;
window.addKH = addKH;
window.delKH = delKH;
window.updateBadge = updateBadge;
