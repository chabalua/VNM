// Cấu hình hằng số
var REPO_RAW = 'https://raw.githubusercontent.com/chabalua/VNM/main/';
var PRODUCTS_URL = REPO_RAW + 'products.json';

var LOCAL_PROMOTIONS_URL = 'promotions.json';
var PROMOTIONS_URL = REPO_RAW + 'promotions.json';

// Thuế VAT
var VAT = 0.015;

// Màu sắc cho nhóm sản phẩm (updated Vinamilk brand)
var NCOLOR = { A: '#2563EB', B: '#D97706', C: '#006B3F', D: '#DC2626' };
var NBG = {
  A: 'background:#EFF6FF;color:#2563EB',
  B: 'background:#FFFBEB;color:#D97706',
  C: 'background:#E8F5EE;color:#006B3F',
  D: 'background:#FEF2F2;color:#DC2626'
};
var NLBL = { A: 'Sữa bột', B: 'Sữa đặc', C: 'Sữa nước', D: 'Sữa chua' };

var FALLBACK_PRODUCTS = [];

window.REPO_RAW = REPO_RAW;
window.PRODUCTS_URL = PRODUCTS_URL;
window.PROMOTIONS_URL = PROMOTIONS_URL;
window.LOCAL_PROMOTIONS_URL = LOCAL_PROMOTIONS_URL;
window.VAT = VAT;
window.NCOLOR = NCOLOR;
window.NBG = NBG;
window.NLBL = NLBL;
window.FALLBACK_PRODUCTS = FALLBACK_PRODUCTS;
