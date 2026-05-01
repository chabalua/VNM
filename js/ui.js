// ============================================================
// UI v7 — Đặt hàng (brand filter + KH selector) + Quản lý SP
// Redesign: card dropdown, price table 3 cột, CT strip inline
// ============================================================

var nhomF = { order: '', adm: '' };
var brandF = '';
var _searchTimer = null;
var _spEditMa = null;
var _selectedCustomerMa = '';
var _cardExpanded = {};
var CUSTOM_BRAND_RULES_KEY = LS_KEYS.BRAND_RULES;

// ============================================================
// BRAND CLASSIFICATION
// ============================================================
var BRAND_RULES = [
  { brand: 'Optimum',      nhom: 'A', match: function(p) { return /optimum|02.O/i.test(p.ten + p.ma); } },
  { brand: 'Dielac Gold',  nhom: 'A', match: function(p) { return /dielac.*gold|ridielac|03C/i.test(p.ten + p.ma) && !/alpha|grow/i.test(p.ten); } },
  { brand: 'D.Alpha',      nhom: 'A', match: function(p) { return /alpha|02.A|02DA|02EA|02BA/i.test(p.ten + p.ma) && !/gold/i.test(p.ten); } },
  { brand: 'D.Alpha Gold', nhom: 'A', match: function(p) { return /alpha.*gold|02DG|02EG/i.test(p.ten + p.ma); } },
  { brand: 'Grow Plus',    nhom: 'A', match: function(p) { return /grow.*plus|02ER6|02ER7|02DR6|02DR7/i.test(p.ten + p.ma); } },
  { brand: 'Yoko',         nhom: 'A', match: function(p) { return /yoko|02.Y/i.test(p.ten + p.ma) && p.nhom === 'A'; } },
  { brand: 'Sure/Diecerna',nhom: 'A', match: function(p) { return /sure|diecerna|02AD|02AU|02EU|02ED/i.test(p.ten + p.ma); } },
  { brand: 'CanPro/Mama',  nhom: 'A', match: function(p) { return /canxi|can.*pro|mama|02AC|02EC|02AM|02EM/i.test(p.ten + p.ma); } },
  { brand: 'Ông Thọ',      nhom: 'B', match: function(p) { return /ông thọ|ong tho|01T|01C/i.test(p.ten + p.ma) && p.nhom === 'B'; } },
  { brand: 'NSPN',         nhom: 'B', match: function(p) { return /NSPN|ngôi sao|01S/i.test(p.ten + p.ma) && p.nhom === 'B'; } },
  { brand: 'Tài Lộc',      nhom: 'B', match: function(p) { return /tài lộc|tai loc|01TL/i.test(p.ten + p.ma); } },
  { brand: 'STT 100%',     nhom: 'C', match: function(p) { return /STT|sữa tươi|tươi 100|04E/i.test(p.ten + p.ma) && !/green|GF|fino|ADM|flex/i.test(p.ten); } },
  { brand: 'Green Farm',   nhom: 'C', match: function(p) { return /green.*farm|GF|04G|04AE|organic/i.test(p.ten + p.ma); } },
  { brand: 'ADM',          nhom: 'C', match: function(p) { return /ADM|04C|04AD/i.test(p.ten + p.ma) && p.nhom === 'C'; } },
  { brand: 'Fino',         nhom: 'C', match: function(p) { return /fino|04F/i.test(p.ten + p.ma) && p.nhom === 'C'; } },
  { brand: 'Flex',         nhom: 'C', match: function(p) { return /flex|04L/i.test(p.ten + p.ma); } },
  { brand: 'SĐN/Hạt',     nhom: 'C', match: function(p) { return /đậu nành|soy|hạt|hat|05A|05D|05B|05F|05M/i.test(p.ten + p.ma); } },
  { brand: 'Probi',        nhom: 'D', match: function(p) { return /probi|07U/i.test(p.ten + p.ma); } },
  { brand: 'SCA Trắng',    nhom: 'D', match: function(p) { return /SCA.*trắng|SCA.*KĐ|SCA.*CĐ|07TR|07KD|07ID/i.test(p.ten + p.ma); } },
  { brand: 'Susu/Hero',    nhom: 'D', match: function(p) { return /susu|hero|06U|08H|06S/i.test(p.ten + p.ma); } },
  { brand: 'Yomilk',       nhom: 'D', match: function(p) { return /yomilk|06V/i.test(p.ten + p.ma); } },
  { brand: 'SCA Trái cây', nhom: 'D', match: function(p) { return /SCA.*dâu|SCA.*nha|SCA.*lựu|07DA|07NC|07ND|07CR|07PH/i.test(p.ten + p.ma); } },
];

function detectBrand(p) {
  if (hasManualBrand(p)) return p.phanLoai;
  var customBrand = detectCustomBrand(p);
  if (customBrand) return customBrand;
  if (p._brand) return p._brand;
  for (var i = 0; i < BRAND_RULES.length; i++) {
    if (BRAND_RULES[i].match(p)) { p._brand = BRAND_RULES[i].brand; return p._brand; }
  }
  p._brand = '';
  return '';
}

function hasManualBrand(p) {
  return !!(p && p.phanLoai && p.phanLoaiTuNhap === true);
}

function normalizeBrandMatchText(value) {
  return String(value || '').toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ' ').replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function normalizeCustomBrandRule(rule) {
  if (!rule || typeof rule !== 'object') return null;
  var brand = String(rule.brand || '').trim();
  var nhom = String(rule.nhom || '').trim().toUpperCase();
  var rawPatterns = Array.isArray(rule.patterns) ? rule.patterns : String(rule.patterns || rule.keywords || '').split(/[\n,;]+/);
  var seen = {};
  var patterns = rawPatterns.map(function(token) { return normalizeBrandMatchText(token); })
    .filter(function(token) { if (!token || seen[token]) return false; seen[token] = true; return true; });
  if (!brand || !patterns.length) return null;
  if (!/^[ABCD]$/.test(nhom)) nhom = '';
  return { brand: brand, nhom: nhom, patterns: patterns };
}

function getCustomBrandRules() {
  try {
    var data = JSON.parse(localStorage.getItem(CUSTOM_BRAND_RULES_KEY) || '[]');
    if (!Array.isArray(data)) return [];
    return data.map(normalizeCustomBrandRule).filter(Boolean);
  } catch (e) { return []; }
}

function clearDetectedBrandCache() {
  if (!Array.isArray(SP)) return;
  SP.forEach(function(product) { delete product._brand; });
}

function saveCustomBrandRules(rules) {
  var normalized = Array.isArray(rules) ? rules.map(normalizeCustomBrandRule).filter(Boolean) : [];
  localStorage.setItem(CUSTOM_BRAND_RULES_KEY, JSON.stringify(normalized));
  clearDetectedBrandCache();
  return normalized;
}

function getBrandMatchSource(p) {
  return normalizeBrandMatchText((p && p.ten) + ' ' + (p && p.ma));
}

