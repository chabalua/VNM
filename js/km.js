// Quản lý CT KM (modal, form)

let _kmEditIdx = -1;
let _kmPickerNhom = '';
let _kmStackable = true;

// Hàm mở modal tạo/sửa CT KM
function kmOpenModal(prog, idx) {
  _kmEditIdx = (idx !== undefined) ? idx : -1;
  _kmPickerNhom = prog ? (prog.nhoms || '') : '';
  _kmStackable = prog ? (prog.stackable !== false) : true;
  document.getElementById('km-modal').style.display = 'block';
  document.getElementById('km-modal-t').textContent = (_kmEditIdx >= 0) ? 'Sửa CT KM' : 'Tạo CT KM';
  kmRenderForm(prog || { type: 'bonus', stackable: true });
}

function kmCloseModal(e) {
  if (e && e.target !== document.getElementById('km-modal')) return;
  document.getElementById('km-modal').style.display = 'none';
}

function kmRenderForm(prog) {
  const body = document.getElementById('km-modal-body');
  const t = prog.type || 'bonus';
  const typeLabels = { bonus:'🎁 Tặng hàng', fixed:'% CK cố định', tier_qty:'📦 CK theo SL', tier_money:'💰 CK theo tiền' };
  body.innerHTML = `<div class="kf"><div class="kfl">Tên chương trình</div><input type="text" id="kf-name" value="${prog.name || ''}" placeholder="VD: Sữa đặc NSPN xuất nhỏ xanh lá"></div>
    <div class="kf"><div class="kfl">Loại khuyến mãi</div><div class="km-types">${['bonus','fixed','tier_qty','tier_money'].map(tp => `<button class="km-type-btn${t===tp?' sel':''}" onclick="kmSelType('${tp}')">${typeLabels[tp]}</button>`).join('')}</div></div>
    <div id="kf-fields">${kmTypeFields(prog)}</div>
    <div class="kf"><div class="kfl">Gộp với CT KM khác</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><button class="km-stack-btn${_kmStackable ? ' sel' : ''}" onclick="kmSetStack(true,this)">🔗 Được gộp<br><span style="font-size:10px;font-weight:400;opacity:.7">Cộng thêm với CT khác</span></button><button class="km-stack-btn${!_kmStackable ? ' sel' : ''}" onclick="kmSetStack(false,this)">🔒 Không gộp<br><span style="font-size:10px;font-weight:400;opacity:.7">Chỉ dùng 1 CT lợi nhất</span></button></div></div>
    <div class="kf"><div class="kfl">Gán cho sản phẩm</div><div class="km-nhom-row">${['','A','B','C','D'].map(n => { const lbl = n ? n+'·'+{A:'Bột',B:'Đặc',C:'Nước',D:'Chua'}[n] : 'Tất cả'; return `<button class="km-nhom-btn${_kmPickerNhom===n?' sel':''}" onclick="kmPickNhom('${n}')">${lbl}</button>`; }).join('')}</div>
    <div style="display:flex;gap:7px;margin-bottom:6px"><button onclick="kmCheckAll(true)" style="flex:1;height:30px;border:1px solid var(--l2);border-radius:var(--Rs);background:#fff;font-size:11px;font-weight:700;color:var(--t2);cursor:pointer">Chọn tất cả</button><button onclick="kmCheckAll(false)" style="flex:1;height:30px;border:1px solid var(--l2);border-radius:var(--Rs);background:#fff;font-size:11px;font-weight:700;color:var(--t2);cursor:pointer">Bỏ chọn</button></div>
    <div class="km-picker" id="km-picker"></div></div>
    <div id="km-preview"></div>
    <button class="btn-km-save" onclick="kmSaveForm()">💾 Lưu chương trình</button>`;
  kmRenderPicker(prog.spMas || []);
  kmPreview();
}

function kmSetStack(val, btn) {
  _kmStackable = val;
  document.querySelectorAll('.km-stack-btn').forEach(b => b.className = 'km-stack-btn');
  btn.className = 'km-stack-btn sel';
}

