// ============================================================
// UI v4 — Đặt hàng (brand filter + KH selector) + Quản lý SP
// Fixed: CUS variable reference, _selectedCustomerMa sync
// ============================================================

var nhomF = { order: '', adm: '' };
var brandF = '';
var _searchTimer = null;
var _spEditMa = null;
var _selectedCustomerMa = '';

// ============================================================
// BRAND CLASSIFICATION
// ============================================================
var BRAND_RULES = [
  { brand: 'Optimum',     nhom: 'A', match: function(p) { return /optimum|02.O/i.test(p.ten + p.ma); } },
  { brand: 'Dielac Gold', nhom: 'A', match: function(p) { return /dielac.*gold|ridielac|03C/i.test(p.ten + p.ma) && !/alpha|grow/i.test(p.ten); } },
  { brand: 'D.Alpha',     nhom: 'A', match: function(p) { return /alpha|02.A|02DA|02EA|02BA/i.test(p.ten + p.ma) && !/gold/i.test(p.ten); } },
  { brand: 'D.Alpha Gold',nhom: 'A', match: function(p) { return /alpha.*gold|02DG|02EG/i.test(p.ten + p.ma); } },
  { brand: 'Grow Plus',   nhom: 'A', match: function(p) { return /grow.*plus|02ER6|02ER7|02DR6|02DR7/i.test(p.ten + p.ma); } },
  { brand: 'Yoko',        nhom: 'A', match: function(p) { return /yoko|02.Y/i.test(p.ten + p.ma) && p.nhom === 'A'; } },
  { brand: 'Sure/Diecerna',nhom:'A', match: function(p) { return /sure|diecerna|02AD|02AU|02EU|02ED/i.test(p.ten + p.ma); } },
  { brand: 'CanPro/Mama', nhom: 'A', match: function(p) { return /canxi|can.*pro|mama|02AC|02EC|02AM|02EM/i.test(p.ten + p.ma); } },
  { brand: 'Ông Thọ',     nhom: 'B', match: function(p) { return /ông thọ|ong tho|01T|01C/i.test(p.ten + p.ma) && p.nhom === 'B'; } },
  { brand: 'NSPN',        nhom: 'B', match: function(p) { return /NSPN|ngôi sao|01S/i.test(p.ten + p.ma) && p.nhom === 'B'; } },
  { brand: 'Tài Lộc',     nhom: 'B', match: function(p) { return /tài lộc|tai loc|01TL/i.test(p.ten + p.ma); } },
  { brand: 'STT 100%',    nhom: 'C', match: function(p) { return /STT|sữa tươi|tươi 100|04E/i.test(p.ten + p.ma) && !/green|GF|fino|ADM|flex/i.test(p.ten); } },
  { brand: 'Green Farm',  nhom: 'C', match: function(p) { return /green.*farm|GF|04G|04AE|organic/i.test(p.ten + p.ma); } },
  { brand: 'ADM',         nhom: 'C', match: function(p) { return /ADM|04C|04AD/i.test(p.ten + p.ma) && p.nhom === 'C'; } },
  { brand: 'Fino',        nhom: 'C', match: function(p) { return /fino|04F/i.test(p.ten + p.ma) && p.nhom === 'C'; } },
  { brand: 'Flex',        nhom: 'C', match: function(p) { return /flex|04L/i.test(p.ten + p.ma); } },
  { brand: 'SĐN/Hạt',    nhom: 'C', match: function(p) { return /đậu nành|soy|hạt|hat|05A|05D|05B|05F|05M/i.test(p.ten + p.ma); } },
  { brand: 'Probi',       nhom: 'D', match: function(p) { return /probi|07U/i.test(p.ten + p.ma); } },
  { brand: 'SCA Trắng',   nhom: 'D', match: function(p) { return /SCA.*trắng|SCA.*KĐ|SCA.*CĐ|07TR|07KD|07ID/i.test(p.ten + p.ma); } },
  { brand: 'Susu/Hero',   nhom: 'D', match: function(p) { return /susu|hero|06U|08H|06S/i.test(p.ten + p.ma); } },
  { brand: 'Yomilk',      nhom: 'D', match: function(p) { return /yomilk|06V/i.test(p.ten + p.ma); } },
  { brand: 'SCA Trái cây',nhom: 'D', match: function(p) { return /SCA.*dâu|SCA.*nha|SCA.*lựu|07DA|07NC|07ND|07CR|07PH/i.test(p.ten + p.ma); } },
];

