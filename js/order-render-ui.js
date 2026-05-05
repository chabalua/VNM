// ============================================================
// ORDER RENDER UI HELPERS
// HTML builders for order sections and product cards
// ============================================================

function getOrderSectionMeta(nhom) {
  var sectionMeta = {
    A: { label: 'Sữa bột', color: '#2563EB' },
    B: { label: 'Sữa đặc', color: '#C97B0A' },
    C: { label: 'Sữa nước', color: '#F26322' },
    D: { label: 'Sữa chua', color: '#D63030' },
    X: { label: 'Khác', color: '#888' }
  };
  return sectionMeta[nhom] || { label: nhom || 'Khác', color: '#888' };
}

function buildOrderQuickPriceHTML(product, pricing, cartItem) {
  var qT = cartItem.qT || 0;
  var qL = cartItem.qL || 0;
  var totalLon = pricing.totalLon;
  var afterKM = pricing.subtotal;
  var gross = pricing.gross;
  var vatRate = typeof VAT !== 'undefined' ? VAT : 0.015;
  var vatOnly = Math.round(afterKM * vatRate);

  var html = '<div class="sp-quick-price">';
  html += '<div><div class="qp-meta">' + (qT > 0 ? qT + ' thùng' : '') + (qT > 0 && qL > 0 ? ' + ' : '') + (qL > 0 ? qL + ' lẻ' : '') + ' = ' + totalLon + ' ' + escapeHtml(product.donvi) + '</div>';
  html += '<div class="sp-qp-main">' + fmt(afterKM) + 'đ</div></div>';
  html += '<div class="qp-right">';
  if (gross > afterKM) html += '<div class="sp-qp-sub">' + fmt(gross) + 'đ</div>';
  html += '<div class="sp-qp-vat">+Thuế: ' + fmt(vatOnly) + 'đ</div>';
  html += '</div></div>';
  return html;
}

function buildOrderProductCardHTML(product, options) {
  var inCart = options.inCart;
  var isFav = options.isFav;
  var pricing = options.pricing;
  var kmInfo = options.kmInfo;
  var brand = options.brand;
  var appliedCTs = options.appliedCTs;
  var isExpanded = options.isExpanded;
  var selectedCustomerMa = options.selectedCustomerMa;
  var sectionMeta = options.sectionMeta;
  var eMa = escapeHtmlAttr(product.ma);

  var html = '<div class="sp-card ' + (inCart ? 'inCart' : '') + '" id="card_' + eMa + '">';
  html += '<div class="sp-head" onclick="toggleCard(\'' + eMa + '\')">';
  html += '<div class="sp-bar" style="background:' + sectionMeta.color + '"></div>';
  html += '<div class="sp-body">';
  html += '<div class="sp-name-row">';
  html += '<div class="sp-name">' + escapeHtml(product.ten);
  html += '<span class="fav-star' + (isFav ? ' active' : '') + '" onclick="toggleFavorite(event, \'' + eMa + '\')">★</span>';
  html += '</div>';
  html += '<button id="toggle_' + eMa + '" class="sp-toggle' + (isExpanded ? ' open' : '') + '" onclick="event.stopPropagation();toggleCard(\'' + eMa + '\')">';
  html += '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2.5 4L6 7.5L9.5 4"/></svg>';
  html += '</button>';
  html += '</div>';

  html += '<div class="sp-meta">';
  html += '<span class="sp-chip">' + escapeHtml(product.ma) + '</span>';
  html += '<span class="sp-chip">' + product.slThung + '/' + escapeHtml(product.donvi) + '</span>';
  if (brand) html += '<span class="sp-chip">' + escapeHtml(brand) + '</span>';
  appliedCTs.slice(0, 3).forEach(function(item) {
    html += '<span class="sp-kmbadge">' + escapeHtml(item.prog.name || 'KM') + '</span>';
  });
  if (appliedCTs.length > 3) html += '<span class="sp-kmbadge">+' + (appliedCTs.length - 3) + '</span>';
  if (inCart) {
    var cartItem = cart[product.ma];
    var cartLon = (cartItem.qT || 0) * product.slThung + (cartItem.qL || 0);
    html += '<span class="sp-cartbadge">✓ ' + cartLon + ' ' + escapeHtml(product.donvi) + '</span>';
  }
  html += '</div>';
  html += '</div></div>';

  if (inCart && !isExpanded) {
    html += buildOrderQuickPriceHTML(product, pricing, cart[product.ma]);
  }

  html += '<div class="sp-expand' + (isExpanded ? ' open' : '') + '" id="expand_' + eMa + '">';
  html += '<div id="pt_' + eMa + '">' + buildPriceTable(product, kmInfo, !inCart) + '</div>';

  if (appliedCTs.length) {
    html += '<div id="km-line_' + eMa + '">';
    html += renderPromoJumpChips(appliedCTs.map(function(item) {
      return { idx: item.idx, name: item.prog.name || 'CT KM' };
    }), 4);
    html += '</div>';
  }

  var tlStrip = buildTLStrip(product);
  if (tlStrip) html += tlStrip;
  else if (!selectedCustomerMa) html += '<div class="sp-no-kh">Chọn khách hàng để xem thưởng tích lũy tháng</div>';

  html += '<div class="qty-area">';
  html += '<div class="qbox"><span class="qlbl">Thùng</span><input class="qinp" type="number" min="0" max="999" inputmode="numeric" placeholder="0" id="qT_' + eMa + '" oninput="onQty(\'' + eMa + '\')"></div>';
  html += '<div class="qbox"><span class="qlbl">Lẻ</span><input class="qinp" type="number" min="0" max="9999" inputmode="numeric" placeholder="0" id="qL_' + eMa + '" oninput="onQty(\'' + eMa + '\')"></div>';
  html += '<button class="btn-add" onclick="addCart(\'' + eMa + '\')">＋</button>';
  html += '</div>';
  html += '<div class="pv-box" id="pv_' + eMa + '"></div>';
  html += '</div></div>';
  return html;
}

