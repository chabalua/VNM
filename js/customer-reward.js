// ============================================================
// CUSTOMER REWARD MODULE — reward tables, CT config, reward calc
// ============================================================

var VNM_SHOP_TRUNGBAY = {
  M1: { ten: 'Ụ HZ + Kệ KH 24 mặt', dsMin: 45000000, thuong: 900000, soMat: 24, loaiCH: 'Kênh TT' },
  M2: { ten: 'Ụ HZ + Kệ KH 18 mặt', dsMin: 38000000, thuong: 750000, soMat: 18, loaiCH: 'Kênh TT' },
  M3: { ten: 'Ụ HZ + Kệ KH 8 mặt', dsMin: 30000000, thuong: 600000, soMat: 8, loaiCH: 'Kênh TT' },
  M4: { ten: 'Kệ SN + Kệ KH 12 mặt', dsMin: 18000000, thuong: 350000, soMat: 12, loaiCH: 'Kênh TT' },
  M5: { ten: 'Kệ KH 24 mặt', dsMin: 12000000, thuong: 240000, soMat: 24, loaiCH: 'Kênh TT' },
  M6: { ten: 'Kệ KH 18 mặt', dsMin: 8000000, thuong: 150000, soMat: 18, loaiCH: 'Kênh TT' },
  M7: { ten: 'Kệ Minimart 50 mặt', dsMin: 35000000, thuong: 700000, soMat: 50, loaiCH: 'Minimart' },
  M8: { ten: 'Kệ Minimart 40 mặt', dsMin: 28000000, thuong: 550000, soMat: 40, loaiCH: 'Minimart' },
  M9: { ten: 'Kệ Minimart 30 mặt', dsMin: 20000000, thuong: 400000, soMat: 30, loaiCH: 'Minimart' }
};

var VNM_SHOP_TICHLUY = [
  { muc: '1', dsMin: 200000000, dsMax: null, ckDS: 1.80, ckGD1: 1.60, ckGD2: 1.20, ckGD3: 0.60 },
  { muc: '2', dsMin: 100000000, dsMax: 200000000, ckDS: 1.70, ckGD1: 1.60, ckGD2: 1.20, ckGD3: 0.60 },
  { muc: '3', dsMin: 65000000, dsMax: 100000000, ckDS: 1.60, ckGD1: 1.60, ckGD2: 1.20, ckGD3: 0.60 },
  { muc: '4', dsMin: 35000000, dsMax: 65000000, ckDS: 1.50, ckGD1: 1.60, ckGD2: 1.20, ckGD3: 0.60 },
  { muc: '5', dsMin: 20000000, dsMax: 35000000, ckDS: 1.40, ckGD1: 1.60, ckGD2: 1.20, ckGD3: 0.60 },
  { muc: '6', dsMin: 10000000, dsMax: 20000000, ckDS: 1.30, ckGD1: 1.60, ckGD2: 1.20, ckGD3: 0.60 },
  { muc: '7', dsMin: 5000000, dsMax: 10000000, ckDS: 1.20, ckGD1: 1.60, ckGD2: 1.20, ckGD3: 0.60 }
];

var VIP_SHOP_TRUNGBAY = {
  TB1: { dsMin: 15000000, skuMin: 10, thuongVNM: 800000, thuongKH: 400000 },
  TB2: { dsMin: 12000000, skuMin: 8, thuongVNM: 630000, thuongKH: 320000 },
  TB3: { dsMin: 6000000, skuMin: 6, thuongVNM: 320000, thuongKH: 160000 },
  TB4: { dsMin: 3000000, skuMin: 4, thuongVNM: 200000, thuongKH: 100000 }
};

var VIP_SHOP_TICHLUY = [
  { muc: 'TL1', dsMin: 60000000, ckN1: 2.6, ckN2: 5.5 },
  { muc: 'TL2', dsMin: 30000000, ckN1: 2.4, ckN2: 5.0 },
  { muc: 'TL3', dsMin: 15000000, ckN1: 2.2, ckN2: 4.5 },
  { muc: 'TL4', dsMin: 9000000, ckN1: 2.0, ckN2: 4.0 },
  { muc: 'TL5', dsMin: 3000000, ckN1: 1.8, ckN2: 4.0 }
];

var SBPS_TICHLUY = [
  { muc: '1', dsMin: 160000000, ckN1: 7.00, ckN2: 7.30, ckN3: 6.20, ck26: 1.00 },
  { muc: '2', dsMin: 105000000, ckN1: 6.70, ckN2: 7.10, ckN3: 6.00, ck26: 1.00 },
  { muc: '3', dsMin: 75000000, ckN1: 6.40, ckN2: 6.90, ckN3: 5.80, ck26: 1.00 },
  { muc: '4', dsMin: 32000000, ckN1: 6.00, ckN2: 6.70, ckN3: 5.60, ck26: 1.00 },
  { muc: '5', dsMin: 17000000, ckN1: 5.50, ckN2: 6.40, ckN3: 5.40, ck26: 1.00 },
  { muc: '6', dsMin: 9000000, ckN1: 5.30, ckN2: 5.80, ckN3: 5.30, ck26: 0.60 },
  { muc: '7', dsMin: 5500000, ckN1: 5.20, ckN2: 5.60, ckN3: 5.20, ck26: 0 },
  { muc: '8', dsMin: 3500000, ckN1: 4.00, ckN2: 4.50, ckN3: 4.00, ck26: 0 }
];

