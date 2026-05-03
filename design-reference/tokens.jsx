// tokens.jsx — Design tokens for VNM Sales App redesign
// Clean, minimal, Linear/Notion-inspired with professional blue accent.

const VNM_TOKENS = {
  // Color palette — light mode
  light: {
    // Surfaces
    bg: '#FAFAFA',          // app background (warm gray)
    surface: '#FFFFFF',      // cards
    surfaceMuted: '#F5F5F4', // subtle backgrounds
    surfaceHover: '#F0F0EE',

    // Borders
    border: '#E7E5E4',
    borderSubtle: '#EFEDEB',
    borderStrong: '#D6D3D1',

    // Text
    text: '#1C1B1A',         // primary
    textSecondary: '#57534E', // secondary
    textTertiary: '#A8A29E',  // tertiary
    textInverse: '#FFFFFF',

    // Brand accent — professional blue
    accent: '#2563EB',
    accentHover: '#1D4ED8',
    accentSoft: '#EFF6FF',
    accentSoftHover: '#DBEAFE',
    accentText: '#1E40AF',

    // Semantic
    success: '#16A34A',
    successSoft: '#F0FDF4',
    successText: '#15803D',
    warning: '#D97706',
    warningSoft: '#FFFBEB',
    warningText: '#B45309',
    danger: '#DC2626',
    dangerSoft: '#FEF2F2',
    dangerText: '#B91C1C',

    // Category accents (for product groups, KPI dots)
    cat1: '#2563EB', // blue — sữa bột
    cat2: '#7C3AED', // violet — sữa đặc
    cat3: '#0D9488', // teal — sữa nước
    cat4: '#DB2777', // pink — sữa chua
    cat5: '#EA580C', // orange — others

    shadow: '0 1px 2px rgba(28,27,26,0.04), 0 1px 3px rgba(28,27,26,0.06)',
    shadowMd: '0 4px 12px rgba(28,27,26,0.06), 0 2px 4px rgba(28,27,26,0.04)',
    shadowLg: '0 12px 32px rgba(28,27,26,0.08), 0 4px 8px rgba(28,27,26,0.04)',
  },

  // Color palette — dark mode
  dark: {
    bg: '#0E0E0E',
    surface: '#161616',
    surfaceMuted: '#1C1C1C',
    surfaceHover: '#222222',

    border: '#262626',
    borderSubtle: '#1F1F1F',
    borderStrong: '#333333',

    text: '#FAFAF9',
    textSecondary: '#A8A29E',
    textTertiary: '#737373',
    textInverse: '#0E0E0E',

    accent: '#3B82F6',
    accentHover: '#60A5FA',
    accentSoft: 'rgba(59,130,246,0.12)',
    accentSoftHover: 'rgba(59,130,246,0.18)',
    accentText: '#93C5FD',

    success: '#22C55E',
    successSoft: 'rgba(34,197,94,0.12)',
    successText: '#86EFAC',
    warning: '#F59E0B',
    warningSoft: 'rgba(245,158,11,0.12)',
    warningText: '#FCD34D',
    danger: '#EF4444',
    dangerSoft: 'rgba(239,68,68,0.12)',
    dangerText: '#FCA5A5',

    cat1: '#60A5FA',
    cat2: '#A78BFA',
    cat3: '#2DD4BF',
    cat4: '#F472B6',
    cat5: '#FB923C',

    shadow: '0 1px 2px rgba(0,0,0,0.4)',
    shadowMd: '0 4px 12px rgba(0,0,0,0.5)',
    shadowLg: '0 12px 32px rgba(0,0,0,0.6)',
  },
};

// Resolve tokens given current tweaks (theme + accent override)
function resolveTokens(tweaks) {
  const base = tweaks.dark ? VNM_TOKENS.dark : VNM_TOKENS.light;
  if (tweaks.accent && tweaks.accent !== base.accent) {
    return {
      ...base,
      accent: tweaks.accent,
      accentHover: tweaks.accent,
    };
  }
  return base;
}

// Density spacing scales
const DENSITY = {
  compact: { rowH: 44, pad: 10, gap: 8, cardPad: 14 },
  regular: { rowH: 56, pad: 14, gap: 12, cardPad: 18 },
  comfy:   { rowH: 68, pad: 18, gap: 16, cardPad: 24 },
};

// Font stacks
const FONT_STACKS = {
  inter: '"Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
  geist: '"Geist", ui-sans-serif, system-ui, -apple-system, sans-serif',
  ibm:   '"IBM Plex Sans", ui-sans-serif, system-ui, sans-serif',
  manrope: '"Manrope", ui-sans-serif, system-ui, sans-serif',
  system: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
};

Object.assign(window, { VNM_TOKENS, resolveTokens, DENSITY, FONT_STACKS });
