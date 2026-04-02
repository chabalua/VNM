// Giao diện đặt hàng và quản lý sản phẩm (admin)

let nhomF = { order: '', adm: '' };
let _searchTimer = null;
let _spEditMa = null; // null = thêm mới, string = đang sửa SP có mã này

// Debounce search — 250ms delay
function debounceRender(tab) {
  clearTimeout(_searchTimer);
  _searchTimer = setTimeout(function() {
    if (tab === 'order') renderOrder();
    else renderAdm();
  }, 250);
}

// Bảng giá
function ptbl(p, km) {
  var hasKM = km.hopKM < p.giaNYLon || km.bonus > 0;
  var hKM = hasKM ? km.hopKM : p.giaNYLon;
  var tKM = hasKM ? km.thungKM : p.giaNYThung;
  var row = function(lbl, goc, kv) {
    var vat = Math.round(kv * 1.015);
    var diff = Math.abs(goc - kv) > 1;
    return '<div class="pt-r"><div class="prc-l">' + lbl + '</div><div class="prc-g ' + (diff ? 'sx' : '') + '">' + fmt(goc) + '</div><div class="prc-k ' + (diff ? 'dif' : 'eq') + '">' + fmt(kv) + 'đ</div><div class="prc-v">' + fmt(vat) + 'đ</div></div>';
  };
  var html = '<div class="ptbl"><div class="pt-h"><div class="phc"></div><div class="phc">Gốc</div><div class="phc km">KM</div><div class="phc vt">+Thuế</div></div>';
  html += row('Thùng', p.giaNYThung, tKM);
  if (p.locSize) html += row(p.locLabel || 'Lốc', p.giaNYLon * p.locSize, hKM * p.locSize);
  html += row(p.donvi, p.giaNYLon, hKM);
  html += '</div>';
  return html;
}

function updKM(p, km, ma) {
  var pt = document.getElementById('pt_' + ma);
  if (pt) pt.innerHTML = ptbl(p, km);
}

function onQty(ma) {
  var p = spFind(ma); if (!p) return;
  var qT = parseInt(document.getElementById('qT_' + ma)?.value) || 0;
  var qL = parseInt(document.getElementById('qL_' + ma)?.value) || 0;
  // Validation
  if (qT < 0) { document.getElementById('qT_' + ma).value = 0; qT = 0; }
  if (qL < 0) { document.getElementById('qL_' + ma).value = 0; qL = 0; }
  var pv = document.getElementById('pv_' + ma); if (!pv) return;
  if (!qT && !qL) { pv.style.display = 'none'; updKM(p, calcKM(p, 0, 0), ma); return; }
  var km = calcKM(p, qT, qL);
  var totalLon = qT * p.slThung + qL;
  var after = p.giaNYLon * totalLon - km.disc;
  var ctName = (km.appliedPromos || []).length ? km.appliedPromos.join(' + ') : '';
  pv.style.display = 'block';
  var pvHtml = '<div class="pv-row"><span class="pv-l">SL: ' + totalLon + ' ' + p.donvi + (km.bonus > 0 ? ' + tặng ' + km.bonus + ' ' + p.donvi : '') + '</span>' + (ctName ? '<span class="sp-kmbadge" style="font-size:11px">' + ctName + '</span>' : '') + '</div>';
  pvHtml += '<div class="pv-row"><span class="pv-l">Thành tiền</span><span class="pv-v">' + fmt(after) + 'đ</span></div>';
  pvHtml += '<div class="pv-row"><span class="pv-l">+Thuế 1.5%</span><span class="pv-vat">' + fmt(Math.round(after * 1.015)) + 'đ</span></div>';
  if (km.disc > 0) pvHtml += '<div class="pv-row"><span class="pv-l">Tiết kiệm</span><span style="color:var(--r);font-weight:700">- ' + fmt(km.disc) + 'đ</span></div>';
  pvHtml += '<button class="btn-ok" onclick="addCart(\'' + ma + '\')">✓ Xác nhận thêm vào đơn</button>';
  pv.innerHTML = pvHtml;
  updKM(p, km, ma);
}

