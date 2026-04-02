// Quản lý CT KM (modal, form)

let _kmEditIdx = -1;
let _kmPickerNhom = '';
let _kmStackable = true;

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
  var body = document.getElementById('km-modal-body');
  var t = prog.type || 'bonus';
  var typeLabels = { bonus: '🎁 Tặng hàng', fixed: '% CK cố định', tier_qty: '📦 CK theo SL', tier_money: '💰 CK theo tiền', order_money: '🧾 CK đơn hàng', order_bonus: '🎯 Tặng SP theo ĐH' };

  var html = '<div class="kf"><div class="kfl">Tên chương trình</div><input type="text" id="kf-name" value="' + (prog.name || '') + '" placeholder="VD: Sữa đặc NSPN xuất nhỏ xanh lá" inputmode="text"></div>';

  html += '<div class="kf"><div class="kfl">Loại khuyến mãi</div><div class="km-types">';
  ['bonus', 'fixed', 'tier_qty', 'tier_money', 'order_money', 'order_bonus'].forEach(function(tp) {
    html += '<button class="km-type-btn' + (t === tp ? ' sel' : '') + '" onclick="kmSelType(\'' + tp + '\')">' + typeLabels[tp] + '</button>';
  });
  html += '</div></div>';

  html += '<div id="kf-fields">' + kmTypeFields(prog) + '</div>';

  // minSKU field
  html += '<div class="kf"><div class="kfl">ĐK số SKU tối thiểu (tuỳ chọn)</div><input type="number" id="kf-minsku" value="' + (prog.minSKU || '') + '" placeholder="VD: 2 = cần ≥2 mã SP khác nhau" min="0" max="20" inputmode="numeric" style="height:40px;border:1.5px solid var(--l2);border-radius:var(--Rs);padding:0 11px;font-size:15px;width:100%;"></div>';

  // Stackable
  html += '<div class="kf"><div class="kfl">Gộp với CT KM khác</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><button class="km-stack-btn' + (_kmStackable ? ' sel' : '') + '" onclick="kmSetStack(true,this)">🔗 Được gộp<br><span style="font-size:10px;font-weight:400;opacity:.7">Cộng thêm với CT khác</span></button><button class="km-stack-btn' + (!_kmStackable ? ' sel' : '') + '" onclick="kmSetStack(false,this)">🔒 Không gộp<br><span style="font-size:10px;font-weight:400;opacity:.7">Chỉ dùng 1 CT lợi nhất</span></button></div></div>';

  // Product picker (skip for order_money without spMas)
  html += '<div class="kf"><div class="kfl">Gán cho sản phẩm</div>';
  html += '<div class="km-nhom-row">';
  ['', 'A', 'B', 'C', 'D'].forEach(function(n) {
    var lbl = n ? n + '·' + { A: 'Bột', B: 'Đặc', C: 'Nước', D: 'Chua' }[n] : 'Tất cả';
    html += '<button class="km-nhom-btn' + (_kmPickerNhom === n ? ' sel' : '') + '" onclick="kmPickNhom(\'' + n + '\')">' + lbl + '</button>';
  });
  html += '</div>';
  html += '<div style="display:flex;gap:7px;margin-bottom:6px"><button onclick="kmCheckAll(true)" style="flex:1;height:30px;border:1px solid var(--l2);border-radius:var(--Rs);background:#fff;font-size:11px;font-weight:700;color:var(--t2);cursor:pointer">Chọn tất cả</button><button onclick="kmCheckAll(false)" style="flex:1;height:30px;border:1px solid var(--l2);border-radius:var(--Rs);background:#fff;font-size:11px;font-weight:700;color:var(--t2);cursor:pointer">Bỏ chọn</button></div>';
  html += '<div class="km-picker" id="km-picker"></div></div>';

  html += '<div id="km-preview"></div>';
  html += '<button class="btn-km-save" onclick="kmSaveForm()">💾 Lưu chương trình</button>';

  body.innerHTML = html;
  kmRenderPicker(prog.spMas || []);
  kmPreview();
}

function kmSetStack(val, btn) {
  _kmStackable = val;
  document.querySelectorAll('.km-stack-btn').forEach(function(b) { b.className = 'km-stack-btn'; });
  btn.className = 'km-stack-btn sel';
}

