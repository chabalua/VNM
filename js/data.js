// Quản lý dữ liệu SP và KM
let SP = [];
let kmProgs = [];

function normalizeProduct(product) {
  if (!product || typeof product !== 'object') return product;
  if (!product.kmRules) product.kmRules = [];
  if (!product.kmText) product.kmText = '';
  if (product.phanLoaiTuNhap !== true) {
    if (product._brand && product.phanLoai === product._brand) delete product.phanLoai;
    delete product.phanLoaiTuNhap;
  }
  return product;
}

function validateProductList(data) {
  return Array.isArray(data) && data.length > 0 && data.every(item => item && typeof item.ma === 'string' && typeof item.giaNYLon === 'number');
}

function isPromotionMetadata(item) {
  if (!item || typeof item !== 'object') return false;
  const keys = Object.keys(item);
  if (!keys.length) return true;  // object rỗng {} → bỏ qua (tránh làm fail validatePromotionList)
  return keys.every(key => key.startsWith('_'));
}

function normalizePromotionList(data) {
  if (!Array.isArray(data)) return [];
  return data.filter(item => !isPromotionMetadata(item));
}

function validatePromotionList(data) {
  const list = normalizePromotionList(data);
  return Array.isArray(list) && list.every(item => {
    if (!item || typeof item.name !== 'string' || typeof item.type !== 'string') return false;
    if (item.type === 'order_money' || item.type === 'order_bonus') return true;
    return Array.isArray(item.spMas);
  });
}

