/* =========================================================================
   VNM Sales App — Mobile Screens Setup (Phase 3)
   Handles generating Mobile-specific UI elements (Nav, Header, Screens)
   ========================================================================= */

// ============================================================================
// 3.1: Mobile Bottom Navigation
// ============================================================================
window.renderMobileTabBar = function() {
  const container = document.getElementById('tabbar');
  if (!container) return;
  
  const tabs = [
    { id: 'home', icon: 'home', label: 'Trang chủ' },
    { id: 'order', icon: 'cart', label: 'Đặt hàng' },
      { id: 'don', icon: 'list', label: 'Đơn hàng' },
    { id: 'kh', icon: 'users', label: 'Khách hàng' },
    { id: 'ai', icon: 'sparkle', label: 'AI' }, // Giả định module AI được add sau
    { id: 'adm', icon: 'settings', label: 'Cài đặt' } // Tương đương với settings
  ];
  
  const currentTab = window._currTab || 'home';
  
  let html = `<div class="mobile-tab-bar">`;
  
  tabs.forEach(tab => {
    const isActive = tab.id === currentTab;
    const iconEl = window.renderIcon ? window.renderIcon(tab.icon, isActive ? 22 : 22, isActive ? 2.1 : 1.7) : '';
    html += `
      <div class="tab-item ${isActive ? 'active' : ''}" onclick="gotoTab('${tab.id}')">
        <div class="tab-icon">${iconEl}</div>
        <div class="tab-label">${tab.label}</div>
      </div>
    `;
  });
  
  html += `</div>`;
  container.innerHTML = html;
};

// ============================================================================
// SVG Icon Renderer Helper for Vanilla JS
// ============================================================================
window.renderIcon = function(name, size = 24, strokeWidth = 1.75) {
  const props = `width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"`;
  switch (name) {
    case 'home': return `<svg ${props}><path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1V10.5z"/></svg>`;
    case 'cart': return `<svg ${props}><path d="M3 4h2l2.4 11.5a2 2 0 0 0 2 1.5h7.5a2 2 0 0 0 2-1.5L21 7H6"/><circle cx="9" cy="20" r="1.2"/><circle cx="18" cy="20" r="1.2"/></svg>`;
    case 'list': return `<svg ${props}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>`;
    case 'sparkle': return `<svg ${props}><path d="M12 3l1.8 4.7 4.7 1.8-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3z"/><path d="M19 15l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9.9-2.1z"/></svg>`;
    case 'users': return `<svg ${props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>`;
    case 'settings': return `<svg ${props}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9 1.65 1.65 0 0 0 4.27 7.18l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`;
    case 'bell': return `<svg ${props}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`;
    // Fallback
    default: return '';
  }
};

// ============================================================================
// Init when ready
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
    window.renderMobileTabBar();
    if (window.renderDesktopSidebar) window.renderDesktopSidebar();
});// 3.2: Desktop Sidebar
window.renderDesktopSidebar = function() {
  const container = document.getElementById('desktop-sidebar');
  if (!container) return;
  
  const currentTab = window._currTab || 'home';
  
  const sections = [
    { label: 'Bán hàng', items: [
      { id: 'home', icon: 'home', label: 'Trang chủ' },
      { id: 'order', icon: 'cart', label: 'Đặt hàng', badge: '3' },
      { id: 'don', icon: 'list', label: 'Đơn hàng' },
      { id: 'kh', icon: 'users', label: 'Khách hàng' },
    ]},
    { label: 'Trợ lý', items: [
      { id: 'ai', icon: 'sparkle', label: 'AI gợi ý', badge: 'new' },
    ]},
    { label: 'Hệ thống', items: [
      { id: 'adm', icon: 'settings', label: 'Cài đặt' },
    ]},
  ];

  let html = '<div style="padding:18px 16px 16px;display:flex;align-items:center;gap:10px">';
  html += '<div style="width:30px;height:30px;border-radius:8px;background:var(--orange);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;letter-spacing:-0.02em">V</div>';
  html += '<div><div style="font-size:13.5px;font-weight:600;color:var(--text);letter-spacing:-0.01em;line-height:1.1">VNM Sales</div>';
  html += '<div style="font-size:11px;color:var(--text-tertiary);margin-top:1px">Sales rep</div></div>';
  html += '</div>';

  html += '<div style="flex:1;overflow-y:auto;padding:0 8px">';
  sections.forEach(function(sec) {
    html += '<div style="font-size:11px;font-weight:600;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:.05em;padding:16px 8px 6px">' + sec.label + '</div>';
    sec.items.forEach(function(item) {
      const isActive = item.id === currentTab;
      const bg = isActive ? 'var(--orange-soft)' : 'transparent';
      const color = isActive ? 'var(--orange)' : 'var(--text-secondary)';
      const weight = isActive ? '600' : '500';
      const icon = window.renderIcon ? window.renderIcon(item.icon, 16, 2) : '';
      
      html += '<div onclick="gotoTab(\'' + item.id + '\')" style="display:flex;align-items:center;gap:10px;height:34px;padding:0 8px;border-radius:8px;margin-bottom:2px;cursor:pointer;background:' + bg + ';color:' + color + '">';
      html += '<div style="display:flex;align-items:center;width:18px;justify-content:center;opacity:' + (isActive?1:0.7) + '">' + icon + '</div>';
      html += '<div style="flex:1;font-size:13px;font-weight:' + weight + '">' + item.label + '</div>';
      if (item.badge) {
        const badgeBg = item.badge === 'new' ? '#10b981' : (item.id === 'order' ? 'var(--orange)' : 'var(--text-tertiary)');
        html += '<div style="padding:0 5px;height:16px;border-radius:4px;background:' + badgeBg + ';color:#fff;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center">' + item.badge + '</div>';
      }
      html += '</div>';
    });
  });
  html += '</div>';

  container.innerHTML = html;
};

