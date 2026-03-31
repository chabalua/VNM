// Giỏ hàng và khách hàng
let cart = JSON.parse(localStorage.getItem('vnm_cart') || '{}');
let customers = JSON.parse(localStorage.getItem('vnm_kh') || '[]');

// Lưu giỏ hàng
function saveCart() { localStorage.setItem('vnm_cart', JSON.stringify(cart)); }

// Hàm tiện ích định dạng số
function fmt(n) { return Math.round(n).toLocaleString('vi-VN'); }

// --- Tính toán khuyến mãi (sử dụng kmProgs từ data.js) ---
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

      let type = t.type;
      if (!type) {
        if (t.mx != null) type = 'below';
        else if (t.mn != null) type = 'above';
        else type = 'below';
      }

      let value = 0;
      if (t.value != null && t.value !== '') {
        value = +t.value;
        if (!isNaN(value) && value > 0) {
          // UI store uses 'K' as unit (600 means 600.000 VND); legacy may store full VND.
          if (value < 10000) value = value * 1000;
        } else value = 0;
      } else if (t.mx != null && t.mx !== '') {
        value = +t.mx;
      } else if (t.mn != null && t.mn !== '') {
        value = +t.mn * 1000;
      }

      if (isNaN(value) || value < 0) value = 0;
      return { type, value, ck: ckPerc / 100 };
    }).filter(t => t && t.ck > 0);

    if (tiers.length) rules.push({ type: 'tier_money', tiers });
  } else if (prog.type === 'order_money') {
    // order-level promotions do not create item-level kmRules
    return [];
  }
  return rules;
}

