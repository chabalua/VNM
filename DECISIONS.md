# DECISIONS.md — Nhật ký quyết định nghiệp vụ

> **AI đọc file này để hiểu WHY, không phải WHAT.** Code nói cái gì đang chạy, file này nói tại sao chạy như vậy. Khi bạn đề xuất thay đổi, đối chiếu với các quyết định ở đây — nếu mâu thuẫn, hỏi user trước khi sửa.

---

## Cách dùng file này

**Khi sửa code liên quan tính giá / CT KM / thưởng, AI BẮT BUỘC**:
1. Tìm decision liên quan trong file này (Ctrl+F theo từ khóa).
2. Nếu thay đổi mâu thuẫn quyết định cũ → **dừng lại và hỏi user** trước khi code.
3. Sau khi user xác nhận đổi quyết định → **cập nhật file này** trước, code sau.

**Format mỗi entry**: ID — Ngày — Tiêu đề — Quyết định — Lý do — Tác động.

---

## Phần 1: Quy tắc tính giá (giá / KM / VAT)

### D-001 — 2026-03-15 — VAT cộng riêng, không gộp vào giá KM
- **Quyết định**: Hiển thị `giá KM` và `+VAT 1.5%` ở 2 cột riêng biệt trong bảng giá. Tổng đơn cuối có cả 2 dòng "Tổng cộng" và "+VAT".
- **Lý do**: NVBH cần báo giá NET cho KH (vì KH so sánh với đối thủ), nhưng cuối ngày vẫn phải xuất đơn có VAT. Trộn lẫn 2 con số gây nhầm khi quote miệng.
- **Tác động**: Mọi UI hiển thị giá phải tách 2 cột. Khi tính `effectiveTotal` ở `onQty()`, dùng giá NET, VAT chỉ là display.

### D-002 — 2026-03-20 — Giá thùng = giá lon × slThung (không lưu riêng)
- **Quyết định**: `p.giaNYThung` luôn = `p.giaNYLon * p.slThung`. Khi user sửa giá lon → tự cập nhật giá thùng. Không cho sửa trực tiếp giá thùng.
- **Lý do**: Tránh lệch khi user chỉ đổi 1 trong 2 con. Nguồn truth là giá lon (đơn vị nhỏ nhất).
- **Tác động**: `saveAdmPrice()` và `spSaveForm()` luôn tính lại `giaNYThung` từ `giaNYLon`.

### D-003 — 2026-04-15 — Bonus cùng SP và bonus SP khác xử lý KHÁC NHAU trong tính giá
- **Quyết định**:
  - Bonus **cùng SP** (`bMa === 'same'`): cộng số lượng tặng vào **mẫu số** khi tính `hopKM`. Giá hiển thị thấp hơn nhưng tổng tiền không đổi.
  - Bonus **SP khác** (`bMa !== 'same'`): trừ giá trị SP tặng khỏi **tử số**. Giá hiển thị thấp hơn vì coi như được giảm giá tiền.
- **Lý do**: Đây là cách field sales nói chuyện với KH thực tế. "Mua 48 tặng 8 cùng loại" → KH nghĩ "mỗi lon rẻ hơn". "Mua 48 tặng 4 SP khác" → KH nghĩ "được giảm giá bằng giá trị 4 lon SP kia".
- **Tác động**: `_calcBestBonus` trong cart.js phải tách 2 nhánh này. **Không gộp logic làm một.**
- **Bug đã từng xảy ra**: Trước 2026-04-15 đã từng pick best bonus đơn lẻ → khi có 2 CT stackable cùng áp, chỉ tính 1 → mất tiền KM của KH.

### D-004 — 2026-04-15 — Stackable cộng dồn TẤT CẢ, non-stackable chỉ pick lợi nhất
- **Quyết định**: Trong cùng 1 SP, nếu có nhiều CT KM phù hợp:
  - Tất cả CT có `stackable: true` → áp đồng thời, cộng dồn discount.
  - Trong các CT `stackable: false` → chỉ chọn 1 CT cho `hopKM` thấp nhất.
  - Stackable group + non-stackable winner → cộng cuối cùng.
- **Lý do**: Quy tắc Vinamilk thực tế. CT cấp công ty thường stackable, CT khuyến mãi đặc biệt thường không stackable.
- **Tác động**: `calcKM()` phải tách 2 nhóm trước khi gọi `_calcKM_orig`.