function kmSelType(tp) {
  var cur = kmReadForm(); cur.type = tp;
  document.querySelectorAll('.km-type-btn').forEach(function(b) { b.className = 'km-type-btn'; });
  // Find and select the right button
  var buttons = document.querySelectorAll('.km-type-btn');
  var typeLabels = { bonus: 'Tặng hàng', fixed: 'cố định', tier_qty: 'theo SL', tier_money: 'theo tiền', order_money: 'đơn hàng', order_bonus: 'Tặng SP' };
  buttons.forEach(function(b) {
    if (b.textContent.indexOf(typeLabels[tp]) >= 0) b.className = 'km-type-btn sel';
  });
  document.getElementById('kf-fields').innerHTML = kmTypeFields(cur);
  kmPreview();
}

function kmTypeFields(prog) {
  var t = prog.type || 'bonus';

  if (t === 'bonus') {
    var spOpts = '<option value="same"' + ((!prog.bMa || prog.bMa === 'same') ? ' selected' : '') + '>Cùng loại SP đó</option>';
    SP.forEach(function(p) { if (p.nhom === 'B' || p.nhom === 'C' || p.nhom === 'D') spOpts += '<option value="' + p.ma + '"' + (prog.bMa === p.ma ? ' selected' : '') + '>' + p.ma + ' - ' + p.ten.slice(0, 28) + '</option>'; });
    return '<div class="kf"><div class="kfl">Mua X → Tặng Y</div><div style="display:grid;grid-template-columns:1fr 24px 1fr;gap:8px;align-items:center;margin-bottom:10px"><div><div style="font-size:10px;color:var(--t3);margin-bottom:3px">Mua X</div><input type="number" id="kf-bx" value="' + (prog.bX || 12) + '" min="1" style="width:100%;height:42px;border:1.5px solid var(--l2);border-radius:var(--Rs);text-align:center;font-size:20px;font-weight:800;" oninput="kmPreview()"></div><div style="text-align:center;color:var(--t3);font-size:18px">→</div><div><div style="font-size:10px;color:var(--t3);margin-bottom:3px">Tặng Y</div><input type="number" id="kf-by" value="' + (prog.bY || 1) + '" min="1" style="width:100%;height:42px;border:1.5px solid var(--l2);border-radius:var(--Rs);text-align:center;font-size:20px;font-weight:800;" oninput="kmPreview()"></div></div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px"><div><div style="font-size:10px;color:var(--t3);margin-bottom:3px">Đơn vị</div><select id="kf-bunit" style="width:100%;height:38px;border:1.5px solid var(--l2);border-radius:var(--Rs);padding:0 9px;font-size:14px;"><option value="lon"' + (prog.bUnit !== 'thung' ? ' selected' : '') + '>Lon/Hộp</option><option value="thung"' + (prog.bUnit === 'thung' ? ' selected' : '') + '>Thùng</option></select></div><div><div style="font-size:10px;color:var(--t3);margin-bottom:3px">Áp tối đa</div><select id="kf-bmax" style="width:100%;height:38px;border:1.5px solid var(--l2);border-radius:var(--Rs);padding:0 9px;font-size:14px;"><option value="0"' + (!prog.bMax ? ' selected' : '') + '>Không giới hạn</option><option value="1"' + (prog.bMax == 1 ? ' selected' : '') + '>1 lần</option></select></div></div>' +
      '<div><div style="font-size:10px;color:var(--t3);margin-bottom:3px">SP được tặng</div><select id="kf-bma" style="width:100%;height:38px;border:1.5px solid var(--l2);border-radius:var(--Rs);padding:0 9px;font-size:13px;" onchange="kmPreview()">' + spOpts + '</select></div></div>';
  }

  if (t === 'fixed') {
    return '<div class="kf"><div class="kfl">Chiết khấu</div><div style="display:flex;gap:8px;align-items:center"><input type="number" id="kf-ck" value="' + (prog.ck || 5) + '" min="1" max="50" style="flex:1;height:46px;border:1.5px solid var(--l2);border-radius:var(--Rs);padding:0 12px;font-size:24px;font-weight:800;text-align:center;" oninput="kmPreview()"><span style="font-size:24px;font-weight:700;color:var(--t2)">%</span></div></div>';
  }

  if (t === 'tier_qty') {
    var rows = (prog.tiers || [{ mn: 2, ck: 3 }]).map(function(ti, i) { return '<div class="km-tier-row" id="ktr-' + i + '"><label>Từ</label><input type="number" class="t-mn" value="' + ti.mn + '" min="1" oninput="kmPreview()"><label>CK</label><input type="number" class="t-ck" value="' + ti.ck + '" min="1" max="50" oninput="kmPreview()"><label>%</label><button class="btn-dtr" onclick="kmDelTier(this)">✕</button></div>'; }).join('');
    return '<div class="kf"><div class="kfl">CK theo số lượng</div><div style="display:flex;gap:8px;align-items:center;margin-bottom:8px"><span style="font-size:12px;font-weight:700;color:var(--t2)">Tính theo:</span><select id="kf-tunit" style="flex:1;height:36px;border:1.5px solid var(--l2);border-radius:var(--Rs);padding:0 9px;font-size:13px;"><option value="lon"' + (prog.tUnit !== 'thung' ? ' selected' : '') + '>Lon/Hộp</option><option value="thung"' + (prog.tUnit === 'thung' ? ' selected' : '') + '>Thùng</option></select></div><div id="km-tiers">' + rows + '</div><button class="btn-atr" onclick="kmAddTier(\'qty\')">+ Thêm mức</button></div>';
  }

  if (t === 'tier_money') {
    var rows = (prog.tiers || [{ type: 'below', value: 600, ck: 12 }]).map(function(ti, i) { return '<div class="km-tier-row" id="ktr-' + i + '"><select class="t-type" onchange="kmPreview()"><option value="below"' + (ti.type === 'below' ? ' selected' : '') + '>Dưới</option><option value="above"' + (ti.type === 'above' ? ' selected' : '') + '>Trên</option></select><input type="number" class="t-val" value="' + (ti.value || 0) + '" placeholder="K" oninput="kmPreview()"><label>K→CK</label><input type="number" class="t-ck" value="' + ti.ck + '" min="0" max="50" oninput="kmPreview()"><label>%</label><button class="btn-dtr" onclick="kmDelTier(this)">✕</button></div>'; }).join('');
    return '<div class="kf"><div class="kfl">CK theo tổng tiền</div><div id="km-tiers">' + rows + '</div><button class="btn-atr" onclick="kmAddTier(\'money\')">+ Thêm mức</button><div style="font-size:10px;color:var(--t3);margin-top:5px">Dưới/Trên số tiền → áp dụng CK</div></div>';
  }

  if (t === 'order_money') {
    var rows = (prog.tiers || [{ type: 'above', value: 1000, ck: 1 }]).map(function(ti, i) { return '<div class="km-tier-row" id="ktr-' + i + '"><select class="t-type" onchange="kmPreview()"><option value="below"' + (ti.type === 'below' ? ' selected' : '') + '>Dưới</option><option value="above"' + (ti.type === 'above' ? ' selected' : '') + '>Trên</option></select><input type="number" class="t-val" value="' + (ti.value || 0) + '" placeholder="K" oninput="kmPreview()"><label>K→CK</label><input type="number" class="t-ck" value="' + ti.ck + '" min="0" max="50" oninput="kmPreview()"><label>%</label><button class="btn-dtr" onclick="kmDelTier(this)">✕</button></div>'; }).join('');
    return '<div class="kf"><div class="kfl">CK theo tổng đơn hàng</div><div id="km-tiers">' + rows + '</div><button class="btn-atr" onclick="kmAddTier(\'money\')">+ Thêm mức</button><div style="font-size:10px;color:var(--t3);margin-top:5px">Giá trị đơn hàng tính theo K (1K = 1.000 VND).</div></div>';
  }

  if (t === 'order_bonus') {
    // Mới: Tặng SP khi đạt mức đơn hàng
    var spOpts = '<option value="">-- Chọn SP tặng --</option>';
    SP.forEach(function(p) { spOpts += '<option value="' + p.ma + '"' + (prog.bonusMa === p.ma ? ' selected' : '') + '>' + p.ma + ' - ' + p.ten.slice(0, 35) + '</option>'; });
    var rows = (prog.tiers || [{ value: 250, bonusQty: 4, bonusMa: '', bonusName: '' }]).map(function(ti, i) {
      return '<div class="km-tier-row" style="flex-wrap:wrap" id="ktr-' + i + '"><label>Mua≥</label><input type="number" class="t-val" value="' + (ti.value || 0) + '" placeholder="K" style="width:70px" oninput="kmPreview()"><label>K→Tặng</label><input type="number" class="t-bqty" value="' + (ti.bonusQty || 0) + '" style="width:50px" oninput="kmPreview()"><label>SP</label><button class="btn-dtr" onclick="kmDelTier(this)">✕</button></div>';
    }).join('');
    return '<div class="kf"><div class="kfl">Tặng SP khi đạt mức đơn hàng</div>' +
      '<div style="margin-bottom:8px"><div style="font-size:10px;color:var(--t3);margin-bottom:3px">SP được tặng</div><select id="kf-bonus-ma" style="width:100%;height:38px;border:1.5px solid var(--l2);border-radius:var(--Rs);padding:0 9px;font-size:13px;" onchange="kmPreview()">' + spOpts + '</select></div>' +
      '<div style="margin-bottom:8px"><div style="font-size:10px;color:var(--t3);margin-bottom:3px">Tên SP tặng (nếu không chọn mã)</div><input type="text" id="kf-bonus-name" value="' + (prog.bonusName || '') + '" placeholder="VD: lốc DGP 110ml" style="width:100%;height:36px;border:1.5px solid var(--l2);border-radius:var(--Rs);padding:0 9px;font-size:13px;"></div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px"><div><div style="font-size:10px;color:var(--t3);margin-bottom:3px">Lặp lại</div><select id="kf-bonus-repeat" style="width:100%;height:36px;border:1.5px solid var(--l2);border-radius:var(--Rs);padding:0 9px;font-size:13px;"><option value="1"' + (prog.repeat !== false ? ' selected' : '') + '>Mỗi X đồng tặng Y</option><option value="0"' + (prog.repeat === false ? ' selected' : '') + '>Chỉ 1 suất</option></select></div><div><div style="font-size:10px;color:var(--t3);margin-bottom:3px">Tối đa suất</div><input type="number" id="kf-bonus-max" value="' + (prog.maxSets || '') + '" placeholder="0=ko giới hạn" style="width:100%;height:36px;border:1.5px solid var(--l2);border-radius:var(--Rs);padding:0 9px;font-size:13px;"></div></div>' +
      '<div id="km-tiers">' + rows + '</div><button class="btn-atr" onclick="kmAddTier(\'order_bonus\')">+ Thêm mức</button>' +
      '<div style="font-size:10px;color:var(--t3);margin-top:5px">Giá trị K (1K = 1.000 VND). Tặng SP khi tổng ĐH (các SP được chọn) đạt mức.</div></div>';
  }

  return '';
}

