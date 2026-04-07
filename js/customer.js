// ============================================================
// CUSTOMER MODULE v2 — Quản lý KH + KPI + Thưởng CT
// Fixed: var instead of let for cross-script access
// ============================================================

var CUS = [];
var ROUTES = [];
var _cusFilterRoute = '';
var _cusFilterQuery = '';
var _cusEditIdx = -1;
var _cusViewMonthKey = '';
var _cusExpanded = {};

var CUS_STORAGE_KEY = 'vnm_customers2';
var ROUTES_STORAGE_KEY = 'vnm_routes';
var CUSTOMERS_URL = REPO_RAW + 'customers.json';
var ROUTES_URL = REPO_RAW + 'routes.json';
var _cusInputMonthKey = '';

var CUS_MONTHLY_MANUAL_FIELDS = {
  dsNhomC: 'manualDsNhomC',
  dsNhomDE: 'manualDsNhomDE',
  dsSBPS: 'manualDsSBPS'
};
// ============================================================
// BẢNG CƠ CẤU CHƯƠNG TRÌNH (từ 3 PDF)
// ============================================================

// VNM Shop Trưng Bày T3-6/2026
// M1-M6: Tất cả cửa hàng kênh truyền thống | M7-M9: Siêu thị Mini/Minimart
var VNM_SHOP_TRUNGBAY = {
  M1: { ten: 'Ụ HZ + Kệ KH 24 mặt', dsMin: 45000000, thuong: 900000, soMat: 24, loaiCH: 'Kênh TT' },
  M2: { ten: 'Ụ HZ + Kệ KH 18 mặt', dsMin: 38000000, thuong: 750000, soMat: 18, loaiCH: 'Kênh TT' },
  M3: { ten: 'Ụ HZ + Kệ KH 8 mặt',  dsMin: 30000000, thuong: 600000, soMat:  8, loaiCH: 'Kênh TT' },
  M4: { ten: 'Kệ SN + Kệ KH 12 mặt', dsMin: 18000000, thuong: 350000, soMat: 12, loaiCH: 'Kênh TT' },
  M5: { ten: 'Kệ KH 24 mặt',          dsMin: 12000000, thuong: 240000, soMat: 24, loaiCH: 'Kênh TT' },
  M6: { ten: 'Kệ KH 18 mặt',          dsMin:  8000000, thuong: 150000, soMat: 18, loaiCH: 'Kênh TT' },
  M7: { ten: 'Kệ Minimart 50 mặt',    dsMin: 35000000, thuong: 700000, soMat: 50, loaiCH: 'Minimart' },
  M8: { ten: 'Kệ Minimart 40 mặt',    dsMin: 28000000, thuong: 550000, soMat: 40, loaiCH: 'Minimart' },
  M9: { ten: 'Kệ Minimart 30 mặt',    dsMin: 20000000, thuong: 400000, soMat: 30, loaiCH: 'Minimart' }
};

// VNM Shop Tích Lũy T3-6/2026
// - ckDS: thưởng tháng, tính trên TOÀN BỘ DS thực hiện, KHÔNG giới hạn tối đa
// - ckGD1/2/3: thưởng hoàn thành giai đoạn, tính trên DS thực hiện trong GĐ nhưng có giới hạn:
//   GĐ1 max = 40% dsMax (trừ Mức 1: max = 40% DS thực tế hết tháng)
//   GĐ1+GĐ2 max = 70% dsMax (trừ Mức 1: max = 70% DS thực tế hết tháng)
// - GĐ lưu ý: KHÔNG tính SP Sữa tươi tiệt trùng Vinamilk 100% 1L
var VNM_SHOP_TICHLUY = [
  { muc: '1', dsMin: 200000000, dsMax: null,        ckDS: 1.80, ckGD1: 1.60, ckGD2: 1.20, ckGD3: 0.60 },
  { muc: '2', dsMin: 100000000, dsMax: 200000000,   ckDS: 1.70, ckGD1: 1.60, ckGD2: 1.20, ckGD3: 0.60 },
  { muc: '3', dsMin:  65000000, dsMax: 100000000,   ckDS: 1.60, ckGD1: 1.60, ckGD2: 1.20, ckGD3: 0.60 },
  { muc: '4', dsMin:  35000000, dsMax:  65000000,   ckDS: 1.50, ckGD1: 1.60, ckGD2: 1.20, ckGD3: 0.60 },
  { muc: '5', dsMin:  20000000, dsMax:  35000000,   ckDS: 1.40, ckGD1: 1.60, ckGD2: 1.20, ckGD3: 0.60 },
  { muc: '6', dsMin:  10000000, dsMax:  20000000,   ckDS: 1.30, ckGD1: 1.60, ckGD2: 1.20, ckGD3: 0.60 },
  { muc: '7', dsMin:   5000000, dsMax:  10000000,   ckDS: 1.20, ckGD1: 1.60, ckGD2: 1.20, ckGD3: 0.60 }
];

var VIP_SHOP_TRUNGBAY = {
  TB1: { dsMin: 15000000, skuMin: 10, thuongVNM: 800000, thuongKH: 400000 },
  TB2: { dsMin: 12000000, skuMin: 8,  thuongVNM: 630000, thuongKH: 320000 },
  TB3: { dsMin: 6000000,  skuMin: 6,  thuongVNM: 320000, thuongKH: 160000 },
  TB4: { dsMin: 3000000,  skuMin: 4,  thuongVNM: 200000, thuongKH: 100000 }
};

var VIP_SHOP_TICHLUY = [
  { muc: 'TL1', dsMin: 60000000, ckN1: 2.6, ckN2: 5.5 },
  { muc: 'TL2', dsMin: 30000000, ckN1: 2.4, ckN2: 5.0 },
  { muc: 'TL3', dsMin: 15000000, ckN1: 2.2, ckN2: 4.5 },
  { muc: 'TL4', dsMin: 9000000,  ckN1: 2.0, ckN2: 4.0 },
  { muc: 'TL5', dsMin: 3000000,  ckN1: 1.8, ckN2: 4.0 }
];

var SBPS_TICHLUY = [
  { muc: '1', dsMin: 160000000, ckN1: 7.00, ckN2: 7.30, ckN3: 6.20, ck26: 1.00 },
  { muc: '2', dsMin: 105000000, ckN1: 6.70, ckN2: 7.10, ckN3: 6.00, ck26: 1.00 },
  { muc: '3', dsMin: 75000000,  ckN1: 6.40, ckN2: 6.90, ckN3: 5.80, ck26: 1.00 },
  { muc: '4', dsMin: 32000000,  ckN1: 6.00, ckN2: 6.70, ckN3: 5.60, ck26: 1.00 },
  { muc: '5', dsMin: 17000000,  ckN1: 5.50, ckN2: 6.40, ckN3: 5.40, ck26: 1.00 },
  { muc: '6', dsMin: 9000000,   ckN1: 5.30, ckN2: 5.80, ckN3: 5.30, ck26: 0.60 },
  { muc: '7', dsMin: 5500000,   ckN1: 5.20, ckN2: 5.60, ckN3: 5.20, ck26: 0 },
  { muc: '8', dsMin: 3500000,   ckN1: 4.00, ckN2: 4.50, ckN3: 4.00, ck26: 0 }
];

// SBPS Trưng Bày T3-6/2026 — Loại hình 1 (Tạp hóa/Khác) + Minimart/Mẹ&Bé
// TH-M1..5: Tạp hóa/Khác | TH-M6..8: Minimart/Mẹ&Bé
var SBPS_TRUNGBAY = {
  'TH-M1': { dsMin: 105000000, thuong: 300000, loai: 'Tạp hóa/Khác',      soMat: 20 },
  'TH-M2': { dsMin: 75000000,  thuong: 230000, loai: 'Tạp hóa/Khác',      soMat: 14 },
  'TH-M3': { dsMin: 32000000,  thuong: 150000, loai: 'Tạp hóa/Khác',      soMat: 10 },
  'TH-M4': { dsMin: 17000000,  thuong: 150000, loai: 'Tạp hóa/Khác',      soMat: 10 },
  'TH-M5': { dsMin: 5500000,   thuong: 80000,  loai: 'Tạp hóa/Khác',      soMat: 8  },
  'TH-M6': { dsMin: 75000000,  thuong: 400000, loai: 'Minimart/M&B Lớn',   soMat: 20 },
  'TH-M7': { dsMin: 32000000,  thuong: 250000, loai: 'Minimart/M&B Vừa',   soMat: 14 },
  'TH-M8': { dsMin: 10000000,  thuong: 150000, loai: 'Minimart/M&B Nhỏ',   soMat: 10 }
};

// Bảng mã CT theo app Vinamilk → mapping sang programs nội bộ
var VNM_APP_CODES = {
  'MR_VIPSHOP26_TB': { prog: 'vipShop',  loai: 'TB', ten: 'VIP Shop Trưng Bày'  },
  'MR_VIPSHOP26_TL': { prog: 'vipShop',  loai: 'TL', ten: 'VIP Shop Tích Lũy'   },
  'MR_VNMS26_TB':    { prog: 'vnmShop',  loai: 'TB', ten: 'VNM Shop Trưng Bày'  },
  'MR_VNMS26_TL':    { prog: 'vnmShop',  loai: 'TL', ten: 'VNM Shop Tích Lũy'   },
  'MR_VSHOP26_TB':   { prog: 'vnmShop',  loai: 'TB', ten: 'V Shop Trưng Bày'    },
  'MR_VSHOP26_TL':   { prog: 'vnmShop',  loai: 'TL', ten: 'V Shop Tích Lũy'     },
  'MR_SBPS26_TB':    { prog: 'sbpsShop', loai: 'TB', ten: 'SBPS Trưng Bày'      },
  'MR_SBPS26_TL':    { prog: 'sbpsShop', loai: 'TL', ten: 'SBPS Tích Lũy'       },
  'MR_SBPS_TE26_TL': { prog: 'sbpsShop', loai: 'TL', ten: 'SBPS TE Tích Lũy'    }
};

function cusResolveProductForOrderItem(item) {
  if (!item || typeof item !== 'object') return null;
  if (typeof spFind === 'function' && item.ma) {
    var found = spFind(item.ma);
    if (found) return found;
  }
  return item;
}

function cusGetProductCode(product) {
  return String((product && product.ma) || '').trim().toUpperCase();
}

function cusGetProductName(product) {
  return String((product && product.ten) || '').trim().toLowerCase();
}

function isVNMGiaiDoanProduct(product) {
  if (!product || product.nhom !== 'C') return false;
  return cusGetProductName(product).indexOf('1l') < 0;
}

function classifyVIPProduct(product) {
  if (!product || product.nhom !== 'D') return '';
  var code = cusGetProductCode(product);
  var name = cusGetProductName(product);
  if (!code && !name) return '';

  if (/happy star|rau củ susu|rau cu susu|thạch phô mai que|thach pho mai que|bơ lạt|bo lat|học đường|hoc duong/.test(name)) return 'excluded';
  if (/^10(BT|VS|VA)/.test(code) || /^14S[ACD]/.test(code) || /^07(TA|TC|TR)6/.test(code)) return 'excluded';

  if (/phô mai|pho mai/.test(name)) return 'N1';
  if (/probi/.test(name)) {
    if (/(65ml|130ml)/.test(name) && /(ít đường|it duong|không đường|khong duong|truyền thống|truyen thong)/.test(name)) return 'N1';
    return 'N2';
  }
  if (/green farm|kombucha|nước dừa|nuoc dua/.test(name)) return 'N2';
  if (/sca/.test(name)) {
    if (/green farm/.test(name)) return 'N2';
    if (/không đường|khong duong|ít đường|it duong|nha đam|nha dam|star/.test(name) || /^07(KD|ID|NH|SR|SN)/.test(code)) return 'N1';
    return 'N2';
  }
  return 'other';
}