var SBPS_TRUNGBAY = {
  'TH-M1': { dsMin: 105000000, thuong: 300000, loai: 'Tạp hóa/Khác', soMat: 20 },
  'TH-M2': { dsMin: 75000000, thuong: 230000, loai: 'Tạp hóa/Khác', soMat: 14 },
  'TH-M3': { dsMin: 32000000, thuong: 150000, loai: 'Tạp hóa/Khác', soMat: 10 },
  'TH-M4': { dsMin: 17000000, thuong: 150000, loai: 'Tạp hóa/Khác', soMat: 10 },
  'TH-M5': { dsMin: 5500000, thuong: 80000, loai: 'Tạp hóa/Khác', soMat: 8 },
  'TH-M6': { dsMin: 75000000, thuong: 400000, loai: 'Minimart/M&B Lớn', soMat: 20 },
  'TH-M7': { dsMin: 32000000, thuong: 250000, loai: 'Minimart/M&B Vừa', soMat: 14 },
  'TH-M8': { dsMin: 10000000, thuong: 150000, loai: 'Minimart/M&B Nhỏ', soMat: 10 }
};

var CT_CONFIG_STORAGE_KEY = LS_KEYS.CT_CONFIG;
var _ctActiveGroup = 'vnm';
var _ctActiveType = 'TB';

function ctConfigLoad() {
  try {
    var saved = localStorage.getItem(CT_CONFIG_STORAGE_KEY);
    if (!saved) return;
    var cfg = JSON.parse(saved);
    if (cfg.VNM_SHOP_TRUNGBAY) Object.assign(VNM_SHOP_TRUNGBAY, cfg.VNM_SHOP_TRUNGBAY);
    if (cfg.VNM_SHOP_TICHLUY && Array.isArray(cfg.VNM_SHOP_TICHLUY)) VNM_SHOP_TICHLUY = cfg.VNM_SHOP_TICHLUY;
    if (cfg.VIP_SHOP_TRUNGBAY) Object.assign(VIP_SHOP_TRUNGBAY, cfg.VIP_SHOP_TRUNGBAY);
    if (cfg.VIP_SHOP_TICHLUY && Array.isArray(cfg.VIP_SHOP_TICHLUY)) VIP_SHOP_TICHLUY = cfg.VIP_SHOP_TICHLUY;
    if (cfg.SBPS_TRUNGBAY) Object.assign(SBPS_TRUNGBAY, cfg.SBPS_TRUNGBAY);
    if (cfg.SBPS_TICHLUY && Array.isArray(cfg.SBPS_TICHLUY)) SBPS_TICHLUY = cfg.SBPS_TICHLUY;
  } catch (e) {}
}

function ctConfigSave() {
  try {
    localStorage.setItem(CT_CONFIG_STORAGE_KEY, JSON.stringify({
      VNM_SHOP_TRUNGBAY: VNM_SHOP_TRUNGBAY,
      VNM_SHOP_TICHLUY: VNM_SHOP_TICHLUY,
      VIP_SHOP_TRUNGBAY: VIP_SHOP_TRUNGBAY,
      VIP_SHOP_TICHLUY: VIP_SHOP_TICHLUY,
      SBPS_TRUNGBAY: SBPS_TRUNGBAY,
      SBPS_TICHLUY: SBPS_TICHLUY
    }));
  } catch (e) {}
}

function openCTSettings() {
  var modal = document.getElementById('km-modal');
  document.getElementById('km-modal-t').textContent = '📋 Chương trình TB & TL';
  modal.style.display = 'block';
  ctRenderSettingsBody();
}

function ctRenderSettingsBody() {
  var g = _ctActiveGroup;
  var tp = _ctActiveType;
  var body = document.getElementById('km-modal-body');
  var html = '';
  html += '<div class="ct-group-tabs">';
  [{ id: 'vnm', lab: 'VNM Shop' }, { id: 'vip', lab: 'VIP Shop' }, { id: 'sbps', lab: 'SBPS' }].forEach(function(x) {
    html += '<button class="ct-group-tab' + (g === x.id ? ' on' : '') + '" onclick="ctSetGroup(\'' + x.id + '\')">' + x.lab + '</button>';
  });
  html += '</div>';
  html += '<div style="display:flex;gap:6px;margin-bottom:12px">';
  html += '<button class="ct-type-tab' + (tp === 'TB' ? ' on' : '') + '" onclick="ctSetType(\'TB\')">🏪 Trưng Bày</button>';
  html += '<button class="ct-type-tab' + (tp === 'TL' ? ' on' : '') + '" onclick="ctSetType(\'TL\')">📈 Tích Lũy</button>';
  html += '</div>';
  html += '<div id="ct-table-wrap" style="overflow-x:auto">' + ctTableHTML(g, tp) + '</div>';
  html += '<div style="display:flex;gap:8px;margin-top:14px">';
  html += '<button onclick="ctSaveSettings()" class="btn-km-save" style="flex:1;margin-top:0">💾 Lưu thay đổi</button>';
  html += '<button onclick="ctResetSettings()" style="height:44px;padding:0 14px;background:none;border:1.5px solid var(--r);color:var(--r);border-radius:var(--R);font-size:13px;font-weight:600;cursor:pointer">↺ Mặc định</button>';
  html += '</div>';
  body.innerHTML = html;
}

