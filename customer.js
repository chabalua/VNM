// ============================================================
// CUSTOMER MODULE v1 — Quản lý KH + KPI + Thưởng CT
// Dựa trên 3 CT: VNM Shop, VIP Shop, SBPS Shop
// ============================================================

let CUS = []; // danh sách khách hàng
let ROUTES = []; // danh sách tuyến
let _cusFilterRoute = '';
let _cusFilterQuery = '';
let _cusEditIdx = -1;

const CUS_STORAGE_KEY = 'vnm_customers2';
const ROUTES_STORAGE_KEY = 'vnm_routes';
const CUSTOMERS_URL = REPO_RAW + 'customers.json';
const ROUTES_URL = REPO_RAW + 'routes.json';

// ============================================================
// BẢNG CƠ CẤU CHƯƠNG TRÌNH (từ 3 PDF)
// ============================================================

// 1. VNM SHOP — Trưng bày + Tích lũy DS nhóm C
const VNM_SHOP_TRUNGBAY = {
  M1: { ten: 'Ụ HZ + Kệ KH 24 mặt', dsMin: 45000000, thuong: 900000 },
  M2: { ten: 'Ụ HZ + Kệ KH 18 mặt', dsMin: 38000000, thuong: 750000 },
  M3: { ten: 'Ụ HZ + Kệ KH 8 mặt', dsMin: 30000000, thuong: 600000 },
  M4: { ten: 'Kệ SN + Kệ KH 12 mặt', dsMin: 18000000, thuong: 350000 },
  M5: { ten: 'Kệ KH 24 mặt', dsMin: 12000000, thuong: 240000 },
  M6: { ten: 'Kệ KH 18 mặt', dsMin: 8000000, thuong: 150000 },
  M7: { ten: 'Kệ Minimart 50 mặt', dsMin: 35000000, thuong: 700000 },
  M8: { ten: 'Kệ Minimart 40 mặt', dsMin: 28000000, thuong: 550000 },
  M9: { ten: 'Kệ Minimart 30 mặt', dsMin: 20000000, thuong: 400000 }
};

const VNM_SHOP_TICHLUY = [
  { muc: '1', dsMin: 200000000, dsMax: null,        ckDS: 1.80, ckGD1: 1.60, ckGD2: 1.20, ckGD3: 0.60 },
  { muc: '2', dsMin: 100000000, dsMax: 200000000,   ckDS: 1.70, ckGD1: 1.60, ckGD2: 1.20, ckGD3: 0.60 },
  { muc: '3', dsMin: 65000000,  dsMax: 100000000,   ckDS: 1.60, ckGD1: 1.60, ckGD2: 1.20, ckGD3: 0.60 },
  { muc: '4', dsMin: 35000000,  dsMax: 65000000,    ckDS: 1.50, ckGD1: 1.60, ckGD2: 1.20, ckGD3: 0.60 },
  { muc: '5', dsMin: 20000000,  dsMax: 35000000,    ckDS: 1.40, ckGD1: 1.60, ckGD2: 1.20, ckGD3: 0.60 },
  { muc: '6', dsMin: 10000000,  dsMax: 20000000,    ckDS: 1.30, ckGD1: 1.60, ckGD2: 1.20, ckGD3: 0.60 },
  { muc: '7', dsMin: 5000000,   dsMax: 10000000,    ckDS: 1.20, ckGD1: 1.60, ckGD2: 1.20, ckGD3: 0.60 }
];

// 2. VIP SHOP — Trưng bày tủ mát + Tích lũy DS nhóm DE
const VIP_SHOP_TRUNGBAY = {
  TB1: { dsMin: 15000000, skuMin: 10, thuongVNM: 800000, thuongKH: 400000 },
  TB2: { dsMin: 12000000, skuMin: 8,  thuongVNM: 630000, thuongKH: 320000 },
  TB3: { dsMin: 6000000,  skuMin: 6,  thuongVNM: 320000, thuongKH: 160000 },
  TB4: { dsMin: 3000000,  skuMin: 4,  thuongVNM: 200000, thuongKH: 100000 }
};

const VIP_SHOP_TICHLUY = [
  { muc: 'TL1', dsMin: 60000000, ckN1: 2.6, ckN2: 5.5 },
  { muc: 'TL2', dsMin: 30000000, ckN1: 2.4, ckN2: 5.0 },
  { muc: 'TL3', dsMin: 15000000, ckN1: 2.2, ckN2: 4.5 },
  { muc: 'TL4', dsMin: 9000000,  ckN1: 2.0, ckN2: 4.0 },
  { muc: 'TL5', dsMin: 3000000,  ckN1: 1.8, ckN2: 4.0 }
];

// 3. SBPS SHOP — Tích lũy DS sữa bột pha sẵn trẻ em
const SBPS_TICHLUY = [
  { muc: '1', dsMin: 160000000, ckN1: 7.00, ckN2: 7.30, ckN3: 6.20, ck26: 1.00 },
  { muc: '2', dsMin: 105000000, ckN1: 6.70, ckN2: 7.10, ckN3: 6.00, ck26: 1.00 },
  { muc: '3', dsMin: 75000000,  ckN1: 6.40, ckN2: 6.90, ckN3: 5.80, ck26: 1.00 },
  { muc: '4', dsMin: 32000000,  ckN1: 6.00, ckN2: 6.70, ckN3: 5.60, ck26: 1.00 },
  { muc: '5', dsMin: 17000000,  ckN1: 5.50, ckN2: 6.40, ckN3: 5.40, ck26: 1.00 },
  { muc: '6', dsMin: 9000000,   ckN1: 5.30, ckN2: 5.80, ckN3: 5.30, ck26: 0.60 },
  { muc: '7', dsMin: 5500000,   ckN1: 5.20, ckN2: 5.60, ckN3: 5.20, ck26: 0 },
  { muc: '8', dsMin: 3500000,   ckN1: 4.00, ckN2: 4.50, ckN3: 4.00, ck26: 0 }
];

// ============================================================
// LOAD / SAVE
// ============================================================
function cusSave() { localStorage.setItem(CUS_STORAGE_KEY, JSON.stringify(CUS)); }
function routesSave() { localStorage.setItem(ROUTES_STORAGE_KEY, JSON.stringify(ROUTES)); }