function kmAddTier(kind) {
  var list = document.getElementById('km-tiers'); if (!list) return;
  var i = list.children.length;
  var div = document.createElement('div');
  div.className = 'km-tier-row'; div.id = 'ktr-' + i;
  if (kind === 'money') {
    div.innerHTML = '<select class="t-type"><option value="below" selected>Dưới</option><option value="above">Trên</option></select><input type="number" class="t-val" value="0" placeholder="K"><label>K→CK</label><input type="number" class="t-ck" value="0"><label>%</label><button class="btn-dtr" onclick="kmDelTier(this)">✕</button>';
  } else if (kind === 'order_bonus') {
    div.innerHTML = '<label>Mua≥</label><input type="number" class="t-val" value="0" placeholder="K" style="width:70px"><label>K→Tặng</label><input type="number" class="t-bqty" value="0" style="width:50px"><label>SP</label><button class="btn-dtr" onclick="kmDelTier(this)">✕</button>';
    div.style.flexWrap = 'wrap';
  } else {
    div.innerHTML = '<label>Từ</label><input type="number" class="t-mn" value="2"><label>CK</label><input type="number" class="t-ck" value="0"><label>%</label><button class="btn-dtr" onclick="kmDelTier(this)">✕</button>';
  }
  list.appendChild(div); kmPreview();
}

