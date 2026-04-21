# CLAUDE.md — Kiến trúc & Hướng dẫn làm việc với VNM App

> Tài liệu này giúp AI (Claude/Copilot) nhanh chóng nắm bắt toàn bộ codebase mà không cần đọc lại từng file mỗi lần chat mới.

---

## 1. Tổng quan

**VNM App** là ứng dụng đặt hàng / quản lý khuyến mãi cho nhân viên bán hàng Vinamilk.  
- Kiến trúc: **Single Page Application (SPA)** thuần HTML5 + Vanilla JS, không dùng framework.
- Deploy: GitHub Pages — file gốc `index.html` phục vụ trực tiếp.
- Dữ liệu master (`products.json`, `promotions.json`, `customers.json`, `routes.json`, `orders.json`) lưu trên repo GitHub, local cache trong `localStorage`.
- Không có backend — mọi logic tính toán chạy client-side.
- Repo: `https://github.com/chabalua/VNM` — branch `main`.

---

## 2. Cấu trúc file

```
index.html               — HTML shell, load overlay, tab nav, tất cả script
css/style.css            — Toàn bộ CSS, hỗ trợ light/dark theme qua data-theme attribute
js/config.js    (~50L)   — Hằng số, URLs, FALLBACK_PRODUCTS, showToast()
js/data.js     (~230L)   — Fetch + cache dữ liệu, initData(), loadProducts(), loadPromotions()
js/cart.js     (~820L)   — Giỏ hàng, KM Engine v2, calcKM(), calcOrderKM(), submitOrder(), lịch sử đơn
js/ui.js       (~680L)   — Render tab Đặt hàng, Brand classification, BRAND_RULES, detectBrand()
js/km.js       (~560L)   — Quản lý CT KM (modal, form, picker SP, renderKMTab)
js/customer.js (~1290L)  — Quản lý KH, CT thưởng TB/TL (VNM/VIP/SBPS), KPI
js/sync.js     (~520L)   — Đồng bộ 2 chiều GitHub via API (Push/Pull)
js/main.js     (~660L)   — window.onload, gotoTab(), KPI dashboard, theme, tab routing
tests/km-engine.test.html      — Browser runner cho test suite KM engine
tests/km-engine.test.shared.js — 13 test cases dùng chung browser + Node
tests/km-engine.test.js        — Node.js automated runner (vm sandbox)
```

**Thứ tự load script trong index.html:**
`config.js` → `data.js` → `cart.js` → `ui.js` → `km.js` → `customer.js` → `sync.js` → `main.js`

---

## 3. Khởi động app (window.onload)

```
window.onload (main.js)
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
- **Lưu ý quan trọng**: Background refresh chỉ cập nhật `vnm_sp` (products). Không được ghi đè `vnm_km3` (kmProgs do user tạo) khi refresh ẩn.

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

## 5. KM Engine (cart.js)

### 5a. Kiến trúc 2 cấp

```
Cấp 1 — Per-SP KM (calc từng sản phẩm trong giỏ)
  calcKM(p, qT, qL, orderContext)  ← cart.js
    ├── Tìm các kmProgs áp dụng cho p.ma
    ├── Tách stackable vs non-stackable
    ├── Stackable: gộp tất cả rules vào _calcKM_orig()
    ├── Non-stackable: pick prog cho giá rẻ nhất
    └── Gọi _calcKM_orig() → { hopKM, desc, bonusItems, ... }

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

### 5f. Hàm nội bộ quan trọng

- `_calcKM_orig(p, qT, qL, rules)` — tính KM thực tế từ rules array, trả về `{ hopKM, desc, bonusItems, nhan, ... }`.
- `_calcBestBonus(bonusRules, qT, qL, p)` — **gộp tất cả** stackable bonus rules (không pick best): same-SP bonus → tăng denominator; gift-other-SP → trừ vào giá trị numerator.
- `_calcDiscountRules(discRules, qT, qL, p)` — tính CK từ fixed/tier rules, trả về % CK tổng.
- `getItemsFromCartState(cartState)` — build danh sách items từ cart, gọi `calcKM` cho từng SP, đính kèm `bonusItems`.
- `calcOrderKM(items)` — áp order-level KM, trả về `{ totalDisc, orderBonusItems, desc }`.

### 5g. Bugs đã fix (tháng 4/2026)

1. `_calcBestBonus`: Trước đây pick best đơn lẻ → giờ **aggregate tất cả** stackable bonus rules.
2. `calcOrderKM`: `order_money` không check `minSKU` → đã thêm guard `hasOrderPromoMinSKU`.
3. `getItemsFromCartState` + `calcKM` early-return: thiếu `bonusItems: []` → đã thêm để gift-other-product chảy ra UI và lịch sử đơn.