async function cusLoad() {
  // Load customers
  var cached = localStorage.getItem(CUS_STORAGE_KEY);
  if (cached) {
    try {
      var data = JSON.parse(cached);
      CUS = Array.isArray(data) ? data.filter(function(d) { return d && d.ma; }) : [];
    } catch(e) { CUS = []; }
  }
  // Load routes
  var cachedR = localStorage.getItem(ROUTES_STORAGE_KEY);
  if (cachedR) {
    try { ROUTES = JSON.parse(cachedR); } catch(e) { ROUTES = []; }
  }
  // Fallback: load from remote if empty
  if (!CUS.length) {
    try {
      var res = await fetch(CUSTOMERS_URL);
      if (res.ok) {
        var data = await res.json();
        CUS = Array.isArray(data) ? data.filter(function(d) { return d && d.ma; }) : [];
        cusSave();
      }
    } catch(e) {}
  }
  if (!ROUTES.length) {
    try {
      var res = await fetch(ROUTES_URL);
      if (res.ok) { ROUTES = await res.json(); routesSave(); }
    } catch(e) {
      ROUTES = [
        { id: 'T1', ten: 'Tuyến 1', mota: '' },
        { id: 'T2', ten: 'Tuyến 2', mota: '' }
      ];
      routesSave();
    }
  }
}

// ============================================================
// TÍNH THƯỞNG CHƯƠNG TRÌNH
// ============================================================