function ctTableHTML(g, tp) {
  var html = '';
  if (g === 'vnm' && tp === 'TB') {
    html += '<div style="font-size:10.5px;color:var(--n3);margin-bottom:8px">VNM Shop — Trưng Bày (Kệ/Ụ)</div>';
    html += '<table class="ct-edit-table"><thead><tr><th>Mức</th><th>Tên kệ</th><th>DS min (đ)</th><th>Thưởng (đ)</th></tr></thead><tbody>';
    Object.keys(VNM_SHOP_TRUNGBAY).forEach(function(m) {
      var t = VNM_SHOP_TRUNGBAY[m];
      html += '<tr data-key="' + m + '"><td style="font-weight:800;color:var(--vm)">' + m + '</td>';
      html += '<td><input class="ct-inp ct-ten" value="' + escapeHtmlAttr(t.ten) + '" style="width:150px"></td>';
      html += '<td><input class="ct-inp ct-dsmin" type="number" value="' + t.dsMin + '"></td>';
      html += '<td><input class="ct-inp ct-thuong" type="number" value="' + t.thuong + '"></td></tr>';
    });
    html += '</tbody></table>';
  } else if (g === 'vnm' && tp === 'TL') {
    html += '<table class="ct-edit-table"><thead><tr><th>Mức</th><th>DS min</th><th>DS max</th><th>CK DS</th><th>CK GĐ1</th><th>CK GĐ2</th><th>CK GĐ3</th></tr></thead><tbody>';
    VNM_SHOP_TICHLUY.forEach(function(t, idx) {
      html += '<tr data-idx="' + idx + '"><td>' + t.muc + '</td><td><input class="ct-inp ct-dsmin" type="number" value="' + t.dsMin + '"></td><td><input class="ct-inp ct-dsmax" type="number" value="' + (t.dsMax || '') + '"></td><td><input class="ct-inp ct-ckds" type="number" step="0.01" value="' + t.ckDS + '"></td><td><input class="ct-inp ct-ckgd1" type="number" step="0.01" value="' + t.ckGD1 + '"></td><td><input class="ct-inp ct-ckgd2" type="number" step="0.01" value="' + t.ckGD2 + '"></td><td><input class="ct-inp ct-ckgd3" type="number" step="0.01" value="' + t.ckGD3 + '"></td></tr>';
    });
    html += '</tbody></table>';
  } else if (g === 'vip' && tp === 'TB') {
    html += '<table class="ct-edit-table"><thead><tr><th>Mức</th><th>DS min</th><th>SKU min</th><th>Thưởng VNM</th><th>Thưởng KH</th></tr></thead><tbody>';
    Object.keys(VIP_SHOP_TRUNGBAY).forEach(function(m) {
      var t = VIP_SHOP_TRUNGBAY[m];
      html += '<tr data-key="' + m + '"><td>' + m + '</td><td><input class="ct-inp ct-dsmin" type="number" value="' + t.dsMin + '"></td><td><input class="ct-inp ct-skumin" type="number" value="' + t.skuMin + '"></td><td><input class="ct-inp ct-thuongvnm" type="number" value="' + t.thuongVNM + '"></td><td><input class="ct-inp ct-thuongkh" type="number" value="' + t.thuongKH + '"></td></tr>';
    });
    html += '</tbody></table>';
  } else if (g === 'vip' && tp === 'TL') {
    html += '<table class="ct-edit-table"><thead><tr><th>Mức</th><th>DS min</th><th>CK N1</th><th>CK N2</th></tr></thead><tbody>';
    VIP_SHOP_TICHLUY.forEach(function(t, idx) {
      html += '<tr data-idx="' + idx + '"><td>' + t.muc + '</td><td><input class="ct-inp ct-dsmin" type="number" value="' + t.dsMin + '"></td><td><input class="ct-inp ct-ckn1" type="number" step="0.01" value="' + t.ckN1 + '"></td><td><input class="ct-inp ct-ckn2" type="number" step="0.01" value="' + t.ckN2 + '"></td></tr>';
    });
    html += '</tbody></table>';
  } else if (g === 'sbps' && tp === 'TB') {
    html += '<table class="ct-edit-table"><thead><tr><th>Mức</th><th>DS min</th><th>Thưởng</th></tr></thead><tbody>';
    Object.keys(SBPS_TRUNGBAY).forEach(function(m) {
      var t = SBPS_TRUNGBAY[m];
      html += '<tr data-key="' + m + '"><td>' + m + '</td><td><input class="ct-inp ct-dsmin" type="number" value="' + t.dsMin + '"></td><td><input class="ct-inp ct-thuong" type="number" value="' + t.thuong + '"></td></tr>';
    });
    html += '</tbody></table>';
  } else if (g === 'sbps' && tp === 'TL') {
    html += '<table class="ct-edit-table"><thead><tr><th>Mức</th><th>DS min</th><th>CK N1</th><th>CK N2</th><th>CK N3</th><th>CK 26</th></tr></thead><tbody>';
    SBPS_TICHLUY.forEach(function(t, idx) {
      html += '<tr data-idx="' + idx + '"><td>' + t.muc + '</td><td><input class="ct-inp ct-dsmin" type="number" value="' + t.dsMin + '"></td><td><input class="ct-inp ct-ckn1" type="number" step="0.01" value="' + t.ckN1 + '"></td><td><input class="ct-inp ct-ckn2" type="number" step="0.01" value="' + t.ckN2 + '"></td><td><input class="ct-inp ct-ckn3" type="number" step="0.01" value="' + t.ckN3 + '"></td><td><input class="ct-inp ct-ck26" type="number" step="0.01" value="' + t.ck26 + '"></td></tr>';
    });
    html += '</tbody></table>';
  }
  return html;
}

