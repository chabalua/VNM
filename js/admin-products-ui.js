// ============================================================
// ADMIN PRODUCTS UI
// Product list, price update, and product modal handlers
// ============================================================

function renderAdm() {
  var q = (document.getElementById('adm-q') || {}).value || '';
  var lq = q.toLowerCase();
  var f = SP.filter(function(p) {
    var brand = detectBrand(p).toLowerCase();
    return (!nhomF.adm || p.nhom === nhomF.adm) && (!lq || p.ten.toLowerCase().includes(lq) || p.ma.toLowerCase().includes(lq) || brand.includes(lq));
  });
  var el = document.getElementById('adm-list'); if (!el) return;
  if (!SP.length) { el.innerHTML = '<div class="empty">Chưa có sản phẩm</div>'; return; }
  if (!f.length) { el.innerHTML = '<div class="empty">Không tìm thấy</div>'; return; }
  var groups = {};
  f.forEach(function(p) { if (!groups[p.nhom]) groups[p.nhom] = []; groups[p.nhom].push(p); });
  var html = '';
  ['A', 'B', 'C', 'D'].forEach(function(nhom) {
    if (!groups[nhom]) return;
    html += '<div class="adm-section"><div class="adm-sec-hd"><span>' + ({ A: 'Sữa bột', B: 'Sữa đặc', C: 'Sữa nước', D: 'Sữa chua' }[nhom] || nhom) + ' (' + groups[nhom].length + ')</span></div>';
    groups[nhom].forEach(function(p) { html += admSpRow(p); });
    html += '</div><div style="height:8px"></div>';
  });
  var noGroup = f.filter(function(p) { return !p.nhom || !['A', 'B', 'C', 'D'].includes(p.nhom); });
  if (noGroup.length) {
    html += '<div class="adm-section"><div class="adm-sec-hd"><span>Khác (' + noGroup.length + ')</span></div>';
    noGroup.forEach(function(p) { html += admSpRow(p); });
    html += '</div>';
  }
  el.innerHTML = html;
}

function admSpRow(p) {
  var brand = detectBrand(p);
  var manualBrand = hasManualBrand(p);
  var locInfo = p.locSize ? ' · Lốc ' + p.locSize : '';
  var eMa = escapeHtmlAttr(p.ma);
  var h = '<div class="adm-sp-row">';
  h += '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px">';
  h += '<div style="flex:1;min-width:0"><div class="adm-sp-name">' + escapeHtml(p.ten) + '</div>';
  h += '<div class="adm-sp-info"><span class="adm-chip">' + escapeHtml(p.ma) + '</span><span class="adm-chip">' + escapeHtml(p.donvi) + ' · ' + p.slThung + '/thùng' + locInfo + '</span>';
  if (brand) h += '<span class="adm-chip">' + escapeHtml(brand) + (manualBrand ? ' · tay' : '') + '</span>';
  h += '</div></div>';
  h += '<div style="text-align:right;flex-shrink:0"><div style="font-size:14px;font-weight:600;color:var(--orange)">' + fmt(p.giaNYLon) + 'đ</div><div style="font-size:10.5px;color:var(--n4)">' + fmt(p.giaNYThung) + 'đ/thùng</div></div></div>';
  h += '<div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">';
  h += '<input type="number" inputmode="numeric" placeholder="Giá mới/' + escapeHtmlAttr(p.donvi) + '" id="adp-inp-' + eMa + '" style="flex:1;height:36px;border:0.5px solid var(--n5);border-radius:var(--Rs);padding:0 11px;font-size:15px;color:var(--n1)">';
  h += '<button onclick="saveAdmPrice(\'' + eMa + '\')" style="height:36px;padding:0 13px;background:var(--orange);color:#fff;border:none;border-radius:var(--Rs);font-size:12px;font-weight:600;cursor:pointer">Lưu</button></div>';
  h += '<div style="display:flex;gap:8px">';
  h += '<button class="btn-kme" onclick="spOpenModal(\'' + eMa + '\')" style="flex:1">✏️ Sửa</button>';
  h += '<button class="btn-kmd" onclick="spDelete(\'' + eMa + '\')" style="flex:0 0 auto;padding:0 13px">✕</button></div>';
  h += '</div>';
  return h;
}

