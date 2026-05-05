// ============================================================
// UI v8 — Đặt hàng (brand filter + KH selector) + Quản lý SP
// Redesign: Phase 3.3 MobileOrder & DesktopOrder setup
// ============================================================

var CUSTOM_BRAND_RULES_KEY = LS_KEYS.BRAND_RULES;

function getUIAppState() {
  if (!window.appState || typeof window.appState !== 'object') window.appState = {};
  return window.appState;
}

function getCatalogUIState() {
  var appState = getUIAppState();
  if (!appState.catalogUI || typeof appState.catalogUI !== 'object') {
    appState.catalogUI = {
      nhomF: { order: '', adm: '' },
      brandF: '',
      spEditMa: null
    };
  }
  if (!appState.catalogUI.nhomF || typeof appState.catalogUI.nhomF !== 'object') {
    appState.catalogUI.nhomF = { order: '', adm: '' };
  }
  return appState.catalogUI;
}

var nhomF = getCatalogUIState().nhomF;

function getOrderUIState() {
  var appState = getUIAppState();
  if (!appState.orderUI || typeof appState.orderUI !== 'object') {
    appState.orderUI = {
      searchTimer: null,
      selectedCustomerMa: '',
      cardExpanded: {}
    };
  }
  return appState.orderUI;
}

function installSelectedCustomerMaBridge() {
  if (window.__selectedCustomerMaBridgeInstalled) return;
  Object.defineProperty(window, '_selectedCustomerMa', {
    configurable: true,
    get: function() {
      return getOrderUIState().selectedCustomerMa || '';
    },
    set: function(value) {
      getOrderUIState().selectedCustomerMa = value || '';
    }
  });
  window.__selectedCustomerMaBridgeInstalled = true;
}

function getBrandFilter() {
  return getCatalogUIState().brandF || '';
}

function setBrandFilter(brand) {
  getCatalogUIState().brandF = brand || '';
}

function getSpEditMa() {
  return getCatalogUIState().spEditMa || null;
}

function setSpEditMa(ma) {
  getCatalogUIState().spEditMa = ma || null;
}

function getSelectedCustomerMa() {
  return getOrderUIState().selectedCustomerMa || '';
}

function setSelectedCustomerMa(ma) {
  var orderUIState = getOrderUIState();
  orderUIState.selectedCustomerMa = ma || '';
}

installSelectedCustomerMaBridge();

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
  var orderUIState = getOrderUIState();
  clearTimeout(orderUIState.searchTimer);
  orderUIState.searchTimer = setTimeout(function() {
    if (tab === 'order') renderOrder();
    else renderAdm();
  }, 250);
}

function setNhom(el, tab, nhom) {
  nhomF[tab] = nhom;
  setBrandFilter('');
  // Toggle tag styles
  el.closest('.pills').querySelectorAll('.pill').forEach(function(p) {
    p.className = p.className.replace('tag-soft', 'tag-outline').replace('on-all', '');
  });
  el.className = el.className.replace('tag-outline', 'tag-soft on-all');
  if (tab === 'order') { renderBrandPills(); renderOrder(); }
  else renderAdm();
}

function setBrand(brand) {
  var nextBrand = (getBrandFilter() === brand) ? '' : brand;
  setBrandFilter(nextBrand);
  renderBrandPills();
  renderOrder();
}

function renderBrandPills() {
  var el = document.getElementById('brand-pills'); if (!el) return;
  var brandFilter = getBrandFilter();
  var brands = getBrandsForNhom(nhomF.order);
  if (!brands.length) { el.innerHTML = ''; el.style.display = 'none'; return; }
  el.style.display = 'flex';
  el.innerHTML = brands.map(function(b) {
    var active = brandFilter === b;
    return '<div class="tag pill ' + (active ? 'tag-soft' : 'tag-outline') + '" onclick="setBrand(\'' + escapeHtmlAttr(b) + '\')" style="cursor:pointer;height:26px;padding:0 12px;border-radius:14px">' + escapeHtml(b) + '</div>';
  }).join('');
}