function kmDelTier(btn) { btn.closest('.km-tier-row').remove(); kmPreview(); }

function kmPickNhom(n) {
  _kmPickerNhom = n;
  document.querySelectorAll('.km-nhom-btn').forEach(function(b) {
    var match = n ? (b.textContent.indexOf(n + '·') === 0) : b.textContent === 'Tất cả';
    b.className = 'km-nhom-btn' + (match ? ' sel' : '');
  });
  var cur = [];
  document.querySelectorAll('.km-pick-cb:checked').forEach(function(c) { cur.push(c.value); });
  kmRenderPicker(cur);
}

function kmRenderPicker(checked) {
  var el = document.getElementById('km-picker'); if (!el) return;
  var favorites = JSON.parse(localStorage.getItem('vnm_favorites') || '[]');
  var selected = Array.isArray(checked) ? checked : [];
  var pickedProducts = selected.map(function(ma) { return SP.find(function(p) { return p.ma === ma; }); }).filter(Boolean);
  var missingCodes = selected.filter(function(ma) { return !pickedProducts.some(function(p) { return p.ma === ma; }); });
  var list = SP.filter(function(p) { return !_kmPickerNhom || p.nhom === _kmPickerNhom; });
  list.sort(function(a, b) {
    var aFav = favorites.includes(a.ma);
    var bFav = favorites.includes(b.ma);
    if (aFav !== bFav) return aFav ? -1 : 1;
    return a.ten.localeCompare(b.ten);
  });
  var visible = [];
  var added = new Set();
  pickedProducts.forEach(function(p) { visible.push(p); added.add(p.ma); });
  list.forEach(function(p) { if (!added.has(p.ma)) { visible.push(p); added.add(p.ma); } });
  var nhomLabels = { A: 'Bột', B: 'Đặc', C: 'Nước', D: 'Chua' };
  var rows = visible.map(function(p) {
    var isFav = favorites.includes(p.ma);
    return '<div class="km-pick-row" data-ma="' + p.ma + '"><input type="checkbox" class="km-pick-cb" id="kpk-' + p.ma + '" value="' + p.ma + '"' + (selected.indexOf(p.ma) >= 0 ? ' checked' : '') + ' onchange="kmPreview()"><label for="kpk-' + p.ma + '" style="flex:1;cursor:pointer;display:flex;align-items:center;justify-content:space-between;"><div><div style="font-size:12px;color:var(--t1)">' + p.ten + '</div><div style="font-size:10px;color:var(--t3)">' + p.ma + ' · ' + fmt(p.giaNYLon) + 'đ/' + p.donvi + '</div></div><div style="display:flex;align-items:center;gap:6px;"><span class="sp-nhom-badge ' + p.nhom + '">' + (nhomLabels[p.nhom] || '') + '</span><span class="fav-star' + (isFav ? ' active' : '') + '" data-ma="' + p.ma + '" onclick="toggleFavorite(event, \'' + p.ma + '\')">★</span></div></label></div>';
  });
  if (missingCodes.length) {
    var missingRows = missingCodes.map(function(ma) {
      return '<div class="km-pick-row" data-ma="' + ma + '"><input type="checkbox" class="km-pick-cb" id="kpk-' + ma + '" value="' + ma + '" checked onchange="kmPreview()"><label for="kpk-' + ma + '" style="flex:1;cursor:pointer"><div style="font-size:12px;color:var(--r)">[Không có dữ liệu SP]</div><div style="font-size:10px;color:var(--t3)">' + ma + '</div></label></div>';
    });
    el.innerHTML = missingRows.join('') + rows.join('');
  } else {
    el.innerHTML = rows.join('');
  }
}

