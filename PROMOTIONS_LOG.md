# PROMOTIONS_LOG.md — Nhật ký CT KM theo tháng

> **Mục đích**: Lưu lịch sử CT KM Vinamilk áp dụng theo từng tháng. Khi user nói "CT tháng X", AI tra ở đây thay vì hỏi lại.
>
> **Khác với `promotions.json`**: file JSON là CT đang active. File này là lịch sử + ghi chú nguồn gốc + lý do.

---

## Cách dùng file này

**Khi user nói "CT NSPN tháng này thay đổi"**:
1. Tìm section tháng tương ứng bên dưới.
2. Đọc xem CT cũ là gì, CT mới khác chỗ nào.
3. Nếu chưa có thông tin → hỏi user một lần duy nhất kèm câu mẫu: "Vui lòng cho tôi: tên CT, X+Y, đơn vị, SP áp dụng, SP tặng, ngày bắt đầu — để tôi update cả file `promotions.json` và `PROMOTIONS_LOG.md`."

**Khi user xác nhận CT mới**:
1. **Trước tiên** thêm entry vào file này (`## Tháng X/YYYY → ###`).
2. **Sau đó** mới sửa `promotions.json`.
3. Nếu có CT cũ bị thay thế: đánh dấu `[ENDED 2026-XX-XX]` trong tháng cũ thay vì xóa.

---

## Nguồn dữ liệu (đường dẫn file PDF gốc)

User thường nhận CT qua các nguồn:
- **PDF tháng**: file `CTKM_Tháng-X.pdf` từ Vinamilk Miền Trung — mỗi tháng 1 file, tổng hợp tất cả CT.
- **Văn bản KD đột xuất**: email/Zalo từ ASM, mã CT bắt đầu bằng `MR04...`.
- **Ontop công ty**: CT bổ sung của Vinamilk HQ, thường stackable với CT vùng.

---

## T4/2026 (đang chạy)

### Sữa đặc nhóm B

#### NSPN Xanh Lá 380g HT (`01SX05`)
- **CT 1**: 14h + 1b Fino (`04FT32`). non-stackable.
- **CT 2**: 28h + 1h cùng loại. non-stackable.
- **Logic**: Khi user mua ≥ 28h → CT 2 cho hopKM thấp hơn. Khi mua 14-27h → CT 1.

#### NSPN Xanh Lá 380g HG (`01SX07`)
- **CT 1**: 8h + 1b Fino. non-stackable.
- **CT 2**: 18h + 1h cùng loại. non-stackable.

#### Ông Thọ Xanh 380g HT (`01TD03`, `01TT02`)
- **CT 1**: 12h + 1b Fino. non-stackable.
- **CT 2**: 28h + 1h cùng loại. non-stackable.

#### NSPN Xanh Biển 380g (`01SB02`)
- **CT 1**: 7h + 1b Fino. non-stackable.
- **CT 2**: 15h + 1h cùng loại. non-stackable.

#### Ông Thọ Đỏ 380g (`01TD13`)
- **CT 1**: 12h + 2b Fino. non-stackable.
- **CT 2**: 18h + 1h cùng loại. non-stackable.

#### Ông Thọ Xanh Lá 380g (`01TX03`)
- **CT 1**: 12h + 2b Fino. non-stackable.
- **CT 2**: 15h + 1h cùng loại. non-stackable.

#### Tuýp 165g (Ông Thọ Đỏ/Dâu/Sô) — `01TD60`, `01TA60`, `01TC60`
- **CT**: 8 + 1 cùng loại. **stackable**.

#### Tuýp Café/9 Hạt — `01TH60`
- **CT**: 6 + 1 cùng loại. **stackable**.

#### Vỉ 40g Ông Thọ — `01VD41`
- **CT**: 6 vỉ + 1h ĐB 110ml (`04ED33`). **stackable**.

#### Tài Lộc 380g (`01TL00`)
- **CT 1**: 11h + 1b Fino. non-stackable.
- **CT 2**: 20h + 1h cùng loại. non-stackable.

