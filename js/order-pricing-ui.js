// ============================================================
// ORDER PRICING UI HELPERS
// Shared pricing snapshot helpers for order rendering paths
// ============================================================

function buildCartDisplaySnapshot(p, cartState, qT, qL) {
  var totalLon = qT * p.slThung + qL;
  var gross = p.giaNYLon * totalLon;
  var orderContext = (typeof buildOrderContextFromCartState === 'function')
    ? buildOrderContextFromCartState(cartState, p.ma)
    : buildOrderContextFromCart(p.ma);
  var kmInfo = calcKM(p, qT, qL, orderContext);
  var draftItems = getItemsFromCartState(cartState);
  var draftOrderKM = calcOrderKM(draftItems);
  var kmForTable = buildOrderAwareKmDisplay(p, kmInfo, draftItems, draftOrderKM);
  var orderExtraDisc = (kmForTable.orderDiscAllocated || 0) + (kmForTable.orderGiftValueAllocated || 0);
  return {
    totalLon: totalLon,
    gross: gross,
    kmInfo: kmInfo,
    kmForTable: kmForTable,
    draftOrderKM: draftOrderKM,
    orderExtraDisc: orderExtraDisc,
    subtotal: Math.max(0, gross - kmInfo.disc - orderExtraDisc)
  };
}

function buildOrderAwareKmDisplay(p, km, draftItems, orderKM) {
  var displayKm = Object.assign({}, km || {});
  displayKm.orderBonusQty = 0; displayKm.orderDiscAllocated = 0;
  if (!p || !Array.isArray(draftItems) || !draftItems.length) return displayKm;
  var targetItem = draftItems.find(function(it) { return it.ma === p.ma; });
  if (!targetItem) return displayKm;

  var totalAfter = draftItems.reduce(function(sum, item) { return sum + (item.afterKM || 0); }, 0);
  var proportion = totalAfter > 0 ? ((targetItem.afterKM || 0) / totalAfter) : 0;

  (orderKM && orderKM.bonusItems || []).forEach(function(bi) {
    if (bi && bi.ma === p.ma) displayKm.orderBonusQty += Math.max(0, parseInt(bi.qty, 10) || 0);
  });

  if (orderKM && orderKM.disc > 0 && totalAfter > 0) {
    displayKm.orderDiscAllocated = Math.round(orderKM.disc * proportion);
  }

  var orderGiftValueAllocated = 0;
  (orderKM && orderKM.bonusItems || []).forEach(function(bi) {
    if (!bi || bi.ma === p.ma) return;
    var giftP = bi.ma ? (typeof spFind === 'function' ? spFind(bi.ma) : null) : null;
    var giftUnitPrice = giftP ? (+giftP.giaNYLon || 0) : 0;
    if (giftUnitPrice <= 0) return;
    orderGiftValueAllocated += Math.round((parseInt(bi.qty, 10) || 0) * giftUnitPrice * proportion);
  });
  displayKm.orderGiftValueAllocated = orderGiftValueAllocated;

  var totalVirtualDisc = displayKm.orderDiscAllocated + orderGiftValueAllocated;
  if (displayKm.orderBonusQty > 0 || totalVirtualDisc > 0) {
    var effectivePaid = Math.max(0, (targetItem.afterKM || 0) - totalVirtualDisc);
    var effectiveQty = Math.max(targetItem.totalLon || 0, displayKm.nhan || 0) + displayKm.orderBonusQty;
    if (effectiveQty > 0) {
      displayKm.hopKM = Math.round(effectivePaid / effectiveQty);
      displayKm.thungKM = displayKm.hopKM * p.slThung;
    }
  }
  return displayKm;
}

function getProductPromoRefs(ma) {
  return kmProgs.map(function(prog, idx) { return { prog: prog, idx: idx }; })
    .filter(function(item) { return item.prog && item.prog.active && (item.prog.spMas || []).includes(ma); });
}

