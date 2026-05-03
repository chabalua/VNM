/* =========================================================================
   VNM Sales App — Mobile & Desktop UI (Nav, Header, Sidebar)
   ========================================================================= */

// ============================================================================
// 3.1: Mobile Bottom Navigation
// ============================================================================
window.renderMobileTabBar = function() {
  var container = document.getElementById('tabbar');
  if (!container) return;

  var tabs = [
    { id: 'home',  icon: 'home',    label: 'Trang chủ' },
    { id: 'order', icon: 'cart',    label: 'Đặt hàng' },
    { id: 'don',   icon: 'list',    label: 'Đơn hàng' },
    { id: 'ai',    icon: 'sparkle', label: 'AI' },
    { id: 'kh',    icon: 'users',   label: 'Khách hàng' },
  ];

  var currentTab = window._currTab || 'home';

  var html = '<div class="mobile-tab-bar">';
  tabs.forEach(function(tab) {
    var isActive = tab.id === currentTab;
    var iconEl = window.renderIcon ? window.renderIcon(tab.icon, 22, isActive ? 2.1 : 1.7) : '';
    html += '<div class="tab-item' + (isActive ? ' active' : '') + '" onclick="gotoTab(\'' + tab.id + '\')">';
    html += '<div class="tab-icon">' + iconEl + '</div>';
    html += '<div class="tab-label">' + tab.label + '</div>';
    html += '</div>';
  });
  html += '</div>';

  container.innerHTML = html;
};

// ============================================================================
// SVG Icon Renderer
// ============================================================================
window.renderIcon = function(name, size, strokeWidth) {
  size = size || 24;
  strokeWidth = strokeWidth || 1.75;
  var props = 'width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + strokeWidth + '" stroke-linecap="round" stroke-linejoin="round"';
  switch (name) {
    case 'home':     return '<svg ' + props + '><path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1V10.5z"/></svg>';
    case 'cart':     return '<svg ' + props + '><path d="M3 4h2l2.4 11.5a2 2 0 0 0 2 1.5h7.5a2 2 0 0 0 2-1.5L21 7H6"/><circle cx="9" cy="20" r="1.2"/><circle cx="18" cy="20" r="1.2"/></svg>';
    case 'list':     return '<svg ' + props + '><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>';
    case 'sparkle':  return '<svg ' + props + '><path d="M12 3l1.8 4.7 4.7 1.8-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3z"/><path d="M19 15l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9.9-2.1z"/></svg>';
    case 'users':    return '<svg ' + props + '><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>';
    case 'settings': return '<svg ' + props + '><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9 1.65 1.65 0 0 0 4.27 7.18l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>';
    case 'search':   return '<svg ' + props + '><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>';
    case 'bell':          return '<svg ' + props + '><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>';
    case 'edit':          return '<svg ' + props + '><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';
    case 'trash':         return '<svg ' + props + '><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>';
    case 'copy':          return '<svg ' + props + '><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
    case 'chart':         return '<svg ' + props + '><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>';
    case 'upload':        return '<svg ' + props + '><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>';
    case 'download':      return '<svg ' + props + '><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>';
    case 'chevron-right': return '<svg ' + props + '><polyline points="9 18 15 12 9 6"/></svg>';
    case 'chevron-down':  return '<svg ' + props + '><polyline points="6 9 12 15 18 9"/></svg>';
    case 'x':             return '<svg ' + props + '><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    case 'check':         return '<svg ' + props + '><polyline points="20 6 9 17 4 12"/></svg>';
    case 'cloud':         return '<svg ' + props + '><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>';
    case 'detail':        return '<svg ' + props + '><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>';
    case 'gift':          return '<svg ' + props + '><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>';
    case 'zap':           return '<svg ' + props + '><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>';
    default:              return '';
  }
};

