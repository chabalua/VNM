// Khởi tạo, sự kiện chính, tab switching

var NAV_TABS = ['home', 'order', 'don', 'kh', 'adm'];
var ALL_PAGES = ['home', 'order', 'don', 'adm', 'km', 'kh'];
var KPI_DEFAULT_TARGETS = {
  totalSales: 1416533000,
  monthlyOrders: 120,
  activeCustomers: 90,
  rewardTarget: 42000000,
  dsNhomC: 331780000,
  dsNhomDE: 207011000,
  dsSBPS: 107350000
};

function gotoTab(t) {
  var activeNav = (t === 'km') ? 'adm' : t;
  ALL_PAGES.forEach(function(x) {
    var page = document.getElementById('page-' + x);
    if (page) page.className = 'page' + (x === t ? ' on' : '');
  });
  NAV_TABS.forEach(function(x) {
    var tab = document.getElementById('tab-' + x);
    if (tab) tab.className = 'tb' + (x === activeNav ? ' on' : '');
  });

  if (t === 'home') renderHomeDashboard();
  if (t === 'don') renderDon();
  if (t === 'adm') { renderSettingsOverview(); renderAdm(); }
  if (t === 'km') renderKMTab();
  if (t === 'kh') { renderRoutePills(); renderCusTab(); }

  var fabs = { km: 'km-fab', adm: 'adm-fab', kh: 'kh-fab' };
  Object.keys(fabs).forEach(function(tab) {
    var fab = document.getElementById(fabs[tab]);
    if (fab) fab.style.display = (t === tab ? 'flex' : 'none');
  });

  var stt = document.getElementById('scroll-top-btn');
  if (stt) stt.style.display = (t === 'order' ? 'flex' : 'none');
}

function getCurrentMonthKey() {
  var d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
}

function getCurrentMonthLabel() {
  var d = new Date();
  return 'T' + String(d.getMonth() + 1) + '/' + d.getFullYear();
}

function calcProgress(actual, target) {
  if (!target) return 0;
  return Math.max(0, Math.min(100, Math.round(actual / target * 100)));
}

function getDashboardData() {
  var monthKey = getCurrentMonthKey();
  var orders = (typeof getOrders === 'function' ? getOrders() : []);
  var monthOrders = orders.filter(function(order) {
    return (order.date || '').slice(0, 7) === monthKey;
  });
  var customers = (typeof CUS !== 'undefined' && Array.isArray(CUS)) ? CUS : [];
  var totalSalesByCustomers = customers.reduce(function(sum, kh) {
    var md = (kh.monthly && kh.monthly[monthKey]) || {};
    return sum + (md.dsNhomC || 0) + (md.dsNhomDE || 0) + (md.dsSBPS || 0);
  }, 0);
  var totalSalesByOrders = monthOrders.reduce(function(sum, order) { return sum + (+order.tong || 0); }, 0);
  var totalSales = Math.max(totalSalesByCustomers, totalSalesByOrders);
  var rewardTotal = customers.reduce(function(sum, kh) {
    var md = (kh.monthly && kh.monthly[monthKey]) || {};
    var reward = (typeof calcTotalReward === 'function') ? calcTotalReward(kh, md) : { totalReward: 0 };
    return sum + (reward.totalReward || 0);
  }, 0);
  var activeCustomers = customers.filter(function(kh) {
    var md = (kh.monthly && kh.monthly[monthKey]) || {};
    return ((md.dsNhomC || 0) + (md.dsNhomDE || 0) + (md.dsSBPS || 0)) > 0;
  }).length;
  var totalItems = monthOrders.reduce(function(sum, order) { return sum + ((order.items || []).length || 0); }, 0);
  var avgSku = monthOrders.length ? (totalItems / monthOrders.length) : 0;
  var dsNhomC = customers.reduce(function(sum, kh) { return sum + (((kh.monthly || {})[monthKey] || {}).dsNhomC || 0); }, 0);
  var dsNhomDE = customers.reduce(function(sum, kh) { return sum + (((kh.monthly || {})[monthKey] || {}).dsNhomDE || 0); }, 0);
  var dsSBPS = customers.reduce(function(sum, kh) { return sum + (((kh.monthly || {})[monthKey] || {}).dsSBPS || 0); }, 0);
  var cfg = (typeof syncGetConfig === 'function') ? syncGetConfig() : {};

  return {
    monthLabel: getCurrentMonthLabel(),
    totalSales: totalSales,
    monthOrders: monthOrders.length,
    activeCustomers: activeCustomers,
    rewardTotal: rewardTotal,
    avgSku: avgSku,
    dsNhomC: dsNhomC,
    dsNhomDE: dsNhomDE,
    dsSBPS: dsSBPS,
    syncState: {
      hasToken: !!(cfg.token || ''),
      lastPull: cfg.lastPull || '',
      lastPush: cfg.lastPush || ''
    }
  };
}