// ============================================================
// FETCH WITH CACHE BUSTING — Fix iOS Safari aggressive cache
// ============================================================
async function fetchJSON(url, storageKey, fallback) {
  try {
    // Add timestamp to bust cache
    var bustUrl = url + (url.indexOf('?') >= 0 ? '&' : '?') + '_t=' + Date.now();
    var res = await fetch(bustUrl, { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    var data = await res.json();
    localStorage.setItem(storageKey, JSON.stringify(data));
    return data;
  } catch (err) {
    console.warn('Fetch ' + url + ' thất bại:', err);
    var cached = localStorage.getItem(storageKey);
    if (cached) {
      try { return JSON.parse(cached); } catch(e) {}
    }
    return fallback;
  }
}

async function loadProducts() {
  var raw = await fetchJSON(PRODUCTS_URL, 'vnm_sp', FALLBACK_PRODUCTS);
  SP = validateProductList(raw) ? raw : FALLBACK_PRODUCTS;
  SP.forEach(normalizeProduct);
  saveSP();
}

async function loadPromotions() {
  var raw = await fetchJSON(LOCAL_PROMOTIONS_URL, 'vnm_km3', []);
  if (!validatePromotionList(raw) || !raw.length) {
    raw = await fetchJSON(PROMOTIONS_URL, 'vnm_km3', []);
  }
  var normalized = normalizePromotionList(raw);
  kmProgs = validatePromotionList(normalized) ? normalized : [];
  kmSave();
}

function saveSP() { localStorage.setItem('vnm_sp', JSON.stringify(SP)); }
function kmSave() { localStorage.setItem('vnm_km3', JSON.stringify(kmProgs)); }
function spFind(ma) { return SP.find(function(x) { return x.ma === ma; }); }

async function initData() {
  var overlay = document.getElementById('loadingOverlay');

  function rerenderAfterBackgroundRefresh() {
    if (window.renderHomeDashboard) window.renderHomeDashboard();
    if (window.renderSettingsOverview) window.renderSettingsOverview();
    if (window.renderOrder) window.renderOrder();
    if (window.renderAdm) window.renderAdm();
    if (window.renderKMTab) window.renderKMTab();
    if (window.renderDon) window.renderDon();
    if (window.renderCusTab) window.renderCusTab();
  }

  // Bước 1: Thử load ngay từ localStorage (không cần network)
  var hasCachedSP = false;
  var cachedSP = localStorage.getItem('vnm_sp');
  if (cachedSP) {
    try {
      var _raw = JSON.parse(cachedSP);
      if (validateProductList(_raw)) {
        SP = _raw;
        SP.forEach(normalizeProduct);
        hasCachedSP = true;
      }
    } catch(e) {}
  }
  var cachedKM = localStorage.getItem('vnm_km3');
  if (cachedKM) {
    try {
      var _rawK = JSON.parse(cachedKM);
      var _norm = normalizePromotionList(_rawK);
      if (validatePromotionList(_norm)) kmProgs = _norm;
    } catch(e) {}
  }

  if (hasCachedSP) {
    // Có cache: ẩn overlay ngay, boot tức thì, refresh ẩn ở nền
    if (overlay) overlay.classList.remove('show');
    Promise.all([loadProducts(), loadPromotions()])
      .then(function() {
        rerenderAfterBackgroundRefresh();
      })
      .catch(function(e) {
        console.warn('Background refresh thất bại:', e);
      });
  } else {
    // Lần đầu chưa có cache: hiện overlay, chờ fetch xong
    if (overlay) overlay.classList.add('show');
    try {
      await Promise.all([loadProducts(), loadPromotions()]);
    } catch (err) {
      console.error('initData error:', err);
    } finally {
      if (overlay) overlay.classList.remove('show');
    }
  }

  if (!localStorage.getItem('vnm_favorites')) {
    try { localStorage.setItem('vnm_favorites', '[]'); } catch(e) {}
  }
}

async function syncFromGitHub() {
  // không cần confirm
  var overlay = document.getElementById('loadingOverlay');
  overlay.classList.add('show');
  try {
    var ts = '_t=' + Date.now();
    var pUrl = PRODUCTS_URL + (PRODUCTS_URL.indexOf('?') >= 0 ? '&' : '?') + ts;
    var kUrl = PROMOTIONS_URL + (PROMOTIONS_URL.indexOf('?') >= 0 ? '&' : '?') + ts;
    var results = await Promise.all([
      fetch(pUrl, { cache: 'no-store' }).then(function(r) { return r.json(); }),
      fetch(kUrl, { cache: 'no-store' }).then(function(r) { return r.json(); })
    ]);
    var newProducts = results[0];
    var newPromos = results[1];
    if (validateProductList(newProducts)) {
      SP = newProducts;
      SP.forEach(normalizeProduct);
      saveSP();
    } else {
      throw new Error('Products data không hợp lệ');
    }
    kmProgs = normalizePromotionList(newPromos);
    kmSave();
    if (window.renderOrder) window.renderOrder();
    if (window.renderAdm) window.renderAdm();
    if (window.renderKMTab) window.renderKMTab();
    if (window.renderDon) window.renderDon();
    showToast('✅ Đồng bộ thành công: ' + SP.length + ' SP, ' + kmProgs.length + ' CT KM');
  } catch (err) {
    showToast('Lỗi đồng bộ: ' + err.message);
  } finally { overlay.classList.remove('show'); }
}

// ============================================================
// XUẤT products.json (push lên GitHub để sync giá)
// ============================================================
function exportProductsJSON() {
  var cleanProducts = SP.map(function(p) {
    var clean = { ma: p.ma, ten: p.ten, nhom: p.nhom, donvi: p.donvi, slThung: p.slThung, giaNYLon: p.giaNYLon, giaNYThung: p.giaNYThung };
    if (p.locSize) { clean.locSize = p.locSize; clean.locLabel = p.locLabel || 'Lốc'; }
    if (p.phanLoai && p.phanLoaiTuNhap === true) { clean.phanLoai = p.phanLoai; clean.phanLoaiTuNhap = true; }
    if (p.kmRules && p.kmRules.length) clean.kmRules = p.kmRules;
    if (p.kmText) clean.kmText = p.kmText;
    return clean;
  });
  var str = JSON.stringify(cleanProducts, null, 2);
  var blob = new Blob([str], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a'); a.href = url;
  a.download = 'products.json';
  a.click(); URL.revokeObjectURL(url);
  showToast('✅ Đã xuất products.json (' + SP.length + ' SP)');
}

// ============================================================
// NHẬP products.json (từ file local)
// ============================================================
function importProductsJSON() {
  var input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json';
  input.onchange = function(e) {
    var file = e.target.files[0]; if (!file) return;
    var reader = new FileReader();
    reader.onload = function(ev) {
      try {
        var data = JSON.parse(ev.target.result);
        if (!Array.isArray(data)) throw new Error('File không phải mảng SP');
        if (!validateProductList(data)) throw new Error('Dữ liệu products không hợp lệ');
        SP = data;
        SP.forEach(normalizeProduct);
        saveSP();
        if (window.renderOrder) window.renderOrder();
        if (window.renderAdm) window.renderAdm();
        if (window.renderDon) window.renderDon();
        showToast('✅ Đã nhập ' + SP.length + ' sản phẩm');
      } catch (err) { showToast('Lỗi: ' + err.message); }
    };
    reader.readAsText(file);
  };
  input.click();
}

window.SP = function() { return SP; };
window.kmProgs = function() { return kmProgs; };
window.saveSP = saveSP;
window.kmSave = kmSave;
window.spFind = spFind;
window.initData = initData;
window.syncFromGitHub = syncFromGitHub;
window.exportProductsJSON = exportProductsJSON;
window.importProductsJSON = importProductsJSON;
