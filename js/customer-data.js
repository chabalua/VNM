// ============================================================
// CUSTOMER DATA MODULE — data, storage, monthly aggregation
// ============================================================

var CUS = [];
var ROUTES = [];

var CUS_STORAGE_KEY = LS_KEYS.CUSTOMERS;
var ROUTES_STORAGE_KEY = LS_KEYS.ROUTES;
var CUSTOMERS_URL = REPO_RAW + 'customers.json';
var ROUTES_URL = REPO_RAW + 'routes.json';

var CUS_MONTHLY_MANUAL_FIELDS = {
  dsNhomC: 'manualDsNhomC',
  dsNhomDE: 'manualDsNhomDE',
  dsSBPS: 'manualDsSBPS'
};

function isValidCustomerRecord(item) {
  return !!(item && typeof item === 'object' && typeof item.ma === 'string' && item.ma.trim());
}

function sanitizeCustomerList(data, sourceLabel) {
  if (!Array.isArray(data)) return [];
  var invalidCount = 0;
  var duplicateCount = 0;
  var seen = {};
  var sanitized = data.filter(function(item) {
    var ok = isValidCustomerRecord(item);
    if (!ok) invalidCount += 1;
    if (!ok) return false;
    var key = String(item.ma || '').trim().toUpperCase();
    if (seen[key]) {
      duplicateCount += 1;
      return false;
    }
    seen[key] = true;
    return true;
  });
  if (invalidCount > 0 && sourceLabel) {
    console.warn('[customer-data] Bỏ qua ' + invalidCount + ' khách hàng lỗi từ ' + sourceLabel);
  }
  if (duplicateCount > 0 && sourceLabel) {
    console.warn('[customer-data] Bỏ qua ' + duplicateCount + ' khách hàng trùng mã từ ' + sourceLabel);
  }
  return sanitized;
}

function isValidRouteRecord(item) {
  return !!(item && typeof item === 'object' && typeof item.id === 'string' && item.id.trim() && typeof item.ten === 'string' && item.ten.trim());
}

function sanitizeRouteList(data, sourceLabel) {
  if (!Array.isArray(data)) return [];
  var invalidCount = 0;
  var duplicateCount = 0;
  var seen = {};
  var sanitized = data.filter(function(item) {
    var ok = isValidRouteRecord(item);
    if (!ok) invalidCount += 1;
    if (!ok) return false;
    var key = String(item.id || '').trim().toUpperCase();
    if (seen[key]) {
      duplicateCount += 1;
      return false;
    }
    seen[key] = true;
    return true;
  });
  if (invalidCount > 0 && sourceLabel) {
    console.warn('[customer-data] Bỏ qua ' + invalidCount + ' tuyến lỗi từ ' + sourceLabel);
  }
  if (duplicateCount > 0 && sourceLabel) {
    console.warn('[customer-data] Bỏ qua ' + duplicateCount + ' tuyến trùng mã từ ' + sourceLabel);
  }
  return sanitized;
}