function kmSelType(tp) {
  const cur = kmReadForm(); cur.type = tp;
  document.querySelectorAll('.km-type-btn').forEach(b => b.className = 'km-type-btn');
  const lblMap = { bonus:'Tặng', fixed:'cố định', tier_qty:'theo SL', tier_money:'theo tiền' };
  document.querySelectorAll('.km-type-btn').forEach(b => { if (b.textContent.indexOf(lblMap[tp]) >= 0) b.className = 'km-type-btn sel'; });
  document.getElementById('kf-fields').innerHTML = kmTypeFields(cur);
  kmPreview();
}

function kmTypeFields(prog) {
  const t = prog.type || 'bonus';
  if (t === 'bonus') {
    let spOpts = '<option value="same"' + ((!prog.bMa || prog.bMa === 'same') ? ' selected' : '') + '>Cùng loại SP đó</option>';
    SP.forEach(p => { if (p.nhom === 'B' || p.nhom === 'C') spOpts += `<option value="${p.ma}"${prog.bMa === p.ma ? ' selected' : ''}>${p.ma} - ${p.ten.slice(0,28)}</option>`; });
    return `<div class="kf"><div class="kfl">Mua X → Tặng Y</div><div style="display:grid;grid-template-columns:1fr 24px 1fr;gap:8px;align-items:center;margin-bottom:10px"><div><div style="font-size:10px;color:var(--t3);margin-bottom:3px">Mua X</div><input type="number" id="kf-bx" value="${prog.bX || 12}" min="1" style="width:100%;height:42px;border:1.5px solid var(--l2);border-radius:var(--Rs);text-align:center;font-size:20px;font-weight:800;" oninput="kmPreview()"></div><div style="text-align:center;color:var(--t3);font-size:18px">→</div><div><div style="font-size:10px;color:var(--t3);margin-bottom:3px">Tặng Y</div><input type="number" id="kf-by" value="${prog.bY || 1}" min="1" style="width:100%;height:42px;border:1.5px solid var(--l2);border-radius:var(--Rs);text-align:center;font-size:20px;font-weight:800;" oninput="kmPreview()"></div></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px"><div><div style="font-size:10px;color:var(--t3);margin-bottom:3px">Đơn vị</div><select id="kf-bunit" style="width:100%;height:38px;border:1.5px solid var(--l2);border-radius:var(--Rs);padding:0 9px;font-size:14px;"><option value="lon"${prog.bUnit !== 'thung' ? ' selected' : ''}>Lon/Hộp</option><option value="thung"${prog.bUnit === 'thung' ? ' selected' : ''}>Thùng</option></select></div><div><div style="font-size:10px;color:var(--t3);margin-bottom:3px">Áp tối đa</div><select id="kf-bmax" style="width:100%;height:38px;border:1.5px solid var(--l2);border-radius:var(--Rs);padding:0 9px;font-size:14px;"><option value="0"${!prog.bMax ? ' selected' : ''}>Không giới hạn</option><option value="1"${prog.bMax == 1 ? ' selected' : ''}>1 lần</option></select></div></div>
    <div><div style="font-size:10px;color:var(--t3);margin-bottom:3px">SP được tặng</div><select id="kf-bma" style="width:100%;height:38px;border:1.5px solid var(--l2);border-radius:var(--Rs);padding:0 9px;font-size:13px;" onchange="kmPreview()">${spOpts}</select></div></div>`;
  }
  if (t === 'fixed') {
    return `<div class="kf"><div class="kfl">Chiết khấu</div><div style="display:flex;gap:8px;align-items:center"><input type="number" id="kf-ck" value="${prog.ck || 5}" min="1" max="50" style="flex:1;height:46px;border:1.5px solid var(--l2);border-radius:var(--Rs);padding:0 12px;font-size:24px;font-weight:800;text-align:center;" oninput="kmPreview()"><span style="font-size:24px;font-weight:700;color:var(--t2)">%</span></div></div>`;
  }
  if (t === 'tier_qty') {
    const rows = (prog.tiers || [{ mn: 2, ck: 3 }]).map((ti, i) => `<div class="km-tier-row" id="ktr-${i}"><label>Từ</label><input type="number" class="t-mn" value="${ti.mn}" min="1" oninput="kmPreview()"><label>CK</label><input type="number" class="t-ck" value="${ti.ck}" min="1" max="50" oninput="kmPreview()"><label>%</label><button class="btn-dtr" onclick="kmDelTier(this)">✕</button></div>`).join('');
    return `<div class="kf"><div class="kfl">CK theo số lượng</div><div style="display:flex;gap:8px;align-items:center;margin-bottom:8px"><span style="font-size:12px;font-weight:700;color:var(--t2)">Tính theo:</span><select id="kf-tunit" style="flex:1;height:36px;border:1.5px solid var(--l2);border-radius:var(--Rs);padding:0 9px;font-size:13px;"><option value="lon"${prog.tUnit !== 'thung' ? ' selected' : ''}>Lon/Hộp</option><option value="thung"${prog.tUnit === 'thung' ? ' selected' : ''}>Thùng</option></select></div><div id="km-tiers">${rows}</div><button class="btn-atr" onclick="kmAddTier('qty')">+ Thêm mức</button></div>`;
  }
  if (t === 'tier_money') {
    const rows = (prog.tiers || [{ type: 'below', value: 600, ck: 12 }, { type: 'below', value: 1200, ck: 14 }, { type: 'above', value: 0, ck: 16 }]).map((ti, i) => `<div class="km-tier-row" id="ktr-${i}"><select class="t-type" onchange="kmPreview()"><option value="below"${ti.type === 'below' ? ' selected' : ''}>Dưới</option><option value="above"${ti.type === 'above' ? ' selected' : ''}>Trên</option></select><input type="number" class="t-val" value="${ti.value || 0}" placeholder="K" oninput="kmPreview()"><label>K→CK</label><input type="number" class="t-ck" value="${ti.ck}" min="0" max="50" oninput="kmPreview()"><label>%</label><button class="btn-dtr" onclick="kmDelTier(this)">✕</button></div>`).join('');
    return `<div class="kf"><div class="kfl">CK theo tổng tiền</div><div id="km-tiers">${rows}</div><button class="btn-atr" onclick="kmAddTier('money')">+ Thêm mức</button><div style="font-size:10px;color:var(--t3);margin-top:5px">💡 Dưới/Trên số tiền → áp dụng CK</div></div>`;
  }
  return '';
}

