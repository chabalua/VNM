// Giao diện đặt hàng và quản lý sản phẩm (admin)

let nhomF = { order: '', adm: '' };

// Bảng giá (render dòng giá)
function ptbl(p, km) {
  const hasKM = km.hopKM < p.giaNYLon || km.bonus > 0;
  const hKM = hasKM ? km.hopKM : p.giaNYLon;
  const tKM = hasKM ? km.thungKM : p.giaNYThung;
  const row = (lbl, goc, kv) => {
    const vat = Math.round(kv * 1.015);
    const diff = Math.abs(goc - kv) > 1;
    return `<div class="pt-r"><div class="prc-l">${lbl}</div><div class="prc-g ${diff ? 'sx' : ''}">${fmt(goc)}</div><div class="prc-k ${diff ? 'dif' : 'eq'}">${fmt(kv)}đ</div><div class="prc-v">${fmt(vat)}đ</div></div>`;
  };
  return `<div class="ptbl"><div class="pt-h"><div class="phc"></div><div class="phc">Gốc</div><div class="phc km">KM</div><div class="phc vt">+Thuế</div></div>${row('Thùng', p.giaNYThung, tKM)}${p.locSize ? row(p.locLabel || 'Lốc', p.giaNYLon * p.locSize, hKM * p.locSize) : ''}${row(p.donvi, p.giaNYLon, hKM)}</div>`;
}

// Cập nhật bảng giá khi thay đổi số lượng
function updKM(p, km, ma) {
  const pt = document.getElementById('pt_'+ma);
  if (pt) pt.innerHTML = ptbl(p, km);
}

// Sự kiện nhập số lượng
function onQty(ma) {
  const p = spFind(ma); if (!p) return;
  const qT = parseInt(document.getElementById('qT_'+ma)?.value) || 0;
  const qL = parseInt(document.getElementById('qL_'+ma)?.value) || 0;
  const pv = document.getElementById('pv_'+ma); if (!pv) return;
  if (!qT && !qL) { pv.style.display = 'none'; return; }
  const km = calcKM(p, qT, qL);
  const totalLon = qT * p.slThung + qL;
  const after = p.giaNYLon * totalLon - km.disc;
  const ctName = (() => {
    const applicable = kmProgs.filter(prog => prog.active && (prog.spMas || []).indexOf(p.ma) >= 0);
    return applicable.length ? applicable.map(prog => prog.name).join(' + ') : '';
  })();
  pv.style.display = 'block';
  pv.innerHTML = `<div class="pv-row"><span class="pv-l">SL: ${totalLon} ${p.donvi}${km.bonus > 0 ? ' + tặng ' + km.bonus + ' ' + p.donvi : ''}</span>${ctName ? `<span class="sp-kmbadge" style="font-size:11px">${ctName}</span>` : ''}</div>
    <div class="pv-row"><span class="pv-l">Thành tiền</span><span class="pv-v">${fmt(after)}đ</span></div>
    <div class="pv-row"><span class="pv-l">+Thuế 1.5%</span><span class="pv-vat">${fmt(Math.round(after * 1.015))}đ</span></div>
    ${km.disc > 0 ? `<div class="pv-row"><span class="pv-l">Tiết kiệm</span><span style="color:var(--r);font-weight:700">- ${fmt(km.disc)}đ</span></div>` : ''}
    <button class="btn-ok" onclick="addCart('${ma}')">✓ Xác nhận thêm vào đơn</button>`;
  updKM(p, km, ma);
}

