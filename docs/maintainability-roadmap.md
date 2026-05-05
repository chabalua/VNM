# Maintainability Roadmap

Cap nhat: 2026-05-05

## Da xong
- Pricing snapshot trong Dat hang da duoc thong nhat giua bang gia, quick strip va preview.
- Customer module da tach thanh 3 file: `js/customer-data.js`, `js/customer-reward.js`, `js/customer-ui.js`.
- KM engine da co them 10 regression tests dung du lieu that trong `tests/km-engine.test.shared.js`.
- `js/ui.js` da tach tiep thanh cac module order pricing, order interactions, order render va admin products UI.
- Da them regression test cho `buildOrderAwareKmDisplay` va `buildCartDisplaySnapshot` de khoa logic phan bo ontop/gift value trong UI pricing.
- Da them them case cho `order_bonus` cung ma va snapshot co dong thoi order discount + gift value.
- Flow chon KH trong `js/cart.js` da bo doc/ghi truc tiep `_selectedCustomerMa`, chi di qua getter/setter chung tren `appState.orderUI`.
- Da them them live snapshot regression cho case SBPS 7+1, order_bonus tặng ma khac va order_money Green Farm.
- Da them `sanitizeProductList`, `sanitizePromotionList`, `sanitizeCustomerList`, `sanitizeRouteList` vao cac luong load/import/restore/sync.
- Da them canh bao duplicate KM va missing product refs ngay trong tab KM de dev khong phai scan JSON thu cong.
- Da bo sung suite `tests/data-validation.test.js`, `tests/sync-guards.test.js` va runner `tests/run-all.js`.
- Da co doc audit rieng cho loi du lieu CTKM/master data: `docs/promotion-data-audit.md`.

## Nguyen tac lam tiep
- Moi dot refactor chi lam 1 lat cat logic.
- Moi lat cat phai co test hoac checklist verify tay ro rang.
- Khong sua dong thoi engine, UI va sync neu khong bat buoc.
- Neu co them rule moi, uu tien them regression test truoc hoac cung luc.

## Thu tu uu tien tiep theo

### Pha 1: Gom state trung tam
Muc tieu: giam loi vat do global state bi sua tung noi.

Files chinh:
- `js/main.js`
- `js/ui.js`
- `js/cart.js`
- `js/customer-ui.js`

Viec can lam:
- Tao `window.appState` gom `cart`, `selectedCustomerMa`, `filters`, `orderDraft`, `customerUI`.
- Code moi doc/ghi qua `appState` thay vi tao them bien global roi rac.
- Di chuyen dan cac bien `_xxx` sang `appState` theo tung man hinh.

Xong khi:
- Khong them bien global moi ngoai `appState`.
- Tab Dat hang va Khach hang van render binh thuong.

Validate:
- `node tests/km-engine.test.js`
- `node tests/reward-engine.test.js`
- Verify tay: home, dat hang, khach hang, don hang.

### Pha 2: Data validation khi load
Muc tieu: chan loi logic am do JSON ban hoac thieu field.

Files chinh:
- `js/data.js`
- `js/customer-data.js`
- `js/km.js`

Viec can lam:
- Them validator nhe cho `products.json`, `promotions.json`, `customers.json`, `routes.json`.
- Neu ban ghi loi: bo qua record loi, log canh bao, khong xoa trang toan bo data hop le.
- Chuan hoa field quan trong: `ma`, `giaNYLon`, `slThung`, `type`, `tiers`, `spMas`, `active`.

Xong khi:
- App khong vo trang khi data co 1 record loi.
- Console log noi ro record nao bi bo qua.

Validate:
- Pull data binh thuong.
- Thu bo sung 1 record promo loi trong file local va xac nhan app van len.

Trang thai:
- Da xong cho products/promotions/customers/routes o cac luong load, import, restore backup va sync merge.
- Phan con lai la quyet dinh nghiep vu tren cac CTKM active dang tro ma SP thieu, khong con la bug ky thuat parser/sanitizer.

### Pha 2.1: Master-data audit va canh bao nghiep vu
Muc tieu: tach ro bug ky thuat voi loi du lieu van hanh.

