// Quản lý dữ liệu SP và KM
let SP = [];
let kmProgs = [];

function validateProductList(data) {
  return Array.isArray(data) && data.every(item => item && typeof item.ma === 'string' && typeof item.giaNYLon === 'number');
}

function validatePromotionList(data) {
  return Array.isArray(data) && data.every(item => {
    if (!item || typeof item.name !== 'string' || typeof item.type !== 'string') return false;
    if (item.type === 'order_money') return true;
    return Array.isArray(item.spMas);
  });
}

// Hàm fetch với cache local
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

// Tải sản phẩm
async function loadProducts() {
  const raw = await fetchJSON(PRODUCTS_URL, 'vnm_sp', FALLBACK_PRODUCTS);
  SP = validateProductList(raw) ? raw : FALLBACK_PRODUCTS;
  SP.forEach(p => {
    if (!p.kmRules) p.kmRules = [];
    if (!p.kmText) p.kmText = '';
  });
  saveSP();
}

// Tải CT KM
async function loadPromotions() {
  let raw = await fetchJSON(LOCAL_PROMOTIONS_URL, 'vnm_km3', []);
  if (!validatePromotionList(raw) || !raw.length) {
    raw = await fetchJSON(PROMOTIONS_URL, 'vnm_km3', []);
  }
  kmProgs = validatePromotionList(raw) ? raw : [];
  kmSave();
}

// Lưu SP vào localStorage
function saveSP() { localStorage.setItem('vnm_sp', JSON.stringify(SP)); }
// Lưu KM vào localStorage
function kmSave() { localStorage.setItem('vnm_km3', JSON.stringify(kmProgs)); }

// Tìm sản phẩm theo mã
function spFind(ma) { return SP.find(x => x.ma === ma); }

// Khởi tạo dữ liệu (gọi khi load trang)
async function initData() {
  const overlay = document.getElementById('loadingOverlay');
  overlay.classList.add('show');
  await Promise.all([loadProducts(), loadPromotions()]);
  overlay.classList.remove('show');
  // Khởi tạo danh sách yêu thích nếu chưa có
  if (!localStorage.getItem('vnm_favorites')) {
    localStorage.setItem('vnm_favorites', '[]');
  }
  // Các hàm render sẽ được gọi từ main.js sau khi init
}

// Đồng bộ thủ công từ GitHub
async function syncFromGitHub() {
  if (!confirm('Tải lại toàn bộ sản phẩm và CT KM từ GitHub?\nMọi thay đổi chưa lưu lên GitHub sẽ bị mất.')) return;
  const overlay = document.getElementById('loadingOverlay');
  overlay.classList.add('show');
  try {
    const [newProducts, newPromos] = await Promise.all([
      fetch(PRODUCTS_URL).then(r => r.json()),
      fetch(PROMOTIONS_URL).then(r => r.json())
    ]);
    SP = newProducts;
    kmProgs = newPromos;
    saveSP();
    kmSave();
    // Cập nhật giao diện
    if (window.renderOrder) window.renderOrder();
    if (window.renderAdm) window.renderAdm();
    if (window.renderKMTab) window.renderKMTab();
    if (window.renderDon) window.renderDon();
    if (window.renderKH) window.renderKH();
    alert('✅ Đồng bộ thành công từ GitHub');
  } catch (err) {
    alert('Lỗi đồng bộ: ' + err.message);
  } finally {
    overlay.classList.remove('show');
  }
}

// Xuất toàn bộ data (sản phẩm + CT KM)
function exportData() {
  const data = { products: SP, promotions: kmProgs };
  const str = JSON.stringify(data, null, 2);
  const blob = new Blob([str], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `vnm_full_data_${new Date().toISOString().slice(0,19)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  alert('✅ Đã xuất toàn bộ data (sản phẩm + CT KM)');
}

// Nhập toàn bộ data
function importData() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json';
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        let changed = false;
        if (data.products) {
          if (!validateProductList(data.products)) throw new Error('Dữ liệu products không hợp lệ');
          SP = data.products;
          saveSP();
          changed = true;
        }
        if (data.promotions) {
          if (!validatePromotionList(data.promotions)) throw new Error('Dữ liệu promotions không hợp lệ');
          kmProgs = data.promotions;
          kmSave();
          changed = true;
        }
        if (!changed) throw new Error('File không chứa products hoặc promotions hợp lệ');
        if (window.renderOrder) window.renderOrder();
        if (window.renderAdm) window.renderAdm();
        if (window.renderKMTab) window.renderKMTab();
        if (window.renderDon) window.renderDon();
        if (window.renderKH) window.renderKH();
        alert('✅ Nhập data thành công');
      } catch (err) { alert('Lỗi đọc file: ' + err.message); }
    };
    reader.readAsText(file);
  };
  input.click();
}

// Đưa các hàm và biến ra window để dùng trong các file khác và onclick
window.SP = () => SP;
window.kmProgs = () => kmProgs;
window.saveSP = saveSP;
window.kmSave = kmSave;
window.spFind = spFind;
window.initData = initData;
window.syncFromGitHub = syncFromGitHub;
window.exportData = exportData;
window.importData = importData;