function detectBrand(p) {
  if (p._brand) return p._brand;
  for (var i = 0; i < BRAND_RULES.length; i++) {
    if (BRAND_RULES[i].match(p)) { p._brand = BRAND_RULES[i].brand; return p._brand; }
  }
  p._brand = '';
  return '';
}

function getBrandsForNhom(nhom) {
  var seen = {};
  var brands = [];
  SP.forEach(function(p) {
    if (nhom && p.nhom !== nhom) return;
    var b = detectBrand(p);
    if (b && !seen[b]) { seen[b] = true; brands.push(b); }
  });
  return brands.sort();
}

// ============================================================
// HELPER — safe access to CUS array (fix variable reference)
// ============================================================
function getCUS() {
  return (typeof CUS !== 'undefined' && Array.isArray(CUS)) ? CUS : [];
}

// ============================================================
// DEBOUNCE + FILTER
// ============================================================
function debounceRender(tab) {
  clearTimeout(_searchTimer);
  _searchTimer = setTimeout(function() {
    if (tab === 'order') renderOrder();
    else renderAdm();
  }, 250);
}

function setNhom(el, tab, nhom) {
  nhomF[tab] = nhom;
  brandF = '';
  el.closest('.pills').querySelectorAll('.pill').forEach(function(p) { p.className = 'pill'; });
  el.className = 'pill on-' + (nhom || 'all');
  if (tab === 'order') { renderBrandPills(); renderOrder(); }
  else renderAdm();
}

function setBrand(brand) {
  brandF = (brandF === brand) ? '' : brand;
  renderBrandPills();
  renderOrder();
}

