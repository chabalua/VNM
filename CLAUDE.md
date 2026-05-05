# CLAUDE.md — VNM Order

> Tài liệu ngữ cảnh cho AI coding assistant. Đọc file này trước khi sửa code.
>
> **File này CỐ TÌNH ngắn để tiết kiệm token mỗi turn.** Chi tiết các area lớn nằm trong `docs/*.md` — chỉ đọc khi cần (hướng dẫn ở §4).

---

## 1. App là gì

**VNM Order** — PWA đặt hàng cho NVBH Vinamilk tại Buôn Ma Thuột (Đắk Lắk). Field sales chạy trên iPhone, không có backend riêng.

- **Stack**: Vanilla JS (không framework) + HTML5 + CSS — single page app.
- **Data**: localStorage cho cache, GitHub repo `chabalua/VNM` làm backend đồng bộ qua Contents API.
- **Deploy**: GitHub Pages, file gốc `index.html`.
- **Phạm vi**: ~190 SKU × 4 nhóm A/B/C/D, ~100 KH, lịch sử đơn vài tháng.

---

## 2. Cấu trúc file

```
index.html                       — HTML shell + script loader
css/style.css, tokens.css, ui-primitives.css, mobile-ui.css
js/config.js     (~120 dòng)     — Hằng số, URLs, LS_KEYS, escapeHtml, showToast, lsCheckQuota
js/data.js       (~300 dòng)     — Fetch + cache, initData, loadProducts, loadPromotions
js/cart.js       (~1600 dòng)    — Giỏ hàng + KM Engine v2 + lịch sử đơn + buildOrderContextFromCart + debugCalcPrice
js/ui.js         (~500 dòng)     — Điều phối tab Đặt hàng + filter/state bridge + public UI exports
js/order-pricing-ui.js           — Pricing snapshot, buildPriceTable, TL strip, promo chips
js/order-interactions-ui.js      — onQty, toggleCard, draft cart state
js/order-render-ui.js            — HTML builders cho card/section Đặt hàng
js/admin-products-ui.js          — Tab admin sản phẩm + modal sửa SP
js/km.js         (~1200 dòng)    — Modal CT KM, form, picker SP
js/customer-data.js              — Dữ liệu KH/tuyến + sanitize + monthly aggregation
js/customer-reward.js            — Engine thưởng VNM/VIP/SBPS + cấu hình CT
js/customer-ui.js                — UI tab KH + form + nhập DS + route manager
js/sync.js       (~900 dòng)     — Sync 2 chiều GitHub, debounce queue push
js/ai-*.js                       — Tab AI (service, context, chat, ui)
js/mobile-ui.js  (~360 dòng)     — Mobile tabbar SVG, renderDesktopSidebar
js/main.js       (~1200 dòng)    — onload, gotoTab, KPI dashboard, theme, layout detection
docs/                            — Tài liệu chi tiết per-area (xem §4)
tests/                           — Node test runner
```

**Thứ tự load script** (cố định, đừng đảo): `config → data → cart → ui → order-pricing-ui → order-interactions-ui → order-render-ui → admin-products-ui → km → customer-data → customer-reward → customer-ui → sync → ai-service → ai-context → ai-chat → ai-ui → mobile-ui → main`.

---

## 3. Quy tắc vàng — đọc kỹ trước khi sửa

### 🔴 KHÔNG được làm

1. **KHÔNG ghi đè `vnm_km3`** (kmProgs) trong background refresh của `initData()`. CT KM là dữ liệu user tạo, có thể chưa kịp push lên GitHub.
2. **KHÔNG nhúng user input vào HTML** mà không qua `escapeHtml()` (text) hoặc `escapeHtmlAttr()` (attribute). Đặc biệt: `kh.ten`, `kh.diachi`, `kh.ghiChu`, `prog.name`, `prog.bonusName`, `p.ten`.
3. **KHÔNG dùng framework, build tool, npm install** — giữ thuần Vanilla JS, mọi thứ load qua `<script>` tag.
4. **KHÔNG hardcode token GitHub** — token PAT lưu trong `localStorage.vnm_github_sync.token`, đọc qua `syncGetToken()`.
5. **KHÔNG đảo thứ tự load script** — có dependency ngầm.
6. **KHÔNG dùng `let`/`const` ở scope global** trong các file `js/*` — dùng `var` để tương thích cross-script.
7. **KHÔNG gọi `calcKM(p, qT, qL)` mà thiếu `orderContext`** — sẽ bypass minSKU check. Dùng `buildOrderContextFromCart(ma)`.
8. **KHÔNG import/restore master data bằng filter ad-hoc** — luôn đi qua `sanitizeProductList`, `sanitizePromotionList`, `sanitizeCustomerList`, `sanitizeRouteList`.
9. **KHÔNG tự xóa CTKM active chỉ vì thiếu mã SP** — đây là lỗi dữ liệu nghiệp vụ; trước hết phải cảnh báo, audit, rồi mới sửa dữ liệu gốc.