function renderHomeDashboard() {
  var data = getDashboardData();
  var hero = document.getElementById('home-hero-metrics');
  var content = document.getElementById('home-content');
  if (!hero || !content) return;

  hero.innerHTML = '' +
    '<div class="hero-metric-card"><div class="hero-metric-label">Doanh số tháng</div><div class="hero-metric-value">' + fmt(data.totalSales) + 'đ</div></div>' +
    '<div class="hero-metric-card"><div class="hero-metric-label">Đơn trong tháng</div><div class="hero-metric-value">' + data.monthOrders + '</div></div>' +
    '<div class="hero-metric-card"><div class="hero-metric-label">KH active</div><div class="hero-metric-value">' + data.activeCustomers + '</div></div>';

  var rows = [
    { label: 'Doanh số tổng', target: KPI_DEFAULT_TARGETS.totalSales, actual: data.totalSales },
    { label: 'Đơn hàng hoàn thành', target: KPI_DEFAULT_TARGETS.monthlyOrders, actual: data.monthOrders },
    { label: 'Khách hàng active', target: KPI_DEFAULT_TARGETS.activeCustomers, actual: data.activeCustomers },
    { label: 'Thưởng dự kiến', target: KPI_DEFAULT_TARGETS.rewardTarget, actual: data.rewardTotal },
    { label: 'Nhóm C', target: KPI_DEFAULT_TARGETS.dsNhomC, actual: data.dsNhomC },
    { label: 'Nhóm DE', target: KPI_DEFAULT_TARGETS.dsNhomDE, actual: data.dsNhomDE },
    { label: 'SBPS', target: KPI_DEFAULT_TARGETS.dsSBPS, actual: data.dsSBPS }
  ];

  var syncText = data.syncState.hasToken ? 'Đã kết nối GitHub' : 'Chưa cấu hình token GitHub';
  var syncMeta = data.syncState.lastPull ? ('Pull gần nhất: ' + new Date(data.syncState.lastPull).toLocaleString('vi-VN')) : 'Chưa pull dữ liệu cloud';

  var html = '<div class="dashboard-grid">';
  html += '<div class="dashboard-card dashboard-card-wide">';
  html += '<div class="dashboard-card-head"><div><div class="dashboard-kicker">Thống kê ' + data.monthLabel + '</div><div class="dashboard-title">Chỉ tiêu tháng</div></div><div class="dashboard-status">ASO ' + data.avgSku.toFixed(1) + '</div></div>';
  html += '<div class="kpi-table">';
  rows.forEach(function(row) {
    var pct = calcProgress(row.actual, row.target);
    html += '<div class="kpi-row"><div class="kpi-main"><div class="kpi-name">' + row.label + '</div><div class="kpi-values"><span>Mục tiêu ' + fmt(row.target) + '</span><span>Thực hiện ' + fmt(row.actual) + '</span></div></div><div class="kpi-progress"><div class="kpi-progress-bar"><span style="width:' + pct + '%"></span></div><div class="kpi-progress-label">' + pct + '%</div></div></div>';
  });
  html += '</div></div>';

  html += '<div class="dashboard-card">';
  html += '<div class="dashboard-card-head"><div><div class="dashboard-kicker">Hành động nhanh</div><div class="dashboard-title">Điều hướng</div></div></div>';
  html += '<div class="action-grid">';
  html += '<button class="action-card" onclick="gotoTab(\'order\')"><span class="action-icon">◫</span><span>Đặt hàng</span></button>';
  html += '<button class="action-card" onclick="gotoTab(\'kh\')"><span class="action-icon">◎</span><span>Khách hàng</span></button>';
  html += '<button class="action-card" onclick="gotoTab(\'don\')"><span class="action-icon">☰</span><span>Đơn hàng</span></button>';
  html += '<button class="action-card" onclick="syncOpenSettings()"><span class="action-icon">☁</span><span>Cloud</span></button>';
  html += '</div></div>';

  html += '<div class="dashboard-card">';
  html += '<div class="dashboard-card-head"><div><div class="dashboard-kicker">Đồng bộ</div><div class="dashboard-title">GitHub Cloud</div></div><div class="sync-pill ' + (data.syncState.hasToken ? 'ready' : '') + '">' + syncText + '</div></div>';
  html += '<div class="sync-note">' + syncMeta + '</div>';
  html += '<div class="sync-actions"><button class="mini-action" onclick="syncOpenSettings()">Mở cài đặt</button><button class="mini-action primary" onclick="syncPull()">Pull toàn bộ</button></div>';
  html += '</div>';

  html += '</div>';
  content.innerHTML = html;
}

