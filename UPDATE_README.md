# VNM Order v3 — Cập nhật lớn

## Files cần THAY THẾ (ghi đè lên repo)
| File | Trạng thái |
|------|-----------|
| `index.html` | ĐÃ SỬA — thêm brand pills, KH selector, KH FAB, nút products.json |
| `js/ui.js` | ĐÃ SỬA — brand sub-filter, KH selector, reward line per SP |
| `js/cart.js` | ĐÃ SỬA — auto-link KH từ selector, bỏ input mã KH thủ công |
| `js/data.js` | ĐÃ SỬA — thêm exportProductsJSON() |
| `js/main.js` | ĐÃ SỬA — tích hợp cusLoad, renderRoutePills, KH FAB |
| `js/customer.js` | **MỚI** — module KH + KPI + thưởng CT |
| `customers.json` | **MỚI** — data file KH (push lên GitHub) |
| `routes.json` | **MỚI** — danh sách tuyến |
| `products.json` | **MỚI** — template (xuất từ app bằng nút "Xuất products.json") |

## Files KHÔNG thay đổi (giữ nguyên)
- `js/config.js` — giữ nguyên
- `js/km.js` — giữ nguyên
- `css/style.css` — giữ nguyên
- `promotions.json` — giữ nguyên

## Tính năng mới

### 1. Phân loại brand (nhãn hàng con)
- Khi chọn nhóm A/B/C/D → hiện thêm hàng pills phân loại brand
- VD: Nhóm C → STT 100%, Green Farm, ADM, Fino, Flex, SĐN/Hạt
- VD: Nhóm D → Probi, SCA Trắng, Susu SCU, Hero, Yomilk
- Click brand để lọc, click lại để bỏ lọc

### 2. Chọn KH trước khi đặt hàng
- Dropdown chọn KH ngay trên đầu tab Đặt hàng
- KH phân theo tuyến (optgroup)
- Khi chọn KH → hiện mini info + tự động link vào đơn
- Bảng giá mỗi SP hiện thêm dòng thưởng CT tương ứng KH đã chọn

### 3. Nút "Xuất products.json"
- Trong tab ⚙️ Quản lý → nút mới "📋 Xuất products.json (GitHub)"
- Xuất file products.json sạch để push lên GitHub cập nhật giá

### 4. Tab KH cải thiện UI
- Card KH thiết kế lại: mỗi CT hiện trong 1 box riêng với viền màu
  - VNM Shop: nền xanh lá, viền trái xanh đậm
  - VIP Shop: nền xanh dương, viền trái xanh biển
  - SBPS: nền vàng, viền trái cam
- Mỗi box hiện đủ: mức đăng ký, điều kiện DS, % CK, thưởng trưng bày
- Progress bar tiến độ DS trực quan
- Box tổng thưởng nền đen nổi bật
- Nếu chưa đăng ký CT → hiện gợi ý setup

### 5. customers.json + routes.json cho GitHub
- Export/Import riêng
- Quản lý tuyến ngay trong app
