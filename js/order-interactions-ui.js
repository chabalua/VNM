// ============================================================
// ORDER INTERACTIONS UI HELPERS
// Draft cart, preview pricing, and card expand handlers
// ============================================================

function buildDraftCartState(ma, qT, qL) {
  var nextCart = {};
  Object.keys(cart || {}).forEach(function(code) {
    var item = cart[code] || {};
    nextCart[code] = { qT: Math.max(0, parseInt(item.qT, 10) || 0), qL: Math.max(0, parseInt(item.qL, 10) || 0) };
  });
  if (qT > 0 || qL > 0) nextCart[ma] = { qT: qT, qL: qL };
  else delete nextCart[ma];
  return nextCart;
}

function toggleCard(ma) {
  var orderUIState = getOrderUIState();
  orderUIState.cardExpanded[ma] = !orderUIState.cardExpanded[ma];
  var expandEl = document.getElementById('expand_' + ma);
  var cardBtn = document.getElementById('b_' + ma);
  var icon = cardBtn ? cardBtn.querySelector('.expand-icon') : null;

  if (!expandEl) return;
  if (orderUIState.cardExpanded[ma]) {
    expandEl.style.display = 'block';
    if (cardBtn) cardBtn.classList.add('expanded');

    if (icon) icon.style.transform = 'rotate(180deg)';

    var p = null;
    for (var i = 0; i < SP.length; i++) { if (SP[i].ma === ma) { p = SP[i]; break; } }
    if (p) {
      var eT2 = document.getElementById('qT_' + ma);
      var eL2 = document.getElementById('qL_' + ma);
      var qT2 = parseInt((eT2 && eT2.value) || 0, 10);
      var qL2 = parseInt((eL2 && eL2.value) || 0, 10);
      var useQT = (qT2 > 0 || qL2 > 0) ? qT2 : 1;
      var useQL = (qT2 > 0 || qL2 > 0) ? qL2 : 0;
      var snapshot = buildCartDisplaySnapshot(p, buildDraftCartState(ma, useQT, useQL), useQT, useQL);
      var kmTop = snapshot.kmForTable;
      var ptEl = document.getElementById('pt_' + ma);
      if (ptEl) ptEl.innerHTML = buildPriceTable(p, kmTop, !(qT2 > 0 || qL2 > 0));
    }
  } else {
    expandEl.style.display = 'none';
    if (cardBtn) cardBtn.classList.remove('expanded');
    if (icon) icon.style.transform = 'rotate(0deg)';
  }
}