### D-005 — 2026-04-15 — `minSKU` áp cho CẢ per-item lẫn order-level
- **Quyết định**: Trường `minSKU` của 1 CT KM yêu cầu trong giỏ phải có ít nhất N mã SP khác nhau (thuộc spMas của CT đó) thì CT mới active.
- **Lý do**: Vinamilk có CT kiểu "Ontop FM vị: 96+3 (kèm 3 SKU)" — phải có đủ 3 mã FM khác nhau mới được tặng.
- **Tác động**: Cả `calcKM` (per-item) và `calcOrderKM` (order_money + order_bonus) đều phải check `hasOrderPromoMinSKU`.
- **Bug đã từng xảy ra**: `calcOrderKM` quên check minSKU → CT order_money active sai.

### D-006 — 2026-04-15 — Order-level bonus phân bổ vào hopKM display theo tỷ lệ
- **Quyết định**: Khi đơn có `order_money` discount hoặc `order_bonus` tặng SP khác, phần discount/giá trị quà được phân bổ ngược về từng SP theo tỷ lệ giá trị → hiển thị `hopKM` của từng SP đã bao gồm cả order-level KM.
- **Lý do**: NVBH cần biết "1 thùng X giá thực bao nhiêu sau tất cả KM" để báo cho KH. Nếu chỉ hiện ở tổng đơn, NVBH phải tính nhẩm.
- **Tác động**: `buildOrderAwareKmDisplay` trong ui.js. Đây là logic phức tạp, sửa cần test kỹ.
- **Lưu ý**: chỉ hiển thị, **không thay đổi** số trong `cart` hay `items[i].afterKM`.

### D-007 — 2026-03-25 — Group B Sữa đặc dùng giá KM preset, KHÔNG tính từ công thức
- **Quyết định**: Sữa đặc nhóm B (NSPN, Ông Thọ, Tài Lộc) khi áp CT bonus, dùng giá KM Vinamilk công bố sẵn trong file thay vì tính `(base - disc) / qty`.
- **Lý do**: Vinamilk làm tròn số khác công thức của mình ~5-50đ/lon. Nếu tính theo công thức, NVBH báo giá lệch với hệ thống Vinamilk → KH thắc mắc.
- **Tác động**: Hiện đang xử lý đặc biệt cho nhóm B trong `_calcKM_orig`. **Không refactor làm một** với nhóm khác.
- **TODO**: Hiện chưa có logic này hoàn chỉnh — đang dùng công thức chung cho cả nhóm B. Cần xem lại nếu KH phàn nàn lệch giá.

### D-008 — 2026-04-15 — `tier_money.value` lưu theo NGÌN ĐỒNG (K), không phải đồng
- **Quyết định**: Khi user nhập "≥600K → CK 12%", lưu `value: 600`. Hàm `parsePromoMoneyValue(value)` tự nhân 1000 nếu value < 10000.
- **Lý do**: User nhập số nhỏ dễ hơn. Vinamilk cũng dùng K trong văn bản CT.
- **Tác động**: Mọi nơi đọc `tier.value` cho money phải đi qua `parsePromoMoneyValue`. Đừng so sánh trực tiếp `tier.value >= base`.
- **Bug đã từng xảy ra**: Bug `tier_money` chia 100 hai lần là vì confusion giữa K và đồng.

---

## Phần 2: CT Thưởng KH (VNM/VIP/SBPS)

### D-101 — 2026-03-10 — Bảng mức CT là CONFIG, không phải hardcode
- **Quyết định**: Bảng `VNM_SHOP_TRUNGBAY`, `VNM_SHOP_TICHLUY`, `VIP_SHOP_*`, `SBPS_*` lưu mặc định trong code, nhưng user có thể override qua UI (lưu vào `vnm_ct_config`). Khi load app, `ctConfigLoad()` merge override lên default.
- **Lý do**: Vinamilk thay đổi mức thưởng vài tháng/lần. Không thể bắt user đợi update code.
- **Tác động**: Mọi thay đổi mặc định phải sửa ở 2 chỗ: bảng trong customer.js + đảm bảo `ctConfigLoad` còn hoạt động sau khi sửa schema.

### D-102 — 2026-03-12 — Đăng ký giữa tháng tính thưởng giảm theo ngày
- **Quyết định**:
  - VNM Shop: ngày ĐK ≤ 15 → 100%; 16–19 → 50%; > 19 → 0%.
  - VIP Shop: ngày ĐK ≤ 15 → 100%; 16–20 → 50%; > 20 → 0%.
  - SBPS Trưng bày: cùng quy tắc VIP Shop.