function classifySBPSProduct(product) {
  if (!product || product.nhom !== 'A') return '';
  var name = cusGetProductName(product);
  if (!/(110ml|180ml)/.test(name)) return '';
  if (/sure|diecerna|mama|canxi|ridielac|bột|bot|nguyên kem|nguyen kem|phô mai|pho mai/.test(name)) return 'excluded';
  if (/optimum gold|dielac grow plus/.test(name)) return 'N2';
  if (/dielac gold|dielac grow(?! plus)|optimum a2|a2 pro/.test(name)) return 'N1';
  if (/yoko|colos/.test(name)) return 'N3';
  return 'excluded';
}

function cusGetOrderDay(order) {
  var time = new Date((order && order.date) || '').getTime();
  if (isNaN(time)) return 0;
  return new Date(time).getDate();
}

function cusGetProgramCodes(kh, progKey) {
  var appCodes = (kh && kh.appCodes && kh.appCodes.length) ? kh.appCodes : cusProgamsToAppCodes(kh || {});
  return appCodes.filter(function(ac) {
    var info = VNM_APP_CODES[ac.maCT];
    return info && info.prog === progKey;
  }).map(function(ac) {
    return ac.maCT + (ac.muc ? ' · ' + ac.muc : '');
  });
}

// ============================================================
// QUẢN LÝ CẤU HÌNH CHƯƠNG TRÌNH TB & TL
// ============================================================
var CT_CONFIG_STORAGE_KEY = 'vnm_ct_config';
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
  } catch(e) {}
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
  } catch(e) {}
}

function openCTSettings() {
  var modal = document.getElementById('km-modal');
  document.getElementById('km-modal-t').textContent = '📋 Chương trình TB & TL';
  modal.style.display = 'block';
  ctRenderSettingsBody();
}

function ctRenderSettingsBody() {
  var g = _ctActiveGroup, tp = _ctActiveType;
  var body = document.getElementById('km-modal-body');
  var html = '';
  // Group tabs
  html += '<div class="ct-group-tabs">';
  [{id:'vnm',lab:'VNM Shop'},{id:'vip',lab:'VIP Shop'},{id:'sbps',lab:'SBPS'}].forEach(function(x) {
    html += '<button class="ct-group-tab'+(g===x.id?' on':'')+'" onclick="ctSetGroup(\''+x.id+'\')">'+x.lab+'</button>';
  });
  html += '</div>';
  // Type tabs
  html += '<div style="display:flex;gap:6px;margin-bottom:12px">';
  html += '<button class="ct-type-tab'+(tp==='TB'?' on':'')+'" onclick="ctSetType(\'TB\')">🏪 Trưng Bày</button>';
  html += '<button class="ct-type-tab'+(tp==='TL'?' on':'')+'" onclick="ctSetType(\'TL\')">📈 Tích Lũy</button>';
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
      html += '<tr data-key="'+m+'"><td style="font-weight:800;color:var(--vm)">'+m+'</td>';
      html += '<td><input class="ct-inp ct-ten" value="'+t.ten+'" style="width:150px"></td>';
      html += '<td><input class="ct-inp ct-dsmin" type="number" value="'+t.dsMin+'"></td>';
      html += '<td><input class="ct-inp ct-thuong" type="number" value="'+t.thuong+'"></td></tr>';
    });
    html += '</tbody></table>';
  } else if (g === 'vnm' && tp === 'TL') {
    html += '<div style="font-size:10.5px;color:var(--n3);margin-bottom:8px">VNM Shop — Tích Lũy DS tháng</div>';
    html += '<table class="ct-edit-table"><thead><tr><th>Mức</th><th>DS min</th><th>DS max (bỏ trống=∞)</th><th>CK%</th><th>GĐ1%</th><th>GĐ2%</th><th>GĐ3%</th></tr></thead><tbody>';
    VNM_SHOP_TICHLUY.forEach(function(t, i) {
      html += '<tr data-idx="'+i+'"><td style="font-weight:800;color:var(--vm)">'+t.muc+'</td>';
      html += '<td><input class="ct-inp ct-dsmin" type="number" value="'+t.dsMin+'"></td>';
      html += '<td><input class="ct-inp ct-dsmax" type="number" value="'+(t.dsMax||'')+'" placeholder="∞"></td>';
      html += '<td><input class="ct-inp ct-ck" type="number" step="0.01" value="'+t.ckDS+'"></td>';
      html += '<td><input class="ct-inp ct-gd1" type="number" step="0.01" value="'+t.ckGD1+'"></td>';
      html += '<td><input class="ct-inp ct-gd2" type="number" step="0.01" value="'+t.ckGD2+'"></td>';
      html += '<td><input class="ct-inp ct-gd3" type="number" step="0.01" value="'+t.ckGD3+'"></td></tr>';
    });
    html += '</tbody></table>';
  } else if (g === 'vip' && tp === 'TB') {
    html += '<div style="font-size:10.5px;color:var(--n3);margin-bottom:8px">VIP Shop — Trưng Bày Tủ</div>';
    html += '<table class="ct-edit-table"><thead><tr><th>Mức</th><th>DS min</th><th>SKU min</th><th>Thưởng Tủ VNM</th><th>Thưởng Tủ KH</th></tr></thead><tbody>';
    Object.keys(VIP_SHOP_TRUNGBAY).forEach(function(m) {
      var t = VIP_SHOP_TRUNGBAY[m];
      html += '<tr data-key="'+m+'"><td style="font-weight:800;color:#2563EB">'+m+'</td>';
      html += '<td><input class="ct-inp ct-dsmin" type="number" value="'+t.dsMin+'"></td>';
      html += '<td><input class="ct-inp ct-sku" type="number" value="'+t.skuMin+'"></td>';
      html += '<td><input class="ct-inp ct-tvnm" type="number" value="'+t.thuongVNM+'"></td>';
      html += '<td><input class="ct-inp ct-tkh" type="number" value="'+t.thuongKH+'"></td></tr>';
    });
    html += '</tbody></table>';
  } else if (g === 'vip' && tp === 'TL') {
    html += '<div style="font-size:10.5px;color:var(--n3);margin-bottom:8px">VIP Shop — Tích Lũy DS (N1=Chủ lực, N2=Tập trung)</div>';
    html += '<table class="ct-edit-table"><thead><tr><th>Mức</th><th>DS min</th><th>CK N1 (Chủ lực)%</th><th>CK N2 (Tập trung)%</th></tr></thead><tbody>';
    VIP_SHOP_TICHLUY.forEach(function(t, i) {
      html += '<tr data-idx="'+i+'"><td style="font-weight:800;color:#2563EB">'+t.muc+'</td>';
      html += '<td><input class="ct-inp ct-dsmin" type="number" value="'+t.dsMin+'"></td>';
      html += '<td><input class="ct-inp ct-ckn1" type="number" step="0.01" value="'+t.ckN1+'"></td>';
      html += '<td><input class="ct-inp ct-ckn2" type="number" step="0.01" value="'+t.ckN2+'"></td></tr>';
    });
    html += '</tbody></table>';
  } else if (g === 'sbps' && tp === 'TB') {
    html += '<div style="font-size:10.5px;color:var(--n3);margin-bottom:8px">SBPS — Trưng Bày (TH-M1 đến TH-M8)</div>';
    html += '<table class="ct-edit-table"><thead><tr><th>Mức</th><th>DS min (đ)</th><th>Thưởng (đ)</th></tr></thead><tbody>';
    Object.keys(SBPS_TRUNGBAY).forEach(function(m) {
      var t = SBPS_TRUNGBAY[m];
      html += '<tr data-key="'+m+'"><td style="font-weight:800;color:#D97706">'+m+'</td>';
      html += '<td><input class="ct-inp ct-dsmin" type="number" value="'+t.dsMin+'"></td>';
      html += '<td><input class="ct-inp ct-thuong" type="number" value="'+t.thuong+'"></td></tr>';
    });
    html += '</tbody></table>';
  } else if (g === 'sbps' && tp === 'TL') {
    html += '<div style="font-size:10.5px;color:var(--n3);margin-bottom:8px">SBPS — Tích Lũy DS (N1=DG/GP/A2, N2=OG/DGP, N3=Yoko/OC)</div>';
    html += '<table class="ct-edit-table"><thead><tr><th>Mức</th><th>DS min</th><th>N1%</th><th>N2%</th><th>N3%</th><th>Đến 26%</th></tr></thead><tbody>';
    SBPS_TICHLUY.forEach(function(t, i) {
      html += '<tr data-idx="'+i+'"><td style="font-weight:800;color:#D97706">'+t.muc+'</td>';
      html += '<td><input class="ct-inp ct-dsmin" type="number" value="'+t.dsMin+'"></td>';
      html += '<td><input class="ct-inp ct-n1" type="number" step="0.01" value="'+t.ckN1+'"></td>';
      html += '<td><input class="ct-inp ct-n2" type="number" step="0.01" value="'+t.ckN2+'"></td>';
      html += '<td><input class="ct-inp ct-n3" type="number" step="0.01" value="'+t.ckN3+'"></td>';
      html += '<td><input class="ct-inp ct-ck26" type="number" step="0.01" value="'+t.ck26+'"></td></tr>';
    });
    html += '</tbody></table>';
  }
  return html;
}

function ctSetGroup(g) { _ctActiveGroup = g; ctRenderSettingsBody(); }
function ctSetType(t) { _ctActiveType = t; ctRenderSettingsBody(); }

