// ui-primitives.jsx — Reusable building blocks for VNM redesign

// ─── Icons ─────────────────────────────────────────────────────
const Icon = ({ name, size = 16, color = 'currentColor', strokeWidth = 1.75 }) => {
  const props = {
    width: size, height: size, viewBox: '0 0 24 24',
    fill: 'none', stroke: color, strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round',
  };
  switch (name) {
    case 'home':       return <svg {...props}><path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1V10.5z"/></svg>;
    case 'cart':       return <svg {...props}><path d="M3 4h2l2.4 11.5a2 2 0 0 0 2 1.5h7.5a2 2 0 0 0 2-1.5L21 7H6"/><circle cx="9" cy="20" r="1.2"/><circle cx="18" cy="20" r="1.2"/></svg>;
    case 'list':       return <svg {...props}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>;
    case 'sparkle':    return <svg {...props}><path d="M12 3l1.8 4.7 4.7 1.8-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3z"/><path d="M19 15l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9.9-2.1z"/></svg>;
    case 'users':      return <svg {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
    case 'settings':   return <svg {...props}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9 1.65 1.65 0 0 0 4.27 7.18l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
    case 'search':     return <svg {...props}><circle cx="11" cy="11" r="7"/><line x1="20" y1="20" x2="16.65" y2="16.65"/></svg>;
    case 'plus':       return <svg {...props}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
    case 'minus':      return <svg {...props}><line x1="5" y1="12" x2="19" y2="12"/></svg>;
    case 'check':      return <svg {...props}><polyline points="20 6 9 17 4 12"/></svg>;
    case 'chevronR':   return <svg {...props}><polyline points="9 18 15 12 9 6"/></svg>;
    case 'chevronD':   return <svg {...props}><polyline points="6 9 12 15 18 9"/></svg>;
    case 'chevronU':   return <svg {...props}><polyline points="18 15 12 9 6 15"/></svg>;
    case 'chevronL':   return <svg {...props}><polyline points="15 18 9 12 15 6"/></svg>;
    case 'arrowR':     return <svg {...props}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>;
    case 'arrowU':     return <svg {...props}><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>;
    case 'cloud':      return <svg {...props}><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>;
    case 'sync':       return <svg {...props}><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>;
    case 'filter':     return <svg {...props}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>;
    case 'star':       return <svg {...props}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
    case 'package':    return <svg {...props}><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>;
    case 'box':        return <svg {...props}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>;
    case 'tag':        return <svg {...props}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>;
    case 'trending':   return <svg {...props}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>;
    case 'target':     return <svg {...props}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>;
    case 'calendar':   return <svg {...props}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
    case 'bell':       return <svg {...props}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
    case 'menu':       return <svg {...props}><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>;
    case 'x':          return <svg {...props}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
    case 'phone':      return <svg {...props}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>;
    case 'map':        return <svg {...props}><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>;
    case 'pin':        return <svg {...props}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;
    case 'edit':       return <svg {...props}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
    case 'trash':      return <svg {...props}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>;
    case 'save':       return <svg {...props}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>;
    case 'upload':     return <svg {...props}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>;
    case 'download':   return <svg {...props}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
    case 'github':     return <svg {...props}><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>;
    case 'sun':        return <svg {...props}><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>;
    case 'moon':       return <svg {...props}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>;
    case 'logout':     return <svg {...props}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
    case 'dollar':     return <svg {...props}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
    case 'activity':   return <svg {...props}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
    case 'pieChart':   return <svg {...props}><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>;
    case 'barChart':   return <svg {...props}><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>;
    case 'mic':        return <svg {...props}><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>;
    case 'send':       return <svg {...props}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
    case 'info':       return <svg {...props}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>;
    case 'alert':      return <svg {...props}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
    case 'dot':        return <svg {...props}><circle cx="12" cy="12" r="4" fill={color} stroke="none"/></svg>;
    case 'grip':       return <svg {...props}><circle cx="9" cy="6" r="1.2" fill={color} stroke="none"/><circle cx="9" cy="12" r="1.2" fill={color} stroke="none"/><circle cx="9" cy="18" r="1.2" fill={color} stroke="none"/><circle cx="15" cy="6" r="1.2" fill={color} stroke="none"/><circle cx="15" cy="12" r="1.2" fill={color} stroke="none"/><circle cx="15" cy="18" r="1.2" fill={color} stroke="none"/></svg>;
    default: return null;
  }
};

// ─── Buttons ────────────────────────────────────────────────────
function Button({ children, variant = 'secondary', size = 'md', icon, t, style, ...rest }) {
  const sizes = {
    sm: { h: 28, px: 10, fs: 12.5, gap: 6, iconSize: 14 },
    md: { h: 34, px: 12, fs: 13, gap: 6, iconSize: 15 },
    lg: { h: 40, px: 16, fs: 14, gap: 8, iconSize: 16 },
  };
  const s = sizes[size];
  const variants = {
    primary: { bg: t.accent, color: '#fff', border: t.accent },
    secondary: { bg: t.surface, color: t.text, border: t.border },
    ghost: { bg: 'transparent', color: t.textSecondary, border: 'transparent' },
    soft: { bg: t.accentSoft, color: t.accentText, border: 'transparent' },
    danger: { bg: 'transparent', color: t.danger, border: t.border },
  };
  const v = variants[variant];
  return (
    <button {...rest} style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      gap: s.gap, height: s.h, padding: `0 ${s.px}px`,
      background: v.bg, color: v.color,
      border: `1px solid ${v.border}`, borderRadius: 8,
      fontSize: s.fs, fontWeight: 500, fontFamily: 'inherit',
      cursor: 'pointer', whiteSpace: 'nowrap',
      letterSpacing: '-0.005em',
      transition: 'background .12s, border-color .12s',
      ...style,
    }}>
      {icon && <Icon name={icon} size={s.iconSize}/>}
      {children}
    </button>
  );
}

