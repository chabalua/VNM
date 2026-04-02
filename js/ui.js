// Giao diện đặt hàng và quản lý sản phẩm (admin)

let nhomF = { order: '', adm: '' };
let _searchTimer = null;

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
      // Lấy KM desc ngắn gọn để hiển thị trên card
      var kmInfo = calcKM(p, 0, 0);
      var kmBadgeHtml = '';
      // Tìm CT KM áp dụng cho SP này để hiện badge
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

// Render admin
function renderAdm() {
  var q = (document.getElementById('adm-q') || {}).value || '';
  var lq = q.toLowerCase();
  var f = SP.filter(function(p) { return (!nhomF.adm || p.nhom === nhomF.adm) && (!lq || p.ten.toLowerCase().includes(lq) || p.ma.toLowerCase().includes(lq)); });
  var el = document.getElementById('adm-list'); if (!el) return;
  if (!f.length) { el.innerHTML = '<div class="empty">Không tìm thấy</div>'; return; }
  var groups = {};
  f.forEach(function(p) { if (!groups[p.nhom]) groups[p.nhom] = []; groups[p.nhom].push(p); });
  var html = '';
  ['A', 'B', 'C', 'D'].forEach(function(nhom) {
    if (!groups[nhom]) return;
    html += '<div class="adm-section"><div class="adm-sec-hd"><span>' + NLBL[nhom] + ' (' + groups[nhom].length + ' SP)</span></div>';
    groups[nhom].forEach(function(p) {
      html += '<div class="adm-sp-row"><div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px"><div><span class="db-nhom" style="' + NBG[p.nhom] + '">' + NLBL[p.nhom] + '</span><div class="adm-sp-name">' + p.ten + '</div><div class="adm-sp-info"><span class="adm-chip">' + p.ma + '</span><span class="adm-chip">' + p.donvi + ' · ' + p.slThung + '/thùng</span></div></div><div style="text-align:right;flex-shrink:0"><div style="font-size:12px;font-weight:700;color:var(--t1)" id="adp_' + p.ma + '">' + fmt(p.giaNYLon) + 'đ/' + p.donvi + '</div><div style="font-size:10px;color:var(--t3)">' + fmt(p.giaNYThung) + 'đ/thùng</div></div></div><div style="display:flex;gap:7px;align-items:center"><input type="number" inputmode="numeric" placeholder="Giá mới/' + p.donvi + '" id="adp-inp-' + p.ma + '" style="flex:1;height:38px;border:1.5px solid var(--l2);border-radius:var(--Rs);padding:0 11px;font-size:15px;color:var(--t1);"><button onclick="saveAdmPrice(\'' + p.ma + '\')" style="height:38px;padding:0 14px;background:var(--g);color:#fff;border:none;border-radius:var(--Rs);font-size:13px;font-weight:700;cursor:pointer;">Lưu</button></div></div>';
    });
    html += '</div><div style="height:8px"></div>';
  });
  el.innerHTML = html;
}

function saveAdmPrice(ma) {
  var inp = document.getElementById('adp-inp-' + ma);
  var val = parseInt(inp?.value);
  if (!val || val < 100) { alert('Giá không hợp lệ'); return; }
  var p = SP.find(function(x) { return x.ma === ma; }); if (!p) return;
  p.giaNYLon = val; p.giaNYThung = val * p.slThung;
  saveSP();
  inp.value = ''; inp.placeholder = 'Giá mới/' + p.donvi;
  document.getElementById('adp_' + ma).textContent = fmt(val) + 'đ/' + p.donvi;
  alert('✓ Đã cập nhật: ' + p.ten);
  renderOrder();
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