#### Lon lớn 1284g/1kg (`01TD11`, `01SX11`, `01TD12`, `01SB10`, `01TL10`)
- **Pattern chung**: 8-10h + 1h NSPN 380g (SP nhỏ làm gift), HOẶC 18-23h + 1h cùng loại. non-stackable.

### Sữa nước nhóm C

#### Fino vị (220ml) — `04FA31`, `04FC32`, `04FD32`, `04FT32`, `04FI32`, `04FH20`
- **CT 1**: 16 + 1 cùng loại. **stackable**.
- **CT Ontop**: 96b + 2b Fino bất kỳ. **stackable**. Áp cho `04FA31`, `04FC32`, `04FH20`.

#### Fino A2 220ml — `04FH20`
- **CT bonus riêng**: 16 + 1 cùng loại. stackable.
- **CT KD**: Fino ID/KD A2 48b + 2b Fino A2 (`04FH20`) — áp cho `04FT32`, `04FI32`. stackable.

#### STTT Fino 220ml (`04FT2H`, `04FD2H`)
- **CT 1**: 12b + 1b. non-stackable.
- **CT 2**: 3 thùng + 15 bịch (= 144 + 15, max 1 lần). non-stackable.

#### Đàn Bò 110ml — `04EA33`, `04EC33`, `04ED33`, `04EI33`, `04ET33`
- **CT**: 12 + 1 cùng loại. **stackable**.

#### Đàn Bò 180ml — `04ED13`, `04ET13`, `04EA13`, `04EB11`, `04EC13`, `04EM10`, `04EN10`, `04EC60`, `04EU11`, `04EI18`
- **CT 1**: 12 + 1 cùng loại. **stackable**.
- **CT Ontop FM vị** (chỉ áp `04EB11`, `04EM10`, `04EN10`, `04EC60`):
  - 48 + 1 (kèm 2 SKU). non-stackable.
  - 96 + 3 (kèm 3 SKU). non-stackable.

#### Đàn Bò 1L — `04ED04`, `04EI04`, `04ET04`, `04ET22`
- **CT 1**: 12 + 1 cùng loại. **stackable**.
- **CT 2**: CK 2%. **stackable**.

#### ADM 110ml — `04CD35`, `04CA33`, `04CC34`, `04CH30`, `04CI31`
- **3 CT non-stackable**: 12+1, 48+5, 192+24. App auto pick CT lợi nhất.

#### ADM 180ml — `04CD15`, `04CH10`, `04CI11`
- **3 CT non-stackable**: 12+1, 48+5, 192+24.

#### Green Farm 110/180ml — `04GI34`, `04GI14`
- **CT 1**: 12 + 1. **stackable**.
- **CT 2 (tier_money)**: ≥ 1500K → CK 1%, ≥ 5000K → CK 2%. stackable.

#### Green Farm A2 — `04AE32` (110ml), `04AE12` (180ml)
- **CT**: 12 + 1, **tặng GF thường** (`04GI34` cho 110, `04GI14` cho 180). stackable.

#### Green Farm Tổ Yến 180ml — `04GB18`
- **CT**: 12 + 1, **tặng GF 180ml** (`04GI14`). stackable.

#### Green Farm 1L — `04GT05`
- **CT**: 6h + **4h** GF 110ml. stackable.

#### Green Farm Organic 180ml — `04GO11`
- **CT**: 12 + 1, tặng GF 180ml. stackable.

#### SDD Flex 180ml/1L — `04LL13`
- **CT order_money**: đơn từ 150K → CK 8%. stackable.

#### Sữa hạt 9 loại 180ml — `05AN25`, `05AN31`
- **CT**: 24 + 2. **stackable**.

#### Cao đạm 180ml — `05AD11`, `05AD31`
- **CT**: 12 + 1. stackable.

#### SĐN/STV gom chung tặng hàng 10% — `05AV33`, `05FV44`, `05MD10`, `05AV24`, `05DH14`, `05DD14`, `05DY10`
- **CT fixed**: CK 10%. stackable.

