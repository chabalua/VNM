// Quản lý dữ liệu SP và KM
let SP = [];
let kmProgs = [];

function validateProductList(data) {
  return Array.isArray(data) && data.every(item => item && typeof item.ma === 'string' && typeof item.giaNYLon === 'number');
}

function isPromotionMetadata(item) {
  if (!item || typeof item !== 'object') return false;
  const keys = Object.keys(item);
  if (!keys.length) return false;
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

async function fetchJSON(url, storageKey, fallback) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    localStorage.setItem(storageKey, JSON.stringify(data));
    return data;
  } catch (err) {
    console.warn(`Fetch ${url} thất bại:`, err);
    const cached = localStorage.getItem(storageKey);
    if (cached) {
      try { return JSON.parse(cached); } catch(e) {}
    }
    return fallback;
  }
}

async function loadProducts() {
  const raw = await fetchJSON(PRODUCTS_URL, 'vnm_sp', FALLBACK_PRODUCTS);
  SP = validateProductList(raw) ? raw : FALLBACK_PRODUCTS;
  SP.forEach(p => {
    if (!p.kmRules) p.kmRules = [];
    if (!p.kmText) p.kmText = '';
  });
  saveSP();
}

async function loadPromotions() {
  let raw = await fetchJSON(LOCAL_PROMOTIONS_URL, 'vnm_km3', []);
  if (!validatePromotionList(raw) || !raw.length) {
    raw = await fetchJSON(PROMOTIONS_URL, 'vnm_km3', []);
  }
  const normalized = normalizePromotionList(raw);
  kmProgs = validatePromotionList(normalized) ? normalized : [];
  kmSave();
}

function saveSP() { localStorage.setItem('vnm_sp', JSON.stringify(SP)); }
function kmSave() { localStorage.setItem('vnm_km3', JSON.stringify(kmProgs)); }
function spFind(ma) { return SP.find(x => x.ma === ma); }

async function initData() {
  const overlay = document.getElementById('loadingOverlay');
  overlay.classList.add('show');
  await Promise.all([loadProducts(), loadPromotions()]);
  overlay.classList.remove('show');
  if (!localStorage.getItem('vnm_favorites')) {
    localStorage.setItem('vnm_favorites', '[]');
  }
}

async function syncFromGitHub() {
  if (!confirm('Tải lại toàn bộ SP và CT KM từ GitHub?\nDữ liệu local sẽ bị ghi đè.')) return;
  const overlay = document.getElementById('loadingOverlay');
  overlay.classList.add('show');
  try {
    const [newProducts, newPromos] = await Promise.all([
      fetch(PRODUCTS_URL).then(r => r.json()),
      fetch(PROMOTIONS_URL).then(r => r.json())
    ]);
    SP = newProducts;
    kmProgs = normalizePromotionList(newPromos);
    saveSP(); kmSave();
    if (window.renderOrder) window.renderOrder();
    if (window.renderAdm) window.renderAdm();
    if (window.renderKMTab) window.renderKMTab();
    if (window.renderDon) window.renderDon();
    alert('✅ Đồng bộ thành công từ GitHub');
  } catch (err) {
    alert('Lỗi đồng bộ: ' + err.message);
  } finally { overlay.classList.remove('show'); }
}

function exportData() {
  const data = { products: SP, promotions: kmProgs };
  const str = JSON.stringify(data, null, 2);
  const blob = new Blob([str], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url;
  a.download = `vnm_full_data_${new Date().toISOString().slice(0,19)}.json`;
  a.click(); URL.revokeObjectURL(url);
  alert('✅ Đã xuất data (SP + CT KM)');
}

function importData() {
  const input = document.createElement('input'); input.type = 'file'; input.accept = 'application/json';
  input.onchange = e => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        let changed = false;
        if (data.products) {
          if (!validateProductList(data.products)) throw new Error('products không hợp lệ');
          SP = data.products; saveSP(); changed = true;
        }
        if (data.promotions) {
          const normalized = normalizePromotionList(data.promotions);
          if (!validatePromotionList(normalized)) throw new Error('promotions không hợp lệ');
          kmProgs = normalized; kmSave(); changed = true;
        }
        if (!changed) throw new Error('Không tìm thấy products/promotions');
        if (window.renderOrder) window.renderOrder();
        if (window.renderAdm) window.renderAdm();
        if (window.renderKMTab) window.renderKMTab();
        if (window.renderDon) window.renderDon();
        alert('✅ Nhập thành công');
      } catch (err) { alert('Lỗi: ' + err.message); }
    };
    reader.readAsText(file);
  };
  input.click();
}

// ============================================================
// XUẤT products.json riêng (push lên GitHub để sync giá)
// ============================================================
function exportProductsJSON() {
  var cleanProducts = SP.map(function(p) {
    var clean = { ma: p.ma, ten: p.ten, nhom: p.nhom, donvi: p.donvi, slThung: p.slThung, giaNYLon: p.giaNYLon, giaNYThung: p.giaNYThung };
    if (p.locSize) { clean.locSize = p.locSize; clean.locLabel = p.locLabel || 'Lốc'; }
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
  alert('✅ Đã xuất products.json (' + SP.length + ' SP)\nPush lên GitHub để cập nhật giá cho tất cả thiết bị.');
}

window.SP = () => SP;
window.kmProgs = () => kmProgs;
window.saveSP = saveSP;
window.kmSave = kmSave;
window.spFind = spFind;
window.initData = initData;
window.syncFromGitHub = syncFromGitHub;
window.exportData = exportData;
window.importData = importData;
window.exportProductsJSON = exportProductsJSON;