### ✅ LUÔN làm

1. **LUÔN gọi `syncAutoPushFile('xxx.json')`** sau khi save dữ liệu master.
2. **LUÔN gọi `markEntityUpdated(entity)`** trước khi save để cập nhật `_updatedAt`.
3. **LUÔN test trên iOS Safari** — Safari cache rất aggressive. Mọi `fetch` phải có `cache: 'no-store'` + `?_t=Date.now()`.
4. **LUÔN export hàm public qua `window.fnName = fnName`** ở cuối file.
5. **LUÔN dùng `LS_KEYS.XXX`** thay vì hardcode `'vnm_xxx'`.
6. **LUÔN chạy sanitizer ở mọi luồng nạp master data**: load local, import file, restore backup, pull/push sync.
7. **LUÔN check cảnh báo duplicate/missing-ref trong tab KM** sau khi chỉnh `promotions.json` hoặc import CTKM.

---

## 4. Khi sửa các area sau, ĐỌC TRƯỚC tài liệu chi tiết tương ứng

| Khi sửa... | Đọc trước |
|---|---|
| Logic giá / KM / chiết khấu (cart.js calcKM/calcOrderKM, ui.js render giá) | `docs/km-engine.md` |
| Thưởng KH (VNM/VIP/SBPS Shop, customer-*.js) | `docs/reward-engine.md` |
| Sync GitHub (sync.js, data.js) | `docs/sync.md` |
| Dữ liệu CTKM / mã SP thiếu / duplicate KM | `docs/promotion-data-audit.md` |
| File js bất kỳ — kiểm tra bug history | `docs/anti-patterns.md` |

**Quy tắc đọc:** chỉ đọc file nào liên quan tới task. KHÔNG đọc tất cả mỗi turn.

---

## 5. LocalStorage keys

| Key (LS_KEYS) | Nội dung |
|---|---|
| `SP` (`vnm_sp`) | Sản phẩm |
| `KM` (`vnm_km3`) | CT KM (user tạo — không tự ghi đè) |
| `CART` (`vnm_cart`) | Giỏ hiện tại |
| `FAVORITES` (`vnm_favorites`) | SP yêu thích |
| `CUSTOMERS` (`vnm_customers2`) | Khách hàng |
| `ROUTES` (`vnm_routes`) | Tuyến |
| `ORDERS` (`vnm_orders_v2`) | Lịch sử đơn (gồm cả `_deleted`) |
| `LEGACY_KH` (`vnm_kh`) | Legacy customer orders |
| `GITHUB_SYNC` (`vnm_github_sync`) | Token + flags + lastPush/Pull |
| `THEME` (`vnm_theme_mode`) | `light` / `dark` |
| `KPI_CONFIG` (`vnm_kpi_config_v1`) | Mục tiêu KPI tháng + rule codes |
| `CT_CONFIG` (`vnm_ct_config`) | Override bảng CT TB/TL |
| `BRAND_RULES` (`vnm_custom_brand_rules_v1`) | Custom brand rules ghi đè BRAND_RULES |

---

## 6. Tab navigation

```
NAV_TABS:  ['home', 'order', 'don', 'kh', 'adm']
ALL_PAGES: ['home', 'order', 'don', 'adm', 'km', 'kh']
```
Tab `km` ẩn trong tabbar nhưng accessible qua `gotoTab('km')` từ trong page-adm.

---

## 7. Convention & utilities

