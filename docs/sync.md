# Sync GitHub — chi tiết

> Đọc trước khi sửa sync.js hoặc data.js (loadProducts, loadPromotions, initData).

## Cấu hình
- Repo: `chabalua/VNM`, branch `main`. API: `https://api.github.com/repos/.../contents/<file>`.
- Token PAT lưu localStorage (key `vnm_github_sync.token`), validate format `ghp_*` / `github_pat_*` / etc.
- 5 file sync: `products.json`, `promotions.json`, `customers.json`, `routes.json`, `orders.json`.

## Cơ chế

- **Auto-push**: sau mỗi save (gọi `syncAutoPushFile(filename)`). Có debounce 1500ms + queue per filename — tránh race condition.
- **Auto-pull on start**: nếu flag `autoPullAllOnStart=true`.
- Orders dùng soft delete (`_deleted: true`) để merge cross-device.
- Mọi entity sync cần `_updatedAt` (cập nhật qua `markEntityUpdated(entity)` trước khi save) — dùng cho merge sync.

## Quy tắc bất di bất dịch

1. **KHÔNG ghi đè `vnm_km3` trong background refresh** — CT KM là user-generated, có thể chưa kịp push.
2. **LUÔN gọi `syncAutoPushFile('xxx.json')`** sau khi save dữ liệu master.
3. **LUÔN gọi `markEntityUpdated(entity)`** trước khi save.
4. **Validate response GitHub trước khi save** — nếu API trả lỗi/object lạ, không được overwrite localStorage.
5. **Mọi fetch**: `fetch(url + '?_t=' + Date.now(), { cache: 'no-store' })` để tránh Safari aggressive cache.