- **Lý do**: Quy tắc chính thức từ Vinamilk Miền Trung.
- **Tác động**: 3 hàm `calcXxxReward` đều có `heSo` based on `cfg.ngayDangKy`. **Không xóa logic này.**
- **Edge case**: Nếu `ngayDangKy = 0` (không nhập) → mặc định coi như đầu tháng (heSo = 1). Logic này đang đúng.

### D-103 — 2026-03-15 — Giai đoạn (GĐ) chỉ áp cho VNM Shop, có giới hạn DS max
- **Quyết định**: Thưởng GĐ1/GĐ2/GĐ3 của VNM Shop:
  - GĐ1 max = 40% dsMax của mức TL (Mức 1 không có dsMax → max = 40% DS thực tế cuối tháng).
  - GĐ1+GĐ2 max = 70% dsMax.
  - Phải đạt 100% DS ĐK cuối tháng mới được tính GĐ.
  - Điều kiện vào GĐ: GĐ1 ≥ 25% DS ĐK, GĐ1+2 ≥ 55%, GĐ1+2+3 ≥ 85%.
- **Lý do**: Tránh shop "đẩy hàng cuối tháng" để hưởng thưởng cao bất thường.
- **Tác động**: Logic phức tạp trong `calcVNMShopReward`. **Có TODO**: hiện chưa có test, cần verify với 2-3 KH thật mỗi khi sửa.

### D-104 — 2026-03-15 — STTT 1L KHÔNG tính DS giai đoạn
- **Quyết định**: SP có "1L" trong tên KHÔNG được cộng vào `dsGD1/2/3`, nhưng VẪN tính vào `dsNhomC` tổng tháng.
- **Lý do**: Quy tắc Vinamilk: SP 1L có biên lợi nhuận khác, không nằm trong KPI giai đoạn.
- **Tác động**: `isVNMGiaiDoanProduct(product)` trong customer.js check `nhom === 'C'` AND name không chứa "1l".
- **TODO**: Hiện check qua tên SP. Nếu Vinamilk ra SP 1L mới với mã code khác, có thể bỏ sót. Cân nhắc thêm whitelist mã.

### D-105 — 2026-03-15 — VIP Shop: SP loại trừ là cứng, không phụ thuộc CT
- **Quyết định**: Các SP sau KHÔNG bao giờ tính vào DS VIP Shop (cả Nhóm DE lẫn N1/N2):
  - SCA học đường 60g, Bơ lạt 20kg, SCA Happy Star 100g, Nước rau củ Susu 180ml, Thạch phô mai que Susu 100g.
- **Lý do**: Vinamilk loại trừ.
- **Tác động**: `classifyVIPProduct(product)` trả về `'excluded'` cho các SP này. Hàm `cusAggregateOrdersMonth` skip các SP excluded.

### D-106 — 2026-03-20 — DS tính vào CT thưởng = giá AFTER KM, KHÔNG phải giá gốc
- **Quyết định**: Khi tính `dsNhomC`, `dsNhomDE`, `dsSBPS` từ orders, dùng `item.afterKM` (đã trừ per-item KM) trừ tiếp phần `orderDisc` phân bổ theo tỷ lệ.
- **Lý do**: Vinamilk tính DS thực thu, không phải giá niêm yết.
- **Tác động**: `cusAggregateOrdersMonth` trong customer.js. Logic phân bổ orderDisc theo tỷ lệ giá trị item (dòng cuối cùng nhận phần dư để tránh sai số làm tròn).

### D-107 — 2026-04-05 — DS auto từ orders, manual override bằng field riêng
- **Quyết định**: Mỗi metric DS có 2 nguồn:
  - Auto: `cusAggregateOrdersMonth` tính từ orders.
  - Manual: user nhập tay vào form, lưu vào field `manualDsXxx` (riêng với field auto).
  - `cusGetMonthData` ưu tiên manual nếu có giá trị, fallback auto.
- **Lý do**: Đôi khi NVBH cần fix lệch (ví dụ Vinamilk tính khác do trả hàng) mà không muốn mất đơn gốc.
- **Tác động**: `CUS_MONTHLY_MANUAL_FIELDS` map field manual ↔ field auto. Khi UI hiển thị placeholder cho input, hiện luôn giá trị auto để user biết.

---

## Phần 3: UI / UX

