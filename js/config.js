// Cấu hình hằng số
const REPO_RAW = 'https://raw.githubusercontent.com/chabalua/VNM-PWD-1/main/';
const PRODUCTS_URL = REPO_RAW + 'products.json';
const PROMOTIONS_URL = REPO_RAW + 'promotions.json';

// Thuế VAT
const VAT = 0.015;

// Màu sắc cho nhóm sản phẩm
const NCOLOR = { A: '#1557b0', B: '#b45309', C: '#004d33', D: '#c62828' };
const NBG = {
  A: 'background:#eef3ff;color:#1557b0',
  B: 'background:#fef9e7;color:#b45309',
  C: 'background:#e0f5ea;color:#004d33',
  D: 'background:#fff0f0;color:#c62828'
};
const NLBL = { A: 'Sữa bột', B: 'Sữa đặc', C: 'Sữa nước', D: 'Sữa chua' };

// Dữ liệu fallback (dùng khi không có mạng và cũng chưa có cache)
const FALLBACK_PRODUCTS = [ /* nội dung fallback products như trong file gốc */ ];

// Export ra window để dùng chung
window.REPO_RAW = REPO_RAW;
window.PRODUCTS_URL = PRODUCTS_URL;
window.PROMOTIONS_URL = PROMOTIONS_URL;
window.VAT = VAT;
window.NCOLOR = NCOLOR;
window.NBG = NBG;
window.NLBL = NLBL;
window.FALLBACK_PRODUCTS = FALLBACK_PRODUCTS;