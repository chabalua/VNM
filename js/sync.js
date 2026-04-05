// ============================================================
// SYNC MODULE — GitHub API 2 chiều (Push + Pull)
// Repo: chabalua/VNM-PWD-1
// ============================================================

var SYNC_KEY = 'vnm_github_sync';
var GH_OWNER = 'chabalua';
var GH_REPO = 'VNM-PWD-1';
var GH_BRANCH = 'main';
var GH_API = 'https://api.github.com';

// Files cần sync
var SYNC_FILES = [
  { name: 'products.json',   getLocal: function() { return SP; },       setLocal: function(d) { SP = d; SP.forEach(function(p){if(!p.kmRules)p.kmRules=[];if(!p.kmText)p.kmText='';}); saveSP(); } },
  { name: 'promotions.json', getLocal: function() { return kmProgs; },   setLocal: function(d) { kmProgs = normalizePromotionList(d); kmSave(); } },
  { name: 'customers.json',  getLocal: function() { return CUS; },       setLocal: function(d) { CUS = Array.isArray(d) ? d.filter(function(k){return k&&k.ma;}) : []; cusSave(); } },
  { name: 'routes.json',     getLocal: function() { return ROUTES; },    setLocal: function(d) { ROUTES = Array.isArray(d) ? d : []; routesSave(); } },
  { name: 'orders.json',     getLocal: function() { return getOrdersForSync(); }, setLocal: function(d) { setOrdersFromSync(d); } }
];

// ============================================================
// CONFIG — Lưu/đọc GitHub token
// ============================================================
function syncGetConfig() {
  try { return JSON.parse(localStorage.getItem(SYNC_KEY) || '{}'); } catch(e) { return {}; }
}
function syncSaveConfig(cfg) {
  localStorage.setItem(SYNC_KEY, JSON.stringify(cfg));
}
function syncGetToken() {
  return (syncGetConfig().token || '').trim();
}

// ============================================================
// GITHUB API helpers
// ============================================================
function ghHeaders() {
  var token = syncGetToken();
  if (!token) throw new Error('Chưa cài token GitHub');
  return {
    'Authorization': 'token ' + token,
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json'
  };
}

// Lấy SHA + nội dung 1 file từ GitHub
async function ghGetFile(filename) {
  var url = GH_API + '/repos/' + GH_OWNER + '/' + GH_REPO + '/contents/' + filename + '?ref=' + GH_BRANCH + '&_t=' + Date.now();
  var res = await fetch(url, { headers: ghHeaders(), cache: 'no-store' });
  if (res.status === 404) return { exists: false, sha: null, content: null };
  if (!res.ok) throw new Error('GitHub GET ' + filename + ': ' + res.status);
  var data = await res.json();
  var decoded = atob(data.content.replace(/\n/g, ''));
  // Handle UTF-8
  var content = decodeURIComponent(escape(decoded));
  return { exists: true, sha: data.sha, content: JSON.parse(content) };
}

// Push 1 file lên GitHub (create hoặc update)
async function ghPutFile(filename, content, sha) {
  var url = GH_API + '/repos/' + GH_OWNER + '/' + GH_REPO + '/contents/' + filename;
  var jsonStr = JSON.stringify(content, null, 2);
  // Encode UTF-8 → Base64
  var encoded = btoa(unescape(encodeURIComponent(jsonStr)));
  var body = {
    message: 'Sync ' + filename + ' — ' + new Date().toLocaleString('vi-VN'),
    content: encoded,
    branch: GH_BRANCH
  };
  if (sha) body.sha = sha;
  var res = await fetch(url, { method: 'PUT', headers: ghHeaders(), body: JSON.stringify(body) });
  if (!res.ok) {
    var errData = await res.json().catch(function() { return {}; });
    throw new Error('GitHub PUT ' + filename + ': ' + res.status + ' ' + (errData.message || ''));
  }
  return await res.json();
}