// Render danh sách sản phẩm trên tab đặt hàng
function renderOrder() {
  const q = (document.getElementById('order-q')||{}).value || '';
  const lq = q.toLowerCase();
  const favorites = JSON.parse(localStorage.getItem('vnm_favorites') || '[]');
  const f = SP.filter(p => (!nhomF.order || p.nhom === nhomF.order) && (!lq || p.ten.toLowerCase().includes(lq) || p.ma.toLowerCase().includes(lq)));
  const el = document.getElementById('order-list');
  if (!el) return;
  if (!SP.length) {
    el.innerHTML = '<div class="empty">Chưa có sản phẩm (kiểm tra kết nối hoặc sync từ GitHub)</div>';
    return;
  }
  if (!f.length) { el.innerHTML = '<div class="empty">Không tìm thấy (lọc quá chặt)</div>'; return; }

  f.sort((a,b) => {
    const aFav = favorites.includes(a.ma);
    const bFav = favorites.includes(b.ma);
    if (aFav !== bFav) return aFav ? -1 : 1;
    return a.ten.localeCompare(b.ten);
  });

  const groups = {};
  f.forEach(p => {
    const key = p.nhom || 'X';
    if (!groups[key]) groups[key] = [];
    groups[key].push(p);
  });
  const sectionOrder = ['A','B','C','D','X'];
  let html = '';
  sectionOrder.forEach(nhom => {
    if (!groups[nhom] || !groups[nhom].length) return;
    const label = nhom === 'X' ? 'Khác' : (NLBL[nhom] || nhom);
    html += `<div class="order-section"><div class="order-sec-hd">${label} (${groups[nhom].length} SP)</div>`;
    html += groups[nhom].map(p => {
      const inCart = cart[p.ma] && (cart[p.ma].qT > 0 || cart[p.ma].qL > 0);
      const isFav = favorites.includes(p.ma);
      return `<div class="sp-card ${inCart ? 'inCart' : ''}" id="card_${p.ma}">
        <div class="sp-top"><div class="sp-bar" style="background:${NCOLOR[p.nhom]}"></div>
          <div class="sp-body"><div class="sp-name">${p.ten}<span class="fav-star${isFav ? ' active' : ''}" onclick="toggleFavorite(event, '${p.ma}')">★</span></div>
            <div class="sp-meta"><span class="sp-chip">${p.ma}</span><span class="sp-chip">${p.donvi}·${p.slThung}/thùng</span></div>
          </div>
        </div>
        <div id="pt_${p.ma}">${ptbl(p, calcKM(p, 0, 0))}</div>
        <div class="qty-area"><div class="qbox"><span class="qlbl">Thùng</span><input class="qinp" type="number" min="0" inputmode="numeric" placeholder="0" id="qT_${p.ma}" oninput="onQty('${p.ma}')"></div>
          <div class="qbox"><span class="qlbl">Lẻ</span><input class="qinp" type="number" min="0" inputmode="numeric" placeholder="0" id="qL_${p.ma}" oninput="onQty('${p.ma}')"></div>
          <button class="btn-add" onclick="addCart('${p.ma}')">＋</button>
        </div>
        <div class="pv-box" id="pv_${p.ma}"></div>
      </div>`;
    }).join('');
    html += '</div>';
  });

  if (!html) { el.innerHTML = '<div class="empty">Không tìm thấy</div>'; return; }
  el.innerHTML = html;

  for (const [ma, q] of Object.entries(cart)) {
    if (!q.qT && !q.qL) continue;
    const iT = document.getElementById('qT_'+ma), iL = document.getElementById('qL_'+ma);
    if (iT) iT.value = q.qT || ''; if (iL) iL.value = q.qL || '';
    const p = spFind(ma); if (p) updKM(p, calcKM(p, q.qT || 0, q.qL || 0), ma);
  }
}

