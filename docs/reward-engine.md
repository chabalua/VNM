# CT Thưởng KH — chi tiết

> Đọc trước khi sửa logic VNM Shop / VIP Shop / SBPS Shop trong customer.js.

3 chương trình áp dụng T3–12/2026 (số liệu tải từ PDF Vinamilk).

## VNM Shop (Nhóm C — Sữa nước)
- Trưng bày M1–M9 (kệ KT, ụ HZ, Minimart). Đăng ký 16–19: thưởng 50%, sau 19: 0%.
- Tích lũy 7 mức theo DS tháng. CK toàn DS + thưởng giai đoạn GĐ1 (1–10), GĐ2 (11–20), GĐ3 (21–27).
- Quy tắc: GĐ1 ≥ 25% DS ĐK, GĐ1+2 ≥ 55%, GĐ1+2+3 ≥ 85%. SP STTT 1L không tính GĐ.

## VIP Shop (Nhóm DE — Sữa chua + NGK)
- Trưng bày tủ TB1–TB4 theo DS + SKU min. Thưởng tủ VNM > tủ KH.
- Tích lũy TL1–TL5 với 2 nhóm: Chủ lực (N1) + Tập trung (N2). Vượt 90tr: +1.0%.
- Loại trừ: SCA học đường 60g, Bơ lạt 20kg, Happy Star 100g, Nước rau củ Susu 180ml, Thạch phô mai que 100g.

## SBPS Shop (Sữa bột pha sẵn TE 110ml/180ml)
- Trưng bày TH-M1 đến TH-M8 (Tạp hóa/Khác + Minimart/M&B).
- Tích lũy 8 mức × 3 nhóm: N1 (DG/GP/A2), N2 (OG/DGP), N3 (Yoko/OC). Thưởng đến ngày 26 nếu DS ≥ 100%.

## Hàm tính
- `calcVNMShopReward(kh, monthData)` → `{trungBay, tichLuy, giaiDoan1/2/3, total, details[]}`
- `calcVIPShopReward(kh, monthData)` → `{trungBay, tichLuy, vuot90, total, details[]}`
- `calcSBPSReward(kh, monthData)` → `{trungBay, tichLuy, thuong26, total, details[]}`
- `calcTotalReward(kh, monthData)` → tổng hợp 3 program

Bảng mức gốc: `VNM_SHOP_TRUNGBAY`, `VNM_SHOP_TICHLUY`, `VIP_SHOP_TRUNGBAY`, `VIP_SHOP_TICHLUY`, `SBPS_TRUNGBAY`, `SBPS_TICHLUY`. User có thể override qua `vnm_ct_config` (ctConfigLoad/ctConfigSave).

Mapping mã CT app Vinamilk → program: `VNM_APP_CODES`.

## Test
```bash
node tests/reward-engine.test.js
```
34 test cases. Vẫn nên đối chiếu bằng tay khi sửa logic bảng mức.