function ctSaveSettings() {
  var g = _ctActiveGroup, tp = _ctActiveType;
  document.querySelectorAll('#ct-table-wrap tr[data-key], #ct-table-wrap tr[data-idx]').forEach(function(row) {
    var v = function(cls) { var el = row.querySelector('.'+cls); return el ? el.value : ''; };
    var n = function(cls) { return parseFloat(v(cls)) || 0; };
    if (g === 'vnm' && tp === 'TB') {
      var k = row.dataset.key; if (!VNM_SHOP_TRUNGBAY[k]) return;
      VNM_SHOP_TRUNGBAY[k].ten = v('ct-ten'); VNM_SHOP_TRUNGBAY[k].dsMin = n('ct-dsmin'); VNM_SHOP_TRUNGBAY[k].thuong = n('ct-thuong');
    } else if (g === 'vnm' && tp === 'TL') {
      var i = +row.dataset.idx; if (!VNM_SHOP_TICHLUY[i]) return;
      var dm = v('ct-dsmax'); VNM_SHOP_TICHLUY[i].dsMin = n('ct-dsmin'); VNM_SHOP_TICHLUY[i].dsMax = dm ? parseFloat(dm) : null;
      VNM_SHOP_TICHLUY[i].ckDS = n('ct-ck'); VNM_SHOP_TICHLUY[i].ckGD1 = n('ct-gd1'); VNM_SHOP_TICHLUY[i].ckGD2 = n('ct-gd2'); VNM_SHOP_TICHLUY[i].ckGD3 = n('ct-gd3');
    } else if (g === 'vip' && tp === 'TB') {
      var k = row.dataset.key; if (!VIP_SHOP_TRUNGBAY[k]) return;
      VIP_SHOP_TRUNGBAY[k].dsMin = n('ct-dsmin'); VIP_SHOP_TRUNGBAY[k].skuMin = n('ct-sku'); VIP_SHOP_TRUNGBAY[k].thuongVNM = n('ct-tvnm'); VIP_SHOP_TRUNGBAY[k].thuongKH = n('ct-tkh');
    } else if (g === 'vip' && tp === 'TL') {
      var i = +row.dataset.idx; if (!VIP_SHOP_TICHLUY[i]) return;
      VIP_SHOP_TICHLUY[i].dsMin = n('ct-dsmin'); VIP_SHOP_TICHLUY[i].ckN1 = n('ct-ckn1'); VIP_SHOP_TICHLUY[i].ckN2 = n('ct-ckn2');
    } else if (g === 'sbps' && tp === 'TB') {
      var k = row.dataset.key; if (!SBPS_TRUNGBAY[k]) return;
      SBPS_TRUNGBAY[k].dsMin = n('ct-dsmin'); SBPS_TRUNGBAY[k].thuong = n('ct-thuong');
    } else if (g === 'sbps' && tp === 'TL') {
      var i = +row.dataset.idx; if (!SBPS_TICHLUY[i]) return;
      SBPS_TICHLUY[i].dsMin = n('ct-dsmin'); SBPS_TICHLUY[i].ckN1 = n('ct-n1'); SBPS_TICHLUY[i].ckN2 = n('ct-n2'); SBPS_TICHLUY[i].ckN3 = n('ct-n3'); SBPS_TICHLUY[i].ck26 = n('ct-ck26');
    }
  });
  ctConfigSave();
  showToast('✅ Đã lưu cấu hình CT — tính thưởng sẽ cập nhật ngay');
}

function ctResetSettings() {
  if (!confirm('Khôi phục tất cả CT về mặc định theo PDF? Thay đổi đã lưu sẽ bị xóa.')) return;
  localStorage.removeItem(CT_CONFIG_STORAGE_KEY);
  showToast('↺ Đã xóa cấu hình tùy chỉnh — tải lại trang để áp dụng');
}

// ============================================================
// MÃ CT APP — Helper functions
// ============================================================

// Trả về HTML options cho dropdown mức của từng mã CT
function cusAppCodeMucOptions(maCT, selectedMuc) {
  var html = '';
  if (maCT === 'MR_VIPSHOP26_TB') {
    ['TB1','TB2','TB3','TB4'].forEach(function(m) {
      var t = VIP_SHOP_TRUNGBAY[m];
      html += '<option value="'+m+'"'+(selectedMuc===m?' selected':'')+'>'+m+' — DS≥'+fmt(t.dsMin)+'đ</option>';
    });
  } else if (maCT === 'MR_VIPSHOP26_TL') {
    VIP_SHOP_TICHLUY.forEach(function(t) {
      html += '<option value="'+t.muc+'"'+(selectedMuc===t.muc?' selected':'')+'>'+t.muc+' — DS≥'+fmt(t.dsMin)+'đ</option>';
    });
  } else if (maCT === 'MR_VNMS26_TB' || maCT === 'MR_VSHOP26_TB') {
    Object.keys(VNM_SHOP_TRUNGBAY).forEach(function(m) {
      var t = VNM_SHOP_TRUNGBAY[m];
      html += '<option value="'+m+'"'+(selectedMuc===m?' selected':'')+'>'+m+' — DS≥'+fmt(t.dsMin)+'đ</option>';
    });
  } else if (maCT === 'MR_VNMS26_TL' || maCT === 'MR_VSHOP26_TL') {
    VNM_SHOP_TICHLUY.forEach(function(t) {
      html += '<option value="'+t.muc+'"'+(selectedMuc===t.muc?' selected':'')+'>Mức '+t.muc+' — DS≥'+fmt(t.dsMin)+'đ</option>';
    });
  } else if (maCT === 'MR_SBPS26_TB') {
    Object.keys(SBPS_TRUNGBAY).forEach(function(m) {
      var t = SBPS_TRUNGBAY[m];
      html += '<option value="'+m+'"'+(selectedMuc===m?' selected':'')+'>'+m+' — DS≥'+fmt(t.dsMin)+'đ</option>';
    });
  } else if (maCT === 'MR_SBPS26_TL' || maCT === 'MR_SBPS_TE26_TL') {
    SBPS_TICHLUY.forEach(function(t) {
      html += '<option value="'+t.muc+'"'+(selectedMuc===t.muc?' selected':'')+'>Mức '+t.muc+' — DS≥'+fmt(t.dsMin)+'đ</option>';
    });
  }
  return html;
}

// Tạo HTML cho 1 dòng nhập mã CT
function cusAppCodeRowHTML(entry) {
  var item = entry || { maCT: '', muc: '', ngayDk: '' };
  var appCodeOpts = Object.keys(VNM_APP_CODES).map(function(k) {
    return '<option value="'+k+'"'+(item.maCT===k?' selected':'')+'>'+k+'</option>';
  }).join('');
  var mucOpts = item.maCT ? cusAppCodeMucOptions(item.maCT, item.muc) : '';
  return '<div class="appc-row" style="display:grid;grid-template-columns:1fr 1fr 60px 32px;gap:6px;margin-bottom:8px;align-items:center">' +
    '<select class="appc-ma" onchange="cusAppCodeChangeMa(this)" style="height:38px;border:1.5px solid var(--n5);border-radius:var(--Rs);padding:0 6px;font-size:12px;width:100%">' +
    '<option value="">— Chọn mã CT —</option>' + appCodeOpts + '</select>' +
    '<select class="appc-muc" style="height:38px;border:1.5px solid var(--n5);border-radius:var(--Rs);padding:0 6px;font-size:12px;width:100%">' +
    (mucOpts ? mucOpts : '<option value="">— Chọn mức —</option>') + '</select>' +
    '<input type="number" class="appc-ngay" placeholder="Ngày ĐK" value="'+(item.ngayDk||'')+'" min="1" max="31" style="height:38px;border:1.5px solid var(--n5);border-radius:var(--Rs);padding:0 5px;font-size:12px;text-align:center;width:100%">' +
    '<button type="button" onclick="cusRemoveAppCodeRow(this)" style="height:38px;width:32px;border:none;background:none;color:var(--r);font-size:18px;cursor:pointer;line-height:1">✕</button>' +
    '</div>';
}

// Thêm 1 dòng mã CT vào form
function cusAddAppCodeRow(entry) {
  var list = document.getElementById('appc-list');
  if (!list) return;
  var wrapper = document.createElement('div');
  wrapper.innerHTML = cusAppCodeRowHTML(entry);
  list.appendChild(wrapper.firstChild);
}

// Xóa 1 dòng mã CT
function cusRemoveAppCodeRow(btn) {
  var row = btn && btn.closest('.appc-row');
  if (row) row.remove();
}

// Khi thay đổi mã CT → cập nhật mức dropdown
function cusAppCodeChangeMa(sel) {
  var row = sel && sel.closest('.appc-row');
  if (!row) return;
  var maCT = sel.value;
  var mucSel = row.querySelector('.appc-muc');
  if (mucSel) mucSel.innerHTML = maCT ? cusAppCodeMucOptions(maCT, '') : '<option value="">— Chọn mức —</option>';
}

// Đọc các mã CT từ form
function cusReadAppCodes() {
  var rows = [];
  document.querySelectorAll('.appc-row').forEach(function(row) {
    var maCT = ((row.querySelector('.appc-ma') || {}).value || '').trim();
    var muc  = ((row.querySelector('.appc-muc') || {}).value || '').trim();
    var ngayDk = parseInt(((row.querySelector('.appc-ngay') || {}).value || '').trim()) || 0;
    if (maCT) rows.push({ maCT: maCT, muc: muc, ngayDk: ngayDk });
  });
  return rows;
}

// Chuyển appCodes → programs (để các hàm tính thưởng cũ vẫn chạy)
function cusAppCodesToPrograms(appCodes) {
  var progs = {
    vnmShop:  { dangKy: false, mucBayBan: 'M1',  mucTichLuy: '1',   ngayDangKy: 0 },
    vipShop:  { dangKy: false, mucBayBan: 'TB1', mucTichLuy: 'TL1', ngayDangKy: 0 },
    sbpsShop: { dangKy: false, muc: '',           mucTrungBay: '',   ngayDangKy: 0 }
  };
  (appCodes || []).forEach(function(ac) {
    var info = VNM_APP_CODES[ac.maCT];
    if (!info) return;
    var ngay = ac.ngayDk || 0;
    if (info.prog === 'vnmShop') {
      progs.vnmShop.dangKy = true;
      if (!progs.vnmShop.ngayDangKy) progs.vnmShop.ngayDangKy = ngay;
      if (info.loai === 'TB') progs.vnmShop.mucBayBan  = ac.muc;
      if (info.loai === 'TL') progs.vnmShop.mucTichLuy = ac.muc;
    } else if (info.prog === 'vipShop') {
      progs.vipShop.dangKy = true;
      if (!progs.vipShop.ngayDangKy) progs.vipShop.ngayDangKy = ngay;
      if (info.loai === 'TB') progs.vipShop.mucBayBan  = ac.muc;
      if (info.loai === 'TL') progs.vipShop.mucTichLuy = ac.muc;
    } else if (info.prog === 'sbpsShop') {
      progs.sbpsShop.dangKy = true;
      if (!progs.sbpsShop.ngayDangKy) progs.sbpsShop.ngayDangKy = ngay;
      if (info.loai === 'TL') progs.sbpsShop.muc        = ac.muc;
      if (info.loai === 'TB') progs.sbpsShop.mucTrungBay = ac.muc;
    }
  });
  return progs;
}

// Chuyển programs cũ → appCodes (dùng khi mở edit KH cũ chưa có appCodes)
function cusProgamsToAppCodes(kh) {
  if (kh.appCodes && kh.appCodes.length) return kh.appCodes;
  var codes = [];
  var prog = kh.programs || {};
  var vnm = prog.vnmShop || {}; var vip = prog.vipShop || {}; var sbps = prog.sbpsShop || {};
  if (vnm.dangKy) {
    if (vnm.mucBayBan)  codes.push({ maCT: 'MR_VNMS26_TB', muc: vnm.mucBayBan,  ngayDk: vnm.ngayDangKy || 0 });
    if (vnm.mucTichLuy) codes.push({ maCT: 'MR_VNMS26_TL', muc: vnm.mucTichLuy, ngayDk: vnm.ngayDangKy || 0 });
  }
  if (vip.dangKy) {
    if (vip.mucBayBan)  codes.push({ maCT: 'MR_VIPSHOP26_TB', muc: vip.mucBayBan,  ngayDk: vip.ngayDangKy || 0 });
    if (vip.mucTichLuy) codes.push({ maCT: 'MR_VIPSHOP26_TL', muc: vip.mucTichLuy, ngayDk: vip.ngayDangKy || 0 });
  }
  if (sbps.dangKy) {
    if (sbps.mucTrungBay) codes.push({ maCT: 'MR_SBPS26_TB', muc: sbps.mucTrungBay, ngayDk: sbps.ngayDangKy || 0 });
    if (sbps.muc)         codes.push({ maCT: 'MR_SBPS26_TL', muc: sbps.muc,         ngayDk: sbps.ngayDangKy || 0 });
  }
  return codes;
}