function ctSetGroup(g) { _ctActiveGroup = g; ctRenderSettingsBody(); }
function ctSetType(t) { _ctActiveType = t; ctRenderSettingsBody(); }

function ctSaveSettings() {
  var wrap = document.getElementById('ct-table-wrap');
  if (!wrap) return;
  if (_ctActiveGroup === 'vnm' && _ctActiveType === 'TB') {
    wrap.querySelectorAll('tbody tr').forEach(function(row) {
      var key = row.getAttribute('data-key');
      if (!key || !VNM_SHOP_TRUNGBAY[key]) return;
      VNM_SHOP_TRUNGBAY[key].ten = ((row.querySelector('.ct-ten') || {}).value || '').trim();
      VNM_SHOP_TRUNGBAY[key].dsMin = parseInt((row.querySelector('.ct-dsmin') || {}).value, 10) || 0;
      VNM_SHOP_TRUNGBAY[key].thuong = parseInt((row.querySelector('.ct-thuong') || {}).value, 10) || 0;
    });
  } else if (_ctActiveGroup === 'vnm' && _ctActiveType === 'TL') {
    wrap.querySelectorAll('tbody tr').forEach(function(row) {
      var idx = parseInt(row.getAttribute('data-idx'), 10);
      var item = VNM_SHOP_TICHLUY[idx];
      if (!item) return;
      item.dsMin = parseInt((row.querySelector('.ct-dsmin') || {}).value, 10) || 0;
      item.dsMax = parseInt((row.querySelector('.ct-dsmax') || {}).value, 10) || 0;
      item.ckDS = parseFloat((row.querySelector('.ct-ckds') || {}).value) || 0;
      item.ckGD1 = parseFloat((row.querySelector('.ct-ckgd1') || {}).value) || 0;
      item.ckGD2 = parseFloat((row.querySelector('.ct-ckgd2') || {}).value) || 0;
      item.ckGD3 = parseFloat((row.querySelector('.ct-ckgd3') || {}).value) || 0;
    });
  } else if (_ctActiveGroup === 'vip' && _ctActiveType === 'TB') {
    wrap.querySelectorAll('tbody tr').forEach(function(row) {
      var key = row.getAttribute('data-key');
      var item = VIP_SHOP_TRUNGBAY[key];
      if (!item) return;
      item.dsMin = parseInt((row.querySelector('.ct-dsmin') || {}).value, 10) || 0;
      item.skuMin = parseInt((row.querySelector('.ct-skumin') || {}).value, 10) || 0;
      item.thuongVNM = parseInt((row.querySelector('.ct-thuongvnm') || {}).value, 10) || 0;
      item.thuongKH = parseInt((row.querySelector('.ct-thuongkh') || {}).value, 10) || 0;
    });
  } else if (_ctActiveGroup === 'vip' && _ctActiveType === 'TL') {
    wrap.querySelectorAll('tbody tr').forEach(function(row) {
      var idx = parseInt(row.getAttribute('data-idx'), 10);
      var item = VIP_SHOP_TICHLUY[idx];
      if (!item) return;
      item.dsMin = parseInt((row.querySelector('.ct-dsmin') || {}).value, 10) || 0;
      item.ckN1 = parseFloat((row.querySelector('.ct-ckn1') || {}).value) || 0;
      item.ckN2 = parseFloat((row.querySelector('.ct-ckn2') || {}).value) || 0;
    });
  } else if (_ctActiveGroup === 'sbps' && _ctActiveType === 'TB') {
    wrap.querySelectorAll('tbody tr').forEach(function(row) {
      var key = row.getAttribute('data-key');
      var item = SBPS_TRUNGBAY[key];
      if (!item) return;
      item.dsMin = parseInt((row.querySelector('.ct-dsmin') || {}).value, 10) || 0;
      item.thuong = parseInt((row.querySelector('.ct-thuong') || {}).value, 10) || 0;
    });
  } else if (_ctActiveGroup === 'sbps' && _ctActiveType === 'TL') {
    wrap.querySelectorAll('tbody tr').forEach(function(row) {
      var idx = parseInt(row.getAttribute('data-idx'), 10);
      var item = SBPS_TICHLUY[idx];
      if (!item) return;
      item.dsMin = parseInt((row.querySelector('.ct-dsmin') || {}).value, 10) || 0;
      item.ckN1 = parseFloat((row.querySelector('.ct-ckn1') || {}).value) || 0;
      item.ckN2 = parseFloat((row.querySelector('.ct-ckn2') || {}).value) || 0;
      item.ckN3 = parseFloat((row.querySelector('.ct-ckn3') || {}).value) || 0;
      item.ck26 = parseFloat((row.querySelector('.ct-ck26') || {}).value) || 0;
    });
  }
  ctConfigSave();
  showToast('Đã lưu cấu hình CT');
}

