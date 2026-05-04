# KM Engine — chi tiết

> Đọc trước khi sửa bất cứ thứ gì liên quan tới giá / KM / chiết khấu.

## Kiến trúc 2 cấp

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

## 6 loại CT KM

| `type` | Mô tả | Trường chính |
|--------|-------|-------------|
| `bonus` | Mua X → Tặng Y (cùng SP hoặc SP khác) | `bX, bY, bUnit, bMa, bMax` |
| `fixed` | Chiết khấu % cố định trên SP | `ck` |
| `tier_qty` | CK theo số lượng | `tiers[{mn, ck}], tUnit` |
| `tier_money` | CK theo tổng tiền SP | `tiers[{type, value, ck}]` |
| `order_money` | CK % tổng đơn | `tiers[{type, value, ck}]` |
| `order_bonus` | Tặng SP khi đạt mức đơn | `tiers[{value, maxValue, bonusQty}]`, `bonusMa, cascade, repeat, maxSets` |

Trường chung mọi CT: `name, active, stackable, nhoms, spMas, minSKU`.

## Hàm core (cart.js)

- `calcKM(p, qT, qL, orderContext)` — tính KM 1 SP. **Phải truyền `orderContext`** để check `minSKU` (nếu không, minSKU bị bypass).
- `_calcKM_orig(p, qT, qL, rules)` — tính từ rules array đã build sẵn.
- `_calcBestBonus(rules, p, qT, totalLon, base, ckDisc)` — **aggregate** tất cả stackable bonus.
- `calcOrderKM(items)` — áp order-level KM.
- `kmBuildRules(prog)` — chuyển prog → kmRules[].
- `getItemsFromCartState(cartState)` — build items từ cart, gọi `calcKM` cho từng SP (đã tự build orderContext).
- `buildOrderContextFromCart(extraMa)` — helper build orderContext từ `cart` global. `extraMa` để bao gồm SP đang preview chưa add cart.

## UI render path

```
onQty(ma)                                  ← user nhập qty
  ├─ calcKM(p, qT, qL, ctx)                ← preview "Trừ KM", VAT, Tạm tính
  ├─ buildDraftCartState + getItemsFromCartState + calcOrderKM
  └─ buildOrderAwareKmDisplay(p, km, ...)  ← đổi hopKM/thungKM trong bảng giá
       └─ buildPriceTable(p, kmForTable)

renderOrder()                              ← tab Đặt hàng list view
  └─ mỗi card: calcKM(p, qT, qL, ctx)      ← quick-strip & expanded preview

renderDon()                                ← tab Đơn hàng
  └─ getItemsFromCartState(cart) + calcOrderKM(items)
```

⚠️ **Mọi call site `calcKM` ngoài cart.js phải truyền `buildOrderContextFromCart(ma)`** — nếu không, minSKU bị bypass và preview hiện KM "ảo".

## Test & Debug

```bash
node tests/km-engine.test.js
```
13 test cases: 7 per-item + 4 order-level + 2 cart integration.

**Test KHÔNG cover:**
- UI render (`buildPriceTable`, `buildOrderAwareKmDisplay`, `onQty`, `renderOrder`)
- Real `promotions.json` (336 CT) + real `products.json` (190 SP)

**Debug khi giá hiển thị sai:** mở DevTools console (Safari trên iOS hoặc Chrome) chạy:
```js
debugCalcPrice('01SX05', 2, 0)   // mã SP, qT (thùng), qL (lẻ)
```
Sẽ in toàn bộ: SP info, applicable promos, skipped (do minSKU), per-SP KM, order-level KM cho cả giỏ. Copy log gửi cho AI để verify thay vì đoán.