// Render danh sách sản phẩm
function renderOrder() {
  var q = (document.getElementById('order-q') || {}).value || '';
  var lq = q.toLowerCase();
  var favorites = JSON.parse(localStorage.getItem('vnm_favorites') || '[]');
  var f = SP.filter(function(p) { return (!nhomF.order || p.nhom === nhomF.order) && (!lq || p.ten.toLowerCase().includes(lq) || p.ma.toLowerCase().includes(lq)); });
  var el = document.getElementById('order-list');
  if (!el) return;
  if (!SP.length) { el.innerHTML = '<div class="empty">Chưa có sản phẩm (kiểm tra kết nối hoặc sync từ GitHub)</div>'; return; }
  if (!f.length) { el.innerHTML = '<div class="empty">Không tìm thấy (lọc quá chặt)</div>'; return; }

  f.sort(function(a, b) {
    var aFav = favorites.includes(a.ma);
    var bFav = favorites.includes(b.ma);
    if (aFav !== bFav) return aFav ? -1 : 1;
    return a.ten.localeCompare(b.ten);
  });

  var groups = {};
  f.forEach(function(p) { var key = p.nhom || 'X'; if (!groups[key]) groups[key] = []; groups[key].push(p); });
  var sectionOrder = ['A', 'B', 'C', 'D', 'X'];
  var html = '';
  sectionOrder.forEach(function(nhom) {
    if (!groups[nhom] || !groups[nhom].length) return;
    var label = nhom === 'X' ? 'Khác' : (NLBL[nhom] || nhom);
    html += '<div class="order-section"><div class="order-sec-hd">' + label + ' (' + groups[nhom].length + ' SP)</div>';
    groups[nhom].forEach(function(p) {
      var inCart = cart[p.ma] && (cart[p.ma].qT > 0 || cart[p.ma].qL > 0);
      var isFav = favorites.includes(p.ma);
      var kmInfo = calcKM(p, 0, 0);
      var kmBadgeHtml = '';
      var appliedCTs = kmProgs.filter(function(prog) { return prog.active && (prog.spMas || []).includes(p.ma); });
      if (appliedCTs.length) {
        var ctNames = appliedCTs.slice(0, 2).map(function(ct) { return ct.name; });
        kmBadgeHtml = '<div class="km-line">' + ctNames.join(' · ') + (appliedCTs.length > 2 ? ' +' + (appliedCTs.length - 2) : '') + '</div>';
      }

      html += '<div class="sp-card ' + (inCart ? 'inCart' : '') + '" id="card_' + p.ma + '">';
      html += '<div class="sp-top"><div class="sp-bar" style="background:' + NCOLOR[p.nhom] + '"></div>';
      html += '<div class="sp-body"><div class="sp-name">' + p.ten + '<span class="fav-star' + (isFav ? ' active' : '') + '" onclick="toggleFavorite(event, \'' + p.ma + '\')">★</span></div>';
      html += '<div class="sp-meta"><span class="sp-chip">' + p.ma + '</span><span class="sp-chip">' + p.donvi + '·' + p.slThung + '/thùng</span></div>';
      html += '</div></div>';
      html += kmBadgeHtml;
      html += '<div id="pt_' + p.ma + '">' + ptbl(p, kmInfo) + '</div>';
      html += '<div class="qty-area"><div class="qbox"><span class="qlbl">Thùng</span><input class="qinp" type="number" min="0" max="999" inputmode="numeric" placeholder="0" id="qT_' + p.ma + '" oninput="onQty(\'' + p.ma + '\')"></div>';
      html += '<div class="qbox"><span class="qlbl">Lẻ</span><input class="qinp" type="number" min="0" max="9999" inputmode="numeric" placeholder="0" id="qL_' + p.ma + '" oninput="onQty(\'' + p.ma + '\')"></div>';
      html += '<button class="btn-add" onclick="addCart(\'' + p.ma + '\')">＋</button></div>';
      html += '<div class="pv-box" id="pv_' + p.ma + '"></div></div>';
    });
    html += '</div>';
  });

  if (!html) { el.innerHTML = '<div class="empty">Không tìm thấy</div>'; return; }
  el.innerHTML = html;

  // Restore cart values
  for (var ma in cart) {
    var cq = cart[ma];
    if (!cq.qT && !cq.qL) continue;
    var iT = document.getElementById('qT_' + ma), iL = document.getElementById('qL_' + ma);
    if (iT) iT.value = cq.qT || ''; if (iL) iL.value = cq.qL || '';
    var p = spFind(ma); if (p) updKM(p, calcKM(p, cq.qT || 0, cq.qL || 0), ma);
  }
}

