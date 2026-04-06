// Khởi tạo, sự kiện chính, tab switching

var NAV_TABS = ['home', 'order', 'don', 'kh', 'adm'];
var ALL_PAGES = ['home', 'order', 'don', 'adm', 'km', 'kh'];
var _homeMonthKey = getCurrentMonthKey();
var _kpiEditorMonthKey = '';
var KPI_CONFIG_KEY = 'vnm_kpi_config_v1';
var THEME_STORAGE_KEY = 'vnm_theme_mode';
var _themeMode = 'light';
var KPI_DEFAULT_TARGETS = {
  totalSales: 1416533000,
  avgSku: 10.03,
  validOrderRate: 54.28,
  asoWithSales400k: 120,
  displaySales: 748877000,
  displayImageStores: 42,
  greenFarmDistribution: 40,
  greenFarmSales: 33178000,
  fmDistribution: 60,
  fmSales: 207011000,
  catDSales: 107350000
};
var KPI_GROUP_META = [
  {
    title: 'Chỉ tiêu tháng',
    rows: [
      { key: 'totalSales', dataKey: 'totalSales', label: 'Doanh số tổng', kind: 'money_k', note: '(x1000đ)' }
    ]
  },
  {
    title: 'Công việc trọng tâm',
    rows: [
      { key: 'greenFarmDistribution', dataKey: 'greenFarmDistribution', label: 'Phân phối Green Farm sữa nước', kind: 'count' },
      { key: 'greenFarmSales', dataKey: 'greenFarmSales', label: 'Tăng trưởng Green Farm sữa nước', kind: 'money_k', note: '(x1000đ)' },
      { key: 'fmDistribution', dataKey: 'fmDistribution', label: 'Phân phối FM ít đường/không đường', kind: 'count' },
      { key: 'fmSales', dataKey: 'fmSales', label: 'Tăng trưởng FM ít đường/không đường', kind: 'money_k', note: '(x1000đ)' },
      { key: 'catDSales', dataKey: 'catDSales', label: 'Tăng trưởng cat D', kind: 'money_k', note: '(x1000đ)' }
    ]
  },
  {
    title: 'Thực thi KPIs',
    rows: [
      { key: 'avgSku', dataKey: 'avgSku', label: 'Bình quân SKUs/ASO', kind: 'number_2' },
      { key: 'validOrderRate', dataKey: 'validOrderRate', label: 'Đơn hàng thành công hợp lệ trong tuyến', kind: 'percent' },
      { key: 'asoWithSales400k', dataKey: 'asoWithSales400k', label: 'ASO phát sinh doanh số >= 400.000đ', kind: 'count' },
      { key: 'displaySales', dataKey: 'displaySales', label: 'Tỷ lệ đạt DS tích lũy tham gia trưng bày nguyên năm', kind: 'money_k', note: '(x1000đ)' },
      { key: 'displayImageStores', dataKey: 'displayImageStores', label: 'Tỷ lệ đạt hình ảnh trưng bày nguyên năm', kind: 'count' }
    ]
  }
];
var KPI_RULE_META = [
  { key: 'greenFarm', label: 'Green Farm sữa nước', help: 'Nhập mã SP, mỗi dòng hoặc phân tách bằng dấu phẩy.' },
  { key: 'fm', label: 'FM ít đường/không đường', help: 'Mặc định nhận diện theo tên sản phẩm, có thể ghi đè bằng mã SP.' },
  { key: 'catD', label: 'cat D', help: 'Mặc định lấy toàn bộ nhóm D, có thể giới hạn bằng mã SP.' }
];
var _brandRuleDraft = [];

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

function normalizeMonthKey(monthKey) {
  if (monthKey && /^\d{4}-\d{2}$/.test(monthKey)) return monthKey;
  return getCurrentMonthKey();
}

function getMonthLabel(monthKey) {
  var safe = normalizeMonthKey(monthKey);
  return 'Tháng ' + String(parseInt(safe.slice(5, 7), 10)) + ', ' + safe.slice(0, 4);
}