function toggleFavorite(event, ma) {
  if (event && event.stopPropagation) event.stopPropagation();
  var favorites = JSON.parse(localStorage.getItem('vnm_favorites') || '[]');
  var idx = favorites.indexOf(ma);
  if (idx === -1) favorites.push(ma);
  else favorites.splice(idx, 1);
  localStorage.setItem('vnm_favorites', JSON.stringify(favorites));
  var currentChecked = kmGetChecked ? kmGetChecked() : [];
  if (window.kmRenderPicker) window.kmRenderPicker(currentChecked);
  if (window.renderOrder) window.renderOrder();
}

function kmCheckAll(val) { document.querySelectorAll('.km-pick-cb').forEach(function(cb) { cb.checked = val; }); kmPreview(); }

function kmGetChecked() { var r = []; document.querySelectorAll('.km-pick-cb:checked').forEach(function(c) { r.push(c.value); }); return r; }

function kmReadForm() {
  var selBtn = document.querySelector('.km-type-btn.sel');
  var t = 'bonus';
  if (selBtn) {
    var txt = selBtn.textContent;
    if (txt.indexOf('Tặng hàng') >= 0) t = 'bonus';
    else if (txt.indexOf('cố định') >= 0) t = 'fixed';
    else if (txt.indexOf('theo SL') >= 0) t = 'tier_qty';
    else if (txt.indexOf('Tặng SP') >= 0) t = 'order_bonus';
    else if (txt.indexOf('đơn hàng') >= 0) t = 'order_money';
    else if (txt.indexOf('theo tiền') >= 0) t = 'tier_money';
  }
  var prog = {
    name: (document.getElementById('kf-name') || {}).value || '',
    type: t,
    nhoms: _kmPickerNhom,
    active: true,
    stackable: _kmStackable,
    minSKU: parseInt((document.getElementById('kf-minsku') || {}).value) || 0
  };
  if (!prog.minSKU) delete prog.minSKU;

  if (t === 'bonus') {
    prog.bX = (document.getElementById('kf-bx') || {}).value || 12;
    prog.bY = (document.getElementById('kf-by') || {}).value || 1;
    prog.bUnit = (document.getElementById('kf-bunit') || {}).value || 'lon';
    prog.bMax = +((document.getElementById('kf-bmax') || {}).value || 0);
    prog.bMa = (document.getElementById('kf-bma') || {}).value || 'same';
  } else if (t === 'fixed') {
    prog.ck = (document.getElementById('kf-ck') || {}).value || 5;
  } else if (t === 'tier_qty') {
    prog.tUnit = (document.getElementById('kf-tunit') || {}).value || 'lon';
    prog.tiers = [];
    document.querySelectorAll('#km-tiers .km-tier-row').forEach(function(r) {
      var mn = (r.querySelector('.t-mn') || {}).value; var ck = (r.querySelector('.t-ck') || {}).value;
      if (mn && ck) prog.tiers.push({ mn: mn, ck: ck });
    });
  } else if (t === 'tier_money' || t === 'order_money') {
    prog.tiers = [];
    document.querySelectorAll('#km-tiers .km-tier-row').forEach(function(r) {
      var type = (r.querySelector('.t-type') || {}).value;
      var val = (r.querySelector('.t-val') || {}).value;
      var ck = (r.querySelector('.t-ck') || {}).value;
      if (ck) prog.tiers.push({ type: type || 'below', value: val || 0, ck: ck });
    });
  } else if (t === 'order_bonus') {
    prog.bonusMa = (document.getElementById('kf-bonus-ma') || {}).value || '';
    prog.bonusName = (document.getElementById('kf-bonus-name') || {}).value || '';
    prog.repeat = (document.getElementById('kf-bonus-repeat') || {}).value !== '0';
    prog.maxSets = parseInt((document.getElementById('kf-bonus-max') || {}).value) || 0;
    prog.tiers = [];
    document.querySelectorAll('#km-tiers .km-tier-row').forEach(function(r) {
      var val = (r.querySelector('.t-val') || {}).value;
      var bqty = (r.querySelector('.t-bqty') || {}).value;
      if (val && bqty) prog.tiers.push({ value: val, bonusQty: bqty });
    });
  }
  return prog;
}

