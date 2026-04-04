# VNM Order v4 — Cập nhật

## Tổng quan thay đổi

### 1. Fix Products không update từ GitHub
- **Nguyên nhân**: Safari iOS cache cực mạnh, `fetch()` không bypass cache
- **Fix**: Thêm `cache: 'no-store'` + timestamp query `?_t=xxx` vào mọi fetch URL
- **File**: `js/data.js`

### 2. Bỏ Xuất/Nhập data chung, chỉ giữ products.json
- Bỏ: "Xuất data (JSON)" và "Nhập data từ JSON"
- Giữ: "Xuất products.json (GitHub)" 
- Thêm mới: "Nhập products.json" — import file products.json local
- **Files**: `js/data.js`, `index.html`

### 3. Redesign giao diện Vinamilk brand
- **Brand colors**: `#006B3F` (Vinamilk Green) + `#D4A843` (Gold accent)
- **Tab bar**: Thêm icon emoji cho mỗi tab, chữ lớn hơn, gold underline cho tab active
- **Cards**: Bo tròn 14px, shadow nhẹ, spacing thoáng hơn
- **Pills/chips**: Lớn hơn (12px font, 14px padding), dễ bấm trên mobile
- **Buttons**: Gradient xanh Vinamilk, shadow, active animation
- **Price table**: Header uppercase, spacing đẹp hơn
- **Modals**: Backdrop blur, border-radius 20px
- **Loading**: Spinner animation thay vì emoji
- **FAB**: Lớn hơn (56px), shadow đẹp, active scale animation
- **File**: `css/style.css` (viết lại hoàn toàn)

### 4. Fix bugs logic
- **CUS variable reference**: `let CUS` → `var CUS` để cross-script accessible
- **`_selectedCustomerMa` sync**: Thêm `window._selectedCustomerMa = ma` khi thay đổi
- **`setNhom` duplicate**: Bỏ define trong main.js (chỉ giữ trong ui.js)
- **`window.CUS` export**: Bỏ function wrapper, dùng var trực tiếp
- **getCUS() helper**: Thêm helper function trong ui.js để safe access CUS array

## Files cần THAY THẾ (ghi đè)
| File | Thay đổi |
|------|----------|
| `index.html` | Icon tabs, bỏ export/import data, thêm import products |
| `css/style.css` | Redesign hoàn toàn — Vinamilk brand |
| `js/config.js` | Cập nhật brand colors, thêm LOCAL_PROMOTIONS_URL export |
| `js/data.js` | Cache busting, bỏ exportData/importData, thêm importProductsJSON |
| `js/cart.js` | Fix Object.assign spread, fix _selectedCustomerMa access |
| `js/ui.js` | Fix CUS access, brand detection gọn hơn, onSelectCustomer sync |
| `js/main.js` | Bỏ duplicate setNhom, clean tab switching |
| `js/customer.js` | `let` → `var` cho CUS/ROUTES, bỏ function wrapper exports |

## Files KHÔNG thay đổi
- `js/km.js` — giữ nguyên
- `promotions.json` — giữ nguyên
- `products.json` — giữ nguyên
- `customers.json` — giữ nguyên
- `routes.json` — giữ nguyên