// ============================================================
// SYNC — Push tất cả lên GitHub
// ============================================================
async function syncPush() {
  var token = syncGetToken();
  if (!token) { syncOpenSettings(); return; }

  var overlay = document.getElementById('loadingOverlay');
  overlay.querySelector('div:nth-child(2)').textContent = 'Đang đẩy dữ liệu lên GitHub...';
  overlay.classList.add('show');

  var results = [];
  try {
    for (var i = 0; i < SYNC_FILES.length; i++) {
      var sf = SYNC_FILES[i];
      overlay.querySelector('div:nth-child(3)').textContent = '(' + (i+1) + '/' + SYNC_FILES.length + ') ' + sf.name;
      // Lấy SHA hiện tại (cần để update)
      var remote = await ghGetFile(sf.name);
      var localData = sf.getLocal();
      await ghPutFile(sf.name, localData, remote.sha);
      results.push('✅ ' + sf.name);
    }
    // Lưu thời gian sync
    var cfg = syncGetConfig();
    cfg.lastPush = new Date().toISOString();
    syncSaveConfig(cfg);
    alert('Đồng bộ lên thành công!\n\n' + results.join('\n'));
  } catch(err) {
    alert('Lỗi push: ' + err.message + '\n\nĐã push:\n' + results.join('\n'));
  } finally {
    overlay.querySelector('div:nth-child(2)').textContent = 'Đang tải dữ liệu...';
    overlay.querySelector('div:nth-child(3)').textContent = '';
    overlay.classList.remove('show');
  }
}

// ============================================================
// SYNC — Pull tất cả từ GitHub
// ============================================================
async function syncPull() {
  var token = syncGetToken();
  if (!token) { syncOpenSettings(); return; }

  var overlay = document.getElementById('loadingOverlay');
  overlay.querySelector('div:nth-child(2)').textContent = 'Đang tải dữ liệu từ GitHub...';
  overlay.classList.add('show');

  var results = [];
  try {
    for (var i = 0; i < SYNC_FILES.length; i++) {
      var sf = SYNC_FILES[i];
      overlay.querySelector('div:nth-child(3)').textContent = '(' + (i+1) + '/' + SYNC_FILES.length + ') ' + sf.name;
      var remote = await ghGetFile(sf.name);
      if (remote.exists && remote.content != null) {
        sf.setLocal(remote.content);
        results.push('✅ ' + sf.name);
      } else {
        results.push('⏭ ' + sf.name + ' (không có trên GitHub)');
      }
    }
    var cfg = syncGetConfig();
    cfg.lastPull = new Date().toISOString();
    syncSaveConfig(cfg);

    // Re-render toàn bộ
    if (window.renderOrder) renderOrder();
    if (window.renderAdm) renderAdm();
    if (window.renderKMTab) renderKMTab();
    if (window.renderDon) renderDon();
    if (window.renderCusTab) renderCusTab();

    alert('Tải về thành công!\n\n' + results.join('\n'));
  } catch(err) {
    alert('Lỗi pull: ' + err.message);
  } finally {
    overlay.querySelector('div:nth-child(2)').textContent = 'Đang tải dữ liệu...';
    overlay.querySelector('div:nth-child(3)').textContent = '';
    overlay.classList.remove('show');
  }
}