function saveAdmPrice(ma) {
  var inp = document.getElementById('adp-inp-' + ma);
  var val = parseInt(inp ? inp.value : 0);
  if (!val || val < 100) { showToast('Giá không hợp lệ'); return; }
  var p = SP.find(function(x) { return x.ma === ma; }); if (!p) return;
  p.giaNYLon = val; p.giaNYThung = val * p.slThung;
  if (window.markEntityUpdated) markEntityUpdated(p);
  saveSP(); if (inp) inp.value = '';
  if (window.syncAutoPushFile) syncAutoPushFile('products.json');
  showToast('✓ ' + p.ten + ' → ' + fmt(val) + 'đ/' + p.donvi);
  renderAdm(); renderOrder();
}

function spOpenModal(ma) {
  var p = null;
  if (ma) { p = SP.find(function(x) { return x.ma === ma; }); setSpEditMa(ma); }
  else { setSpEditMa(null); }
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
  var phanLoai = p && hasManualBrand(p) ? p.phanLoai : '';
  var autoPhanLoai = p ? (detectBrand(p) || '') : '';
  var suggestedBrands = getSuggestedBrands(nhom);
  var fieldStyle = 'width:100%;height:44px;border:0.5px solid var(--n5);border-radius:var(--Rs);padding:0 13px;font-size:15px;color:var(--n1);background:var(--card)';
  var html = '';
  html += '<div class="kf"><div class="kfl">Mã SP</div><input type="text" id="spf-ma" value="' + (p ? escapeHtml(p.ma) : '') + '"' + (isEdit ? ' readonly style="' + fieldStyle + ';background:var(--n6);color:var(--n4)"' : ' style="' + fieldStyle + ';text-transform:uppercase"') + ' placeholder="VD: 04ED32"></div>';
  html += '<div class="kf"><div class="kfl">Tên SP</div><input type="text" id="spf-ten" value="' + (p ? escapeHtml(p.ten) : '') + '" placeholder="VD: STT không đường 180ml" style="' + fieldStyle + '"></div>';
  html += '<div class="kf"><div class="kfl">Nhóm</div><div class="km-types">';
  ['A', 'B', 'C', 'D'].forEach(function(n) { html += '<button class="km-type-btn sp-nhom-sel' + (nhom === n ? ' sel' : '') + '" onclick="spSelectNhom(\'' + n + '\',this)">' + { A: 'A·Bột', B: 'B·Đặc', C: 'C·Nước', D: 'D·Chua' }[n] + '</button>'; });
  html += '</div></div>';
  html += '<div class="kf"><div class="kfl">Phân loại thương hiệu</div><input type="text" id="spf-phanloai" value="' + escapeHtml(phanLoai) + '" placeholder="VD: Green Farm, Ông Thọ..." list="spf-phanloai-list" style="' + fieldStyle + '">';
  html += '<datalist id="spf-phanloai-list">' + suggestedBrands.map(function(b) { return '<option value="' + escapeHtml(b) + '"></option>'; }).join('') + '</datalist>';
  html += '<div style="font-size:10.5px;color:var(--n4);margin-top:5px">Để trống = tự nhận diện theo tên/mã.' + (autoPhanLoai ? ' Hiện nhận là <b>' + escapeHtml(autoPhanLoai) + '</b>.' : '') + '</div></div>';
  html += '<div class="kf"><div class="kfl">Đơn vị</div><div class="km-types">';
  ['hộp', 'lon', 'chai', 'bịch'].forEach(function(dv) { html += '<button class="km-type-btn sp-dv-sel' + (donvi === dv ? ' sel' : '') + '" onclick="spSelectDV(\'' + dv + '\',this)">' + dv + '</button>'; });
  html += '</div><input type="text" id="spf-dv-custom" placeholder="Đơn vị khác..." style="' + fieldStyle + ';margin-top:6px;height:38px;font-size:13px"></div>';
  html += '<div class="kf"><div class="kfl">SL/thùng</div><input type="number" id="spf-slthung" value="' + (p ? p.slThung : 48) + '" style="' + fieldStyle + ';text-align:center;font-size:18px;font-weight:600"></div>';
  html += '<div class="kf"><div class="kfl">Lốc (tuỳ chọn)</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><div><div style="font-size:10px;color:var(--n4);margin-bottom:3px">SL/lốc</div><input type="number" id="spf-locsize" value="' + (p && p.locSize ? p.locSize : '') + '" placeholder="VD: 4" style="' + fieldStyle + ';text-align:center"></div><div><div style="font-size:10px;color:var(--n4);margin-bottom:3px">Nhãn</div><input type="text" id="spf-loclabel" value="' + (p && p.locLabel ? escapeHtml(p.locLabel) : '') + '" placeholder="Lốc" style="' + fieldStyle + '"></div></div></div>';
  html += '<div class="kf"><div class="kfl">Giá gốc/' + escapeHtml(donvi) + ' (VNĐ)</div><input type="number" id="spf-gia" value="' + (p ? p.giaNYLon : '') + '" placeholder="9612" style="' + fieldStyle + ';text-align:center;font-size:22px;font-weight:600;color:var(--orange)" oninput="spPreviewPrice()"><div id="spf-price-preview" style="margin-top:8px"></div></div>';
  html += '<button class="btn-km-save" onclick="spSaveForm()">' + (isEdit ? '💾 Cập nhật' : '✓ Thêm SP') + '</button>';
  body.innerHTML = html;
  spPreviewPrice();
}