---

## 6. Test Suite (tests/)

Chạy test: `node tests/km-engine.test.js` từ thư mục gốc.

### 13 test cases chia 3 nhóm:

**Nhóm A — Per-item (7 tests)**
1. No promotion → base price unchanged
2. Stackable fixed + tier_qty → cộng dồn đúng
3. Non-stackable → chọn CT giá rẻ nhất
4. Stackable fixed + same-product bonus → giá cuối đúng
5. Stackable fixed + gift-other-product → giá trị quà tính vào
6. Multiple stackable bonus → aggregate cả same-SP và gift-SP
7. minSKU blocks per-item KM khi chưa đủ SKU

**Nhóm B — Order-level (4 tests)**
8. order_money stackable + non-stackable → gộp đúng
9. minSKU cho order_money
10. order_bonus range tier → đúng số lượng tặng
11. order_bonus repeat → đúng maxSets

**Nhóm C — Cart integration (2 tests)**
12. `getItemsFromCartState` giữ item-level gift details
13. Tổng đơn kết hợp item KM + order KM đúng grand total

---

## 7. LocalStorage keys

| Key | Nội dung |
|-----|---------|
| `vnm_sp` | Danh sách sản phẩm (SP[]) |
| `vnm_km3` | Danh sách CT KM (kmProgs[]) — do user tạo, không overwrite khi background refresh |
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

## 8. Sync Module (sync.js)

- Dùng **GitHub Contents API** (`/repos/chabalua/VNM/contents/<file>`).
- Token PAT lưu trong `vnm_github_sync.token` (localStorage), không bao giờ hardcode.
- `SYNC_FILES[]`: map tên file → `getLocal()` / `setLocal()`.
- **syncAutoPullAllOnStart()**: pull khi khởi động nếu `autoPullAllOnStart=true` và có token.
- **syncAutoPushFile(filename)**: push 1 file sau khi sửa (gọi sau kmSave, cusSave...).
- **syncAutoPushOrder(order)**: push `orders.json` sau khi tạo đơn.

---

## 9. Tab navigation (gotoTab)

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

## 10. CT Thưởng KH (customer.js)

3 nhóm chương trình thưởng T3–12/2026 từ Vinamilk:

### 10a. VNM Shop (Nhóm C — Sữa nước)

Mã app: `[Miền]_VNMS26_TB` (trưng bày) / `[Miền]_VNMS26_TL` (tích lũy).

**Trưng bày (9 mức):**

| Mức | Loại kệ | DS min TB/tháng | Thưởng TB |
|-----|---------|-----------------|-----------|
| M1 | Ụ HZ + Kệ KH 24 mặt | 45,000,000 | 900,000đ |
| M2 | Ụ HZ + Kệ KH 18 mặt | 38,000,000 | 750,000đ |
| M3 | Ụ HZ + Kệ KH 8 mặt  | 30,000,000 | 600,000đ |
| M4 | Kệ SN + Kệ KH 12 mặt | 18,000,000 | 350,000đ |
| M5 | Kệ KH 24 mặt | 12,000,000 | 240,000đ |
| M6 | Kệ KH 18 mặt | 8,000,000 | 150,000đ |
| M7 | Minimart 50 mặt | 35,000,000 | 700,000đ |
| M8 | Minimart 40 mặt | 28,000,000 | 550,000đ |
| M9 | Minimart 30 mặt | 20,000,000 | 400,000đ |

Đăng ký 16–19: thưởng TB = 50%. Sau 19: không thưởng.

**Tích lũy DS tháng (7 mức) + thưởng giai đoạn:**

| Mức | DS min TL | DS max | CK/DS | GĐ1 (1–10) | GĐ2 (11–20) | GĐ3 (21–27) |
|-----|-----------|--------|-------|-------------|--------------|--------------|
| 1 | 200,000,000 | ∞ | 1.80% | 1.60% | 1.20% | 0.60% |
| 2 | 100,000,000 | 200tr | 1.70% | 1.60% | 1.20% | 0.60% |
| 3 | 65,000,000 | 100tr | 1.60% | 1.60% | 1.20% | 0.60% |
| 4 | 35,000,000 | 65tr | 1.50% | 1.60% | 1.20% | 0.60% |
| 5 | 20,000,000 | 35tr | 1.40% | 1.60% | 1.20% | 0.60% |
| 6 | 10,000,000 | 20tr | 1.30% | 1.60% | 1.20% | 0.60% |
| 7 | 5,000,000 | 10tr | 1.20% | 1.60% | 1.20% | 0.60% |