// ============================================================
// CUSTOMER SELECTOR
// ============================================================
function renderCustomerSelector() {
  var el = document.getElementById('cus-selector'); if (!el) return;
  var cusList = getCUS();
  var selectedCustomerMa = getSelectedCustomerMa();
  if (!cusList.length) {
    el.innerHTML = '<div style="font-size:11px;color:var(--text-tertiary);padding:4px 0 2px">Chưa có KH. Vào tab Khách hàng để thêm.</div>';
    return;
  }
  var selected = cusList.find(function(k) { return k.ma === selectedCustomerMa; });
  var routes = (typeof ROUTES !== 'undefined' && Array.isArray(ROUTES)) ? ROUTES : [];

  // Build selector box matches Phase 3.3 mockups
  var html = '<div class="cus-selector-wrap" style="position:relative">';
  html += '<div class="cus-selector-box' + (selected ? ' has-kh' : '') + '" onclick="document.getElementById(\'order-kh-select\').focus()" style="display:flex;align-items:center;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-md);height:44px;padding:0 12px;gap:8px;">';
  
  if (selected) {
    html += '<div class="avatar avatar-sm rounded" style="background:var(--cat1);color:#fff">' + escapeHtml(selected.ten ? selected.ten.charAt(0).toUpperCase() : 'K') + '</div>';
    html += '<div style="flex:1;min-width:0;display:flex;flex-direction:column;justify-content:center">';
    html += '<div style="font-size:13px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.2">' + escapeHtml(selected.ten || selected.ma) + '</div>';
    var tags = [];
    if (selected.programs && selected.programs.vnmShop && selected.programs.vnmShop.dangKy) tags.push('VNM Shop');
    if (selected.programs && selected.programs.vipShop && selected.programs.vipShop.dangKy) tags.push('VIP Shop');
    if (selected.programs && selected.programs.sbpsShop && selected.programs.sbpsShop.dangKy) tags.push('SBPS');
    var tagStr = tags.length ? tags.join(' · ') : 'Khách hàng thường';
    html += '<div style="font-size:11px;color:var(--text-tertiary);line-height:1.2;margin-top:2px;">' + escapeHtml(tagStr) + '</div>';
    html += '</div>';
    html += '<button style="background:none;border:none;color:var(--text-tertiary);padding:4px;cursor:pointer" onclick="event.stopPropagation();onSelectCustomer(\'\')">' + (window.renderIcon ? window.renderIcon('x', 14) : '✕') + '</button>';
  } else {
    html += '<div style="flex:1;font-size:13px;color:var(--text-tertiary);display:flex;align-items:center;gap:8px">' + (window.renderIcon ? window.renderIcon('users', 16) : '') + ' Chọn khách hàng...</div>';
    html += '<div style="color:var(--text-tertiary)">' + (window.renderIcon ? window.renderIcon('chevron-down', 14) : '▼') + '</div>';
  }
  html += '</div>';

  // Dropdown select (hidden visual, real select)
  html += '<select id="order-kh-select" style="opacity:0;position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;" onchange="onSelectCustomer(this.value)">';
  html += '<option value="">— Chọn khách hàng —</option>';
  var grouped = {};
  cusList.forEach(function(k) { var r = k.tuyen || '_'; if (!grouped[r]) grouped[r] = []; grouped[r].push(k); });
  routes.forEach(function(r) {
    if (!grouped[r.id]) return;
    html += '<optgroup label="📍 ' + escapeHtmlAttr(r.ten) + '">';
    grouped[r.id].forEach(function(k) {
      html += '<option value="' + escapeHtmlAttr(k.ma) + '"' + (k.ma === selectedCustomerMa ? ' selected' : '') + '>' + escapeHtml(k.ten || k.ma) + '</option>';
    });
    html += '</optgroup>';
  });
  if (grouped['_']) {
    html += '<optgroup label="Chưa phân tuyến">';
    grouped['_'].forEach(function(k) {
      html += '<option value="' + escapeHtmlAttr(k.ma) + '"' + (k.ma === selectedCustomerMa ? ' selected' : '') + '>' + escapeHtml(k.ten || k.ma) + '</option>';
    });
    html += '</optgroup>';
  }
  html += '</select>';
  html += '</div>';
  el.innerHTML = html;
}

