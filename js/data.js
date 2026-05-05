// Quản lý dữ liệu SP và KM
var SP = [];
var kmProgs = [];

function normalizeProduct(product) {
  if (!product || typeof product !== 'object') return product;
  if (!product.kmRules) product.kmRules = [];
  if (!product.kmText) product.kmText = '';
  // Đảm bảo giaNYThung luôn khớp giaNYLon × slThung
  if (product.giaNYLon && product.slThung) {
    product.giaNYThung = product.giaNYLon * product.slThung;
  }
  if (product.phanLoaiTuNhap !== true) {
    if (product._brand && product.phanLoai === product._brand) delete product.phanLoai;
    delete product.phanLoaiTuNhap;
  }
  return product;
}

function isValidProductRecord(item) {
  return !!(item && typeof item.ma === 'string' && item.ma.trim() && typeof item.giaNYLon === 'number' && isFinite(item.giaNYLon));
}

function sanitizeProductList(data, sourceLabel) {
  if (!Array.isArray(data)) return [];
  var invalidCount = 0;
  var sanitized = data.filter(function(item) {
    var ok = isValidProductRecord(item);
    if (!ok) invalidCount += 1;
    return ok;
  });
  if (invalidCount > 0 && sourceLabel) {
    console.warn('[data] Bỏ qua ' + invalidCount + ' sản phẩm lỗi từ ' + (sourceLabel || 'unknown source'));
  }
  return sanitized;
}