function renderBrandPills() {
  var el = document.getElementById('brand-pills'); if (!el) return;
  var brands = getBrandsForNhom(nhomF.order);
  if (!brands.length) { el.innerHTML = ''; el.style.display = 'none'; return; }
  el.style.display = 'flex';
  el.innerHTML = brands.map(function(b) {
    var active = brandF === b;
    return '<div class="pill ' + (active ? 'on-C' : '') + '" onclick="setBrand(\'' + b.replace(/'/g, "\\'") + '\')">' + b + '</div>';
  }).join('');
}

// ============================================================
// CUSTOMER SELECTOR
// ============================================================
function renderCustomerSelector() {
  var el = document.getElementById('cus-selector'); if (!el) return;
  var cusList = getCUS();
  if (!cusList.length) {
    el.innerHTML = '<div style="font-size:11px;color:var(--n3);padding:4px 0">Chưa có KH. Vào tab 👥 KH để thêm.</div>';
    return;
  }
  var selected = cusList.find(function(k) { return k.ma === _selectedCustomerMa; });
  var html = '<div style="display:flex;gap:8px;align-items:center">';
  html += '<select id="order-kh-select" onchange="onSelectCustomer(this.value)" style="flex:1;height:36px;border:1.5px solid ' + (selected ? 'var(--vm)' : 'var(--n5)') + ';border-radius:var(--Rs);padding:0 10px;font-size:13px;font-weight:600;color:' + (selected ? 'var(--vm)' : 'var(--n2)') + ';background:' + (selected ? '#f0faf4' : '#fff') + '">';
  html += '<option value="">— Chọn khách hàng —</option>';

  var routes = (typeof ROUTES !== 'undefined' && Array.isArray(ROUTES)) ? ROUTES : [];
  var grouped = {};
  cusList.forEach(function(k) { var r = k.tuyen || '_'; if (!grouped[r]) grouped[r] = []; grouped[r].push(k); });
  routes.forEach(function(r) {
    if (!grouped[r.id]) return;
    html += '<optgroup label="📍 ' + r.ten + '">';
    grouped[r.id].forEach(function(k) {
      html += '<option value="' + k.ma + '"' + (k.ma === _selectedCustomerMa ? ' selected' : '') + '>' + (k.ten || k.ma) + '</option>';
    });
    html += '</optgroup>';
  });
  if (grouped['_']) {
    html += '<optgroup label="Chưa phân tuyến">';
    grouped['_'].forEach(function(k) {
      html += '<option value="' + k.ma + '"' + (k.ma === _selectedCustomerMa ? ' selected' : '') + '>' + (k.ten || k.ma) + '</option>';
    });
    html += '</optgroup>';
  }
  html += '</select>';
  if (selected) html += '<button onclick="onSelectCustomer(\'\')" style="height:36px;padding:0 12px;border:1px solid var(--n5);border-radius:var(--Rs);background:#fff;font-size:11px;font-weight:700;color:var(--n3);cursor:pointer">✕</button>';
  html += '</div>';

  if (selected) {
    var progs = [];
    if (selected.programs) {
      if (selected.programs.vnmShop && selected.programs.vnmShop.dangKy) progs.push('VNM ' + (selected.programs.vnmShop.mucBayBan || ''));
      if (selected.programs.vipShop && selected.programs.vipShop.dangKy) progs.push('VIP ' + (selected.programs.vipShop.mucBayBan || ''));
      if (selected.programs.sbpsShop && selected.programs.sbpsShop.dangKy) progs.push('SBPS M' + (selected.programs.sbpsShop.muc || ''));
    }
    html += '<div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:5px">';
    html += '<span style="font-size:10.5px;font-weight:700;color:var(--vm);background:var(--vmL);padding:2px 8px;border-radius:10px">👤 ' + (selected.ten || selected.ma) + '</span>';
    progs.forEach(function(p) { html += '<span style="font-size:9.5px;font-weight:600;color:var(--n2);background:var(--n6);padding:2px 7px;border-radius:10px">' + p + '</span>'; });
    html += '</div>';
  }
  el.innerHTML = html;
}

function onSelectCustomer(ma) {
  _selectedCustomerMa = ma;
  window._selectedCustomerMa = ma; // sync to window
  renderCustomerSelector();
  renderOrder(); // re-render to show reward lines
}

// ============================================================
// PRICE TABLE
// ============================================================
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

  var rewardLine = calcRewardLine(p);
  if (rewardLine) {
    html += '<div style="font-size:10.5px;color:var(--b);padding:4px 10px;background:var(--bL);border-radius:0 0 var(--Rs) var(--Rs);border-top:1px dashed var(--n5)">' + rewardLine + '</div>';
  }
  return html;
}

