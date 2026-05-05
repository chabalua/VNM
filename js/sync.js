// ============================================================
// SYNC MODULE — GitHub API 2 chiều (Push + Pull)
// Repo: chabalua/VNM
// ============================================================

var SYNC_KEY = LS_KEYS.GITHUB_SYNC;
var GH_OWNER = 'chabalua';
var GH_REPO = 'VNM';
var GH_BRANCH = 'main';
var GH_API = 'https://api.github.com';
var ORDERS_KEY = LS_KEYS.ORDERS;
var SYNC_SHADOW_KEY = LS_KEYS.SYNC_SHADOW;
var SYNC_DEFAULTS = {
  autoPushOrders: true,
  autoPushMasterData: true,
  autoPullAllOnStart: true
};

function syncSanitizeActiveMasterRecords(name, records, sourceLabel) {
  var list = Array.isArray(records) ? records : [];
  if (name === 'products.json' && typeof sanitizeProductList === 'function') return sanitizeProductList(list, sourceLabel);
  if (name === 'promotions.json' && typeof sanitizePromotionList === 'function') return sanitizePromotionList(list, sourceLabel);
  if (name === 'customers.json' && typeof sanitizeCustomerList === 'function') return sanitizeCustomerList(list, sourceLabel);
  if (name === 'routes.json' && typeof sanitizeRouteList === 'function') return sanitizeRouteList(list, sourceLabel);
  return list;
}

function syncSanitizeMasterRecordsForMerge(name, records, sourceLabel) {
  if (!Array.isArray(records)) throw new Error(name + ' không phải mảng hợp lệ');
  var deleted = records.filter(function(entity) {
    return entity && typeof entity === 'object' && entity._deleted;
  });
  var active = records.filter(function(entity) {
    return entity && typeof entity === 'object' && !entity._deleted;
  });
  return deleted.concat(syncSanitizeActiveMasterRecords(name, active, sourceLabel));
}

var SYNC_FILES = [
  { name: 'products.json', getLocal: function() { return SP; }, setLocal: function(d) { SP = syncSanitizeActiveMasterRecords('products.json', d).filter(function(p) { return p && !p._deleted; }); SP.forEach(function(p){ if (typeof normalizeProduct === 'function') normalizeProduct(p); else { if (!p.kmRules) p.kmRules = []; if (!p.kmText) p.kmText = ''; if (p.phanLoaiTuNhap !== true) { if (p._brand && p.phanLoai === p._brand) delete p.phanLoai; delete p.phanLoaiTuNhap; } } }); saveSP(); } },
  { name: 'promotions.json', getLocal: function() { return kmProgs; }, setLocal: function(d) { kmProgs = syncSanitizeActiveMasterRecords('promotions.json', d).filter(function(prog) { return prog && !prog._deleted; }); kmSave(); } },
  { name: 'customers.json', getLocal: function() { return CUS; }, setLocal: function(d) { CUS = syncSanitizeActiveMasterRecords('customers.json', d).filter(function(k){ return k && !k._deleted; }); cusSave(); } },
  { name: 'routes.json', getLocal: function() { return ROUTES; }, setLocal: function(d) { ROUTES = syncSanitizeActiveMasterRecords('routes.json', d).filter(function(route) { return route && !route._deleted; }); routesSave(); } },
  { name: 'orders.json', getLocal: function() { return getOrdersForSync(); }, setLocal: function(d) { setOrdersFromSync(d); } }
];

function syncIsMasterDataFile(name) {
  return name === 'products.json' || name === 'promotions.json' || name === 'customers.json' || name === 'routes.json';
}

function syncGetShadowStore() {
  try {
    var raw = JSON.parse(localStorage.getItem(SYNC_SHADOW_KEY) || '{}');
    return raw && typeof raw === 'object' ? raw : {};
  } catch (e) {
    return {};
  }
}

function syncSaveShadowStore(store) {
  localStorage.setItem(SYNC_SHADOW_KEY, JSON.stringify(store || {}));
}

function syncGetShadowRecords(name) {
  var store = syncGetShadowStore();
  return Array.isArray(store[name]) ? store[name] : [];
}

function syncSetShadowRecords(name, records) {
  var store = syncGetShadowStore();
  store[name] = Array.isArray(records) ? records : [];
  syncSaveShadowStore(store);
}