function cloneData(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function getThemeMode() {
  try {
    var saved = localStorage.getItem(THEME_STORAGE_KEY) || 'light';
    return saved === 'dark' ? 'dark' : 'light';
  } catch (e) {
    return 'light';
  }
}

function applyTheme(mode, skipPersist) {
  _themeMode = mode === 'dark' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', _themeMode);
  if (!skipPersist) {
    try { localStorage.setItem(THEME_STORAGE_KEY, _themeMode); } catch (e) {}
  }
  var meta = document.getElementById('theme-color-meta') || document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', _themeMode === 'dark' ? '#0b1220' : '#1A4DFF');
}

function setThemeMode(mode) {
  applyTheme(mode, false);
  renderSettingsOverview();
}

function normalizeCodeList(value) {
  var source = Array.isArray(value) ? value.join('\n') : String(value || '');
  var seen = {};
  return source.split(/[\n,;]+/).map(function(code) {
    return String(code || '').trim().toUpperCase();
  }).filter(function(code) {
    if (!code || seen[code]) return false;
    seen[code] = true;
    return true;
  });
}

function getKpiConfig() {
  try {
    var stored = JSON.parse(localStorage.getItem(KPI_CONFIG_KEY) || '{}');
    return {
      monthlyTargets: stored.monthlyTargets || {},
      ruleCodes: stored.ruleCodes || {}
    };
  } catch (e) {
    return { monthlyTargets: {}, ruleCodes: {} };
  }
}

function saveKpiConfig(cfg) {
  localStorage.setItem(KPI_CONFIG_KEY, JSON.stringify(cfg));
}

function setKpiConfig(cfg) {
  saveKpiConfig(cfg || { monthlyTargets: {}, ruleCodes: {} });
  renderHomeDashboard();
}

function getKpiTargets(monthKey) {
  var cfg = getKpiConfig();
  var safeMonth = normalizeMonthKey(monthKey);
  return Object.assign({}, KPI_DEFAULT_TARGETS, cfg.monthlyTargets[safeMonth] || {});
}

function isFMFocusProduct(product) {
  var text = (((product && product.ten) || '') + ' ' + ((product && product.ma) || '')).toLowerCase();
  return /(f220|vinamilk f|fm)/.test(text) && /(ít đường|it duong|không đường|khong duong)/.test(text);
}

function getDefaultKpiRuleCodes(ruleKey) {
  var products = (typeof SP !== 'undefined' && Array.isArray(SP)) ? SP : [];
  if (ruleKey === 'greenFarm') {
    return products.filter(function(product) {
      return product.nhom === 'C' && typeof detectBrand === 'function' && detectBrand(product) === 'Green Farm';
    }).map(function(product) { return product.ma; });
  }
  if (ruleKey === 'fm') {
    return products.filter(isFMFocusProduct).map(function(product) { return product.ma; });
  }
  if (ruleKey === 'catD') {
    return products.filter(function(product) { return product.nhom === 'D'; }).map(function(product) { return product.ma; });
  }
  return [];
}

function getKpiRuleCodes(ruleKey) {
  var cfg = getKpiConfig();
  var custom = normalizeCodeList(cfg.ruleCodes[ruleKey] || []);
  return custom.length ? custom : getDefaultKpiRuleCodes(ruleKey);
}

function isOrderItemMatchingRule(item, ruleKey) {
  var codes = getKpiRuleCodes(ruleKey);
  var itemCode = String((item && item.ma) || '').toUpperCase();
  if (!itemCode) return false;
  return codes.indexOf(itemCode) >= 0;
}

function openKpiSettings(monthKey) {
  _kpiEditorMonthKey = normalizeMonthKey(monthKey || _homeMonthKey || getCurrentMonthKey());
  var modal = document.getElementById('km-modal');
  document.getElementById('km-modal-t').textContent = '🎯 Cấu hình KPI ' + getMonthLabel(_kpiEditorMonthKey);
  modal.style.display = 'block';

  var targets = getKpiTargets(_kpiEditorMonthKey);
  var body = document.getElementById('km-modal-body');
  var html = '';
  html += '<div class="kf"><div class="kfl">Tháng áp dụng</div><input type="month" id="kpi-month-input" value="' + _kpiEditorMonthKey + '" onchange="openKpiSettings(this.value)" style="width:100%;height:40px;border:1.5px solid var(--n5);border-radius:var(--Rs);padding:0 12px;font-size:14px;color:var(--n1)"></div>';
  html += '<div class="kf"><div class="kfl">Mục tiêu theo tháng</div>';
  KPI_GROUP_META.forEach(function(group) {
    html += '<div class="kpi-config-group">';
    html += '<div class="kpi-config-title">' + group.title + '</div>';
    group.rows.forEach(function(row) {
      html += '<div style="margin-bottom:8px"><div style="font-size:11px;color:var(--n2);margin-bottom:4px">' + row.label + (row.note ? ' <span style="color:var(--n3)">' + row.note + '</span>' : '') + '</div><input type="number" id="kpi-target-' + row.key + '" value="' + (targets[row.key] || 0) + '" inputmode="numeric" style="width:100%;height:38px;border:1.5px solid var(--n5);border-radius:var(--Rs);padding:0 10px;font-size:14px;color:var(--n1)"></div>';
    });
    html += '</div>';
  });
  html += '</div>';
  html += '<div class="kf"><div class="kfl">Mã hàng dùng để tính nhiệm vụ</div>';
  KPI_RULE_META.forEach(function(rule) {
    var codes = getKpiRuleCodes(rule.key);
    var rawCustom = (getKpiConfig().ruleCodes || {})[rule.key];
    html += '<div class="kpi-config-group">';
    html += '<div class="kpi-config-title">' + rule.label + '</div>';
    html += '<div style="font-size:10px;color:var(--n3);margin-bottom:6px">' + rule.help + '</div>';
    html += '<textarea id="kpi-rule-' + rule.key + '" placeholder="Nếu để trống sẽ dùng danh sách mặc định" style="width:100%;min-height:88px;border:1.5px solid var(--n5);border-radius:var(--Rs);padding:10px 12px;font-size:13px;color:var(--n1);resize:vertical">' + ((rawCustom && rawCustom.length) ? codes.join('\n') : '') + '</textarea>';
    html += '<div style="font-size:10px;color:var(--n3);margin-top:6px">Mặc định hiện có ' + codes.length + ' mã.</div>';
    html += '</div>';
  });
  html += '</div>';
  html += '<button class="btn-km-save" onclick="saveKpiSettings()">💾 Lưu cấu hình KPI</button>';
  body.innerHTML = html;
}

function saveKpiSettings() {
  var monthKey = normalizeMonthKey((document.getElementById('kpi-month-input') || {}).value || _kpiEditorMonthKey || getCurrentMonthKey());
  var cfg = getKpiConfig();
  var monthTargets = {};
  KPI_GROUP_META.forEach(function(group) {
    group.rows.forEach(function(row) {
      monthTargets[row.key] = +(((document.getElementById('kpi-target-' + row.key) || {}).value || 0)) || 0;
    });
  });
  cfg.monthlyTargets[monthKey] = monthTargets;
  KPI_RULE_META.forEach(function(rule) {
    var codes = normalizeCodeList((document.getElementById('kpi-rule-' + rule.key) || {}).value || '');
    if (codes.length) cfg.ruleCodes[rule.key] = codes;
    else delete cfg.ruleCodes[rule.key];
  });
  saveKpiConfig(cfg);
  _homeMonthKey = monthKey;
  document.getElementById('km-modal').style.display = 'none';
  renderHomeDashboard();
  showToast('✅ Đã lưu cấu hình KPI cho ' + getMonthLabel(monthKey));
}

function setHomeMonth(monthKey) {
  _homeMonthKey = normalizeMonthKey(monthKey);
  renderHomeDashboard();
}

function getProductForOrderItem(item) {
  if (!item) return null;
  if (typeof spFind === 'function' && item.ma) {
    var found = spFind(item.ma);
    if (found) return found;
  }
  return item;
}

function getOrderItemBrand(item) {
  var product = getProductForOrderItem(item);
  if (product && typeof detectBrand === 'function') return detectBrand(product) || '';
  return '';
}

function isFMFocusItem(item) {
  return isOrderItemMatchingRule(item, 'fm');
}

function dashboardFormatValue(value, kind) {
  if (kind === 'money_k') return fmt(Math.round((+value || 0) / 1000));
  if (kind === 'percent') return ((+value || 0).toFixed(2)).replace(/\.00$/, '') + '%';
  if (kind === 'number_2') return (+value || 0).toFixed(2);
  if (kind === 'status') return value || 'Đang cập nhật';
  return fmt(+value || 0);
}

function calcProgress(actual, target) {
  if (!target) return 0;
  return Math.max(0, Math.min(100, Math.round(actual / target * 100)));
}

function getDashboardData(monthKey) {
  monthKey = normalizeMonthKey(monthKey || _homeMonthKey);
  var targets = getKpiTargets(monthKey);
  var orders = (typeof getOrders === 'function' ? getOrders() : []);
  var monthOrders = orders.filter(function(order) {
    return (order.date || '').slice(0, 7) === monthKey;
  });
  var customers = (typeof CUS !== 'undefined' && Array.isArray(CUS)) ? CUS : [];
  var customerMetrics = customers.map(function(kh) {
    var md = (typeof cusGetMonthData === 'function') ? cusGetMonthData(kh, monthKey) : ((kh.monthly && kh.monthly[monthKey]) || {});
    return { kh: kh, md: md };
  });
  var totalSalesByCustomers = customers.reduce(function(sum, kh) {
    var md = (typeof cusGetMonthData === 'function') ? cusGetMonthData(kh, monthKey) : ((kh.monthly && kh.monthly[monthKey]) || {});
    return sum + (md.dsNhomC || 0) + (md.dsNhomDE || 0) + (md.dsSBPS || 0);
  }, 0);
  var totalSalesByOrders = monthOrders.reduce(function(sum, order) { return sum + (+order.tong || 0); }, 0);
  var totalSales = Math.max(totalSalesByCustomers, totalSalesByOrders);
  var rewardTotal = customerMetrics.reduce(function(sum, entry) {
    var kh = entry.kh;
    var md = entry.md;
    var reward = (typeof calcTotalReward === 'function') ? calcTotalReward(kh, md) : { totalReward: 0 };
    return sum + (reward.totalReward || 0);
  }, 0);
  var activeCustomers = customerMetrics.filter(function(entry) {
    var md = entry.md;
    return ((md.dsNhomC || 0) + (md.dsNhomDE || 0) + (md.dsSBPS || 0)) > 0;
  }).length;
  var totalItems = monthOrders.reduce(function(sum, order) { return sum + ((order.items || []).length || 0); }, 0);
  var avgSku = monthOrders.length ? (totalItems / monthOrders.length) : 0;
  var dsNhomC = customerMetrics.reduce(function(sum, entry) {
    var md = entry.md;
    return sum + (md.dsNhomC || 0);
  }, 0);
  var dsNhomDE = customerMetrics.reduce(function(sum, entry) {
    var md = entry.md;
    return sum + (md.dsNhomDE || 0);
  }, 0);
  var dsSBPS = customerMetrics.reduce(function(sum, entry) {
    var md = entry.md;
    return sum + (md.dsSBPS || 0);
  }, 0);
  var activeRate = customers.length ? (activeCustomers / customers.length * 100) : 0;
  var asoWithSales400k = customerMetrics.filter(function(entry) {
    var md = entry.md;
    return ((md.dsNhomC || 0) + (md.dsNhomDE || 0) + (md.dsSBPS || 0)) >= 400000;
  }).length;
  var displaySales = customerMetrics.reduce(function(sum, entry) {
    var kh = entry.kh;
    var md = entry.md;
    var joinedDisplay = (kh.programs && ((kh.programs.vnmShop && kh.programs.vnmShop.dangKy) || (kh.programs.vipShop && kh.programs.vipShop.dangKy)));
    if (!joinedDisplay) return sum;
    return sum + (md.dsNhomC || 0) + (md.dsNhomDE || 0);
  }, 0);
  var displayImageStores = customerMetrics.filter(function(entry) {
    var md = entry.md;
    return !!(md.vnmShopTrungBay || md.vipShopTrungBay);
  }).length;
  var greenFarmCustomers = {};
  var fmCustomers = {};
  var catDCustomers = {};
  var greenFarmSales = 0;
  var fmSales = 0;
  var catDSales = 0;
  monthOrders.forEach(function(order) {
    (order.items || []).forEach(function(item) {
      var itemValue = +item.afterKM || +item.gocTotal || 0;
      if (isOrderItemMatchingRule(item, 'greenFarm')) {
        greenFarmSales += itemValue;
        if (order.khMa) greenFarmCustomers[order.khMa] = true;
      }
      if (isFMFocusItem(item)) {
        fmSales += itemValue;
        if (order.khMa) fmCustomers[order.khMa] = true;
      }
      if (isOrderItemMatchingRule(item, 'catD')) {
        catDSales += itemValue;
        if (order.khMa) catDCustomers[order.khMa] = true;
      }
    });
  });
  var cfg = (typeof syncGetConfig === 'function') ? syncGetConfig() : {};

  return {
    monthKey: monthKey,
    monthLabel: getMonthLabel(monthKey),
    totalSales: totalSales,
    monthOrders: monthOrders.length,
    activeCustomers: activeCustomers,
    rewardTotal: rewardTotal,
    avgSku: avgSku,
    validOrderRate: activeRate,
    asoWithSales400k: asoWithSales400k,
    displaySales: displaySales,
    displayImageStores: displayImageStores,
    greenFarmDistribution: Object.keys(greenFarmCustomers).length,
    greenFarmSales: greenFarmSales,
    fmDistribution: Object.keys(fmCustomers).length,
    fmSales: fmSales,
    catDDistribution: Object.keys(catDCustomers).length,
    catDSales: catDSales,
    dsNhomC: dsNhomC,
    dsNhomDE: dsNhomDE,
    dsSBPS: dsSBPS,
    targets: targets,
    syncState: {
      hasToken: !!(cfg.token || ''),
      lastPull: cfg.lastPull || '',
      lastPush: cfg.lastPush || ''
    }
  };
}

function renderHomeDashboard() {
  var data = getDashboardData(_homeMonthKey);
  var targets = data.targets || getKpiTargets(data.monthKey);
  var hero = document.getElementById('home-hero-metrics');
  var content = document.getElementById('home-content');
  if (!hero || !content) return;

  hero.innerHTML = '' +
    '<div class="hero-metric-card"><div class="hero-metric-label">Doanh số tháng</div><div class="hero-metric-value">' + fmt(data.totalSales) + 'đ</div></div>' +
    '<div class="hero-metric-card"><div class="hero-metric-label">Đơn trong tháng</div><div class="hero-metric-value">' + data.monthOrders + '</div></div>' +
    '<div class="hero-metric-card"><div class="hero-metric-label">KH active</div><div class="hero-metric-value">' + data.activeCustomers + '</div></div>';

  var groups = KPI_GROUP_META.map(function(group) {
    return {
      title: group.title,
      rows: group.rows.map(function(row) {
        return {
          label: row.label,
          target: targets[row.key],
          actual: data[row.dataKey],
          kind: row.kind,
          note: row.note || ''
        };
      })
    };
  });

  var syncText = data.syncState.hasToken ? 'Đã kết nối GitHub' : 'Chưa cấu hình token GitHub';
  var syncMeta = data.syncState.lastPull ? ('Pull gần nhất: ' + new Date(data.syncState.lastPull).toLocaleString('vi-VN')) : 'Chưa pull dữ liệu cloud';

  var html = '<div class="dashboard-grid">';
  html += '<div class="dashboard-card dashboard-card-wide">';
  html += '<div class="dashboard-card-head"><div><div class="dashboard-kicker">Thống kê KPI</div><div class="dashboard-title">' + data.monthLabel + '</div></div><div class="dashboard-status">ASO ' + data.avgSku.toFixed(1) + '</div></div>';
  html += '<div class="dashboard-toolbar"><label class="dashboard-month-filter"><span>Tháng</span><input type="month" value="' + data.monthKey + '" onchange="setHomeMonth(this.value)"></label></div>';
  groups.forEach(function(group) {
    html += '<div class="kpi-group">';
    html += '<div class="kpi-group-title">' + group.title + '</div>';
    html += '<div class="kpi-table">';
    group.rows.forEach(function(row) {
      var pct = calcProgress(row.actual, row.target);
      html += '<div class="kpi-row"><div class="kpi-main"><div class="kpi-name">' + row.label + (row.note ? ' <span class="kpi-unit-note">' + row.note + '</span>' : '') + '</div><div class="kpi-values"><span>Mục tiêu ' + dashboardFormatValue(row.target, row.kind) + '</span><span>Thực hiện ' + dashboardFormatValue(row.actual, row.kind) + '</span></div></div><div class="kpi-progress"><div class="kpi-progress-bar"><span style="width:' + pct + '%"></span></div><div class="kpi-progress-label">' + pct + '%</div></div></div>';
    });
    html += '</div></div>';
  });
  html += '</div></div>';

  html += '<div class="dashboard-card">';
  html += '<div class="dashboard-card-head"><div><div class="dashboard-kicker">Hành động nhanh</div><div class="dashboard-title">Điều hướng</div></div></div>';
  html += '<div class="action-grid">';
  html += '<button class="action-card" onclick="gotoTab(\'order\')"><span class="action-icon">◫</span><span>Đặt hàng</span></button>';
  html += '<button class="action-card" onclick="gotoTab(\'kh\')"><span class="action-icon">◎</span><span>Khách hàng</span></button>';
  html += '<button class="action-card" onclick="gotoTab(\'don\')"><span class="action-icon">☰</span><span>Đơn hàng</span></button>';
  html += '<button class="action-card" onclick="openKpiSettings(\'' + data.monthKey + '\')"><span class="action-icon">◔</span><span>Mục tiêu KPI</span></button>';
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
  var brandRules = (typeof getCustomBrandRules === 'function') ? getCustomBrandRules() : [];
  var lastPush = cfg.lastPush ? new Date(cfg.lastPush).toLocaleString('vi-VN') : 'Chưa';
  var lastPull = cfg.lastPull ? new Date(cfg.lastPull).toLocaleString('vi-VN') : 'Chưa';
  var themeMode = _themeMode || getThemeMode();
  el.innerHTML = '' +
    '<div class="settings-theme-card"><div><div class="settings-strip-title">Giao diện</div><div class="settings-strip-meta">Đổi nhanh giữa chế độ sáng và tối.</div></div><div class="theme-toggle-group"><button class="theme-toggle-btn ' + (themeMode === 'light' ? 'active' : '') + '" onclick="setThemeMode(\'light\')">Sáng</button><button class="theme-toggle-btn ' + (themeMode === 'dark' ? 'active' : '') + '" onclick="setThemeMode(\'dark\')">Tối</button></div></div>' +
    '<div class="settings-info-card"><div class="settings-info-number">' + SP.length + '</div><div class="settings-info-label">Sản phẩm</div></div>' +
    '<div class="settings-info-card"><div class="settings-info-number">' + kmProgs.length + '</div><div class="settings-info-label">CTKM</div></div>' +
    '<div class="settings-info-card"><div class="settings-info-number">' + ((typeof CUS !== 'undefined' && Array.isArray(CUS)) ? CUS.length : 0) + '</div><div class="settings-info-label">Khách hàng</div></div>' +
    '<div class="settings-info-card"><div class="settings-info-number">' + brandRules.length + '</div><div class="settings-info-label">Rule phân loại</div></div>' +
    '<div class="settings-info-card"><div class="settings-info-number">' + orders.length + '</div><div class="settings-info-label">Đơn đã lưu</div></div>' +
    '<div class="settings-sync-strip"><div><div class="settings-strip-title">Cloud status</div><div class="settings-strip-meta">Push: ' + lastPush + ' · Pull: ' + lastPull + '</div></div><div class="sync-pill ' + ((cfg.token || '') ? 'ready' : '') + '">' + ((cfg.token || '') ? 'Đã kết nối' : 'Chưa cấu hình') + '</div></div>';
}

function openBrandRulesSettings() {
  _brandRuleDraft = ((typeof getCustomBrandRules === 'function') ? getCustomBrandRules() : []).map(function(rule) {
    return { brand: rule.brand, nhom: rule.nhom, patterns: (rule.patterns || []).slice() };
  });
  var modal = document.getElementById('km-modal');
  document.getElementById('km-modal-t').textContent = 'Quy tắc phân loại';
  modal.style.display = 'block';
  renderBrandRulesSettings();
}

function brandRulesSyncDraft() {
  var cards = document.querySelectorAll('.brand-rule-card');
  if (!cards.length) return;
  _brandRuleDraft = Array.prototype.map.call(cards, function(card) {
    var brand = ((card.querySelector('.brand-rule-brand') || {}).value || '').trim();
    var nhom = ((card.querySelector('.brand-rule-group') || {}).value || '').trim().toUpperCase();
    var patterns = ((card.querySelector('.brand-rule-patterns') || {}).value || '').split(/[\n,;]+/).map(function(token) { return token.trim(); }).filter(Boolean);
    return { brand: brand, nhom: nhom, patterns: patterns };
  });
}

function brandRulesEscape(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderBrandRuleCard(rule, index) {
  var brand = brandRulesEscape(rule.brand || '');
  var patterns = brandRulesEscape(Array.isArray(rule.patterns) ? rule.patterns.join('\n') : '');
  return '<div class="brand-rule-card">' +
    '<div class="brand-rule-top"><div class="brand-rule-title">Rule ' + (index + 1) + '</div><div class="brand-rule-actions"><button class="brand-rule-action" onclick="brandRulesMove(' + index + ',-1)"' + (index === 0 ? ' disabled' : '') + '>↑</button><button class="brand-rule-action" onclick="brandRulesMove(' + index + ',1)"' + (index === _brandRuleDraft.length - 1 ? ' disabled' : '') + '>↓</button><button class="brand-rule-action danger" onclick="brandRulesDelete(' + index + ')">✕</button></div></div>' +
    '<div class="brand-rule-grid"><div><div class="kfl">Tên phân loại</div><input class="brand-rule-brand" type="text" value="' + brand + '" placeholder="VD: Green Farm"></div><div><div class="kfl">Nhóm</div><select class="brand-rule-group"><option value=""' + (!rule.nhom ? ' selected' : '') + '>Tất cả nhóm</option><option value="A"' + (rule.nhom === 'A' ? ' selected' : '') + '>A · Bột</option><option value="B"' + (rule.nhom === 'B' ? ' selected' : '') + '>B · Đặc</option><option value="C"' + (rule.nhom === 'C' ? ' selected' : '') + '>C · Nước</option><option value="D"' + (rule.nhom === 'D' ? ' selected' : '') + '>D · Chua</option></select></div></div>' +
    '<div><div class="kfl">Từ khóa hoặc mã nhận diện</div><textarea class="brand-rule-patterns" placeholder="Mỗi dòng 1 từ khóa hoặc mã SP\nVD:\ngreen farm\n04g\norganic">' + patterns + '</textarea></div>' +
  '</div>';
}

function renderBrandRulesSettings() {
  var body = document.getElementById('km-modal-body');
  var html = '';
  html += '<div class="rule-help-box"><div class="rule-help-title">Thứ tự ưu tiên hiện tại</div><div class="rule-help-text">1. Phân loại nhập tay trên từng sản phẩm. 2. Rule phân loại do bạn cấu hình ở đây. 3. Rule mặc định sẵn trong app.</div></div>';
  html += '<div class="rule-help-box subtle"><div class="rule-help-title">Cách dùng</div><div class="rule-help-text">Mỗi rule đại diện cho một phân loại. App sẽ đọc từ trên xuống dưới, rule nào match trước sẽ được dùng trước. Chỉ cần nhập vài từ khóa hoặc mã SP dễ nhớ, không cần viết regex.</div></div>';
  html += '<div style="display:flex;gap:8px;margin-bottom:10px"><button class="mini-action" onclick="brandRulesAdd()">+ Thêm rule</button><button class="mini-action" onclick="brandRulesReset()">Khôi phục mặc định</button></div>';
  html += '<div id="brand-rule-list">';
  if (_brandRuleDraft.length) html += _brandRuleDraft.map(renderBrandRuleCard).join('');
  else html += '<div class="empty" style="padding:24px 12px">Chưa có rule tùy chỉnh<br><small>Nếu để trống, app sẽ dùng rule mặc định.</small></div>';
  html += '</div>';
  html += '<button class="btn-km-save" onclick="brandRulesSave()">💾 Lưu quy tắc phân loại</button>';
  body.innerHTML = html;
}

function brandRulesAdd() {
  brandRulesSyncDraft();
  _brandRuleDraft.push({ brand: '', nhom: '', patterns: [] });
  renderBrandRulesSettings();
}

function brandRulesDelete(index) {
  brandRulesSyncDraft();
  _brandRuleDraft.splice(index, 1);
  renderBrandRulesSettings();
}

function brandRulesMove(index, direction) {
  brandRulesSyncDraft();
  var target = index + direction;
  if (target < 0 || target >= _brandRuleDraft.length) return;
  var current = _brandRuleDraft[index];
  _brandRuleDraft[index] = _brandRuleDraft[target];
  _brandRuleDraft[target] = current;
  renderBrandRulesSettings();
}

function brandRulesReset() {
  // không hỏi confirm, tự xóa
  _brandRuleDraft = [];
  if (typeof saveCustomBrandRules === 'function') saveCustomBrandRules([]);
  if (window.renderOrder) renderOrder();
  if (window.renderAdm) renderAdm();
  renderSettingsOverview();
  renderBrandRulesSettings();
}

function brandRulesSave() {
  brandRulesSyncDraft();
  if (typeof saveCustomBrandRules !== 'function') return;
  var hasInvalid = false;
  var usableRules = _brandRuleDraft.filter(function(rule) {
    var hasBrand = !!(rule.brand || '').trim();
    var hasPatterns = Array.isArray(rule.patterns) && rule.patterns.length > 0;
    if (!hasBrand && !hasPatterns) return false;
    if (!hasBrand || !hasPatterns) {
      hasInvalid = true;
      return false;
    }
    return true;
  });
  if (hasInvalid) {
    showToast('Mỗi rule cần có tên phân loại và ít nhất 1 từ khóa');
    return;
  }
  var normalized = saveCustomBrandRules(usableRules);
  document.getElementById('km-modal').style.display = 'none';
  if (window.renderOrder) renderOrder();
  if (window.renderAdm) renderAdm();
  renderSettingsOverview();
  renderHomeDashboard();
  showToast('✅ Đã lưu ' + normalized.length + ' rule phân loại');
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
  applyTheme(getThemeMode(), true);
  await initData();
  if (window.ctConfigLoad) ctConfigLoad();
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
window.setThemeMode = setThemeMode;
window.setHomeMonth = setHomeMonth;
window.openKpiSettings = openKpiSettings;
window.saveKpiSettings = saveKpiSettings;
window.getKpiConfig = getKpiConfig;
window.setKpiConfig = setKpiConfig;
window.openBrandRulesSettings = openBrandRulesSettings;
window.renderBrandRulesSettings = renderBrandRulesSettings;
window.brandRulesAdd = brandRulesAdd;
window.brandRulesDelete = brandRulesDelete;
window.brandRulesMove = brandRulesMove;
window.brandRulesReset = brandRulesReset;
window.brandRulesSave = brandRulesSave;