function detectCustomBrand(p) {
  var rules = getCustomBrandRules();
  if (!rules.length) return '';
  var source = getBrandMatchSource(p);
  for (var i = 0; i < rules.length; i++) {
    var rule = rules[i];
    if (rule.nhom && p.nhom !== rule.nhom) continue;
    for (var j = 0; j < rule.patterns.length; j++) {
      if (source.indexOf(rule.patterns[j]) >= 0) return rule.brand;
    }
  }
  return '';
}

function getBrandsForNhom(nhom) {
  var seen = {}, brands = [];
  SP.forEach(function(p) {
    if (nhom && p.nhom !== nhom) return;
    var b = detectBrand(p);
    if (b && !seen[b]) { seen[b] = true; brands.push(b); }
  });
  return brands.sort();
}

function getSuggestedBrands(nhom) {
  var seen = {}, brands = [];
  BRAND_RULES.forEach(function(rule) {
    if (nhom && rule.nhom !== nhom) return;
    if (seen[rule.brand]) return;
    seen[rule.brand] = true; brands.push(rule.brand);
  });
  getBrandsForNhom(nhom).forEach(function(brand) {
    if (seen[brand]) return;
    seen[brand] = true; brands.push(brand);
  });
  return brands.sort();
}

function spRefreshPhanLoaiSuggestions(nhom) {
  var list = document.getElementById('spf-phanloai-list');
  if (!list) return;
  list.innerHTML = getSuggestedBrands(nhom).map(function(brand) {
    return '<option value="' + brand.replace(/"/g, '&quot;') + '"></option>';
  }).join('');
}

function getCUS() {
  return (typeof CUS !== 'undefined' && Array.isArray(CUS)) ? CUS : [];
}

// ============================================================
// DEBOUNCE + FILTER
// ============================================================
function debounceRender(tab) {
  clearTimeout(_searchTimer);
  _searchTimer = setTimeout(function() {
    if (tab === 'order') renderOrder();
    else renderAdm();
  }, 250);
}

function setNhom(el, tab, nhom) {
  nhomF[tab] = nhom;
  brandF = '';
  el.closest('.pills').querySelectorAll('.pill').forEach(function(p) { p.className = 'pill'; });
  el.className = 'pill on-' + (nhom || 'all');
  if (tab === 'order') { renderBrandPills(); renderOrder(); }
  else renderAdm();
}

function setBrand(brand) {
  brandF = (brandF === brand) ? '' : brand;
  renderBrandPills();
  renderOrder();
}

function renderBrandPills() {
  var el = document.getElementById('brand-pills'); if (!el) return;
  var brands = getBrandsForNhom(nhomF.order);
  if (!brands.length) { el.innerHTML = ''; el.style.display = 'none'; return; }
  el.style.display = 'flex';
  el.innerHTML = brands.map(function(b) {
    var active = brandF === b;
    return '<div class="pill ' + (active ? 'on-C' : '') + '" onclick="setBrand(\'' + escapeHtmlAttr(b) + '\')">' + escapeHtml(b) + '</div>';
  }).join('');
}

// ============================================================
// CUSTOMER SELECTOR
// ============================================================
function renderCustomerSelector() {
  var el = document.getElementById('cus-selector'); if (!el) return;
  var cusList = getCUS();
  if (!cusList.length) {
    el.innerHTML = '<div style="font-size:11px;color:var(--n4);padding:4px 0 2px">Chưa có KH. Vào tab Khách hàng để thêm.</div>';
    return;
  }
  var selected = cusList.find(function(k) { return k.ma === _selectedCustomerMa; });
  var routes = (typeof ROUTES !== 'undefined' && Array.isArray(ROUTES)) ? ROUTES : [];

  // Build selector box
  var html = '<div class="cus-selector-wrap">';
  html += '<div class="cus-selector-box' + (selected ? ' has-kh' : '') + '" onclick="document.getElementById(\'order-kh-select\').focus()">';
  html += '<div class="cus-dot' + (selected ? ' active' : '') + '"></div>';
  if (selected) {
    html += '<div class="cus-sel-name">' + escapeHtml(selected.ten || selected.ma) + '</div>';
    var tags = [];
    if (selected.programs && selected.programs.vnmShop && selected.programs.vnmShop.dangKy) tags.push('VNM ' + (selected.programs.vnmShop.mucBayBan || ''));
    if (selected.programs && selected.programs.vipShop && selected.programs.vipShop.dangKy) tags.push('VIP ' + (selected.programs.vipShop.mucBayBan || ''));
    if (selected.programs && selected.programs.sbpsShop && selected.programs.sbpsShop.dangKy) tags.push('SBPS');
    if (tags.length) html += '<div class="cus-sel-tags">' + tags.map(function(t) { return '<span class="cus-sel-tag">' + escapeHtml(t) + '</span>'; }).join('') + '</div>';
    html += '<button class="cus-clear-btn" onclick="event.stopPropagation();onSelectCustomer(\'\')">✕</button>';
  } else {
    html += '<div class="cus-sel-empty">Chọn khách hàng...</div>';
  }
  html += '</div>';

  // Dropdown select (hidden visual, real select)
  html += '<select id="order-kh-select" onchange="onSelectCustomer(this.value)">';
  html += '<option value="">— Chọn khách hàng —</option>';
  var grouped = {};
  cusList.forEach(function(k) { var r = k.tuyen || '_'; if (!grouped[r]) grouped[r] = []; grouped[r].push(k); });
  routes.forEach(function(r) {
    if (!grouped[r.id]) return;
    html += '<optgroup label="📍 ' + escapeHtmlAttr(r.ten) + '">';
    grouped[r.id].forEach(function(k) {
      html += '<option value="' + escapeHtmlAttr(k.ma) + '"' + (k.ma === _selectedCustomerMa ? ' selected' : '') + '>' + escapeHtml(k.ten || k.ma) + '</option>';
    });
    html += '</optgroup>';
  });
  if (grouped['_']) {
    html += '<optgroup label="Chưa phân tuyến">';
    grouped['_'].forEach(function(k) {
      html += '<option value="' + escapeHtmlAttr(k.ma) + '"' + (k.ma === _selectedCustomerMa ? ' selected' : '') + '>' + escapeHtml(k.ten || k.ma) + '</option>';
    });
    html += '</optgroup>';
  }
  html += '</select>';
  html += '</div>';
  el.innerHTML = html;
}

function onSelectCustomer(ma) {
  _selectedCustomerMa = ma;
  window._selectedCustomerMa = ma;
  renderCustomerSelector();
  renderOrder();
}

// ============================================================
// PRICE TABLE — 3 cột: Gốc / Sau KM / +Thuế
// ============================================================
function buildPriceTable(p, km) {
  var VAT_RATE = typeof VAT !== 'undefined' ? VAT : 0.015;
  var hopGoc = p.giaNYLon;
  var thungGoc = p.giaNYThung;
  var hopKM = km.hopKM;
  var thungKM = km.thungKM;

  var hopVat = Math.round(hopKM * (1 + VAT_RATE));
  var thungVat = Math.round(thungKM * (1 + VAT_RATE));

  var hasDiscount = hopKM < hopGoc || km.bonus > 0;
  var savePerThung = (hopGoc - hopKM) * p.slThung;

  var rows = '';
  // Thùng row (highlight)
  rows += '<tr class="ptbl-row ptbl-main">';
  rows += '<td>Thùng ' + p.slThung + '</td>';
  rows += '<td>' + fmt(thungGoc) + 'đ</td>';
  rows += '<td>' + (hasDiscount ? fmt(thungKM) + 'đ' : '—') + '</td>';
  rows += '<td>' + fmt(thungVat) + 'đ</td>';
  rows += '</tr>';

  // Lốc row (nếu có)
  if (p.locSize) {
    var locGoc = hopGoc * p.locSize;
    var locKM = hopKM * p.locSize;
    var locVat = Math.round(locKM * (1 + VAT_RATE));
    rows += '<tr class="ptbl-row">';
    rows += '<td>' + (p.locLabel || 'Lốc') + ' ' + p.locSize + '</td>';
    rows += '<td>' + fmt(locGoc) + 'đ</td>';
    rows += '<td>' + (hasDiscount ? fmt(locKM) + 'đ' : '—') + '</td>';
    rows += '<td>' + fmt(locVat) + 'đ</td>';
    rows += '</tr>';
  }

  // Đơn vị lẻ
  rows += '<tr class="ptbl-row">';
  rows += '<td>' + escapeHtml(p.donvi) + '</td>';
  rows += '<td>' + fmt(hopGoc) + 'đ</td>';
  rows += '<td>' + (hasDiscount ? fmt(hopKM) + 'đ' : '—') + '</td>';
  rows += '<td>' + fmt(hopVat) + 'đ</td>';
  rows += '</tr>';

  var saveRow = '';
  if (km.desc) {
    var saveText = km.desc;
    if (savePerThung > 0) saveText += ' · Tiết kiệm ' + fmt(savePerThung) + 'đ/thùng';
    saveRow = '<tr><td colspan="4" class="ptbl-save">' + escapeHtml(saveText) + '</td></tr>';
  } else if (savePerThung > 0) {
    saveRow = '<tr><td colspan="4" class="ptbl-save">Tiết kiệm ' + fmt(savePerThung) + 'đ/thùng</td></tr>';
  }

  return '<table class="ptbl">' +
    '<tr class="ptbl-hdr"><td></td><td>Gốc</td><td>Sau KM</td><td>+Thuế</td></tr>' +
    rows + saveRow +
    '</table>';
}

// ============================================================
// TÍCH LŨY CT STRIP — hiện khi có KH và SP thuộc CT
// ============================================================
function buildTLStrip(p) {
  if (!_selectedCustomerMa) return '';
  var cusList = getCUS();
  var kh = cusList.find(function(k) { return k.ma === _selectedCustomerMa; });
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

// ============================================================
// TOGGLE CARD
// ============================================================
function toggleCard(ma) {
  _cardExpanded[ma] = !_cardExpanded[ma];
  var expandEl = document.getElementById('expand_' + ma);
  var toggleBtn = document.getElementById('toggle_' + ma);
  if (!expandEl) return;
  if (_cardExpanded[ma]) {
    expandEl.classList.add('open');
    if (toggleBtn) toggleBtn.classList.add('open');
  } else {
    expandEl.classList.remove('open');
    if (toggleBtn) toggleBtn.classList.remove('open');
  }
}

// ============================================================
// onQty — tính giá preview khi nhập SL
// ============================================================
function onQty(ma) {
  var p = spFind(ma); if (!p) return;
  var qT = parseInt(document.getElementById('qT_' + ma) && document.getElementById('qT_' + ma).value) || 0;
  var qL = parseInt(document.getElementById('qL_' + ma) && document.getElementById('qL_' + ma).value) || 0;
  if (qT < 0) { var eTQ = document.getElementById('qT_' + ma); if (eTQ) eTQ.value = 0; qT = 0; }
  if (qL < 0) { var eLQ = document.getElementById('qL_' + ma); if (eLQ) eLQ.value = 0; qL = 0; }

  var pv = document.getElementById('pv_' + ma); if (!pv) return;
  if (!qT && !qL) {
    pv.classList.remove('show');
    // Khôi phục km-line về tất cả CT khi xóa số lượng
    var kmLineReset = document.getElementById('km-line_' + ma);
    if (kmLineReset) {
      var allRefsReset = getProductPromoRefs(ma);
      kmLineReset.innerHTML = allRefsReset.length ? renderPromoJumpChips(allRefsReset.map(function(r) { return { idx: r.idx, name: r.prog.name || 'CT KM' }; }), 4) : '';
    }
    return;
  }

  var km = calcKM(p, qT, qL);
  var draftCart = buildDraftCartState(ma, qT, qL);
  var draftItems = (typeof getItemsFromCartState === 'function') ? getItemsFromCartState(draftCart) : [];
  var orderKM = (typeof calcOrderKM === 'function') ? calcOrderKM(draftItems) : { disc: 0, desc: '', bonusItems: [] };

  // Tính draftKm sớm để dùng hopKM đã phản ánh đầy đủ order-level KM
  var draftKm = buildOrderAwareKmDisplay(p, km, draftItems, orderKM);

  var totalLon = qT * p.slThung + qL;
  var bonusLon = km.bonus || 0;
  var orderBonusSameQty = 0;
  var lineBonusItems = Array.isArray(km.bonusItems) ? km.bonusItems : [];
  (orderKM.bonusItems || []).forEach(function(bi) {
    if (bi && bi.ma === p.ma) orderBonusSameQty += Math.max(0, parseInt(bi.qty, 10) || 0);
  });
  var totalNhan = totalLon + bonusLon + orderBonusSameQty;

  var VAT_RATE = typeof VAT !== 'undefined' ? VAT : 0.015;
  var gocTotal = p.giaNYLon * totalLon;
  var afterKM = gocTotal - km.disc;
  // Giá hiệu lực = hopKM × qty mua thực tế; chỉ dùng hopKM khi có discount tiền thực sự
  var hasMonetaryDisc = km.disc > 0 || (draftKm.orderDiscAllocated || 0) > 0 || (draftKm.orderGiftValueAllocated || 0) > 0;
  var effectiveTotal = (hasMonetaryDisc && draftKm.hopKM < p.giaNYLon) ? draftKm.hopKM * totalLon : afterKM;
  var vatTotal = Math.round(effectiveTotal * (1 + VAT_RATE));
  var saved = gocTotal - effectiveTotal;

  // Build preview HTML
  var html = '';
  html += '<div class="pv-row"><span class="pv-l">Mua</span><span style="font-size:11px;color:var(--n2)">' + (typeof formatQtyByCarton === 'function' ? formatQtyByCarton(p, totalLon) : totalLon + ' ' + p.donvi) + '</span></div>';

  if (bonusLon > 0) {
    html += '<div class="pv-row"><span class="pv-l">Tặng KM</span><div><span class="pv-bonus-tag">+' + (typeof formatQtyByCarton === 'function' ? formatQtyByCarton(p, bonusLon) : bonusLon + ' ' + p.donvi) + '</span></div></div>';
  }
  lineBonusItems.forEach(function(bi) {
    if (bi.ma !== p.ma) {
      html += '<div class="pv-row"><span class="pv-l">Tặng SP</span><span class="pv-bonus-tag">+' + bi.qty + ' ' + escapeHtml(bi.name || bi.ma) + '</span></div>';
    }
  });
  (orderKM.bonusItems || []).forEach(function(bi) {
    if (!bi) return;
    if (bi.ma && bi.ma === p.ma) return; // same-product order bonus đã tính vào orderBonusSameQty
    html += '<div class="pv-row"><span class="pv-l">Quà đơn</span><span class="pv-bonus-tag" style="background:var(--vmL);color:var(--vm);border-color:var(--vm)">+' + bi.qty + ' ' + escapeHtml(bi.name || bi.ma || 'SP tặng') + '</span></div>';
  });
  if (orderBonusSameQty > 0) {
    html += '<div class="pv-row"><span class="pv-l">Quà ĐH</span><span class="pv-bonus-tag">+' + (typeof formatQtyByCarton === 'function' ? formatQtyByCarton(p, orderBonusSameQty) : orderBonusSameQty) + '</span></div>';
  }
  if (totalNhan !== totalLon) {
    html += '<div class="pv-row"><span class="pv-l">Tổng nhận</span><span style="font-size:11px;font-weight:500;color:var(--n1)">' + (typeof formatQtyByCarton === 'function' ? formatQtyByCarton(p, totalNhan) : totalNhan + ' ' + p.donvi) + '</span></div>';
  }

  html += '<div class="pv-divider"></div>';
  if (saved > 0) {
    html += '<div class="pv-row"><span class="pv-l">Giá gốc</span><span style="font-size:11px;color:var(--n3)">' + fmt(gocTotal) + 'đ</span></div>';
  }
  html += '<div class="pv-row"><span class="pv-l">Sau KM</span><span class="pv-v">' + fmt(effectiveTotal) + 'đ</span></div>';
  if (orderKM.disc > 0 && (draftKm.orderDiscAllocated || 0) > 0) {
    // CK đơn hàng đã gộp vào hopKM — hiện ghi chú nhỏ để rõ ràng
    html += '<div style="font-size:10px;color:var(--vm);margin:-4px 0 4px;padding:0 2px;line-height:1.4">↳ Bao gồm CK đơn <b>-' + fmt(draftKm.orderDiscAllocated) + 'đ</b>' + (orderKM.desc ? ' (' + escapeHtml(orderKM.desc) + ')' : '') + '</div>';
  } else if (orderKM.disc > 0 && draftKm.hopKM >= p.giaNYLon) {
    // CK đơn chưa gộp vào hopKM (không có item-level KM) — hiện block riêng
    var draftTotal = draftItems.reduce(function(s, x) { return s + x.afterKM; }, 0) - orderKM.disc;
    html += '<div class="pv-divider" style="margin:4px 0;border-top:0.5px solid var(--orangeMid)"></div>';
    html += '<div class="pv-row"><span class="pv-l" style="color:var(--vm)">CK đơn hàng</span><span class="pv-save">-' + fmt(orderKM.disc) + 'đ</span></div>';
    if (orderKM.desc) html += '<div style="font-size:10px;color:var(--n3);margin:-2px 0 2px;line-height:1.3">' + escapeHtml(orderKM.desc) + '</div>';
    html += '<div class="pv-row"><span class="pv-l" style="font-weight:700">Tạm tính đơn</span><span class="pv-v">' + fmt(draftTotal) + 'đ</span></div>';
    html += '<div class="pv-row"><span class="pv-l">+VAT 1.5%</span><span class="pv-vat">' + fmt(Math.round(draftTotal * (1 + VAT_RATE))) + 'đ</span></div>';
  }
  html += '<div class="pv-row"><span class="pv-l">+Thuế 1.5%</span><span class="pv-vat">' + fmt(vatTotal) + 'đ</span></div>';
  if (saved > 0) {
    var savePct = Math.round(saved / gocTotal * 100);
    html += '<div class="pv-row"><span class="pv-l">Tiết kiệm</span><span class="pv-save">-' + fmt(saved) + 'đ (' + savePct + '%)</span></div>';
  }
  html += '<button class="btn-ok" onclick="addCart(\'' + escapeHtmlAttr(ma) + '\')">✓ Thêm vào đơn</button>';

  pv.innerHTML = html;
  pv.classList.add('show');

  // Cập nhật bảng giá với KM + order context (draftKm đã tính ở trên)
  var ptEl = document.getElementById('pt_' + ma);
  if (ptEl) ptEl.innerHTML = buildPriceTable(p, draftKm);

  // Cập nhật km-line: chỉ hiện CT đang áp dụng
  var kmLine = document.getElementById('km-line_' + ma);
  if (kmLine) {
    var chips = (km.appliedPromos && km.appliedPromos.length) ? getAppliedPromoRefsByNames(km.appliedPromos) : [];
    var usedNames = chips.map(function(c) { return c.name; });
    // Thêm order-level bonus CT đang áp (cascade, order_bonus)
    if (orderKM.bonusItems && orderKM.bonusItems.length) {
      var orderProgNames = orderKM.bonusItems.map(function(bi) { return bi.progName; }).filter(Boolean);
      getAppliedPromoRefsByNames(orderProgNames).forEach(function(r) {
        if (usedNames.indexOf(r.name) < 0) { chips.push(r); usedNames.push(r.name); }
      });
    }
    // Thêm order-level discount CT (order_money) đang áp
    if (orderKM.discProgNames && orderKM.discProgNames.length) {
      getAppliedPromoRefsByNames(orderKM.discProgNames).forEach(function(r) {
        if (usedNames.indexOf(r.name) < 0) { chips.push(r); usedNames.push(r.name); }
      });
    }
    if (chips.length) {
      kmLine.innerHTML = renderPromoJumpChips(chips, 4);
    } else {
      var allRefs = getProductPromoRefs(ma);
      kmLine.innerHTML = allRefs.length ? renderPromoJumpChips(allRefs.map(function(r) { return { idx: r.idx, name: r.prog.name || 'CT KM' }; }), 4) : '';
    }
  }
}

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

function buildOrderAwareKmDisplay(p, km, draftItems, orderKM) {
  var displayKm = Object.assign({}, km || {});
  displayKm.orderBonusQty = 0; displayKm.orderDiscAllocated = 0;
  if (!p || !Array.isArray(draftItems) || !draftItems.length) return displayKm;
  var targetItem = draftItems.find(function(it) { return it.ma === p.ma; });
  if (!targetItem) return displayKm;

  var totalAfter = draftItems.reduce(function(sum, item) { return sum + (item.afterKM || 0); }, 0);
  var proportion = totalAfter > 0 ? ((targetItem.afterKM || 0) / totalAfter) : 0;

  // Quà cùng SP: cộng vào số lượng nhận
  (orderKM && orderKM.bonusItems || []).forEach(function(bi) {
    if (bi && bi.ma === p.ma) displayKm.orderBonusQty += Math.max(0, parseInt(bi.qty, 10) || 0);
  });

  // CK % tổng đơn: phân bổ theo tỷ lệ giá trị SP
  if (orderKM && orderKM.disc > 0 && totalAfter > 0) {
    displayKm.orderDiscAllocated = Math.round(orderKM.disc * proportion);
  }

  // Quà SP khác: quy giá trị quà thành discount ảo, phân bổ theo tỷ lệ
  var orderGiftValueAllocated = 0;
  (orderKM && orderKM.bonusItems || []).forEach(function(bi) {
    if (!bi || bi.ma === p.ma) return; // cùng SP đã tính ở trên
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
    if (effectiveQty > 0) { displayKm.hopKM = Math.round(effectivePaid / effectiveQty); displayKm.thungKM = displayKm.hopKM * p.slThung; }
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

// ============================================================
// RENDER ĐẶT HÀNG — Card mới với dropdown
// ============================================================
function renderOrder() {
  var q = (document.getElementById('order-q') || {}).value || '';
  var lq = q.toLowerCase();
  var favorites = JSON.parse(localStorage.getItem(LS_KEYS.FAVORITES) || '[]');

  var f = SP.filter(function(p) {
    var brand = detectBrand(p).toLowerCase();
    if (nhomF.order && p.nhom !== nhomF.order) return false;
    if (brandF && detectBrand(p) !== brandF) return false;
    if (lq && !(p.ten.toLowerCase().includes(lq) || p.ma.toLowerCase().includes(lq) || brand.includes(lq))) return false;
    return true;
  });

  var el = document.getElementById('order-list');
  if (!el) return;

  renderCustomerSelector();
  renderBrandPills();

  if (!SP.length) { el.innerHTML = '<div class="empty">Chưa có sản phẩm<br><small>Vào Cài đặt để pull từ GitHub</small></div>'; return; }
  if (!f.length) { el.innerHTML = '<div class="empty">Không tìm thấy SP</div>'; return; }

  f.sort(function(a, b) {
    var aFav = favorites.includes(a.ma);
    var bFav = favorites.includes(b.ma);
    if (aFav !== bFav) return aFav ? -1 : 1;
    return a.ten.localeCompare(b.ten);
  });

  var groups = {};
  f.forEach(function(p) { var key = p.nhom || 'X'; if (!groups[key]) groups[key] = []; groups[key].push(p); });
  var sectionOrder = ['A', 'B', 'C', 'D', 'X'];
  var NCOLOR_LOCAL = { A: '#2563EB', B: '#C97B0A', C: '#F26322', D: '#D63030', X: '#888' };
  var html = '';

  sectionOrder.forEach(function(nhom) {
    if (!groups[nhom] || !groups[nhom].length) return;
    var label = nhom === 'X' ? 'Khác' : ({ A: 'Sữa bột', B: 'Sữa đặc', C: 'Sữa nước', D: 'Sữa chua' }[nhom] || nhom);
    html += '<div class="order-section">';
    html += '<div class="order-sec-hd"><span style="display:inline-block;width:3.5px;height:14px;border-radius:2px;background:' + NCOLOR_LOCAL[nhom] + ';margin-right:4px"></span>' + label + ' (' + groups[nhom].length + ')</div>';

    groups[nhom].forEach(function(p) {
      var inCart = cart[p.ma] && (cart[p.ma].qT > 0 || cart[p.ma].qL > 0);
      var isFav = favorites.includes(p.ma);
      var kmInfo = calcKM(p, 0, 1);
      var brand = detectBrand(p);
      var appliedCTs = getProductPromoRefs(p.ma);

      // Card mặc định thu gọn, mở nếu đã set hoặc đang trong giỏ
      var isExpanded = _cardExpanded[p.ma] !== undefined ? _cardExpanded[p.ma] : false;
      var eMa = escapeHtmlAttr(p.ma);

      html += '<div class="sp-card ' + (inCart ? 'inCart' : '') + '" id="card_' + eMa + '">';

      // Header — always visible
      html += '<div class="sp-head" onclick="toggleCard(\'' + eMa + '\')">';
      html += '<div class="sp-bar" style="background:' + NCOLOR_LOCAL[nhom] + '"></div>';
      html += '<div class="sp-body">';
      html += '<div class="sp-name-row">';
      html += '<div class="sp-name">' + escapeHtml(p.ten);
      html += '<span class="fav-star' + (isFav ? ' active' : '') + '" onclick="toggleFavorite(event, \'' + eMa + '\')">★</span>';
      html += '</div>';
      html += '<button id="toggle_' + eMa + '" class="sp-toggle' + (isExpanded ? ' open' : '') + '" onclick="event.stopPropagation();toggleCard(\'' + eMa + '\')">';
      html += '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2.5 4L6 7.5L9.5 4"/></svg>';
      html += '</button>';
      html += '</div>';

      // Meta chips
      html += '<div class="sp-meta">';
      html += '<span class="sp-chip">' + escapeHtml(p.ma) + '</span>';
      html += '<span class="sp-chip">' + p.slThung + '/' + escapeHtml(p.donvi) + '</span>';
      if (brand) html += '<span class="sp-chip">' + escapeHtml(brand) + '</span>';
      // KM badges
      appliedCTs.slice(0, 3).forEach(function(item) {
        html += '<span class="sp-kmbadge">' + escapeHtml(item.prog.name || 'KM') + '</span>';
      });
      if (appliedCTs.length > 3) html += '<span class="sp-kmbadge">+' + (appliedCTs.length - 3) + '</span>';
      // Cart badge
      if (inCart) {
        var cq = cart[p.ma];
        var cartLon = (cq.qT || 0) * p.slThung + (cq.qL || 0);
        html += '<span class="sp-cartbadge">✓ ' + cartLon + ' ' + escapeHtml(p.donvi) + '</span>';
      }
      html += '</div>';
      html += '</div></div>'; // sp-body, sp-head

      // Quick price strip khi trong giỏ và đang thu gọn
      if (inCart && !isExpanded) {
        var cq2 = cart[p.ma];
        var qT2 = cq2.qT || 0, qL2 = cq2.qL || 0;
        var kmInCart = calcKM(p, qT2, qL2);
        var totalL2 = qT2 * p.slThung + qL2;
        var afterKM2 = p.giaNYLon * totalL2 - kmInCart.disc;
        var goc2 = p.giaNYLon * totalL2;
        var VAT_RATE2 = typeof VAT !== 'undefined' ? VAT : 0.015;
        var vatAmt2 = Math.round(afterKM2 * (1 + VAT_RATE2));
        html += '<div class="sp-quick-price">';
        html += '<div><div style="font-size:10px;color:var(--n4);margin-bottom:1px">' + (qT2 > 0 ? qT2 + ' thùng' : '') + (qT2 > 0 && qL2 > 0 ? ' + ' : '') + (qL2 > 0 ? qL2 + ' lẻ' : '') + ' = ' + totalL2 + ' ' + escapeHtml(p.donvi) + '</div>';
        html += '<div class="sp-qp-main">' + fmt(afterKM2) + 'đ</div></div>';
        html += '<div style="text-align:right">';
        if (goc2 > afterKM2) html += '<div class="sp-qp-sub">' + fmt(goc2) + 'đ</div>';
        html += '<div class="sp-qp-vat">+Thuế: ' + fmt(vatAmt2) + 'đ</div>';
        html += '</div></div>';
      }

      // Expandable section
      html += '<div class="sp-expand' + (isExpanded ? ' open' : '') + '" id="expand_' + eMa + '">';

      // Bảng giá
      html += '<div id="pt_' + eMa + '">' + buildPriceTable(p, kmInfo) + '</div>';

      // KM jump chips
      if (appliedCTs.length) {
        html += '<div id="km-line_' + eMa + '">';
        html += renderPromoJumpChips(appliedCTs.map(function(item) {
          return { idx: item.idx, name: item.prog.name || 'CT KM' };
        }), 4);
        html += '</div>';
      }

      // Tích lũy CT (chỉ khi có KH)
      var tlStrip = buildTLStrip(p);
      if (tlStrip) {
        html += tlStrip;
      } else if (_selectedCustomerMa) {
        // KH được chọn nhưng SP không thuộc CT nào
      } else {
        html += '<div class="sp-no-kh">Chọn khách hàng để xem thưởng tích lũy tháng</div>';
      }

      // Qty input
      html += '<div class="qty-area">';
      html += '<div class="qbox"><span class="qlbl">Thùng</span><input class="qinp" type="number" min="0" max="999" inputmode="numeric" placeholder="0" id="qT_' + eMa + '" oninput="onQty(\'' + eMa + '\')"></div>';
      html += '<div class="qbox"><span class="qlbl">Lẻ</span><input class="qinp" type="number" min="0" max="9999" inputmode="numeric" placeholder="0" id="qL_' + eMa + '" oninput="onQty(\'' + eMa + '\')"></div>';
      html += '<button class="btn-add" onclick="addCart(\'' + eMa + '\')">＋</button>';
      html += '</div>';

      // Preview box
      html += '<div class="pv-box" id="pv_' + eMa + '"></div>';

      html += '</div>'; // sp-expand
      html += '</div>'; // sp-card
    });

    html += '</div>'; // order-section
  });

  el.innerHTML = html;

  // Khôi phục giá trị trong giỏ
  for (var ma in cart) {
    var cq = cart[ma];
    if (!cq.qT && !cq.qL) continue;
    var iT = document.getElementById('qT_' + ma);
    var iL = document.getElementById('qL_' + ma);
    if (iT) iT.value = cq.qT || '';
    if (iL) iL.value = cq.qL || '';
  }
}

function scrollToTop() {
  var orderList = document.getElementById('order-list');
  if (orderList) orderList.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================================
// RENDER ADMIN
// ============================================================
function renderAdm() {
  var q = (document.getElementById('adm-q') || {}).value || '';
  var lq = q.toLowerCase();
  var f = SP.filter(function(p) {
    var brand = detectBrand(p).toLowerCase();
    return (!nhomF.adm || p.nhom === nhomF.adm) && (!lq || p.ten.toLowerCase().includes(lq) || p.ma.toLowerCase().includes(lq) || brand.includes(lq));
  });
  var el = document.getElementById('adm-list'); if (!el) return;
  if (!SP.length) { el.innerHTML = '<div class="empty">Chưa có sản phẩm</div>'; return; }
  if (!f.length) { el.innerHTML = '<div class="empty">Không tìm thấy</div>'; return; }
  var groups = {};
  f.forEach(function(p) { if (!groups[p.nhom]) groups[p.nhom] = []; groups[p.nhom].push(p); });
  var html = '';
  ['A', 'B', 'C', 'D'].forEach(function(nhom) {
    if (!groups[nhom]) return;
    html += '<div class="adm-section"><div class="adm-sec-hd"><span>' + ({ A: 'Sữa bột', B: 'Sữa đặc', C: 'Sữa nước', D: 'Sữa chua' }[nhom] || nhom) + ' (' + groups[nhom].length + ')</span></div>';
    groups[nhom].forEach(function(p) { html += admSpRow(p); });
    html += '</div><div style="height:8px"></div>';
  });
  var noGroup = f.filter(function(p) { return !p.nhom || !['A','B','C','D'].includes(p.nhom); });
  if (noGroup.length) {
    html += '<div class="adm-section"><div class="adm-sec-hd"><span>Khác (' + noGroup.length + ')</span></div>';
    noGroup.forEach(function(p) { html += admSpRow(p); });
    html += '</div>';
  }
  el.innerHTML = html;
}

function admSpRow(p) {
  var brand = detectBrand(p);
  var manualBrand = hasManualBrand(p);
  var locInfo = p.locSize ? ' · Lốc ' + p.locSize : '';
  var eMa = escapeHtmlAttr(p.ma);
  var h = '<div class="adm-sp-row">';
  h += '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px">';
  h += '<div style="flex:1;min-width:0"><div class="adm-sp-name">' + escapeHtml(p.ten) + '</div>';
  h += '<div class="adm-sp-info"><span class="adm-chip">' + escapeHtml(p.ma) + '</span><span class="adm-chip">' + escapeHtml(p.donvi) + ' · ' + p.slThung + '/thùng' + locInfo + '</span>';
  if (brand) h += '<span class="adm-chip">' + escapeHtml(brand) + (manualBrand ? ' · tay' : '') + '</span>';
  h += '</div></div>';
  h += '<div style="text-align:right;flex-shrink:0"><div style="font-size:14px;font-weight:600;color:var(--orange)">' + fmt(p.giaNYLon) + 'đ</div><div style="font-size:10.5px;color:var(--n4)">' + fmt(p.giaNYThung) + 'đ/thùng</div></div></div>';
  h += '<div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">';
  h += '<input type="number" inputmode="numeric" placeholder="Giá mới/' + escapeHtmlAttr(p.donvi) + '" id="adp-inp-' + eMa + '" style="flex:1;height:36px;border:0.5px solid var(--n5);border-radius:var(--Rs);padding:0 11px;font-size:15px;color:var(--n1)">';
  h += '<button onclick="saveAdmPrice(\'' + eMa + '\')" style="height:36px;padding:0 13px;background:var(--orange);color:#fff;border:none;border-radius:var(--Rs);font-size:12px;font-weight:600;cursor:pointer">Lưu</button></div>';
  h += '<div style="display:flex;gap:8px">';
  h += '<button class="btn-kme" onclick="spOpenModal(\'' + eMa + '\')" style="flex:1">✏️ Sửa</button>';
  h += '<button class="btn-kmd" onclick="spDelete(\'' + eMa + '\')" style="flex:0 0 auto;padding:0 13px">✕</button></div>';
  h += '</div>';
  return h;
}

function saveAdmPrice(ma) {
  var inp = document.getElementById('adp-inp-' + ma);
  var val = parseInt(inp ? inp.value : 0);
  if (!val || val < 100) { showToast('Giá không hợp lệ'); return; }
  var p = SP.find(function(x) { return x.ma === ma; }); if (!p) return;
  p.giaNYLon = val; p.giaNYThung = val * p.slThung;
  if (window.markEntityUpdated) markEntityUpdated(p);
  saveSP(); if (inp) inp.value = '';
  if (window.syncAutoPushFile) syncAutoPushFile('products.json');
  showToast('✓ ' + p.ten + ' → ' + fmt(val) + 'đ/' + p.donvi);
  renderAdm(); renderOrder();
}

// ============================================================
// SP MODAL
// ============================================================
function spOpenModal(ma) {
  var p = null;
  if (ma) { p = SP.find(function(x) { return x.ma === ma; }); _spEditMa = ma; }
  else { _spEditMa = null; }
  document.getElementById('sp-modal').style.display = 'block';
  document.getElementById('sp-modal-t').textContent = p ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới';
  spRenderForm(p);
}

function spCloseModal(e) {
  if (e && e.target !== document.getElementById('sp-modal')) return;
  document.getElementById('sp-modal').style.display = 'none';
}

function spRenderForm(p) {
  var body = document.getElementById('sp-modal-body');
  var isEdit = !!p;
  var nhom = p ? p.nhom : 'C';
  var donvi = p ? p.donvi : 'hộp';
  var phanLoai = p && hasManualBrand(p) ? p.phanLoai : '';
  var autoPhanLoai = p ? (detectBrand(p) || '') : '';
  var suggestedBrands = getSuggestedBrands(nhom);
  var fieldStyle = 'width:100%;height:44px;border:0.5px solid var(--n5);border-radius:var(--Rs);padding:0 13px;font-size:15px;color:var(--n1);background:var(--card)';
  var html = '';
  html += '<div class="kf"><div class="kfl">Mã SP</div><input type="text" id="spf-ma" value="' + (p ? escapeHtml(p.ma) : '') + '"' + (isEdit ? ' readonly style="' + fieldStyle + ';background:var(--n6);color:var(--n4)"' : ' style="' + fieldStyle + ';text-transform:uppercase"') + ' placeholder="VD: 04ED32"></div>';
  html += '<div class="kf"><div class="kfl">Tên SP</div><input type="text" id="spf-ten" value="' + (p ? escapeHtml(p.ten) : '') + '" placeholder="VD: STT không đường 180ml" style="' + fieldStyle + '"></div>';
  html += '<div class="kf"><div class="kfl">Nhóm</div><div class="km-types">';
  ['A', 'B', 'C', 'D'].forEach(function(n) { html += '<button class="km-type-btn sp-nhom-sel' + (nhom === n ? ' sel' : '') + '" onclick="spSelectNhom(\'' + n + '\',this)">' + { A: 'A·Bột', B: 'B·Đặc', C: 'C·Nước', D: 'D·Chua' }[n] + '</button>'; });
  html += '</div></div>';
  html += '<div class="kf"><div class="kfl">Phân loại thương hiệu</div><input type="text" id="spf-phanloai" value="' + escapeHtml(phanLoai) + '" placeholder="VD: Green Farm, Ông Thọ..." list="spf-phanloai-list" style="' + fieldStyle + '">';
  html += '<datalist id="spf-phanloai-list">' + suggestedBrands.map(function(b) { return '<option value="' + escapeHtml(b) + '"></option>'; }).join('') + '</datalist>';
  html += '<div style="font-size:10.5px;color:var(--n4);margin-top:5px">Để trống = tự nhận diện theo tên/mã.' + (autoPhanLoai ? ' Hiện nhận là <b>' + escapeHtml(autoPhanLoai) + '</b>.' : '') + '</div></div>';
  html += '<div class="kf"><div class="kfl">Đơn vị</div><div class="km-types">';
  ['hộp', 'lon', 'chai', 'bịch'].forEach(function(dv) { html += '<button class="km-type-btn sp-dv-sel' + (donvi === dv ? ' sel' : '') + '" onclick="spSelectDV(\'' + dv + '\',this)">' + dv + '</button>'; });
  html += '</div><input type="text" id="spf-dv-custom" placeholder="Đơn vị khác..." style="' + fieldStyle + ';margin-top:6px;height:38px;font-size:13px"></div>';
  html += '<div class="kf"><div class="kfl">SL/thùng</div><input type="number" id="spf-slthung" value="' + (p ? p.slThung : 48) + '" style="' + fieldStyle + ';text-align:center;font-size:18px;font-weight:600"></div>';
  html += '<div class="kf"><div class="kfl">Lốc (tuỳ chọn)</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><div><div style="font-size:10px;color:var(--n4);margin-bottom:3px">SL/lốc</div><input type="number" id="spf-locsize" value="' + (p && p.locSize ? p.locSize : '') + '" placeholder="VD: 4" style="' + fieldStyle + ';text-align:center"></div><div><div style="font-size:10px;color:var(--n4);margin-bottom:3px">Nhãn</div><input type="text" id="spf-loclabel" value="' + (p && p.locLabel ? escapeHtml(p.locLabel) : '') + '" placeholder="Lốc" style="' + fieldStyle + '"></div></div></div>';
  html += '<div class="kf"><div class="kfl">Giá gốc/' + escapeHtml(donvi) + ' (VNĐ)</div><input type="number" id="spf-gia" value="' + (p ? p.giaNYLon : '') + '" placeholder="9612" style="' + fieldStyle + ';text-align:center;font-size:22px;font-weight:600;color:var(--orange)" oninput="spPreviewPrice()"><div id="spf-price-preview" style="margin-top:8px"></div></div>';
  html += '<button class="btn-km-save" onclick="spSaveForm()">' + (isEdit ? '💾 Cập nhật' : '✓ Thêm SP') + '</button>';
  body.innerHTML = html;
  spPreviewPrice();
}

function spSelectNhom(n, btn) { document.querySelectorAll('.sp-nhom-sel').forEach(function(b) { b.classList.remove('sel'); }); btn.classList.add('sel'); spRefreshPhanLoaiSuggestions(n); }
function spSelectDV(dv, btn) { document.querySelectorAll('.sp-dv-sel').forEach(function(b) { b.classList.remove('sel'); }); btn.classList.add('sel'); var c = document.getElementById('spf-dv-custom'); if (c) c.value = ''; }
function spGetSelectedNhom() { var sel = document.querySelector('.sp-nhom-sel.sel'); return sel ? sel.textContent.trim().charAt(0) : 'C'; }
function spGetSelectedDV() { var c = document.getElementById('spf-dv-custom'); if (c && c.value.trim()) return c.value.trim(); var sel = document.querySelector('.sp-dv-sel.sel'); return sel ? sel.textContent.trim() : 'hộp'; }

function spPreviewPrice() {
  var gia = parseInt((document.getElementById('spf-gia') || {}).value) || 0;
  var slThung = parseInt((document.getElementById('spf-slthung') || {}).value) || 48;
  var locSize = parseInt((document.getElementById('spf-locsize') || {}).value) || 0;
  var el = document.getElementById('spf-price-preview'); if (!el || !gia) { if (el) el.innerHTML = ''; return; }
  var VAT_RATE = typeof VAT !== 'undefined' ? VAT : 0.015;
  var thung = gia * slThung;
  var h = '<div style="background:var(--orangeL);border-radius:10px;padding:10px 12px;border:0.5px solid var(--orangeMid)">';
  h += '<div style="display:flex;justify-content:space-between;font-size:12px;color:var(--orangeD);margin-bottom:3px"><span>Thùng ' + slThung + '</span><b>' + fmt(thung) + 'đ</b></div>';
  if (locSize > 0) h += '<div style="display:flex;justify-content:space-between;font-size:12px;color:var(--orangeD);margin-bottom:3px"><span>Lốc ' + locSize + '</span><b>' + fmt(gia * locSize) + 'đ</b></div>';
  h += '<div style="display:flex;justify-content:space-between;font-size:11px;color:var(--n3)"><span>+Thuế 1.5%/thùng</span><span>' + fmt(Math.round(thung * (1 + VAT_RATE))) + 'đ</span></div></div>';
  el.innerHTML = h;
}

function spSaveForm() {
  var g = function(id) { return (document.getElementById(id) || {}).value || ''; };
  var ma = g('spf-ma').trim().toUpperCase();
  var ten = g('spf-ten').trim();
  var nhom = spGetSelectedNhom();
  var phanLoai = g('spf-phanloai').trim();
  var donvi = spGetSelectedDV();
  var slThung = parseInt(g('spf-slthung')) || 0;
  var locSize = parseInt(g('spf-locsize')) || 0;
  var locLabel = g('spf-loclabel').trim();
  var gia = parseInt(g('spf-gia')) || 0;
  if (!ma) { showToast('Nhập mã SP'); return; }
  if (!ten) { showToast('Nhập tên SP'); return; }
  if (!slThung || slThung < 1) { showToast('SL/thùng ≥ 1'); return; }
  if (!gia || gia < 100) { showToast('Giá ≥ 100'); return; }
  if (_spEditMa) {
    var p = SP.find(function(x) { return x.ma === _spEditMa; }); if (!p) return;
    p.ten = ten; p.nhom = nhom; p.donvi = donvi; p.slThung = slThung; p.giaNYLon = gia; p.giaNYThung = gia * slThung;
    if (phanLoai) { p.phanLoai = phanLoai; p.phanLoaiTuNhap = true; } else { delete p.phanLoai; delete p.phanLoaiTuNhap; }
    if (locSize > 0) { p.locSize = locSize; p.locLabel = locLabel || 'Lốc'; } else { delete p.locSize; delete p.locLabel; }
    if (window.markEntityUpdated) markEntityUpdated(p);
    delete p._brand;
    saveSP(); if (window.syncAutoPushFile) syncAutoPushFile('products.json');
    document.getElementById('sp-modal').style.display = 'none';
    renderAdm(); renderOrder();
    showToast('✅ Đã cập nhật: ' + ten);
  } else {
    if (SP.find(function(x) { return x.ma === ma; })) { showToast('Mã đã tồn tại!'); return; }
    var newP = { ma: ma, ten: ten, nhom: nhom, donvi: donvi, slThung: slThung, giaNYLon: gia, giaNYThung: gia * slThung, kmRules: [], kmText: '' };
    if (phanLoai) { newP.phanLoai = phanLoai; newP.phanLoaiTuNhap = true; }
    if (locSize > 0) { newP.locSize = locSize; newP.locLabel = locLabel || 'Lốc'; }
    if (window.markEntityUpdated) markEntityUpdated(newP);
    SP.push(newP); saveSP(); if (window.syncAutoPushFile) syncAutoPushFile('products.json');
    document.getElementById('sp-modal').style.display = 'none';
    renderAdm(); renderOrder();
    showToast('✅ Đã thêm: ' + ten + ' (' + ma + ')');
  }
}

function spDelete(ma) {
  var p = SP.find(function(x) { return x.ma === ma; }); if (!p) return;
  if (window.syncTrackEntityDeletion) syncTrackEntityDeletion('products.json', p);
  SP.splice(SP.indexOf(p), 1);
  if (cart[ma]) { delete cart[ma]; saveCart(); updateBadge(); }
  saveSP(); if (window.syncAutoPushFile) syncAutoPushFile('products.json');
  renderAdm(); renderOrder();
}

function closeAdmModal(e) {
  if (e && e.target !== document.getElementById('adm-modal')) return;
  document.getElementById('adm-modal').style.display = 'none';
}

// ============================================================
// EXPORTS
// ============================================================
window.nhomF = nhomF;
window.buildPriceTable = buildPriceTable;
window.buildTLStrip = buildTLStrip;
window.onQty = onQty;
window.toggleCard = toggleCard;
window.renderOrder = renderOrder;
window.renderAdm = renderAdm;
window.saveAdmPrice = saveAdmPrice;
window.closeAdmModal = closeAdmModal;
window.scrollToTop = scrollToTop;
window.debounceRender = debounceRender;
window.setNhom = setNhom;
window.setBrand = setBrand;
window.renderBrandPills = renderBrandPills;
window.renderCustomerSelector = renderCustomerSelector;
window.onSelectCustomer = onSelectCustomer;
window.formatQtyByCarton = formatQtyByCarton;
window.getCartonRoundHint = getCartonRoundHint;
window.spOpenModal = spOpenModal;
window.spCloseModal = spCloseModal;
window.spRenderForm = spRenderForm;
window.spSelectNhom = spSelectNhom;
window.spSelectDV = spSelectDV;
window.spRefreshPhanLoaiSuggestions = spRefreshPhanLoaiSuggestions;
window.spPreviewPrice = spPreviewPrice;
window.spSaveForm = spSaveForm;
window.spDelete = spDelete;
window.detectBrand = detectBrand;
window.hasManualBrand = hasManualBrand;
window.getCustomBrandRules = getCustomBrandRules;
window.saveCustomBrandRules = saveCustomBrandRules;
window.clearDetectedBrandCache = clearDetectedBrandCache;
