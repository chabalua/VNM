// Khởi tạo, sự kiện chính, tab switching

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
  var fabs = { km: 'km-fab', adm: 'adm-fab', kh: 'kh-fab' };
  Object.keys(fabs).forEach(function(tab) {
    var fab = document.getElementById(fabs[tab]);
    if (fab) fab.style.display = (t === tab ? 'flex' : 'none');
  });

  // Scroll-to-top only on order
  var stt = document.getElementById('scroll-top-btn');
  if (stt) stt.style.display = (t === 'order' ? 'flex' : 'none');
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
  await initData();
  await cusLoad();
  renderOrder();
  updateBadge();
  if (document.getElementById('page-don').classList.contains('on')) renderDon();
  if (document.getElementById('page-adm').classList.contains('on')) renderAdm();
  if (document.getElementById('page-km').classList.contains('on')) renderKMTab();
  if (document.getElementById('page-kh').classList.contains('on')) { renderRoutePills(); renderCusTab(); }
};

window.gotoTab = gotoTab;
window.renderRoutePills = renderRoutePills;
