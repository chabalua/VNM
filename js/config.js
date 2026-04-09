// Cấu hình hằng số
var REPO_RAW = 'https://raw.githubusercontent.com/chabalua/VNM/main/';
var PRODUCTS_URL = REPO_RAW + 'products.json';

var LOCAL_PROMOTIONS_URL = 'promotions.json';
var PROMOTIONS_URL = REPO_RAW + 'promotions.json';

// Thuế VAT
var VAT = 0.015;

// Màu sắc cho nhóm sản phẩm (updated Vinamilk brand)
var NCOLOR = { A: '#2563EB', B: '#D97706', C: '#1A4DFF', D: '#DC2626' };
var NBG = {
  A: 'background:var(--bL);color:var(--b)',
  B: 'background:var(--goldL);color:var(--gold)',
  C: 'background:var(--vmL);color:var(--vm)',
  D: 'background:var(--rL);color:var(--r)'
};
var NLBL = { A: 'Sữa bột', B: 'Sữa đặc', C: 'Sữa nước', D: 'Sữa chua' };

var FALLBACK_PRODUCTS = [];

// ============================================================
// LOCALSTORAGE KEYS — Centralized constants
// ============================================================
var LS_KEYS = {
  SP:            'vnm_sp',
  KM:            'vnm_km3',
  CART:          'vnm_cart',
  FAVORITES:     'vnm_favorites',
  CUSTOMERS:     'vnm_customers2',
  ROUTES:        'vnm_routes',
  ORDERS:        'vnm_orders_v2',
  LEGACY_KH:     'vnm_kh',
  GITHUB_SYNC:   'vnm_github_sync',
  THEME:         'vnm_theme_mode',
  KPI_CONFIG:    'vnm_kpi_config_v1',
  CT_CONFIG:     'vnm_ct_config',
  BRAND_RULES:   'vnm_custom_brand_rules_v1'
};

window.REPO_RAW = REPO_RAW;
window.PRODUCTS_URL = PRODUCTS_URL;
window.PROMOTIONS_URL = PROMOTIONS_URL;
window.LOCAL_PROMOTIONS_URL = LOCAL_PROMOTIONS_URL;
window.VAT = VAT;
window.NCOLOR = NCOLOR;
window.NBG = NBG;
window.NLBL = NLBL;
window.FALLBACK_PRODUCTS = FALLBACK_PRODUCTS;
// ============================================================
// HTML ESCAPE — shared utilities for XSS prevention
// ============================================================
function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
window.escapeHtml = escapeHtml;

// ============================================================
// TOAST
// ============================================================
var _toastTimer = null;
function showToast(msg, duration) {
  var el = document.getElementById('vnm-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'vnm-toast';
    document.body.appendChild(el);
  }
  el.textContent = String(msg || '');
  el.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(function() { el.classList.remove('show'); }, duration || 2500);
}
window.showToast = showToast;