function getAppliedPromoRefsByNames(names) {
  var used = {};
  return (names || []).map(function(name) {
    var matchIdx = -1;
    for (var i = 0; i < kmProgs.length; i++) {
      if (used[i]) continue;
      var prog = kmProgs[i];
      if (!prog || !prog.active) continue;
      if ((prog.name || 'CT KM') !== name) continue;
      matchIdx = i; used[i] = true; break;
    }
    return { idx: matchIdx, name: name || 'CT KM' };
  });
}

function renderPromoJumpChips(items, maxVisible) {
  var list = Array.isArray(items) ? items : [];
  if (!list.length) return '';
  var limit = Math.max(1, maxVisible || list.length);
  var html = '<div class="km-line">';
  list.slice(0, limit).forEach(function(item) {
    var name = escapeHtmlAttr(item.name || (item.prog && item.prog.name) || 'CT KM');
    if (item.idx >= 0) html += '<button type="button" class="km-jump-chip applied" onclick="event.stopPropagation();kmOpenFromOrder(' + item.idx + ')">' + name + '</button>';
    else html += '<span class="km-jump-chip muted">' + name + '</span>';
  });
  if (list.length > limit) html += '<button type="button" class="km-jump-chip muted" onclick="event.stopPropagation();gotoTab(\'km\')">+' + (list.length - limit) + ' CT</button>';
  html += '</div>';
  return html;
}

function formatQtyByCarton(p, qty) {
  var amount = Math.max(0, parseInt(qty, 10) || 0);
  var unit = p && p.donvi ? p.donvi : 'đơn vị';
  var cartonSize = p && +p.slThung > 0 ? +p.slThung : 0;
  var text = amount + ' ' + unit;
  if (!cartonSize || !amount) return text;
  var cartons = Math.floor(amount / cartonSize);
  var remainder = amount % cartonSize;
  var parts = [];
  if (cartons > 0) parts.push(cartons + ' thùng');
  if (remainder > 0) parts.push(remainder + ' ' + unit);
  if (!parts.length) parts.push('0 ' + unit);
  return text + ' (' + parts.join(' + ') + ')';
}

function getCartonRoundHint(p, qty) {
  var amount = Math.max(0, parseInt(qty, 10) || 0);
  var cartonSize = p && +p.slThung > 0 ? +p.slThung : 0;
  if (!cartonSize || !amount) return '';
  var remainder = amount % cartonSize;
  if (!remainder) return 'Đã chẵn thùng';
  return 'Còn ' + (cartonSize - remainder) + ' ' + p.donvi + ' nữa tròn thùng';
}