Quy tắc GĐ: GĐ1 ≥ 25% DS ĐK; GĐ1+2 ≥ 55%; GĐ1+2+3 ≥ 85% — phải đạt 100% DS ĐK cuối tháng.  
SP STTT 1L không tính thưởng GĐ.

### 10b. VIP Shop T3–T6/2026 (Nhóm DE — Sữa chua + NGK)

Mã app: `[Miền]_VIPSHOP26_TB` / `[Miền]_VIPSHOP26_TL`.  
SP loại trừ: SCA học đường 60g, Bơ lạt 20kg, SCA Happy Star 100g, Nước rau củ Susu 180ml, Thạch phô mai que Susu 100g.

**Trưng bày tủ (4 mức):**

| Mức | DS min TB | SKU min D | Thưởng Tủ VNM | Thưởng Tủ KH |
|-----|-----------|-----------|---------------|--------------|
| TB1 | 15,000,000 | 10 | 800,000đ | 400,000đ |
| TB2 | 12,000,000 | 8 | 630,000đ | 320,000đ |
| TB3 | 6,000,000 | 6 | 320,000đ | 160,000đ |
| TB4 | 3,000,000 | 4 | 200,000đ | 100,000đ |

Tủ ≥ 600L (2 cánh): bắt buộc TB1. Đăng ký 16–20: 50%; Sau 20: không thưởng.

**Tích lũy (5 mức):**

| Mức | DS min DE | CK Nhóm 1 (Chủ lực) | CK Nhóm 2 (Tập trung) |
|-----|-----------|---------------------|----------------------|
| TL1 | 60,000,000 | 2.6% | 5.5% |
| TL2 | 30,000,000 | 2.4% | 5.0% |
| TL3 | 15,000,000 | 2.2% | 4.5% |
| TL4 | 9,000,000 | 2.0% | 4.0% |
| TL5 | 3,000,000 | 1.8% | 4.0% |

- **Nhóm 1 (Chủ lực)**: SCA Trắng CĐ, SCA Nha đam CĐ, SCA Star, Probi 65ml/130ml CĐ, Phô Mai.
- **Nhóm 2 (Tập trung)**: SCA D các loại (trừ CĐ), SCA Green Farm, SCU Probi (trừ CĐ), SCU Green Farm, Nước dừa, Kombucha.
- Thưởng vượt 90tr DS: (DS thực − 90tr) × 1.0%. Thưởng ICY: mỗi 20 thùng → +1 thùng lũy kế.

### 10c. SBPS Shop T3–T6/2026 (Sữa bột pha sẵn TE)

Mã app: `[Miền]_SBPS_TE26_TL`.  
SP: SBPS_TE (hộp/chai 110ml, 180ml).

**Tích lũy (8 mức):**

| Mức | DS min | N1 (DG/GP/A2) | N2 (OG/DGP) | N3 (Yoko/OC) | Thưởng đến 26 |
|-----|--------|---------------|-------------|-------------|--------------|
| 1 | 160,000,000 | 7.00% | 7.30% | 6.20% | 1.00% |
| 2 | 105,000,000 | 6.70% | 7.10% | 6.00% | 1.00% |
| 3 | 75,000,000 | 6.40% | 6.90% | 5.80% | 1.00% |
| 4 | 32,000,000 | 6.00% | 6.70% | 5.60% | 1.00% |
| 5 | 17,000,000 | 5.50% | 6.40% | 5.40% | 1.00% |
| 6 | 9,000,000 | 5.30% | 5.80% | 5.30% | 0.60% |
| 7 | 5,500,000 | 5.20% | 5.60% | 5.20% | — |
| 8 | 3,500,000 | 4.00% | 4.50% | 4.00% | — |

- N1: Dielac Gold, Dielac Grow, Optimum A2.
- N2: Optimum Gold, Dielac Grow Plus.
- N3: Yoko, Optimum Colos.
- Thưởng đến ngày 26: DS tính đến hết ngày 26 ≥ 100% DS ĐK → thưởng thêm.

### 10d. Bảng lưu trong code & override

- Bảng gốc: `VNM_SHOP_TRUNGBAY`, `VNM_SHOP_TICHLUY`, `VIP_SHOP_TRUNGBAY`, `VIP_SHOP_TICHLUY`, `SBPS_TICHLUY` trong `customer.js`.
- Override qua `vnm_ct_config` (localStorage) → `ctConfigLoad()`.
- `VNM_APP_CODES`: mapping mã CT app Vinamilk → program nội bộ.
- Hàm tính: `calcVNMShopReward()`, `calcVIPShopReward()`, `calcSBPSReward()`, `calcTotalReward()`.

---

## 11. KPI Dashboard (main.js)

