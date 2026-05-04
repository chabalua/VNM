# Anti-patterns đã gặp — đừng tạo lại

> Lịch sử bug đã fix. Đọc khi sửa file tương ứng để khỏi tái tạo.

## cart.js

| Bug | Mô tả | Fixed |
|-----|-------|-----------|
| Pick best đơn lẻ thay vì aggregate stackable bonus | `_calcBestBonus` cũ pick CT lợi nhất, không cộng dồn | 2026-04-15 |
| `order_money` bỏ qua `minSKU` | Thiếu guard `hasOrderPromoMinSKU` | 2026-04-15 |
| Quên `bonusItems: []` trong early-return | Gift-other-product không chảy ra UI/lịch sử | 2026-04-15 |
| `tier_money` chia % cho 100 hai lần | Số CK bị chia đôi | (cart.js) |

## data.js

| Bug | Mô tả | Fixed |
|-----|-------|-----------|
| Background refresh ghi đè CT KM user vừa tạo | Mất CT KM chưa kịp push GitHub | 2026-04-21 |
| `syncFromGitHub()` không validate promotions | GitHub trả về object lỗi → `normalizePromotionList` → `[]` → xóa trắng CT KM | 2026-04-26 |

## customer.js

| Bug | Mô tả | Fixed |
|-----|-------|-----------|
| `cusReadDS()` thiếu `sbpsTrungBay` | Checkbox trưng bày SBPS không ảnh hưởng preview thưởng | 2026-04-26 |

## ui.js

| Bug | Mô tả | Fixed |
|-----|-------|-----------|
| `buildPriceTable` hiện giá KM/VAT khi chưa nhập SL | Luôn tính `calcKM(p,1,0)` → hiển thị giá giả, gây nhầm lẫn | 2026-05-04 |
| Quà tặng hiển thị số hộp thô, không quy đổi thùng | `🎁 +60 hộp` thay vì `Tặng 60 hộp (1 thùng + 12 hộp)` | 2026-05-04 |
| Ontop/order_bonus không hiện trong per-item preview | `buildOrderAwareKmDisplay` và `buildDraftCartState` tồn tại nhưng chưa được gọi trong `onQty` | 2026-05-04 |
| `renderOrder` tạo `#order-desktop-side` thứ hai bên trong `#order-list` | Conflict với CSS grid vốn trỏ vào element đã có sẵn trong HTML | 2026-05-04 |
| `calcKM` gọi không truyền `orderContext` ở 4/5 call site UI | Bypass `minSKU` → preview hiện KM "ảo" khi chưa đủ SKU | 2026-05-04 |

## main.js

| Bug | Mô tả | Fixed |
|-----|-------|-----------|
| `data-layout='desktop'` không bao giờ được set | `isDesktopLayout()` và `getLayoutMode()` undefined → desktop CSS grid không kích hoạt | 2026-05-04 |

## Khác

| Bug | Mô tả | Lưu ý |
|-----|-------|-----------|
| Upload file vào sai path `js/js/` | Phải xác nhận lại canonical path: `index.html` ở repo root, JS ở `js/` | — |