// ============================================================
// LOAD / SAVE
// ============================================================
function cusSave() { localStorage.setItem(CUS_STORAGE_KEY, JSON.stringify(CUS)); }
function routesSave() { localStorage.setItem(ROUTES_STORAGE_KEY, JSON.stringify(ROUTES)); }

async function cusLoad() {
  var cached = localStorage.getItem(CUS_STORAGE_KEY);
  if (cached) {
    try {
      var data = JSON.parse(cached);
      CUS = Array.isArray(data) ? data.filter(function(d) { return d && d.ma; }) : [];
    } catch(e) { CUS = []; }
  }
  var cachedR = localStorage.getItem(ROUTES_STORAGE_KEY);
  if (cachedR) {
    try { ROUTES = JSON.parse(cachedR); } catch(e) { ROUTES = []; }
  }
  if (!CUS.length) {
    try {
      var ts = '_t=' + Date.now();
      var res = await fetch(CUSTOMERS_URL + '?' + ts, { cache: 'no-store' });
      if (res.ok) {
        var data2 = await res.json();
        CUS = Array.isArray(data2) ? data2.filter(function(d) { return d && d.ma; }) : [];
        cusSave();
      }
    } catch(e) {}
  }
  if (!ROUTES.length) {
    try {
      var ts2 = '_t=' + Date.now();
      var res2 = await fetch(ROUTES_URL + '?' + ts2, { cache: 'no-store' });
      if (res2.ok) { ROUTES = await res2.json(); routesSave(); }
    } catch(e) {
      ROUTES = [
        { id: 'T1', ten: 'Tuyến 1', mota: '' },
        { id: 'T2', ten: 'Tuyến 2', mota: '' }
      ];
      try { routesSave(); } catch(se) {}
    }
  }
}

// ============================================================
// TÍNH THƯỞNG CHƯƠNG TRÌNH
// ============================================================
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
  // Thưởng trưng bày SBPS (TH-Mx)
  var tbInfo = SBPS_TRUNGBAY[mucTB];
  if (tbInfo && tbInfo.thuong > 0 && datTrungBay && dsThang >= tbInfo.dsMin) {
    var heSoTB = 1;
    if (cfg.ngayDangKy > 15 && cfg.ngayDangKy <= 20) heSoTB = 0.5;
    else if (cfg.ngayDangKy > 20) heSoTB = 0;
    result.trungBay = Math.round(tbInfo.thuong * heSoTB);
    if (result.trungBay > 0) result.details.push('Trưng bày ' + mucTB + ': ' + fmt(result.trungBay) + 'đ');
  }
  // Thưởng tích lũy SBPS
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

function cusDateToMonthKey(dateValue) {
  if (dateValue && /^\d{4}-\d{2}/.test(dateValue)) return dateValue.slice(0, 7);
  var d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
}

function cusMonthLabelFromKey(monthKey) {
  var safe = cusDateToMonthKey(monthKey);
  return safe.slice(5, 7) + '/' + safe.slice(0, 4);
}

function cusEditableMetricValue(md, key) {
  if (!md) return '';
  var manualKey = CUS_MONTHLY_MANUAL_FIELDS[key];
  if (manualKey && md[manualKey] !== undefined && md[manualKey] !== null && md[manualKey] !== '') return md[manualKey];
  if (md[key] !== undefined && md[key] !== null && md[key] !== '') return md[key];
  return '';
}

function cusResolveMetricValue(md, key, autoValue) {
  var manualKey = CUS_MONTHLY_MANUAL_FIELDS[key];
  if (md && manualKey && md[manualKey] !== undefined && md[manualKey] !== null && md[manualKey] !== '') return +md[manualKey] || 0;
  if (md && md[key] !== undefined && md[key] !== null && md[key] !== '') return +md[key] || 0;
  return +autoValue || 0;
}

function cusNormalizeCustomProgress(entries) {
  if (!Array.isArray(entries)) return [];
  return entries.map(function(entry, idx) {
    if (!entry || typeof entry !== 'object') return null;
    var label = (entry.label || '').trim();
    var target = +entry.target || 0;
    var actual = +entry.actual || 0;
    if (!label && !target && !actual) return null;
    return {
      id: entry.id || ('cp-' + idx),
      label: label || 'Mục tiêu ' + (idx + 1),
      actual: actual,
      target: target,
      unit: (entry.unit || '').trim(),
      color: (entry.color || '').trim()
    };
  }).filter(Boolean);
}

function cusReadRawMonthData(kh, monthKey) {
  var mk = cusDateToMonthKey(monthKey || cusCurrentMonthKey());
  return (kh.monthly && kh.monthly[mk]) || {};
}

function cusAggregateOrdersMonth(khMa, monthKey) {
  var result = {
    dsNhomC: 0,
    dsNhomDE: 0,
    dsSBPS: 0,
    dsGD1: 0,
    dsGD2: 0,
    dsGD3: 0,
    dsVipN1: 0,
    dsVipN2: 0,
    skuNhomD: 0,
    sbpsN1: 0,
    sbpsN2: 0,
    sbpsN3: 0,
    sbpsTo26: 0,
    orderCount: 0,
    lastOrderDate: ''
  };
  if (!khMa || typeof getOrders !== 'function') return result;
  var normalizedKhMa = String(khMa).trim().toUpperCase();
  var vipSkuSeen = {};
  getOrders().forEach(function(order) {
    if (!order || String(order.khMa || '').trim().toUpperCase() !== normalizedKhMa) return;
    if (cusDateToMonthKey(order.date || '') !== monthKey) return;
    result.orderCount += 1;
    if (!result.lastOrderDate || String(order.date || '') > result.lastOrderDate) result.lastOrderDate = order.date || '';
    var orderDay = cusGetOrderDay(order);
    var orderItems = Array.isArray(order.items) ? order.items : [];
    var subtotal = orderItems.reduce(function(sum, item) {
      return sum + (+item.afterKM || +item.gocTotal || 0);
    }, 0);
    var allocated = 0;
    orderItems.forEach(function(item, idx) {
      var base = +item.afterKM || +item.gocTotal || 0;
      var share = 0;
      if (subtotal > 0 && order.orderDisc > 0) {
        if (idx === orderItems.length - 1) share = (+order.orderDisc || 0) - allocated;
        else {
          share = Math.round((+order.orderDisc || 0) * base / subtotal);
          allocated += share;
        }
      }
      var net = Math.max(0, base - share);
      var product = cusResolveProductForOrderItem(item);
      var nhom = (product && product.nhom) || item.nhom || '';

      if (nhom === 'C') {
        result.dsNhomC += net;
        if (isVNMGiaiDoanProduct(product || item)) {
          if (orderDay >= 1 && orderDay <= 10) result.dsGD1 += net;
          else if (orderDay >= 11 && orderDay <= 20) result.dsGD2 += net;
          else if (orderDay >= 21 && orderDay <= 27) result.dsGD3 += net;
        }
      }

      if (nhom === 'D') {
        result.dsNhomDE += net;
        var vipClass = classifyVIPProduct(product || item);
        if (vipClass !== 'excluded') vipSkuSeen[cusGetProductCode(product || item) || String(item.ma || item.ten || idx)] = true;
        if (vipClass === 'N1') result.dsVipN1 += net;
        else if (vipClass === 'N2') result.dsVipN2 += net;
      }

      var sbpsClass = classifySBPSProduct(product || item);
      if (sbpsClass === 'N1' || sbpsClass === 'N2' || sbpsClass === 'N3') {
        result.dsSBPS += net;
        if (sbpsClass === 'N1') result.sbpsN1 += net;
        else if (sbpsClass === 'N2') result.sbpsN2 += net;
        else if (sbpsClass === 'N3') result.sbpsN3 += net;
        if (orderDay > 0 && orderDay <= 26) result.sbpsTo26 += net;
      }
    });
  });
  result.skuNhomD = Object.keys(vipSkuSeen).length;
  return result;
}

function cusGetMonthData(kh, monthKey) {
  var mk = cusDateToMonthKey(monthKey || cusCurrentMonthKey());
  var md = cusReadRawMonthData(kh, mk);
  var auto = cusAggregateOrdersMonth(kh.ma, mk);
  var merged = Object.assign({}, md);
  merged.dsNhomC = cusResolveMetricValue(md, 'dsNhomC', auto.dsNhomC);
  merged.dsNhomDE = cusResolveMetricValue(md, 'dsNhomDE', auto.dsNhomDE);
  merged.dsSBPS = cusResolveMetricValue(md, 'dsSBPS', auto.dsSBPS);
  merged.dsGD1 = cusResolveMetricValue(md, 'dsGD1', auto.dsGD1);
  merged.dsGD2 = cusResolveMetricValue(md, 'dsGD2', auto.dsGD2);
  merged.dsGD3 = cusResolveMetricValue(md, 'dsGD3', auto.dsGD3);
  merged.dsVipN1 = cusResolveMetricValue(md, 'dsVipN1', auto.dsVipN1);
  merged.dsVipN2 = cusResolveMetricValue(md, 'dsVipN2', auto.dsVipN2);
  merged.skuNhomD = cusResolveMetricValue(md, 'skuNhomD', auto.skuNhomD);
  merged.sbpsN1 = cusResolveMetricValue(md, 'sbpsN1', auto.sbpsN1);
  merged.sbpsN2 = cusResolveMetricValue(md, 'sbpsN2', auto.sbpsN2);
  merged.sbpsN3 = cusResolveMetricValue(md, 'sbpsN3', auto.sbpsN3);
  merged.sbpsTo26 = cusResolveMetricValue(md, 'sbpsTo26', auto.sbpsTo26);
  merged.customProgress = cusNormalizeCustomProgress(md.customProgress);
  merged._autoSales = auto;
  return merged;
}

function cusProgressValueText(value, unit) {
  return fmt(value) + (unit ? ' ' + unit : '');
}

function cusProgressRowsHTML(entries) {
  if (!entries.length) return '';
  var html = '<div style="background:#F6FAFF;border-radius:10px;padding:10px 12px;border:1px dashed #C9D7FF">';
  html += '<div style="font-size:11px;font-weight:800;color:var(--vm);margin-bottom:8px">Tiến độ khác</div>';
  entries.forEach(function(entry) {
    var pct = entry.target > 0 ? (entry.actual / entry.target * 100) : 0;
    html += cusProgressBarHTML(entry.label, pct, entry.actual, entry.target, entry.color || '#0F766E', entry.unit);
  });
  html += '</div>';
  return html;
}

function cusCustomProgressRowHTML(entry) {
  var item = entry || {};
  return '<div class="custom-progress-row">' +
    '<input type="text" class="custom-progress-input cp-label" placeholder="Tên mục tiêu, VD: Green Farm phân phối" value="' + (item.label || '') + '">' +
    '<input type="number" class="custom-progress-input cp-actual" placeholder="Thực hiện" value="' + (item.actual || '') + '" inputmode="numeric">' +
    '<input type="number" class="custom-progress-input cp-target" placeholder="Mục tiêu" value="' + (item.target || '') + '" inputmode="numeric">' +
    '<input type="text" class="custom-progress-input cp-unit" placeholder="Đơn vị" value="' + (item.unit || '') + '">' +
    '<button type="button" class="custom-progress-remove" onclick="cusRemoveProgressRow(this)">✕</button>' +
  '</div>';
}