function kmPreview() {
  var prog = kmReadForm();
  var area = document.getElementById('km-preview'); if (!area) return;
  var spMas = kmGetChecked();
  if (prog.type === 'order_money') {
    var text = kmBuildText(prog) || 'CK theo tổng đơn hàng';
    area.innerHTML = '<div class="km-preview-box"><div style="font-size:11px;font-weight:700;color:var(--g);margin-bottom:6px">🔍 Preview CTKM đơn hàng</div><div class="km-pv-row"><span>Chi tiết</span><span>' + text + '</span></div></div>';
    return;
  }
  if (prog.type === 'order_bonus') {
    var text = kmBuildText(prog) || 'Tặng SP theo ĐH';
    area.innerHTML = '<div class="km-preview-box"><div style="font-size:11px;font-weight:700;color:var(--g);margin-bottom:6px">🔍 Preview CTKM Tặng SP</div><div class="km-pv-row"><span>Chi tiết</span><span>' + text + '</span></div>' + (prog.minSKU ? '<div class="km-pv-row"><span>ĐK SKU tối thiểu</span><span>≥' + prog.minSKU + ' mã SP</span></div>' : '') + '</div>';
    return;
  }
  if (!spMas.length) { area.innerHTML = ''; return; }
  var p = SP.find(function(x) { return spMas.includes(x.ma); });
  if (!p) { area.innerHTML = '<div class="km-preview-box"><div style="font-size:11px;font-weight:700;color:var(--g);margin-bottom:6px">🔍 Preview</div><div class="km-pv-row"><span>Chú ý</span><span>Không tìm thấy SP hợp lệ</span></div></div>'; return; }
  var rules = kmBuildRules(prog);
  var pTest = Object.assign({}, p, { kmRules: rules });
  var X = prog.type === 'bonus' ? (+prog.bX || 12) : 2;
  var km = _calcKM_orig(pTest, 0, X);
  var total = km.hopKM * X;
  area.innerHTML = '<div class="km-preview-box"><div style="font-size:11px;font-weight:700;color:var(--g);margin-bottom:6px">🔍 Preview — ' + p.ten.slice(0, 25) + '</div><div class="km-pv-row"><span>Giá gốc/' + p.donvi + '</span><span>' + fmt(p.giaNYLon) + 'đ</span></div><div class="km-pv-row"><span>Giá KM/' + p.donvi + '</span><b style="color:var(--g)">' + fmt(km.hopKM) + 'đ</b></div>' + (km.bonus > 0 ? '<div class="km-pv-row"><span>Tặng thêm</span><span>' + km.bonus + ' ' + p.donvi + '</span></div>' : '') + (km.disc > 0 ? '<div class="km-pv-row"><span>Tiết kiệm (' + X + ' ' + p.donvi + ')</span><b style="color:var(--r)">- ' + fmt(km.disc) + 'đ</b></div>' : '') + (prog.minSKU ? '<div class="km-pv-row"><span>ĐK SKU tối thiểu</span><span>≥' + prog.minSKU + ' mã SP</span></div>' : '') + '<div class="km-pv-row" style="border-top:1px solid #a3e6c0;padding-top:5px;margin-top:3px"><span>Thành tiền (' + X + ' ' + p.donvi + ')</span><b style="color:var(--g)">' + fmt(total) + 'đ</b></div></div>';
}