// Render danh sách sản phẩm trong tab quản lý (admin)
function renderAdm() {
  const q = (document.getElementById('adm-q')||{}).value || '';
  const lq = q.toLowerCase();
  const f = SP.filter(p => (!nhomF.adm || p.nhom === nhomF.adm) && (!lq || p.ten.toLowerCase().includes(lq) || p.ma.toLowerCase().includes(lq)));
  const el = document.getElementById('adm-list'); if (!el) return;
  if (!f.length) { el.innerHTML = '<div class="empty">Không tìm thấy</div>'; return; }
  const groups = {};
  f.forEach(p => { if (!groups[p.nhom]) groups[p.nhom] = []; groups[p.nhom].push(p); });
  let html = '';
  for (const nhom of ['A','B','C','D']) {
    if (!groups[nhom]) continue;
    html += `<div class="adm-section"><div class="adm-sec-hd"><span>${NLBL[nhom]} (${groups[nhom].length} SP)</span></div>
      ${groups[nhom].map(p => `<div class="adm-sp-row"><div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px"><div><span class="db-nhom" style="${NBG[p.nhom]}">${NLBL[p.nhom]}</span><div class="adm-sp-name">${p.ten}</div><div class="adm-sp-info"><span class="adm-chip">${p.ma}</span><span class="adm-chip">${p.donvi} · ${p.slThung}/thùng</span></div></div><div style="text-align:right;flex-shrink:0"><div style="font-size:12px;font-weight:700;color:var(--t1)" id="adp_${p.ma}">${fmt(p.giaNYLon)}đ/${p.donvi}</div><div style="font-size:10px;color:var(--t3)">${fmt(p.giaNYThung)}đ/thùng</div></div></div><div style="display:flex;gap:7px;align-items:center"><input type="number" inputmode="numeric" placeholder="Giá mới/${p.donvi}" id="adp-inp-${p.ma}" style="flex:1;height:38px;border:1.5px solid var(--l2);border-radius:var(--Rs);padding:0 11px;font-size:15px;color:var(--t1);"><button onclick="saveAdmPrice('${p.ma}')" style="height:38px;padding:0 14px;background:var(--g);color:#fff;border:none;border-radius:var(--Rs);font-size:13px;font-weight:700;cursor:pointer;">Lưu</button></div></div>`).join('')}
    </div><div style="height:8px"></div>`;
  }
  el.innerHTML = html;
}

// Lưu giá mới từ admin
function saveAdmPrice(ma) {
  const inp = document.getElementById('adp-inp-'+ma);
  const val = parseInt(inp?.value);
  if (!val || val < 100) { alert('Giá không hợp lệ'); return; }
  const p = SP.find(x => x.ma === ma); if (!p) return;
  p.giaNYLon = val; p.giaNYThung = val * p.slThung;
  saveSP();
  inp.value = ''; inp.placeholder = 'Giá mới/' + p.donvi;
  document.getElementById('adp_'+ma).textContent = fmt(val) + 'đ/' + p.donvi;
  alert('✓ Đã cập nhật: ' + p.ten);
  renderOrder(); // cập nhật luôn tab đặt hàng
}

// Đóng modal admin
function closeAdmModal(e) {
  if (e && e.target !== document.getElementById('adm-modal')) return;
  document.getElementById('adm-modal').style.display = 'none';
}

// Hiển thị dropdown sản phẩm trong nhóm
function showGroupProducts(tab, nhom) {
  if (!SP.length) {
    alert('Chưa có dữ liệu sản phẩm. Vui lòng tải lại trang hoặc sync từ GitHub.');
    return;
  }
  const products = nhom ? SP.filter(p => p.nhom === nhom) : SP;
  if (!products.length) {
    alert('Không có sản phẩm trong nhóm này.');
    return;
  }
  // Tìm pill element
  const pills = document.querySelectorAll('.pill');
  let targetPill = null;
  for (let pill of pills) {
    if (pill.textContent.includes(nhom ? nhom : 'Tất cả')) {
      targetPill = pill;
      break;
    }
  }
  if (!targetPill) return;
  // Xóa dropdown cũ
  document.querySelectorAll('.group-dropdown').forEach(d => d.remove());
  // Tạo dropdown
  const dropdown = document.createElement('div');
  dropdown.className = 'group-dropdown';
  dropdown.innerHTML = products.slice(0, 10).map(p => `<div onclick="addCart('${p.ma}'); this.closest('.group-dropdown').remove();">${p.ten}</div>`).join('') + (products.length > 10 ? '<div style="color:#999;padding:8px;">+ ' + (products.length - 10) + ' sản phẩm nữa</div>' : '');
  targetPill.appendChild(dropdown);
}

// Xuất các hàm ra window
window.nhomF = nhomF;
window.ptbl = ptbl;
window.updKM = updKM;
window.onQty = onQty;
window.renderOrder = renderOrder;
window.renderAdm = renderAdm;
window.saveAdmPrice = saveAdmPrice;
window.closeAdmModal = closeAdmModal;
window.showGroupProducts = showGroupProducts;