function calcRewardLine(p) {
  if (!_selectedCustomerMa) return '';
  var cusList = getCUS();
  var kh = cusList.find(function(k) { return k.ma === _selectedCustomerMa; });
  if (!kh || !kh.programs) return '';

  var lines = [];
  if (p.nhom === 'C' && kh.programs.vnmShop && kh.programs.vnmShop.dangKy) {
    var muc = kh.programs.vnmShop.mucTichLuy;
    var tl = (typeof VNM_SHOP_TICHLUY !== 'undefined') ? VNM_SHOP_TICHLUY.find(function(t) { return t.muc === muc; }) : null;
    if (tl) lines.push('💰 VNM: CK ~' + tl.ckDS + '% + GĐ ~' + (tl.ckDS + tl.ckGD1).toFixed(1) + '%');
  }
  if (p.nhom === 'D' && kh.programs.vipShop && kh.programs.vipShop.dangKy) {
    var muc2 = kh.programs.vipShop.mucTichLuy;
    var tl2 = (typeof VIP_SHOP_TICHLUY !== 'undefined') ? VIP_SHOP_TICHLUY.find(function(t) { return t.muc === muc2; }) : null;
    if (tl2) lines.push('💰 VIP: N1 ' + tl2.ckN1 + '% / N2 ' + tl2.ckN2 + '%');
  }
  if (p.nhom === 'A' && kh.programs.sbpsShop && kh.programs.sbpsShop.dangKy) {
    var muc3 = kh.programs.sbpsShop.muc;
    var tl3 = (typeof SBPS_TICHLUY !== 'undefined') ? SBPS_TICHLUY.find(function(t) { return t.muc === muc3; }) : null;
    if (tl3) lines.push('💰 SBPS M' + muc3 + ': N1 ' + tl3.ckN1 + '%');
  }
  return lines.join(' · ');
}

function updKM(p, km, ma) {
  var pt = document.getElementById('pt_' + ma);
  if (pt) pt.innerHTML = ptbl(p, km);
}

function onQty(ma) {
  var p = spFind(ma); if (!p) return;
  var qT = parseInt(document.getElementById('qT_' + ma)?.value) || 0;
  var qL = parseInt(document.getElementById('qL_' + ma)?.value) || 0;
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
  pvHtml += '<button class="btn-ok" onclick="addCart(\'' + ma + '\')">✓ Thêm vào đơn</button>';
  pv.innerHTML = pvHtml;
  updKM(p, km, ma);
}

// ============================================================
// RENDER ĐẶT HÀNG
// ============================================================
function renderOrder() {
  var q = (document.getElementById('order-q') || {}).value || '';
  var lq = q.toLowerCase();
  var favorites = JSON.parse(localStorage.getItem('vnm_favorites') || '[]');

  var f = SP.filter(function(p) {
    if (nhomF.order && p.nhom !== nhomF.order) return false;
    if (brandF && detectBrand(p) !== brandF) return false;
    if (lq && !(p.ten.toLowerCase().includes(lq) || p.ma.toLowerCase().includes(lq))) return false;
    return true;
  });

  var el = document.getElementById('order-list');
  if (!el) return;

  renderCustomerSelector();
  renderBrandPills();

  if (!SP.length) { el.innerHTML = '<div class="empty">Chưa có sản phẩm<br><small>Vào ⚙️ Quản lý → Sync từ GitHub</small></div>'; return; }
  if (!f.length) { el.innerHTML = '<div class="empty">Không tìm thấy SP</div>'; return; }

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
    html += '<div class="order-section"><div class="order-sec-hd"><span style="display:inline-block;width:4px;height:16px;border-radius:2px;background:' + (NCOLOR[nhom] || '#999') + ';margin-right:4px"></span>' + label + ' (' + groups[nhom].length + ')</div>';
    groups[nhom].forEach(function(p) {
      var inCart = cart[p.ma] && (cart[p.ma].qT > 0 || cart[p.ma].qL > 0);
      var isFav = favorites.includes(p.ma);
      var kmInfo = calcKM(p, 0, 0);
      var brand = detectBrand(p);

      var kmBadgeHtml = '';
      var appliedCTs = kmProgs.filter(function(prog) { return prog.active && (prog.spMas || []).includes(p.ma); });
      if (appliedCTs.length) {
        var ctNames = appliedCTs.slice(0, 2).map(function(ct) { return ct.name; });
        kmBadgeHtml = '<div class="km-line">' + ctNames.join(' · ') + (appliedCTs.length > 2 ? ' +' + (appliedCTs.length - 2) : '') + '</div>';
      }

      html += '<div class="sp-card ' + (inCart ? 'inCart' : '') + '" id="card_' + p.ma + '">';
      html += '<div class="sp-top"><div class="sp-bar" style="background:' + NCOLOR[p.nhom] + '"></div>';
      html += '<div class="sp-body"><div class="sp-name">' + p.ten + '<span class="fav-star' + (isFav ? ' active' : '') + '" onclick="toggleFavorite(event, \'' + p.ma + '\')">★</span></div>';
      html += '<div class="sp-meta"><span class="sp-chip">' + p.ma + '</span><span class="sp-chip">' + p.donvi + '·' + p.slThung + '/thùng</span>';
      if (brand) html += '<span class="sp-chip" style="' + NBG[p.nhom] + '">' + brand + '</span>';
      html += '</div></div></div>';
      html += kmBadgeHtml;
      html += '<div id="pt_' + p.ma + '">' + ptbl(p, kmInfo) + '</div>';
      html += '<div class="qty-area"><div class="qbox"><span class="qlbl">Thùng</span><input class="qinp" type="number" min="0" max="999" inputmode="numeric" placeholder="0" id="qT_' + p.ma + '" oninput="onQty(\'' + p.ma + '\')"></div>';
      html += '<div class="qbox"><span class="qlbl">Lẻ</span><input class="qinp" type="number" min="0" max="9999" inputmode="numeric" placeholder="0" id="qL_' + p.ma + '" oninput="onQty(\'' + p.ma + '\')"></div>';
      html += '<button class="btn-add" onclick="addCart(\'' + p.ma + '\')">＋</button></div>';
      html += '<div class="pv-box" id="pv_' + p.ma + '"></div></div>';
    });
    html += '</div>';
  });

  el.innerHTML = html;

  for (var ma in cart) {
    var cq = cart[ma];
    if (!cq.qT && !cq.qL) continue;
    var iT = document.getElementById('qT_' + ma), iL = document.getElementById('qL_' + ma);
    if (iT) iT.value = cq.qT || ''; if (iL) iL.value = cq.qL || '';
    var p = spFind(ma); if (p) updKM(p, calcKM(p, cq.qT || 0, cq.qL || 0), ma);
  }
}

