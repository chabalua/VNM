// ============================================================
// CUSTOMER UI MODULE — filters, forms, render, CRUD
// ============================================================

function getAppState() {
  if (!window.appState || typeof window.appState !== 'object') window.appState = {};
  return window.appState;
}

function getCustomerUIState() {
  var appState = getAppState();
  if (!appState.customerUI || typeof appState.customerUI !== 'object') {
    appState.customerUI = {
      filterRoute: '',
      filterQuery: '',
      editIdx: -1,
      viewMonthKey: '',
      expanded: {},
      inputMonthKey: ''
    };
  }
  return appState.customerUI;
}

function cusProgressValueText(value, unit) {
  return fmt(value) + (unit ? ' ' + escapeHtml(unit) : '');
}

function cusProgressBarHTML(label, pct, current, target, color, unit) {
  var pctClamped = Math.min(pct, 100);
  var pctDisplay = Math.round(pct);
  var barColor = pct >= 100 ? '#16a34a' : (pct >= 70 ? '#ca8a04' : color);
  var html = '<div style="margin-bottom:6px">';
  html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">';
  html += '<span style="font-size:10.5px;font-weight:700;color:var(--n2)">' + escapeHtml(label) + '</span>';
  html += '<span style="font-size:10.5px;font-weight:700;color:' + barColor + '">' + cusProgressValueText(current, unit) + '/' + cusProgressValueText(target, unit) + ' (' + pctDisplay + '%)</span>';
  html += '</div>';
  html += '<div style="height:6px;background:var(--n6);border-radius:3px;overflow:hidden">';
  html += '<div style="height:100%;width:' + pctClamped + '%;background:' + barColor + ';border-radius:3px;transition:width .3s"></div>';
  html += '</div></div>';
  return html;
}

function cusProgressRowsHTML(entries) {
  if (!entries.length) return '';
  var html = '<div style="background:var(--surface-accent);border-radius:10px;padding:10px 12px;border:1px dashed var(--preview-border)">';
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
    '<input type="text" class="custom-progress-input cp-label" placeholder="Tên mục tiêu, VD: Green Farm phân phối" value="' + escapeHtmlAttr(item.label || '') + '">' +
    '<input type="number" class="custom-progress-input cp-actual" placeholder="Thực hiện" value="' + (item.actual || '') + '" inputmode="numeric">' +
    '<input type="number" class="custom-progress-input cp-target" placeholder="Mục tiêu" value="' + (item.target || '') + '" inputmode="numeric">' +
    '<input type="text" class="custom-progress-input cp-unit" placeholder="Đơn vị" value="' + escapeHtmlAttr(item.unit || '') + '">' +
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
  var customerUIState = getCustomerUIState();
  var list = document.getElementById('custom-progress-list');
  if (!list) return;
  var wrapper = document.createElement('div');
  wrapper.innerHTML = cusCustomProgressRowHTML(entry);
  list.appendChild(wrapper.firstChild);
  list.querySelectorAll('input').forEach(function(input) {
    input.oninput = function() { cusPreviewDS(customerUIState.editIdx); };
  });
  cusPreviewDS(customerUIState.editIdx);
}

function cusRemoveProgressRow(btn) {
  var customerUIState = getCustomerUIState();
  var row = btn && btn.closest('.custom-progress-row');
  if (!row) return;
  row.remove();
  cusPreviewDS(customerUIState.editIdx);
}

function cusReopenInputDS(idx, monthKey) {
  cusInputDS(idx, cusDateToMonthKey(monthKey));
}

function cusToggleExpand(idx) {
  var customerUIState = getCustomerUIState();
  var kh = CUS[idx];
  if (!kh || !kh.ma) return;
  customerUIState.expanded[kh.ma] = !customerUIState.expanded[kh.ma];
  renderCusTab();
}

function cusSetViewMonth(monthKey) {
  var customerUIState = getCustomerUIState();
  customerUIState.viewMonthKey = cusDateToMonthKey(monthKey || cusCurrentMonthKey());
  renderCusTab();
}