// Tính thưởng VNM Shop cho 1 KH trong 1 tháng
function calcVNMShopReward(kh, monthData) {
  if (!kh.programs || !kh.programs.vnmShop || !kh.programs.vnmShop.dangKy) return null;
  var cfg = kh.programs.vnmShop;
  var dsThang = (monthData && monthData.dsNhomC) || 0;
  var datTrungBay = (monthData && monthData.vnmShopTrungBay) || false;
  var mucBB = cfg.mucBayBan;
  var mucTL = cfg.mucTichLuy;
  var result = { trungBay: 0, tichLuy: 0, giaiDoan1: 0, giaiDoan2: 0, giaiDoan3: 0, total: 0, details: [] };

  // 1. Thưởng trưng bày
  var bb = VNM_SHOP_TRUNGBAY[mucBB];
  if (bb && datTrungBay && dsThang >= bb.dsMin) {
    var heSo = 1;
    if (cfg.ngayDangKy > 15 && cfg.ngayDangKy <= 19) heSo = 0.5;
    else if (cfg.ngayDangKy > 19) heSo = 0;
    result.trungBay = Math.round(bb.thuong * heSo);
    result.details.push('Trưng bày ' + mucBB + ': ' + fmt(result.trungBay) + 'đ');
  }

  // 2. Thưởng tích lũy DS
  var tl = VNM_SHOP_TICHLUY.find(function(t) { return t.muc === mucTL; });
  if (tl && dsThang >= tl.dsMin) {
    result.tichLuy = Math.round(dsThang * tl.ckDS / 100);
    result.details.push('Tích lũy DS ' + tl.ckDS + '%: ' + fmt(result.tichLuy) + 'đ');

    // Giai đoạn 1,2,3
    var dsGD1 = (monthData && monthData.dsGD1) || 0;
    var dsGD2 = (monthData && monthData.dsGD2) || 0;
    var dsGD3 = (monthData && monthData.dsGD3) || 0;
    var dsMaxTL = tl.dsMax || dsThang; // Mức 1 không có max

    // GD1: min 25% DS đăng ký, tính max 40% DS max
    if (dsGD1 >= tl.dsMin * 0.25) {
      var dsGD1Tinh = Math.min(dsGD1, dsMaxTL * 0.4);
      result.giaiDoan1 = Math.round(dsGD1Tinh * tl.ckGD1 / 100);
      result.details.push('GĐ1 (1-10): ' + fmt(result.giaiDoan1) + 'đ');
    }

    // GD2: lũy kế 1+2 min 55%, max 70%
    var dsLuyKe12 = dsGD1 + dsGD2;
    if (dsLuyKe12 >= tl.dsMin * 0.55) {
      var dsGD2Tinh = Math.min(dsLuyKe12, dsMaxTL * 0.7) - Math.min(dsGD1, dsMaxTL * 0.4);
      if (dsGD2Tinh > 0) {
        result.giaiDoan2 = Math.round(dsGD2Tinh * tl.ckGD2 / 100);
        result.details.push('GĐ2 (11-20): ' + fmt(result.giaiDoan2) + 'đ');
      }
    }

    // GD3: lũy kế 1+2+3 min 85%, không giới hạn max
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

// Tính thưởng VIP Shop cho 1 KH trong 1 tháng
function calcVIPShopReward(kh, monthData) {
  if (!kh.programs || !kh.programs.vipShop || !kh.programs.vipShop.dangKy) return null;
  var cfg = kh.programs.vipShop;
  var dsDE = (monthData && monthData.dsNhomDE) || 0;
  var dsN1 = (monthData && monthData.dsVipN1) || 0; // SP Chủ lực
  var dsN2 = (monthData && monthData.dsVipN2) || 0; // SP Tập trung
  var skuD = (monthData && monthData.skuNhomD) || 0;
  var datTrungBay = (monthData && monthData.vipShopTrungBay) || false;
  var result = { trungBay: 0, tichLuy: 0, vuot90: 0, total: 0, details: [] };

  // 1. Thưởng trưng bày
  var mucBB = cfg.mucBayBan;
  var bb = VIP_SHOP_TRUNGBAY[mucBB];
  if (bb && datTrungBay && dsDE >= bb.dsMin && skuD >= bb.skuMin) {
    var thuong = kh.coTuVNM ? bb.thuongVNM : bb.thuongKH;
    var heSo = 1;
    if (cfg.ngayDangKy > 15 && cfg.ngayDangKy <= 20) heSo = 0.5;
    else if (cfg.ngayDangKy > 20) heSo = 0;
    result.trungBay = Math.round(thuong * heSo);
    result.details.push('TB tủ ' + mucBB + ' (' + (kh.coTuVNM ? 'VNM' : 'KH') + '): ' + fmt(result.trungBay) + 'đ');
  }

  // 2. Thưởng tích lũy DS
  var mucTL = cfg.mucTichLuy;
  var tl = VIP_SHOP_TICHLUY.find(function(t) { return t.muc === mucTL; });
  if (tl && dsDE >= tl.dsMin) {
    var thuongN1 = Math.round(dsN1 * tl.ckN1 / 100);
    var thuongN2 = Math.round(dsN2 * tl.ckN2 / 100);
    result.tichLuy = thuongN1 + thuongN2;
    result.details.push('CL N1 ' + tl.ckN1 + '%: ' + fmt(thuongN1) + 'đ');
    result.details.push('CL N2 ' + tl.ckN2 + '%: ' + fmt(thuongN2) + 'đ');
  }

  // 3. Thưởng vượt 90 triệu
  if (dsDE > 90000000) {
    result.vuot90 = Math.round((dsDE - 90000000) * 1.0 / 100);
    result.details.push('Vượt 90tr: ' + fmt(result.vuot90) + 'đ');
  }

  result.total = result.trungBay + result.tichLuy + result.vuot90;
  return result;
}

// Tính thưởng SBPS Shop
function calcSBPSReward(kh, monthData) {
  if (!kh.programs || !kh.programs.sbpsShop || !kh.programs.sbpsShop.dangKy) return null;
  var cfg = kh.programs.sbpsShop;
  var dsThang = (monthData && monthData.dsSBPS) || 0;
  var dsN1 = (monthData && monthData.sbpsN1) || 0;
  var dsN2 = (monthData && monthData.sbpsN2) || 0;
  var dsN3 = (monthData && monthData.sbpsN3) || 0;
  var dsTo26 = (monthData && monthData.sbpsTo26) || 0;
  var muc = cfg.muc;
  var result = { tichLuy: 0, thuong26: 0, total: 0, details: [] };

  var tl = SBPS_TICHLUY.find(function(t) { return t.muc === muc; });
  if (!tl) return result;

  if (dsThang >= tl.dsMin) {
    var t1 = Math.round(dsN1 * tl.ckN1 / 100);
    var t2 = Math.round(dsN2 * tl.ckN2 / 100);
    var t3 = Math.round(dsN3 * tl.ckN3 / 100);
    result.tichLuy = t1 + t2 + t3;
    result.details.push('SBPS N1 ' + tl.ckN1 + '%: ' + fmt(t1) + 'đ');
    result.details.push('SBPS N2 ' + tl.ckN2 + '%: ' + fmt(t2) + 'đ');
    result.details.push('SBPS N3 ' + tl.ckN3 + '%: ' + fmt(t3) + 'đ');

    // Thưởng DS đến 26
    if (tl.ck26 > 0 && dsTo26 >= tl.dsMin) {
      result.thuong26 = Math.round(dsTo26 * tl.ck26 / 100);
      result.details.push('Thưởng đến 26: ' + fmt(result.thuong26) + 'đ');
    }
  }

  result.total = result.tichLuy + result.thuong26;
  return result;
}

// Tổng hợp thưởng + tính giá "thực tế sau thưởng"
function calcTotalReward(kh, monthData) {
  var vnm = calcVNMShopReward(kh, monthData);
  var vip = calcVIPShopReward(kh, monthData);
  var sbps = calcSBPSReward(kh, monthData);
  var totalReward = (vnm ? vnm.total : 0) + (vip ? vip.total : 0) + (sbps ? sbps.total : 0);
  var dsTotal = 0;
  if (monthData) {
    dsTotal = (monthData.dsNhomC || 0) + (monthData.dsNhomDE || 0) + (monthData.dsSBPS || 0);
  }
  return { vnm: vnm, vip: vip, sbps: sbps, totalReward: totalReward, dsTotal: dsTotal };
}

// ============================================================
// UI — Tab Khách Hàng (redesigned)
// ============================================================

function renderCusTab() {
  var el = document.getElementById('kh-list'); if (!el) return;

  // Filter
  var filtered = CUS.filter(function(kh) {
    if (_cusFilterRoute && kh.tuyen !== _cusFilterRoute) return false;
    if (_cusFilterQuery) {
      var q = _cusFilterQuery.toLowerCase();
      return (kh.ma || '').toLowerCase().indexOf(q) >= 0 ||
             (kh.ten || '').toLowerCase().indexOf(q) >= 0;
    }
    return true;
  });

  if (!CUS.length) {
    el.innerHTML = '<div class="empty">Chưa có khách hàng<br><small>Nhấn ＋ để thêm hoặc import từ GitHub</small></div>';
    return;
  }

  if (!filtered.length) {
    el.innerHTML = '<div class="empty">Không tìm thấy KH theo bộ lọc</div>';
    return;
  }

  // Group by route
  var groups = {};
  filtered.forEach(function(kh) {
    var key = kh.tuyen || '_noRoute';
    if (!groups[key]) groups[key] = [];
    groups[key].push(kh);
  });

  var html = '';

  // Summary card
  var totalKH = CUS.length;
  var totalVNM = CUS.filter(function(k) { return k.programs && k.programs.vnmShop && k.programs.vnmShop.dangKy; }).length;
  var totalVIP = CUS.filter(function(k) { return k.programs && k.programs.vipShop && k.programs.vipShop.dangKy; }).length;
  var totalSBPS = CUS.filter(function(k) { return k.programs && k.programs.sbpsShop && k.programs.sbpsShop.dangKy; }).length;

  html += '<div style="background:linear-gradient(135deg,#004d33,#006b47);margin:0 9px 8px;border-radius:var(--R);padding:14px 16px;color:#fff">';
  html += '<div style="font-size:11px;opacity:.7;margin-bottom:8px">TỔNG QUAN KHÁCH HÀNG</div>';
  html += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:8px;text-align:center">';
  html += '<div><div style="font-size:22px;font-weight:900">' + totalKH + '</div><div style="font-size:9px;opacity:.7">Tổng KH</div></div>';
  html += '<div><div style="font-size:22px;font-weight:900;color:#a3e6c0">' + totalVNM + '</div><div style="font-size:9px;opacity:.7">VNM Shop</div></div>';
  html += '<div><div style="font-size:22px;font-weight:900;color:#93c5fd">' + totalVIP + '</div><div style="font-size:9px;opacity:.7">VIP Shop</div></div>';
  html += '<div><div style="font-size:22px;font-weight:900;color:#fcd34d">' + totalSBPS + '</div><div style="font-size:9px;opacity:.7">SBPS</div></div>';
  html += '</div></div>';

  // Route groups
  var routeOrder = ROUTES.map(function(r) { return r.id; });
  routeOrder.push('_noRoute');

  routeOrder.forEach(function(routeId) {
    if (!groups[routeId] || !groups[routeId].length) return;
    var route = ROUTES.find(function(r) { return r.id === routeId; });
    var label = route ? route.ten : 'Chưa phân tuyến';
    var count = groups[routeId].length;

    html += '<div class="adm-section" style="margin-top:8px">';
    html += '<div class="adm-sec-hd" style="background:#1a1a1a"><span>📍 ' + label + ' (' + count + ' KH)</span></div>';

    groups[routeId].forEach(function(kh, ki) {
      var idx = CUS.indexOf(kh);
      html += cusCardHTML(kh, idx);
    });
    html += '</div>';
  });

  el.innerHTML = html;
}

function cusCardHTML(kh, idx) {
  var monthKey = cusCurrentMonthKey();
  var md = (kh.monthly && kh.monthly[monthKey]) || {};
  var reward = calcTotalReward(kh, md);

  // Tính % tiến độ DS cho mỗi CT
  var vnmProg = cusProgressVNM(kh, md);
  var vipProg = cusProgressVIP(kh, md);

  var html = '<div style="padding:12px 13px;border-bottom:1px solid var(--l1)">';

  // Header: tên + mã
  html += '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px">';
  html += '<div style="flex:1;min-width:0"><div style="font-size:14px;font-weight:800;color:var(--t1)">' + (kh.ten || kh.ma) + '</div>';
  html += '<div style="font-size:11px;color:var(--t3);margin-top:2px">' + kh.ma + (kh.sdt ? ' · ' + kh.sdt : '') + '</div></div>';
  html += '<div style="display:flex;gap:4px">';
  html += '<button onclick="cusEdit(' + idx + ')" style="border:1px solid var(--l2);background:#fff;border-radius:5px;padding:4px 8px;font-size:11px;font-weight:700;color:var(--t2);cursor:pointer">✏️</button>';
  html += '<button onclick="cusInputDS(' + idx + ')" style="border:1px solid var(--g);background:var(--gL);border-radius:5px;padding:4px 8px;font-size:11px;font-weight:700;color:var(--g);cursor:pointer">📊 DS</button>';
  html += '</div></div>';

  // Tags: CT tham gia
  html += '<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px">';
  if (kh.programs && kh.programs.vnmShop && kh.programs.vnmShop.dangKy) {
    html += '<span style="font-size:9px;font-weight:700;padding:2px 7px;border-radius:10px;background:#e0f5ea;color:#004d33">VNM Shop ' + (kh.programs.vnmShop.mucBayBan || '') + '</span>';
  }
  if (kh.programs && kh.programs.vipShop && kh.programs.vipShop.dangKy) {
    html += '<span style="font-size:9px;font-weight:700;padding:2px 7px;border-radius:10px;background:#eef3ff;color:#1557b0">VIP Shop ' + (kh.programs.vipShop.mucBayBan || '') + '</span>';
  }
  if (kh.programs && kh.programs.sbpsShop && kh.programs.sbpsShop.dangKy) {
    html += '<span style="font-size:9px;font-weight:700;padding:2px 7px;border-radius:10px;background:#fef9e7;color:#b45309">SBPS M' + (kh.programs.sbpsShop.muc || '') + '</span>';
  }
  if (kh.coTuVNM) html += '<span style="font-size:9px;font-weight:700;padding:2px 7px;border-radius:10px;background:#f0f2f5;color:var(--t2)">Tủ VNM</span>';
  if (kh.coKe) html += '<span style="font-size:9px;font-weight:700;padding:2px 7px;border-radius:10px;background:#f0f2f5;color:var(--t2)">Kệ ' + (kh.loaiKe || '') + '</span>';
  html += '</div>';

  // Progress bars
  if (vnmProg) html += cusProgressBarHTML('VNM Shop C', vnmProg.pct, vnmProg.ds, vnmProg.target, '#004d33');
  if (vipProg) html += cusProgressBarHTML('VIP Shop DE', vipProg.pct, vipProg.ds, vipProg.target, '#1557b0');

  // Thưởng tổng
  if (reward.totalReward > 0) {
    html += '<div style="background:#f7fef9;border:1px solid #a3e6c0;border-radius:6px;padding:8px 10px;margin-top:6px">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center">';
    html += '<span style="font-size:11px;font-weight:700;color:var(--g)">💰 Thưởng tháng ' + cusCurrentMonthLabel() + '</span>';
    html += '<span style="font-size:15px;font-weight:900;color:var(--g)">' + fmt(reward.totalReward) + 'đ</span>';
    html += '</div>';

    // Chi tiết thưởng
    var allDetails = [];
    if (reward.vnm) allDetails = allDetails.concat(reward.vnm.details);
    if (reward.vip) allDetails = allDetails.concat(reward.vip.details);
    if (reward.sbps) allDetails = allDetails.concat(reward.sbps.details);
    if (allDetails.length) {
      html += '<div style="margin-top:4px;font-size:10px;color:var(--t2);line-height:1.5">' + allDetails.join(' · ') + '</div>';
    }

    // Giá thực tế sau thưởng (quy đổi)
    if (reward.dsTotal > 0) {
      var pctSave = (reward.totalReward / reward.dsTotal * 100).toFixed(1);
      html += '<div style="margin-top:4px;font-size:10px;color:var(--b)">Tương đương giảm thêm ' + pctSave + '% trên tổng DS</div>';
    }
    html += '</div>';
  }

  // Đơn hàng gần nhất từ cart cũ
  var oldKH = customers.find(function(k) { return k.ma === kh.ma; });
  if (oldKH && oldKH.orders && oldKH.orders.length) {
    var lastOrder = oldKH.orders[0];
    html += '<div style="margin-top:6px;font-size:10px;color:var(--t3)">Đơn gần nhất: ' + lastOrder.ngay + ' · ' + fmt(lastOrder.tong) + 'đ · ' + lastOrder.items.length + ' SP</div>';
  }

  html += '</div>';
  return html;
}

function cusProgressBarHTML(label, pct, current, target, color) {
  var pctClamped = Math.min(pct, 100);
  var pctDisplay = Math.round(pct);
  var barColor = pct >= 100 ? '#16a34a' : (pct >= 70 ? '#ca8a04' : color);
  var html = '<div style="margin-bottom:6px">';
  html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">';
  html += '<span style="font-size:10px;font-weight:700;color:var(--t2)">' + label + '</span>';
  html += '<span style="font-size:10px;font-weight:700;color:' + barColor + '">' + fmt(current) + '/' + fmt(target) + ' (' + pctDisplay + '%)</span>';
  html += '</div>';
  html += '<div style="height:6px;background:#f0f2f5;border-radius:3px;overflow:hidden">';
  html += '<div style="height:100%;width:' + pctClamped + '%;background:' + barColor + ';border-radius:3px;transition:width .3s"></div>';
  html += '</div></div>';
  return html;
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

function cusCurrentMonthKey() {
  var d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
}

function cusCurrentMonthLabel() {
  var d = new Date();
  return String(d.getMonth() + 1) + '/' + d.getFullYear();
}

// ============================================================
// NHẬP DOANH SỐ THÁNG CHO KH
// ============================================================
function cusInputDS(idx) {
  var kh = CUS[idx]; if (!kh) return;
  var mk = cusCurrentMonthKey();
  var md = (kh.monthly && kh.monthly[mk]) || {};

  var modal = document.getElementById('km-modal');
  document.getElementById('km-modal-t').textContent = '📊 DS tháng ' + cusCurrentMonthLabel() + ' — ' + (kh.ten || kh.ma);
  modal.style.display = 'block';

  var body = document.getElementById('km-modal-body');
  var html = '';

  // Nhóm C
  if (kh.programs && kh.programs.vnmShop && kh.programs.vnmShop.dangKy) {
    html += '<div class="kf"><div class="kfl" style="color:#004d33">📦 NHÓM C (VNM Shop)</div>';
    html += cusInputField('cds-c', 'DS nhóm C tháng', md.dsNhomC);
    html += cusInputField('cds-gd1', 'DS GĐ1 (1-10)', md.dsGD1);
    html += cusInputField('cds-gd2', 'DS GĐ2 (11-20)', md.dsGD2);
    html += cusInputField('cds-gd3', 'DS GĐ3 (21-27)', md.dsGD3);
    html += '<div style="display:flex;gap:8px;margin-top:6px"><label style="font-size:12px;display:flex;align-items:center;gap:5px"><input type="checkbox" id="cds-trungbay-vnm" ' + (md.vnmShopTrungBay ? 'checked' : '') + '> Đạt trưng bày VNM Shop</label></div>';
    html += '</div>';
  }

  // Nhóm DE
  if (kh.programs && kh.programs.vipShop && kh.programs.vipShop.dangKy) {
    html += '<div class="kf"><div class="kfl" style="color:#1557b0">🧊 NHÓM DE (VIP Shop)</div>';
    html += cusInputField('cds-de', 'DS nhóm DE tháng', md.dsNhomDE);
    html += cusInputField('cds-vn1', 'DS SP Chủ lực (N1)', md.dsVipN1);
    html += cusInputField('cds-vn2', 'DS SP Tập trung (N2)', md.dsVipN2);
    html += cusInputField('cds-skud', 'Số SKU nhóm D', md.skuNhomD);
    html += '<div style="display:flex;gap:8px;margin-top:6px"><label style="font-size:12px;display:flex;align-items:center;gap:5px"><input type="checkbox" id="cds-trungbay-vip" ' + (md.vipShopTrungBay ? 'checked' : '') + '> Đạt trưng bày VIP Shop</label></div>';
    html += '</div>';
  }

  // SBPS
  if (kh.programs && kh.programs.sbpsShop && kh.programs.sbpsShop.dangKy) {
    html += '<div class="kf"><div class="kfl" style="color:#b45309">🍼 SBPS TE</div>';
    html += cusInputField('cds-sbps', 'DS SBPS tháng', md.dsSBPS);
    html += cusInputField('cds-sbps-n1', 'DS SBPS N1 (DG/GP/A2)', md.sbpsN1);
    html += cusInputField('cds-sbps-n2', 'DS SBPS N2 (OG/DGP)', md.sbpsN2);
    html += cusInputField('cds-sbps-n3', 'DS SBPS N3 (Yoko/OC)', md.sbpsN3);
    html += cusInputField('cds-sbps-26', 'DS đến ngày 26', md.sbpsTo26);
    html += '</div>';
  }

  html += '<div id="cds-preview" style="margin-top:10px"></div>';
  html += '<button class="btn-km-save" onclick="cusSaveDS(' + idx + ')">💾 Lưu doanh số</button>';

  body.innerHTML = html;

  // Preview on change
  body.querySelectorAll('input').forEach(function(inp) {
    inp.addEventListener('input', function() { cusPreviewDS(idx); });
    inp.addEventListener('change', function() { cusPreviewDS(idx); });
  });
  cusPreviewDS(idx);
}

function cusInputField(id, label, value) {
  return '<div style="margin-bottom:6px"><div style="font-size:10px;color:var(--t3);margin-bottom:2px">' + label + '</div>' +
    '<input type="number" id="' + id + '" value="' + (value || '') + '" placeholder="0" inputmode="numeric" style="width:100%;height:38px;border:1.5px solid var(--l2);border-radius:var(--Rs);padding:0 11px;font-size:15px;font-weight:700;color:var(--t1)"></div>';
}

function cusReadDS() {
  var g = function(id) { return parseInt((document.getElementById(id) || {}).value) || 0; };
  var c = function(id) { return (document.getElementById(id) || {}).checked || false; };
  return {
    dsNhomC: g('cds-c'), dsGD1: g('cds-gd1'), dsGD2: g('cds-gd2'), dsGD3: g('cds-gd3'),
    vnmShopTrungBay: c('cds-trungbay-vnm'),
    dsNhomDE: g('cds-de'), dsVipN1: g('cds-vn1'), dsVipN2: g('cds-vn2'), skuNhomD: g('cds-skud'),
    vipShopTrungBay: c('cds-trungbay-vip'),
    dsSBPS: g('cds-sbps'), sbpsN1: g('cds-sbps-n1'), sbpsN2: g('cds-sbps-n2'), sbpsN3: g('cds-sbps-n3'), sbpsTo26: g('cds-sbps-26')
  };
}

function cusPreviewDS(idx) {
  var kh = CUS[idx]; if (!kh) return;
  var md = cusReadDS();
  var reward = calcTotalReward(kh, md);
  var el = document.getElementById('cds-preview'); if (!el) return;

  var html = '<div style="background:var(--gL);border:1px solid #a3e6c0;border-radius:var(--Rs);padding:10px 12px">';
  html += '<div style="font-size:11px;font-weight:700;color:var(--g);margin-bottom:6px">🔍 Dự tính thưởng</div>';

  if (reward.vnm && reward.vnm.total > 0) {
    html += '<div style="font-size:10px;color:var(--t2);margin-bottom:3px"><b style="color:#004d33">VNM Shop:</b> ' + fmt(reward.vnm.total) + 'đ</div>';
    html += '<div style="font-size:9px;color:var(--t3);margin-bottom:5px">' + reward.vnm.details.join(' · ') + '</div>';
  }
  if (reward.vip && reward.vip.total > 0) {
    html += '<div style="font-size:10px;color:var(--t2);margin-bottom:3px"><b style="color:#1557b0">VIP Shop:</b> ' + fmt(reward.vip.total) + 'đ</div>';
    html += '<div style="font-size:9px;color:var(--t3);margin-bottom:5px">' + reward.vip.details.join(' · ') + '</div>';
  }
  if (reward.sbps && reward.sbps.total > 0) {
    html += '<div style="font-size:10px;color:var(--t2);margin-bottom:3px"><b style="color:#b45309">SBPS:</b> ' + fmt(reward.sbps.total) + 'đ</div>';
    html += '<div style="font-size:9px;color:var(--t3);margin-bottom:5px">' + reward.sbps.details.join(' · ') + '</div>';
  }

  html += '<div style="border-top:1px solid #a3e6c0;padding-top:6px;margin-top:4px;display:flex;justify-content:space-between">';
  html += '<span style="font-size:13px;font-weight:800;color:var(--g)">TỔNG THƯỞNG</span>';
  html += '<span style="font-size:16px;font-weight:900;color:var(--g)">' + fmt(reward.totalReward) + 'đ</span>';
  html += '</div>';

  // Quy đổi giảm giá trên DS
  if (reward.dsTotal > 0 && reward.totalReward > 0) {
    var pct = (reward.totalReward / reward.dsTotal * 100).toFixed(1);
    html += '<div style="font-size:10px;color:var(--b);margin-top:4px">≈ Giảm thêm ' + pct + '% trên tổng DS ' + fmt(reward.dsTotal) + 'đ</div>';
    html += '<div style="font-size:10px;color:var(--t2);margin-top:2px">💡 Quy đổi SP: ~' + fmt(Math.round(reward.totalReward / 7000)) + ' hộp sữa 180ml (ước tính)</div>';
  }

  html += '</div>';
  el.innerHTML = html;
}

function cusSaveDS(idx) {
  var kh = CUS[idx]; if (!kh) return;
  var mk = cusCurrentMonthKey();
  if (!kh.monthly) kh.monthly = {};
  kh.monthly[mk] = cusReadDS();
  cusSave();
  document.getElementById('km-modal').style.display = 'none';
  renderCusTab();
  alert('✅ Đã lưu DS tháng ' + cusCurrentMonthLabel() + ' cho ' + (kh.ten || kh.ma));
}

// ============================================================
// THÊM / SỬA / XÓA KH
// ============================================================
function cusEdit(idx) {
  _cusEditIdx = idx;
  var kh = CUS[idx] || {};
  var modal = document.getElementById('km-modal');
  document.getElementById('km-modal-t').textContent = idx >= 0 && CUS[idx] ? 'Sửa KH: ' + (kh.ten || kh.ma) : 'Thêm khách hàng';
  modal.style.display = 'block';

  var prog = kh.programs || {};
  var vnm = prog.vnmShop || {};
  var vip = prog.vipShop || {};
  var sbps = prog.sbpsShop || {};

  var body = document.getElementById('km-modal-body');
  var html = '';

  // Thông tin cơ bản
  html += '<div class="kf"><div class="kfl">THÔNG TIN CƠ BẢN</div>';
  html += cusFormField('ckh-ma', 'Mã KH', kh.ma || '', idx >= 0 && CUS[idx]);
  html += cusFormField('ckh-ten', 'Tên cửa hàng', kh.ten || '');
  html += cusFormField('ckh-diachi', 'Địa chỉ', kh.diachi || '');
  html += cusFormField('ckh-sdt', 'SĐT', kh.sdt || '');

  // Tuyến
  html += '<div style="margin-bottom:6px"><div style="font-size:10px;color:var(--t3);margin-bottom:2px">Tuyến bán hàng</div>';
  html += '<select id="ckh-tuyen" style="width:100%;height:38px;border:1.5px solid var(--l2);border-radius:var(--Rs);padding:0 11px;font-size:14px;">';
  html += '<option value="">— Chưa phân tuyến —</option>';
  ROUTES.forEach(function(r) {
    html += '<option value="' + r.id + '"' + (kh.tuyen === r.id ? ' selected' : '') + '>' + r.ten + '</option>';
  });
  html += '</select></div>';

  // Loại CH
  html += '<div style="margin-bottom:6px"><div style="font-size:10px;color:var(--t3);margin-bottom:2px">Loại cửa hàng</div>';
  html += '<select id="ckh-loai" style="width:100%;height:38px;border:1.5px solid var(--l2);border-radius:var(--Rs);padding:0 11px;font-size:14px;">';
  ['tapHoa', 'shopSua', 'sieuThiMini', 'daiLy'].forEach(function(v) {
    var labels = { tapHoa: 'Tạp hóa', shopSua: 'Shop sữa', sieuThiMini: 'Siêu thị mini', daiLy: 'Đại lý' };
    html += '<option value="' + v + '"' + (kh.loaiCH === v ? ' selected' : '') + '>' + labels[v] + '</option>';
  });
  html += '</select></div>';
  html += '</div>';

  // Thiết bị
  html += '<div class="kf"><div class="kfl">THIẾT BỊ BÁN HÀNG</div>';
  html += '<label style="font-size:12px;display:flex;align-items:center;gap:5px;margin-bottom:6px"><input type="checkbox" id="ckh-tu" ' + (kh.coTuVNM ? 'checked' : '') + '> Có tủ mát VNM</label>';
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">';
  html += '<div><div style="font-size:10px;color:var(--t3)">Loại tủ</div><select id="ckh-loaitu" style="width:100%;height:36px;border:1.5px solid var(--l2);border-radius:var(--Rs);padding:0 8px;font-size:13px;"><option value="">Không</option><option value="1canh"' + (kh.loaiTu === '1canh' ? ' selected' : '') + '>1 cánh</option><option value="2canh"' + (kh.loaiTu === '2canh' ? ' selected' : '') + '>2 cánh</option><option value="honhop"' + (kh.loaiTu === 'honhop' ? ' selected' : '') + '>Hỗn hợp</option></select></div>';
  html += '<div><div style="font-size:10px;color:var(--t3)">Dung tích (L)</div><input type="number" id="ckh-dungtich" value="' + (kh.dungTichTu || '') + '" style="width:100%;height:36px;border:1.5px solid var(--l2);border-radius:var(--Rs);padding:0 8px;font-size:13px;"></div>';
  html += '</div>';
  html += '<label style="font-size:12px;display:flex;align-items:center;gap:5px;margin-top:8px;margin-bottom:6px"><input type="checkbox" id="ckh-ke" ' + (kh.coKe ? 'checked' : '') + '> Có kệ VNM</label>';
  html += '<select id="ckh-loaike" style="width:100%;height:36px;border:1.5px solid var(--l2);border-radius:var(--Rs);padding:0 8px;font-size:13px;">';
  html += '<option value="">Không</option>';
  Object.keys(VNM_SHOP_TRUNGBAY).forEach(function(m) { html += '<option value="' + m + '"' + (kh.loaiKe === m ? ' selected' : '') + '>' + m + ' — ' + VNM_SHOP_TRUNGBAY[m].ten + '</option>'; });
  html += '</select>';
  html += '</div>';

  // CT VNM Shop
  html += '<div class="kf"><div class="kfl" style="color:#004d33">📋 VNM SHOP (Nhóm C)</div>';
  html += '<label style="font-size:12px;display:flex;align-items:center;gap:5px;margin-bottom:8px"><input type="checkbox" id="ckh-vnm-dk" ' + (vnm.dangKy ? 'checked' : '') + '> Đăng ký tham gia</label>';
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">';
  html += '<div><div style="font-size:10px;color:var(--t3)">Mức bày bán</div><select id="ckh-vnm-bb" style="width:100%;height:36px;border:1.5px solid var(--l2);border-radius:var(--Rs);padding:0 8px;font-size:13px;">';
  Object.keys(VNM_SHOP_TRUNGBAY).forEach(function(m) { html += '<option value="' + m + '"' + (vnm.mucBayBan === m ? ' selected' : '') + '>' + m + '</option>'; });
  html += '</select></div>';
  html += '<div><div style="font-size:10px;color:var(--t3)">Mức tích lũy</div><select id="ckh-vnm-tl" style="width:100%;height:36px;border:1.5px solid var(--l2);border-radius:var(--Rs);padding:0 8px;font-size:13px;">';
  VNM_SHOP_TICHLUY.forEach(function(t) { html += '<option value="' + t.muc + '"' + (vnm.mucTichLuy === t.muc ? ' selected' : '') + '>Mức ' + t.muc + ' (≥' + fmt(t.dsMin) + 'đ)</option>'; });
  html += '</select></div>';
  html += '</div>';
  html += '<div style="font-size:10px;color:var(--t3);margin-top:4px">Ngày ĐK: <input type="number" id="ckh-vnm-ngay" value="' + (vnm.ngayDangKy || '') + '" min="1" max="31" style="width:50px;height:28px;border:1px solid var(--l2);border-radius:4px;text-align:center;font-size:12px;"></div>';
  html += '</div>';

  // CT VIP Shop
  html += '<div class="kf"><div class="kfl" style="color:#1557b0">🧊 VIP SHOP (Nhóm DE)</div>';
  html += '<label style="font-size:12px;display:flex;align-items:center;gap:5px;margin-bottom:8px"><input type="checkbox" id="ckh-vip-dk" ' + (vip.dangKy ? 'checked' : '') + '> Đăng ký tham gia</label>';
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">';
  html += '<div><div style="font-size:10px;color:var(--t3)">Mức bày bán</div><select id="ckh-vip-bb" style="width:100%;height:36px;border:1.5px solid var(--l2);border-radius:var(--Rs);padding:0 8px;font-size:13px;">';
  Object.keys(VIP_SHOP_TRUNGBAY).forEach(function(m) { html += '<option value="' + m + '"' + (vip.mucBayBan === m ? ' selected' : '') + '>' + m + '</option>'; });
  html += '</select></div>';
  html += '<div><div style="font-size:10px;color:var(--t3)">Mức tích lũy</div><select id="ckh-vip-tl" style="width:100%;height:36px;border:1.5px solid var(--l2);border-radius:var(--Rs);padding:0 8px;font-size:13px;">';
  VIP_SHOP_TICHLUY.forEach(function(t) { html += '<option value="' + t.muc + '"' + (vip.mucTichLuy === t.muc ? ' selected' : '') + '>' + t.muc + ' (≥' + fmt(t.dsMin) + 'đ)</option>'; });
  html += '</select></div>';
  html += '</div>';
  html += '<div style="font-size:10px;color:var(--t3);margin-top:4px">Ngày ĐK: <input type="number" id="ckh-vip-ngay" value="' + (vip.ngayDangKy || '') + '" min="1" max="31" style="width:50px;height:28px;border:1px solid var(--l2);border-radius:4px;text-align:center;font-size:12px;"></div>';
  html += '</div>';

  // CT SBPS
  html += '<div class="kf"><div class="kfl" style="color:#b45309">🍼 SBPS SHOP (SBPS TE)</div>';
  html += '<label style="font-size:12px;display:flex;align-items:center;gap:5px;margin-bottom:8px"><input type="checkbox" id="ckh-sbps-dk" ' + (sbps.dangKy ? 'checked' : '') + '> Đăng ký tham gia</label>';
  html += '<div><div style="font-size:10px;color:var(--t3)">Mức tích lũy</div><select id="ckh-sbps-muc" style="width:100%;height:36px;border:1.5px solid var(--l2);border-radius:var(--Rs);padding:0 8px;font-size:13px;">';
  html += '<option value="">Không</option>';
  SBPS_TICHLUY.forEach(function(t) { html += '<option value="' + t.muc + '"' + (sbps.muc === t.muc ? ' selected' : '') + '>Mức ' + t.muc + ' (≥' + fmt(t.dsMin) + 'đ)</option>'; });
  html += '</select></div>';
  html += '</div>';

  // Ghi chú
  html += '<div class="kf"><div class="kfl">GHI CHÚ</div>';
  html += '<textarea id="ckh-ghichu" placeholder="Ghi chú về KH..." style="width:100%;height:60px;border:1.5px solid var(--l2);border-radius:var(--Rs);padding:8px 11px;font-size:13px;color:var(--t1);resize:vertical">' + (kh.ghiChu || '') + '</textarea></div>';

  html += '<button class="btn-km-save" onclick="cusSaveForm()">' + (idx >= 0 && CUS[idx] ? '💾 Cập nhật KH' : '✓ Thêm KH') + '</button>';
  if (idx >= 0 && CUS[idx]) {
    html += '<button onclick="cusDel(' + idx + ')" style="width:100%;height:40px;background:none;color:var(--r);border:1.5px solid var(--r);border-radius:var(--R);font-size:13px;font-weight:600;cursor:pointer;margin-top:7px">✕ Xóa khách hàng</button>';
  }

  body.innerHTML = html;
}

function cusFormField(id, label, value, readonly) {
  return '<div style="margin-bottom:6px"><div style="font-size:10px;color:var(--t3);margin-bottom:2px">' + label + '</div>' +
    '<input type="text" id="' + id + '" value="' + (value || '') + '"' + (readonly ? ' readonly style="background:#f0f2f5;color:var(--t3);"' : '') + ' style="width:100%;height:38px;border:1.5px solid var(--l2);border-radius:var(--Rs);padding:0 11px;font-size:15px;color:var(--t1);' + (readonly ? 'background:#f0f2f5;color:var(--t3);' : '') + '"></div>';
}

function cusSaveForm() {
  var g = function(id) { return (document.getElementById(id) || {}).value || ''; };
  var c = function(id) { return (document.getElementById(id) || {}).checked || false; };
  var n = function(id) { return parseInt(g(id)) || 0; };

  var ma = g('ckh-ma').trim().toUpperCase();
  if (!ma) { alert('Nhập mã KH'); return; }

  var kh = {
    ma: ma,
    ten: g('ckh-ten'),
    tuyen: g('ckh-tuyen'),
    diachi: g('ckh-diachi'),
    sdt: g('ckh-sdt'),
    loaiCH: g('ckh-loai'),
    coTuVNM: c('ckh-tu'),
    loaiTu: g('ckh-loaitu'),
    dungTichTu: n('ckh-dungtich'),
    coKe: c('ckh-ke'),
    loaiKe: g('ckh-loaike'),
    ghiChu: g('ckh-ghichu'),
    programs: {
      vnmShop: {
        dangKy: c('ckh-vnm-dk'),
        mucBayBan: g('ckh-vnm-bb'),
        mucTichLuy: g('ckh-vnm-tl'),
        ngayDangKy: n('ckh-vnm-ngay')
      },
      vipShop: {
        dangKy: c('ckh-vip-dk'),
        mucBayBan: g('ckh-vip-bb'),
        mucTichLuy: g('ckh-vip-tl'),
        ngayDangKy: n('ckh-vip-ngay')
      },
      sbpsShop: {
        dangKy: c('ckh-sbps-dk'),
        muc: g('ckh-sbps-muc'),
        ngayDangKy: 0
      }
    },
    monthly: {}
  };

  if (_cusEditIdx >= 0 && CUS[_cusEditIdx]) {
    // Preserve monthly data
    kh.monthly = CUS[_cusEditIdx].monthly || {};
    CUS[_cusEditIdx] = kh;
  } else {
    if (CUS.find(function(k) { return k.ma === ma; })) { alert('Mã KH đã tồn tại!'); return; }
    CUS.push(kh);
  }

  cusSave();
  document.getElementById('km-modal').style.display = 'none';
  renderCusTab();
  alert('✅ Đã lưu: ' + (kh.ten || kh.ma));
}

function cusDel(idx) {
  var kh = CUS[idx];
  if (!kh || !confirm('Xóa KH "' + (kh.ten || kh.ma) + '"?')) return;
  CUS.splice(idx, 1);
  cusSave();
  document.getElementById('km-modal').style.display = 'none';
  renderCusTab();
}

// ============================================================
// EXPORT / IMPORT KH
// ============================================================
function cusExport() {
  var data = { customers: CUS, routes: ROUTES };
  var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'vnm_customers_' + new Date().toISOString().slice(0, 10) + '.json';
  a.click();
  URL.revokeObjectURL(url);
  alert('✅ Đã xuất ' + CUS.length + ' KH + ' + ROUTES.length + ' tuyến');
}

function cusImport() {
  var input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json';
  input.onchange = function(e) {
    var file = e.target.files[0]; if (!file) return;
    var reader = new FileReader();
    reader.onload = function(ev) {
      try {
        var data = JSON.parse(ev.target.result);
        var replace = confirm('Thay thế toàn bộ? (OK = thay thế, Cancel = gộp thêm)');
        if (data.customers) {
          var newCus = data.customers.filter(function(k) { return k && k.ma; });
          if (replace) CUS = newCus;
          else {
            newCus.forEach(function(k) {
              var existing = CUS.find(function(c) { return c.ma === k.ma; });
              if (existing) Object.assign(existing, k);
              else CUS.push(k);
            });
          }
          cusSave();
        }
        if (data.routes) { ROUTES = data.routes; routesSave(); }
        renderCusTab();
        alert('✅ Đã nhập ' + (data.customers ? data.customers.length : 0) + ' KH');
      } catch(e) { alert('Lỗi: ' + e.message); }
    };
    reader.readAsText(file);
  };
  input.click();
}

// ============================================================
// QUẢN LÝ TUYẾN
// ============================================================
function cusManageRoutes() {
  var modal = document.getElementById('km-modal');
  document.getElementById('km-modal-t').textContent = '📍 Quản lý tuyến bán hàng';
  modal.style.display = 'block';

  var body = document.getElementById('km-modal-body');
  var html = '<div id="routes-list">';
  ROUTES.forEach(function(r, i) {
    html += '<div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;padding:8px;background:#f7f8fa;border-radius:var(--Rs)">';
    html += '<div style="flex:1"><div style="font-size:13px;font-weight:700">' + r.ten + '</div><div style="font-size:10px;color:var(--t3)">' + r.id + (r.mota ? ' · ' + r.mota : '') + '</div></div>';
    html += '<button onclick="cusDelRoute(' + i + ')" style="border:none;background:none;color:var(--r);font-size:14px;cursor:pointer">✕</button>';
    html += '</div>';
  });
  html += '</div>';
  html += '<div style="display:flex;gap:7px;margin-top:10px">';
  html += '<input type="text" id="new-route-id" placeholder="Mã tuyến (VD: T7)" style="width:80px;height:38px;border:1.5px solid var(--l2);border-radius:var(--Rs);padding:0 8px;font-size:14px;">';
  html += '<input type="text" id="new-route-ten" placeholder="Tên tuyến" style="flex:1;height:38px;border:1.5px solid var(--l2);border-radius:var(--Rs);padding:0 8px;font-size:14px;">';
  html += '<button onclick="cusAddRoute()" style="height:38px;padding:0 12px;background:var(--g);color:#fff;border:none;border-radius:var(--Rs);font-size:13px;font-weight:700;cursor:pointer">+</button>';
  html += '</div>';

  body.innerHTML = html;
}

function cusAddRoute() {
  var id = (document.getElementById('new-route-id') || {}).value.trim();
  var ten = (document.getElementById('new-route-ten') || {}).value.trim();
  if (!id || !ten) { alert('Nhập mã và tên tuyến'); return; }
  if (ROUTES.find(function(r) { return r.id === id; })) { alert('Mã tuyến đã tồn tại'); return; }
  ROUTES.push({ id: id, ten: ten, mota: '' });
  routesSave();
  cusManageRoutes(); // re-render
  renderCusTab();
}

function cusDelRoute(i) {
  if (!confirm('Xóa tuyến "' + ROUTES[i].ten + '"?')) return;
  ROUTES.splice(i, 1);
  routesSave();
  cusManageRoutes();
  renderCusTab();
}

function cusFilterRoute(routeId) {
  _cusFilterRoute = routeId;
  renderCusTab();
}

function cusFilterSearch(q) {
  _cusFilterQuery = (q || '').trim();
  renderCusTab();
}

// ============================================================
// EXPORTS
// ============================================================
window.CUS = function() { return CUS; };
window.ROUTES = function() { return ROUTES; };
window.cusLoad = cusLoad;
window.cusSave = cusSave;
window.renderCusTab = renderCusTab;
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
window.calcVNMShopReward = calcVNMShopReward;
window.calcVIPShopReward = calcVIPShopReward;
window.calcSBPSReward = calcSBPSReward;
window.calcTotalReward = calcTotalReward;
