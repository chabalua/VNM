# CLAUDE.md — Kiến trúc & Hướng dẫn làm việc với VNM App

> Tài liệu này giúp AI (Claude/Copilot) nhanh chóng nắm bắt toàn bộ codebase mà không cần đọc lại từng file mỗi lần chat mới.

---

## 1. Tổng quan

**VNM App** là ứng dụng đặt hàng / quản lý khuyến mãi cho nhân viên bán hàng Vinamilk.  
- Kiến trúc: **Single Page Application (SPA)** thuần HTML5 + Vanilla JS, không dùng framework.
- Deploy: GitHub Pages — file gốc `index.html` phục vụ trực tiếp.
- Dữ liệu master (`products.json`, `promotions.json`, `customers.json`, `routes.json`, `orders.json`) lưu trên repo GitHub, local cache trong `localStorage`.
- Không có backend — mọi logic tính toán chạy client-side.

---

## 2. Cấu trúc file

```
index.html              — HTML shell, load overlay, tab nav, tất cả script
css/style.css           — Toàn bộ CSS, hỗ trợ light/dark theme qua data-theme attribute
js/config.js    (49L)   — Hằng số, URLs, FALLBACK_PRODUCTS, showToast()
js/data.js     (223L)   — Fetch + cache dữ liệu, initData(), loadProducts(), loadPromotions()
js/cart.js     (760L)   — Giỏ hàng, KM Engine v2, calcKM(), calcOrderKM(), submitOrder(), lịch sử đơn
js/ui.js       (679L)   — Render tab Đặt hàng, Brand classification, BRAND_RULES, detectBrand()
js/km.js       (532L)   — Quản lý CT KM (modal, form, picker SP, renderKMTab)
js/customer.js(1284L)   — Quản lý KH, CT thưởng TB/TL (VNM/VIP/SBPS), KPI
js/sync.js     (517L)   — Đồng bộ 2 chiều GitHub via API (Push/Pull)
js/main.js     (656L)   — window.onload, gotoTab(), KPI dashboard, theme, tab routing
```

**Thứ tự load script trong index.html:**
`config.js` → `data.js` → `cart.js` → `ui.js` → `km.js` → `customer.js` → `sync.js` → `main.js`

---

## 3. Khởi động app (window.onload)

```
window.onload (main.js:624)
  ├── applyTheme()
  ├── await initData()          ← data.js: cache-first, background refresh
  ├── ctConfigLoad()            ← customer.js: nạp config CT TB/TL
  ├── await cusLoad()           ← customer.js: load KH + tuyến
  ├── await syncAutoPullAllOnStart()  ← sync.js: nếu có token
  ├── renderHomeDashboard()
  ├── renderSettingsOverview()
  └── renderOrder()
```

### initData() — logic cache-first (data.js)

- **Có cache** (`vnm_sp` trong localStorage): boot tức thì, refresh ẩn ở background → app mở nhanh từ lần 2 trở đi.
- **Lần đầu** chưa có cache: hiện overlay loading, đợi fetch xong mới render.

---

## 4. Dữ liệu sản phẩm (SP)

### Cấu trúc một SP
```json
{
  "ma": "01SB10",
  "ten": "Creamer đặc NSPN xanh biển 1284g",
  "nhom": "B",
  "giaNYLon": 55404,
  "donvi": "hộp",
  "slThung": 24,
  "giaNYThung": 1329696,
  "kmRules": [],
  "kmText": ""
}
```

### 4 nhóm sản phẩm

| Nhóm | Tên đầy đủ | Màu theme | Ví dụ brand |
|------|-----------|-----------|-------------|
| A | Sữa bột | Xanh (blue) | Optimum, Dielac, Grow Plus, Yoko |
| B | Sữa đặc | Vàng (amber) | Ông Thọ, NSPN, Tài Lộc |
| C | Sữa nước | Xanh VM (indigo) | STT, Green Farm, ADM, Fino, Flex |
| D | Sữa chua | Đỏ (red) | Probi, SCA, Susu/Hero, Yomilk |

### Brand classification (ui.js)

- `BRAND_RULES[]`: mảng quy tắc regex/condition, ưu tiên theo thứ tự.
- `detectBrand(p)`: kiểm tra manual override → custom rules (localStorage) → BRAND_RULES → trả về brand string.
- Custom brand rules lưu tại key `vnm_custom_brand_rules_v1`.

---

## 5. KM Engine