function syncCreateEntityId(prefix) {
  return prefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

function syncGetEntityKey(name, entity) {
  if (!entity || typeof entity !== 'object') return '';
  if (name === 'products.json' || name === 'customers.json') return String(entity.ma || '');
  if (name === 'routes.json') return String(entity.id || '');
  if (name === 'promotions.json') return String(entity.name || entity._syncId || '');
  return '';
}

function syncEnsureEntityIdentity(name, entity) {
  if (!entity || typeof entity !== 'object') return entity;
  if (name === 'promotions.json' && !entity._syncId) entity._syncId = 'km_' + (entity.name || syncCreateEntityId('km'));
  return entity;
}

function syncGetUpdatedAtValue(entity) {
  if (!entity || !entity._updatedAt) return 0;
  var value = new Date(entity._updatedAt).getTime();
  return isNaN(value) ? 0 : value;
}

function syncNormalizeMasterRecord(name, entity) {
  if (!entity || typeof entity !== 'object') return null;
  var clone = JSON.parse(JSON.stringify(entity));
  syncEnsureEntityIdentity(name, clone);
  if (!syncGetEntityKey(name, clone)) return null;
  if (!clone._updatedAt) clone._updatedAt = new Date().toISOString();
  clone._deleted = !!clone._deleted;
  return clone;
}

function syncMergeMasterRecords(name, localRecords, remoteRecords) {
  var map = {};
  var order = [];
  [remoteRecords || [], localRecords || []].forEach(function(list) {
    list.forEach(function(entity) {
      var normalized = syncNormalizeMasterRecord(name, entity);
      var key;
      if (!normalized) return;
      key = syncGetEntityKey(name, normalized);
      if (!key) return;
      if (!map[key]) order.push(key);
      if (!map[key] || syncGetUpdatedAtValue(normalized) >= syncGetUpdatedAtValue(map[key])) {
        map[key] = normalized;
      }
    });
  });
  return order.map(function(key) { return map[key]; });
}

function syncPrepareMasterRecords(name, activeRecords) {
  var merged = syncMergeMasterRecords(name, activeRecords, syncGetShadowRecords(name));
  syncSetShadowRecords(name, merged);
  return merged;
}

function syncFilterActiveMasterRecords(name, records) {
  return (records || []).filter(function(entity) {
    var normalized = syncNormalizeMasterRecord(name, entity);
    return normalized && !normalized._deleted;
  });
}

function syncTrackEntityDeletion(name, entity) {
  var deleted = syncNormalizeMasterRecord(name, entity);
  var shadow;
  if (!syncIsMasterDataFile(name) || !deleted) return;
  deleted._deleted = true;
  deleted._updatedAt = new Date().toISOString();
  shadow = syncPrepareMasterRecords(name, []);
  shadow = syncMergeMasterRecords(name, [deleted], shadow);
  syncSetShadowRecords(name, shadow);
}

function syncGetConfig() {
  try {
    var stored = JSON.parse(localStorage.getItem(SYNC_KEY) || '{}');
    var cfg = {};
    Object.keys(SYNC_DEFAULTS).forEach(function(key) {
      cfg[key] = (stored[key] === undefined) ? SYNC_DEFAULTS[key] : stored[key];
    });
    Object.keys(stored).forEach(function(key) { cfg[key] = stored[key]; });
    return cfg;
  } catch (e) {
    return JSON.parse(JSON.stringify(SYNC_DEFAULTS));
  }
}

function syncSaveConfig(cfg) {
  localStorage.setItem(SYNC_KEY, JSON.stringify(cfg));
}

function syncGetToken() {
  return (syncGetConfig().token || '').trim();
}

function syncHasToken() {
  return !!syncGetToken();
}

function syncIsValidToken(token) {
  return /^(ghp_|github_pat_|gho_|ghu_|ghs_|ghr_)/.test(token || '');
}

function syncSetFlag(key, checked) {
  var cfg = syncGetConfig();
  cfg[key] = !!checked;
  syncSaveConfig(cfg);
  if (window.renderSettingsOverview) renderSettingsOverview();
}

function ghHeaders() {
  var token = syncGetToken();
  if (!token) throw new Error('Chưa cài token GitHub');
  return {
    'Authorization': 'token ' + token,
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json'
  };
}

async function ghGetFile(filename) {
  var url = GH_API + '/repos/' + GH_OWNER + '/' + GH_REPO + '/contents/' + filename + '?ref=' + GH_BRANCH + '&_t=' + Date.now();
  var res = await fetch(url, { headers: ghHeaders(), cache: 'no-store' });
  if (res.status === 404) return { exists: false, sha: null, content: null };
  if (!res.ok) throw new Error('GitHub GET ' + filename + ': ' + res.status);
  var data = await res.json();
  var decoded = atob(data.content.replace(/\n/g, ''));
  var content = decodeURIComponent(escape(decoded));
  return { exists: true, sha: data.sha, content: JSON.parse(content) };
}

async function ghPutFile(filename, content, sha) {
  var url = GH_API + '/repos/' + GH_OWNER + '/' + GH_REPO + '/contents/' + filename;
  var jsonStr = JSON.stringify(content, null, 2);
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

function getSyncFileConfig(name) {
  return SYNC_FILES.find(function(file) { return file.name === name; }) || null;
}

function markEntityUpdated(entity) {
  if (!entity || typeof entity !== 'object') return entity;
  entity._updatedAt = new Date().toISOString();
  return entity;
}

function getOrdersRaw() {
  try { return JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]'); } catch (e) { return []; }
}

function getOrderSortValue(order) {
  if (!order) return 0;
  if (order._updatedAt) {
    var updated = new Date(order._updatedAt).getTime();
    if (!isNaN(updated)) return updated;
  }
  if (order.date) {
    var dated = new Date(order.date).getTime();
    if (!isNaN(dated)) return dated;
  }
  return +order.id || 0;
}

function normalizeOrderRecord(order) {
  if (!order || typeof order !== 'object') return null;
  var clone = JSON.parse(JSON.stringify(order));
  if (!clone.id) clone.id = Date.now();
  if (!clone.date) clone.date = new Date(clone.id).toISOString();
  if (!clone.ngay) clone.ngay = new Date(clone.date).toLocaleDateString('vi-VN');
  if (!Array.isArray(clone.items)) clone.items = [];
  if (!Array.isArray(clone.bonusItems)) clone.bonusItems = [];
  if (!clone._updatedAt) clone._updatedAt = clone.date || new Date().toISOString();
  clone._deleted = !!clone._deleted;
  return clone;
}

function syncValidateOrdersPayload(data, sourceLabel) {
  if (!Array.isArray(data)) throw new Error((sourceLabel || 'orders.json') + ' không phải mảng hợp lệ');
  return data;
}

function mergeOrders(localOrders, remoteOrders) {
  var map = {};
  [remoteOrders || [], localOrders || []].forEach(function(list) {
    list.forEach(function(order) {
      var normalized = normalizeOrderRecord(order);
      if (!normalized) return;
      var key = String(normalized.id);
      if (!map[key] || getOrderSortValue(normalized) >= getOrderSortValue(map[key])) {
        map[key] = normalized;
      }
    });
  });
  return Object.keys(map).map(function(key) {
    return map[key];
  }).sort(function(a, b) {
    return getOrderSortValue(b) - getOrderSortValue(a);
  });
}

function getOrders() {
  return getOrdersRaw().filter(function(order) { return !order._deleted; });
}

function saveOrders(orders) {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(mergeOrders(orders || [], [])));
  if (window.lsCheckQuota) lsCheckQuota();
}

function getOrdersForSync() {
  return getOrdersRaw();
}

function setOrdersFromSync(data) {
  saveOrders(mergeOrders(getOrdersRaw(), syncValidateOrdersPayload(data, 'orders.json')));
}

function softDeleteOrder(orderId) {
  var raw = getOrdersRaw();
  var existing = raw.find(function(order) { return String(order.id) === String(orderId); });
  if (!existing) return;
  var deleted = normalizeOrderRecord(existing);
  deleted._deleted = true;
  deleted._updatedAt = new Date().toISOString();
  saveOrders(mergeOrders([deleted], raw));
}

function syncSetOverlay(message, detail) {
  var overlay = document.getElementById('loadingOverlay');
  if (!overlay) return null;
  overlay.querySelector('div:nth-child(2)').textContent = message || 'Đang tải dữ liệu...';
  overlay.querySelector('div:nth-child(3)').textContent = detail || '';
  return overlay;
}

function syncResetOverlay() {
  var overlay = document.getElementById('loadingOverlay');
  if (!overlay) return;
  overlay.querySelector('div:nth-child(2)').textContent = 'Đang tải dữ liệu...';
  overlay.querySelector('div:nth-child(3)').textContent = '';
  overlay.classList.remove('show');
}

function rerenderAfterSync() {
  if (window.renderHomeDashboard) renderHomeDashboard();
  if (window.renderSettingsOverview) renderSettingsOverview();
  if (window.renderOrder) renderOrder();
  if (window.renderAdm) renderAdm();
  if (window.renderKMTab) renderKMTab();
  if (window.renderDon) renderDon();
  if (window.renderRoutePills) renderRoutePills();
  if (window.renderCusTab) renderCusTab();
}

async function syncPushSelected(fileNames, options) {
  var token = syncGetToken();
  if (!token) {
    if (!options || !options.silent) syncOpenSettings();
    return { ok: false, skipped: true, reason: 'no-token' };
  }
  var names = fileNames || SYNC_FILES.map(function(file) { return file.name; });
  var showOverlay = !options || !options.silent;
  var overlay = syncSetOverlay('Đang đẩy dữ liệu lên GitHub...', '');
  if (showOverlay && overlay) overlay.classList.add('show');
  var results = [];
  try {
    for (var i = 0; i < names.length; i++) {
      var name = names[i];
      var file = getSyncFileConfig(name);
      if (!file) continue;
      if (showOverlay && overlay) overlay.querySelector('div:nth-child(3)').textContent = '(' + (i + 1) + '/' + names.length + ') ' + name;
      var remote = await ghGetFile(name);
      var localData = file.getLocal();
      if (name === 'orders.json') {
        localData = mergeOrders(localData, remote.exists && remote.content != null ? syncValidateOrdersPayload(remote.content, 'GitHub ' + name) : []);
        saveOrders(localData);
      } else if (syncIsMasterDataFile(name)) {
        var remoteMasterRecords = remote.exists && remote.content != null
          ? syncSanitizeMasterRecordsForMerge(name, remote.content, 'GitHub ' + name)
          : [];
        localData = syncPrepareMasterRecords(name, localData);
        localData = syncMergeMasterRecords(name, localData, remoteMasterRecords);
        syncSetShadowRecords(name, localData);
        file.setLocal(syncFilterActiveMasterRecords(name, localData));
      }
      await ghPutFile(name, localData, remote.sha);
      results.push('✅ ' + name);
    }
    var cfg = syncGetConfig();
    cfg.lastPush = new Date().toISOString();
    if (names.indexOf('orders.json') >= 0) cfg.lastOrdersPush = cfg.lastPush;
    syncSaveConfig(cfg);
    if (window.renderSettingsOverview) renderSettingsOverview();
    if (showOverlay) showToast('✅ Đồng bộ lên thành công (' + results.length + ' file)');
    return { ok: true, results: results };
  } catch (err) {
    if (showOverlay) showToast('Lỗi push: ' + err.message);
    return { ok: false, error: err.message, results: results };
  } finally {
    if (showOverlay) syncResetOverlay();
  }
}

async function syncPullSelected(fileNames, options) {
  var token = syncGetToken();
  if (!token) {
    if (!options || !options.silent) syncOpenSettings();
    return { ok: false, skipped: true, reason: 'no-token' };
  }
  var names = fileNames || SYNC_FILES.map(function(file) { return file.name; });
  var showOverlay = !options || !options.silent;
  var overlay = syncSetOverlay('Đang tải dữ liệu từ GitHub...', '');
  if (showOverlay && overlay) overlay.classList.add('show');
  var results = [];
  try {
    for (var i = 0; i < names.length; i++) {
      var name = names[i];
      var file = getSyncFileConfig(name);
      if (!file) continue;
      if (showOverlay && overlay) overlay.querySelector('div:nth-child(3)').textContent = '(' + (i + 1) + '/' + names.length + ') ' + name;
      var remote = await ghGetFile(name);
      if (remote.exists && remote.content != null) {
        if (name === 'orders.json') file.setLocal(syncValidateOrdersPayload(remote.content, 'GitHub ' + name));
        else if (syncIsMasterDataFile(name)) {
          var remoteMasterRecords = syncSanitizeMasterRecordsForMerge(name, remote.content, 'GitHub ' + name);
          var mergedMaster = syncMergeMasterRecords(name, syncPrepareMasterRecords(name, file.getLocal()), remoteMasterRecords);
          syncSetShadowRecords(name, mergedMaster);
          file.setLocal(syncFilterActiveMasterRecords(name, mergedMaster));
        } else file.setLocal(remote.content);
        results.push('✅ ' + name);
      } else {
        results.push('⏭ ' + name + ' (không có trên GitHub)');
      }
    }
    var cfg = syncGetConfig();
    cfg.lastPull = new Date().toISOString();
    if (names.indexOf('orders.json') >= 0) cfg.lastOrdersPull = cfg.lastPull;
    syncSaveConfig(cfg);
    rerenderAfterSync();
    if (showOverlay) showToast('✅ Tải về thành công (' + results.length + ' file)');
    return { ok: true, results: results };
  } catch (err) {
    if (showOverlay) showToast('Lỗi pull: ' + err.message);
    return { ok: false, error: err.message, results: results };
  } finally {
    if (showOverlay) syncResetOverlay();
  }
}

async function syncPush() {
  return await syncPushSelected(null, {});
}

async function syncPull() {
  return await syncPullSelected(null, {});
}

async function syncPushOrdersOnly() {
  return await syncPushSelected(['orders.json'], {});
}

async function syncPullOrdersOnly() {
  return await syncPullSelected(['orders.json'], {});
}

var _pushQueue = {};          // filename → true, files pending push
var _pushDebounceTimer = null; // debounce timer id

async function _flushPushQueue() {
  _pushDebounceTimer = null;
  var filesToPush = Object.keys(_pushQueue);
  _pushQueue = {};
  if (!filesToPush.length) return;
  var cfg = syncGetConfig();
  if (!cfg.autoPushMasterData || !syncHasToken()) return;
  for (var _i = 0; _i < filesToPush.length; _i++) {
    var _result = await syncPushSelected([filesToPush[_i]], { silent: true });
    if (!_result.ok && !_result.skipped) {
      showToast('⚠️ Lưu lên GitHub thất bại (' + filesToPush[_i] + '). Dữ liệu đã lưu cục bộ — hãy push thủ công.');
    }
  }
}

async function syncAutoPushFile(filename) {
  var cfg = syncGetConfig();
  if (!cfg.autoPushMasterData || !syncHasToken()) return { ok: false, skipped: true, reason: 'disabled' };
  // Queue filename and debounce — prevents race conditions when multiple saves happen in quick succession
  _pushQueue[filename] = true;
  clearTimeout(_pushDebounceTimer);
  _pushDebounceTimer = setTimeout(function() { _flushPushQueue(); }, 1500);
  return { ok: true, queued: true };
}

async function syncAutoPushOrder(order) {
  var cfg = syncGetConfig();
  if (!cfg.autoPushOrders || !syncHasToken()) return { ok: false, skipped: true, reason: 'disabled' };
  if (order) saveOrders(mergeOrders([order], getOrdersForSync()));
  return await syncPushSelected(['orders.json'], { silent: true });
}

async function syncAutoPullAllOnStart() {
  var cfg = syncGetConfig();
  if (!cfg.autoPullAllOnStart || !syncHasToken()) return { ok: false, skipped: true, reason: 'disabled' };
  return await syncPullSelected(null, { silent: true });
}

function syncOpenSettings() {
  var modal = document.getElementById('km-modal');
  document.getElementById('km-modal-t').textContent = '☁️ Cài đặt đồng bộ GitHub';
  modal.style.display = 'block';

  var cfg = syncGetConfig();
  var token = cfg.token || '';
  var masked = token ? (token.substring(0, 7) + '••••••••' + token.substring(token.length - 4)) : '';
  var lastPush = cfg.lastPush ? new Date(cfg.lastPush).toLocaleString('vi-VN') : 'Chưa';
  var lastPull = cfg.lastPull ? new Date(cfg.lastPull).toLocaleString('vi-VN') : 'Chưa';
  var lastOrdersPush = cfg.lastOrdersPush ? new Date(cfg.lastOrdersPush).toLocaleString('vi-VN') : 'Chưa';
  var lastOrdersPull = cfg.lastOrdersPull ? new Date(cfg.lastOrdersPull).toLocaleString('vi-VN') : 'Chưa';

  var body = document.getElementById('km-modal-body');
  var html = '';

  html += '<div style="background:var(--vmL);border-radius:var(--Rs);padding:14px;margin-bottom:16px;border:1px solid #C9D7FF">';
  html += '<div style="font-size:13px;font-weight:700;color:var(--vm);margin-bottom:6px">📡 Repo: ' + GH_OWNER + '/' + GH_REPO + '</div>';
  html += '<div style="font-size:11px;color:var(--n2)">Push lần cuối: ' + lastPush + '</div>';
  html += '<div style="font-size:11px;color:var(--n2)">Pull lần cuối: ' + lastPull + '</div>';
  html += '<div style="font-size:11px;color:var(--n2)">Push đơn gần nhất: ' + lastOrdersPush + '</div>';
  html += '<div style="font-size:11px;color:var(--n2)">Pull đơn gần nhất: ' + lastOrdersPull + '</div>';
  html += '</div>';

  html += '<div class="kf"><div class="kfl">GitHub Personal Access Token</div>';
  if (token) {
    html += '<div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">';
    html += '<div style="flex:1;height:40px;border:1.5px solid var(--vm);border-radius:var(--Rs);padding:0 12px;display:flex;align-items:center;font-size:13px;color:var(--vm);font-weight:600;background:var(--surface-accent)">🔑 ' + masked + '</div>';
    html += '<button onclick="syncClearToken()" style="height:40px;padding:0 14px;border:1.5px solid var(--r);border-radius:var(--Rs);background:var(--card);color:var(--r);font-size:12px;font-weight:700;cursor:pointer">Xóa</button>';
    html += '</div>';
  } else {
    html += '<input type="text" id="sync-token-input" placeholder="ghp_xxxxxxxxxxxx" style="width:100%;height:44px;border:1.5px solid var(--n5);border-radius:var(--Rs);padding:0 14px;font-size:14px;font-family:monospace;color:var(--n1);margin-bottom:8px">';
    html += '<button onclick="syncSaveToken()" class="btn-km-save" style="margin-top:0;height:44px;font-size:14px">💾 Lưu Token</button>';
  }
  html += '<div style="font-size:10px;color:var(--n3);margin-top:6px">Hỗ trợ token classic và fine-grained. Cần quyền đọc/ghi contents.</div>';
  html += '</div>';

  if (token) {
    html += '<div style="background:var(--n6);border-radius:var(--Rs);padding:12px 14px;margin-bottom:14px">';
    html += '<div class="kfl" style="margin-bottom:10px">Tuỳ chọn cloud</div>';
    html += '<label style="display:flex;align-items:center;gap:8px;font-size:12px;color:var(--n2);margin-bottom:8px"><input type="checkbox" onchange="syncSetFlag(\'autoPushOrders\',this.checked)" ' + (cfg.autoPushOrders ? 'checked' : '') + ' style="width:18px;height:18px;accent-color:var(--vm)"> Tự lưu đơn mới lên GitHub</label>';
    html += '<label style="display:flex;align-items:center;gap:8px;font-size:12px;color:var(--n2);margin-bottom:8px"><input type="checkbox" onchange="syncSetFlag(\'autoPushMasterData\',this.checked)" ' + (cfg.autoPushMasterData ? 'checked' : '') + ' style="width:18px;height:18px;accent-color:var(--vm)"> Tự lưu giá, KH, CTKM khi chỉnh sửa</label>';
    html += '<label style="display:flex;align-items:center;gap:8px;font-size:12px;color:var(--n2)"><input type="checkbox" onchange="syncSetFlag(\'autoPullAllOnStart\',this.checked)" ' + (cfg.autoPullAllOnStart ? 'checked' : '') + ' style="width:18px;height:18px;accent-color:var(--b)"> Tự tải toàn bộ dữ liệu cloud khi mở app</label>';
    html += '</div>';

    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">';
    var _ic = window.renderIcon || function() { return ''; };
    html += '<button onclick="document.getElementById(\'km-modal\').style.display=\'none\';syncPushOrdersOnly()" style="height:44px;border:1.5px solid var(--vm);border-radius:var(--Rs);background:var(--card);color:var(--vm);font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px">' + _ic('upload', 15, 2) + 'Push đơn hàng</button>';
    html += '<button onclick="document.getElementById(\'km-modal\').style.display=\'none\';syncPullOrdersOnly()" style="height:44px;border:1.5px solid var(--b);border-radius:var(--Rs);background:var(--card);color:var(--b);font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px">' + _ic('download', 15, 2) + 'Pull đơn hàng</button>';
    html += '</div>';

    html += '<div style="display:flex;flex-direction:column;gap:10px;margin-top:16px">';
    html += '<button onclick="document.getElementById(\'km-modal\').style.display=\'none\';syncPush()" style="width:100%;height:52px;background:linear-gradient(135deg,var(--vm),#245bff);color:#fff;border:none;border-radius:var(--R);font-size:15px;font-weight:800;cursor:pointer;box-shadow:0 4px 12px rgba(26,77,255,.22);display:flex;align-items:center;justify-content:center;gap:8px">' + _ic('upload', 18, 2) + 'Push toàn bộ dữ liệu</button>';
    html += '<button onclick="document.getElementById(\'km-modal\').style.display=\'none\';syncPull()" style="width:100%;height:52px;background:linear-gradient(135deg,#111827,#2f3e63);color:#fff;border:none;border-radius:var(--R);font-size:15px;font-weight:800;cursor:pointer;box-shadow:0 4px 12px rgba(17,24,39,.18);display:flex;align-items:center;justify-content:center;gap:8px">' + _ic('download', 18, 2) + 'Pull toàn bộ dữ liệu</button>';
    html += '</div>';
    html += '<button onclick="syncTestConnection()" style="width:100%;height:40px;border:1.5px solid var(--n5);border-radius:var(--Rs);background:var(--card);color:var(--n2);font-size:12px;font-weight:600;cursor:pointer;margin-top:12px;display:flex;align-items:center;justify-content:center;gap:6px">' + _ic('search', 14, 2) + 'Kiểm tra kết nối</button>';
  }

  html += '<div style="border-top:1px solid var(--n5);margin-top:20px;padding-top:16px">';
  html += '<div class="kfl">💾 Backup / Restore offline</div>';
  html += '<div style="display:flex;gap:8px">';
  html += '<button onclick="document.getElementById(\'km-modal\').style.display=\'none\';backupAll()" style="flex:1;height:44px;border:1.5px solid var(--o);border-radius:var(--Rs);background:var(--card);color:var(--o);font-size:13px;font-weight:700;cursor:pointer">📤 Backup</button>';
  html += '<button onclick="document.getElementById(\'km-modal\').style.display=\'none\';restoreAll()" style="flex:1;height:44px;border:1.5px solid var(--p);border-radius:var(--Rs);background:var(--card);color:var(--p);font-size:13px;font-weight:700;cursor:pointer">📥 Restore</button>';
  html += '</div>';
  html += '<div style="font-size:10px;color:var(--n3);margin-top:6px">Xuất/nhập toàn bộ dữ liệu (SP + KM + KH + Đơn) vào 1 file JSON</div>';
  html += '</div>';

  body.innerHTML = html;
}

function syncSaveToken() {
  var input = document.getElementById('sync-token-input');
  var token = (input ? input.value : '').trim();
  if (!syncIsValidToken(token)) {
    showToast('Token không hợp lệ. Dùng GitHub token classic hoặc fine-grained.');
    return;
  }
  var cfg = syncGetConfig();
  cfg.token = token;
  syncSaveConfig(cfg);
  syncOpenSettings();
  if (window.renderSettingsOverview) renderSettingsOverview();
  showToast('✅ Đã lưu token');
}

function syncClearToken() {
  var cfg = syncGetConfig();
  delete cfg.token;
  syncSaveConfig(cfg);
  syncOpenSettings();
  if (window.renderSettingsOverview) renderSettingsOverview();
}

async function syncTestConnection() {
  try {
    var res = await fetch(GH_API + '/repos/' + GH_OWNER + '/' + GH_REPO, { headers: ghHeaders() });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    var data = await res.json();
    showToast('✅ Kết nối OK! ' + data.full_name + ' (' + (data.private ? 'Private' : 'Public') + ')');
  } catch (err) {
    showToast('❌ Lỗi: ' + err.message);
  }
}

function backupAll() {
  var data = {
    _backup: true,
    _date: new Date().toISOString(),
    _app: 'VNM Order v6',
    products: SP,
    promotions: kmProgs,
    customers: CUS,
    routes: ROUTES,
    orders: getOrdersForSync(),
    favorites: JSON.parse(localStorage.getItem(LS_KEYS.FAVORITES) || '[]'),
    cart: cart,
    kpiConfig: (typeof getKpiConfig === 'function') ? getKpiConfig() : null
  };
  var str = JSON.stringify(data, null, 2);
  var blob = new Blob([str], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'vnm_backup_' + new Date().toISOString().slice(0, 10) + '.json';
  a.click();
  URL.revokeObjectURL(url);
  showToast('✅ Backup hoàn tất · ' + SP.length + ' SP · ' + kmProgs.length + ' KM · ' + CUS.length + ' KH · ' + getOrdersForSync().length + ' đơn');
}

function syncRestoreBackupData(data) {
  if (!data || typeof data !== 'object') throw new Error('File backup không hợp lệ');
  if (!data._backup) throw new Error('File không phải backup VNM Order');

  var nextProducts = null;
  var nextPromotions = null;
  var nextCustomers = null;
  var nextRoutes = null;
  var nextOrders = null;

  if (data.products !== undefined) {
    if (!Array.isArray(data.products)) throw new Error('Backup products không hợp lệ');
    nextProducts = syncSanitizeActiveMasterRecords('products.json', data.products, 'backup products');
    if (data.products.length && !nextProducts.length) throw new Error('Backup products không có dữ liệu hợp lệ');
  }
  if (data.promotions !== undefined) {
    if (!Array.isArray(data.promotions)) throw new Error('Backup promotions không hợp lệ');
    nextPromotions = syncSanitizeActiveMasterRecords('promotions.json', data.promotions, 'backup promotions');
    if (data.promotions.length && !nextPromotions.length) throw new Error('Backup promotions không có dữ liệu hợp lệ');
  }
  if (data.customers !== undefined) {
    if (!Array.isArray(data.customers)) throw new Error('Backup customers không hợp lệ');
    nextCustomers = syncSanitizeActiveMasterRecords('customers.json', data.customers, 'backup customers');
    if (data.customers.length && !nextCustomers.length) throw new Error('Backup customers không có dữ liệu hợp lệ');
  }
  if (data.routes !== undefined) {
    if (!Array.isArray(data.routes)) throw new Error('Backup routes không hợp lệ');
    nextRoutes = syncSanitizeActiveMasterRecords('routes.json', data.routes, 'backup routes');
    if (data.routes.length && !nextRoutes.length) throw new Error('Backup routes không có dữ liệu hợp lệ');
  }
  if (data.orders !== undefined) {
    if (!Array.isArray(data.orders)) throw new Error('Backup orders không hợp lệ');
    nextOrders = mergeOrders(data.orders, []);
    if (data.orders.length && !nextOrders.length) throw new Error('Backup orders không có dữ liệu hợp lệ');
  }
  if (data.favorites !== undefined && !Array.isArray(data.favorites)) throw new Error('Backup favorites không hợp lệ');
  if (data.cart !== undefined && !Array.isArray(data.cart)) throw new Error('Backup cart không hợp lệ');
  if (data.kpiConfig !== undefined && data.kpiConfig !== null && typeof data.kpiConfig !== 'object') throw new Error('Backup KPI config không hợp lệ');

  if (nextProducts) {
    SP = nextProducts;
    SP.forEach(function(p) {
      if (typeof normalizeProduct === 'function') normalizeProduct(p);
      else {
        if (!p.kmRules) p.kmRules = [];
        if (!p.kmText) p.kmText = '';
        if (p.phanLoaiTuNhap !== true) {
          if (p._brand && p.phanLoai === p._brand) delete p.phanLoai;
          delete p.phanLoaiTuNhap;
        }
      }
    });
    saveSP();
  }
  if (nextPromotions) {
    kmProgs = nextPromotions;
    kmSave();
  }
  if (nextCustomers) {
    CUS = nextCustomers;
    cusSave();
  }
  if (nextRoutes) {
    ROUTES = nextRoutes;
    routesSave();
  }
  if (nextOrders) saveOrders(nextOrders);
  if (data.favorites !== undefined) localStorage.setItem(LS_KEYS.FAVORITES, JSON.stringify(data.favorites));
  if (data.cart !== undefined) {
    cart = data.cart;
    localStorage.setItem(LS_KEYS.CART, JSON.stringify(cart));
  }
  if (data.kpiConfig && typeof setKpiConfig === 'function') setKpiConfig(data.kpiConfig);

  return {
    date: data._date || '',
    products: nextProducts ? nextProducts.length : null,
    promotions: nextPromotions ? nextPromotions.length : null,
    customers: nextCustomers ? nextCustomers.length : null,
    routes: nextRoutes ? nextRoutes.length : null,
    orders: nextOrders ? nextOrders.length : null
  };
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
        var restored = syncRestoreBackupData(data);
        rerenderAfterSync();
        showToast('✅ Khôi phục thành công từ ' + (restored.date || '').slice(0, 10));
      } catch (err) {
        showToast('Lỗi: ' + err.message);
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

window.syncPush = syncPush;
window.syncPull = syncPull;
window.syncPushOrdersOnly = syncPushOrdersOnly;
window.syncPullOrdersOnly = syncPullOrdersOnly;
window.syncAutoPushOrder = syncAutoPushOrder;
window.syncAutoPushFile = syncAutoPushFile;
window.syncAutoPullAllOnStart = syncAutoPullAllOnStart;
window.syncOpenSettings = syncOpenSettings;
window.syncSaveToken = syncSaveToken;
window.syncClearToken = syncClearToken;
window.syncTestConnection = syncTestConnection;
window.syncSetFlag = syncSetFlag;
window.syncGetConfig = syncGetConfig;
window.syncHasToken = syncHasToken;
window.syncTrackEntityDeletion = syncTrackEntityDeletion;
window.syncRestoreBackupData = syncRestoreBackupData;
window.syncValidateOrdersPayload = syncValidateOrdersPayload;
window.backupAll = backupAll;
window.restoreAll = restoreAll;
window.getOrders = getOrders;
window.getOrdersForSync = getOrdersForSync;
window.getOrdersRaw = getOrdersRaw;
window.saveOrders = saveOrders;
window.setOrdersFromSync = setOrdersFromSync;
window.softDeleteOrder = softDeleteOrder;
window.markEntityUpdated = markEntityUpdated;
window.ORDERS_KEY = ORDERS_KEY;