function onQty(ma) {
  var eT = document.getElementById('qT_' + ma);
  var eL = document.getElementById('qL_' + ma);
  var qT = parseInt((eT && eT.value) || 0, 10);
  var qL = parseInt((eL && eL.value) || 0, 10);

  var pv = document.getElementById('pv_' + ma);
  var card = document.getElementById('card_' + ma);
  var p = null;
  for (var i = 0; i < SP.length; i++) { if (SP[i].ma === ma) { p = SP[i]; break; } }
  if (!p || !pv) return;

  var totalLon = qT * p.slThung + qL;
  var pt = document.getElementById('pt_' + ma);

  if (totalLon <= 0) {
    pv.style.display = 'none';
    if (card) {
      if (!cart[ma] || (cart[ma].qT === 0 && cart[ma].qL === 0)) {
        card.classList.remove('inCart');
      }
    }
    if (pt) pt.innerHTML = buildPriceTable(p, calcKM(p, 0, 0), true);
    return;
  }

  if (card) card.classList.add('inCart');

  var draftState = buildDraftCartState(ma, qT, qL);
  var pricing = buildCartDisplaySnapshot(p, draftState, qT, qL);
  var kmInfo = pricing.kmInfo;
  var draftOrderKM = pricing.draftOrderKM;
  if (pt) pt.innerHTML = buildPriceTable(p, pricing.kmForTable);
  var totalDisc = kmInfo.disc + pricing.orderExtraDisc;
  var hasOrderBonus = draftOrderKM && draftOrderKM.bonusItems && draftOrderKM.bonusItems.length > 0;
  var hasDis = totalDisc > 0 || kmInfo.bonus > 0 || kmInfo.bonusItems.length > 0 || hasOrderBonus;

  var goc = pricing.gross;
  var tgt = pricing.subtotal;
  var VAT_RATE = typeof VAT !== 'undefined' ? VAT : 0.015;
  var vatAmt = Math.round(tgt * VAT_RATE);
  var total = tgt + vatAmt;

  var ht = '<div class="pv-row" style="margin-bottom:8px"><span class="pv-l" style="font-weight:600">Tạm tính:</span><span class="pv-total">' + fmt(total) + 'đ</span></div>';

  if (hasDis) {
    ht += '<div class="pv-row"><span class="pv-l">Mua gốc:</span><span class="pv-v">' + fmt(goc) + 'đ</span></div>';
    ht += '<div class="pv-row"><span class="pv-l">Trừ KM:</span><span class="pv-v" style="color:var(--danger-text)">-' + fmt(totalDisc) + 'đ</span></div>';
    ht += '<div class="pv-row"><span class="pv-l">Chưa VAT:</span><span class="pv-v">' + fmt(tgt) + 'đ</span></div>';
  } else {
    ht += '<div class="pv-row"><span class="pv-l">Tiền SP:</span><span class="pv-v">' + fmt(tgt) + 'đ</span></div>';
  }
  ht += '<div class="pv-row"><span class="pv-l">VAT (1.5%):</span><span class="pv-v">' + fmt(vatAmt) + 'đ</span></div>';

  if (kmInfo.desc || kmInfo.bonusItems.length > 0 || hasOrderBonus) {
    ht += '<div class="km-alert">';
    if (kmInfo.desc) {
      var descShow = kmInfo.desc;
      if (kmInfo.bonus > 0 && typeof formatQtyByCarton === 'function') {
        var rawBonusPfx = 'Tặng ' + kmInfo.bonus + ' ' + (p.donvi || 'hộp');
        descShow = descShow.replace(rawBonusPfx, '🎁 Tặng ' + formatQtyByCarton(p, kmInfo.bonus));
      }
      ht += '<div class="km-alert-title">' + escapeHtml(descShow) + '</div>';
    }
    if (kmInfo.bonusItems.length > 0) {
      kmInfo.bonusItems.forEach(function(bi) {
        var bip = (bi.ma && typeof spFind === 'function') ? spFind(bi.ma) : null;
        var biqStr = bip ? formatQtyByCarton(bip, bi.qty) : (bi.qty + ' hộp');
        var nameStr = (bi.ma && bi.ma !== ma) ? ' ' + escapeHtml(bi.name || '') : '';
        ht += '<div class="km-desc">🎁 Tặng ' + biqStr + nameStr + '</div>';
      });
    }
    if (hasOrderBonus) {
      draftOrderKM.bonusItems.forEach(function(bi) {
        var bip = bi.ma ? spFind(bi.ma) : null;
        var biqStr = bip ? formatQtyByCarton(bip, bi.qty) : (bi.qty + ' SP');
        var nameStr = bi.name ? ' ' + escapeHtml(bi.name) : '';
        var progStr = bi.progName ? ' <span style="font-size:10px;color:var(--n3)">[' + escapeHtml(bi.progName) + ']</span>' : '';
        ht += '<div class="km-desc">🎁 Ontop: +' + escapeHtml(biqStr) + nameStr + progStr + '</div>';
      });
    }
    ht += '</div>';
  }

  if (!cart[ma] || (cart[ma].qT !== qT || cart[ma].qL !== qL)) {
    ht += '<div style="font-size:11px;color:var(--warning-text);margin-top:6px;font-style:italic">Chưa "Thêm" vào giỏ</div>';
  }

  pv.innerHTML = ht;
  pv.style.display = 'block';
}

window.buildDraftCartState = buildDraftCartState;
window.toggleCard = toggleCard;
window.onQty = onQty;