### D-201 — 2026-04-21 — Card SP mặc định thu gọn (không expand)
- **Quyết định**: Khi load page Đặt hàng, tất cả card SP ở trạng thái thu gọn. User tap header để mở. State `_cardExpanded[ma]` lưu trong memory (không persist).
- **Lý do**: 190 SP × card lớn → scroll mệt trên iPhone. NVBH thường biết SP cần tìm, dùng search trước.
- **Tác động**: `renderOrder` set `isExpanded = _cardExpanded[p.ma] !== undefined ? ... : false`. Đã thử default `inCart ? expanded : collapsed` nhưng user phản hồi rườm rà.

### D-202 — 2026-04-15 — Customer selector ở Order tab dùng dropdown native
- **Quyết định**: Dùng `<select>` HTML thật cho dropdown chọn KH, không tự build modal/popup.
- **Lý do**: iOS native picker hiển thị fullscreen, scroll mượt, search bằng gõ phím — UX tốt hơn custom modal mà code ít hơn.
- **Tác động**: `renderCustomerSelector` build `<select>` với `<optgroup>` theo tuyến.

### D-203 — 2026-04-21 — Floating cart bar bị bỏ, dùng badge ở tab `Đơn hàng`
- **Quyết định**: KHÔNG có floating cart bar nổi ở tab Order. Số lượng SP trong giỏ hiện ở badge của tab `Đơn hàng` (icon ☰).
- **Lý do**: Floating bar che mất 1-2 dòng cuối → user phải scroll thừa. Badge ở tab nav đủ thông tin.
- **Tác động**: Không tự thêm floating bar lại, kể cả khi thấy "có vẻ tiện hơn".

---

## Phần 4: Sync / Data

### D-301 — 2026-04-21 — Background refresh CHỈ cập nhật `vnm_sp`, KHÔNG đụng vào `vnm_km3`
- **Quyết định**: `initData()` chạy background refresh khi đã có cache → chỉ gọi `loadProducts()`, không gọi `loadPromotions()` (trừ trường hợp cache KM trống).
- **Lý do**: CT KM là dữ liệu user tạo, có thể chưa kịp push GitHub. Nếu auto pull đè, mất CT vừa tạo.
- **Tác động**: Đừng "tối ưu" thành load song song cả 2.
- **Bug đã từng xảy ra**: User tạo CT, chưa push, mở app máy khác → background pull đè → mất CT.

### D-302 — 2026-04-01 — Orders dùng soft delete (`_deleted: true`)
- **Quyết định**: Xóa đơn KHÔNG remove khỏi mảng, chỉ set `_deleted: true`. Hiển thị/sync filter ra. `getOrders()` trả về list không deleted, `getOrdersRaw()` trả về tất cả (dùng cho merge sync).
- **Lý do**: Sync 2 chiều cần biết "đơn này đã xóa ở máy A" để xóa cả ở máy B. Hard delete làm sync không phân biệt được "chưa có" với "đã xóa".
- **Tác động**: `softDeleteOrder` và `mergeOrders` trong sync.js.

---

## Phần 5: TODO / Việc đang treo

Các quyết định CHƯA chốt, cần discuss với user:

- [ ] **CT thưởng SBPS T7-12/2026** chưa có file PDF, đang dùng số T3-6.
- [ ] **CT Trưng bày VIP Shop tủ 600L+** quy định bắt buộc TB1, hiện chưa enforce.
- [ ] **Thưởng ICY +1 thùng/20 thùng tích lũy** trong VIP Shop chưa implement.
- [ ] **Validation khi user nhập DS manual lệch quá nhiều với DS auto** — cảnh báo?
- [ ] **Logic "đến ngày 26"** của SBPS hiện check `orderDay <= 26`. Có nên cộng cả đơn ngày 26 không? (hiện đang cộng).

---

## Index theo từ khóa (giúp AI search nhanh)

- **bonus, KM, CT KM** → D-003, D-004, D-005, D-006
- **VAT, giá** → D-001, D-002
- **stackable, non-stackable** → D-004
- **minSKU** → D-005
- **giai đoạn, GĐ** → D-103
- **VNM Shop** → D-101, D-102, D-103, D-104
- **VIP Shop** → D-101, D-102, D-105
- **SBPS** → D-101, D-102, D-104
- **DS, doanh số tháng** → D-106, D-107
- **trưng bày, ngày đăng ký** → D-102
- **giá hiển thị, hopKM** → D-006, D-007
- **tier money, K** → D-008
- **STTT 1L** → D-104
- **card, expand** → D-201
- **sync, ghi đè** → D-301, D-302
- **soft delete** → D-302
