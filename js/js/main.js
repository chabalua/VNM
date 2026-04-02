// Khởi tạo, sự kiện chính, tab switching, filter

function gotoTab(t) {
  ['order', 'don', 'adm', 'km', 'kh'].forEach(function(x) {
    document.getElementById('page-' + x).className = 'page' + (x === t ? ' on' : '');
    document.getElementById('tab-' + x).className = 'tb' + (x === t ? ' on' : '');
  });
  if (t === 'don') renderDon();
  if (t === 'adm') renderAdm();
  if (t === 'km') renderKMTab();
  if (t === 'kh') renderKH();
  // FAB visibility
  var kmFab = document.getElementById('km-fab');
  var admFab = document.getElementById('adm-fab');
  if (kmFab) kmFab.style.display = (t === 'km' ? 'flex' : 'none');
  if (admFab) admFab.style.display = (t === 'adm' ? 'flex' : 'none');
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

window.updateBadge = function() {
  var n = getItems().length;
  var b = document.getElementById('don-badge');
  if (b) { b.style.display = n ? '' : 'none'; b.textContent = n; }
};

window.onload = async function() {
  await initData();
  renderOrder();
  updateBadge();
  if (document.getElementById('page-don').classList.contains('on')) renderDon();
  if (document.getElementById('page-adm').classList.contains('on')) renderAdm();
  if (document.getElementById('page-km').classList.contains('on')) renderKMTab();
  if (document.getElementById('page-kh').classList.contains('on')) renderKH();
};

window.gotoTab = gotoTab;
window.setNhom = setNhom;