function ctResetSettings() {
  localStorage.removeItem(CT_CONFIG_STORAGE_KEY);
  showToast('Đã reset cấu hình CT, tải lại trang để về mặc định');
}

function cusAppCodeMucOptions(maCT, selectedMuc) {
  var html = '';
  if (maCT === 'MR_VIPSHOP26_TB' || maCT === 'MR_VIPSHOP26_TU2') {
    ['TB1', 'TB2', 'TB3', 'TB4'].forEach(function(m) {
      var t = VIP_SHOP_TRUNGBAY[m];
      html += '<option value="' + m + '"' + (selectedMuc === m ? ' selected' : '') + '>' + m + ' — DS≥' + fmt(t.dsMin) + 'đ</option>';
    });
  } else if (maCT === 'MR_VIPSHOP26_TL') {
    VIP_SHOP_TICHLUY.forEach(function(t) {
      html += '<option value="' + t.muc + '"' + (selectedMuc === t.muc ? ' selected' : '') + '>' + t.muc + ' — DS≥' + fmt(t.dsMin) + 'đ</option>';
    });
  } else if (maCT === 'MR_VNMS26_TB' || maCT === 'MR_VSHOP26_TB') {
    Object.keys(VNM_SHOP_TRUNGBAY).forEach(function(m) {
      var t = VNM_SHOP_TRUNGBAY[m];
      html += '<option value="' + m + '"' + (selectedMuc === m ? ' selected' : '') + '>' + m + ' — DS≥' + fmt(t.dsMin) + 'đ</option>';
    });
  } else if (maCT === 'MR_VNMS26_TL' || maCT === 'MR_VSHOP26_TL') {
    VNM_SHOP_TICHLUY.forEach(function(t) {
      html += '<option value="' + t.muc + '"' + (selectedMuc === t.muc ? ' selected' : '') + '>Mức ' + t.muc + ' — DS≥' + fmt(t.dsMin) + 'đ</option>';
    });
  } else if (maCT === 'MR_SBPS26_TB') {
    Object.keys(SBPS_TRUNGBAY).forEach(function(m) {
      var t = SBPS_TRUNGBAY[m];
      html += '<option value="' + m + '"' + (selectedMuc === m ? ' selected' : '') + '>' + m + ' — DS≥' + fmt(t.dsMin) + 'đ</option>';
    });
  } else if (maCT === 'MR_SBPS26_TL' || maCT === 'MR_SBPS_TE26_TL') {
    SBPS_TICHLUY.forEach(function(t) {
      html += '<option value="' + t.muc + '"' + (selectedMuc === t.muc ? ' selected' : '') + '>Mức ' + t.muc + ' — DS≥' + fmt(t.dsMin) + 'đ</option>';
    });
  } else if (maCT === 'MRKEMSHOP26TB') {
    ['VNM'].forEach(function(m) {
      html += '<option value="' + m + '"' + (selectedMuc === m ? ' selected' : '') + '>' + m + '</option>';
    });
  } else if (maCT === 'MRKEMSHOP26TL') {
    for (var i = 1; i <= 5; i++) {
      var s = String(i);
      html += '<option value="' + s + '"' + (selectedMuc === s ? ' selected' : '') + '>Mức ' + s + '</option>';
    }
  }
  return html;
}