- `KPI_DEFAULT_TARGETS`: mục tiêu mặc định theo tháng.
- `getKpiTargets(monthKey)`: merge default + custom từ config.
- 3 nhóm KPI: Chỉ tiêu tháng / Công việc trọng tâm / Thực thi KPIs.
- Rule codes (Green Farm, FM, Cat D): có thể override qua Settings.

---

## 12. Modal dùng chung

`km-modal` được tái sử dụng cho nhiều mục đích:
- Tạo/sửa CT KM
- Cài đặt Sync GitHub
- Cài đặt CT TB/TL
- Chi tiết đơn hàng
- Brand rules settings

---

## 13. Quy ước code

- **Không dùng framework** — thuần Vanilla JS ES5/ES6 (async/await, arrow fn OK).
- Mọi biến toàn cục dùng `var` (tương thích cross-script).
- Module export qua `window.functionName = functionName` ở cuối mỗi file.
- Render HTML = build string → `el.innerHTML = html` (không dùng template engine).
- `fmt(n)`: format số tiền VND (cart.js).
- `showToast(msg)`: thông báo ngắn thay thế alert (config.js).
- `escapeHtmlAttr(value)`: escape trước khi nhúng vào HTML attribute (cart.js).
- VAT = 1.5% (`VAT = 0.015` trong config.js).

---

## 14. URLs & data files

```javascript
REPO_RAW    = 'https://raw.githubusercontent.com/chabalua/VNM/main/'
PRODUCTS_URL         = REPO_RAW + 'products.json'
PROMOTIONS_URL       = REPO_RAW + 'promotions.json'
LOCAL_PROMOTIONS_URL = 'promotions.json'   // file local trước, fallback GitHub
CUSTOMERS_URL        = REPO_RAW + 'customers.json'
ROUTES_URL           = REPO_RAW + 'routes.json'
```

Mọi fetch đều cache-bust bằng `?_t=Date.now()` + `cache: 'no-store'` để tránh iOS Safari cache.

---

## 15. Nhật ký thay đổi

### 2026-04-21
- **data.js**: Fix background refresh không được ghi đè `vnm_km3` (kmProgs do user tạo) — chỉ refresh `vnm_sp`.

### 2026-04-15
- **cart.js** (`_calcBestBonus`): Rewrite — gộp tất cả stackable bonus rules thay vì pick best đơn lẻ; same-SP bonus tăng denominator, gift-other-SP trừ giá trị numerator.
- **cart.js** (`calcOrderKM`): Thêm guard `hasOrderPromoMinSKU` cho `order_money` — trước đây bỏ qua `minSKU`.
- **cart.js** (`getItemsFromCartState`, `calcKM` early-return): Thêm `bonusItems: []` để gift-other-product chảy ra UI và lịch sử đơn.
- **cart.js** (`_calcKM_orig`): Fix trailing space trong desc khi `bestBonus.unit` rỗng.
- **km.js** (`kmPreview`): Thêm early-return cho `bonus` + `bMa !== 'same'` — preview đúng khi tặng SP khác.
- **tests/**: Viết lại toàn bộ test suite — 3 files, 13 test cases, tất cả pass (`node tests/km-engine.test.js`).

### 2026-04-07
- **km.js**: Thêm ô tìm kiếm (`km-picker-search`) vào product picker — filter real-time theo tên/mã + filter nhóm.
- **km.js**: Fix dropdown "SP được tặng" (`bonus` + `order_bonus`) — chia `optgroup` đủ 4 nhóm A/B/C/D.
- **data.js**: `initData()` cache-first — boot tức thì nếu có cache, refresh ẩn ở background.

### 2026-04-01 (v5)
- **sync.js** (MỚI): GitHub Sync 2 chiều — Push/Pull 5 files (products, promotions, customers, routes, orders). Token PAT lưu localStorage, không hardcode.
- **cart.js**: Lịch sử đơn hàng (`vnm_orders_v2`), copy đơn → Zalo text, `submitOrder()` mới.

### 2026-03-20 (v4)
- **css/style.css**: Redesign hoàn toàn — Vinamilk brand colors (`#006B3F` + `#D4A843`), FAB 56px, modal backdrop blur.
- **data.js**: Cache-bust iOS Safari: `cache: 'no-store'` + `?_t=Date.now()`.
- **Bỏ**: Export/Import data chung; **Giữ**: Xuất/Nhập `products.json`.

### 2026-03-10 (v3)
- **customer.js** (MỚI): Module KH + KPI + CT Thưởng TB/TL.
- **customers.json**, **routes.json** (MỚI): Data files sync GitHub.
- **ui.js**: Brand sub-filter pills, KH selector, reward line per SP.