function kmAddTier(kind) {
  const list = document.getElementById('km-tiers'); if (!list) return;
  const i = list.children.length;
  const div = document.createElement('div');
  div.className = 'km-tier-row'; div.id = 'ktr-'+i;
  if (kind === 'money') {
    div.innerHTML = '<select class="t-type"><option value="below" selected>Dưới</option><option value="above">Trên</option></select><input type="number" class="t-val" value="0" placeholder="K"><label>K→CK</label><input type="number" class="t-ck" value="0"><label>%</label><button class="btn-dtr" onclick="kmDelTier(this)">✕</button>';
  } else {
    div.innerHTML = '<label>Từ</label><input type="number" class="t-mn" value="2"><label>CK</label><input type="number" class="t-ck" value="0"><label>%</label><button class="btn-dtr" onclick="kmDelTier(this)">✕</button>';
  }
  list.appendChild(div); kmPreview();
}

function kmDelTier(btn) { btn.closest('.km-tier-row').remove(); kmPreview(); }

function kmPickNhom(n) {
  _kmPickerNhom = n;
  document.querySelectorAll('.km-nhom-btn').forEach(b => {
    const match = n ? (b.textContent.indexOf(n+'·') === 0) : b.textContent === 'Tất cả';
    b.className = 'km-nhom-btn' + (match ? ' sel' : '');
  });
  const cur = [];
  document.querySelectorAll('.km-pick-cb:checked').forEach(c => cur.push(c.value));
  kmRenderPicker(cur);
}