function cusAppCodeRowHTML(entry) {
  var item = entry || { maCT: '', muc: '', ngayDk: '' };
  var appCodeOpts = Object.keys(VNM_APP_CODES).map(function(k) {
    return '<option value="' + k + '"' + (item.maCT === k ? ' selected' : '') + '>' + k + '</option>';
  }).join('');
  var mucOpts = item.maCT ? cusAppCodeMucOptions(item.maCT, item.muc) : '';
  return '<div class="appc-row" style="display:grid;grid-template-columns:1fr 1fr 60px 32px;gap:6px;margin-bottom:8px;align-items:center">' +
    '<select class="appc-ma" onchange="cusAppCodeChangeMa(this)" style="height:38px;border:1.5px solid var(--n5);border-radius:var(--Rs);padding:0 6px;font-size:12px;width:100%">' +
    '<option value="">— Chọn mã CT —</option>' + appCodeOpts + '</select>' +
    '<select class="appc-muc" style="height:38px;border:1.5px solid var(--n5);border-radius:var(--Rs);padding:0 6px;font-size:12px;width:100%">' +
    (mucOpts ? mucOpts : '<option value="">— Chọn mức —</option>') + '</select>' +
    '<input type="number" class="appc-ngay" placeholder="Ngày ĐK" value="' + (item.ngayDk || '') + '" min="1" max="31" style="height:38px;border:1.5px solid var(--n5);border-radius:var(--Rs);padding:0 5px;font-size:12px;text-align:center;width:100%">' +
    '<button type="button" onclick="cusRemoveAppCodeRow(this)" style="height:38px;width:32px;border:none;background:none;color:var(--r);font-size:18px;cursor:pointer;line-height:1">✕</button>' +
  '</div>';
}

function cusAddAppCodeRow(entry) {
  var list = document.getElementById('appc-list');
  if (!list) return;
  var wrapper = document.createElement('div');
  wrapper.innerHTML = cusAppCodeRowHTML(entry);
  list.appendChild(wrapper.firstChild);
}

function cusRemoveAppCodeRow(btn) {
  var row = btn && btn.closest('.appc-row');
  if (row) row.remove();
}

function cusAppCodeChangeMa(sel) {
  var row = sel && sel.closest('.appc-row');
  if (!row) return;
  var maCT = sel.value;
  var mucSel = row.querySelector('.appc-muc');
  if (mucSel) mucSel.innerHTML = maCT ? cusAppCodeMucOptions(maCT, '') : '<option value="">— Chọn mức —</option>';
}

function cusReadAppCodes() {
  var rows = [];
  document.querySelectorAll('.appc-row').forEach(function(row) {
    var maCT = ((row.querySelector('.appc-ma') || {}).value || '').trim();
    var muc = ((row.querySelector('.appc-muc') || {}).value || '').trim();
    var ngayDk = parseInt(((row.querySelector('.appc-ngay') || {}).value || '').trim(), 10) || 0;
    if (maCT) rows.push({ maCT: maCT, muc: muc, ngayDk: ngayDk });
  });
  return rows;
}

function calcVNMShopReward(kh, monthData) {
  if (!kh.programs || !kh.programs.vnmShop || !kh.programs.vnmShop.dangKy) return null;
  var cfg = kh.programs.vnmShop;
  var dsThang = (monthData && monthData.dsNhomC) || 0;
  var datTrungBay = (monthData && monthData.vnmShopTrungBay) || false;
  var mucBB = cfg.mucBayBan;
  var mucTL = cfg.mucTichLuy;
  var result = { trungBay: 0, tichLuy: 0, giaiDoan1: 0, giaiDoan2: 0, giaiDoan3: 0, total: 0, details: [] };

  var bb = VNM_SHOP_TRUNGBAY[mucBB];
  if (bb && datTrungBay && dsThang >= bb.dsMin) {
    var heSo = 1;
    if (cfg.ngayDangKy > 15 && cfg.ngayDangKy <= 19) heSo = 0.5;
    else if (cfg.ngayDangKy > 19) heSo = 0;
    result.trungBay = Math.round(bb.thuong * heSo);
    result.details.push('Trưng bày ' + mucBB + ': ' + fmt(result.trungBay) + 'đ');
  }

  var tl = VNM_SHOP_TICHLUY.find(function(t) { return t.muc === mucTL; });
  if (tl && dsThang >= tl.dsMin) {
    result.tichLuy = Math.round(dsThang * tl.ckDS / 100);
    result.details.push('Tích lũy DS ' + tl.ckDS + '%: ' + fmt(result.tichLuy) + 'đ');
    var dsGD1 = (monthData && monthData.dsGD1) || 0;
    var dsGD2 = (monthData && monthData.dsGD2) || 0;
    var dsGD3 = (monthData && monthData.dsGD3) || 0;
    var dsMaxTL = tl.dsMax || dsThang;
    if (dsGD1 >= tl.dsMin * 0.25) {
      var dsGD1Tinh = Math.min(dsGD1, dsMaxTL * 0.4);
      result.giaiDoan1 = Math.round(dsGD1Tinh * tl.ckGD1 / 100);
      result.details.push('GĐ1 (1-10): ' + fmt(result.giaiDoan1) + 'đ');
    }
    var dsLuyKe12 = dsGD1 + dsGD2;
    if (dsLuyKe12 >= tl.dsMin * 0.55) {
      var dsGD2Tinh = Math.min(dsLuyKe12, dsMaxTL * 0.7) - Math.min(dsGD1, dsMaxTL * 0.4);
      if (dsGD2Tinh > 0) {
        result.giaiDoan2 = Math.round(dsGD2Tinh * tl.ckGD2 / 100);
        result.details.push('GĐ2 (11-20): ' + fmt(result.giaiDoan2) + 'đ');
      }
    }
    var dsLuyKe123 = dsGD1 + dsGD2 + dsGD3;
    if (dsLuyKe123 >= tl.dsMin * 0.85) {
      var dsGD3Tinh = dsLuyKe123 - Math.min(dsLuyKe12, dsMaxTL * 0.7);
      if (dsGD3Tinh > 0) {
        result.giaiDoan3 = Math.round(dsGD3Tinh * tl.ckGD3 / 100);
        result.details.push('GĐ3 (21-27): ' + fmt(result.giaiDoan3) + 'đ');
      }
    }
  }
  result.total = result.trungBay + result.tichLuy + result.giaiDoan1 + result.giaiDoan2 + result.giaiDoan3;
  return result;
}