function renderCusTabMobile() {
  var customerUIState = getCustomerUIState();
  var el = document.getElementById('kh-list');
  if (!el) return;
  var viewMonthKey = customerUIState.viewMonthKey || cusCurrentMonthKey();
  var filtered = CUS.filter(function(kh) {
    if (customerUIState.filterRoute && kh.tuyen !== customerUIState.filterRoute) return false;
    if (customerUIState.filterQuery) {
      var q = customerUIState.filterQuery.toLowerCase();
      return (kh.ma || '').toLowerCase().indexOf(q) >= 0 || (kh.ten || '').toLowerCase().indexOf(q) >= 0;
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

  var groups = {};
  filtered.forEach(function(kh) {
    var key = kh.tuyen || '_noRoute';
    if (!groups[key]) groups[key] = [];
    groups[key].push(kh);
  });

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
    var label = route ? escapeHtml(route.ten) : 'Chưa phân tuyến';
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
  var customerUIState = getCustomerUIState();
  monthKey = monthKey || customerUIState.viewMonthKey || cusCurrentMonthKey();
  var md = cusGetMonthData(kh, monthKey);
  var reward = calcTotalReward(kh, md);
  var vnmCodes = cusGetProgramCodes(kh, 'vnmShop');
  var vipCodes = cusGetProgramCodes(kh, 'vipShop');
  var sbpsCodes = cusGetProgramCodes(kh, 'sbpsShop');
  var vnmProg = cusProgressVNM(kh, md);
  var vipProg = cusProgressVIP(kh, md);
  var hasData = md.dsNhomC || md.dsNhomDE || md.dsSBPS;
  var expanded = !!customerUIState.expanded[kh.ma];
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
  html += '<span class="customer-toggle-icon">' + (window.renderIcon ? window.renderIcon(expanded ? 'chevron-down' : 'chevron-right', 13, 2.2) : (expanded ? '▾' : '▸')) + '</span>';
  html += '</button>';
  html += '<div class="customer-row-title">';
  html += '<div style="font-size:15px;font-weight:800;color:var(--n1);line-height:1.2">' + escapeHtml(kh.ten || kh.ma) + '</div>';
  html += '<div style="font-size:11px;color:var(--n3);margin-top:2px">' + escapeHtml(kh.ma) + (kh.diachi ? ' · ' + escapeHtml(kh.diachi) : '') + ' · ' + cusMonthLabelFromKey(monthKey) + '</div>';
  html += '<div class="customer-collapsed-summary">' + summaryParts.join(' · ') + '</div>';
  html += '</div>';
  html += '</div>';
  html += '<div class="customer-actions">';
  html += '<button onclick="cusInputDS(' + idx + ', \'' + monthKey + '\')" class="customer-action-btn"><span style="display:inline-flex;align-items:center;gap:4px">' + (window.renderIcon ? window.renderIcon('chart', 13, 2) : '') + 'Nhập DS</span></button>';
  html += '<button onclick="cusEdit(' + idx + ')" class="customer-icon-btn">' + (window.renderIcon ? window.renderIcon('edit', 15, 2) : '✏️') + '</button>';
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
    html += '<div style="background:var(--vmL);border-radius:10px;padding:10px 12px;border-left:3.5px solid var(--vm)">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px">';
    html += '<span style="font-size:12.5px;font-weight:800;color:var(--vm)">VNM Shop · Nhóm C</span>';
    if (vnmBBInfo) html += '<span style="font-size:10.5px;color:var(--vm);font-weight:600">TB: ' + fmt(vnmBBInfo.thuong) + 'đ</span>';
    html += '</div>';
    if (vnmCodes.length) html += '<div style="font-size:10.5px;color:var(--n3);margin-bottom:5px">Mã app: ' + escapeHtml(vnmCodes.join(', ')) + '</div>';
    var vnmParts = [];
    if (vnmBB) vnmParts.push('Bày bán: <b>' + vnmBB + '</b>' + (vnmBBInfo ? ' (DS≥' + fmt(vnmBBInfo.dsMin) + ')' : ''));
    if (vnmTL) vnmParts.push('Tích lũy: <b>Mức ' + vnmTL + '</b>' + (vnmTLInfo ? ' (CK ' + vnmTLInfo.ckDS + '%)' : ''));
    if (vnmParts.length) html += '<div style="font-size:10.5px;color:var(--n2);margin-bottom:5px">' + vnmParts.join(' · ') + '</div>';
    html += '<div style="font-size:10px;color:var(--n3);margin-bottom:5px">DS tháng ' + fmt(md.dsNhomC || 0) + 'đ · GĐ1 ' + fmt(md.dsGD1 || 0) + 'đ · GĐ2 ' + fmt(md.dsGD2 || 0) + 'đ · GĐ3 ' + fmt(md.dsGD3 || 0) + 'đ</div>';
    if (vnmProg) html += cusProgressBarHTML('Tiến độ DS', vnmProg.pct, vnmProg.ds, vnmProg.target, '#1A4DFF');
    if (reward.vnm && reward.vnm.total > 0) html += '<div style="font-size:11.5px;font-weight:700;color:var(--vm);margin-top:3px">→ Thưởng: ' + fmt(reward.vnm.total) + 'đ</div>';
    html += '</div>';
  }

  if (kh.programs && kh.programs.vipShop && kh.programs.vipShop.dangKy) {
    hasCT = true;
    var vipBB = kh.programs.vipShop.mucBayBan || '';
    var vipTL = kh.programs.vipShop.mucTichLuy || '';
    var vipBBInfo = VIP_SHOP_TRUNGBAY[vipBB];
    var vipTLInfo = VIP_SHOP_TICHLUY.find(function(t) { return t.muc === vipTL; });
    html += '<div style="background:var(--bL);border-radius:10px;padding:10px 12px;border-left:3.5px solid var(--b)">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px">';
    html += '<span style="font-size:12.5px;font-weight:800;color:var(--b)">VIP Shop · Nhóm DE</span>';
    if (vipBBInfo) html += '<span style="font-size:10.5px;color:var(--b);font-weight:600">TB: ' + fmt(kh.coTuVNM ? vipBBInfo.thuongVNM : vipBBInfo.thuongKH) + 'đ</span>';
    html += '</div>';
    if (vipCodes.length) html += '<div style="font-size:10.5px;color:var(--n3);margin-bottom:5px">Mã app: ' + escapeHtml(vipCodes.join(', ')) + '</div>';
    var vipParts = [];
    if (vipBB) vipParts.push('Tủ: <b>' + vipBB + '</b>' + (vipBBInfo ? ' (DS≥' + fmt(vipBBInfo.dsMin) + ', ≥' + vipBBInfo.skuMin + ' SKU)' : ''));
    if (vipTL) vipParts.push('CL: <b>' + vipTL + '</b>' + (vipTLInfo ? ' (N1 ' + vipTLInfo.ckN1 + '% / N2 ' + vipTLInfo.ckN2 + '%)' : ''));
    if (vipParts.length) html += '<div style="font-size:10.5px;color:var(--n2);margin-bottom:5px">' + vipParts.join(' · ') + '</div>';
    html += '<div style="font-size:10px;color:var(--n3);margin-bottom:5px">DS DE ' + fmt(md.dsNhomDE || 0) + 'đ · N1 ' + fmt(md.dsVipN1 || 0) + 'đ · N2 ' + fmt(md.dsVipN2 || 0) + 'đ · SKU D ' + fmt(md.skuNhomD || 0) + '</div>';
    if (vipProg) html += cusProgressBarHTML('Tiến độ DS', vipProg.pct, vipProg.ds, vipProg.target, '#2563EB');
    if (reward.vip && reward.vip.total > 0) html += '<div style="font-size:11.5px;font-weight:700;color:var(--b);margin-top:3px">→ Thưởng: ' + fmt(reward.vip.total) + 'đ</div>';
    html += '</div>';
  }

  if (kh.programs && kh.programs.sbpsShop && kh.programs.sbpsShop.dangKy) {
    hasCT = true;
    var sbpsMuc = kh.programs.sbpsShop.muc || '';
    var sbpsMucTB = kh.programs.sbpsShop.mucTrungBay || '';
    var sbpsInfo = SBPS_TICHLUY.find(function(t) { return t.muc === sbpsMuc; });
    var sbpsTBInfo = SBPS_TRUNGBAY[sbpsMucTB];
    html += '<div style="background:var(--goldL);border-radius:10px;padding:10px 12px;border-left:3.5px solid var(--gold)">';
    html += '<div style="font-size:12.5px;font-weight:800;color:var(--gold);margin-bottom:5px">SBPS · Sữa bột pha sẵn TE</div>';
    if (sbpsCodes.length) html += '<div style="font-size:10.5px;color:var(--n3);margin-bottom:5px">Mã app: ' + escapeHtml(sbpsCodes.join(', ')) + '</div>';
    html += '<div style="font-size:10.5px;color:var(--n2);margin-bottom:4px">';
    if (sbpsMucTB) html += 'Trưng bày: <b>' + sbpsMucTB + '</b>' + (sbpsTBInfo ? ' (DS≥' + fmt(sbpsTBInfo.dsMin) + ')' : '') + ' · ';
    html += 'Tích lũy: <b>Mức ' + sbpsMuc + '</b>';
    if (sbpsInfo) html += ' (DS≥' + fmt(sbpsInfo.dsMin) + ')';
    html += '</div>';
    html += '<div style="font-size:10px;color:var(--n3);margin-bottom:5px">DS tháng ' + fmt(md.dsSBPS || 0) + 'đ · N1 ' + fmt(md.sbpsN1 || 0) + 'đ · N2 ' + fmt(md.sbpsN2 || 0) + 'đ · N3 ' + fmt(md.sbpsN3 || 0) + 'đ · Đến 26 ' + fmt(md.sbpsTo26 || 0) + 'đ</div>';
    if (reward.sbps && reward.sbps.total > 0) html += '<div style="font-size:11.5px;font-weight:700;color:var(--gold);margin-top:3px">→ Thưởng: ' + fmt(reward.sbps.total) + 'đ</div>';
    html += '</div>';
  }

  if (!hasCT) html += '<div style="font-size:11px;color:var(--n3);font-style:italic">Chưa đăng ký CT nào. Nhấn ✏️ để setup.</div>';
  if (md.customProgress && md.customProgress.length) html += cusProgressRowsHTML(md.customProgress);
  html += '</div>';

  if (reward.totalReward > 0) {
    html += '<div style="display:flex;justify-content:space-between;align-items:center;background:linear-gradient(135deg,var(--vm),var(--vm2));color:#fff;border-radius:10px;padding:10px 14px;margin-top:8px;box-shadow:0 2px 8px rgba(26,77,255,.18)">';
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

function cusInputField(id, label, value, autoValue) {
  var placeholder = (autoValue || autoValue === 0) ? ('Tự lấy từ đơn: ' + fmt(autoValue)) : '0';
  return '<div style="margin-bottom:8px"><div style="font-size:10.5px;color:var(--n3);margin-bottom:3px">' + label + '</div><input type="number" id="' + id + '" value="' + escapeHtmlAttr(value || '') + '" placeholder="' + escapeHtmlAttr(placeholder) + '" inputmode="numeric" style="width:100%;height:40px;border:1.5px solid var(--n5);border-radius:var(--Rs);padding:0 12px;font-size:16px;font-weight:700;color:var(--n1)"></div>';
}

function cusReadDS() {
  var gn = function(id) {
    var raw = ((document.getElementById(id) || {}).value || '').trim();
    if (raw === '') return null;
    return parseInt(raw, 10) || 0;
  };
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
    sbpsTrungBay: c('cds-trungbay-sbps'),
    manualDsSBPS: gn('cds-sbps'),
    sbpsN1: gn('cds-sbps-n1'),
    sbpsN2: gn('cds-sbps-n2'),
    sbpsN3: gn('cds-sbps-n3'),
    sbpsTo26: gn('cds-sbps-26'),
    customProgress: cusReadCustomProgressRows()
  };
}

function cusPreviewDS(idx) {
  var customerUIState = getCustomerUIState();
  var kh = CUS[idx];
  if (!kh) return;
  var mk = customerUIState.inputMonthKey || cusCurrentMonthKey();
  var raw = cusReadDS();
  var currentRaw = cusReadRawMonthData(kh, mk);
  var previewRaw = Object.assign({}, currentRaw, raw);
  var md = cusGetMonthData({ ma: kh.ma, monthly: (function() { var temp = {}; temp[mk] = previewRaw; return temp; })() }, mk);
  var reward = calcTotalReward(kh, md);
  var el = document.getElementById('cds-preview');
  if (!el) return;
  var html = '<div style="background:var(--vmL);border:1px solid #C9D7FF;border-radius:var(--Rs);padding:12px 14px">';
  html += '<div style="font-size:12px;font-weight:700;color:var(--vm);margin-bottom:8px">🔍 Dự tính thưởng</div>';
  if (reward.vnm && reward.vnm.total > 0) html += '<div style="font-size:11px;color:var(--n2);margin-bottom:4px"><b style="color:var(--vm)">VNM Shop:</b> ' + fmt(reward.vnm.total) + 'đ</div><div style="font-size:9.5px;color:var(--n3);margin-bottom:6px">' + reward.vnm.details.join(' · ') + '</div>';
  if (reward.vip && reward.vip.total > 0) html += '<div style="font-size:11px;color:var(--n2);margin-bottom:4px"><b style="color:var(--b)">VIP Shop:</b> ' + fmt(reward.vip.total) + 'đ</div><div style="font-size:9.5px;color:var(--n3);margin-bottom:6px">' + reward.vip.details.join(' · ') + '</div>';
  if (reward.sbps && reward.sbps.total > 0) html += '<div style="font-size:11px;color:var(--n2);margin-bottom:4px"><b style="color:var(--gold)">SBPS:</b> ' + fmt(reward.sbps.total) + 'đ</div><div style="font-size:9.5px;color:var(--n3);margin-bottom:6px">' + reward.sbps.details.join(' · ') + '</div>';
  if (md.customProgress && md.customProgress.length) html += cusProgressRowsHTML(md.customProgress);
  html += '<div style="border-top:1px solid #C9D7FF;padding-top:8px;margin-top:4px;display:flex;justify-content:space-between"><span style="font-size:14px;font-weight:800;color:var(--vm)">TỔNG THƯỞNG</span><span style="font-size:18px;font-weight:900;color:var(--vm)">' + fmt(reward.totalReward) + 'đ</span></div>';
  if (reward.dsTotal > 0 && reward.totalReward > 0) html += '<div style="font-size:10.5px;color:var(--b);margin-top:5px">≈ Giảm thêm ' + (reward.totalReward / reward.dsTotal * 100).toFixed(1) + '% trên DS ' + fmt(reward.dsTotal) + 'đ</div>';
  html += '</div>';
  el.innerHTML = html;
}

function cusInputDS(idx, monthKey) {
  var customerUIState = getCustomerUIState();
  var kh = CUS[idx];
  if (!kh) return;
  customerUIState.editIdx = idx;
  customerUIState.inputMonthKey = cusDateToMonthKey(monthKey || cusCurrentMonthKey());
  var mk = customerUIState.inputMonthKey;
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
    html += '<div class="kf"><div class="kfl" style="color:var(--vm)">📦 NHÓM C (VNM Shop)</div>';
    html += cusInputField('cds-c', 'DS nhóm C tháng', cusEditableMetricValue(rawMd, 'dsNhomC'), auto.dsNhomC);
    html += cusInputField('cds-gd1', 'DS GĐ1 (1-10)', cusEditableMetricValue(rawMd, 'dsGD1'), auto.dsGD1);
    html += cusInputField('cds-gd2', 'DS GĐ2 (11-20)', cusEditableMetricValue(rawMd, 'dsGD2'), auto.dsGD2);
    html += cusInputField('cds-gd3', 'DS GĐ3 (21-27)', cusEditableMetricValue(rawMd, 'dsGD3'), auto.dsGD3);
    html += '<label style="font-size:12px;display:flex;align-items:center;gap:6px;margin-top:8px"><input type="checkbox" id="cds-trungbay-vnm" ' + (md.vnmShopTrungBay ? 'checked' : '') + ' style="width:20px;height:20px;accent-color:var(--vm)"> Đạt trưng bày VNM Shop</label></div>';
  }
  if (kh.programs && kh.programs.vipShop && kh.programs.vipShop.dangKy) {
    html += '<div class="kf"><div class="kfl" style="color:var(--b)">🧊 NHÓM DE (VIP Shop)</div>';
    html += cusInputField('cds-de', 'DS nhóm DE tháng', cusEditableMetricValue(rawMd, 'dsNhomDE'), auto.dsNhomDE);
    html += cusInputField('cds-vn1', 'DS SP Chủ lực (N1)', cusEditableMetricValue(rawMd, 'dsVipN1'), auto.dsVipN1);
    html += cusInputField('cds-vn2', 'DS SP Tập trung (N2)', cusEditableMetricValue(rawMd, 'dsVipN2'), auto.dsVipN2);
    html += cusInputField('cds-skud', 'Số SKU nhóm D', cusEditableMetricValue(rawMd, 'skuNhomD'), auto.skuNhomD);
    html += '<label style="font-size:12px;display:flex;align-items:center;gap:6px;margin-top:8px"><input type="checkbox" id="cds-trungbay-vip" ' + (md.vipShopTrungBay ? 'checked' : '') + ' style="width:20px;height:20px;accent-color:var(--b)"> Đạt trưng bày VIP Shop</label></div>';
  }
  if (kh.programs && kh.programs.sbpsShop && kh.programs.sbpsShop.dangKy) {
    html += '<div class="kf"><div class="kfl" style="color:var(--gold)">🍼 SBPS TE</div>';
    html += cusInputField('cds-sbps', 'DS SBPS tháng', cusEditableMetricValue(rawMd, 'dsSBPS'), auto.dsSBPS);
    html += cusInputField('cds-sbps-n1', 'DS SBPS N1 (DG/GP/A2)', cusEditableMetricValue(rawMd, 'sbpsN1'), auto.sbpsN1);
    html += cusInputField('cds-sbps-n2', 'DS SBPS N2 (OG/DGP)', cusEditableMetricValue(rawMd, 'sbpsN2'), auto.sbpsN2);
    html += cusInputField('cds-sbps-n3', 'DS SBPS N3 (Yoko/OC)', cusEditableMetricValue(rawMd, 'sbpsN3'), auto.sbpsN3);
    html += cusInputField('cds-sbps-26', 'DS đến ngày 26', cusEditableMetricValue(rawMd, 'sbpsTo26'), auto.sbpsTo26);
    if (kh.programs.sbpsShop.mucTrungBay) html += '<label style="font-size:12px;display:flex;align-items:center;gap:6px;margin-top:8px"><input type="checkbox" id="cds-trungbay-sbps" ' + (md.sbpsTrungBay ? 'checked' : '') + ' style="width:20px;height:20px;accent-color:var(--gold)"> Đạt trưng bày SBPS (' + kh.programs.sbpsShop.mucTrungBay + ')</label>';
    html += '</div>';
  }
  html += '<div class="kf"><div class="kfl" style="color:var(--g)">🎯 TIẾN ĐỘ TÙY CHỈNH</div><div style="font-size:11px;color:var(--n3);margin-bottom:8px">Để trống doanh số tự lấy theo đơn hàng của cửa hàng trong tháng này.</div><div id="custom-progress-list"></div><button type="button" class="btn-atr" onclick="cusAddProgressRow()">+ Thêm mục tiêu tiến độ</button></div>';
  html += '<div id="cds-preview" style="margin-top:12px"></div>';
  html += '<button class="btn-km-save" onclick="cusSaveDS(' + idx + ')">💾 Lưu doanh số</button>';
  body.innerHTML = html;
  (md.customProgress || []).forEach(function(entry) { cusAddProgressRow(entry); });
  body.querySelectorAll('input').forEach(function(inp) { inp.addEventListener('input', function() { cusPreviewDS(idx); }); });
  cusPreviewDS(idx);
}

function cusSaveDS(idx) {
  var customerUIState = getCustomerUIState();
  var kh = CUS[idx];
  if (!kh) return;
  var mk = customerUIState.inputMonthKey || cusCurrentMonthKey();
  if (!kh.monthly) kh.monthly = {};
  kh.monthly[mk] = Object.assign({}, kh.monthly[mk] || {}, cusReadDS());
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

function cusFormField(id, label, value, readonly) {
  return '<div style="margin-bottom:8px"><div style="font-size:10.5px;color:var(--n3);margin-bottom:3px">' + label + '</div><input type="text" id="' + id + '" value="' + escapeHtmlAttr(value || '') + '"' + (readonly ? ' readonly' : '') + ' style="width:100%;height:40px;border:1.5px solid var(--n5);border-radius:var(--Rs);padding:0 12px;font-size:15px;color:var(--n1);' + (readonly ? 'background:var(--n6);color:var(--n3);' : '') + '"></div>';
}

function cusEdit(idx) {
  var customerUIState = getCustomerUIState();
  customerUIState.editIdx = idx;
  var kh = CUS[idx] || {};
  var modal = document.getElementById('km-modal');
  document.getElementById('km-modal-t').textContent = idx >= 0 && CUS[idx] ? 'Sửa KH: ' + (kh.ten || kh.ma) : 'Thêm khách hàng';
  modal.style.display = 'block';
  var body = document.getElementById('km-modal-body');
  var html = '';
  html += '<div class="kf"><div class="kfl">THÔNG TIN CƠ BẢN</div>';
  html += cusFormField('ckh-ma', 'Mã KH', kh.ma || '', idx >= 0 && CUS[idx]);
  html += cusFormField('ckh-ten', 'Tên cửa hàng', kh.ten || '');
  html += cusFormField('ckh-diachi', 'Địa chỉ', kh.diachi || '');
  html += cusFormField('ckh-sdt', 'SĐT', kh.sdt || '');
  html += '<div style="margin-bottom:8px"><div style="font-size:10.5px;color:var(--n3);margin-bottom:3px">Tuyến bán hàng</div><select id="ckh-tuyen" style="width:100%;height:40px;border:1.5px solid var(--n5);border-radius:var(--Rs);padding:0 12px;font-size:14px"><option value="">— Chưa phân tuyến —</option>';
  ROUTES.forEach(function(r) { html += '<option value="' + escapeHtmlAttr(r.id) + '"' + (kh.tuyen === r.id ? ' selected' : '') + '>' + escapeHtml(r.ten) + '</option>'; });
  html += '</select></div>';
  html += '<div style="margin-bottom:8px"><div style="font-size:10.5px;color:var(--n3);margin-bottom:3px">Loại cửa hàng</div><select id="ckh-loai" style="width:100%;height:40px;border:1.5px solid var(--n5);border-radius:var(--Rs);padding:0 12px;font-size:14px">';
  ['tapHoa', 'shopSua', 'sieuThiMini', 'daiLy'].forEach(function(v) {
    var labels = { tapHoa: 'Tạp hóa', shopSua: 'Shop sữa', sieuThiMini: 'Siêu thị mini', daiLy: 'Đại lý' };
    html += '<option value="' + v + '"' + (kh.loaiCH === v ? ' selected' : '') + '>' + labels[v] + '</option>';
  });
  html += '</select></div></div>';
  html += '<div class="kf"><div class="kfl">THIẾT BỊ BÁN HÀNG</div>';
  html += '<label style="font-size:12px;display:flex;align-items:center;gap:6px;margin-bottom:8px"><input type="checkbox" id="ckh-tu" ' + (kh.coTuVNM ? 'checked' : '') + ' style="width:20px;height:20px;accent-color:var(--vm)"> Có tủ mát VNM</label>';
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><div><div style="font-size:10px;color:var(--n3)">Loại tủ</div><select id="ckh-loaitu" style="width:100%;height:38px;border:1.5px solid var(--n5);border-radius:var(--Rs);padding:0 8px;font-size:13px"><option value="">Không</option><option value="1canh"' + (kh.loaiTu === '1canh' ? ' selected' : '') + '>1 cánh</option><option value="2canh"' + (kh.loaiTu === '2canh' ? ' selected' : '') + '>2 cánh</option><option value="honhop"' + (kh.loaiTu === 'honhop' ? ' selected' : '') + '>Hỗn hợp</option></select></div>';
  html += '<div><div style="font-size:10px;color:var(--n3)">Dung tích (L)</div><input type="number" id="ckh-dungtich" value="' + escapeHtmlAttr(kh.dungTichTu || '') + '" style="width:100%;height:38px;border:1.5px solid var(--n5);border-radius:var(--Rs);padding:0 8px;font-size:13px"></div></div>';
  html += '<label style="font-size:12px;display:flex;align-items:center;gap:6px;margin-top:10px;margin-bottom:8px"><input type="checkbox" id="ckh-ke" ' + (kh.coKe ? 'checked' : '') + ' style="width:20px;height:20px;accent-color:var(--vm)"> Có kệ VNM</label>';
  html += '<select id="ckh-loaike" style="width:100%;height:38px;border:1.5px solid var(--n5);border-radius:var(--Rs);padding:0 8px;font-size:13px"><option value="">Không</option>';
  Object.keys(VNM_SHOP_TRUNGBAY).forEach(function(m) { html += '<option value="' + escapeHtmlAttr(m) + '"' + (kh.loaiKe === m ? ' selected' : '') + '>' + escapeHtml(m) + ' — ' + escapeHtml(VNM_SHOP_TRUNGBAY[m].ten) + '</option>'; });
  html += '</select></div>';
  html += '<div class="kf"><div class="kfl" style="color:var(--vm)">📋 CHƯƠNG TRÌNH THAM GIA</div>';
  html += '<div style="font-size:11px;color:var(--n3);margin-bottom:10px">Nhìn vào app Vinamilk → nhập đúng Mã CT và Mức như trên app. Hệ thống tự tính thưởng.</div>';
  html += '<div style="font-size:10.5px;color:var(--n2);display:grid;grid-template-columns:1fr 1fr 60px 32px;gap:6px;margin-bottom:4px;font-weight:700">';
  html += '<span>Mã CT (app)</span><span>Mức</span><span style="text-align:center">Ngày ĐK</span><span></span></div>';
  html += '<div id="appc-list"></div>';
  html += '<button type="button" onclick="cusAddAppCodeRow()" style="width:100%;height:38px;background:var(--n6);border:1.5px dashed var(--n4);border-radius:var(--Rs);font-size:13px;font-weight:600;color:var(--vm);cursor:pointer;margin-top:4px">+ Thêm mã CT từ app</button></div>';
  html += '<div class="kf"><div class="kfl">GHI CHÚ</div><textarea id="ckh-ghichu" placeholder="Ghi chú về KH..." style="width:100%;height:60px;border:1.5px solid var(--n5);border-radius:var(--Rs);padding:10px 12px;font-size:13px;color:var(--n1);resize:vertical">' + escapeHtml(kh.ghiChu || '') + '</textarea></div>';
  html += '<button class="btn-km-save" onclick="cusSaveForm()">' + (idx >= 0 && CUS[idx] ? '💾 Cập nhật KH' : '✓ Thêm KH') + '</button>';
  if (idx >= 0 && CUS[idx]) html += '<button onclick="cusDel(' + idx + ')" style="width:100%;height:42px;background:none;color:var(--r);border:1.5px solid var(--r);border-radius:var(--R);font-size:13px;font-weight:600;cursor:pointer;margin-top:8px">✕ Xóa khách hàng</button>';
  body.innerHTML = html;
  var existingCodes = cusProgamsToAppCodes(kh);
  existingCodes.forEach(function(ac) { cusAddAppCodeRow(ac); });
}

function cusSaveForm() {
  var g = function(id) { return (document.getElementById(id) || {}).value || ''; };
  var c = function(id) { return (document.getElementById(id) || {}).checked || false; };
  var n = function(id) { return parseInt(g(id), 10) || 0; };
  var ma = g('ckh-ma').trim().toUpperCase();
  if (!ma) { showToast('Nhập mã KH'); return; }
  var _appCodes = cusReadAppCodes();
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
    appCodes: _appCodes,
    programs: cusAppCodesToPrograms(_appCodes),
    monthly: {}
  };
  if (window.markEntityUpdated) markEntityUpdated(kh);
  var customerUIState = getCustomerUIState();
  if (customerUIState.editIdx >= 0 && CUS[customerUIState.editIdx]) {
    kh.monthly = CUS[customerUIState.editIdx].monthly || {};
    CUS[customerUIState.editIdx] = kh;
  } else {
    if (CUS.find(function(k) { return k.ma === ma; })) {
      showToast('Mã KH đã tồn tại!');
      return;
    }
    CUS.push(kh);
  }
  cusSave();
  if (window.syncAutoPushFile) syncAutoPushFile('customers.json');
  document.getElementById('km-modal').style.display = 'none';
  renderCusTab();
  showToast('✅ Đã lưu: ' + (kh.ten || kh.ma));
}

function cusDel(idx) {
  var kh = CUS[idx];
  if (!kh) return;
  if (window.syncTrackEntityDeletion) syncTrackEntityDeletion('customers.json', kh);
  CUS.splice(idx, 1);
  cusSave();
  if (window.syncAutoPushFile) syncAutoPushFile('customers.json');
  document.getElementById('km-modal').style.display = 'none';
  renderCusTab();
}

function cusExport() {
  var data = { customers: CUS, routes: ROUTES };
  var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'vnm_customers_' + new Date().toISOString().slice(0, 10) + '.json';
  a.click();
  URL.revokeObjectURL(url);
  showToast('✅ Đã xuất ' + CUS.length + ' KH + ' + ROUTES.length + ' tuyến');
}

function cusImport() {
  var input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json';
  input.onchange = function(e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(ev) {
      try {
        var data = JSON.parse(ev.target.result);
        if (!data || typeof data !== 'object') throw new Error('File khách hàng không hợp lệ');
        var replace = true;
        if (data.customers) {
          if (!Array.isArray(data.customers)) throw new Error('Danh sách khách hàng không hợp lệ');
          var newCus = typeof sanitizeCustomerList === 'function' ? sanitizeCustomerList(data.customers, 'import customers') : data.customers;
          if (data.customers.length && !newCus.length) throw new Error('Không có khách hàng hợp lệ để nhập');
          if (replace) CUS = newCus;
          else newCus.forEach(function(k) { var ex = CUS.find(function(cus) { return cus.ma === k.ma; }); if (ex) Object.assign(ex, k); else CUS.push(k); });
          cusSave();
          if (window.syncAutoPushFile) syncAutoPushFile('customers.json');
        }
        if (data.routes) {
          if (!Array.isArray(data.routes)) throw new Error('Danh sách tuyến không hợp lệ');
          var newRoutes = typeof sanitizeRouteList === 'function' ? sanitizeRouteList(data.routes, 'import routes') : data.routes;
          if (data.routes.length && !newRoutes.length) throw new Error('Không có tuyến hợp lệ để nhập');
          ROUTES = newRoutes;
          routesSave();
          if (window.syncAutoPushFile) syncAutoPushFile('routes.json');
        }
        renderCusTab();
        showToast('✅ Đã nhập ' + (data.customers ? data.customers.length : 0) + ' KH');
      } catch (e2) {
        showToast('Lỗi: ' + e2.message);
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

function cusManageRoutes() {
  var modal = document.getElementById('km-modal');
  document.getElementById('km-modal-t').textContent = '📍 Quản lý tuyến bán hàng';
  modal.style.display = 'block';
  var body = document.getElementById('km-modal-body');
  var html = '<div id="routes-list">';
  ROUTES.forEach(function(r, i) {
    html += '<div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;padding:10px;background:var(--n6);border-radius:var(--Rs)"><div style="flex:1"><div style="font-size:13px;font-weight:700">' + escapeHtml(r.ten) + '</div><div style="font-size:10.5px;color:var(--n3)">' + escapeHtml(r.id) + (r.mota ? ' · ' + escapeHtml(r.mota) : '') + '</div></div><button onclick="cusDelRoute(' + i + ')" style="border:none;background:none;color:var(--r);font-size:14px;cursor:pointer;padding:4px">✕</button></div>';
  });
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
  ROUTES.push(route);
  routesSave();
  if (window.syncAutoPushFile) syncAutoPushFile('routes.json');
  cusManageRoutes();
  renderCusTab();
}

function cusDelRoute(i) {
  var route = ROUTES[i];
  if (route && window.syncTrackEntityDeletion) syncTrackEntityDeletion('routes.json', route);
  ROUTES.splice(i, 1);
  routesSave();
  if (window.syncAutoPushFile) syncAutoPushFile('routes.json');
  cusManageRoutes();
  renderCusTab();
}

function cusFilterRoute(routeId) { var customerUIState = getCustomerUIState(); customerUIState.filterRoute = routeId; renderCusTab(); }
function cusFilterSearch(q) { var customerUIState = getCustomerUIState(); customerUIState.filterQuery = (q || '').trim(); renderCusTab(); }

function renderCusTab() {
  if (typeof getLayoutMode === 'function' && getLayoutMode() === 'desktop') return renderCusTabDesktop();
  return renderCusTabMobile();
}

function renderCusTabDesktop() {
  var customerUIState = getCustomerUIState();
  var el = document.getElementById('kh-list');
  if (!el) return;
  var viewMonthKey = customerUIState.viewMonthKey || cusCurrentMonthKey();
  var totalKH = CUS.length;
  var totalVNM = CUS.filter(function(k) { return k.programs && k.programs.vnmShop && k.programs.vnmShop.dangKy; }).length;
  var totalVIP = CUS.filter(function(k) { return k.programs && k.programs.vipShop && k.programs.vipShop.dangKy; }).length;
  var totalSBPS = CUS.filter(function(k) { return k.programs && k.programs.sbpsShop && k.programs.sbpsShop.dangKy; }).length;
  var totalNormal = totalKH - totalVNM - totalVIP - totalSBPS;

  var filtered = CUS.filter(function(kh) {
    if (customerUIState.filterRoute && kh.tuyen !== customerUIState.filterRoute) return false;
    if (customerUIState.filterQuery) {
      var q = customerUIState.filterQuery.toLowerCase();
      return (kh.ma || '').toLowerCase().indexOf(q) >= 0 || (kh.ten || '').toLowerCase().indexOf(q) >= 0;
    }
    return true;
  });

  var html = '';
  html += '<div style="padding:20px 32px 18px;border-bottom:1px solid var(--border);background:var(--bg)">';
  html += '  <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px">';
  html += '    <div>';
  html += '      <div style="font-size:11.5px;color:var(--text-tertiary);font-weight:500;letter-spacing:.04em;text-transform:uppercase;margin-bottom:4px">Tuyến và độ phủ</div>';
  html += '      <h1 style="margin:0;font-size:22px;font-weight:600;color:var(--text);letter-spacing:-0.02em;line-height:1.2">Khách hàng</h1>';
  html += '      <div style="font-size:13px;color:var(--text-secondary);margin-top:6px">' + totalKH + ' khách · ' + totalVNM + ' VNM Shop · ' + totalVIP + ' VIP Shop · ' + totalSBPS + ' SBPS</div>';
  html += '    </div>';
  html += '    <div style="display:flex;align-items:center;gap:8px">';
  html += '      <button onclick="cusManageRoutes()" style="height:32px;padding:0 12px;border:1px solid var(--border);border-radius:6px;background:var(--surface);color:var(--text);font-size:12px;font-weight:500;cursor:pointer">📍 Tuyến</button>';
  html += '    </div>';
  html += '  </div>';
  html += '</div>';

  html += '<div style="flex:1;display:flex;min-height:0">';
  html += '  <div style="width:220px;flex-shrink:0;border-right:1px solid var(--border);background:var(--surface);padding:16px;overflow-y:auto">';
  html += '    <div style="font-size:11px;font-weight:600;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">Tuyến</div>';
  var allRoutes = ROUTES.map(function(r) { return r; });
  allRoutes.unshift({ id: '', ten: 'Tất cả' });
  allRoutes.push({ id: '_noRoute', ten: 'Chưa phân tuyến' });
  allRoutes.forEach(function(r) {
    var c = r.id === '' ? CUS.length : (r.id === '_noRoute' ? CUS.filter(function(k) { return !k.tuyen; }).length : CUS.filter(function(k) { return k.tuyen === r.id; }).length);
    var active = (customerUIState.filterRoute || '') === r.id;
    if (active) html += '    <div style="display:flex;justify-content:space-between;align-items:center;padding:7px 9px;border-radius:6px;margin-bottom:1px;background:var(--orangeL);color:var(--orange);font-size:12.5px;font-weight:600;cursor:pointer" onclick="cusFilterRoute(\'\')">';
    else html += '    <div style="display:flex;justify-content:space-between;align-items:center;padding:7px 9px;border-radius:6px;margin-bottom:1px;color:var(--text-secondary);font-size:12.5px;font-weight:500;cursor:pointer" onclick="cusFilterRoute(\'' + r.id + '\')">';
    html += '      <span>' + escapeHtml(r.ten) + '</span>';
    html += '      <span style="font-size:11px;opacity:.7;font-variant-numeric:tabular-nums">' + c + '</span>';
    html += '    </div>';
  });
  html += '    <div style="font-size:11px;font-weight:600;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:.05em;margin:18px 0 8px">Loại KH</div>';
  html += '    <div style="display:flex;justify-content:space-between;align-items:center;padding:7px 9px;border-radius:6px;margin-bottom:1px;font-size:12.5px;font-weight:500;color:var(--text-secondary);cursor:pointer"><span style="display:inline-flex;align-items:center;gap:6px"><span style="width:8px;height:8px;border-radius:2px;background:#10b981"></span>VNM Shop</span><span style="font-size:11px;opacity:.7">' + totalVNM + '</span></div>';
  html += '    <div style="display:flex;justify-content:space-between;align-items:center;padding:7px 9px;border-radius:6px;margin-bottom:1px;font-size:12.5px;font-weight:500;color:var(--text-secondary);cursor:pointer"><span style="display:inline-flex;align-items:center;gap:6px"><span style="width:8px;height:8px;border-radius:2px;background:#3b82f6"></span>VIP Shop</span><span style="font-size:11px;opacity:.7">' + totalVIP + '</span></div>';
  html += '    <div style="display:flex;justify-content:space-between;align-items:center;padding:7px 9px;border-radius:6px;margin-bottom:1px;font-size:12.5px;font-weight:500;color:var(--text-secondary);cursor:pointer"><span style="display:inline-flex;align-items:center;gap:6px"><span style="width:8px;height:8px;border-radius:2px;background:#f59e0b"></span>SBPS</span><span style="font-size:11px;opacity:.7">' + totalSBPS + '</span></div>';
  html += '    <div style="display:flex;justify-content:space-between;align-items:center;padding:7px 9px;border-radius:6px;margin-bottom:1px;font-size:12.5px;font-weight:500;color:var(--text-secondary);cursor:pointer"><span style="display:inline-flex;align-items:center;gap:6px"><span style="width:8px;height:8px;border-radius:2px;background:#8b5cf6"></span>KH Thường</span><span style="font-size:11px;opacity:.7">' + totalNormal + '</span></div>';
  html += '  </div>';

  html += '  <div style="flex:1;overflow:auto;padding:24px;min-width:0">';
  html += '    <div style="display:flex;gap:10px;margin-bottom:16px">';
  html += '      <div style="flex:1;position:relative">';
  html += '        <span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);font-size:14px;color:var(--text-tertiary)">🔍</span>';
  html += '        <input type="text" placeholder="Tìm KH theo tên, mã..." value="' + (customerUIState.filterQuery || '') + '" oninput="cusFilterSearch(this.value)" style="width:100%;height:34px;border:1px solid var(--border);border-radius:8px;background:var(--surface);padding:0 12px 0 34px;font-size:13px;color:var(--text);outline:none">';
  html += '      </div>';
  html += '      <label style="display:flex;align-items:center;gap:8px;font-size:12px;font-weight:500;color:var(--text-secondary)">Tháng: <input type="month" value="' + viewMonthKey + '" onchange="cusSetViewMonth(this.value)" style="height:34px;border:1px solid var(--border);border-radius:8px;padding:0 10px;font-size:12px"></label>';
  html += '    </div>';
  html += '    <div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;overflow:hidden">';
  html += '      <div style="display:grid;grid-template-columns:1fr 110px 110px 130px 100px 100px;gap:14px;padding:10px 16px;border-bottom:1px solid var(--border-subtle);font-size:11px;font-weight:600;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:.05em;background:var(--surface-muted)">';
  html += '        <div>Khách hàng</div><div>Mã KH</div><div>Khu vực</div><div>Loại</div><div>K/H hoạch</div><div style="text-align:right">Thao tác</div>';
  html += '      </div>';
  if (!filtered.length) html += '      <div style="padding:40px;text-align:center;color:var(--text-secondary);font-size:14px">Không tìm thấy khách hàng nào.</div>';

  filtered.forEach(function(kh, displayIdx) {
    var md = cusGetMonthData(kh, viewMonthKey);
    var route = ROUTES.find(function(r) { return r.id === kh.tuyen; });
    var area = route ? route.ten : 'Chưa phân';
    var tags = [];
    if (kh.programs && kh.programs.vnmShop && kh.programs.vnmShop.dangKy) tags.push({ n: 'VNM', c: 'var(--green-soft)', f: 'var(--green)' });
    if (kh.programs && kh.programs.vipShop && kh.programs.vipShop.dangKy) tags.push({ n: 'VIP', c: 'var(--blue-soft)', f: 'var(--blue)' });
    if (kh.programs && kh.programs.sbpsShop && kh.programs.sbpsShop.dangKy) tags.push({ n: 'SBPS', c: 'var(--orange-soft)', f: 'var(--orange)' });
    var tagHtml = tags.map(function(t) { return '<span style="display:inline-flex;align-items:center;height:20px;padding:0 7px;background:' + t.c + ';color:' + t.f + ';border-radius:5px;font-size:10.5px;font-weight:600;margin-right:4px">' + t.n + '</span>'; }).join('');
    var bgStyle = displayIdx % 2 === 0 ? 'background:transparent' : 'background:var(--surface-muted)';
    var idx = CUS.indexOf(kh);
    html += '      <div style="display:grid;grid-template-columns:1fr 110px 110px 130px 100px 100px;gap:14px;padding:12px 16px;align-items:center;border-top:' + (displayIdx === 0 ? 'none' : '1px solid var(--border-subtle)') + ';' + bgStyle + '">';
    var initials = (kh.ten || '').split(' ').slice(-2).map(function(w) { return w[0]; }).join('').toUpperCase().slice(0, 2) || 'KH';
    html += '        <div style="display:flex;align-items:center;gap:10px;min-width:0">';
    html += '          <div style="width:30px;height:30px;border-radius:8px;background:var(--orangeL);color:var(--orange);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;flex-shrink:0">' + escapeHtml(initials) + '</div>';
    html += '          <div style="min-width:0">';
    html += '            <div style="font-size:13px;font-weight:600;color:var(--text);letter-spacing:-0.005em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:pointer" onclick="cusToggleExpand(' + idx + ')">' + escapeHtml(kh.ten) + '</div>';
    html += '            <div style="font-size:11px;color:var(--text-tertiary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + escapeHtml(kh.diachi || '') + '</div>';
    html += '          </div>';
    html += '        </div>';
    html += '        <div style="font-size:11px;font-family:monospace;color:var(--text-secondary);cursor:pointer" onclick="cusEdit(' + idx + ')">' + escapeHtml(kh.ma) + '</div>';
    html += '        <div style="font-size:12.5px;color:var(--text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + escapeHtml(area) + '</div>';
    html += '        <div>' + tagHtml + '</div>';
    var progHtml = (md.dsNhomC || 0) > 0 ? ('<span style="font-size:12px;color:var(--green)">Đã nhập</span>') : '<span style="font-size:12px;color:var(--text-tertiary)">-</span>';
    html += '        <div>' + progHtml + '</div>';
    html += '        <div style="text-align:right;white-space:nowrap">';
    html += '          <button onclick="cusInputDS(' + idx + ', \'' + viewMonthKey + '\')" style="font-size:12px;padding:4px 8px;border-radius:4px;background:var(--orangeL);color:var(--orange);border:1px solid var(--orangeMid);font-weight:600;cursor:pointer;margin-right:2px;display:inline-flex;align-items:center;gap:3px">' + (window.renderIcon ? window.renderIcon('chart', 13, 2) : '📊') + ' DS</button>';
    html += '          <button onclick="cusEdit(' + idx + ')" style="font-size:12px;padding:4px 8px;border-radius:4px;background:var(--surface);color:var(--text-secondary);border:1px solid var(--border);cursor:pointer;display:inline-flex;align-items:center">' + (window.renderIcon ? window.renderIcon('edit', 13, 2) : '✏️') + '</button>';
    html += '        </div>';
    html += '      </div>';
    if (customerUIState.expanded[kh.ma]) {
      var reward = calcTotalReward(kh, md);
      html += '<div style="padding:16px;background:var(--bg);border-top:1px dashed var(--border-subtle);border-bottom:1px solid var(--border);font-size:13px">';
      html += '<b>Thưởng dự kiến tháng:</b> ' + fmt(reward.totalReward) + 'đ<br/>';
      if (kh.programs && kh.programs.vnmShop && kh.programs.vnmShop.dangKy) html += '- Nhóm C: ' + fmt(md.dsNhomC || 0) + '<br/>';
      if (kh.programs && kh.programs.vipShop && kh.programs.vipShop.dangKy) html += '- Nhóm DE: ' + fmt(md.dsNhomDE || 0) + '<br/>';
      if (kh.programs && kh.programs.sbpsShop && kh.programs.sbpsShop.dangKy) html += '- Nhóm SBPS: ' + fmt(md.dsSBPS || 0) + '<br/>';
      html += '</div>';
    }
  });

  html += '    </div>';
  html += '  </div>';
  html += '</div>';
  el.innerHTML = html;
}

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
window.cusReadDS = cusReadDS;
window.cusPreviewDS = cusPreviewDS;