function onSelectCustomer(ma) {
  setSelectedCustomerMa(ma);
  renderCustomerSelector();
  renderOrder();
}

// ============================================================
// ADD CART (Button Thêm)
// ============================================================
function addCart(ma) {
  var b = document.getElementById('b_' + ma);
  var eT = document.getElementById('qT_' + ma);
  var eL = document.getElementById('qL_' + ma);
  var qT = parseInt((eT && eT.value) || 0, 10);
  var qL = parseInt((eL && eL.value) || 0, 10);
  if(qT===0 && qL===0) return;

  var oldT = cart[ma] ? cart[ma].qT : 0;
  var oldL = cart[ma] ? cart[ma].qL : 0;

  cart[ma] = { qT: qT, qL: qL };
  saveCart();

  var card = document.getElementById('card_' + ma);
  if(card) {
    card.classList.add('inCart');
    // green flash
    card.style.transition = 'background-color 0.2s ease, border-color 0.2s ease';
    var originalBg = card.style.backgroundColor;
    var originalBorder = card.style.borderColor;
    card.style.backgroundColor = 'var(--success-soft)';
    card.style.borderColor = 'var(--success)';
    
    setTimeout(function() {
      card.style.backgroundColor = originalBg;
      card.style.borderColor = originalBorder;
    }, 400);
  }

  updateBadge();
  showToast('Đã cập nhật ' + ma + ' vào giỏ');
  if (window.onQty) window.onQty(ma);
}

// ============================================================
// RENDER ĐẶT HÀNG — Card mới với dropdown
// ============================================================
function renderOrder() {
  var orderUIState = getOrderUIState();
  var selectedCustomerMa = getSelectedCustomerMa();
  var brandFilter = getBrandFilter();
  var q = (document.getElementById('order-q') || {}).value || '';
  var lq = q.toLowerCase();
  var favorites = JSON.parse(localStorage.getItem(LS_KEYS.FAVORITES) || '[]');

  var f = SP.filter(function(p) {
    var brand = detectBrand(p).toLowerCase();
    if (nhomF.order && p.nhom !== nhomF.order) return false;
    if (brandFilter && detectBrand(p) !== brandFilter) return false;
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
  var mainHtml = '';

  sectionOrder.forEach(function(nhom) {
    mainHtml += buildOrderSectionHTML(nhom, groups[nhom] || [], {
      favorites: favorites,
      orderUIState: orderUIState,
      selectedCustomerMa: selectedCustomerMa
    });
  });

  el.innerHTML = mainHtml;

  if (typeof isDesktopLayout === 'function' && isDesktopLayout() && window.buildDesktopOrderSidebarHTML) {
    var side = document.getElementById('order-desktop-side');
    if (side) side.innerHTML = buildDesktopOrderSidebarHTML();
  }

  if (typeof restoreOrderCartInputs === 'function') restoreOrderCartInputs();
}

function scrollToTop() {
  var orderList = document.getElementById('order-list');
  if (orderList) orderList.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================================
// RENDER ADMIN
// ============================================================
// ============================================================
// EXPORTS
// ============================================================
window.nhomF = nhomF;
window.renderOrder = renderOrder;
window.scrollToTop = scrollToTop;
window.debounceRender = debounceRender;
window.setNhom = setNhom;
window.setBrand = setBrand;
window.renderBrandPills = renderBrandPills;
window.renderCustomerSelector = renderCustomerSelector;
window.onSelectCustomer = onSelectCustomer;
window.spRefreshPhanLoaiSuggestions = spRefreshPhanLoaiSuggestions;
window.detectBrand = detectBrand;
window.hasManualBrand = hasManualBrand;
window.getCustomBrandRules = getCustomBrandRules;
window.saveCustomBrandRules = saveCustomBrandRules;
window.clearDetectedBrandCache = clearDetectedBrandCache;