function spSelectNhom(n, btn) { document.querySelectorAll('.sp-nhom-sel').forEach(function(b) { b.classList.remove('sel'); }); btn.classList.add('sel'); spRefreshPhanLoaiSuggestions(n); }
function spSelectDV(dv, btn) { document.querySelectorAll('.sp-dv-sel').forEach(function(b) { b.classList.remove('sel'); }); btn.classList.add('sel'); var c = document.getElementById('spf-dv-custom'); if (c) c.value = ''; }
function spGetSelectedNhom() { var sel = document.querySelector('.sp-nhom-sel.sel'); return sel ? sel.textContent.trim().charAt(0) : 'C'; }
function spGetSelectedDV() { var c = document.getElementById('spf-dv-custom'); if (c && c.value.trim()) return c.value.trim(); var sel = document.querySelector('.sp-dv-sel.sel'); return sel ? sel.textContent.trim() : 'hộp'; }

function spPreviewPrice() {
  var gia = parseInt((document.getElementById('spf-gia') || {}).value) || 0;
  var slThung = parseInt((document.getElementById('spf-slthung') || {}).value) || 48;
  var locSize = parseInt((document.getElementById('spf-locsize') || {}).value) || 0;
  var el = document.getElementById('spf-price-preview'); if (!el || !gia) { if (el) el.innerHTML = ''; return; }
  var VAT_RATE = typeof VAT !== 'undefined' ? VAT : 0.015;
  var thung = gia * slThung;
  var h = '<div style="background:var(--orangeL);border-radius:10px;padding:10px 12px;border:0.5px solid var(--orangeMid)">';
  h += '<div style="display:flex;justify-content:space-between;font-size:12px;color:var(--orangeD);margin-bottom:3px"><span>Thùng ' + slThung + '</span><b>' + fmt(thung) + 'đ</b></div>';
  if (locSize > 0) h += '<div style="display:flex;justify-content:space-between;font-size:12px;color:var(--orangeD);margin-bottom:3px"><span>Lốc ' + locSize + '</span><b>' + fmt(gia * locSize) + 'đ</b></div>';
  h += '<div style="display:flex;justify-content:space-between;font-size:11px;color:var(--n3)"><span>+Thuế 1.5%/thùng</span><span>' + fmt(Math.round(thung * (1 + VAT_RATE))) + 'đ</span></div></div>';
  el.innerHTML = h;
}