function buildPriceTable(p, km, noQty) {
  var VAT_RATE = typeof VAT !== 'undefined' ? VAT : 0.015;
  var hopGoc = p.giaNYLon;
  var thungGoc = p.giaNYThung;
  var hopKM = km.hopKM;
  var thungKM = km.thungKM;

  var hopVat = Math.round(hopKM * (1 + VAT_RATE));
  var thungVat = Math.round(thungKM * (1 + VAT_RATE));

  var hasDiscount = !noQty && (hopKM < hopGoc || km.bonus > 0);
  var savePerThung = !noQty ? (hopGoc - hopKM) * p.slThung : 0;

  var rows = '';
  rows += '<div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr;padding:8px 12px;border-bottom:1px solid var(--border-subtle);background:var(--accent-soft);align-items:center;gap:4px">';
  rows += '<div style="font-weight:600;font-size:12.5px;color:var(--accent-text)">Thùng ' + p.slThung + '</div>';
  rows += '<div style="font-size:12px;color:var(--text-tertiary)' + (hasDiscount ? ';text-decoration:line-through' : '') + '">' + fmt(thungGoc) + '</div>';
  rows += '<div style="font-size:13px;font-weight:600;color:var(--accent-text)">' + (noQty ? '—' : (hasDiscount ? fmt(thungKM) + 'đ' : '—')) + '</div>';
  rows += '<div style="font-size:13px;font-weight:600;color:var(--accent-text)">' + (noQty ? '—' : fmt(thungVat) + 'đ') + '</div>';
  rows += '</div>';

  if (p.locSize) {
    var locGoc = hopGoc * p.locSize;
    var locKM = hopKM * p.locSize;
    var locVat = Math.round(locKM * (1 + VAT_RATE));
    rows += '<div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr;padding:8px 12px;border-bottom:1px solid var(--border-subtle);align-items:center;gap:4px">';
    rows += '<div style="font-size:12.5px;color:var(--text)">' + (p.locLabel || 'Lốc') + ' ' + p.locSize + '</div>';
    rows += '<div style="font-size:12px;color:var(--text-tertiary)' + (hasDiscount ? ';text-decoration:line-through' : '') + '">' + fmt(locGoc) + '</div>';
    rows += '<div style="font-size:13px;font-weight:500;color:var(--text)">' + (noQty ? '—' : (hasDiscount ? fmt(locKM) : '—')) + '</div>';
    rows += '<div style="font-size:13px;font-weight:500;color:var(--text)">' + (noQty ? '—' : fmt(locVat)) + '</div>';
    rows += '</div>';
  }

  rows += '<div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr;padding:8px 12px;align-items:center;gap:4px">';
  rows += '<div style="font-size:12.5px;color:var(--text)">Hộp/Lon</div>';
  rows += '<div style="font-size:12px;color:var(--text-tertiary)' + (hasDiscount ? ';text-decoration:line-through' : '') + '">' + fmt(hopGoc) + '</div>';
  rows += '<div style="font-size:13px;font-weight:500;color:var(--text)">' + (noQty ? '—' : (hasDiscount ? fmt(hopKM) : '—')) + '</div>';
  rows += '<div style="font-size:13px;font-weight:500;color:var(--text)">' + (noQty ? '—' : fmt(hopVat)) + '</div>';
  rows += '</div>';

  var header = '<div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr;padding:8px 12px;background:var(--surface);border-bottom:1px solid var(--border-subtle);border-radius:8px 8px 0 0;font-size:11px;font-weight:600;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.5px;gap:4px"><div>Quy cách</div><div>Gốc</div><div>+KM</div><div>+VAT</div></div>';

  var body = '<div style="background:var(--bg);border:1px solid var(--border-subtle);border-radius:8px;margin-bottom:12px">' + header + rows + '</div>';

  if (savePerThung > 0) {
    body += '<div style="margin-top:-8px;margin-bottom:12px;font-size:11px;color:var(--success-text);display:flex;align-items:center;gap:4px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg> Tiết kiệm <b>' + fmt(savePerThung) + 'đ</b> mỗi thùng</div>';
  }
  return body;
}