// ============================================================
// SYNC SETTINGS — UI cài đặt token
// ============================================================
function syncOpenSettings() {
  var modal = document.getElementById('km-modal');
  document.getElementById('km-modal-t').textContent = '☁️ Cài đặt đồng bộ GitHub';
  modal.style.display = 'block';

  var cfg = syncGetConfig();
  var token = cfg.token || '';
  var masked = token ? (token.substring(0, 7) + '••••••••' + token.substring(token.length - 4)) : '';
  var lastPush = cfg.lastPush ? new Date(cfg.lastPush).toLocaleString('vi-VN') : 'Chưa';
  var lastPull = cfg.lastPull ? new Date(cfg.lastPull).toLocaleString('vi-VN') : 'Chưa';

  var body = document.getElementById('km-modal-body');
  var html = '';

  html += '<div style="background:var(--vmL);border-radius:var(--Rs);padding:14px;margin-bottom:16px;border:1px solid #B8E0CB">';
  html += '<div style="font-size:13px;font-weight:700;color:var(--vm);margin-bottom:6px">📡 Repo: ' + GH_OWNER + '/' + GH_REPO + '</div>';
  html += '<div style="font-size:11px;color:var(--n2)">Push lần cuối: ' + lastPush + '</div>';
  html += '<div style="font-size:11px;color:var(--n2)">Pull lần cuối: ' + lastPull + '</div>';
  html += '</div>';

  // Token input
  html += '<div class="kf"><div class="kfl">GitHub Personal Access Token</div>';
  if (token) {
    html += '<div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">';
    html += '<div style="flex:1;height:40px;border:1.5px solid var(--vm);border-radius:var(--Rs);padding:0 12px;display:flex;align-items:center;font-size:13px;color:var(--vm);font-weight:600;background:#f0faf4">🔑 ' + masked + '</div>';
    html += '<button onclick="syncClearToken()" style="height:40px;padding:0 14px;border:1.5px solid var(--r);border-radius:var(--Rs);background:#fff;color:var(--r);font-size:12px;font-weight:700;cursor:pointer">Xóa</button>';
    html += '</div>';
  } else {
    html += '<input type="text" id="sync-token-input" placeholder="ghp_xxxxxxxxxxxx" style="width:100%;height:44px;border:1.5px solid var(--n5);border-radius:var(--Rs);padding:0 14px;font-size:14px;font-family:monospace;color:var(--n1);margin-bottom:8px">';
    html += '<button onclick="syncSaveToken()" class="btn-km-save" style="margin-top:0;height:44px;font-size:14px">💾 Lưu Token</button>';
  }
  html += '<div style="font-size:10px;color:var(--n3);margin-top:6px">Tạo token tại github.com/settings/tokens → chỉ cần quyền "repo"</div>';
  html += '</div>';

  // Sync buttons
  if (token) {
    html += '<div style="display:flex;flex-direction:column;gap:10px;margin-top:16px">';
    html += '<button onclick="document.getElementById(\'km-modal\').style.display=\'none\';syncPush()" style="width:100%;height:52px;background:linear-gradient(135deg,var(--vm),#008A50);color:#fff;border:none;border-radius:var(--R);font-size:15px;font-weight:800;cursor:pointer;box-shadow:0 4px 12px rgba(0,107,63,.25)">⬆️ Push lên GitHub</button>';
    html += '<button onclick="document.getElementById(\'km-modal\').style.display=\'none\';syncPull()" style="width:100%;height:52px;background:linear-gradient(135deg,#2563EB,#3B82F6);color:#fff;border:none;border-radius:var(--R);font-size:15px;font-weight:800;cursor:pointer;box-shadow:0 4px 12px rgba(37,99,235,.25)">⬇️ Pull từ GitHub</button>';
    html += '</div>';

    // Test connection
    html += '<button onclick="syncTestConnection()" style="width:100%;height:40px;border:1.5px solid var(--n5);border-radius:var(--Rs);background:#fff;color:var(--n2);font-size:12px;font-weight:600;cursor:pointer;margin-top:12px">🔍 Kiểm tra kết nối</button>';
  }

  // Backup section
  html += '<div style="border-top:1px solid var(--n5);margin-top:20px;padding-top:16px">';
  html += '<div class="kfl">💾 Backup / Restore offline</div>';
  html += '<div style="display:flex;gap:8px">';
  html += '<button onclick="document.getElementById(\'km-modal\').style.display=\'none\';backupAll()" style="flex:1;height:44px;border:1.5px solid var(--o);border-radius:var(--Rs);background:#fff;color:var(--o);font-size:13px;font-weight:700;cursor:pointer">📤 Backup</button>';
  html += '<button onclick="document.getElementById(\'km-modal\').style.display=\'none\';restoreAll()" style="flex:1;height:44px;border:1.5px solid var(--p);border-radius:var(--Rs);background:#fff;color:var(--p);font-size:13px;font-weight:700;cursor:pointer">📥 Restore</button>';
  html += '</div>';
  html += '<div style="font-size:10px;color:var(--n3);margin-top:6px">Xuất/nhập toàn bộ dữ liệu (SP + KM + KH + Đơn) vào 1 file JSON</div>';
  html += '</div>';

  body.innerHTML = html;
}

function syncSaveToken() {
  var input = document.getElementById('sync-token-input');
  var token = (input ? input.value : '').trim();
  if (!token || !token.startsWith('ghp_')) {
    alert('Token không hợp lệ. Token GitHub bắt đầu bằng ghp_');
    return;
  }
  var cfg = syncGetConfig();
  cfg.token = token;
  syncSaveConfig(cfg);
  syncOpenSettings(); // re-render
  alert('✅ Đã lưu token');
}