var VNM_APP_CODES = {
  'MR_VIPSHOP26_TB': { prog: 'vipShop', loai: 'TB', ten: 'VIP Shop Trung Bay' },
  'MR_VIPSHOP26_TU2': { prog: 'vipShop', loai: 'TB', ten: 'VIP Shop Trung Bay Tu 2' },
  'MR_VIPSHOP26_TL': { prog: 'vipShop', loai: 'TL', ten: 'VIP Shop Tich Luy' },
  'MR_VNMS26_TB': { prog: 'vnmShop', loai: 'TB', ten: 'VNM Shop Trung Bay' },
  'MR_VNMS26_TL': { prog: 'vnmShop', loai: 'TL', ten: 'VNM Shop Tich Luy' },
  'MR_VSHOP26_TB': { prog: 'vnmShop', loai: 'TB', ten: 'V Shop Trung Bay' },
  'MR_VSHOP26_TL': { prog: 'vnmShop', loai: 'TL', ten: 'V Shop Tich Luy' },
  'MR_SBPS26_TB': { prog: 'sbpsShop', loai: 'TB', ten: 'SBPS Trung Bay' },
  'MR_SBPS26_TL': { prog: 'sbpsShop', loai: 'TL', ten: 'SBPS Tich Luy' },
  'MR_SBPS_TE26_TL': { prog: 'sbpsShop', loai: 'TL', ten: 'SBPS TE Tich Luy' },
  'MRKEMSHOP26TB': { prog: 'kemShop', loai: 'TB', ten: 'KEM Shop Trung Bay' },
  'MRKEMSHOP26TL': { prog: 'kemShop', loai: 'TL', ten: 'KEM Shop Tich Luy' }
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

function cusAppCodesToPrograms(appCodes) {
  var progs = {
    vnmShop: { dangKy: false, mucBayBan: '', mucTichLuy: '', ngayDangKy: 0 },
    vipShop: { dangKy: false, mucBayBan: '', mucTichLuy: '', ngayDangKy: 0 },
    sbpsShop: { dangKy: false, muc: '', mucTrungBay: '', ngayDangKy: 0 }
  };
  (appCodes || []).forEach(function(ac) {
    var info = VNM_APP_CODES[ac.maCT];
    if (!info) return;
    var ngay = ac.ngayDk || 0;
    if (info.prog === 'vnmShop') {
      progs.vnmShop.dangKy = true;
      if (!progs.vnmShop.ngayDangKy) progs.vnmShop.ngayDangKy = ngay;
      if (info.loai === 'TB') progs.vnmShop.mucBayBan = ac.muc;
      if (info.loai === 'TL') progs.vnmShop.mucTichLuy = ac.muc;
    } else if (info.prog === 'vipShop') {
      progs.vipShop.dangKy = true;
      if (!progs.vipShop.ngayDangKy) progs.vipShop.ngayDangKy = ngay;
      if (info.loai === 'TB') progs.vipShop.mucBayBan = ac.muc;
      if (info.loai === 'TL') progs.vipShop.mucTichLuy = ac.muc;
    } else if (info.prog === 'sbpsShop') {
      progs.sbpsShop.dangKy = true;
      if (!progs.sbpsShop.ngayDangKy) progs.sbpsShop.ngayDangKy = ngay;
      if (info.loai === 'TL') progs.sbpsShop.muc = ac.muc;
      if (info.loai === 'TB') progs.sbpsShop.mucTrungBay = ac.muc;
    }
  });
  return progs;
}

function cusProgamsToAppCodes(kh) {
  if (kh.appCodes && kh.appCodes.length) return kh.appCodes;
  var codes = [];
  var prog = kh.programs || {};
  var vnm = prog.vnmShop || {};
  var vip = prog.vipShop || {};
  var sbps = prog.sbpsShop || {};
  if (vnm.dangKy) {
    if (vnm.mucBayBan) codes.push({ maCT: 'MR_VNMS26_TB', muc: vnm.mucBayBan, ngayDk: vnm.ngayDangKy || 0 });
    if (vnm.mucTichLuy) codes.push({ maCT: 'MR_VNMS26_TL', muc: vnm.mucTichLuy, ngayDk: vnm.ngayDangKy || 0 });
  }
  if (vip.dangKy) {
    if (vip.mucBayBan) codes.push({ maCT: kh.loaiTu === '2canh' ? 'MR_VIPSHOP26_TU2' : 'MR_VIPSHOP26_TB', muc: vip.mucBayBan, ngayDk: vip.ngayDangKy || 0 });
    if (vip.mucTichLuy) codes.push({ maCT: 'MR_VIPSHOP26_TL', muc: vip.mucTichLuy, ngayDk: vip.ngayDangKy || 0 });
  }
  if (sbps.dangKy) {
    if (sbps.mucTrungBay) codes.push({ maCT: 'MR_SBPS26_TB', muc: sbps.mucTrungBay, ngayDk: sbps.ngayDangKy || 0 });
    if (sbps.muc) codes.push({ maCT: 'MR_SBPS26_TL', muc: sbps.muc, ngayDk: sbps.ngayDangKy || 0 });
  }
  return codes;
}

function cusSave() {
  localStorage.setItem(CUS_STORAGE_KEY, JSON.stringify(CUS));
  if (window.lsCheckQuota) lsCheckQuota();
}

function routesSave() {
  localStorage.setItem(ROUTES_STORAGE_KEY, JSON.stringify(ROUTES));
}

async function cusLoad() {
  var cached = localStorage.getItem(CUS_STORAGE_KEY);
  if (cached) {
    try {
      var data = JSON.parse(cached);
      CUS = sanitizeCustomerList(data, 'localStorage.' + CUS_STORAGE_KEY);
    } catch (e) {
      CUS = [];
    }
  }
  var cachedR = localStorage.getItem(ROUTES_STORAGE_KEY);
  if (cachedR) {
    try {
      ROUTES = sanitizeRouteList(JSON.parse(cachedR), 'localStorage.' + ROUTES_STORAGE_KEY);
    } catch (e) {
      ROUTES = [];
    }
  }
  if (!CUS.length) {
    try {
      var ts = '_t=' + Date.now();
      var res = await fetch(CUSTOMERS_URL + '?' + ts, { cache: 'no-store' });
      if (res.ok) {
        var data2 = await res.json();
        CUS = sanitizeCustomerList(data2, CUSTOMERS_URL);
        cusSave();
      }
    } catch (e) {}
  }
  if (!ROUTES.length) {
    try {
      var ts2 = '_t=' + Date.now();
      var res2 = await fetch(ROUTES_URL + '?' + ts2, { cache: 'no-store' });
      if (res2.ok) {
        ROUTES = sanitizeRouteList(await res2.json(), ROUTES_URL);
        routesSave();
      }
    } catch (e) {
      ROUTES = [
        { id: 'T1', ten: 'Tuyến 1', mota: '' },
        { id: 'T2', ten: 'Tuyến 2', mota: '' }
      ];
      try { routesSave(); } catch (se) {}
    }
  }
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

function cusCurrentMonthKey() {
  return cusDateToMonthKey('');
}

function cusCurrentMonthLabel() {
  return cusMonthLabelFromKey(cusCurrentMonthKey());
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
      label: label || ('Mục tiêu ' + (idx + 1)),
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
  var vipSkuSeen = {};
  if (!khMa || typeof getOrders !== 'function') return result;
  var normalizedKhMa = String(khMa).trim().toUpperCase();
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

window.CUS = CUS;
window.ROUTES = ROUTES;
window.VNM_APP_CODES = VNM_APP_CODES;
window.cusLoad = cusLoad;
window.cusSave = cusSave;
window.routesSave = routesSave;
window.cusResolveProductForOrderItem = cusResolveProductForOrderItem;
window.cusGetProductCode = cusGetProductCode;
window.cusGetProductName = cusGetProductName;
window.isVNMGiaiDoanProduct = isVNMGiaiDoanProduct;
window.classifyVIPProduct = classifyVIPProduct;
window.classifySBPSProduct = classifySBPSProduct;
window.cusGetOrderDay = cusGetOrderDay;
window.cusGetProgramCodes = cusGetProgramCodes;
window.cusAppCodesToPrograms = cusAppCodesToPrograms;
window.cusProgamsToAppCodes = cusProgamsToAppCodes;
window.cusDateToMonthKey = cusDateToMonthKey;
window.cusMonthLabelFromKey = cusMonthLabelFromKey;
window.cusCurrentMonthKey = cusCurrentMonthKey;
window.cusCurrentMonthLabel = cusCurrentMonthLabel;
window.cusEditableMetricValue = cusEditableMetricValue;
window.cusResolveMetricValue = cusResolveMetricValue;
window.cusNormalizeCustomProgress = cusNormalizeCustomProgress;
window.cusReadRawMonthData = cusReadRawMonthData;
window.cusAggregateOrdersMonth = cusAggregateOrdersMonth;
window.cusGetMonthData = cusGetMonthData;
