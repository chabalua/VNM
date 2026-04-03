# VNM Order — Thiết kế Module Khách Hàng v2

## Tổng quan kiến trúc

### Files mới / thay đổi
| File | Mô tả |
|------|-------|
| `js/customer.js` | **MỚI** — Module quản lý KH, tính thưởng CT, UI tab KH |
| `customers.json` | **MỚI** — Data file KH (sync GitHub) |
| `routes.json` | **MỚI** — Danh sách tuyến bán hàng |
| `index.html` | **SỬA** — Thêm tab KH mới, FAB, script customer.js |
| `js/main.js` | **SỬA** — Tích hợp cusLoad(), renderRoutePills() |

### Files KHÔNG thay đổi (giữ nguyên)
- `js/config.js`, `js/data.js`, `js/cart.js`, `js/ui.js`, `js/km.js`
- `css/style.css`, `promotions.json`

---

## Data Schema

### customers.json
```json
{
  "ma": "DL200410WX",        // Mã KH (key chính)
  "ten": "Tạp hóa Hồng Phúc",
  "tuyen": "T1-BMT-Center",   // ID tuyến (link với routes.json)
  "diachi": "...",
  "sdt": "...",
  "loaiCH": "tapHoa|shopSua|sieuThiMini|daiLy",
  "coTuVNM": true,             // Tủ mát Vinamilk
  "loaiTu": "1canh|2canh|honhop",
  "dungTichTu": 300,           // Lít
  "coKe": true,                // Kệ Vinamilk  
  "loaiKe": "M1-M9",           // Mức kệ VNM Shop
  "programs": {
    "vnmShop": {                // CT Vinamilk Shop T3-12/2026 — Nhóm C
      "dangKy": true,
      "mucBayBan": "M6",        // M1-M9
      "mucTichLuy": "5",        // 1-7
      "ngayDangKy": 5           // Ngày trong tháng đăng ký
    },
    "vipShop": {                // CT VIP Shop T3-T6/2026 — Nhóm DE
      "dangKy": true,
      "mucBayBan": "TB3",       // TB1-TB4
      "mucTichLuy": "TL4",      // TL1-TL5
      "ngayDangKy": 3
    },
    "sbpsShop": {               // CT SBPS Shop T3-6/2026 — SBPS TE
      "dangKy": false,
      "muc": "5",               // 1-8
      "ngayDangKy": 0
    }
  },
  "monthly": {                  // DS theo tháng (nhập bởi NVBH)
    "2026-04": {
      "dsNhomC": 12000000,
      "dsGD1": 4000000,         // Giai đoạn 1 (1-10)
      "dsGD2": 3000000,         // Giai đoạn 2 (11-20)
      "dsGD3": 5000000,         // Giai đoạn 3 (21-27)
      "vnmShopTrungBay": true,
      "dsNhomDE": 8000000,
      "dsVipN1": 5000000,       // SP chủ lực
      "dsVipN2": 3000000,       // SP tập trung
      "skuNhomD": 6,
      "vipShopTrungBay": true,
      "dsSBPS": 0,
      "sbpsN1": 0,
      "sbpsN2": 0,
      "sbpsN3": 0,
      "sbpsTo26": 0
    }
  }
}
```

### routes.json
```json
{ "id": "T1-BMT-Center", "ten": "Tuyến 1 - BMT Trung tâm", "mota": "..." }
```

---

## Cách tích hợp vào app hiện tại

### Bước 1: Copy files mới
- Copy `js/customer.js` vào thư mục `js/`
- Copy `customers.json` và `routes.json` vào thư mục root
- Thay thế `index.html` và `js/main.js`

### Bước 2: Cấu hình GitHub sync
Trong `js/config.js`, thêm:
```js
const CUSTOMERS_URL = REPO_RAW + 'customers.json';
const ROUTES_URL = REPO_RAW + 'routes.json';
```
(Đã được define trong `js/customer.js` nếu REPO_RAW tồn tại)

### Bước 3: Upload lên GitHub
Push `customers.json` và `routes.json` lên repo `chabalua/VNM-PWD-1`

---

## Các chương trình thưởng đã encode

### 1. VNM Shop T3-12/2026 (Nhóm C)
- **Trưng bày**: 9 mức M1-M9, thưởng 150K-900K/tháng
- **Tích lũy DS**: 7 mức, CK 1.2%-1.8% trên DS thực
- **Giai đoạn 1** (1-10): +1.6% (min 25% DS ĐK, max 40% DS max)
- **Giai đoạn 2** (11-20): +1.2% (lũy kế min 55%, max 70%)
- **Giai đoạn 3** (21-27): +0.6% (lũy kế min 85%, không giới hạn max)
- SP STTT 1L các loại không tính thưởng GĐ

### 2. VIP Shop T3-T6/2026 (Nhóm DE)
- **Trưng bày**: 4 mức TB1-TB4, thưởng 100K-800K/tháng (tùy tủ VNM/KH)
- **Tích lũy DS**: 5 mức TL1-TL5
  - Nhóm 1 (Chủ lực): 1.8%-2.6%
  - Nhóm 2 (Tập trung): 4.0%-5.5%
- **Vượt 90tr**: +1.0% phần vượt
- **Thưởng ICY**: 20 thùng → +1 thùng

### 3. SBPS Shop T3-6/2026 (SBPS TE, MT01 MT02)
- **Tích lũy DS**: 8 mức, 3 nhóm SP (N1/N2/N3)
  - N1: DG/GP/A2 — 4.0%-7.0%
  - N2: OG/DGP — 4.5%-7.3%
  - N3: Yoko/OC — 4.0%-6.2%
- **Thưởng đến 26**: +0.6%-1.0% nếu đạt 100% DS trước ngày 26

---

## Giá "thực tế sau thưởng"

App tính toán và hiển thị:
1. **% giảm thêm** = Tổng thưởng / Tổng DS × 100
2. **Quy đổi SP** = Tổng thưởng / Giá trung bình 1 hộp sữa (ước ~7000đ)
3. **Ví dụ**: KH mua 12 triệu nhóm C, đạt trưng bày M6 → nhận 150K trưng bày + 156K tích lũy = 306K
   → Giảm thêm 2.55% → Tương đương ~44 hộp sữa 180ml

---

## Workflow NVBH trên app

1. **Đầu tháng**: Setup KH mới, phân tuyến, đăng ký CT
2. **Hàng ngày**: Đặt hàng (tab ĐẶT HÀNG), ghi nhận DS (tab KH → 📊 DS)
3. **Cuối tháng**: Xem tổng kết thưởng, thanh toán
4. **Sync**: Export JSON → push lên GitHub → đồng bộ giữa PC và iPhone