function calcVIPShopReward(kh, monthData) {
  if (!kh.programs || !kh.programs.vipShop || !kh.programs.vipShop.dangKy) return null;
  var cfg = kh.programs.vipShop;
  var dsDE = (monthData && monthData.dsNhomDE) || 0;
  var dsN1 = (monthData && monthData.dsVipN1) || 0;
  var dsN2 = (monthData && monthData.dsVipN2) || 0;
  var skuD = (monthData && monthData.skuNhomD) || 0;
  var datTrungBay = (monthData && monthData.vipShopTrungBay) || false;
  var result = { trungBay: 0, tichLuy: 0, vuot90: 0, total: 0, details: [] };

  var mucBB = cfg.mucBayBan;
  var bb2 = VIP_SHOP_TRUNGBAY[mucBB];
  if (bb2 && datTrungBay && dsDE >= bb2.dsMin && skuD >= bb2.skuMin) {
    var thuong = kh.coTuVNM ? bb2.thuongVNM : bb2.thuongKH;
    var heSo2 = 1;
    if (cfg.ngayDangKy > 15 && cfg.ngayDangKy <= 20) heSo2 = 0.5;
    else if (cfg.ngayDangKy > 20) heSo2 = 0;
    result.trungBay = Math.round(thuong * heSo2);
    result.details.push('TB tủ ' + mucBB + ' (' + (kh.coTuVNM ? 'VNM' : 'KH') + '): ' + fmt(result.trungBay) + 'đ');
  }

  var mucTL = cfg.mucTichLuy;
  var tl2 = VIP_SHOP_TICHLUY.find(function(t) { return t.muc === mucTL; });
  if (tl2 && dsDE >= tl2.dsMin) {
    var thuongN1 = Math.round(dsN1 * tl2.ckN1 / 100);
    var thuongN2 = Math.round(dsN2 * tl2.ckN2 / 100);
    result.tichLuy = thuongN1 + thuongN2;
    result.details.push('CL N1 ' + tl2.ckN1 + '%: ' + fmt(thuongN1) + 'đ');
    result.details.push('CL N2 ' + tl2.ckN2 + '%: ' + fmt(thuongN2) + 'đ');
  }
  if (dsDE > 90000000) {
    result.vuot90 = Math.round((dsDE - 90000000) * 1.0 / 100);
    result.details.push('Vượt 90tr: ' + fmt(result.vuot90) + 'đ');
  }
  result.total = result.trungBay + result.tichLuy + result.vuot90;
  return result;
}