function spSaveForm() {
  var g = function(id) { return (document.getElementById(id) || {}).value || ''; };
  var ma = g('spf-ma').trim().toUpperCase();
  var ten = g('spf-ten').trim();
  var nhom = spGetSelectedNhom();
  var phanLoai = g('spf-phanloai').trim();
  var donvi = spGetSelectedDV();
  var slThung = parseInt(g('spf-slthung')) || 0;
  var locSize = parseInt(g('spf-locsize')) || 0;
  var locLabel = g('spf-loclabel').trim();
  var gia = parseInt(g('spf-gia')) || 0;
  if (!ma) { showToast('Nhập mã SP'); return; }
  if (!ten) { showToast('Nhập tên SP'); return; }
  if (!slThung || slThung < 1) { showToast('SL/thùng ≥ 1'); return; }
  if (!gia || gia < 100) { showToast('Giá ≥ 100'); return; }
  var spEditMa = getSpEditMa();
  if (spEditMa) {
    var p = SP.find(function(x) { return x.ma === spEditMa; }); if (!p) return;
    p.ten = ten; p.nhom = nhom; p.donvi = donvi; p.slThung = slThung; p.giaNYLon = gia; p.giaNYThung = gia * slThung;
    if (phanLoai) { p.phanLoai = phanLoai; p.phanLoaiTuNhap = true; } else { delete p.phanLoai; delete p.phanLoaiTuNhap; }
    if (locSize > 0) { p.locSize = locSize; p.locLabel = locLabel || 'Lốc'; } else { delete p.locSize; delete p.locLabel; }
    if (window.markEntityUpdated) markEntityUpdated(p);
    delete p._brand;
    saveSP(); if (window.syncAutoPushFile) syncAutoPushFile('products.json');
    document.getElementById('sp-modal').style.display = 'none';
    renderAdm(); renderOrder();
    showToast('✅ Đã cập nhật: ' + ten);
  } else {
    if (SP.find(function(x) { return x.ma === ma; })) { showToast('Mã đã tồn tại!'); return; }
    var newP = { ma: ma, ten: ten, nhom: nhom, donvi: donvi, slThung: slThung, giaNYLon: gia, giaNYThung: gia * slThung, kmRules: [], kmText: '' };
    if (phanLoai) { newP.phanLoai = phanLoai; newP.phanLoaiTuNhap = true; }
    if (locSize > 0) { newP.locSize = locSize; newP.locLabel = locLabel || 'Lốc'; }
    if (window.markEntityUpdated) markEntityUpdated(newP);
    SP.push(newP); saveSP(); if (window.syncAutoPushFile) syncAutoPushFile('products.json');
    document.getElementById('sp-modal').style.display = 'none';
    renderAdm(); renderOrder();
    showToast('✅ Đã thêm: ' + ten + ' (' + ma + ')');
  }
}

function spDelete(ma) {
  var p = SP.find(function(x) { return x.ma === ma; }); if (!p) return;
  if (window.syncTrackEntityDeletion) syncTrackEntityDeletion('products.json', p);
  SP.splice(SP.indexOf(p), 1);
  if (cart[ma]) { delete cart[ma]; saveCart(); updateBadge(); }
  saveSP(); if (window.syncAutoPushFile) syncAutoPushFile('products.json');
  renderAdm(); renderOrder();
}

function closeAdmModal(e) {
  if (e && e.target !== document.getElementById('adm-modal')) return;
  document.getElementById('adm-modal').style.display = 'none';
}

window.renderAdm = renderAdm;
window.saveAdmPrice = saveAdmPrice;
window.closeAdmModal = closeAdmModal;
window.spOpenModal = spOpenModal;
window.spCloseModal = spCloseModal;
window.spRenderForm = spRenderForm;
window.spSelectNhom = spSelectNhom;
window.spSelectDV = spSelectDV;
window.spPreviewPrice = spPreviewPrice;
window.spSaveForm = spSaveForm;
window.spDelete = spDelete;