function cusReadCustomProgressRows() {
  var rows = [];
  document.querySelectorAll('.custom-progress-row').forEach(function(row, idx) {
    var label = ((row.querySelector('.cp-label') || {}).value || '').trim();
    var actual = +(((row.querySelector('.cp-actual') || {}).value || '').trim()) || 0;
    var target = +(((row.querySelector('.cp-target') || {}).value || '').trim()) || 0;
    var unit = ((row.querySelector('.cp-unit') || {}).value || '').trim();
    if (!label && !actual && !target) return;
    rows.push({ id: 'cp-' + idx, label: label || ('Mục tiêu ' + (idx + 1)), actual: actual, target: target, unit: unit });
  });
  return rows;
}

function cusAddProgressRow(entry) {
  var list = document.getElementById('custom-progress-list');
  if (!list) return;
  var wrapper = document.createElement('div');
  wrapper.innerHTML = cusCustomProgressRowHTML(entry);
  list.appendChild(wrapper.firstChild);
  list.querySelectorAll('input').forEach(function(input) {
    input.oninput = function() { cusPreviewDS(_cusEditIdx); };
  });
  cusPreviewDS(_cusEditIdx);
}

function cusRemoveProgressRow(btn) {
  var row = btn && btn.closest('.custom-progress-row');
  if (!row) return;
  row.remove();
  cusPreviewDS(_cusEditIdx);
}

function cusReopenInputDS(idx, monthKey) {
  cusInputDS(idx, cusDateToMonthKey(monthKey));
}

function cusToggleExpand(idx) {
  var kh = CUS[idx];
  if (!kh || !kh.ma) return;
  _cusExpanded[kh.ma] = !_cusExpanded[kh.ma];
  renderCusTab();
}

// ============================================================
// UI — Tab Khách Hàng
// ============================================================
function renderCusTab() {
  var el = document.getElementById('kh-list'); if (!el) return;
  var viewMonthKey = _cusViewMonthKey || cusCurrentMonthKey();
  var filtered = CUS.filter(function(kh) {
    if (_cusFilterRoute && kh.tuyen !== _cusFilterRoute) return false;
    if (_cusFilterQuery) {
      var q = _cusFilterQuery.toLowerCase();
      return (kh.ma || '').toLowerCase().indexOf(q) >= 0 || (kh.ten || '').toLowerCase().indexOf(q) >= 0;
    }
    return true;
  });
  if (!CUS.length) { el.innerHTML = '<div class="empty">Chưa có khách hàng<br><small>Nhấn ＋ để thêm hoặc import từ GitHub</small></div>'; return; }
  if (!filtered.length) { el.innerHTML = '<div class="empty">Không tìm thấy KH theo bộ lọc</div>'; return; }

  var groups = {};
  filtered.forEach(function(kh) { var key = kh.tuyen || '_noRoute'; if (!groups[key]) groups[key] = []; groups[key].push(kh); });

  var html = '';
  var totalKH = CUS.length;
  var totalVNM = CUS.filter(function(k) { return k.programs && k.programs.vnmShop && k.programs.vnmShop.dangKy; }).length;
  var totalVIP = CUS.filter(function(k) { return k.programs && k.programs.vipShop && k.programs.vipShop.dangKy; }).length;
  var totalSBPS = CUS.filter(function(k) { return k.programs && k.programs.sbpsShop && k.programs.sbpsShop.dangKy; }).length;

  html += '<div class="kh-month-toolbar">';
  html += '<div><div class="kh-summary-kicker">Theo dõi tiến độ</div><div class="kh-month-title">' + cusMonthLabelFromKey(viewMonthKey) + '</div></div>';
  html += '<label class="kh-month-filter"><span>Tháng xem</span><input type="month" value="' + viewMonthKey + '" onchange="cusSetViewMonth(this.value)"></label>';
  html += '</div>';

  html += '<div class="kh-summary">';
  html += '<div class="kh-summary-kicker">Tổng quan khách hàng</div>';
  html += '<div class="kh-summary-grid">';
  html += '<div><div class="kh-summary-value">' + totalKH + '</div><div class="kh-summary-label">Tổng KH</div></div>';
  html += '<div><div class="kh-summary-value green">' + totalVNM + '</div><div class="kh-summary-label">VNM Shop</div></div>';
  html += '<div><div class="kh-summary-value blue">' + totalVIP + '</div><div class="kh-summary-label">VIP Shop</div></div>';
  html += '<div><div class="kh-summary-value gold">' + totalSBPS + '</div><div class="kh-summary-label">SBPS</div></div>';
  html += '</div></div>';

  var routeOrder = ROUTES.map(function(r) { return r.id; });
  routeOrder.push('_noRoute');
  routeOrder.forEach(function(routeId) {
    if (!groups[routeId] || !groups[routeId].length) return;
    var route = ROUTES.find(function(r) { return r.id === routeId; });
    var label = route ? route.ten : 'Chưa phân tuyến';
    var count = groups[routeId].length;
    html += '<div class="adm-section" style="margin-top:8px">';
    html += '<div class="adm-sec-hd kh-route-head"><span>📍 ' + label + ' (' + count + ' KH)</span></div>';
    groups[routeId].forEach(function(kh) {
      var idx = CUS.indexOf(kh);
      html += cusCardHTML(kh, idx, viewMonthKey);
    });
    html += '</div>';
  });
  el.innerHTML = html;
}

function cusCardHTML(kh, idx, monthKey) {
  monthKey = monthKey || _cusViewMonthKey || cusCurrentMonthKey();
  var md = cusGetMonthData(kh, monthKey);
  var reward = calcTotalReward(kh, md);
  var vnmCodes = cusGetProgramCodes(kh, 'vnmShop');
  var vipCodes = cusGetProgramCodes(kh, 'vipShop');
  var sbpsCodes = cusGetProgramCodes(kh, 'sbpsShop');
  var vnmProg = cusProgressVNM(kh, md);
  var vipProg = cusProgressVIP(kh, md);
  var hasData = md.dsNhomC || md.dsNhomDE || md.dsSBPS;
  var expanded = !!_cusExpanded[kh.ma];
  var progCount = 0;
  var summaryParts = [];

  if (kh.programs && kh.programs.vnmShop && kh.programs.vnmShop.dangKy) progCount += 1;
  if (kh.programs && kh.programs.vipShop && kh.programs.vipShop.dangKy) progCount += 1;
  if (kh.programs && kh.programs.sbpsShop && kh.programs.sbpsShop.dangKy) progCount += 1;
  if (progCount) summaryParts.push(progCount + ' CT');
  if (reward.totalReward > 0) summaryParts.push('Thưởng ' + fmt(reward.totalReward) + 'đ');
  if (!progCount) summaryParts.push('Chưa đăng ký CT');
  if (!reward.totalReward && hasData) summaryParts.push('Có DS tháng ' + cusMonthLabelFromKey(monthKey));

  var html = '<div class="customer-card-item' + (expanded ? ' expanded' : '') + '">';
  html += '<div class="customer-row-head">';
  html += '<div class="customer-row-title-wrap">';
  html += '<button type="button" class="customer-toggle-btn" onclick="cusToggleExpand(' + idx + ')" aria-label="' + (expanded ? 'Thu gọn khách hàng' : 'Mở rộng khách hàng') + '">';
  html += '<span class="customer-toggle-icon">' + (expanded ? '▾' : '▸') + '</span>';
  html += '</button>';
  html += '<div class="customer-row-title">';
  html += '<div style="font-size:15px;font-weight:800;color:var(--n1);line-height:1.2">' + (kh.ten || kh.ma) + '</div>';
  html += '<div style="font-size:11px;color:var(--n3);margin-top:2px">' + kh.ma + (kh.diachi ? ' · ' + kh.diachi : '') + ' · ' + cusMonthLabelFromKey(monthKey) + '</div>';
  html += '<div class="customer-collapsed-summary">' + summaryParts.join(' · ') + '</div>';
  html += '</div>';
  html += '</div>';
  html += '<div class="customer-actions">';
  html += '<button onclick="cusInputDS(' + idx + ', \'' + monthKey + '\')" class="customer-action-btn">📊 Nhập DS</button>';
  html += '<button onclick="cusEdit(' + idx + ')" class="customer-icon-btn">✏️</button>';
  html += '</div></div>';

  if (!expanded) {
    html += '</div>';
    return html;
  }

  html += '<div class="customer-card-body">';

  var equipParts = [];
  if (kh.coTuVNM) equipParts.push('🧊 Tủ VNM ' + (kh.loaiTu === '2canh' ? '2 cánh' : kh.loaiTu === '1canh' ? '1 cánh' : kh.loaiTu || ''));
  else if (kh.loaiTu) equipParts.push('🧊 Tủ KH');
  if (kh.coKe && kh.loaiKe) equipParts.push('📦 Kệ ' + kh.loaiKe);
  if (equipParts.length) html += '<div style="font-size:11px;color:var(--n2);margin-bottom:10px">' + equipParts.join(' · ') + '</div>';

  var hasCT = false;
  html += '<div style="display:flex;flex-direction:column;gap:8px;margin-bottom:8px">';

  if (kh.programs && kh.programs.vnmShop && kh.programs.vnmShop.dangKy) {
    hasCT = true;
    var vnmBB = kh.programs.vnmShop.mucBayBan || '';
    var vnmTL = kh.programs.vnmShop.mucTichLuy || '';
    var vnmBBInfo = VNM_SHOP_TRUNGBAY[vnmBB];
    var vnmTLInfo = VNM_SHOP_TICHLUY.find(function(t) { return t.muc === vnmTL; });
    html += '<div style="background:#EEF3FF;border-radius:10px;padding:10px 12px;border-left:3.5px solid #1A4DFF">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px">';
    html += '<span style="font-size:12.5px;font-weight:800;color:#1A4DFF">VNM Shop · Nhóm C</span>';
    if (vnmBBInfo) html += '<span style="font-size:10.5px;color:#1A4DFF;font-weight:600">TB: ' + fmt(vnmBBInfo.thuong) + 'đ</span>';
    html += '</div>';
    if (vnmCodes.length) html += '<div style="font-size:10.5px;color:#475569;margin-bottom:5px">Mã app: ' + esc(vnmCodes.join(', ')) + '</div>';
    html += '<div style="font-size:10.5px;color:var(--n2);margin-bottom:5px">';
    html += 'Bày bán: <b>' + vnmBB + '</b>';
    if (vnmBBInfo) html += ' (DS≥' + fmt(vnmBBInfo.dsMin) + ')';
    html += ' · Tích lũy: <b>Mức ' + vnmTL + '</b>';
    if (vnmTLInfo) html += ' (CK ' + vnmTLInfo.ckDS + '%)';
    html += '</div>';
    if (vnmProg) html += cusProgressBarHTML('Tiến độ DS', vnmProg.pct, vnmProg.ds, vnmProg.target, '#1A4DFF');
    if (reward.vnm && reward.vnm.total > 0) html += '<div style="font-size:11.5px;font-weight:700;color:#1A4DFF;margin-top:3px">→ Thưởng: ' + fmt(reward.vnm.total) + 'đ</div>';
    html += '</div>';
  }

  if (kh.programs && kh.programs.vipShop && kh.programs.vipShop.dangKy) {
    hasCT = true;
    var vipBB = kh.programs.vipShop.mucBayBan || '';
    var vipTL = kh.programs.vipShop.mucTichLuy || '';
    var vipBBInfo = VIP_SHOP_TRUNGBAY[vipBB];
    var vipTLInfo = VIP_SHOP_TICHLUY.find(function(t) { return t.muc === vipTL; });
    html += '<div style="background:#EFF6FF;border-radius:10px;padding:10px 12px;border-left:3.5px solid #2563EB">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px">';
    html += '<span style="font-size:12.5px;font-weight:800;color:#2563EB">VIP Shop · Nhóm DE</span>';
    if (vipBBInfo) html += '<span style="font-size:10.5px;color:#2563EB;font-weight:600">TB: ' + fmt(kh.coTuVNM ? vipBBInfo.thuongVNM : vipBBInfo.thuongKH) + 'đ</span>';
    html += '</div>';
    if (vipCodes.length) html += '<div style="font-size:10.5px;color:#475569;margin-bottom:5px">Mã app: ' + esc(vipCodes.join(', ')) + '</div>';
    html += '<div style="font-size:10.5px;color:var(--n2);margin-bottom:5px">';
    html += 'Tủ: <b>' + vipBB + '</b>';
    if (vipBBInfo) html += ' (DS≥' + fmt(vipBBInfo.dsMin) + ', ≥' + vipBBInfo.skuMin + ' SKU)';
    html += ' · CL: <b>' + vipTL + '</b>';
    if (vipTLInfo) html += ' (N1 ' + vipTLInfo.ckN1 + '% / N2 ' + vipTLInfo.ckN2 + '%)';
    html += '</div>';
    if (vipProg) html += cusProgressBarHTML('Tiến độ DS', vipProg.pct, vipProg.ds, vipProg.target, '#2563EB');
    if (reward.vip && reward.vip.total > 0) html += '<div style="font-size:11.5px;font-weight:700;color:#2563EB;margin-top:3px">→ Thưởng: ' + fmt(reward.vip.total) + 'đ</div>';
    html += '</div>';
  }

  if (kh.programs && kh.programs.sbpsShop && kh.programs.sbpsShop.dangKy) {
    hasCT = true;
    var sbpsMuc = kh.programs.sbpsShop.muc || '';
    var sbpsMucTB = kh.programs.sbpsShop.mucTrungBay || '';
    var sbpsInfo = SBPS_TICHLUY.find(function(t) { return t.muc === sbpsMuc; });
    var sbpsTBInfo = SBPS_TRUNGBAY[sbpsMucTB];
    html += '<div style="background:#FFFBEB;border-radius:10px;padding:10px 12px;border-left:3.5px solid #D97706">';
    html += '<div style="font-size:12.5px;font-weight:800;color:#D97706;margin-bottom:5px">SBPS · Sữa bột pha sẵn TE</div>';
    if (sbpsCodes.length) html += '<div style="font-size:10.5px;color:#475569;margin-bottom:5px">Mã app: ' + esc(sbpsCodes.join(', ')) + '</div>';
    html += '<div style="font-size:10.5px;color:var(--n2);margin-bottom:4px">';
    if (sbpsMucTB) html += 'Trưng bày: <b>' + sbpsMucTB + '</b>' + (sbpsTBInfo ? ' (DS≥' + fmt(sbpsTBInfo.dsMin) + ')' : '') + ' · ';
    html += 'Tích lũy: <b>Mức ' + sbpsMuc + '</b>';
    if (sbpsInfo) html += ' (DS≥' + fmt(sbpsInfo.dsMin) + ')';
    html += '</div>';
    if (reward.sbps && reward.sbps.total > 0) html += '<div style="font-size:11.5px;font-weight:700;color:#D97706;margin-top:3px">→ Thưởng: ' + fmt(reward.sbps.total) + 'đ</div>';
    html += '</div>';
  }

  if (!hasCT) html += '<div style="font-size:11px;color:var(--n3);font-style:italic">Chưa đăng ký CT nào. Nhấn ✏️ để setup.</div>';
  if (md.customProgress && md.customProgress.length) html += cusProgressRowsHTML(md.customProgress);
  html += '</div>';

  if (reward.totalReward > 0) {
    html += '<div style="display:flex;justify-content:space-between;align-items:center;background:linear-gradient(135deg,#1A4DFF,#3A73FF);color:#fff;border-radius:10px;padding:10px 14px;margin-top:8px;box-shadow:0 2px 8px rgba(26,77,255,.18)">';
    html += '<div><div style="font-size:10.5px;opacity:.7">Tổng thưởng ' + cusMonthLabelFromKey(monthKey) + '</div>';
    if (reward.dsTotal > 0) html += '<div style="font-size:9px;opacity:.55">Giảm thêm ' + (reward.totalReward / reward.dsTotal * 100).toFixed(1) + '%</div>';
    html += '</div>';
    html += '<div style="font-size:22px;font-weight:900">' + fmt(reward.totalReward) + 'đ</div>';
    html += '</div>';
  } else if (hasData) {
    html += '<div style="font-size:10.5px;color:var(--r);margin-top:5px">⚠️ Chưa đạt mức thưởng.</div>';
  }

  var oldKH = (typeof customers !== 'undefined') ? customers.find(function(k) { return k.ma === kh.ma; }) : null;
  if (oldKH && oldKH.orders && oldKH.orders.length) {
    var lo = oldKH.orders[0];
    html += '<div style="font-size:10.5px;color:var(--n3);margin-top:8px;padding-top:8px;border-top:1px dashed var(--n5)">🛒 Đơn gần nhất: ' + lo.ngay + ' · ' + fmt(lo.tong) + 'đ · ' + lo.items.length + ' SP</div>';
  }
  html += '</div>';
  html += '</div>';
  return html;
}