function kmSaveForm() {
  var prog = kmReadForm();
  prog.spMas = kmGetChecked();
  prog.stackable = _kmStackable;
  if (!prog.name) { alert('Nhập tên chương trình'); return; }
  if (prog.type !== 'order_money' && prog.type !== 'order_bonus' && !prog.spMas.length) { alert('Chọn ít nhất 1 sản phẩm'); return; }
  if (_kmEditIdx >= 0) kmProgs[_kmEditIdx] = prog;
  else kmProgs.push(prog);
  kmSave();
  document.getElementById('km-modal').style.display = 'none';
  renderKMTab(); renderOrder();
  alert('✅ Đã lưu: ' + prog.name);
}

function renderKMTab() {
  var fab = document.getElementById('km-fab');
  if (fab) fab.style.display = 'flex';
  var el = document.getElementById('km-list');
  if (!el) return;
  if (!kmProgs.length) { el.innerHTML = '<div class="empty">Chưa có CT KM nào<br><small>Nhấn ＋ để tạo</small></div>'; return; }
  var groups = { all: [], A: [], B: [], C: [], D: [], other: [] };
  kmProgs.forEach(function(prog, i) {
    var label = (prog.nhoms || '').trim();
    var key = label ? (groups[label] ? label : 'other') : 'all';
    groups[key].push({ prog: prog, idx: i });
  });
  var sectionOrder = ['all', 'A', 'B', 'C', 'D', 'other'];
  var sectionLabels = { all: 'Tất cả', A: 'A·Bột', B: 'B·Đặc', C: 'C·Nước', D: 'D·Chua', other: 'Khác' };
  var html = '';
  sectionOrder.forEach(function(key) {
    if (!groups[key].length) return;
    html += '<div class="km-section"><div class="km-sec-hd">' + sectionLabels[key] + ' (' + groups[key].length + ')</div>';
    groups[key].forEach(function(item) {
      var prog = item.prog;
      var i = item.idx;
      var cnt = (prog.spMas || []).length;
      var txt = kmBuildText(prog);
      var stackLbl = prog.stackable ? '🔗 Gộp' : '🔒 Ko gộp';
      var minSKULbl = prog.minSKU ? ' · ≥' + prog.minSKU + ' SKU' : '';
      html += '<div class="km-card"><div class="km-card-h"><div style="flex:1;min-width:0"><div class="km-card-nm">' + (prog.name || 'CT KM') + '</div><div class="km-card-sm">' + txt + ' · ' + cnt + ' SP · ' + stackLbl + minSKULbl + '</div></div><span class="km-badge ' + (prog.active ? 'on' : '') + '">' + (prog.active ? '✓ Bật' : '○ Tắt') + '</span></div><div class="km-card-f"><button class="btn-kme" onclick="kmEdit(' + i + ')">✏️ Sửa</button><button class="btn-kmt" onclick="kmToggle(' + i + ')">' + (prog.active ? '⏸ Tắt' : '▶ Bật') + '</button><button class="btn-kmd" onclick="kmDel(' + i + ')">✕</button></div></div>';
    });
    html += '</div>';
  });
  el.innerHTML = html;
}