function calcSBPSReward(kh, monthData) {
  if (!kh.programs || !kh.programs.sbpsShop || !kh.programs.sbpsShop.dangKy) return null;
  var cfg = kh.programs.sbpsShop;
  var dsThang = (monthData && monthData.dsSBPS) || 0;
  var dsN1 = (monthData && monthData.sbpsN1) || 0;
  var dsN2 = (monthData && monthData.sbpsN2) || 0;
  var dsN3 = (monthData && monthData.sbpsN3) || 0;
  var dsTo26 = (monthData && monthData.sbpsTo26) || 0;
  var datTrungBay = (monthData && monthData.sbpsTrungBay) || false;
  var muc = cfg.muc;
  var mucTB = cfg.mucTrungBay || '';
  var result = { trungBay: 0, tichLuy: 0, thuong26: 0, total: 0, details: [] };
  var tbInfo = SBPS_TRUNGBAY[mucTB];
  if (tbInfo && tbInfo.thuong > 0 && datTrungBay && dsThang >= tbInfo.dsMin) {
    var heSoTB = 1;
    if (cfg.ngayDangKy > 15 && cfg.ngayDangKy <= 20) heSoTB = 0.5;
    else if (cfg.ngayDangKy > 20) heSoTB = 0;
    result.trungBay = Math.round(tbInfo.thuong * heSoTB);
    if (result.trungBay > 0) result.details.push('Trưng bày ' + mucTB + ': ' + fmt(result.trungBay) + 'đ');
  }
  var tl3 = SBPS_TICHLUY.find(function(t) { return t.muc === muc; });
  if (tl3 && dsThang >= tl3.dsMin) {
    var t1 = Math.round(dsN1 * tl3.ckN1 / 100);
    var t2 = Math.round(dsN2 * tl3.ckN2 / 100);
    var t3 = Math.round(dsN3 * tl3.ckN3 / 100);
    result.tichLuy = t1 + t2 + t3;
    result.details.push('SBPS N1 ' + tl3.ckN1 + '%: ' + fmt(t1) + 'đ');
    result.details.push('SBPS N2 ' + tl3.ckN2 + '%: ' + fmt(t2) + 'đ');
    result.details.push('SBPS N3 ' + tl3.ckN3 + '%: ' + fmt(t3) + 'đ');
    if (tl3.ck26 > 0 && dsTo26 >= tl3.dsMin) {
      result.thuong26 = Math.round(dsTo26 * tl3.ck26 / 100);
      result.details.push('Thưởng đến 26: ' + fmt(result.thuong26) + 'đ');
    }
  }
  result.total = result.trungBay + result.tichLuy + result.thuong26;
  return result;
}

function calcTotalReward(kh, monthData) {
  var vnm = calcVNMShopReward(kh, monthData);
  var vip = calcVIPShopReward(kh, monthData);
  var sbps = calcSBPSReward(kh, monthData);
  var totalReward = (vnm ? vnm.total : 0) + (vip ? vip.total : 0) + (sbps ? sbps.total : 0);
  var dsTotal = 0;
  if (monthData) dsTotal = (monthData.dsNhomC || 0) + (monthData.dsNhomDE || 0) + (monthData.dsSBPS || 0);
  return { vnm: vnm, vip: vip, sbps: sbps, totalReward: totalReward, dsTotal: dsTotal };
}

function cusProgressVNM(kh, md) {
  if (!kh.programs || !kh.programs.vnmShop || !kh.programs.vnmShop.dangKy) return null;
  var dsMin = kh.programs.vnmShop.dsMin || 0;
  if (!dsMin) {
    var muc = kh.programs.vnmShop.mucTichLuy;
    var tl = VNM_SHOP_TICHLUY.find(function(t) { return t.muc === muc; });
    if (tl) dsMin = tl.dsMin;
  }
  var ds = (md && md.dsNhomC) || 0;
  return { pct: dsMin > 0 ? (ds / dsMin * 100) : 0, ds: ds, target: dsMin };
}

function cusProgressVIP(kh, md) {
  if (!kh.programs || !kh.programs.vipShop || !kh.programs.vipShop.dangKy) return null;
  var mucTL = kh.programs.vipShop.mucTichLuy;
  var tl = VIP_SHOP_TICHLUY.find(function(t) { return t.muc === mucTL; });
  var dsMin = tl ? tl.dsMin : 0;
  var ds = (md && md.dsNhomDE) || 0;
  return { pct: dsMin > 0 ? (ds / dsMin * 100) : 0, ds: ds, target: dsMin };
}

window.VNM_SHOP_TRUNGBAY = VNM_SHOP_TRUNGBAY;
window.VNM_SHOP_TICHLUY = VNM_SHOP_TICHLUY;
window.VIP_SHOP_TRUNGBAY = VIP_SHOP_TRUNGBAY;
window.VIP_SHOP_TICHLUY = VIP_SHOP_TICHLUY;
window.SBPS_TICHLUY = SBPS_TICHLUY;
window.SBPS_TRUNGBAY = SBPS_TRUNGBAY;
window.ctConfigLoad = ctConfigLoad;
window.openCTSettings = openCTSettings;
window.ctSetGroup = ctSetGroup;
window.ctSetType = ctSetType;
window.ctSaveSettings = ctSaveSettings;
window.ctResetSettings = ctResetSettings;
window.cusAppCodeMucOptions = cusAppCodeMucOptions;
window.cusAppCodeRowHTML = cusAppCodeRowHTML;
window.cusAddAppCodeRow = cusAddAppCodeRow;
window.cusRemoveAppCodeRow = cusRemoveAppCodeRow;
window.cusAppCodeChangeMa = cusAppCodeChangeMa;
window.cusReadAppCodes = cusReadAppCodes;
window.calcVNMShopReward = calcVNMShopReward;
window.calcVIPShopReward = calcVIPShopReward;
window.calcSBPSReward = calcSBPSReward;
window.calcTotalReward = calcTotalReward;
window.cusProgressVNM = cusProgressVNM;
window.cusProgressVIP = cusProgressVIP;