- **Số tiền VND**: `fmt(n)` từ cart.js → `1,234,567`
- **Format SP theo thùng**: `formatQtyByCarton(p, qty)` → `"60 hộp (1 thùng + 12 hộp)"`
- **Toast**: `showToast(msg, duration?)` — không dùng `alert()`
- **HTML escape**: `escapeHtml(value)` cho text, `escapeHtmlAttr(value)` cho attribute
- **VAT**: `VAT = 0.015` (1.5%)
- **Render**: build string → `el.innerHTML = html` (không có template engine)
- **Modal dùng chung**: `#km-modal` tái sử dụng cho nhiều form
- **Layout**: `isDesktopLayout()` / `updateLayoutMode()` trong `main.js`. Set `data-layout='desktop'` khi `width >= 1024px`.
- **Desktop sidebar order**: `buildDesktopOrderSidebarHTML()` từ `cart.js`, render vào `#order-desktop-side`.
- **Debug giá**: `debugCalcPrice('01SX05', 2, 0)` trong console — in trace đầy đủ.

---

## 8. URLs & data files

```javascript
REPO_RAW             = 'https://raw.githubusercontent.com/chabalua/VNM/main/'
PRODUCTS_URL         = REPO_RAW + 'products.json'
PROMOTIONS_URL       = REPO_RAW + 'promotions.json'
LOCAL_PROMOTIONS_URL = 'promotions.json'  // ưu tiên local trước
CUSTOMERS_URL        = REPO_RAW + 'customers.json'
ROUTES_URL           = REPO_RAW + 'routes.json'
```

Mọi fetch: `fetch(url + '?_t=' + Date.now(), { cache: 'no-store' })`.

---

## 9. Workflow khi sửa code

1. **Đọc file CLAUDE.md root này** (đang đọc).
2. **Nếu sửa area lớn (KM/Reward/Sync)**: đọc `docs/<area>.md` tương ứng (xem §4).
3. **Search anti-pattern**: trước khi viết, search file để xem pattern tương tự đã có chưa.
4. **Test KM thay đổi**: chạy `node tests/km-engine.test.js`.
5. **Test reward thay đổi**: chạy `node tests/reward-engine.test.js`.
6. **Test validation/sync guard thay đổi**: chạy `node tests/data-validation.test.js` và `node tests/sync-guards.test.js`.
7. **KHÔNG nói "test ok" nếu thay đổi nằm ngoài engine**. Engine test KHÔNG cover UI render path. Phải nói rõ:
   - Test case nào cover thay đổi này?
   - Nếu KHÔNG có → liệt kê path UI bị ảnh hưởng + yêu cầu user verify thủ công bằng kịch bản cụ thể.
8. **Verify iOS Safari**: nếu thay đổi liên quan input/scroll/cache.
9. **Check escapeHtml**: nếu render user input ra HTML.
10. **Push GitHub**: nếu sửa file data master, đảm bảo gọi `syncAutoPushFile`.
11. **Commit message**: ngắn gọn, tiếng Việt OK. VD: `fix(cart): aggregate stackable bonus thay vì pick best`.

---

## 10. Roadmap kỹ thuật

- [x] XSS audit toàn bộ render functions (Done 2026-04-26)
- [x] Push queue + retry trong sync.js (Done 2026-04-26)
- [x] Test cho 3 hàm reward (Done 2026-04-26: 34 test cases)
- [x] LocalStorage quota guard (Done 2026-04-26: lsCheckQuota())
- [x] Desktop layout activation (Done 2026-05-04)
- [x] Fix calcKM thiếu orderContext ở UI call sites — bypass minSKU (Done 2026-05-04)
- [x] Tách CLAUDE.md thành docs/ — tiết kiệm token (Done 2026-05-04)
- [x] Debug helper `debugCalcPrice` cho console (Done 2026-05-04)
- [x] Tách `customer.js` thành 3 file: `customer-data.js`, `customer-reward.js`, `customer-ui.js` (Done 2026-05-05)
- [x] Tách `ui.js` thành order/admin submodules (`order-pricing-ui`, `order-interactions-ui`, `order-render-ui`, `admin-products-ui`) (Done 2026-05-05)
- [x] Dedupe `promotions.json` ở cả load boundary lẫn file gốc để chặn CTKM nhân bản gây cộng quà x2/x3 (Done 2026-05-05)
- [x] Cảnh báo duplicate KM + CTKM tham chiếu mã SP thiếu ngay trong tab KM (Done 2026-05-05)
- [x] Hardening import/restore/sync bằng shared sanitizers + test `data-validation`/`sync-guards` (Done 2026-05-05)
- [ ] Centralize state — gom global `_xxx` vars vào 1 `appState` object
