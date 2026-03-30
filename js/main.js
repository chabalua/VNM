// Khởi tạo, sự kiện chính, tab switching, filter

// Chuyển tab
function gotoTab(t) {
  ['order','don','adm','km','kh'].forEach(x => {
    document.getElementById('page-'+x).className = 'page' + (x === t ? ' on' : '');
    document.getElementById('tab-'+x).className = 'tb' + (x === t ? ' on' : '');
  });
  if (t === 'don') renderDon();
  if (t === 'adm') renderAdm();
  if (t === 'km') renderKMTab();
  if (t === 'kh') renderKH();
  const fab = document.getElementById('km-fab'); if (fab) fab.style.display = (t === 'km' ? 'flex' : 'none');
}

// Lọc theo nhóm
function setNhom(el, tab, nhom) {
  nhomF[tab] = nhom;
  el.closest('.pills').querySelectorAll('.pill').forEach(p => p.className = 'pill');
  el.className = 'pill on-' + (nhom || 'all');
  if (tab === 'order') renderOrder(); else renderAdm();
}

// Cập nhật badge số lượng sản phẩm trong giỏ (gọi lại từ cart.js)
window.updateBadge = function() {
  const n = getItems().length;
  const b = document.getElementById('don-badge');
  if (b) { b.style.display = n ? '' : 'none'; b.textContent = n; }
};

// Khởi động
window.onload = async () => {
  await initData();  // từ data.js
  renderOrder();
  updateBadge();
  if (document.getElementById('page-don').classList.contains('on')) renderDon();
  if (document.getElementById('page-adm').classList.contains('on')) renderAdm();
  if (document.getElementById('page-km').classList.contains('on')) renderKMTab();
  if (document.getElementById('page-kh').classList.contains('on')) renderKH();
};

// Đưa các hàm toàn cục ra window
window.gotoTab = gotoTab;
window.setNhom = setNhom;