Files chinh:
- `js/data.js`
- `js/km.js`
- `docs/promotion-data-audit.md`

Viec can lam:
- Ghi lai danh sach `CTKM mu gia` can bo sung ma qua tang.
- Tach nhom trigger refs thieu de bo sung `products.json` theo dot.
- Khi can, viet them script audit nho thay vi probe tay trong terminal.

Xong khi:
- So luong canh bao missing refs giam dan va co changelog ro tung dot bo sung.

Validate:
- `node tests/data-validation.test.js`
- Verify tab KM hien banner dung voi du lieu dang co.

### Pha 3: Tach UI Dat hang theo trach nhiem
Muc tieu: giam do dai va do mong manh cua `js/ui.js`.

Files dich:
- `js/order-render.js`
- `js/order-pricing-ui.js`
- `js/admin-products-ui.js`

Viec can lam:
- Tach ham render card, preview, quick strip, price table sang file rieng.
- Giu `js/ui.js` chi con dieu phoi va export public handler.
- Moi duong hien thi gia phai dung chung snapshot helper.

Xong khi:
- `js/ui.js` giam xuong muc de doc duoc.
- Khong con duong render gia nao tu tinh rieng ngoai snapshot helper.

Validate:
- `node tests/km-engine.test.js`
- Verify tay 5 case: khong KM, same-product bonus, gift-other, order_money, order_bonus.

Trang thai:
- Da xong phan tach `js/order-pricing-ui.js`, `js/order-interactions-ui.js`, `js/order-render-ui.js`, `js/admin-products-ui.js`.
- `js/ui.js` hien con vai tro dieu phoi state/filter/render chinh.

### Pha 4: Regression tests cho UI pricing
Muc tieu: khoa cac loi lech so giua engine va UI.

Files chinh:
- `tests/km-engine.test.shared.js`
- Them mot file test moi neu can

Viec can lam:
- Them test cho `buildOrderAwareKmDisplay`.
- Them test cho phan bo `orderDiscAllocated` va `orderGiftValueAllocated`.
- Ghi lai 5-10 cart state that de test snapshot gia cuoi cung.

Xong khi:
- Moi bug pricing da gap deu co case test hoi quy.

Validate:
- `node tests/km-engine.test.js`

Trang thai:
- Da co test cho phan bo `orderDiscAllocated`, `orderGiftValueAllocated` va subtotal snapshot trong `tests/km-engine.test.shared.js`.
- Da co them test cho `orderBonusQty` khi qua cung ma va cart snapshot co ca discount don hang lan gift value ontop.
- Da co them cart snapshot test dung du lieu that de khoa output `gross`, `subtotal` va gift allocation tren card/preview.
- Phan con lai nen uu tien la bo sung them 5-10 cart state that cho snapshot gia cuoi cung neu tiep tuc sua UI pricing.

### Pha 5: Hardening sync
Muc tieu: tranh mat data user tao va tranh overwrite sai.

Files chinh:
- `js/sync.js`
- `js/data.js`
- `docs/sync.md`

Viec can lam:
- Viet them guard cho file user-generated, nhat la promotions va customers.
- Ghi ro quy tac merge/pull/push theo tung file.
- Them checklist khi sua logic sync.

Xong khi:
- Khong co pull background nao ghi de CTKM local vua tao.
- Co log ro file nao bi skip, file nao bi merge.

Validate:
- Verify tay: tao KM moi, refresh, pull, push.

## Checklist moi khi sua code
- Sua gia/KM: chay `node tests/km-engine.test.js`.
- Sua thuong KH: chay `node tests/reward-engine.test.js`.
- Sua UI gia: verify tay tren tab Dat hang voi it nhat 3 case co va khong co ontop.
- Sua customer: verify tab Khach hang mobile va desktop.
- Sua sync: verify khong overwrite `vnm_km3` va `customers.json`.

## Thu tu nen lam trong turn tiep theo
1. Giam tiep so luong `missing trigger refs` trong `docs/promotion-data-audit.md` bang cach bo sung lai master products.
2. Hoan tat centralize state cho cac bien global chua vao `appState`.
3. Bo sung smoke checklist cho admin products UI path neu tiep tuc sua tab Cài đặt.