function buildOrderSectionHTML(nhom, products, options) {
  if (!products || !products.length) return '';
  var sectionMeta = getOrderSectionMeta(nhom);
  var html = '<div class="order-section">';
  html += '<div class="order-sec-hd"><span style="display:inline-block;width:3.5px;height:14px;border-radius:2px;background:' + sectionMeta.color + ';margin-right:4px"></span>' + sectionMeta.label + ' (' + products.length + ')</div>';
  products.forEach(function(product) {
    var inCart = cart[product.ma] && (cart[product.ma].qT > 0 || cart[product.ma].qL > 0);
    var pricing = null;
    var kmInfo = calcKM(product, 0, 0, buildOrderContextFromCart(product.ma));
    if (inCart) {
      pricing = buildCartDisplaySnapshot(product, cart, cart[product.ma].qT || 0, cart[product.ma].qL || 0);
      kmInfo = pricing.kmForTable;
    }
    html += buildOrderProductCardHTML(product, {
      inCart: inCart,
      isFav: options.favorites.includes(product.ma),
      pricing: pricing,
      kmInfo: kmInfo,
      brand: detectBrand(product),
      appliedCTs: getProductPromoRefs(product.ma),
      isExpanded: options.orderUIState.cardExpanded[product.ma] !== undefined ? options.orderUIState.cardExpanded[product.ma] : false,
      selectedCustomerMa: options.selectedCustomerMa,
      sectionMeta: sectionMeta
    });
  });
  html += '</div>';
  return html;
}

function restoreOrderCartInputs() {
  for (var ma in cart) {
    var cartItem = cart[ma];
    if (!cartItem.qT && !cartItem.qL) continue;
    var iT = document.getElementById('qT_' + ma);
    var iL = document.getElementById('qL_' + ma);
    if (iT) iT.value = cartItem.qT || '';
    if (iL) iL.value = cartItem.qL || '';
  }
}

window.buildOrderSectionHTML = buildOrderSectionHTML;
window.restoreOrderCartInputs = restoreOrderCartInputs;