// Scroll to top
function scrollToTop() {
  var orderList = document.getElementById('order-list');
  if (orderList) orderList.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================================
// RENDER ADMIN — Redesigned với Sửa + Xóa buttons
// ============================================================
function renderAdm() {
  var q = (document.getElementById('adm-q') || {}).value || '';
  var lq = q.toLowerCase();
  var f = SP.filter(function(p) { return (!nhomF.adm || p.nhom === nhomF.adm) && (!lq || p.ten.toLowerCase().includes(lq) || p.ma.toLowerCase().includes(lq)); });
  var el = document.getElementById('adm-list'); if (!el) return;
  if (!SP.length) { el.innerHTML = '<div class="empty">Chưa có sản phẩm<br><small>Nhấn ＋ để thêm hoặc sync từ GitHub</small></div>'; return; }
  if (!f.length) { el.innerHTML = '<div class="empty">Không tìm thấy</div>'; return; }
  var groups = {};
  f.forEach(function(p) { if (!groups[p.nhom]) groups[p.nhom] = []; groups[p.nhom].push(p); });
  var html = '';
  ['A', 'B', 'C', 'D'].forEach(function(nhom) {
    if (!groups[nhom]) return;
    html += '<div class="adm-section"><div class="adm-sec-hd"><span>' + NLBL[nhom] + ' (' + groups[nhom].length + ' SP)</span></div>';
    groups[nhom].forEach(function(p) {
      var locInfo = p.locSize ? ' · Lốc ' + p.locSize : '';
      html += '<div class="adm-sp-row">';
      // Header row: name + price
      html += '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px">';
      html += '<div style="flex:1;min-width:0"><div class="adm-sp-name">' + p.ten + '</div>';
      html += '<div class="adm-sp-info"><span class="adm-chip">' + p.ma + '</span><span class="adm-chip">' + p.donvi + ' · ' + p.slThung + '/thùng' + locInfo + '</span></div></div>';
      html += '<div style="text-align:right;flex-shrink:0"><div style="font-size:13px;font-weight:800;color:var(--g)">' + fmt(p.giaNYLon) + 'đ</div><div style="font-size:10px;color:var(--t3)">' + fmt(p.giaNYThung) + 'đ/thùng</div></div>';
      html += '</div>';
      // Quick price edit
      html += '<div style="display:flex;gap:7px;align-items:center;margin-bottom:6px">';
      html += '<input type="number" inputmode="numeric" placeholder="Giá mới/' + p.donvi + '" id="adp-inp-' + p.ma + '" style="flex:1;height:36px;border:1.5px solid var(--l2);border-radius:var(--Rs);padding:0 11px;font-size:15px;color:var(--t1);">';
      html += '<button onclick="saveAdmPrice(\'' + p.ma + '\')" style="height:36px;padding:0 12px;background:var(--g);color:#fff;border:none;border-radius:var(--Rs);font-size:12px;font-weight:700;cursor:pointer;">Lưu giá</button>';
      html += '</div>';
      // Action buttons: Sửa + Xóa
      html += '<div style="display:flex;gap:7px">';
      html += '<button class="btn-kme" onclick="spOpenModal(\'' + p.ma + '\')" style="flex:1">✏️ Sửa SP</button>';
      html += '<button class="btn-kmd" onclick="spDelete(\'' + p.ma + '\')" style="flex:0 0 auto;padding:0 12px">✕ Xóa</button>';
      html += '</div>';
      html += '</div>';
    });
    html += '</div><div style="height:8px"></div>';
  });

  // Hiện SP không có nhóm (nếu có)
  var noGroup = f.filter(function(p) { return !p.nhom || !['A','B','C','D'].includes(p.nhom); });
  if (noGroup.length) {
    html += '<div class="adm-section"><div class="adm-sec-hd"><span>Khác (' + noGroup.length + ' SP)</span></div>';
    noGroup.forEach(function(p) {
      var locInfo = p.locSize ? ' · Lốc ' + p.locSize : '';
      html += '<div class="adm-sp-row">';
      html += '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px">';
      html += '<div style="flex:1;min-width:0"><div class="adm-sp-name">' + p.ten + '</div>';
      html += '<div class="adm-sp-info"><span class="adm-chip">' + p.ma + '</span><span class="adm-chip">' + (p.donvi || '?') + ' · ' + (p.slThung || '?') + '/thùng' + locInfo + '</span></div></div>';
      html += '<div style="text-align:right;flex-shrink:0"><div style="font-size:13px;font-weight:800;color:var(--g)">' + fmt(p.giaNYLon) + 'đ</div><div style="font-size:10px;color:var(--t3)">' + fmt(p.giaNYThung) + 'đ/thùng</div></div>';
      html += '</div>';
      html += '<div style="display:flex;gap:7px;align-items:center;margin-bottom:6px">';
      html += '<input type="number" inputmode="numeric" placeholder="Giá mới/' + (p.donvi || 'lon') + '" id="adp-inp-' + p.ma + '" style="flex:1;height:36px;border:1.5px solid var(--l2);border-radius:var(--Rs);padding:0 11px;font-size:15px;color:var(--t1);">';
      html += '<button onclick="saveAdmPrice(\'' + p.ma + '\')" style="height:36px;padding:0 12px;background:var(--g);color:#fff;border:none;border-radius:var(--Rs);font-size:12px;font-weight:700;cursor:pointer;">Lưu giá</button>';
      html += '</div>';
      html += '<div style="display:flex;gap:7px">';
      html += '<button class="btn-kme" onclick="spOpenModal(\'' + p.ma + '\')" style="flex:1">✏️ Sửa SP</button>';
      html += '<button class="btn-kmd" onclick="spDelete(\'' + p.ma + '\')" style="flex:0 0 auto;padding:0 12px">✕ Xóa</button>';
      html += '</div>';
      html += '</div>';
    });
    html += '</div>';
  }

  el.innerHTML = html;
}

function saveAdmPrice(ma) {
  var inp = document.getElementById('adp-inp-' + ma);
  var val = parseInt(inp?.value);
  if (!val || val < 100) { alert('Giá không hợp lệ'); return; }
  var p = SP.find(function(x) { return x.ma === ma; }); if (!p) return;
  p.giaNYLon = val; p.giaNYThung = val * p.slThung;
  saveSP();
  inp.value = '';
  alert('✓ Đã cập nhật giá: ' + p.ten + ' → ' + fmt(val) + 'đ/' + p.donvi);
  renderAdm();
  renderOrder();
}

// ============================================================
// SP MODAL — Thêm / Sửa sản phẩm
// ============================================================
function spOpenModal(ma) {
  var p = null;
  if (ma) {
    p = SP.find(function(x) { return x.ma === ma; });
    _spEditMa = ma;
  } else {
    _spEditMa = null;
  }
  document.getElementById('sp-modal').style.display = 'block';
  document.getElementById('sp-modal-t').textContent = p ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới';
  spRenderForm(p);
}

function spCloseModal(e) {
  if (e && e.target !== document.getElementById('sp-modal')) return;
  document.getElementById('sp-modal').style.display = 'none';
}

function spRenderForm(p) {
  var body = document.getElementById('sp-modal-body');
  var isEdit = !!p;
  var nhom = p ? p.nhom : 'C';
  var donvi = p ? p.donvi : 'hộp';

  var html = '';

  // Mã SP
  html += '<div class="kf"><div class="kfl">Mã sản phẩm</div>';
  html += '<input type="text" id="spf-ma" value="' + (p ? p.ma : '') + '" placeholder="VD: 04ED32" ' + (isEdit ? 'readonly style="background:#f0f2f5;color:var(--t3);"' : '') + ' style="width:100%;height:44px;border:1.5px solid var(--l2);border-radius:var(--Rs);padding:0 12px;font-size:16px;font-weight:700;color:var(--t1);text-transform:uppercase;' + (isEdit ? 'background:#f0f2f5;color:var(--t3);' : '') + '">';
  if (isEdit) html += '<div style="font-size:10px;color:var(--t3);margin-top:3px">Mã SP không thể thay đổi</div>';
  html += '</div>';

  // Tên SP
  html += '<div class="kf"><div class="kfl">Tên sản phẩm</div>';
  html += '<input type="text" id="spf-ten" value="' + (p ? p.ten : '') + '" placeholder="VD: STT DB 100% có đường 180ml" style="width:100%;height:44px;border:1.5px solid var(--l2);border-radius:var(--Rs);padding:0 12px;font-size:15px;color:var(--t1);">';
  html += '</div>';

  // Nhóm SP
  html += '<div class="kf"><div class="kfl">Nhóm sản phẩm</div>';
  html += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:7px">';
  ['A', 'B', 'C', 'D'].forEach(function(n) {
    var labels = { A: 'A·Bột', B: 'B·Đặc', C: 'C·Nước', D: 'D·Chua' };
    var sel = (nhom === n) ? ' sel' : '';
    html += '<button class="km-type-btn sp-nhom-sel' + sel + '" onclick="spSelectNhom(\'' + n + '\',this)">' + labels[n] + '</button>';
  });
  html += '</div></div>';

  // Đơn vị
  html += '<div class="kf"><div class="kfl">Đơn vị tính</div>';
  html += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:7px">';
  ['hộp', 'lon', 'chai', 'bịch', 'tuýp', 'vỉ', 'hũ', 'lốc'].forEach(function(dv, i) {
    if (i >= 4) return; // Show 4 per row
    var sel = (donvi === dv) ? ' sel' : '';
    html += '<button class="km-type-btn sp-dv-sel' + sel + '" onclick="spSelectDV(\'' + dv + '\',this)">' + dv + '</button>';
  });
  html += '</div>';
  html += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:7px;margin-top:7px">';
  ['tuýp', 'vỉ', 'hũ', 'lốc'].forEach(function(dv) {
    var sel = (donvi === dv) ? ' sel' : '';
    html += '<button class="km-type-btn sp-dv-sel' + sel + '" onclick="spSelectDV(\'' + dv + '\',this)">' + dv + '</button>';
  });
  html += '</div>';
  // Custom đơn vị
  html += '<input type="text" id="spf-dv-custom" placeholder="Hoặc nhập đơn vị khác..." value="" style="width:100%;height:36px;border:1.5px solid var(--l2);border-radius:var(--Rs);padding:0 12px;font-size:14px;color:var(--t1);margin-top:7px;">';
  html += '</div>';

  // SL / Thùng
  html += '<div class="kf"><div class="kfl">Số lượng / thùng</div>';
  html += '<input type="number" id="spf-slthung" value="' + (p ? p.slThung : 48) + '" min="1" max="999" inputmode="numeric" style="width:100%;height:44px;border:1.5px solid var(--l2);border-radius:var(--Rs);padding:0 12px;font-size:18px;font-weight:700;text-align:center;color:var(--t1);">';
  html += '</div>';

  // Lốc (tuỳ chọn)
  html += '<div class="kf"><div class="kfl">Lốc (tuỳ chọn — bỏ trống nếu không có)</div>';
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">';
  html += '<div><div style="font-size:10px;color:var(--t3);margin-bottom:3px">SL / lốc</div>';
  html += '<input type="number" id="spf-locsize" value="' + (p && p.locSize ? p.locSize : '') + '" placeholder="VD: 4" min="0" max="99" inputmode="numeric" style="width:100%;height:40px;border:1.5px solid var(--l2);border-radius:var(--Rs);padding:0 12px;font-size:16px;text-align:center;color:var(--t1);"></div>';
  html += '<div><div style="font-size:10px;color:var(--t3);margin-bottom:3px">Nhãn lốc</div>';
  html += '<input type="text" id="spf-loclabel" value="' + (p && p.locLabel ? p.locLabel : '') + '" placeholder="VD: Lốc" style="width:100%;height:40px;border:1.5px solid var(--l2);border-radius:var(--Rs);padding:0 12px;font-size:15px;color:var(--t1);"></div>';
  html += '</div></div>';

  // Giá gốc / đơn vị
  html += '<div class="kf"><div class="kfl">Giá gốc / đơn vị (VNĐ)</div>';
  html += '<input type="number" id="spf-gia" value="' + (p ? p.giaNYLon : '') + '" placeholder="VD: 6900" min="100" inputmode="numeric" style="width:100%;height:48px;border:1.5px solid var(--l2);border-radius:var(--Rs);padding:0 12px;font-size:22px;font-weight:800;text-align:center;color:var(--g);" oninput="spPreviewPrice()">';
  html += '<div id="spf-price-preview" style="margin-top:6px"></div>';
  html += '</div>';

  // Nút lưu
  html += '<button class="btn-km-save" onclick="spSaveForm()">' + (isEdit ? '💾 Cập nhật sản phẩm' : '✓ Thêm sản phẩm') + '</button>';

  body.innerHTML = html;

  // Init preview
  spPreviewPrice();
}

function spSelectNhom(n, btn) {
  document.querySelectorAll('.sp-nhom-sel').forEach(function(b) { b.classList.remove('sel'); });
  btn.classList.add('sel');
}

function spSelectDV(dv, btn) {
  document.querySelectorAll('.sp-dv-sel').forEach(function(b) { b.classList.remove('sel'); });
  btn.classList.add('sel');
  var customInp = document.getElementById('spf-dv-custom');
  if (customInp) customInp.value = '';
}

function spGetSelectedNhom() {
  var sel = document.querySelector('.sp-nhom-sel.sel');
  if (!sel) return 'C';
  var t = sel.textContent.trim();
  return t.charAt(0);
}

function spGetSelectedDV() {
  var customInp = document.getElementById('spf-dv-custom');
  if (customInp && customInp.value.trim()) return customInp.value.trim();
  var sel = document.querySelector('.sp-dv-sel.sel');
  if (!sel) return 'hộp';
  return sel.textContent.trim();
}

function spPreviewPrice() {
  var gia = parseInt((document.getElementById('spf-gia') || {}).value) || 0;
  var slThung = parseInt((document.getElementById('spf-slthung') || {}).value) || 48;
  var locSize = parseInt((document.getElementById('spf-locsize') || {}).value) || 0;
  var el = document.getElementById('spf-price-preview');
  if (!el) return;
  if (!gia) { el.innerHTML = ''; return; }
  var thung = gia * slThung;
  var html = '<div style="background:var(--gL);border-radius:var(--Rs);padding:8px 10px;border:1px solid #a3e6c0">';
  html += '<div style="display:flex;justify-content:space-between;font-size:12px;color:var(--t2);margin-bottom:3px"><span>Giá/thùng</span><b style="color:var(--g)">' + fmt(thung) + 'đ</b></div>';
  if (locSize > 0) {
    html += '<div style="display:flex;justify-content:space-between;font-size:12px;color:var(--t2);margin-bottom:3px"><span>Giá/lốc (' + locSize + ')</span><b style="color:var(--b)">' + fmt(gia * locSize) + 'đ</b></div>';
  }
  html += '<div style="display:flex;justify-content:space-between;font-size:12px;color:var(--t2)"><span>Giá+VAT 1.5%</span><b>' + fmt(Math.round(gia * 1.015)) + 'đ/đvị · ' + fmt(Math.round(thung * 1.015)) + 'đ/thùng</b></div>';
  html += '</div>';
  el.innerHTML = html;
}

function spSaveForm() {
  var ma = (document.getElementById('spf-ma') || {}).value.trim().toUpperCase();
  var ten = (document.getElementById('spf-ten') || {}).value.trim();
  var nhom = spGetSelectedNhom();
  var donvi = spGetSelectedDV();
  var slThung = parseInt((document.getElementById('spf-slthung') || {}).value) || 0;
  var locSize = parseInt((document.getElementById('spf-locsize') || {}).value) || 0;
  var locLabel = (document.getElementById('spf-loclabel') || {}).value.trim();
  var gia = parseInt((document.getElementById('spf-gia') || {}).value) || 0;

  // Validate
  if (!ma) { alert('Nhập mã sản phẩm'); return; }
  if (!ten) { alert('Nhập tên sản phẩm'); return; }
  if (!slThung || slThung < 1) { alert('Số lượng/thùng phải ≥ 1'); return; }
  if (!gia || gia < 100) { alert('Giá phải ≥ 100'); return; }

  if (_spEditMa) {
    // Đang sửa
    var p = SP.find(function(x) { return x.ma === _spEditMa; });
    if (!p) { alert('Không tìm thấy SP!'); return; }
    p.ten = ten;
    p.nhom = nhom;
    p.donvi = donvi;
    p.slThung = slThung;
    p.giaNYLon = gia;
    p.giaNYThung = gia * slThung;
    if (locSize > 0) { p.locSize = locSize; p.locLabel = locLabel || 'Lốc'; }
    else { delete p.locSize; delete p.locLabel; }
    saveSP();
    document.getElementById('sp-modal').style.display = 'none';
    renderAdm(); renderOrder();
    alert('✅ Đã cập nhật: ' + ten);
  } else {
    // Thêm mới — check trùng mã
    if (SP.find(function(x) { return x.ma === ma; })) {
      alert('Mã SP "' + ma + '" đã tồn tại! Dùng mã khác hoặc sửa SP hiện có.');
      return;
    }
    var newP = {
      ma: ma,
      ten: ten,
      nhom: nhom,
      donvi: donvi,
      slThung: slThung,
      giaNYLon: gia,
      giaNYThung: gia * slThung,
      kmRules: [],
      kmText: ''
    };
    if (locSize > 0) { newP.locSize = locSize; newP.locLabel = locLabel || 'Lốc'; }
    SP.push(newP);
    saveSP();
    document.getElementById('sp-modal').style.display = 'none';
    renderAdm(); renderOrder();
    alert('✅ Đã thêm SP mới: ' + ten + ' (' + ma + ')');
  }
}

// Xóa SP
function spDelete(ma) {
  var p = SP.find(function(x) { return x.ma === ma; });
  if (!p) return;
  if (!confirm('Xóa sản phẩm "' + p.ten + '" (' + ma + ')?\n\nLưu ý: CT KM liên quan sẽ không tự xóa mã này.')) return;
  var idx = SP.indexOf(p);
  if (idx >= 0) SP.splice(idx, 1);
  // Xóa khỏi giỏ hàng nếu có
  if (cart[ma]) { delete cart[ma]; saveCart(); updateBadge(); }
  saveSP();
  renderAdm(); renderOrder();
  alert('✅ Đã xóa: ' + p.ten);
}

function closeAdmModal(e) {
  if (e && e.target !== document.getElementById('adm-modal')) return;
  document.getElementById('adm-modal').style.display = 'none';
}

// Export
window.nhomF = nhomF;
window.ptbl = ptbl;
window.updKM = updKM;
window.onQty = onQty;
window.renderOrder = renderOrder;
window.renderAdm = renderAdm;
window.saveAdmPrice = saveAdmPrice;
window.closeAdmModal = closeAdmModal;
window.scrollToTop = scrollToTop;
window.debounceRender = debounceRender;
window.spOpenModal = spOpenModal;
window.spCloseModal = spCloseModal;
window.spRenderForm = spRenderForm;
window.spSelectNhom = spSelectNhom;
window.spSelectDV = spSelectDV;
window.spPreviewPrice = spPreviewPrice;
window.spSaveForm = spSaveForm;
window.spDelete = spDelete;