function kmRenderPicker(checked) {
  const el = document.getElementById('km-picker'); if (!el) return;
  const favorites = JSON.parse(localStorage.getItem('vnm_favorites') || '[]');
  let list = SP.filter(p => !_kmPickerNhom || p.nhom === _kmPickerNhom);
  list.sort((a, b) => {
    const aFav = favorites.includes(a.ma);
    const bFav = favorites.includes(b.ma);
    if (aFav !== bFav) return aFav ? -1 : 1;
    return a.ten.localeCompare(b.ten);
  });
  const nhomLabels = {A:'Bột', B:'Đặc', C:'Nước', D:'Chua'};
  el.innerHTML = list.map(p => {
    const isFav = favorites.includes(p.ma);
    return `<div class="km-pick-row" data-ma="${p.ma}">
      <input type="checkbox" class="km-pick-cb" id="kpk-${p.ma}" value="${p.ma}"${checked.indexOf(p.ma) >= 0 ? ' checked' : ''} onchange="kmPreview()">
      <label for="kpk-${p.ma}" style="flex:1;cursor:pointer;display:flex;align-items:center;justify-content:space-between;">
        <div>
          <div style="font-size:12px;color:var(--t1)">${p.ten}</div>
          <div style="font-size:10px;color:var(--t3)">${p.ma} · ${fmt(p.giaNYLon)}đ/${p.donvi}</div>
        </div>
        <div style="display:flex;align-items:center;gap:6px;">
          <span class="sp-nhom-badge ${p.nhom}">${nhomLabels[p.nhom]}</span>
          <span class="fav-star${isFav ? ' active' : ''}" data-ma="${p.ma}" onclick="toggleFavorite(event, '${p.ma}')">★</span>
        </div>
      </label>
    </div>`;
  }).join('');
}

function toggleFavorite(event, ma) {
  if (event && event.stopPropagation) event.stopPropagation();
  let favorites = JSON.parse(localStorage.getItem('vnm_favorites') || '[]');
  const idx = favorites.indexOf(ma);
  if (idx === -1) favorites.push(ma);
  else favorites.splice(idx, 1);
  localStorage.setItem('vnm_favorites', JSON.stringify(favorites));
  const currentChecked = kmGetChecked ? kmGetChecked() : [];
  if (window.kmRenderPicker) window.kmRenderPicker(currentChecked);
  if (window.renderOrder) window.renderOrder();
}

function kmCheckAll(val) { document.querySelectorAll('.km-pick-cb').forEach(cb => cb.checked = val); kmPreview(); }

function kmGetChecked() { const r = []; document.querySelectorAll('.km-pick-cb:checked').forEach(c => r.push(c.value)); return r; }

function kmReadForm() {
  let selBtn = document.querySelector('.km-type-btn.sel');
  let t = 'bonus';
  if (selBtn) {
    const txt = selBtn.textContent;
    if (txt.indexOf('Tặng') >= 0) t = 'bonus';
    else if (txt.indexOf('cố định') >= 0) t = 'fixed';
    else if (txt.indexOf('theo SL') >= 0) t = 'tier_qty';
    else if (txt.indexOf('theo tiền') >= 0) t = 'tier_money';
  }
  const prog = { name: (document.getElementById('kf-name')||{}).value || '', type: t, nhoms: _kmPickerNhom, active: true, stackable: _kmStackable };
  if (t === 'bonus') {
    prog.bX = (document.getElementById('kf-bx')||{}).value || 12;
    prog.bY = (document.getElementById('kf-by')||{}).value || 1;
    prog.bUnit = (document.getElementById('kf-bunit')||{}).value || 'lon';
    prog.bMax = +((document.getElementById('kf-bmax')||{}).value || 0);
    prog.bMa = (document.getElementById('kf-bma')||{}).value || 'same';
  } else if (t === 'fixed') {
    prog.ck = (document.getElementById('kf-ck')||{}).value || 5;
  } else if (t === 'tier_qty') {
    prog.tUnit = (document.getElementById('kf-tunit')||{}).value || 'lon';
    prog.tiers = [];
    document.querySelectorAll('#km-tiers .km-tier-row').forEach(r => {
      const mn = (r.querySelector('.t-mn')||{}).value; const ck = (r.querySelector('.t-ck')||{}).value;
      if (mn && ck) prog.tiers.push({ mn: mn, ck: ck });
    });
  } else if (t === 'tier_money') {
    prog.tiers = [];
    document.querySelectorAll('#km-tiers .km-tier-row').forEach(r => {
      const type = (r.querySelector('.t-type')||{}).value;
      const val = (r.querySelector('.t-val')||{}).value;
      const ck = (r.querySelector('.t-ck')||{}).value;
      if (ck) prog.tiers.push({ type: type || 'below', value: val || 0, ck: ck });
    });
  }
  return prog;
}