function renderSettingsOverview() {
  var el = document.getElementById('settings-overview');
  if (!el) return;
  var cfg = (typeof syncGetConfig === 'function') ? syncGetConfig() : {};
  var orders = (typeof getOrders === 'function') ? getOrders() : [];
  var lastPush = cfg.lastPush ? new Date(cfg.lastPush).toLocaleString('vi-VN') : 'Chưa';
  var lastPull = cfg.lastPull ? new Date(cfg.lastPull).toLocaleString('vi-VN') : 'Chưa';
  el.innerHTML = '' +
    '<div class="settings-info-card"><div class="settings-info-number">' + SP.length + '</div><div class="settings-info-label">Sản phẩm</div></div>' +
    '<div class="settings-info-card"><div class="settings-info-number">' + kmProgs.length + '</div><div class="settings-info-label">CTKM</div></div>' +
    '<div class="settings-info-card"><div class="settings-info-number">' + ((typeof CUS !== 'undefined' && Array.isArray(CUS)) ? CUS.length : 0) + '</div><div class="settings-info-label">Khách hàng</div></div>' +
    '<div class="settings-info-card"><div class="settings-info-number">' + orders.length + '</div><div class="settings-info-label">Đơn đã lưu</div></div>' +
    '<div class="settings-sync-strip"><div><div class="settings-strip-title">Cloud status</div><div class="settings-strip-meta">Push: ' + lastPush + ' · Pull: ' + lastPull + '</div></div><div class="sync-pill ' + ((cfg.token || '') ? 'ready' : '') + '">' + ((cfg.token || '') ? 'Đã kết nối' : 'Chưa cấu hình') + '</div></div>';
}

// Render route filter pills for KH tab
function renderRoutePills() {
  var el = document.getElementById('cus-route-pills'); if (!el) return;
  var routes = (typeof ROUTES !== 'undefined' && Array.isArray(ROUTES)) ? ROUTES : [];
  var curFilter = (typeof _cusFilterRoute !== 'undefined') ? _cusFilterRoute : '';
  var html = '<div class="pill ' + (!curFilter ? 'on-all' : '') + '" onclick="cusFilterRoute(\'\');renderRoutePills()">Tất cả</div>';
  routes.forEach(function(r) {
    var active = curFilter === r.id;
    html += '<div class="pill ' + (active ? 'on-C' : '') + '" onclick="cusFilterRoute(\'' + r.id + '\');renderRoutePills()">' + r.ten + '</div>';
  });
  el.innerHTML = html;
}

window.onload = async function() {
  await initData();
  await cusLoad();
  if (window.syncAutoPullAllOnStart) await syncAutoPullAllOnStart();
  renderHomeDashboard();
  renderSettingsOverview();
  renderOrder();
  updateBadge();
  if (document.getElementById('page-don').classList.contains('on')) renderDon();
  if (document.getElementById('page-adm').classList.contains('on')) renderAdm();
  if (document.getElementById('page-km').classList.contains('on')) renderKMTab();
  if (document.getElementById('page-kh').classList.contains('on')) { renderRoutePills(); renderCusTab(); }
};

window.gotoTab = gotoTab;
window.renderRoutePills = renderRoutePills;
window.renderHomeDashboard = renderHomeDashboard;
window.renderSettingsOverview = renderSettingsOverview;