function kmToggle(i) { kmProgs[i].active = !kmProgs[i].active; kmSave(); renderKMTab(); renderOrder(); }
function kmDel(i) { if (confirm('Xóa "' + kmProgs[i].name + '"?')) { kmProgs.splice(i, 1); kmSave(); renderKMTab(); renderOrder(); } }
function kmEdit(i) { kmOpenModal(kmProgs[i], i); }

function kmBuildText(prog) {
  var t = prog.type;
  if (t === 'bonus') {
    var s = prog.bX + '+' + prog.bY;
    if (prog.bMa && prog.bMa !== 'same') s += ' tặng ' + prog.bMa;
    else s += ' cùng loại';
    return s;
  }
  if (t === 'fixed') return 'CK ' + prog.ck + '%';
  if (t === 'tier_qty') return (prog.tiers || []).map(function(ti) { return ti.mn + '+ CK' + ti.ck + '%'; }).join(' | ');
  if (t === 'tier_money' || t === 'order_money') return (prog.tiers || []).map(function(ti) { return (ti.type === 'below' ? '<' : '≥') + (ti.value || 0) + 'K CK' + ti.ck + '%'; }).join(' | ');
  if (t === 'order_bonus') {
    var name = prog.bonusName || (prog.bonusMa ? prog.bonusMa : 'SP');
    return (prog.tiers || []).map(function(ti) { return '≥' + (ti.value || 0) + 'K → ' + (ti.bonusQty || 0) + ' ' + name; }).join(' | ');
  }
  return '';
}

// Xuất/nhập CT KM
function exportKM() {
  if (!kmProgs.length) { alert('Chưa có CT KM'); return; }
  var dataStr = JSON.stringify(kmProgs, null, 2);
  var blob = new Blob([dataStr], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'vnm_km_' + new Date().toISOString().slice(0, 19) + '.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  alert('✅ Đã xuất CT KM');
}

function importKM() {
  var input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json';
  input.onchange = function(e) {
    var file = e.target.files[0]; if (!file) return;
    var reader = new FileReader();
    reader.onload = function(ev) {
      try {
        var data = JSON.parse(ev.target.result);
        if (!Array.isArray(data)) throw new Error('File không đúng định dạng');
        var action = confirm('Thay thế toàn bộ CT KM hiện tại? (OK = thay thế, Cancel = gộp thêm)');
        if (action) kmProgs = data;
        else kmProgs.push.apply(kmProgs, data);
        kmSave(); renderKMTab(); renderOrder();
        alert((action ? 'Thay thế' : 'Gộp thêm') + ' ' + data.length + ' CT KM');
      } catch (err) { alert('Lỗi đọc file: ' + err.message); }
    };
    reader.readAsText(file);
  };
  input.click();
}

async function loadKMFromURL() {
  var url = prompt('Nhập URL raw GitHub (vd: https://raw.githubusercontent.com/.../promotions.json)');
  if (!url) return;
  try {
    var res = await fetch(url);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    var data = await res.json();
    if (!Array.isArray(data)) throw new Error('Dữ liệu không phải mảng');
    var action = confirm('Thay thế toàn bộ CT KM hiện tại? (OK = thay thế, Cancel = gộp thêm)');
    if (action) kmProgs = data;
    else kmProgs.push.apply(kmProgs, data);
    kmSave(); renderKMTab(); renderOrder();
    alert('✅ Đã tải ' + data.length + ' CT KM');
  } catch (err) { alert('Lỗi tải URL: ' + err.message); }
}

// Export
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