function syncClearToken() {
  if (!confirm('Xóa token GitHub?')) return;
  var cfg = syncGetConfig();
  delete cfg.token;
  syncSaveConfig(cfg);
  syncOpenSettings();
}

async function syncTestConnection() {
  try {
    var res = await fetch(GH_API + '/repos/' + GH_OWNER + '/' + GH_REPO, { headers: ghHeaders() });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    var data = await res.json();
    alert('✅ Kết nối OK!\n\nRepo: ' + data.full_name + '\nVisibility: ' + (data.private ? 'Private' : 'Public') + '\nBranch: ' + GH_BRANCH);
  } catch(err) {
    alert('❌ Lỗi: ' + err.message);
  }
}

// ============================================================
// BACKUP / RESTORE — 1 file JSON chứa toàn bộ
// ============================================================
function backupAll() {
  var data = {
    _backup: true,
    _date: new Date().toISOString(),
    _app: 'VNM Order v5',
    products: SP,
    promotions: kmProgs,
    customers: CUS,
    routes: ROUTES,
    orders: getOrdersForSync(),
    favorites: JSON.parse(localStorage.getItem('vnm_favorites') || '[]'),
    cart: cart
  };
  var str = JSON.stringify(data, null, 2);
  var blob = new Blob([str], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'vnm_backup_' + new Date().toISOString().slice(0, 10) + '.json';
  a.click();
  URL.revokeObjectURL(url);
  alert('✅ Backup hoàn tất\n' + SP.length + ' SP · ' + kmProgs.length + ' KM · ' + CUS.length + ' KH · ' + getOrdersForSync().length + ' đơn');
}

function restoreAll() {
  var input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json';
  input.onchange = function(e) {
    var file = e.target.files[0]; if (!file) return;
    var reader = new FileReader();
    reader.onload = function(ev) {
      try {
        var data = JSON.parse(ev.target.result);
        if (!data._backup) throw new Error('File không phải backup VNM Order');
        if (!confirm('Khôi phục từ backup ngày ' + (data._date || '?').slice(0,10) + '?\nDữ liệu hiện tại sẽ bị ghi đè.')) return;

        if (data.products && Array.isArray(data.products)) {
          SP = data.products;
          SP.forEach(function(p){if(!p.kmRules)p.kmRules=[];if(!p.kmText)p.kmText='';});
          saveSP();
        }
        if (data.promotions) { kmProgs = normalizePromotionList(data.promotions); kmSave(); }
        if (data.customers) { CUS = data.customers.filter(function(k){return k&&k.ma;}); cusSave(); }
        if (data.routes) { ROUTES = data.routes; routesSave(); }
        if (data.orders) { setOrdersFromSync(data.orders); }
        if (data.favorites) { localStorage.setItem('vnm_favorites', JSON.stringify(data.favorites)); }

        // Re-render
        if (window.renderOrder) renderOrder();
        if (window.renderAdm) renderAdm();
        if (window.renderKMTab) renderKMTab();
        if (window.renderDon) renderDon();
        if (window.renderCusTab) renderCusTab();

        alert('✅ Khôi phục thành công từ ' + (data._date || '').slice(0,10));
      } catch(err) { alert('Lỗi: ' + err.message); }
    };
    reader.readAsText(file);
  };
  input.click();
}

// ============================================================
// ORDERS STORAGE — Lưu lịch sử đơn hàng
// ============================================================
var ORDERS_KEY = 'vnm_orders_v2';

function getOrders() {
  try { return JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]'); } catch(e) { return []; }
}
function saveOrders(orders) {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}
function getOrdersForSync() {
  return getOrders();
}
function setOrdersFromSync(data) {
  if (Array.isArray(data)) saveOrders(data);
}

// ============================================================
// EXPORTS
// ============================================================
window.syncPush = syncPush;
window.syncPull = syncPull;
window.syncOpenSettings = syncOpenSettings;
window.syncSaveToken = syncSaveToken;
window.syncClearToken = syncClearToken;
window.syncTestConnection = syncTestConnection;
window.backupAll = backupAll;
window.restoreAll = restoreAll;
window.getOrders = getOrders;
window.saveOrders = saveOrders;
window.getOrdersForSync = getOrdersForSync;
window.setOrdersFromSync = setOrdersFromSync;
window.ORDERS_KEY = ORDERS_KEY;