function cusProgressBarHTML(label, pct, current, target, color, unit) {
  var pctClamped = Math.min(pct, 100);
  var pctDisplay = Math.round(pct);
  var barColor = pct >= 100 ? '#16a34a' : (pct >= 70 ? '#ca8a04' : color);
  var html = '<div style="margin-bottom:6px">';
  html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">';
  html += '<span style="font-size:10.5px;font-weight:700;color:var(--n2)">' + label + '</span>';
  html += '<span style="font-size:10.5px;font-weight:700;color:' + barColor + '">' + cusProgressValueText(current, unit) + '/' + cusProgressValueText(target, unit) + ' (' + pctDisplay + '%)</span>';
  html += '</div>';
  html += '<div style="height:6px;background:var(--n6);border-radius:3px;overflow:hidden">';
  html += '<div style="height:100%;width:' + pctClamped + '%;background:' + barColor + ';border-radius:3px;transition:width .3s"></div>';
  html += '</div></div>';
  return html;
}

function cusProgressVNM(kh, md) {
  if (!kh.programs || !kh.programs.vnmShop || !kh.programs.vnmShop.dangKy) return null;
  var dsMin = kh.programs.vnmShop.dsMin || 0;
  if (!dsMin) { var muc = kh.programs.vnmShop.mucTichLuy; var tl = VNM_SHOP_TICHLUY.find(function(t) { return t.muc === muc; }); if (tl) dsMin = tl.dsMin; }
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
function cusCurrentMonthKey() { return cusDateToMonthKey(''); }
function cusCurrentMonthLabel() { return cusMonthLabelFromKey(cusCurrentMonthKey()); }

function cusSetViewMonth(monthKey) {
  _cusViewMonthKey = cusDateToMonthKey(monthKey || cusCurrentMonthKey());
  renderCusTab();
}

// ============================================================
// NHẬP DOANH SỐ + THÊM/SỬA/XÓA KH + EXPORT/IMPORT + TUYẾN
// ============================================================
function cusInputDS(idx, monthKey) {
  var kh = CUS[idx]; if (!kh) return;
  _cusEditIdx = idx;
  _cusInputMonthKey = cusDateToMonthKey(monthKey || cusCurrentMonthKey());
  var mk = _cusInputMonthKey;
  var rawMd = cusReadRawMonthData(kh, mk);
  var md = cusGetMonthData(kh, mk);
  var auto = md._autoSales || { dsNhomC: 0, dsNhomDE: 0, dsSBPS: 0, orderCount: 0 };
  var modal = document.getElementById('km-modal');
  document.getElementById('km-modal-t').textContent = '📊 Tiến độ tháng ' + cusMonthLabelFromKey(mk) + ' — ' + (kh.ten || kh.ma);
  modal.style.display = 'block';
  var body = document.getElementById('km-modal-body');
  var html = '';
  html += '<div class="kf"><div class="kfl">THÁNG THEO DÕI</div><input type="month" id="cds-month" value="' + mk + '" onchange="cusReopenInputDS(' + idx + ', this.value)" style="width:100%;height:40px;border:1.5px solid var(--n5);border-radius:var(--Rs);padding:0 12px;font-size:15px;color:var(--n1)"></div>';
  if (kh.programs && kh.programs.vnmShop && kh.programs.vnmShop.dangKy) {
    html += '<div class="kf"><div class="kfl" style="color:#1A4DFF">📦 NHÓM C (VNM Shop)</div>';
    html += cusInputField('cds-c', 'DS nhóm C tháng', cusEditableMetricValue(rawMd, 'dsNhomC'), auto.dsNhomC);
    html += cusInputField('cds-gd1', 'DS GĐ1 (1-10)', cusEditableMetricValue(rawMd, 'dsGD1'), auto.dsGD1);
    html += cusInputField('cds-gd2', 'DS GĐ2 (11-20)', cusEditableMetricValue(rawMd, 'dsGD2'), auto.dsGD2);
    html += cusInputField('cds-gd3', 'DS GĐ3 (21-27)', cusEditableMetricValue(rawMd, 'dsGD3'), auto.dsGD3);
    html += '<label style="font-size:12px;display:flex;align-items:center;gap:6px;margin-top:8px"><input type="checkbox" id="cds-trungbay-vnm" ' + (md.vnmShopTrungBay ? 'checked' : '') + ' style="width:20px;height:20px;accent-color:#1A4DFF"> Đạt trưng bày VNM Shop</label></div>';
  }
  if (kh.programs && kh.programs.vipShop && kh.programs.vipShop.dangKy) {
    html += '<div class="kf"><div class="kfl" style="color:#2563EB">🧊 NHÓM DE (VIP Shop)</div>';
    html += cusInputField('cds-de', 'DS nhóm DE tháng', cusEditableMetricValue(rawMd, 'dsNhomDE'), auto.dsNhomDE);
    html += cusInputField('cds-vn1', 'DS SP Chủ lực (N1)', cusEditableMetricValue(rawMd, 'dsVipN1'), auto.dsVipN1);
    html += cusInputField('cds-vn2', 'DS SP Tập trung (N2)', cusEditableMetricValue(rawMd, 'dsVipN2'), auto.dsVipN2);
    html += cusInputField('cds-skud', 'Số SKU nhóm D', cusEditableMetricValue(rawMd, 'skuNhomD'), auto.skuNhomD);
    html += '<label style="font-size:12px;display:flex;align-items:center;gap:6px;margin-top:8px"><input type="checkbox" id="cds-trungbay-vip" ' + (md.vipShopTrungBay ? 'checked' : '') + ' style="width:20px;height:20px;accent-color:#2563EB"> Đạt trưng bày VIP Shop</label></div>';
  }
  if (kh.programs && kh.programs.sbpsShop && kh.programs.sbpsShop.dangKy) {
    html += '<div class="kf"><div class="kfl" style="color:#D97706">🍼 SBPS TE</div>';
    html += cusInputField('cds-sbps', 'DS SBPS tháng', cusEditableMetricValue(rawMd, 'dsSBPS'), auto.dsSBPS);
    html += cusInputField('cds-sbps-n1', 'DS SBPS N1 (DG/GP/A2)', cusEditableMetricValue(rawMd, 'sbpsN1'), auto.sbpsN1);
    html += cusInputField('cds-sbps-n2', 'DS SBPS N2 (OG/DGP)', cusEditableMetricValue(rawMd, 'sbpsN2'), auto.sbpsN2);
    html += cusInputField('cds-sbps-n3', 'DS SBPS N3 (Yoko/OC)', cusEditableMetricValue(rawMd, 'sbpsN3'), auto.sbpsN3);
    html += cusInputField('cds-sbps-26', 'DS đến ngày 26', cusEditableMetricValue(rawMd, 'sbpsTo26'), auto.sbpsTo26);
    if (kh.programs.sbpsShop.mucTrungBay) html += '<label style="font-size:12px;display:flex;align-items:center;gap:6px;margin-top:8px"><input type="checkbox" id="cds-trungbay-sbps" ' + (md.sbpsTrungBay ? 'checked' : '') + ' style="width:20px;height:20px;accent-color:#D97706"> Đạt trưng bày SBPS (' + kh.programs.sbpsShop.mucTrungBay + ')</label>';
    html += '</div>';
  }
  html += '<div class="kf"><div class="kfl" style="color:#0F766E">🎯 TIẾN ĐỘ TÙY CHỈNH</div><div style="font-size:11px;color:var(--n3);margin-bottom:8px">Để trống doanh số tự lấy theo đơn hàng của cửa hàng trong tháng này.</div><div id="custom-progress-list"></div><button type="button" class="btn-atr" onclick="cusAddProgressRow()">+ Thêm mục tiêu tiến độ</button></div>';
  html += '<div id="cds-preview" style="margin-top:12px"></div>';
  html += '<button class="btn-km-save" onclick="cusSaveDS(' + idx + ')">💾 Lưu doanh số</button>';
  body.innerHTML = html;
  (md.customProgress || []).forEach(function(entry) { cusAddProgressRow(entry); });
  body.querySelectorAll('input').forEach(function(inp) { inp.addEventListener('input', function() { cusPreviewDS(idx); }); });
  cusPreviewDS(idx);
}

function cusInputField(id, label, value, autoValue) {
  var placeholder = (autoValue || autoValue === 0) ? ('Tự lấy từ đơn: ' + fmt(autoValue)) : '0';
  return '<div style="margin-bottom:8px"><div style="font-size:10.5px;color:var(--n3);margin-bottom:3px">' + label + '</div><input type="number" id="' + id + '" value="' + (value || '') + '" placeholder="' + placeholder + '" inputmode="numeric" style="width:100%;height:40px;border:1.5px solid var(--n5);border-radius:var(--Rs);padding:0 12px;font-size:16px;font-weight:700;color:var(--n1)"></div>';
}
function cusReadDS() {
  var gn = function(id) {
    var raw = ((document.getElementById(id) || {}).value || '').trim();
    if (raw === '') return null;
    return parseInt(raw, 10) || 0;
  };
  var g = function(id) { return parseInt((document.getElementById(id) || {}).value) || 0; };
  var c = function(id) { return (document.getElementById(id) || {}).checked || false; };
  return {
    manualDsNhomC: gn('cds-c'),
    dsGD1: gn('cds-gd1'),
    dsGD2: gn('cds-gd2'),
    dsGD3: gn('cds-gd3'),
    vnmShopTrungBay: c('cds-trungbay-vnm'),
    manualDsNhomDE: gn('cds-de'),
    dsVipN1: gn('cds-vn1'),
    dsVipN2: gn('cds-vn2'),
    skuNhomD: gn('cds-skud'),
    vipShopTrungBay: c('cds-trungbay-vip'),
    manualDsSBPS: gn('cds-sbps'),
    sbpsN1: gn('cds-sbps-n1'),
    sbpsN2: gn('cds-sbps-n2'),
    sbpsN3: gn('cds-sbps-n3'),
    sbpsTo26: gn('cds-sbps-26'),
    customProgress: cusReadCustomProgressRows()
  };
}
function cusPreviewDS(idx) {
  var kh = CUS[idx]; if (!kh) return;
  var mk = _cusInputMonthKey || cusCurrentMonthKey();
  var raw = cusReadDS();
  var currentRaw = cusReadRawMonthData(kh, mk);
  var previewRaw = Object.assign({}, currentRaw, raw);
  var md = cusGetMonthData({ ma: kh.ma, monthly: (function() { var temp = {}; temp[mk] = previewRaw; return temp; })() }, mk);
  var reward = calcTotalReward(kh, md);
  var el = document.getElementById('cds-preview'); if (!el) return;
  var html = '<div style="background:var(--vmL);border:1px solid #C9D7FF;border-radius:var(--Rs);padding:12px 14px">';
  html += '<div style="font-size:12px;font-weight:700;color:var(--vm);margin-bottom:8px">🔍 Dự tính thưởng</div>';
  if (reward.vnm && reward.vnm.total > 0) { html += '<div style="font-size:11px;color:var(--n2);margin-bottom:4px"><b style="color:#1A4DFF">VNM Shop:</b> ' + fmt(reward.vnm.total) + 'đ</div><div style="font-size:9.5px;color:var(--n3);margin-bottom:6px">' + reward.vnm.details.join(' · ') + '</div>'; }
  if (reward.vip && reward.vip.total > 0) { html += '<div style="font-size:11px;color:var(--n2);margin-bottom:4px"><b style="color:#2563EB">VIP Shop:</b> ' + fmt(reward.vip.total) + 'đ</div><div style="font-size:9.5px;color:var(--n3);margin-bottom:6px">' + reward.vip.details.join(' · ') + '</div>'; }
  if (reward.sbps && reward.sbps.total > 0) { html += '<div style="font-size:11px;color:var(--n2);margin-bottom:4px"><b style="color:#D97706">SBPS:</b> ' + fmt(reward.sbps.total) + 'đ</div><div style="font-size:9.5px;color:var(--n3);margin-bottom:6px">' + reward.sbps.details.join(' · ') + '</div>'; }
  if (md.customProgress && md.customProgress.length) html += cusProgressRowsHTML(md.customProgress);
  html += '<div style="border-top:1px solid #C9D7FF;padding-top:8px;margin-top:4px;display:flex;justify-content:space-between"><span style="font-size:14px;font-weight:800;color:var(--vm)">TỔNG THƯỞNG</span><span style="font-size:18px;font-weight:900;color:var(--vm)">' + fmt(reward.totalReward) + 'đ</span></div>';
  if (reward.dsTotal > 0 && reward.totalReward > 0) { html += '<div style="font-size:10.5px;color:var(--b);margin-top:5px">≈ Giảm thêm ' + (reward.totalReward / reward.dsTotal * 100).toFixed(1) + '% trên DS ' + fmt(reward.dsTotal) + 'đ</div>'; }
  html += '</div>';
  el.innerHTML = html;
}
function cusSaveDS(idx) {
  var kh = CUS[idx]; if (!kh) return;
  var mk = _cusInputMonthKey || cusCurrentMonthKey();
  if (!kh.monthly) kh.monthly = {};
  kh.monthly[mk] = Object.assign({}, kh.monthly[mk] || {}, cusReadDS());
  // Cập nhật sbpsTrungBay từ checkbox
  var cbSBPS = document.getElementById('cds-trungbay-sbps');
  if (cbSBPS) kh.monthly[mk].sbpsTrungBay = cbSBPS.checked;
  if (window.markEntityUpdated) markEntityUpdated(kh);
  cusSave();
  if (window.syncAutoPushFile) syncAutoPushFile('customers.json');
  document.getElementById('km-modal').style.display = 'none';
  renderCusTab();
  if (window.renderHomeDashboard) renderHomeDashboard();
  showToast('✅ Đã lưu tiến độ tháng ' + cusMonthLabelFromKey(mk) + ' cho ' + (kh.ten || kh.ma));
}

function cusEdit(idx) {
  _cusEditIdx = idx;
  var kh = CUS[idx] || {};
  var modal = document.getElementById('km-modal');
  document.getElementById('km-modal-t').textContent = idx >= 0 && CUS[idx] ? 'Sửa KH: ' + (kh.ten || kh.ma) : 'Thêm khách hàng';
  modal.style.display = 'block';
  var prog = kh.programs || {}; var vnm = prog.vnmShop || {}; var vip = prog.vipShop || {}; var sbps = prog.sbpsShop || {};
  var body = document.getElementById('km-modal-body');
  var html = '';
  html += '<div class="kf"><div class="kfl">THÔNG TIN CƠ BẢN</div>';
  html += cusFormField('ckh-ma', 'Mã KH', kh.ma || '', idx >= 0 && CUS[idx]);
  html += cusFormField('ckh-ten', 'Tên cửa hàng', kh.ten || '');
  html += cusFormField('ckh-diachi', 'Địa chỉ', kh.diachi || '');
  html += cusFormField('ckh-sdt', 'SĐT', kh.sdt || '');
  html += '<div style="margin-bottom:8px"><div style="font-size:10.5px;color:var(--n3);margin-bottom:3px">Tuyến bán hàng</div><select id="ckh-tuyen" style="width:100%;height:40px;border:1.5px solid var(--n5);border-radius:var(--Rs);padding:0 12px;font-size:14px"><option value="">— Chưa phân tuyến —</option>';
  ROUTES.forEach(function(r) { html += '<option value="' + r.id + '"' + (kh.tuyen === r.id ? ' selected' : '') + '>' + r.ten + '</option>'; });
  html += '</select></div>';
  html += '<div style="margin-bottom:8px"><div style="font-size:10.5px;color:var(--n3);margin-bottom:3px">Loại cửa hàng</div><select id="ckh-loai" style="width:100%;height:40px;border:1.5px solid var(--n5);border-radius:var(--Rs);padding:0 12px;font-size:14px">';
  ['tapHoa', 'shopSua', 'sieuThiMini', 'daiLy'].forEach(function(v) { var labels = { tapHoa: 'Tạp hóa', shopSua: 'Shop sữa', sieuThiMini: 'Siêu thị mini', daiLy: 'Đại lý' }; html += '<option value="' + v + '"' + (kh.loaiCH === v ? ' selected' : '') + '>' + labels[v] + '</option>'; });
  html += '</select></div></div>';
  html += '<div class="kf"><div class="kfl">THIẾT BỊ BÁN HÀNG</div>';
  html += '<label style="font-size:12px;display:flex;align-items:center;gap:6px;margin-bottom:8px"><input type="checkbox" id="ckh-tu" ' + (kh.coTuVNM ? 'checked' : '') + ' style="width:20px;height:20px;accent-color:var(--vm)"> Có tủ mát VNM</label>';
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><div><div style="font-size:10px;color:var(--n3)">Loại tủ</div><select id="ckh-loaitu" style="width:100%;height:38px;border:1.5px solid var(--n5);border-radius:var(--Rs);padding:0 8px;font-size:13px"><option value="">Không</option><option value="1canh"' + (kh.loaiTu === '1canh' ? ' selected' : '') + '>1 cánh</option><option value="2canh"' + (kh.loaiTu === '2canh' ? ' selected' : '') + '>2 cánh</option><option value="honhop"' + (kh.loaiTu === 'honhop' ? ' selected' : '') + '>Hỗn hợp</option></select></div>';
  html += '<div><div style="font-size:10px;color:var(--n3)">Dung tích (L)</div><input type="number" id="ckh-dungtich" value="' + (kh.dungTichTu || '') + '" style="width:100%;height:38px;border:1.5px solid var(--n5);border-radius:var(--Rs);padding:0 8px;font-size:13px"></div></div>';
  html += '<label style="font-size:12px;display:flex;align-items:center;gap:6px;margin-top:10px;margin-bottom:8px"><input type="checkbox" id="ckh-ke" ' + (kh.coKe ? 'checked' : '') + ' style="width:20px;height:20px;accent-color:var(--vm)"> Có kệ VNM</label>';
  html += '<select id="ckh-loaike" style="width:100%;height:38px;border:1.5px solid var(--n5);border-radius:var(--Rs);padding:0 8px;font-size:13px"><option value="">Không</option>';
  Object.keys(VNM_SHOP_TRUNGBAY).forEach(function(m) { html += '<option value="' + m + '"' + (kh.loaiKe === m ? ' selected' : '') + '>' + m + ' — ' + VNM_SHOP_TRUNGBAY[m].ten + '</option>'; });
  html += '</select></div>';
  html += '<div class="kf"><div class="kfl" style="color:#1A4DFF">📋 CHƯƠNG TRÌNH THAM GIA</div>';
  html += '<div style="font-size:11px;color:var(--n3);margin-bottom:10px">Nhìn vào app Vinamilk → nhập đúng Mã CT và Mức như trên app. Hệ thống tự tính thưởng.</div>';
  html += '<div style="font-size:10.5px;color:var(--n2);display:grid;grid-template-columns:1fr 1fr 60px 32px;gap:6px;margin-bottom:4px;font-weight:700">';
  html += '<span>Mã CT (app)</span><span>Mức</span><span style="text-align:center">Ngày ĐK</span><span></span></div>';
  html += '<div id="appc-list"></div>';
  html += '<button type="button" onclick="cusAddAppCodeRow()" style="width:100%;height:38px;background:var(--n6);border:1.5px dashed var(--n4);border-radius:var(--Rs);font-size:13px;font-weight:600;color:var(--vm);cursor:pointer;margin-top:4px">+ Thêm mã CT từ app</button></div>';
  html += '<div class="kf"><div class="kfl">GHI CHÚ</div><textarea id="ckh-ghichu" placeholder="Ghi chú về KH..." style="width:100%;height:60px;border:1.5px solid var(--n5);border-radius:var(--Rs);padding:10px 12px;font-size:13px;color:var(--n1);resize:vertical">' + (kh.ghiChu || '') + '</textarea></div>';
  html += '<button class="btn-km-save" onclick="cusSaveForm()">' + (idx >= 0 && CUS[idx] ? '💾 Cập nhật KH' : '✓ Thêm KH') + '</button>';
  if (idx >= 0 && CUS[idx]) html += '<button onclick="cusDel(' + idx + ')" style="width:100%;height:42px;background:none;color:var(--r);border:1.5px solid var(--r);border-radius:var(--R);font-size:13px;font-weight:600;cursor:pointer;margin-top:8px">✕ Xóa khách hàng</button>';
  body.innerHTML = html;
  // Khởi tạo các dòng mã CT đã đăng ký (tương thích KH cũ)
  var existingCodes = cusProgamsToAppCodes(kh);
  existingCodes.forEach(function(ac) { cusAddAppCodeRow(ac); });
}
function cusFormField(id, label, value, readonly) {
  return '<div style="margin-bottom:8px"><div style="font-size:10.5px;color:var(--n3);margin-bottom:3px">' + label + '</div><input type="text" id="' + id + '" value="' + (value || '') + '"' + (readonly ? ' readonly' : '') + ' style="width:100%;height:40px;border:1.5px solid var(--n5);border-radius:var(--Rs);padding:0 12px;font-size:15px;color:var(--n1);' + (readonly ? 'background:var(--n6);color:var(--n3);' : '') + '"></div>';
}
function cusSaveForm() {
  var g = function(id) { return (document.getElementById(id) || {}).value || ''; };
  var c = function(id) { return (document.getElementById(id) || {}).checked || false; };
  var n = function(id) { return parseInt(g(id)) || 0; };
  var ma = g('ckh-ma').trim().toUpperCase();
  if (!ma) { showToast('Nhập mã KH'); return; }
  var _appCodes = cusReadAppCodes();
  var kh = { ma: ma, ten: g('ckh-ten'), tuyen: g('ckh-tuyen'), diachi: g('ckh-diachi'), sdt: g('ckh-sdt'), loaiCH: g('ckh-loai'), coTuVNM: c('ckh-tu'), loaiTu: g('ckh-loaitu'), dungTichTu: n('ckh-dungtich'), coKe: c('ckh-ke'), loaiKe: g('ckh-loaike'), ghiChu: g('ckh-ghichu'),
    appCodes: _appCodes, programs: cusAppCodesToPrograms(_appCodes), monthly: {} };
  if (window.markEntityUpdated) markEntityUpdated(kh);
  if (_cusEditIdx >= 0 && CUS[_cusEditIdx]) { kh.monthly = CUS[_cusEditIdx].monthly || {}; CUS[_cusEditIdx] = kh; }
  else { if (CUS.find(function(k) { return k.ma === ma; })) { showToast('Mã KH đã tồn tại!'); return; } CUS.push(kh); }
  cusSave(); if (window.syncAutoPushFile) syncAutoPushFile('customers.json'); document.getElementById('km-modal').style.display = 'none'; renderCusTab();
  showToast('✅ Đã lưu: ' + (kh.ten || kh.ma));
}
function cusDel(idx) {
  var kh = CUS[idx]; if (!kh) return;
  CUS.splice(idx, 1); cusSave(); if (window.syncAutoPushFile) syncAutoPushFile('customers.json'); document.getElementById('km-modal').style.display = 'none'; renderCusTab();
}
function cusExport() {
  var data = { customers: CUS, routes: ROUTES };
  var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  var url = URL.createObjectURL(blob); var a = document.createElement('a'); a.href = url;
  a.download = 'vnm_customers_' + new Date().toISOString().slice(0, 10) + '.json'; a.click(); URL.revokeObjectURL(url);
  showToast('✅ Đã xuất ' + CUS.length + ' KH + ' + ROUTES.length + ' tuyến');
}
function cusImport() {
  var input = document.createElement('input'); input.type = 'file'; input.accept = 'application/json';
  input.onchange = function(e) {
    var file = e.target.files[0]; if (!file) return;
    var reader = new FileReader();
    reader.onload = function(ev) {
      try {
        var data = JSON.parse(ev.target.result);
        var replace = true; // auto thay thế
        if (data.customers) { var newCus = data.customers.filter(function(k) { return k && k.ma; }); if (replace) CUS = newCus; else { newCus.forEach(function(k) { var ex = CUS.find(function(c) { return c.ma === k.ma; }); if (ex) Object.assign(ex, k); else CUS.push(k); }); } cusSave(); if (window.syncAutoPushFile) syncAutoPushFile('customers.json'); }
        if (data.routes) { ROUTES = data.routes; routesSave(); if (window.syncAutoPushFile) syncAutoPushFile('routes.json'); }
        renderCusTab(); showToast('✅ Đã nhập ' + (data.customers ? data.customers.length : 0) + ' KH');
      } catch(e) { showToast('Lỗi: ' + e.message); }
    }; reader.readAsText(file);
  }; input.click();
}
function cusManageRoutes() {
  var modal = document.getElementById('km-modal');
  document.getElementById('km-modal-t').textContent = '📍 Quản lý tuyến bán hàng';
  modal.style.display = 'block';
  var body = document.getElementById('km-modal-body');
  var html = '<div id="routes-list">';
  ROUTES.forEach(function(r, i) { html += '<div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;padding:10px;background:var(--n6);border-radius:var(--Rs)"><div style="flex:1"><div style="font-size:13px;font-weight:700">' + r.ten + '</div><div style="font-size:10.5px;color:var(--n3)">' + r.id + (r.mota ? ' · ' + r.mota : '') + '</div></div><button onclick="cusDelRoute(' + i + ')" style="border:none;background:none;color:var(--r);font-size:14px;cursor:pointer;padding:4px">✕</button></div>'; });
  html += '</div>';
  html += '<div style="display:flex;gap:8px;margin-top:12px"><input type="text" id="new-route-id" placeholder="Mã tuyến" style="width:80px;height:40px;border:1.5px solid var(--n5);border-radius:var(--Rs);padding:0 8px;font-size:14px"><input type="text" id="new-route-ten" placeholder="Tên tuyến" style="flex:1;height:40px;border:1.5px solid var(--n5);border-radius:var(--Rs);padding:0 10px;font-size:14px"><button onclick="cusAddRoute()" style="height:40px;padding:0 14px;background:var(--vm);color:#fff;border:none;border-radius:var(--Rs);font-size:14px;font-weight:700;cursor:pointer">+</button></div>';
  body.innerHTML = html;
}
function cusAddRoute() {
  var id = (document.getElementById('new-route-id') || {}).value.trim();
  var ten = (document.getElementById('new-route-ten') || {}).value.trim();
  if (!id || !ten) { showToast('Nhập mã và tên tuyến'); return; }
  if (ROUTES.find(function(r) { return r.id === id; })) { showToast('Mã tuyến đã tồn tại'); return; }
  var route = { id: id, ten: ten, mota: '' };
  if (window.markEntityUpdated) markEntityUpdated(route);
  ROUTES.push(route); routesSave(); if (window.syncAutoPushFile) syncAutoPushFile('routes.json'); cusManageRoutes(); renderCusTab();
}
function cusDelRoute(i) { ROUTES.splice(i, 1); routesSave(); if (window.syncAutoPushFile) syncAutoPushFile('routes.json'); cusManageRoutes(); renderCusTab(); }
function cusFilterRoute(routeId) { _cusFilterRoute = routeId; renderCusTab(); }
function cusFilterSearch(q) { _cusFilterQuery = (q || '').trim(); renderCusTab(); }

// ============================================================
// EXPORTS
// ============================================================
window.cusAddAppCodeRow = cusAddAppCodeRow;
window.cusRemoveAppCodeRow = cusRemoveAppCodeRow;
window.cusAppCodeChangeMa = cusAppCodeChangeMa;
window.ctConfigLoad = ctConfigLoad;
window.openCTSettings = openCTSettings;
window.ctSetGroup = ctSetGroup;
window.ctSetType = ctSetType;
window.ctSaveSettings = ctSaveSettings;
window.ctResetSettings = ctResetSettings;
window.cusLoad = cusLoad;
window.cusSave = cusSave;
window.renderCusTab = renderCusTab;
window.cusToggleExpand = cusToggleExpand;
window.cusEdit = cusEdit;
window.cusInputDS = cusInputDS;
window.cusSaveDS = cusSaveDS;
window.cusSaveForm = cusSaveForm;
window.cusDel = cusDel;
window.cusExport = cusExport;
window.cusImport = cusImport;
window.cusManageRoutes = cusManageRoutes;
window.cusAddRoute = cusAddRoute;
window.cusDelRoute = cusDelRoute;
window.cusFilterRoute = cusFilterRoute;
window.cusFilterSearch = cusFilterSearch;
window.cusSetViewMonth = cusSetViewMonth;
window.cusAddProgressRow = cusAddProgressRow;
window.cusRemoveProgressRow = cusRemoveProgressRow;
window.cusReopenInputDS = cusReopenInputDS;
window.cusGetMonthData = cusGetMonthData;
window.cusMonthLabelFromKey = cusMonthLabelFromKey;
window.calcVNMShopReward = calcVNMShopReward;
window.calcVIPShopReward = calcVIPShopReward;
window.calcSBPSReward = calcSBPSReward;
window.calcTotalReward = calcTotalReward;
