# CLAUDE.md — VNM Order

> Tài liệu ngữ cảnh cho AI coding assistant (Copilot, Cursor, Claude). Đọc file này trước khi sửa code.

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
css/style.css                    — Toàn bộ CSS, hỗ trợ data-theme=light/dark
css/tokens.css                   — CSS custom properties (màu, spacing, radius)
css/ui-primitives.css            — Component primitives tái dùng
css/mobile-ui.css                — Layout mobile, tabbar, padding safe-area
js/config.js     (~120 dòng)     — Hằng số, URLs, LS_KEYS, escapeHtml, showToast, lsCheckQuota
js/data.js       (~300 dòng)     — Fetch + cache, initData, loadProducts, loadPromotions
js/cart.js       (~1550 dòng)    — Giỏ hàng + KM Engine v2 + lịch sử đơn + buildDesktopOrderSidebarHTML
js/ui.js         (~1600 dòng)    — Render tab Đặt hàng, buildPriceTable, brand classification
js/km.js         (~1200 dòng)    — Modal CT KM, form, picker SP
js/customer.js   (~2900 dòng)    — KH + KPI + tính thưởng VNM/VIP/SBPS  ⚠️ NÊN TÁCH
js/sync.js       (~900 dòng)     — Sync 2 chiều GitHub, debounce queue push
js/ai-service.js (~270 dòng)     — AI API wrapper (OpenAI-compatible)
js/ai-context.js (~240 dòng)     — Build context từ app state cho AI
js/ai-chat.js    (~150 dòng)     — Chat logic, lịch sử hội thoại
js/ai-ui.js      (~450 dòng)     — Render tab AI
js/mobile-ui.js  (~360 dòng)     — Mobile tabbar SVG, renderDesktopSidebar
js/main.js       (~1200 dòng)    — onload, gotoTab, KPI dashboard, theme, layout detection
tests/km-engine.test.js          — Node test runner (chạy: node tests/km-engine.test.js)
tests/km-engine.test.shared.js   — 13 test cases dùng chung
tests/reward-engine.test.js      — 34 test cases cho calcVNMShopReward/calcVIPShopReward/calcSBPSReward
```

**Thứ tự load script** (cố định, đừng đảo): `config → data → cart → ui → km → customer → sync → ai-service → ai-context → ai-chat → ai-ui → mobile-ui → main`.

---

## 3. Quy tắc vàng — đọc kỹ trước khi sửa

### 🔴 KHÔNG được làm

1. **KHÔNG ghi đè `vnm_km3`** (kmProgs) trong background refresh của `initData()`. CT KM là dữ liệu user tạo, có thể chưa kịp push lên GitHub.
2. **KHÔNG nhúng user input vào HTML** mà không qua `escapeHtml()` (text) hoặc `escapeHtmlAttr()` (attribute). Đặc biệt: `kh.ten`, `kh.diachi`, `kh.ghiChu`, `prog.name`, `prog.bonusName`, `p.ten`.
3. **KHÔNG dùng framework, build tool, npm install** — giữ thuần Vanilla JS, mọi thứ load qua `<script>` tag.
4. **KHÔNG hardcode token GitHub** — token PAT lưu trong `localStorage.vnm_github_sync.token`, đọc qua `syncGetToken()`.
5. **KHÔNG đảo thứ tự load script** — có dependency ngầm (ví dụ `cart.js` cần `LS_KEYS` từ `config.js`).
6. **KHÔNG dùng `let`/`const` ở scope global** trong các file `js/*` — dùng `var` để tương thích cross-script.

### ✅ LUÔN làm

1. **LUÔN gọi `syncAutoPushFile('xxx.json')`** sau khi save dữ liệu master (products, promotions, customers, routes).
2. **LUÔN gọi `markEntityUpdated(entity)`** trước khi save để cập nhật `_updatedAt` cho merge sync.
3. **LUÔN test trên iOS Safari** — Safari cache rất aggressive. Mọi `fetch` phải có `cache: 'no-store'` + `?_t=Date.now()`.
4. **LUÔN export hàm public qua `window.fnName = fnName`** ở cuối file.
5. **LUÔN dùng `LS_KEYS.XXX`** thay vì hardcode `'vnm_xxx'`.

---

## 4. Anti-patterns đã gặp (đừng tạo lại)

| Bug | Mô tả | Đã fix tại |
|-----|-------|-----------|
| Pick best đơn lẻ thay vì aggregate stackable bonus | `_calcBestBonus` cũ pick CT lợi nhất, không cộng dồn | cart.js 2026-04-15 |
| `order_money` bỏ qua `minSKU` | Thiếu guard `hasOrderPromoMinSKU` | cart.js 2026-04-15 |
| Quên `bonusItems: []` trong early-return | Gift-other-product không chảy ra UI/lịch sử | cart.js 2026-04-15 |
| Background refresh ghi đè CT KM user vừa tạo | Mất CT KM chưa kịp push GitHub | data.js 2026-04-21 |
| `cusReadDS()` thiếu `sbpsTrungBay` | Checkbox trưng bày SBPS không ảnh hưởng preview thưởng | customer.js 2026-04-26 |
| `syncFromGitHub()` không validate promotions | GitHub trả về object lỗi → `normalizePromotionList` → `[]` → xóa trắng CT KM | data.js 2026-04-26 |
| Upload file vào sai path `js/js/` | Phải xác nhận lại canonical path: `index.html` ở repo root, JS ở `js/` |
| `tier_money` chia % cho 100 hai lần | Số CK bị chia đôi || `buildPriceTable` hiện giá KM/VAT khi chưa nhập SL | Luôn tính `calcKM(p,1,0)` → hiển thị giá giả, gây nhầm lẫn | ui.js 2026-05-04 |
| Quà tặng hiển thị số hộp thô, không quy đổi thùng | `🎁 +60 hộp` thay vì `Tặng 60 hộp (1 thùng + 12 hộp)` | ui.js 2026-05-04 |
| `data-layout='desktop'` không bao giờ được set | `isDesktopLayout()` và `getLayoutMode()` undefined → desktop CSS grid không kích hoạt | main.js 2026-05-04 |
| `renderOrder` tạo `#order-desktop-side` thứ hai bên trong `#order-list` | Conflict với CSS grid vốn trỏ vào element đã có sẵn trong HTML | ui.js 2026-05-04 |
---

## 5. KM Engine — kiến trúc 2 cấp

```
┌─────────────────────────────────────────────────────┐
│ Cấp 1: Per-SP KM (calcKM trong cart.js)             │
│  - Stackable: cộng tất cả CT phù hợp vào _calcKM_orig│
│  - Non-stackable: pick CT cho giá rẻ nhất            │
│  - Trả về: { hopKM, disc, bonus, bonusItems, desc }  │
├─────────────────────────────────────────────────────┤
│ Cấp 2: Order-level KM (calcOrderKM trong cart.js)   │
│  - order_money: CK % tổng đơn (hoặc tổng nhóm SP)   │
│  - order_bonus: tặng SP theo mức tiền               │
│    + Range tier: từ A đến < B → tặng X (1 suất)     │
│    + Repeat: mỗi A đồng → tặng X (lặp với maxSets)  │
│    + Cascade: tier lớn trước, dư áp tier nhỏ        │
└─────────────────────────────────────────────────────┘
```

### 6 loại CT KM

| `type` | Mô tả | Trường chính |
|--------|-------|-------------|
| `bonus` | Mua X → Tặng Y (cùng SP hoặc SP khác) | `bX, bY, bUnit, bMa, bMax` |
| `fixed` | Chiết khấu % cố định trên SP | `ck` |
| `tier_qty` | CK theo số lượng | `tiers[{mn, ck}], tUnit` |
| `tier_money` | CK theo tổng tiền SP | `tiers[{type, value, ck}]` |
| `order_money` | CK % tổng đơn | `tiers[{type, value, ck}]` |
| `order_bonus` | Tặng SP khi đạt mức đơn | `tiers[{value, maxValue, bonusQty}]`, `bonusMa, cascade, repeat, maxSets` |

Trường chung mọi CT: `name, active, stackable, nhoms, spMas, minSKU`.

### Hàm core (cart.js)

- `calcKM(p, qT, qL, orderContext)` — tính KM 1 SP, có check `minSKU`.
- `_calcKM_orig(p, qT, qL, rules)` — tính từ rules array đã build sẵn.
- `_calcBestBonus(rules, p, qT, totalLon, base, ckDisc)` — **aggregate** tất cả stackable bonus.
- `calcOrderKM(items)` — áp order-level KM.
- `kmBuildRules(prog)` — chuyển prog → kmRules[].
- `getItemsFromCartState(cartState)` — build items từ cart, gọi `calcKM` cho từng SP.

### Test
```bash
node tests/km-engine.test.js
```
13 test cases: 7 per-item + 4 order-level + 2 cart integration. **Chạy test trước khi commit thay đổi liên quan KM.**

---

## 6. CT Thưởng KH (customer.js)

3 chương trình áp dụng T3–12/2026 (số liệu tải từ PDF Vinamilk):

### VNM Shop (Nhóm C — Sữa nước)
- Trưng bày M1–M9 (kệ KT, ụ HZ, Minimart). Đăng ký 16–19: thưởng 50%, sau 19: 0%.
- Tích lũy 7 mức theo DS tháng. CK toàn DS + thưởng giai đoạn GĐ1 (1–10), GĐ2 (11–20), GĐ3 (21–27).
- Quy tắc: GĐ1 ≥ 25% DS ĐK, GĐ1+2 ≥ 55%, GĐ1+2+3 ≥ 85%. SP STTT 1L không tính GĐ.

### VIP Shop (Nhóm DE — Sữa chua + NGK)
- Trưng bày tủ TB1–TB4 theo DS + SKU min. Thưởng tủ VNM > tủ KH.
- Tích lũy TL1–TL5 với 2 nhóm: Chủ lực (N1) + Tập trung (N2). Vượt 90tr: +1.0%.
- Loại trừ: SCA học đường 60g, Bơ lạt 20kg, Happy Star 100g, Nước rau củ Susu 180ml, Thạch phô mai que 100g.

### SBPS Shop (Sữa bột pha sẵn TE 110ml/180ml)
- Trưng bày TH-M1 đến TH-M8 (Tạp hóa/Khác + Minimart/M&B).
- Tích lũy 8 mức × 3 nhóm: N1 (DG/GP/A2), N2 (OG/DGP), N3 (Yoko/OC). Thưởng đến ngày 26 nếu DS ≥ 100%.

### Hàm tính
- `calcVNMShopReward(kh, monthData)` → `{trungBay, tichLuy, giaiDoan1/2/3, total, details[]}`
- `calcVIPShopReward(kh, monthData)` → `{trungBay, tichLuy, vuot90, total, details[]}`
- `calcSBPSReward(kh, monthData)` → `{trungBay, tichLuy, thuong26, total, details[]}`
- `calcTotalReward(kh, monthData)` → tổng hợp 3 program

Bảng mức gốc: `VNM_SHOP_TRUNGBAY`, `VNM_SHOP_TICHLUY`, `VIP_SHOP_TRUNGBAY`, `VIP_SHOP_TICHLUY`, `SBPS_TRUNGBAY`, `SBPS_TICHLUY`. User có thể override qua `vnm_ct_config` (ctConfigLoad/ctConfigSave).

Mapping mã CT app Vinamilk → program: `VNM_APP_CODES`.

✅ **Đã có 34 test cases** — chạy: `node tests/reward-engine.test.js`. Vẫn nên đối chiếu bằng tay khi sửa logic bảng mức.

---

## 7. LocalStorage keys

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

## 8. Sync GitHub (sync.js)

- Repo: `chabalua/VNM`, branch `main`. API: `https://api.github.com/repos/.../contents/<file>`.
- Token PAT lưu localStorage, validate format `ghp_*` / `github_pat_*` / etc.
- 5 file sync: `products.json`, `promotions.json`, `customers.json`, `routes.json`, `orders.json`.
- **Auto-push**: sau mỗi save (gọi `syncAutoPushFile(filename)`). Có debounce 1500ms + queue per filename — tránh race condition.
- **Auto-pull on start**: nếu flag `autoPullAllOnStart=true`.
- Orders dùng soft delete (`_deleted: true`) để merge cross-device.

---

## 9. Tab navigation

```
NAV_TABS:  ['home', 'order', 'don', 'kh', 'adm']
ALL_PAGES: ['home', 'order', 'don', 'adm', 'km', 'kh']
```

Tab `km` ẩn trong tabbar nhưng accessible qua `gotoTab('km')` từ trong page-adm.

---

## 10. Convention & utilities

- **Số tiền VND**: `fmt(n)` từ cart.js → `1,234,567`
- **Format SP theo thùng**: `formatQtyByCarton(p, qty)` → `"60 hộp (1 thùng + 12 hộp)"`
- **Toast**: `showToast(msg, duration?)` — không dùng `alert()`
- **HTML escape**: `escapeHtml(value)` cho text, `escapeHtmlAttr(value)` cho attribute
- **VAT**: `VAT = 0.015` (1.5%)
- **Render**: build string → `el.innerHTML = html` (không có template engine)
- **Modal dùng chung**: `#km-modal` tái sử dụng cho CT KM / Sync settings / CT TB-TL / Brand rules / Order detail / KH edit
- **Layout detection**: `isDesktopLayout()` → true nếu `window.innerWidth >= 1024`. `updateLayoutMode()` set `data-layout='desktop'` trên `<html>`. Gọi khi onload + resize (debounce 150ms). Định nghĩa trong `main.js`.
- **Desktop sidebar order**: `buildDesktopOrderSidebarHTML()` từ `cart.js`, render vào `#order-desktop-side` (đã có sẵn trong HTML, là con trực tiếp của `#page-order`)

---

## 11. URLs & data files

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

## 12. Khi sửa code, hãy

1. **Đọc CLAUDE.md trước** (file này).
2. **Search ant-pattern**: trước khi viết, search trong file xem pattern tương tự đã có chưa.
3. **Test KM thay đổi**: chạy `node tests/km-engine.test.js`.
4. **Verify iOS Safari**: nếu thay đổi liên quan input/scroll/cache.
5. **Check escapeHtml**: nếu render user input ra HTML.
6. **Push GitHub**: nếu sửa file data master, đảm bảo gọi `syncAutoPushFile`.
7. **Commit message**: ngắn gọn, tiếng Việt OK. VD: `fix(cart): aggregate stackable bonus thay vì pick best`.

---

## 13. Roadmap kỹ thuật cần làm

- [x] **XSS audit toàn bộ render functions** — bọc escapeHtml ở mọi nơi chèn user input. (Done 2026-04-26: fixed km.js×2, cart.js×5, customer.js×7, main.js×1)
- [x] **Push queue + retry** trong sync.js — tránh race condition và mất data. (Done 2026-04-26: debounce 1500ms + queue per filename trong syncAutoPushFile)
- [ ] **Tách `customer.js`** thành 3 file: `customer-data.js`, `customer-reward.js`, `customer-ui.js`.
- [x] **Test cho 3 hàm reward** (calcVNMShopReward, calcVIPShopReward, calcSBPSReward). (Done 2026-04-26: 34 test cases, chạy: node tests/reward-engine.test.js)
- [x] **LocalStorage quota guard** — cảnh báo khi gần 5MB. (Done 2026-04-26: lsCheckQuota() trong config.js, gọi sau saveSP/cusSave/saveOrders)
- [x] **Desktop layout activation** — `isDesktopLayout()`, `getLayoutMode()`, `updateLayoutMode()` vào main.js; set `data-layout='desktop'` khi width ≥ 1024px. (Done 2026-05-04)
- [ ] **Tách `customer.js`** thành 3 file: `customer-data.js`, `customer-reward.js`, `customer-ui.js`.
- [ ] **Centralize state** — gom global `_xxx` vars vào 1 `appState` object.