// ============================================================================
// 3.2: Desktop Sidebar
// ============================================================================
window.renderDesktopSidebar = function() {
  var container = document.getElementById('desktop-sidebar');
  if (!container) return;

  var currentTab = window._currTab || 'home';

  // Dynamic order badge from cart
  var cartItems = 0;
  try {
    var cartData = JSON.parse(localStorage.getItem('vnm_cart') || '{}');
    Object.values(cartData).forEach(function(v) {
      if ((v.qT || 0) > 0 || (v.qL || 0) > 0) cartItems++;
    });
  } catch (e) {}

  var sections = [
    { label: 'Bán hàng', items: [
      { id: 'home',  icon: 'home',    label: 'Trang chủ' },
      { id: 'order', icon: 'cart',    label: 'Đặt hàng', badge: cartItems > 0 ? String(cartItems) : '' },
      { id: 'don',   icon: 'list',    label: 'Đơn hàng' },
      { id: 'kh',    icon: 'users',   label: 'Khách hàng' },
    ]},
    { label: 'Trợ lý', items: [
      { id: 'ai',  icon: 'sparkle',  label: 'AI gợi ý', badge: 'new' },
    ]},
    { label: 'Hệ thống', items: [
      { id: 'adm', icon: 'settings', label: 'Cài đặt' },
    ]},
  ];

  // Header
  var html = '<div style="padding:16px 14px 12px;display:flex;align-items:center;gap:10px;border-bottom:1px solid var(--border)">';
  html += '<div style="width:32px;height:32px;border-radius:9px;background:var(--orange);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:15px;flex-shrink:0">V</div>';
  html += '<div style="min-width:0">';
  html += '<div style="font-size:13.5px;font-weight:700;color:var(--text);letter-spacing:-0.01em;line-height:1.1">VNM Sales</div>';
  html += '<div style="font-size:11px;color:var(--text-tertiary);margin-top:1px">Sales rep · BMT</div>';
  html += '</div></div>';

  // Search field
  html += '<div style="padding:10px 12px 8px">';
  html += '<div style="display:flex;align-items:center;gap:7px;height:32px;border:1px solid var(--border);border-radius:8px;padding:0 10px;background:var(--bg);cursor:text" onclick="document.getElementById(\'order-q\')&&(gotoTab(\'order\'),setTimeout(function(){var el=document.getElementById(\'order-q\');if(el)el.focus()},100))">';
  html += '<span style="color:var(--text-tertiary);display:flex;align-items:center">' + (window.renderIcon ? window.renderIcon('search', 13, 2) : '') + '</span>';
  html += '<span style="font-size:12px;color:var(--text-tertiary);flex:1">Tìm sản phẩm...</span>';
  html += '<span style="font-size:10px;color:var(--text-tertiary);background:var(--n6);border-radius:4px;padding:1px 5px;font-weight:500">⌘K</span>';
  html += '</div></div>';

  // Nav sections
  html += '<div style="flex:1;overflow-y:auto;padding:0 8px">';
  sections.forEach(function(sec) {
    html += '<div style="font-size:10.5px;font-weight:600;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:.06em;padding:14px 8px 5px">' + sec.label + '</div>';
    sec.items.forEach(function(item) {
      var isActive = item.id === currentTab;
      var bg = isActive ? 'var(--orange-soft)' : 'transparent';
      var color = isActive ? 'var(--orange)' : 'var(--text-secondary)';
      var weight = isActive ? '600' : '500';
      var icon = window.renderIcon ? window.renderIcon(item.icon, 15, 2) : '';

      html += '<div onclick="gotoTab(\'' + item.id + '\')" style="display:flex;align-items:center;gap:9px;height:34px;padding:0 8px;border-radius:8px;margin-bottom:1px;cursor:pointer;background:' + bg + ';color:' + color + ';transition:background .15s">';
      html += '<span style="display:flex;align-items:center;width:16px;justify-content:center;opacity:' + (isActive ? 1 : 0.65) + '">' + icon + '</span>';
      html += '<span style="flex:1;font-size:13px;font-weight:' + weight + '">' + item.label + '</span>';
      if (item.badge) {
        var badgeBg = item.badge === 'new' ? '#10b981' : 'var(--orange)';
        html += '<span style="padding:0 5px;height:16px;border-radius:4px;background:' + badgeBg + ';color:#fff;font-size:10px;font-weight:700;display:flex;align-items:center">' + item.badge + '</span>';
      }
      html += '</div>';
    });
  });
  html += '</div>';

  // User profile at bottom
  var syncData = {};
  try { syncData = JSON.parse(localStorage.getItem('vnm_github_sync') || '{}'); } catch (e) {}
  var userName = syncData.username || 'chabalua';
  html += '<div style="padding:12px 14px;border-top:1px solid var(--border);display:flex;align-items:center;gap:9px">';
  html += '<div style="width:28px;height:28px;border-radius:50%;background:var(--n5);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:var(--text-secondary);flex-shrink:0">' + (userName[0] || 'U').toUpperCase() + '</div>';
  html += '<div style="min-width:0;flex:1"><div style="font-size:12px;font-weight:600;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + userName + '</div>';
  html += '<div style="font-size:10px;color:var(--text-tertiary)">GitHub sync</div></div>';
  html += '<div onclick="syncOpenSettings()" style="cursor:pointer;padding:4px;color:var(--text-tertiary);display:flex;align-items:center">' + (window.renderIcon ? window.renderIcon('settings', 14, 2) : '') + '</div>';
  html += '</div>';

  container.innerHTML = html;
};

// ============================================================================
// Init
// ============================================================================
document.addEventListener('DOMContentLoaded', function() {
  window.renderMobileTabBar();
  if (window.renderDesktopSidebar) window.renderDesktopSidebar();
});
