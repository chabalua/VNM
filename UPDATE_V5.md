# VNM Order v5 — Nền tảng mới

## Tính năng mới

### 1. ☁️ GitHub Sync 2 chiều (Push + Pull)
- Paste GitHub token 1 lần → app tự push/pull data
- Sync 5 files: products, promotions, customers, routes, orders
- Kiểm tra kết nối, hiện thời gian sync cuối
- Tab Quản lý → nút "☁️ Đồng bộ GitHub"

### 2. 📋 Lịch sử đơn hàng
- Tạo đơn → lưu vĩnh viễn (không mất khi reset)
- Tab Đơn hàng = Giỏ hiện tại + Lịch sử
- Filter: Hôm nay / Tuần / Tháng / Tất cả
- Xem chi tiết, xóa đơn cũ

### 3. 📋 Copy đơn → Zalo
- 1 tap copy đơn hàng thành text đẹp
- Paste vào Zalo gửi cho đại lý/KH
- Format có KM, tiết kiệm, VAT

### 4. 💾 Backup / Restore offline
- Xuất toàn bộ data (SP+KM+KH+Đơn) → 1 file JSON
- Restore khôi phục hoàn chỉnh
- Không cần mạng, không cần GitHub

## Files mới
| File | Mô tả |
|------|-------|
| `js/sync.js` | **MỚI** — GitHub API sync + Backup/Restore + Orders storage |

## Files cập nhật
| File | Thay đổi |
|------|----------|
| `index.html` | Thêm sync.js, đổi nút admin tools |
| `js/cart.js` | Lịch sử đơn, copy Zalo, submitOrder mới |

## Files KHÔNG đổi
- css/style.css, js/config.js, js/data.js, js/ui.js, js/main.js
- js/customer.js, js/km.js
- promotions.json, products.json, customers.json, routes.json

## Cách dùng GitHub Sync
1. Tạo token tại github.com/settings/tokens (chọn quyền repo)
2. Mở app → Quản lý → ☁️ Đồng bộ GitHub
3. Paste token → Lưu
4. Bấm Push (đẩy lên) hoặc Pull (tải về)