### 5a. Kiến trúc 2 cấp

```
Cấp 1 — Per-SP KM (calc từng sản phẩm trong giỏ)
  calcKM(p, qT, qL, orderContext)  ← cart.js
    ├── Tìm các kmProgs áp dụng cho p.ma
    ├── Tách stackable vs non-stackable
    ├── Stackable: gộp tất cả rules vào _calcKM_orig()
    ├── Non-stackable: pick prog cho giá rẻ nhất
    └── Gọi _calcKM_orig() ra kết quả cuối

Cấp 2 — Order-level KM (tính trên toàn đơn hàng)
  calcOrderKM(items)  ← cart.js
    ├── order_money: CK % tổng đơn (hoặc tổng nhóm SP chỉ định)
    └── order_bonus: Tặng SP khi đạt mức tiền
```

### 5b. 6 loại CT KM (kmProgs[])

| type | Mô tả | Trường chính |
|------|-------|-------------|
| `bonus` | Mua X → Tặng Y (cùng loại hoặc SP khác) | bX, bY, bUnit, bMa, bMax |
| `fixed` | Chiết khấu % cố định trên từng SP | ck |
| `tier_qty` | CK theo số lượng mua (từng ngưỡng) | tiers[{mn, ck}], tUnit |
| `tier_money` | CK theo tổng tiền SP đó | tiers[{type, value, ck}] |
| `order_money` | CK % tổng đơn hàng | tiers[{type, value, ck}] |
| `order_bonus` | Tặng SP khi tổng đơn đạt mức | tiers[{value, bonusQty}], bonusMa, bonusName |

### 5c. Cấu trúc một CT KM
```json
{
  "name": "NSPN 48+8",
  "type": "bonus",
  "active": true,
  "stackable": true,
  "nhoms": "B",
  "spMas": ["01SB10", "01SB02"],
  "bX": 48, "bY": 8, "bUnit": "lon", "bMax": 0,
  "minSKU": 0
}
```

### 5d. Trường chung của mọi CT KM

- `active` (bool): bật/tắt CT.
- `stackable` (bool): gộp với CT khác hay chỉ dùng CT lợi nhất.
- `nhoms` (string `""/"A"/"B"/"C"/"D"`): nhóm SP (chỉ dùng để filter UI, không ảnh hưởng tính toán).
- `spMas` (array): danh sách mã SP áp dụng (empty = áp tất cả, với order level).
- `minSKU` (number): số SKU tối thiểu trong giỏ mới áp CT.

### 5e. kmBuildRules(prog)

Chuyển prog → `kmRules[]` gắn vào SP để `_calcKM_orig()` tính.  
`order_money` và `order_bonus` không build rules per-SP → trả về `[]`.

---

## 6. LocalStorage keys

| Key | Nội dung |
|-----|---------|
| `vnm_sp` | Danh sách sản phẩm (SP[]) |
| `vnm_km3` | Danh sách CT KM (kmProgs[]) |
| `vnm_customers2` | Danh sách khách hàng (CUS[]) |
| `vnm_routes` | Danh sách tuyến (ROUTES[]) |
| `vnm_orders_v2` | Lịch sử đơn hàng |
| `vnm_cart` | Giỏ hàng hiện tại |
| `vnm_favorites` | Mã SP yêu thích (trong picker KM) |
| `vnm_github_sync` | Config sync: token, flags, lastPush, lastPull |
| `vnm_kpi_config_v1` | Config KPI theo tháng + rule codes |
| `vnm_ct_config` | Config CT TB/TL (bảng thưởng tùy chỉnh) |
| `vnm_theme_mode` | `"light"` / `"dark"` |
| `vnm_custom_brand_rules_v1` | Custom brand rules (ghi đè BRAND_RULES) |
| `vnm_kh` | Legacy customers (dùng cho syncLegacyCustomerOrder) |

---

## 7. Sync Module (sync.js)

- Dùng **GitHub Contents API** (`/repos/chabalua/VNM/contents/<file>`).
- Token PAT lưu trong `vnm_github_sync.token` (localStorage), không bao giờ hardcode.
- `SYNC_FILES[]`: map tên file → `getLocal()` / `setLocal()`.
- **syncAutoPullAllOnStart()**: pull khi khởi động nếu `autoPullAllOnStart=true` và có token.
- **syncAutoPushFile(filename)**: push 1 file sau khi sửa (gọi sau kmSave, cusSave...).
- **syncAutoPushOrder(order)**: push `orders.json` sau khi tạo đơn.