// Hàm tính KM chính (được export)
function calcKM(p, qT, qL) {
  const applicable = kmProgs.filter(prog => prog.active && (prog.spMas || []).indexOf(p.ma) >= 0);
  const baseKM = _calcKM_orig(p, qT, qL);
  if (!applicable.length) {
    return { ...baseKM, appliedPromos: [] };
  }
  const stackable = applicable.filter(prog => prog.stackable);
  const nonStackable = applicable.filter(prog => !prog.stackable);
  const pTest = { ...p };
  let allRules = [];
  let appliedProgs = [];
  // Áp dụng tất cả các CT KM stackable
  stackable.forEach(prog => { allRules.push(...kmBuildRules(prog)); });
  // Tìm CT KM non-stackable tốt nhất
  let bestNonStack = null, bestHop = p.giaNYLon;
  nonStackable.forEach(prog => {
    const testRules = kmBuildRules(prog);
    const testKM = _calcKM_orig({ ...p, kmRules: testRules }, qT, qL);
    if (testKM.hopKM < bestHop) { bestHop = testKM.hopKM; bestNonStack = { prog, rules: testRules }; }
  });
  if (bestNonStack) { allRules.push(...bestNonStack.rules); }
  // Tính toán cuối cùng
  pTest.kmRules = allRules;
  const kmFinal = _calcKM_orig(pTest, qT, qL);
  // Ghi lại CT KM nào được áp dụng
  if (kmFinal.disc > 0 || kmFinal.bonus > 0) {
    appliedProgs = stackable.map(prog => prog.name || 'CT KM');
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

function calcOrderKM(items) {
  if (!items || !items.length) return { disc: 0, desc: '' };
  const baseTotal = items.reduce((sum, item) => sum + item.gocTotal, 0);
  const orderPromos = kmProgs.filter(prog => prog.active && prog.type === 'order_money');
  if (!orderPromos.length) return { disc: 0, desc: '' };

  let disc = 0;
  const descParts = [];
  const stackable = orderPromos.filter(prog => prog.stackable);
  const nonStackable = orderPromos.filter(prog => !prog.stackable);

  stackable.forEach(prog => {
    const d = orderPromoDiscount(baseTotal, prog);
    if (d > 0) {
      disc += d;
      descParts.push(prog.name || 'Đơn hàng');
    }
  });
  let bestDisc = 0;
  let bestProg = null;
  nonStackable.forEach(prog => {
    const d = orderPromoDiscount(baseTotal, prog);
    if (d > bestDisc) {
      bestDisc = d;
      bestProg = prog;
    }
  });
  if (bestDisc > 0 && bestProg) {
    disc += bestDisc;
    descParts.push(bestProg.name || 'Đơn hàng');
  }
  return { disc, desc: descParts.join(' + ') };
}

// Hàm tính toán cốt lõi (dùng cho kmRules)
function _calcKM_orig(p, qT, qL) {
  const totalLon = qT * p.slThung + qL;
  const base = p.giaNYLon * totalLon;
  if (!totalLon) return { disc: 0, bonus: 0, nhan: 0, hopKM: p.giaNYLon, thungKM: p.giaNYThung, desc: '' };
  let ckDisc = 0, lines = [];
  for (const r of p.kmRules) {
    if (r.type === 'tier_money') {
      let applicableTier = null;
      // Xử lý 'below': tìm tier có value LỚN NHẤT mà base < value
      const belowTiers = r.tiers.filter(t => t.type === 'below' && base < t.value);
      if (belowTiers.length) {
        applicableTier = belowTiers.reduce((prev, curr) => !prev || curr.value < prev.value ? curr : prev);
      }
      // Xử lý 'above': tìm tier có value NHỎ NHẤT mà base >= value
      const aboveTiers = r.tiers.filter(t => t.type === 'above' && base >= t.value);
      if (aboveTiers.length) {
        applicableTier = aboveTiers.reduce((prev, curr) => !prev || curr.value > prev.value ? curr : prev);
      }
      if (applicableTier && applicableTier.ck > 0) {
        ckDisc += Math.round(base * applicableTier.ck / 100);
        lines.push('CK ' + applicableTier.ck + '%');
      }
    } else if (r.type === 'tier_qty') {
      const cq = r.unit === 'thung' ? qT : totalLon;
      const t = [...r.tiers].sort((a,b) => b.minT - a.minT).find(x => cq >= x.minT);
      if (t) { ckDisc += Math.round(base * t.ck); lines.push('CK ' + Math.round(t.ck*100) + '%'); }
    } else if (r.type === 'fixed') {
      ckDisc += Math.round(base * r.ck); lines.push('CK ' + Math.round(r.ck*100) + '%');
    }
  }
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
        const unit = r.unit === 'thung' ? 'thùng' : p.donvi;
        const bd = (r.giaBonus != null && r.giaBonus > 0) ? Math.round(bl * r.giaBonus) : 0;
        if (!bestBonus || hopTry < bestBonus.hopKM)
          bestBonus = { hopKM: hopTry, bl: (r.giaBonus != null) ? 0 : bl, bu, unit, nhan: nhanTry, bonusDisc: bd };
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

// Lấy danh sách các mặt hàng trong giỏ
function getItems() {
  return Object.entries(cart).filter(([,q]) => q.qT > 0 || q.qL > 0).map(([ma,q]) => {
    const p = spFind(ma); if (!p) return null;
    const totalLon = q.qT * p.slThung + q.qL;
    const gocTotal = p.giaNYLon * totalLon;
    const km = calcKM(p, q.qT, q.qL);
    return { ...p, qT: q.qT, qL: q.qL, totalLon, gocTotal, disc: km.disc, desc: km.desc, bonus: km.bonus, afterKM: gocTotal - km.disc };
  }).filter(Boolean);
}

// Thêm vào giỏ
function addCart(ma) {
  const p = spFind(ma); if (!p) return;
  const qT = parseInt(document.getElementById('qT_'+ma)?.value) || 0;
  const qL = parseInt(document.getElementById('qL_'+ma)?.value) || 0;
  if (!qT && !qL) return;
  cart[ma] = { qT, qL }; saveCart(); updateBadge();
  const card = document.getElementById('card_'+ma);
  if (card) card.className = 'sp-card inCart';
  const pv = document.getElementById('pv_'+ma);
  if (pv) {
    const km = calcKM(p, qT, qL);
    const after = p.giaNYLon * (qT * p.slThung + qL) - km.disc;
    pv.innerHTML = `<div class="pv-row"><span class="pv-l">✓ Đã thêm vào đơn</span><span class="pv-v">${fmt(after)}đ</span></div>`;
    setTimeout(() => { if (pv) pv.style.display = 'none'; }, 2000);
  }
}

// Xóa khỏi giỏ
function removeCart(ma) {
  delete cart[ma]; saveCart(); updateBadge();
  const card = document.getElementById('card_'+ma);
  if (card) card.className = 'sp-card';
  ['qT_','qL_'].forEach(p => { const el = document.getElementById(p+ma); if (el) el.value = ''; });
  const pv = document.getElementById('pv_'+ma); if (pv) pv.style.display = 'none';
  const pt = document.getElementById('pt_'+ma);
  const p = spFind(ma); if (pt && p) pt.innerHTML = ptbl(p, calcKM(p, 0, 0));
  renderDon();
}

// Xóa toàn bộ giỏ
function clearCart() { cart = {}; saveCart(); updateBadge(); if(window.renderOrder) window.renderOrder(); renderDon(); }

// Cập nhật badge số lượng
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
  const totGoc = items.reduce((s,x) => s + x.gocTotal, 0);
  const totAfter = items.reduce((s,x) => s + x.afterKM, 0);
  const orderKM = calcOrderKM(items);
  const totAfterOrder = totAfter - orderKM.disc;
  const totSave = totGoc - totAfterOrder;
  el.innerHTML = `<div class="ord-wrap"><div class="ord-hd"><span class="ord-hdT">Đơn · ${items.length} SP</span><span class="ord-hdV">${fmt(totAfterOrder)}đ</span></div>
    ${items.map(it => `<div class="oi"><div class="oi-top"><div class="oi-name">${it.ten}</div><button class="oi-del" onclick="removeCart('${it.ma}')">✕</button></div>
      <div class="oi-sub">${it.ma} · ${it.donvi}</div><div class="oi-qty">${it.qT > 0 ? it.qT + ' thùng' : ''}${it.qT > 0 && it.qL > 0 ? ' + ' : ''}${it.qL > 0 ? it.qL + ' ' + it.donvi + ' lẻ' : ''} = ${it.totalLon} ${it.donvi}${it.bonus > 0 ? ' + tặng ' + it.bonus : ''}</div>
      ${it.desc ? `<div class="oi-km">${it.desc}</div>` : ''}<div class="oi-pr"><span class="oi-pl">Thành tiền</span><span class="oi-pv">${fmt(it.afterKM)}đ</span></div>
    </div>`).join('')}
    <div class="ord-ft">${totSave > 0 ? `<div class="ft-row"><span class="ft-l">Giá gốc</span><span class="ft-v">${fmt(totGoc)}đ</span></div><div class="ft-row"><span class="ft-l">Tiết kiệm</span><span class="ft-save">- ${fmt(totSave)}đ</span></div>` : ''}${orderKM.disc > 0 ? `<div class="ft-row"><span class="ft-l">CK đơn hàng</span><span class="ft-save">- ${fmt(orderKM.disc)}đ</span></div>` : ''}${orderKM.disc > 0 && orderKM.desc ? `<div class="ft-row"><span class="ft-l">CTKM đơn</span><span class="ft-v">${orderKM.desc}</span></div>` : ''}
      <div class="ft-grand"><div class="ft-gr"><span class="ft-gl">Tổng cộng</span><span class="ft-gv">${fmt(totAfterOrder)}đ</span></div>
      <div class="ft-gr"><span class="ft-vl">Đã bao gồm VAT 1,5%</span><span class="ft-vv">${fmt(Math.round(totAfterOrder * 1.015))}đ</span></div></div>
      <input class="makh-inp" type="text" id="makh-inp" placeholder="Mã khách hàng (tuỳ chọn)">
      <button class="btn-submit" onclick="submitOrder()">📤 Tạo đơn hàng</button>
      <button class="btn-clear" onclick="clearCart()">🗑 Xoá tất cả</button>
    </div></div>`;
}

// Tạo đơn hàng
function submitOrder() {
  const items = getItems(); if (!items.length) return;
  const makh = (document.getElementById('makh-inp')||{}).value || '';
  const orderKM = calcOrderKM(items);
  const tong = items.reduce((s,x) => s + x.afterKM, 0) - orderKM.disc;
  if (makh) {
    let kh = customers.find(k => k.ma === makh);
    if (!kh) { kh = { ma: makh, orders: [] }; customers.push(kh); }
    kh.orders.unshift({ id: Date.now(), ngay: new Date().toLocaleDateString('vi-VN'), items, tong, orderDisc: orderKM.disc, orderDesc: orderKM.desc });
    if (kh.orders.length > 30) kh.orders = kh.orders.slice(0,30);
    localStorage.setItem('vnm_kh', JSON.stringify(customers));
  }
  alert('✅ Đã tạo đơn ' + fmt(tong) + 'đ' + (makh ? ' cho ' + makh : ''));
  clearCart();
}

// Quản lý khách hàng
function renderKH() {
  const el = document.getElementById('kh-list'); if (!el) return;
  if (!customers.length) { el.innerHTML = '<div class="empty">Chưa có khách hàng</div>'; return; }
  el.innerHTML = customers.map((kh, ki) => {
    const total = kh.orders.reduce((s,o) => s + o.tong, 0);
    return `<div class="kh-card"><div class="kh-head"><span class="kh-ma">${kh.ma}</span><span class="kh-total">${fmt(total)}đ</span></div>
      ${kh.orders.slice(0,4).map(o => `<div class="kh-ord"><div class="ko-d">${o.ngay} · ${o.items.length} SP</div><div class="ko-s">${fmt(o.tong)}đ</div><div class="ko-i">${o.items.slice(0,3).map(x => x.ten).join(', ')}${o.items.length > 3 ? ' +' + (o.items.length-3) + ' SP' : ''}</div></div>`).join('')}
      ${kh.orders.length > 4 ? `<div style="padding:5px 13px;font-size:11px;color:var(--t3)">+${kh.orders.length-4} đơn nữa</div>` : ''}
      <div style="padding:6px 13px"><button onclick="delKH(${ki})" style="background:none;border:none;color:var(--r);font-size:11px;cursor:pointer">✕ Xoá</button></div>
    </div>`;
  }).join('');
}

function addKH() {
  const inp = document.getElementById('new-makh');
  const ma = inp.value.trim().toUpperCase(); if (!ma) return;
  if (customers.find(k => k.ma === ma)) { alert('Mã đã tồn tại!'); return; }
  customers.push({ ma, orders: [] });
  localStorage.setItem('vnm_kh', JSON.stringify(customers));
  inp.value = ''; renderKH();
}

function delKH(ki) {
  if (!confirm('Xoá khách hàng?')) return;
  customers.splice(ki,1);
  localStorage.setItem('vnm_kh', JSON.stringify(customers));
  renderKH();
}

// Xuất các hàm và biến ra window
window.cart = cart;
window.customers = customers;
window.saveCart = saveCart;
window.fmt = fmt;
window.calcKM = calcKM;
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