function kmPreview() {
  const prog = kmReadForm();
  const area = document.getElementById('km-preview'); if (!area) return;
  const spMas = kmGetChecked();
  if (!spMas.length) { area.innerHTML = ''; return; }
  const p = SP.find(x => x.ma === spMas[0]); if (!p) return;
  const rules = kmBuildRules(prog);
  const pTest = { ...p, kmRules: rules };
  const X = prog.type === 'bonus' ? (+prog.bX || 12) : 2;
  const km = _calcKM_orig(pTest, 0, X);
  const total = km.hopKM * X;
  area.innerHTML = `<div class="km-preview-box"><div style="font-size:11px;font-weight:700;color:var(--g);margin-bottom:6px">🔍 Preview — ${p.ten.slice(0,25)}</div><div class="km-pv-row"><span>Giá gốc/${p.donvi}</span><span>${fmt(p.giaNYLon)}đ</span></div><div class="km-pv-row"><span>Giá KM/${p.donvi}</span><b style="color:var(--g)">${fmt(km.hopKM)}đ</b></div>${km.bonus > 0 ? `<div class="km-pv-row"><span>Tặng thêm</span><span>${km.bonus} ${p.donvi}</span></div>` : ''}${km.disc > 0 ? `<div class="km-pv-row"><span>Tiết kiệm (${X} ${p.donvi})</span><b style="color:var(--r)">- ${fmt(km.disc)}đ</b></div>` : ''}<div class="km-pv-row" style="border-top:1px solid #a3e6c0;padding-top:5px;margin-top:3px"><span>Thành tiền (${X} ${p.donvi})</span><b style="color:var(--g)">${fmt(total)}đ</b></div></div>`;
}

function kmSaveForm() {
  const prog = kmReadForm();
  prog.spMas = kmGetChecked();
  prog.stackable = _kmStackable;
  if (!prog.name) { alert('Nhập tên chương trình'); return; }
  if (!prog.spMas.length) { alert('Chọn ít nhất 1 sản phẩm'); return; }
  if (_kmEditIdx >= 0) kmProgs[_kmEditIdx] = prog;
  else kmProgs.push(prog);
  kmSave();
  document.getElementById('km-modal').style.display = 'none';
  renderKMTab(); renderOrder();
  alert('✅ Đã lưu: ' + prog.name);
}

function renderKMTab() {
  const fab = document.getElementById('km-fab');
  if (fab) fab.style.display = 'flex';
  const el = document.getElementById('km-list');
  if (!el) return;
  if (!kmProgs.length) {
    el.innerHTML = '<div class="empty">Chưa có CT KM nào<br><small>Nhấn ＋ để tạo</small></div>';
    return;
  }

  const groups = { all: [], A: [], B: [], C: [], D: [], other: [] };
  kmProgs.forEach((prog, i) => {
    const label = (prog.nhoms || '').trim();
    const key = label ? (groups[label] ? label : 'other') : 'all';
    groups[key].push({ prog, idx: i });
  });

  const sectionOrder = ['all', 'A', 'B', 'C', 'D', 'other'];
  const sectionLabels = { all: 'Tất cả', A: 'A·Bột', B: 'B·Đặc', C: 'C·Nước', D: 'D·Chua', other: 'Khác' };
  let html = '';

  sectionOrder.forEach(key => {
    if (!groups[key].length) return;
    html += `<div class="km-section"><div class="km-sec-hd">${sectionLabels[key]} (${groups[key].length})</div>`;
    html += groups[key].map(item => {
      const prog = item.prog;
      const i = item.idx;
      const cnt = (prog.spMas || []).length;
      const txt = kmBuildText(prog);
      const stackLbl = prog.stackable ? '🔗 Được gộp' : '🔒 Không gộp';
      return `<div class="km-card"><div class="km-card-h"><div style="flex:1;min-width:0"><div class="km-card-nm">${prog.name || 'CT KM'}</div><div class="km-card-sm">${txt} · ${cnt} SP · ${stackLbl}</div></div><span class="km-badge ${prog.active ? 'on' : ''}">${prog.active ? '✓ Bật' : '○ Tắt'}</span></div><div class="km-card-f"><button class="btn-kme" onclick="kmEdit(${i})">✏️ Sửa</button><button class="btn-kmt" onclick="kmToggle(${i})">${prog.active ? '⏸ Tắt' : '▶ Bật'}</button><button class="btn-kmd" onclick="kmDel(${i})">✕</button></div></div>`;
    }).join('');
    html += '</div>';
  });

  el.innerHTML = html;
}