#### Order bonus tổng hợp SN — Cascade
- **CT "Ontop SN: 2M+2h/5M+8h Cascade"**:
  - Tier 5000K → 8 hộp `04EI33`.
  - Tier 2000K → 2 hộp `04EI33`.
  - Cascade mode: tier lớn áp trước, dư áp tier nhỏ.
  - VD: đơn 9M = 1×5M (8h) + 2×2M (4h) = 12 hộp.
- Áp cho hầu hết SP nhóm C + SCU.

#### Order bonus STV
- **CT "STV: đơn 250K tặng 2h / 400K tặng 4h 9 hạt 180ml"**:
  - 250K → 2 hộp `05AN25`.
  - 400K → 4 hộp `05AN25`.
  - Range tier (1 suất duy nhất, không lặp).
  - Áp các SP STV/SĐN/Cao đạm.

### Sữa chua nhóm D

#### SCU Susu/Hero/Yomilk 80/110ml — `06UQ40`, `06UA40`, `06UC40`, `06UN40`, `08HA31`, `06SA73`, `06SC73`, `06UA32`, `06UC32`, `06UN32`, `06UQ32`
- **CT 1**: 22 + 2. non-stackable.
- **CT 2**: 129 + 15. non-stackable.
- **CT order_money**: đơn từ 2M → CK 2%. stackable. Áp cả lên 170/180ml.

#### SCU Susu/Hero 170/180ml — `06UK10`, `08HA11`, `06VA23`, `06VC23`, `06VQ23`
- **CT 1**: 11 + 1. non-stackable.
- **CT 2**: 86 + 10. non-stackable.

#### SCA Trắng/Nha đam — `07KD12`, `07TR33`
- **CT**: 12 + 1. stackable.

#### Probi 65ml — `07UR13`, `07UD11`, `07UG11`, `07UQ11`, `07UA11`, `07UC11`
- **CT 1**: 23 + 2. non-stackable.
- **CT 2**: 50 + 5. non-stackable.

#### Probi 130ml CĐ/Đa vị — `07UQ31`, `07UM31`, `07UR31`, `07UL31`, `07UD30`
- **CT**: 11 + 1. stackable.

#### Probi 400ml/700ml — `07UR41`, `07UR71`, `07UI40`, `07UI70`
- **CT**: CK 15%. stackable.

### Sữa bột nhóm A

#### BDD Ridielac (HG/HT) — `03AA13`, `03CA54`, `03CM06`, `03CA92`, `03AB11`, `03AY73`, `03CA15`, `03CA24`, `03CA34`, `03CA44`, `03CA75`, `03CA84`, `03CM20`, `03CY73`
- **CT tier_qty**: mua 2 hộp → CK 3%. stackable.

#### BDD Optimum Gold — `03AA23`, `03AH10`, `03AA42`, `03AA74`, `03AA54`, `03AA92`
- **CT tier_qty**: mua 2 hộp → CK 3%. stackable.

#### SB D.Alpha Step 3,4 — `02EA35`, `02EA45`, `02DA35`, `02DA45`, `02AA15`, `02AA25`, `02EA15`, `02EA25`
- **CT**: mua 2 → CK 3%. stackable.

#### SB D.Alpha Gold Step 3,4 — `02EG37`, `02EG47`, `02DG3A`, `02DG4A`
- **CT**: 2 CT cùng áp (CK 3% + Ontop CK 4%). stackable. → tổng CK ~7%.

#### SB Yoko Gold Step 3,4 — `02EY39`, `02AY19`, `02EY19`, `02EY29`
- **CT**: mua 2 → CK 3%. stackable.

#### SB Optimum Gold Step 3,4 — `02EO38`, `02EO48`, `02DO3A`, `02DO4A`, `02AO18`, `02AO28`, `02EO18`, `02EO28`
- **CT**: mua 2 → CK 7%. stackable. (Ontop +3% nếu có).

#### SB Optimum COLOS — `02ES38`, `02ES18`
- **CT**: mua 2 → CK 7%. stackable.

#### SB Grow Plus Step 3,4 — `02ER68`, `02ER78`, `02DR64`, `02DR74`
- **CT**: mua 2 → CK 10%. stackable.