function scrollToTop() {
  var orderList = document.getElementById('order-list');
  if (orderList) orderList.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================================
// RENDER ADMIN
// ============================================================
function renderAdm() {
  var q = (document.getElementById('adm-q') || {}).value || '';
  var lq = q.toLowerCase();
  var f = SP.filter(function(p) { return (!nhomF.adm || p.nhom === nhomF.adm) && (!lq || p.ten.toLowerCase().includes(lq) || p.ma.toLowerCase().includes(lq)); });
  var el = document.getElementById('adm-list'); if (!el) return;
  if (!SP.length) { el.innerHTML = '<div class="empty">Chưa có sản phẩm</div>'; return; }
  if (!f.length) { el.innerHTML = '<div class="empty">Không tìm thấy</div>'; return; }
  var groups = {};
  f.forEach(function(p) { if (!groups[p.nhom]) groups[p.nhom] = []; groups[p.nhom].push(p); });
  var html = '';
  ['A', 'B', 'C', 'D'].forEach(function(nhom) {
    if (!groups[nhom]) return;
    html += '<div class="adm-section"><div class="adm-sec-hd"><span>' + NLBL[nhom] + ' (' + groups[nhom].length + ')</span></div>';
    groups[nhom].forEach(function(p) { html += admSpRow(p); });
    html += '</div><div style="height:8px"></div>';
  });
  var noGroup = f.filter(function(p) { return !p.nhom || !['A','B','C','D'].includes(p.nhom); });
  if (noGroup.length) {
    html += '<div class="adm-section"><div class="adm-sec-hd"><span>Khác (' + noGroup.length + ')</span></div>';
    noGroup.forEach(function(p) { html += admSpRow(p); });
    html += '</div>';
  }
  el.innerHTML = html;
}

function admSpRow(p) {
  var brand = detectBrand(p);
  var locInfo = p.locSize ? ' · Lốc ' + p.locSize : '';
  var h = '<div class="adm-sp-row">';
  h += '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px">';
  h += '<div style="flex:1;min-width:0"><div class="adm-sp-name">' + p.ten + '</div>';
  h += '<div class="adm-sp-info"><span class="adm-chip">' + p.ma + '</span><span class="adm-chip">' + p.donvi + ' · ' + p.slThung + '/thùng' + locInfo + '</span>';
  if (brand) h += '<span class="adm-chip" style="' + (NBG[p.nhom] || '') + '">' + brand + '</span>';
  h += '</div></div>';
  h += '<div style="text-align:right;flex-shrink:0"><div style="font-size:14px;font-weight:800;color:var(--vm)">' + fmt(p.giaNYLon) + 'đ</div><div style="font-size:10.5px;color:var(--n3)">' + fmt(p.giaNYThung) + 'đ/thùng</div></div></div>';
  h += '<div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">';
  h += '<input type="number" inputmode="numeric" placeholder="Giá mới/' + p.donvi + '" id="adp-inp-' + p.ma + '" style="flex:1;height:38px;border:1.5px solid var(--n5);border-radius:var(--Rs);padding:0 12px;font-size:15px;color:var(--n1)">';
  h += '<button onclick="saveAdmPrice(\'' + p.ma + '\')" style="height:38px;padding:0 14px;background:var(--vm);color:#fff;border:none;border-radius:var(--Rs);font-size:12.5px;font-weight:700;cursor:pointer">Lưu giá</button></div>';
  h += '<div style="display:flex;gap:8px">';
  h += '<button class="btn-kme" onclick="spOpenModal(\'' + p.ma + '\')" style="flex:1">✏️ Sửa</button>';
  h += '<button class="btn-kmd" onclick="spDelete(\'' + p.ma + '\')" style="flex:0 0 auto;padding:0 14px">✕ Xóa</button></div>';
  h += '</div>';
  return h;
}

function saveAdmPrice(ma) {
  var inp = document.getElementById('adp-inp-' + ma);
  var val = parseInt(inp?.value);
  if (!val || val < 100) { alert('Giá không hợp lệ'); return; }
  var p = SP.find(function(x) { return x.ma === ma; }); if (!p) return;
  p.giaNYLon = val; p.giaNYThung = val * p.slThung;
  saveSP(); inp.value = '';
  alert('✓ ' + p.ten + ' → ' + fmt(val) + 'đ/' + p.donvi);
  renderAdm(); renderOrder();
}

// ============================================================
// SP MODAL
// ============================================================
function spOpenModal(ma) {
  var p = null;
  if (ma) { p = SP.find(function(x) { return x.ma === ma; }); _spEditMa = ma; }
  else { _spEditMa = null; }
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
  html += '<div class="kf"><div class="kfl">Mã SP</div><input type="text" id="spf-ma" value="' + (p ? p.ma : '') + '"' + (isEdit ? ' readonly style="background:var(--n6);color:var(--n3);"' : '') + ' placeholder="VD: 04ED32" style="width:100%;height:44px;border:1.5px solid var(--n5);border-radius:var(--Rs);padding:0 14px;font-size:16px;font-weight:700;text-transform:uppercase;' + (isEdit ? 'background:var(--n6);color:var(--n3);' : '') + '"></div>';
  html += '<div class="kf"><div class="kfl">Tên SP</div><input type="text" id="spf-ten" value="' + (p ? p.ten : '') + '" placeholder="VD: STT DB 100% có đường 180ml" style="width:100%;height:44px;border:1.5px solid var(--n5);border-radius:var(--Rs);padding:0 14px;font-size:15px"></div>';
  html += '<div class="kf"><div class="kfl">Nhóm</div><div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:8px">';
  ['A', 'B', 'C', 'D'].forEach(function(n) { html += '<button class="km-type-btn sp-nhom-sel' + (nhom === n ? ' sel' : '') + '" onclick="spSelectNhom(\'' + n + '\',this)">' + { A: 'A·Bột', B: 'B·Đặc', C: 'C·Nước', D: 'D·Chua' }[n] + '</button>'; });
  html += '</div></div>';
  html += '<div class="kf"><div class="kfl">Đơn vị</div><div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:8px">';
  ['hộp', 'lon', 'chai', 'bịch'].forEach(function(dv) { html += '<button class="km-type-btn sp-dv-sel' + (donvi === dv ? ' sel' : '') + '" onclick="spSelectDV(\'' + dv + '\',this)">' + dv + '</button>'; });
  html += '</div><input type="text" id="spf-dv-custom" placeholder="Hoặc đơn vị khác..." style="width:100%;height:36px;border:1.5px solid var(--n5);border-radius:var(--Rs);padding:0 14px;font-size:13px;margin-top:6px"></div>';
  html += '<div class="kf"><div class="kfl">SL/thùng</div><input type="number" id="spf-slthung" value="' + (p ? p.slThung : 48) + '" style="width:100%;height:44px;border:1.5px solid var(--n5);border-radius:var(--Rs);padding:0 14px;font-size:18px;font-weight:700;text-align:center"></div>';
  html += '<div class="kf"><div class="kfl">Lốc (tuỳ chọn)</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><div><div style="font-size:10px;color:var(--n3)">SL/lốc</div><input type="number" id="spf-locsize" value="' + (p && p.locSize ? p.locSize : '') + '" placeholder="VD: 4" style="width:100%;height:38px;border:1.5px solid var(--n5);border-radius:var(--Rs);padding:0 12px;font-size:15px;text-align:center"></div><div><div style="font-size:10px;color:var(--n3)">Nhãn</div><input type="text" id="spf-loclabel" value="' + (p && p.locLabel ? p.locLabel : '') + '" placeholder="Lốc" style="width:100%;height:38px;border:1.5px solid var(--n5);border-radius:var(--Rs);padding:0 12px;font-size:14px"></div></div></div>';
  html += '<div class="kf"><div class="kfl">Giá gốc/đơn vị (VNĐ)</div><input type="number" id="spf-gia" value="' + (p ? p.giaNYLon : '') + '" placeholder="6900" style="width:100%;height:48px;border:1.5px solid var(--n5);border-radius:var(--Rs);padding:0 14px;font-size:22px;font-weight:800;text-align:center;color:var(--vm)" oninput="spPreviewPrice()"><div id="spf-price-preview" style="margin-top:8px"></div></div>';
  html += '<button class="btn-km-save" onclick="spSaveForm()">' + (isEdit ? '💾 Cập nhật' : '✓ Thêm SP') + '</button>';
  body.innerHTML = html;
  spPreviewPrice();
}

function spSelectNhom(n, btn) { document.querySelectorAll('.sp-nhom-sel').forEach(function(b) { b.classList.remove('sel'); }); btn.classList.add('sel'); }
function spSelectDV(dv, btn) { document.querySelectorAll('.sp-dv-sel').forEach(function(b) { b.classList.remove('sel'); }); btn.classList.add('sel'); var c = document.getElementById('spf-dv-custom'); if (c) c.value = ''; }
function spGetSelectedNhom() { var sel = document.querySelector('.sp-nhom-sel.sel'); return sel ? sel.textContent.trim().charAt(0) : 'C'; }
function spGetSelectedDV() { var c = document.getElementById('spf-dv-custom'); if (c && c.value.trim()) return c.value.trim(); var sel = document.querySelector('.sp-dv-sel.sel'); return sel ? sel.textContent.trim() : 'hộp'; }

function spPreviewPrice() {
  var gia = parseInt((document.getElementById('spf-gia') || {}).value) || 0;
  var slThung = parseInt((document.getElementById('spf-slthung') || {}).value) || 48;
  var locSize = parseInt((document.getElementById('spf-locsize') || {}).value) || 0;
  var el = document.getElementById('spf-price-preview'); if (!el || !gia) { if (el) el.innerHTML = ''; return; }
  var thung = gia * slThung;
  var h = '<div style="background:var(--vmL);border-radius:var(--Rs);padding:10px 12px;border:1px solid #B8E0CB">';
  h += '<div style="display:flex;justify-content:space-between;font-size:12.5px;color:var(--n2)"><span>Thùng</span><b style="color:var(--vm)">' + fmt(thung) + 'đ</b></div>';
  if (locSize > 0) h += '<div style="display:flex;justify-content:space-between;font-size:12.5px;color:var(--n2)"><span>Lốc (' + locSize + ')</span><b>' + fmt(gia * locSize) + 'đ</b></div>';
  h += '<div style="display:flex;justify-content:space-between;font-size:12.5px;color:var(--n2)"><span>+VAT 1.5%</span><b>' + fmt(Math.round(thung * 1.015)) + 'đ/thùng</b></div></div>';
  el.innerHTML = h;
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
  if (!ma) { alert('Nhập mã SP'); return; }
  if (!ten) { alert('Nhập tên SP'); return; }
  if (!slThung || slThung < 1) { alert('SL/thùng ≥ 1'); return; }
  if (!gia || gia < 100) { alert('Giá ≥ 100'); return; }
  if (_spEditMa) {
    var p = SP.find(function(x) { return x.ma === _spEditMa; }); if (!p) return;
    p.ten = ten; p.nhom = nhom; p.donvi = donvi; p.slThung = slThung; p.giaNYLon = gia; p.giaNYThung = gia * slThung;
    if (locSize > 0) { p.locSize = locSize; p.locLabel = locLabel || 'Lốc'; } else { delete p.locSize; delete p.locLabel; }
    delete p._brand;
    saveSP(); document.getElementById('sp-modal').style.display = 'none'; renderAdm(); renderOrder();
    alert('✅ Đã cập nhật: ' + ten);
  } else {
    if (SP.find(function(x) { return x.ma === ma; })) { alert('Mã đã tồn tại!'); return; }
    var newP = { ma: ma, ten: ten, nhom: nhom, donvi: donvi, slThung: slThung, giaNYLon: gia, giaNYThung: gia * slThung, kmRules: [], kmText: '' };
    if (locSize > 0) { newP.locSize = locSize; newP.locLabel = locLabel || 'Lốc'; }
    SP.push(newP); saveSP(); document.getElementById('sp-modal').style.display = 'none'; renderAdm(); renderOrder();
    alert('✅ Đã thêm: ' + ten + ' (' + ma + ')');
  }
}

function spDelete(ma) {
  var p = SP.find(function(x) { return x.ma === ma; }); if (!p) return;
  if (!confirm('Xóa "' + p.ten + '" (' + ma + ')?')) return;
  SP.splice(SP.indexOf(p), 1);
  if (cart[ma]) { delete cart[ma]; saveCart(); updateBadge(); }
  saveSP(); renderAdm(); renderOrder();
}

function closeAdmModal(e) {
  if (e && e.target !== document.getElementById('adm-modal')) return;
  document.getElementById('adm-modal').style.display = 'none';
}

// ============================================================
// EXPORTS
// ============================================================
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
window.setNhom = setNhom;
window.setBrand = setBrand;
window.renderBrandPills = renderBrandPills;
window.renderCustomerSelector = renderCustomerSelector;
window.onSelectCustomer = onSelectCustomer;
window.spOpenModal = spOpenModal;
window.spCloseModal = spCloseModal;
window.spRenderForm = spRenderForm;
window.spSelectNhom = spSelectNhom;
window.spSelectDV = spSelectDV;
window.spPreviewPrice = spPreviewPrice;
window.spSaveForm = spSaveForm;
window.spDelete = spDelete;
window.detectBrand = detectBrand;
