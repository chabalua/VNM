# AI_WORKFLOW.md — Quy trình AI phải tuân thủ

> File này dành riêng cho AI coding assistant (Copilot, Cursor, Claude). User đọc tham khảo.
>
> **Mục đích**: Chuẩn hoá cách AI làm việc để giảm số lần phải hỏi đi hỏi lại.

---

## Nguyên tắc số 1: Trước khi code, hãy đọc

Trước khi đề xuất bất kỳ thay đổi nào liên quan đến **giá / KM / thưởng KH / sync**, AI BẮT BUỘC đọc theo thứ tự:

1. `CLAUDE.md` — kiến trúc tổng + quy tắc vàng.
2. `DECISIONS.md` — lý do đằng sau từng quyết định nghiệp vụ.
3. `PROMOTIONS_LOG.md` — nếu thay đổi liên quan CT KM cụ thể.

Nếu KHÔNG đọc → đề xuất sẽ bị reject.

---

## Nguyên tắc số 2: Phân loại request trước khi làm

Khi user nói gì đó, AI phải phân loại trước:

### Loại A: Bug fix có thể fix ngay
**Dấu hiệu**: User mô tả hành vi sai cụ thể, có thể reproduce. Ví dụ: "tôi nhập 12 thùng NSPN nhưng thấy chỉ tặng 0 lon, đáng ra phải 4 lon".

**Quy trình**:
1. Tìm code liên quan, đọc kỹ.
2. Tra `DECISIONS.md` xem có decision nào liên quan không.
3. Đề xuất fix + giải thích root cause + test case.
4. Code, chạy test, confirm.

### Loại B: Thay đổi quy tắc nghiệp vụ
**Dấu hiệu**: "Bây giờ Vinamilk đổi quy định, phải làm Y thay vì X". 

**Quy trình**:
1. **Dừng lại**. Tra `DECISIONS.md` xem quy tắc cũ ở đâu.
2. Hỏi xác nhận user: "Quy tắc cũ là [trích từ DECISIONS]. Bạn muốn đổi sang Y, đúng không? Áp dụng từ thời điểm nào?"
3. Sau khi user xác nhận:
   - Update `DECISIONS.md` trước (đánh dấu cũ là `[REPLACED date]`, thêm decision mới).
   - Sửa code.
   - Update test (nếu có).

### Loại C: CT KM mới hoặc thay đổi CT
**Dấu hiệu**: "CT NSPN tháng này đổi thành 28+1", "Có CT mới về SBPS".

**Quy trình**:
1. Tra `PROMOTIONS_LOG.md` xem CT cũ.
2. Hỏi user info đầy đủ theo template trong `PROMOTIONS_LOG.md` (8 câu hỏi).
3. Update `PROMOTIONS_LOG.md` trước.
4. Update `promotions.json` qua app UI hoặc edit file (chú ý sync với GitHub).

### Loại D: UI/UX
**Dấu hiệu**: "Cho card đẹp hơn", "đổi màu", "layout chật".

**Quy trình**:
1. Hỏi cụ thể: "Bạn thấy vấn đề gì khi nhìn card này? (Ví dụ: giá khó đọc ngoài nắng / scroll mệt / không biết SP nào trong giỏ)" — focus VẤN ĐỀ chứ không phải GIẢI PHÁP.
2. Đề xuất 2-3 hướng có thể, để user chọn.
3. Code mockup nhỏ để user duyệt.
4. Mới đến CSS chi tiết.

### Loại E: Refactor
**Dấu hiệu**: "Tách file", "code dài quá", "khó đọc".

**Quy trình**:
1. Liệt kê file/hàm bị tác động trước khi sửa.
2. Đảm bảo không vi phạm `DECISIONS.md`.
3. Refactor từng bước nhỏ, mỗi bước test trước khi qua bước tiếp theo.
4. KHÔNG đổi behavior. Chỉ đổi structure.

---

## Nguyên tắc số 3: Hỏi đúng cách

### Câu hỏi BẨN (đừng hỏi)
- ❌ "Bạn muốn làm gì?" — quá rộng, đẩy effort về user.
- ❌ "Bạn có muốn tôi làm A hay B?" — chưa hiểu vấn đề đã chọn giải pháp.
- ❌ "Code này có đúng ý bạn không?" — sau khi đã code 200 dòng.

### Câu hỏi SẠCH (nên hỏi)
- ✅ "Tôi tra `DECISIONS.md` thấy [...]. Bạn xác nhận giữ nguyên hay đổi?"
- ✅ "Tôi hiểu vấn đề là [X]. Có 2 hướng fix: [A: ngắn hạn] [B: dài hạn]. Tôi đề xuất A vì [...]. OK không?"
- ✅ "Trước khi code, tôi sẽ làm: 1) [...]. 2) [...]. 3) [...]. Bạn confirm?"

### Khi nào KHÔNG cần hỏi
- Bug rõ ràng có root cause + có decision cũ → fix luôn, ghi giải thích.
- Sửa typo, lỗi escapeHtml, quy tắc trong CLAUDE.md → áp dụng luôn.
- Test thất bại → debug và fix luôn.

---

## Nguyên tắc số 4: Cập nhật document SAU mỗi thay đổi

Mỗi khi sửa code có ảnh hưởng business logic, AI BẮT BUỘC update doc:

| Loại thay đổi | File phải update |
|---|---|
| Sửa logic tính KM | `DECISIONS.md` (thêm/sửa entry) + comment trong code |
| Thêm/sửa CT KM | `PROMOTIONS_LOG.md` |
| Thêm bug đã gặp | `CLAUDE.md` (Section "Anti-patterns đã gặp") |
| Thay đổi schema data | `CLAUDE.md` (Section LocalStorage keys) |
| Tách file / refactor | `CLAUDE.md` (Section "Cấu trúc file") |

**Quy tắc vàng**: Code và doc phải đi cùng trong 1 commit. Đừng commit code rồi để doc lại sau.

---

## Nguyên tắc số 5: Chế độ "Plan trước, code sau"

Với mọi thay đổi > 30 dòng code, AI BẮT BUỘC làm plan trước:

```
PLAN cho [yêu cầu]:

Mục tiêu:
- [...]

Files cần sửa:
- file1.js: [lý do, hàm nào]
- file2.js: [...]

Decision liên quan (từ DECISIONS.md):
- D-XXX: [...]

Edge cases cần xử lý:
1. [...]
2. [...]

Test plan:
- Manual test: [...]
- Auto test: [test case mới hoặc test cũ liên quan]

Rủi ro:
- [...]

Bạn confirm plan này, tôi sẽ code.
```

User confirm → code. User reject → discuss lại.

**KHÔNG bao giờ** code trước rồi xin lỗi sau.

---

## Nguyên tắc số 6: Một context — một việc

Trong cùng 1 chat:
- ✅ Tốt: "Fix bug calc KM cho NSPN" → tập trung làm 1 việc đến hết.
- ❌ Xấu: "Fix KM rồi đổi màu rồi thêm field rồi..." → context loãng, dễ sai.

Nếu user mở rộng yêu cầu giữa chừng:
- "Trước khi sang việc mới, tôi sẽ xác nhận việc cũ đã xong. Việc cũ: [...]. Đã merged vào [...]. Test pass [...]. Bây giờ sang việc mới: [...]"

---

## Nguyên tắc số 7: Khi không chắc, đọc code đừng đoán

- Cần biết hàm A trả gì? → Đọc hàm A. Đừng đoán dựa trên tên.
- Cần biết LS_KEYS có key nào? → Đọc `config.js`. Đừng đoán.
- Cần biết test case có gì? → Đọc `tests/km-engine.test.shared.js`.

**Tuyệt đối không bịa**: tên hàm, tên field, mã SP, mức giá. Sai 1 chỗ là phải sửa lại — đó là nguyên nhân lớn của "phải làm đi làm lại".

---

## Quy trình chuẩn cho mỗi session

### Bắt đầu chat mới
```
1. Đọc CLAUDE.md (bắt buộc).
2. Đọc DECISIONS.md (nếu có vẻ liên quan business logic).
3. Đọc PROMOTIONS_LOG.md (nếu liên quan CT KM cụ thể).
4. Xác nhận với user: "Tôi đã đọc context. Yêu cầu của bạn thuộc loại [A/B/C/D/E]. Plan: [...]. OK không?"
```

### Trong khi làm
```
1. Mỗi 50 dòng code mới, dừng và confirm với user (nếu chưa confirm plan trước).
2. Nếu phát hiện vi phạm DECISIONS.md → dừng, hỏi user.
3. Nếu cần thay đổi nhiều file → confirm scope trước.
```

### Kết thúc một việc
```
1. Update doc liên quan (DECISIONS.md / PROMOTIONS_LOG.md / CLAUDE.md).
2. Chạy test (nếu có): `node tests/km-engine.test.js`.
3. Tạo commit message ngắn gọn.
4. Tóm tắt: "Đã thay đổi [files]. Update doc [files]. Test [pass/skip vì lý do]. Có việc nào khác không?"
```

---

## Anti-patterns AI hay vi phạm (đừng vi phạm)

1. **Code trước, hỏi sau**. Sai → phải làm lại từ đầu.
2. **Đoán giá trị/tên/mã** thay vì đọc file. Sai → bug khó tìm.
3. **Sửa code mà không update doc**. → Lần sau AI khác (hoặc chính bạn) lại sai.
4. **Làm thêm việc không được yêu cầu** ("tôi thấy hàm này nên refactor luôn"). → Out of scope, tốn thời gian, dễ break.
5. **Trả lời chung chung khi user hỏi cụ thể** ("Có nhiều cách, bạn có thể..." → user muốn 1 cách cụ thể).
6. **Tự ý đổi quyết định cũ** mà không hỏi. Vi phạm `DECISIONS.md` mà không hỏi user.
7. **Tóm tắt sai**: "Đã fix" trong khi chưa test → user phát hiện ra đang fail.

---

## Khi user yêu cầu "đừng hỏi nhiều, làm luôn"

Điều này KHÔNG có nghĩa skip workflow. Có nghĩa:
- Skip xác nhận với những thứ rõ ràng đã có decision.
- VẪN phải đọc doc trước.
- VẪN phải update doc sau.
- VẪN phải test (nếu có).
- VẪN phải tóm tắt cuối.

Chỉ skip phần xác nhận trung gian — không skip workflow chính.