function validateProductList(data) {
  return sanitizeProductList(data).length > 0;
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

function isValidPromotionRecord(item) {
  if (!item || typeof item.name !== 'string' || !item.name.trim() || typeof item.type !== 'string' || !item.type.trim()) return false;
  if (item.type === 'order_money' || item.type === 'order_bonus') return true;
  return Array.isArray(item.spMas);
}

function getPromotionDedupKey(item) {
  if (!item || typeof item !== 'object') return '';
  var normalized = {};
  Object.keys(item).forEach(function(key) {
    if (key.startsWith('_')) return;
    normalized[key] = item[key];
  });
  return JSON.stringify(normalized);
}

function collectPromotionReferenceIssues(data, products) {
  var list = Array.isArray(data) ? data : [];
  var productList = Array.isArray(products) ? products : [];
  var productMap = {};
  productList.forEach(function(product) {
    if (!product || !product.ma) return;
    productMap[String(product.ma).trim().toUpperCase()] = true;
  });
  var issues = {
    activePromotions: 0,
    promotionsWithMissingSpMas: 0,
    promotionsWithMissingBonusMa: 0,
    actionableBrokenBonusRefs: 0,
    samples: []
  };

  list.forEach(function(prog) {
    if (!prog || !prog.active) return;
    issues.activePromotions += 1;
    var spMas = Array.isArray(prog.spMas) ? prog.spMas : [];
    var existingTriggers = spMas.filter(function(ma) {
      return !!productMap[String(ma || '').trim().toUpperCase()];
    });
    var missingSpMas = spMas.filter(function(ma) {
      return !productMap[String(ma || '').trim().toUpperCase()];
    });
    if (missingSpMas.length) issues.promotionsWithMissingSpMas += 1;

    var giftMa = '';
    if (prog.type === 'bonus') giftMa = prog.bMa || '';
    else if (prog.type === 'order_bonus') giftMa = prog.bonusMa || '';
    var missingBonusMa = !!(giftMa && giftMa !== 'same' && !productMap[String(giftMa).trim().toUpperCase()]);
    if (missingBonusMa) {
      issues.promotionsWithMissingBonusMa += 1;
      if (existingTriggers.length) issues.actionableBrokenBonusRefs += 1;
    }

    if ((missingSpMas.length || missingBonusMa) && issues.samples.length < 12) {
      issues.samples.push({
        name: prog.name || 'CT KM',
        missingSpMas: missingSpMas.slice(0, 8),
        missingBonusMa: missingBonusMa ? giftMa : '',
        existingTriggers: existingTriggers.slice(0, 8)
      });
    }
  });

  return issues;
}

function sanitizePromotionList(data, sourceLabel) {
  var list = normalizePromotionList(data);
  var invalidCount = 0;
  var duplicateCount = 0;
  var seen = {};
  var sanitized = list.filter(function(item) {
    var ok = isValidPromotionRecord(item);
    if (!ok) invalidCount += 1;
    if (!ok) return false;
    var dedupKey = getPromotionDedupKey(item);
    if (dedupKey && seen[dedupKey]) {
      duplicateCount += 1;
      return false;
    }
    if (dedupKey) seen[dedupKey] = true;
    return true;
  });
  if (invalidCount > 0 && sourceLabel) {
    console.warn('[data] Bỏ qua ' + invalidCount + ' CTKM lỗi từ ' + (sourceLabel || 'unknown source'));
  }
  if (duplicateCount > 0 && sourceLabel) {
    console.warn('[data] Bỏ qua ' + duplicateCount + ' CTKM trùng từ ' + (sourceLabel || 'unknown source'));
  }
  return sanitized;
}

function validatePromotionList(data) {
  return sanitizePromotionList(data).length === normalizePromotionList(data).length;
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
  var sanitized = sanitizeProductList(raw, PRODUCTS_URL);
  SP = sanitized.length ? sanitized : FALLBACK_PRODUCTS;
  SP.forEach(normalizeProduct);
  saveSP();
}

async function loadPromotions() {
  var raw = await fetchJSON(LOCAL_PROMOTIONS_URL, 'vnm_km3', []);
  var normalized = sanitizePromotionList(raw, LOCAL_PROMOTIONS_URL);
  if (!normalized.length) {
    raw = await fetchJSON(PROMOTIONS_URL, 'vnm_km3', []);
    normalized = sanitizePromotionList(raw, PROMOTIONS_URL);
  }
  kmProgs = normalized;
  var referenceIssues = collectPromotionReferenceIssues(kmProgs, SP);
  if (referenceIssues.promotionsWithMissingSpMas > 0) {
    console.warn('[data] Có ' + referenceIssues.promotionsWithMissingSpMas + ' CTKM active đang tham chiếu mã SP không còn trong products.json');
  }
  if (referenceIssues.actionableBrokenBonusRefs > 0) {
    console.warn('[data] Có ' + referenceIssues.actionableBrokenBonusRefs + ' CTKM active có quà tặng trỏ tới mã SP không tồn tại nhưng vẫn áp trên SKU hiện có');
  }
  kmSave();
  if (window.KM_DATA_VERSION) localStorage.setItem('vnm_km_version', KM_DATA_VERSION);
}

function saveSP() { localStorage.setItem(LS_KEYS.SP, JSON.stringify(SP)); if (window.lsCheckQuota) lsCheckQuota(); }
function kmSave() { localStorage.setItem(LS_KEYS.KM, JSON.stringify(kmProgs)); }
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
  var cachedSP = localStorage.getItem(LS_KEYS.SP);
  if (cachedSP) {
    try {
      var _raw = JSON.parse(cachedSP);
      var _sanitized = sanitizeProductList(_raw, 'localStorage.' + LS_KEYS.SP);
      if (_sanitized.length) {
        SP = _sanitized;
        SP.forEach(normalizeProduct);
        hasCachedSP = true;
      }
    } catch(e) {}
  }
  // Invalidate KM cache khi version server đổi (ví dụ: đổi tháng T4→T5)
  var kmVersionOk = window.KM_DATA_VERSION &&
    localStorage.getItem('vnm_km_version') === KM_DATA_VERSION;
  var cachedKM = kmVersionOk ? localStorage.getItem(LS_KEYS.KM) : null;
  if (!kmVersionOk) {
    localStorage.removeItem(LS_KEYS.KM);
    // Xóa shadow records của promotions.json để T4 promos không hồi sinh qua syncMergeMasterRecords
    try {
      var _sh = JSON.parse(localStorage.getItem(LS_KEYS.SYNC_SHADOW) || '{}');
      if (_sh['promotions.json']) { delete _sh['promotions.json']; localStorage.setItem(LS_KEYS.SYNC_SHADOW, JSON.stringify(_sh)); }
    } catch(e) {}
  }
  if (cachedKM) {
    try {
      var _rawK = JSON.parse(cachedKM);
      var _norm = sanitizePromotionList(_rawK, 'localStorage.' + LS_KEYS.KM);
      if (_norm.length) kmProgs = _norm;
    } catch(e) {}
  }

  if (hasCachedSP) {
    // Có cache: ẩn overlay ngay, boot tức thì, refresh ẩn ở nền
    // Chỉ background-refresh SP (giá mới) — kmProgs là dữ liệu user, KHÔNG tự ghi đè
    // vì sẽ xoá mất CT KM mới tạo chưa kịp push lên GitHub
    if (overlay) overlay.classList.remove('show');
    var bgPromises = [loadProducts()];
    // Load KM nếu chưa có cache hoặc cache đã bị invalidate do version đổi
    if (!cachedKM) bgPromises.push(loadPromotions());
    Promise.all(bgPromises)
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

  if (!localStorage.getItem(LS_KEYS.FAVORITES)) {
    try { localStorage.setItem(LS_KEYS.FAVORITES, '[]'); } catch(e) {}
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
    var sanitizedProducts = sanitizeProductList(newProducts, 'GitHub products.json');
    if (sanitizedProducts.length) {
      SP = sanitizedProducts;
      SP.forEach(normalizeProduct);
      saveSP();
    } else {
      throw new Error('Products data không hợp lệ');
    }
    var sanitizedPromotions = sanitizePromotionList(newPromos, 'GitHub promotions.json');
    if (!sanitizedPromotions.length) throw new Error('Promotions data không hợp lệ');
    kmProgs = sanitizedPromotions;
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
        var sanitized = sanitizeProductList(data, 'import products.json');
        if (!sanitized.length) throw new Error('Dữ liệu products không hợp lệ');
        SP = sanitized;
        SP.forEach(normalizeProduct);
        saveSP();
        if (window.syncAutoPushFile) syncAutoPushFile('products.json');
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

window.saveSP = saveSP;
window.kmSave = kmSave;
window.spFind = spFind;
window.initData = initData;
window.syncFromGitHub = syncFromGitHub;
window.exportProductsJSON = exportProductsJSON;
window.importProductsJSON = importProductsJSON;
