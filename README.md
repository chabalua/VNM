# VNM
# VNM Order

Ứng dụng web dành cho nhân viên kinh doanh/đại , hỗ trợ tạo đơn hàng nhanh, quản lý sản phẩm, khách hàng và chương trình khuyến mãi linh hoạt. Dữ liệu được đồng bộ từ GitHub, có thể dùng offline với cache local.

## 🚀 Tính năng chính

- **Đặt hàng trực quan**: Danh sách sản phẩm theo nhóm (bột, đặc, nước, chua), tìm kiếm, hiển thị giá gốc và giá sau khuyến mãi theo số lượng.
- **Khuyến mãi động**: Hỗ trợ nhiều loại CTKM: tặng hàng (mua X tặng Y), chiết khấu %, chiết khấu theo số lượng/thành tiền, có thể gộp hoặc không gộp nhiều CTKM.
- **Quản lý đơn hàng**: Xem giỏ hàng, sửa số lượng, xóa sản phẩm, tạo đơn hàng kèm mã khách hàng (tự động lưu lịch sử).
- **Quản lý sản phẩm (Admin)**: Xem danh sách sản phẩm, cập nhật giá bán lẻ và thùng, dữ liệu được lưu vào localStorage và có thể xuất/nhập JSON.
- **Quản lý khách hàng**: Thêm/xóa khách hàng, xem lịch sử đơn hàng (tối đa 30 đơn gần nhất).
- **Quản lý chương trình khuyến mãi**: Tạo, sửa, xóa, bật/tắt CTKM; preview hiệu quả ngay khi tạo; có thể xuất/nhập CTKM từ file JSON hoặc load từ URL GitHub.
- **Đồng bộ dữ liệu từ GitHub**: Tải sản phẩm và CTKM từ repository công khai, giúp cập nhật giá và chương trình mới nhất.
- **Yêu thích sản phẩm**: Đánh dấu sao để ưu tiên hiển thị đầu danh sách trong phần chọn sản phẩm cho CTKM.
- **Chạy offline**: Dữ liệu được cache trong localStorage, vẫn hoạt động khi mất mạng.

## 🗂 Cấu trúc thư mục
project/
├── index.html # File chính, chứa cấu trúc HTML
├── css/
│ └── style.css # Toàn bộ CSS
├── js/
│ ├── config.js # Cấu hình URL GitHub, VAT, màu sắc...
│ ├── data.js # Quản lý dữ liệu SP, KM, load/save localStorage, sync
│ ├── cart.js # Giỏ hàng, đơn hàng, khách hàng
│ ├── ui.js # Render các giao diện: đặt hàng, admin, KH
│ ├── km.js # Logic và giao diện quản lý CT KM (modal, form)
│ └── main.js # Khởi tạo, chuyển tab, lọc nhóm
├── data/
│ ├── products.json # (không bắt buộc) file mẫu dữ liệu sản phẩm
│ └── promotions.json # (không bắt buộc) file mẫu CTKM
└── README.md