#### SBNL CanPro/Mama/SBNK — `02EC14`, `02EM12`, `02AM12`, `02EM22`, `02AM22`, `02EN22`
- **CT**: mua 2 → CK 3%. stackable.

#### SBNL Sure Prevent/Diecerna mẫu cũ — `02EU15`, `02ED12`, `02AU15`
- **CT**: mua 2 → CK 10%. stackable.

#### Optimum 110ml — `02HO38`
- **CT 1**: 1T (48 lon) + 8H. stackable.
- **CT 2**: 48 + 2. stackable.

#### SBPS TE (110/180ml hộp/chai) — `02HL37`, `02HG38`, `02HG18`, `02HL17`, `03HA38`, `02HD39`, `02HD19`, `02HT30`, `02HO38`, `02HO18`, `02HY39`, `02HY19`, `02HS37`
- **CT bonus**: 48 + 2 dâu/chuối (`03HA38`). stackable.
- **CT order_bonus MR04263011**: mỗi 250K đơn → 4 hộp `02HL37`. repeat. stackable.

---

## Mã CT công ty (MR04...)

Khi nhận thông báo từ Vinamilk, kèm theo mã CT để tracking.

| Mã CT | Mô tả | Trạng thái | Áp dụng |
|---|---|---|---|
| MR04263011 | SBPS TE: mỗi 250K → 4h Grow Plus 110 | **Active T4/2026** | Áp tất cả SBPS TE |
| MR04263012 | SBPS TE đơn dưới 5M | Inactive | Đã tắt T4 |

---

## Lịch sử thay đổi (newest first)

### 2026-04-22
- Thêm CT `MR04263011` SBPS TE (mỗi 250K + 4h `02HL37`).
- Thêm CT bonus 48+2 SBPS TE tặng `03HA38`.
- Tắt CT `MR04263012` (replaced by MR04263011).

### 2026-04-21
- Thêm `04FH20` (Fino A2 220ml) vào CT "Fino 16+1".
- Cập nhật CT "Fino Ontop 96+2": áp `04FA31`, `04FC32`, `04FH20`.
- Thêm CT KD: Fino ID/KD A2 48b + 2b Fino A2.
- Cập nhật CT order_money "SCU Susu/Hero Ontop 2%" — bao gồm cả 170/180ml.
- Đổi CT order_bonus SN sang **Cascade mode** (5M+8h, 2M+2h).

### 2026-04-15
- **Bug fix lớn**: 
  - `_calcBestBonus` aggregate thay vì pick best.
  - `calcOrderKM` thêm guard `minSKU` cho `order_money`.
  - `getItemsFromCartState` thêm `bonusItems: []` cho early-return.
- Thêm CT order_bonus STV "250K+2h / 400K+4h".

### 2026-04-12
- Cập nhật CT `01SX11`, `01SB10`, `01TL10` (lon lớn) sang gift NSPN 380g (`01SX07`).

### 2026-04-10
- Cập nhật CT NSPN XL HG (`01SX07`).

### 2026-04-07
- Thêm SP `03HA38` Dielac Grow Plus Hương dâu 110ml (slThung 24, locSize 4).

### 2026-04-05
- Tạo các CT `02HO38` Optimum 110ml: 1T+8H, 48+2.

---

## Template để hỏi user khi cần info CT mới

> "Em cần thông tin CT này để cập nhật chính xác:
> 1. Tên CT (ví dụ: 'NSPN XL 380g HT 14+1b Fino')
> 2. Loại: bonus / fixed / tier_qty / tier_money / order_money / order_bonus
> 3. SP áp dụng (mã SP)
> 4. Công thức (X+Y, hoặc tier % theo SL/tiền)
> 5. SP tặng (nếu bonus): mã SP, hay 'cùng loại'
> 6. Stackable hay non-stackable? (gộp với CT khác hay chỉ dùng 1)
> 7. minSKU (nếu cần)?
> 8. Bắt đầu áp dụng từ ngày nào?
> Em sẽ cập nhật cả `promotions.json` và `PROMOTIONS_LOG.md`."
