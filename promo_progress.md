# Nhật ký tiến độ CTKM

## Trạng thái hiện tại
- Đã có 4 ảnh khuyến mãi trong workspace: 
  - `z7655714486734_713c78bf4e4ea3a5e07ac68967158dcd.jpg`
  - `z7655714499392_c2ad4d9c869b9606494d8f608e126d38.jpg`
  - `z7655714518957_465424055ee980c04d039d68eabbd330.jpg`
  - `z7655721334310_d32f38b1e2f6a86d80104de3f999392a.jpg`
- Đã đọc toàn bộ nội dung ảnh và đưa vào `promotions.json` các chương trình chính.
- Đã bổ sung hỗ trợ `order_money` trong `js/km.js` để tạo CTKM theo tổng đơn hàng.

## Các chương trình đã áp dụng vào `promotions.json`
- Giá thùng 600 / 1.2tr / 1.2tr+ CK 12% / 14% / 16%
- YokoGold CK 10%
- Sure Prevent / Sure Tiểu Đường 6 chai CK 14%
- AD Ridielac Gold mua 2 hộp CK 3%
- ALPHAL mua 2 lon CK 3%
- ALPHAL GOLD mua 2 lon CK 7%
- OPTIMUM mua 2 lon CK 10%
- GROW PLUS ĐỎ mua 2 lon CK 10%
- OPTIMUM CLOS mua 2 lon CK 7%
- YOKO mua 2 lon CK 3%
- MAMA mua 2 lon CK 3%
- SURE PRIVEN mua 2 lon CK 7%
- DIECIMA mua 2 lon CK 7%
- NGUYÊN KEM mua 2 lon CK 3%
- CANXI PRO mua 2 lon CK 3%
- ADM 110 ml CK theo số thùng
- ADM 180 ml CK cố định 13%
- Sữa bịch 16+1
- Sữa tươi 100% 12+1
- Sữa tươi 1L CK 2%
- Green Farm 12+1
- Green Farm CK theo tiền (≥1.5tr CK 1%, ≥5tr CK 2%)
- Sữa đậu nành & hạt CK 5%
- Organic 180 ml 12+1
- YOMILK 170ml 86+10
- Cao đạm 180ml 24+2
- Cao đạm 240ml 24+2
- Sữa 9 loại hạt 180ml 24+2H
- BÒ 100% / FINO Đơn hàng CK theo tổng (≥1TR CK 1%, ≥3TR CK 2%)

## Ghi chú OCR
- Ảnh 1: đúng các mã thùng 600/1.2tr/1.2tr+ và YokoGold, Sure Prevent/Sure Tiểu Đường.
- Ảnh 2: nhóm AD Ridielac Gold mua 2 hộp CK 3% (cần xác nhận chính xác một số mã còn thiếu so với ảnh).
- Ảnh 3: nhóm ALPHAL/ALPHAL GOLD/OPTIMUM/GROW/SURE/MAMA/DIECIMA/NGUYÊN KEM/CANXI PRO đã được áp.
- Ảnh 4: nhóm sữa tươi - ADM - sữa bịch - đậu nành - Green Farm - YOMILK - BÒ 100% / FINO đã được áp; còn có các điều kiện bổ sung cần kiểm tra thêm.

## Việc đã làm tiếp
- Đã sửa `js/km.js` để hiển thị loại CTKM `order_money` trong form tạo CTKM.
- Đã giữ nguyên logic `calcOrderKM()` để áp CK tổng đơn hàng.

## Việc tiếp theo
- Kiểm tra và hoàn thiện mã sản phẩm chính xác cho các chương trình AD Ridielac Gold và các chương trình điều kiện "MUA 100K CK 3%".
- Nếu cần, mở rộng cho CTKM theo đơn hàng có nhiều mức or `MUA kèm điều kiện`.
- Chuẩn hoá lại `promotions.json` nếu phát hiện mã SP chưa đúng với products chính thức.