// ─── Cards ──────────────────────────────────────────────────────
function Card({ children, t, padding, style, ...rest }) {
  return (
    <div {...rest} style={{
      background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12,
      padding, ...style,
    }}>{children}</div>
  );
}

// ─── KPI Stat ────────────────────────────────────────────────────
function StatTile({ label, value, change, icon, t, accent }) {
  return (
    <div style={{
      flex: 1, background: t.surface, border: `1px solid ${t.border}`,
      borderRadius: 12, padding: 16, minWidth: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 7, background: accent + '14',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: accent,
        }}>
          <Icon name={icon} size={15}/>
        </div>
        <div style={{ fontSize: 11.5, color: t.textTertiary, fontWeight: 500,
          letterSpacing: '.02em', textTransform: 'uppercase' }}>{label}</div>
      </div>
      <div style={{ fontSize: 24, fontWeight: 600, color: t.text, letterSpacing: '-0.02em',
        fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>{value}</div>
      {change !== undefined && (
        <div style={{ fontSize: 12, color: change >= 0 ? t.successText : t.dangerText,
          marginTop: 6, display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500 }}>
          <Icon name={change >= 0 ? 'arrowU' : 'arrowR'} size={12}/>
          {change >= 0 ? '+' : ''}{change}% so với tháng trước
        </div>
      )}
    </div>
  );
}

// ─── Progress Bar ────────────────────────────────────────────────
function Progress({ value, max = 100, t, accent, height = 6 }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div style={{ width: '100%', height, background: t.surfaceMuted, borderRadius: 99, overflow: 'hidden' }}>
      <div style={{ width: pct + '%', height: '100%', background: accent || t.accent,
        borderRadius: 99, transition: 'width .25s' }}/>
    </div>
  );
}

// ─── Tag / Pill ─────────────────────────────────────────────────
function Tag({ children, color, t, variant = 'soft' }) {
  const c = color || t.textSecondary;
  const bg = variant === 'soft' ? c + '18' : 'transparent';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4, height: 20,
      padding: '0 7px', background: bg,
      border: variant === 'outline' ? `1px solid ${t.border}` : 'none',
      borderRadius: 5, fontSize: 11, fontWeight: 500, color: c,
      letterSpacing: '-0.005em', whiteSpace: 'nowrap',
    }}>{children}</span>
  );
}

// ─── Search input ──────────────────────────────────────────────
function SearchField({ placeholder, t, height = 36 }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, height,
      background: t.surfaceMuted, borderRadius: 8,
      padding: '0 10px', border: `1px solid ${t.borderSubtle}`,
    }}>
      <Icon name="search" size={15} color={t.textTertiary}/>
      <div style={{ flex: 1, fontSize: 13, color: t.textTertiary, letterSpacing: '-0.005em' }}>
        {placeholder}
      </div>
    </div>
  );
}

// ─── Section header ─────────────────────────────────────────────
function SectionLabel({ children, t, action }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 0 8px',
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: t.textTertiary,
        textTransform: 'uppercase', letterSpacing: '.06em' }}>{children}</div>
      {action}
    </div>
  );
}

Object.assign(window, { Icon, Button, Card, StatTile, Progress, Tag, SearchField, SectionLabel });