---

## 8. Tab navigation (gotoTab)

```
NAV_TABS: ['home', 'order', 'don', 'kh', 'adm']
ALL_PAGES: ['home', 'order', 'don', 'adm', 'km', 'kh']

Tab 'km' hiển thị trong page-km, nhưng nav highlight tab 'adm'.
```

| Tab | Page ID | Render function |
|-----|---------|----------------|
| home | page-home | renderHomeDashboard() |
| order | page-order | renderOrder() (ui.js) |
| don | page-don | renderDon() (cart.js) |
| kh | page-kh | renderCusTab() + renderRoutePills() |
| adm | page-adm | renderSettingsOverview() + renderAdm() |
| km | page-km | renderKMTab() |

---

## 9. CT Thưởng KH (customer.js)

3 nhóm chương trình thưởng từ PDF Vinamilk:

| Nhóm | Mô tả |
|------|-------|
| `VNM_SHOP` | Trưng Bày M1–M9 + Tích Lũy 7 mức (DS tháng) |
| `VIP_SHOP` | Trưng Bày TB1–TB4 + Tích Lũy TL1–TL5 |
| `SBPS` | Trưng Bày TH-M1–M8 + Tích Lũy 8 mức |

- Bảng lưu trong code, có thể override qua `vnm_ct_config` (localStorage) → `ctConfigLoad()`.
- `VNM_APP_CODES`: mapping mã CT app Vinamilk → program nội bộ.

---

## 10. KPI Dashboard (main.js)

- `KPI_DEFAULT_TARGETS`: mục tiêu mặc định theo tháng.
- `getKpiTargets(monthKey)`: merge default + custom từ config.
- 3 nhóm KPI: Chỉ tiêu tháng / Công việc trọng tâm / Thực thi KPIs.
- Rule codes (Green Farm, FM, Cat D): có thể override qua Settings.

---

## 11. Modal dùng chung

`km-modal` được tái sử dụng cho nhiều mục đích:
- Tạo/sửa CT KM
- Cài đặt Sync GitHub
- Cài đặt CT TB/TL
- Chi tiết đơn hàng
- Brand rules settings

---

## 12. Quy ước code

- **Không dùng framework** — thuần Vanilla JS ES5/ES6 (async/await, arrow fn OK).
- Mọi biến toàn cục dùng `var` (tương thích cross-script).
- Module export qua `window.functionName = functionName` ở cuối mỗi file.
- Render HTML = build string → `el.innerHTML = html` (không dùng template engine).
- `fmt(n)`: format số tiền VND (cart.js).
- `showToast(msg)`: thông báo ngắn thay thế alert (config.js).
- `escapeHtmlAttr(value)`: escape trước khi nhúng vào HTML attribute (cart.js).
- VAT = 1.5% (`VAT = 0.015` trong config.js).

---

## 13. URLs

```javascript
REPO_RAW    = 'https://raw.githubusercontent.com/chabalua/VNM/main/'
PRODUCTS_URL        = REPO_RAW + 'products.json'
PROMOTIONS_URL      = REPO_RAW + 'promotions.json'
LOCAL_PROMOTIONS_URL = 'promotions.json'   // file local trước, fallback GitHub
CUSTOMERS_URL        = REPO_RAW + 'customers.json'
ROUTES_URL           = REPO_RAW + 'routes.json'
```

Mọi fetch đều cache-bust bằng `?_t=Date.now()` + `cache: 'no-store'` để tránh iOS Safari cache.

---

## 14. Nhật ký thay đổi

### 2026-04-07
- **km.js**: Thêm ô tìm kiếm (`km-picker-search`) vào product picker trong form CT KM — filter real-time theo tên/mã, kết hợp với filter nhóm. Thêm biến `_kmPickerSearch`, hàm `kmPickerSearch()`, reset khi mở modal.
- **km.js**: Fix dropdown "SP được tặng" trong loại `bonus` — đổi từ `SP.forEach` lọc B/C/D sang `optgroup` đủ 4 nhóm A/B/C/D.
- **km.js**: Fix dropdown "SP được tặng" trong loại `order_bonus` — tương tự, chia `optgroup` A/B/C/D.
- **data.js**: Tối ưu `initData()` — cache-first: nếu có `vnm_sp` trong localStorage thì boot ngay tức thì, refresh ẩn ở background; chỉ hiện overlay loading khi lần đầu chưa có cache.