function kmToggle(i) { kmProgs[i].active = !kmProgs[i].active; kmSave(); renderKMTab(); renderOrder(); }
function kmDel(i) { if (confirm('Xóa "' + kmProgs[i].name + '"?')) { kmProgs.splice(i,1); kmSave(); renderKMTab(); renderOrder(); } }
function kmEdit(i) { kmOpenModal(kmProgs[i], i); }

function kmBuildText(prog) {
  const t = prog.type;
  if (t === 'bonus') {
    let s = prog.bX + '+' + prog.bY;
    if (prog.bMa && prog.bMa !== 'same') s += ' tặng ' + prog.bMa;
    else s += ' cùng loại';
    return s;
  }
  if (t === 'fixed') return 'CK ' + prog.ck + '%';
  if (t === 'tier_qty') return (prog.tiers || []).map(ti => ti.mn + '+ CK' + ti.ck + '%').join(' | ');
  if (t === 'tier_money') return (prog.tiers || []).map(ti => (ti.type === 'below' ? '<' : '≥') + (ti.value || 0) + 'K CK' + ti.ck + '%').join(' | ');
  return '';
}

// Xuất/nhập riêng CT KM
function exportKM() {
  if (!kmProgs.length) { alert('Chưa có CT KM'); return; }
  const dataStr = JSON.stringify(kmProgs, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `vnm_km_${new Date().toISOString().slice(0,19)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  alert('✅ Đã xuất CT KM');
}

function importKM() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json';
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!Array.isArray(data)) throw new Error('File không đúng định dạng');
        const action = confirm('Thay thế toàn bộ CT KM hiện tại? (OK = thay thế, Cancel = gộp thêm)');
        if (action) kmProgs = data;
        else kmProgs.push(...data);
        kmSave();
        renderKMTab();
        renderOrder();
        alert(`Đã ${action ? 'thay thế' : 'gộp thêm'} ${data.length} CT KM`);
      } catch (err) { alert('Lỗi đọc file: ' + err.message); }
    };
    reader.readAsText(file);
  };
  input.click();
}

async function loadKMFromURL() {
  const url = prompt('Nhập URL raw GitHub (vd: https://raw.githubusercontent.com/.../promotions.json)');
  if (!url) return;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error('Dữ liệu không phải mảng');
    const action = confirm('Thay thế toàn bộ CT KM hiện tại? (OK = thay thế, Cancel = gộp thêm)');
    if (action) kmProgs = data;
    else kmProgs.push(...data);
    kmSave();
    renderKMTab();
    renderOrder();
    alert(`✅ Đã tải ${data.length} CT KM`);
  } catch (err) {
    alert('Lỗi tải URL: ' + err.message);
  }
}

// Xuất ra window
window.kmOpenModal = kmOpenModal;
window.kmCloseModal = kmCloseModal;
window.kmRenderForm = kmRenderForm;
window.kmSetStack = kmSetStack;
window.kmSelType = kmSelType;
window.kmTypeFields = kmTypeFields;
window.kmAddTier = kmAddTier;
window.kmDelTier = kmDelTier;
window.kmPickNhom = kmPickNhom;
window.kmRenderPicker = kmRenderPicker;
window.toggleFavorite = toggleFavorite;
window.kmCheckAll = kmCheckAll;
window.kmGetChecked = kmGetChecked;
window.kmReadForm = kmReadForm;
window.kmPreview = kmPreview;
window.kmSaveForm = kmSaveForm;
window.renderKMTab = renderKMTab;
window.kmToggle = kmToggle;
window.kmDel = kmDel;
window.kmEdit = kmEdit;
window.kmBuildText = kmBuildText;
window.exportKM = exportKM;
window.importKM = importKM;
window.loadKMFromURL = loadKMFromURL;