function buildTLStrip(p) {
  var selectedCustomerMa = (typeof getSelectedCustomerMa === 'function') ? getSelectedCustomerMa() : '';
  if (!selectedCustomerMa) return '';
  var cusList = (typeof getCUS === 'function') ? getCUS() : [];
  var kh = cusList.find(function(k) { return k.ma === selectedCustomerMa; });
  if (!kh || !kh.programs) return '';

  var mk = (typeof cusCurrentMonthKey === 'function') ? cusCurrentMonthKey() : '';
  var md = (typeof cusGetMonthData === 'function') ? cusGetMonthData(kh, mk) : {};

  if (p.nhom === 'C' && kh.programs.vnmShop && kh.programs.vnmShop.dangKy) {
    var muc = kh.programs.vnmShop.mucTichLuy;
    var tl = (typeof VNM_SHOP_TICHLUY !== 'undefined') ? VNM_SHOP_TICHLUY.find(function(t) { return t.muc === muc; }) : null;
    if (!tl) return '';
    var ds = md.dsNhomC || 0;
    var pct = tl.dsMin > 0 ? Math.min(100, Math.round(ds / tl.dsMin * 100)) : 0;
    var remain = Math.max(0, tl.dsMin - ds);
    return '<div class="tl-strip">' +
      '<div class="tl-strip-title">VNM Shop · Mức ' + muc + ' — Hoàn ' + tl.ckDS + '% DS nhóm C</div>' +
      '<div class="tl-strip-desc">Giai đoạn: GĐ1 +' + tl.ckGD1 + '% · GĐ2 +' + tl.ckGD2 + '% · GĐ3 +' + tl.ckGD3 + '%</div>' +
      '<div class="tl-strip-bar"><div class="tl-strip-fill" style="width:' + pct + '%"></div></div>' +
      '<div class="tl-strip-hint">' + fmt(ds) + 'đ / ' + fmt(tl.dsMin) + 'đ (' + pct + '%)' + (remain > 0 ? ' · Còn cần ' + fmt(remain) + 'đ' : ' · Đạt mức') + '</div>' +
      '</div>';
  }

  if (p.nhom === 'D' && kh.programs.vipShop && kh.programs.vipShop.dangKy) {
    var muc2 = kh.programs.vipShop.mucTichLuy;
    var tl2 = (typeof VIP_SHOP_TICHLUY !== 'undefined') ? VIP_SHOP_TICHLUY.find(function(t) { return t.muc === muc2; }) : null;
    if (!tl2) return '';
    var ds2 = md.dsNhomDE || 0;
    var pct2 = tl2.dsMin > 0 ? Math.min(100, Math.round(ds2 / tl2.dsMin * 100)) : 0;
    var remain2 = Math.max(0, tl2.dsMin - ds2);
    return '<div class="tl-strip">' +
      '<div class="tl-strip-title">VIP Shop · ' + muc2 + ' — Hoàn N1 ' + tl2.ckN1 + '% / N2 ' + tl2.ckN2 + '%</div>' +
      '<div class="tl-strip-bar"><div class="tl-strip-fill" style="width:' + pct2 + '%"></div></div>' +
      '<div class="tl-strip-hint">' + fmt(ds2) + 'đ / ' + fmt(tl2.dsMin) + 'đ (' + pct2 + '%)' + (remain2 > 0 ? ' · Còn cần ' + fmt(remain2) + 'đ' : ' · Đạt mức') + '</div>' +
      '</div>';
  }

  if (p.nhom === 'A' && kh.programs.sbpsShop && kh.programs.sbpsShop.dangKy) {
    var muc3 = kh.programs.sbpsShop.muc;
    var tl3 = (typeof SBPS_TICHLUY !== 'undefined') ? SBPS_TICHLUY.find(function(t) { return t.muc === muc3; }) : null;
    if (!tl3) return '';
    var ds3 = md.dsSBPS || 0;
    var pct3 = tl3.dsMin > 0 ? Math.min(100, Math.round(ds3 / tl3.dsMin * 100)) : 0;
    var remain3 = Math.max(0, tl3.dsMin - ds3);
    return '<div class="tl-strip">' +
      '<div class="tl-strip-title">SBPS Shop · Mức ' + muc3 + ' — N1 ' + tl3.ckN1 + '% / N2 ' + tl3.ckN2 + '% / N3 ' + tl3.ckN3 + '%</div>' +
      (tl3.ck26 > 0 ? '<div class="tl-strip-desc">Đến ngày 26: +' + tl3.ck26 + '%</div>' : '') +
      '<div class="tl-strip-bar"><div class="tl-strip-fill" style="width:' + pct3 + '%"></div></div>' +
      '<div class="tl-strip-hint">' + fmt(ds3) + 'đ / ' + fmt(tl3.dsMin) + 'đ (' + pct3 + '%)' + (remain3 > 0 ? ' · Còn cần ' + fmt(remain3) + 'đ' : ' · Đạt mức') + '</div>' +
      '</div>';
  }
  return '';
}

window.buildCartDisplaySnapshot = buildCartDisplaySnapshot;
window.buildOrderAwareKmDisplay = buildOrderAwareKmDisplay;
window.buildPriceTable = buildPriceTable;
window.buildTLStrip = buildTLStrip;
window.getProductPromoRefs = getProductPromoRefs;
window.getAppliedPromoRefsByNames = getAppliedPromoRefsByNames;
window.renderPromoJumpChips = renderPromoJumpChips;
window.formatQtyByCarton = formatQtyByCarton;
window.getCartonRoundHint = getCartonRoundHint;