// Khởi tạo, sự kiện chính, tab switching, filter

function gotoTab(t) {
  ['order', 'don', 'adm', 'km', 'kh'].forEach(function(x) {
    document.getElementById('page-' + x).className = 'page' + (x === t ? ' on' : '');
    document.getElementById('tab-' + x).className = 'tb' + (x === t ? ' on' : '');
  });
  if (t === 'don') renderDon();
  if (t === 'adm') renderAdm();
  if (t === 'km') renderKMTab();
  if (t === 'kh') { renderRoutePills(); renderCusTab(); }
  // FAB visibility
  var kmFab = document.getElementById('km-fab');
  var admFab = document.getElementById('adm-fab');
  var khFab = document.getElementById('kh-fab');
  if (kmFab) kmFab.style.display = (t === 'km' ? 'flex' : 'none');
  if (admFab) admFab.style.display = (t === 'adm' ? 'flex' : 'none');
  if (khFab) khFab.style.display = (t === 'kh' ? 'flex' : 'none');
  // Show/hide scroll-to-top button
  var stt = document.getElementById('scroll-top-btn');
  if (stt) stt.style.display = (t === 'order' ? 'flex' : 'none');
}

function setNhom(el, tab, nhom) {
  nhomF[tab] = nhom;
  el.closest('.pills').querySelectorAll('.pill').forEach(function(p) { p.className = 'pill'; });
  el.className = 'pill on-' + (nhom || 'all');
  if (tab === 'order') renderOrder(); else renderAdm();
}

// Render route filter pills for KH tab
function renderRoutePills() {
  var el = document.getElementById('cus-route-pills'); if (!el) return;
  var routes = typeof ROUTES !== 'undefined' ? ROUTES : [];
  var curFilter = typeof _cusFilterRoute !== 'undefined' ? _cusFilterRoute : '';
  var html = '<div class="pill ' + (!curFilter ? 'on-all' : '') + '" onclick="cusFilterRoute(\'\');renderRoutePills()">Tất cả</div>';
  routes.forEach(function(r) {
    var active = curFilter === r.id;
    html += '<div class="pill ' + (active ? 'on-C' : '') + '" onclick="cusFilterRoute(\'' + r.id + '\');renderRoutePills()">' + r.ten + '</div>';
  });
  el.innerHTML = html;
}

window.updateBadge = function() {
  var n = getItems().length;
  var b = document.getElementById('don-badge');
  if (b) { b.style.display = n ? '' : 'none'; b.textContent = n; }
};

window.onload = async function() {
  await initData();
  await cusLoad(); // Load customers + routes
  renderOrder();
  updateBadge();
  if (document.getElementById('page-don').classList.contains('on')) renderDon();
  if (document.getElementById('page-adm').classList.contains('on')) renderAdm();
  if (document.getElementById('page-km').classList.contains('on')) renderKMTab();
  if (document.getElementById('page-kh').classList.contains('on')) { renderRoutePills(); renderCusTab(); }
};

window.gotoTab = gotoTab;
window.setNhom = setNhom;
window.renderRoutePills = renderRoutePills;
