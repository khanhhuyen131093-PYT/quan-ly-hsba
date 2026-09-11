# HSBA 2026.09.11.2 — Production handoff

Bản chốt ngày **11/09/2026** cho ứng dụng **Hồ sơ bệnh án lưu trữ – HSBA**.

## 1. Kiến trúc giữ nguyên

- Frontend: HTML/CSS/JavaScript, triển khai trên GitHub Pages.
- Đăng nhập: Firebase Authentication + Google Sign-In.
- Dữ liệu nghiệp vụ: **Firebase Realtime Database**, không dùng Firestore.
- File scan/hình ảnh: **chỉ lưu trên Google Drive** qua Apps Script File Service.
- Firebase RTDB **không lưu binary/PDF/hình/Base64**; chỉ lưu metadata/tham chiếu file (`fileId`, `fileUrl`, `fileName`...).
- `congKhai` tiếp tục cho người chưa đăng nhập xem dữ liệu cơ bản đúng phạm vi hiện hành.

## 2. Nghiệp vụ nhiều file đã chốt

Một quyển có thể có nhiều file scan.

- Có File A, tải thêm File B và **không bấm ✕ A** → giữ **A + B**.
- Có A + B, tải thêm C → giữ **A + B + C**.
- Bấm **✕ A** rồi Lưu → A mới được đưa vào quy trình xóa; file khác giữ nguyên.
- Bấm ✕ A rồi thêm B → sau khi lưu thành công còn B.
- Không bấm ✕ → file cũ không bị xóa.
- File mới được upload lên Google Drive trước; RTDB chỉ cập nhật metadata/tham chiếu.
- Quyển tử vong phải còn ít nhất 01 file sau khi áp dụng thêm/xóa.

### Hàng đợi xóa file bền vững

Bản `2026.09.11.2` bổ sung node private `hsbaFileChoXoa`.

Khi người dùng bấm ✕ file A:

1. File Service xác minh A đang thuộc đúng hồ sơ/quyển và tạo token xóa được ký.
2. Lần commit RTDB ghi **đồng thời** danh sách file mới và job `hsbaFileChoXoa`.
3. Sau commit, Apps Script mới chuyển A vào thùng rác Google Drive.
4. Xóa Drive thành công → job RTDB được xóa.
5. Nếu mạng/trình duyệt đóng hoặc Drive tạm lỗi sau commit → job vẫn còn và được tự thử lại ở phiên Admin/Editor tiếp theo.
6. Nếu RTDB commit thất bại → file cũ giữ nguyên, file mới vừa upload được dọn như file tạm.

Nhờ vậy không còn trường hợp “RTDB đã bỏ tham chiếu nhưng trình duyệt đóng trước khi kịp xóa Drive” làm mất dấu file cần dọn.

## 3. Hai khu lưu trữ

- `CHUNG`: Hết quyển, Hồi gia, Chuyển trung tâm, Khác.
- `TU_VONG`: Đối tượng tử vong.
- Vị trí duy nhất theo **KHU + THÙNG + VỊ TRÍ**.
- `CHUNG/T1/V1` và `TU_VONG/T1/V1` được phép tồn tại đồng thời.
- Gợi ý vị trí kế tiếp độc lập theo từng kho, không tự lấp khoảng trống và luôn cho phép người dùng sửa.

## 4. Quy tắc tử vong

- Mỗi đối tượng tối đa 01 quyển tử vong.
- Quyển tử vong phải là quyển cuối cùng.
- Sau quyển tử vong không được mở quyển tiếp theo.
- Không được sửa một quyển cũ thành tử vong nếu phía sau vẫn còn quyển.
- Nếu nhập nhầm tử vong, người có quyền có thể sửa lại trạng thái; hệ thống đồng bộ `hoSoTuVong` và trạng thái hồ sơ.

## 5. Hiệu năng

- Danh sách hồ sơ phân trang 50 record.
- Search/filter dùng query có giới hạn thay vì full-read toàn `doiTuong`.
- Hồ sơ tử vong phân trang.
- Save quyển không full-read toàn `quyenHoSo` để kiểm tra vị trí.
- Dashboard sử dụng dữ liệu tổng hợp dẫn xuất; kho hiển thị summary trước, chi tiết lazy-load.
- Realtime có debounce/coalesce và giữ context người dùng.
- PWA kiểm tra phiên bản bằng `version.json`, không tải lại toàn `index.html` định kỳ.
- Báo cáo lớn xử lý theo lô và nhường event loop.

## 6. File bàn giao

### GitHub Pages
- `index.html`
- `sw.js`
- `manifest.webmanifest`
- `version.json`
- `assets/logo-192.png`
- `assets/logo-512.png`

### Google Apps Script
- `Code.gs`

### Firebase Realtime Database Rules
- `FIREBASE_RULES_HSBA_DAN_DE.txt`

**Quan trọng:** file Rules chỉ chứa phần HSBA từ đầu đến đúng ranh giới `hsbaYeuCauDangKy`, kết thúc bằng `},` vì trong Rules thật còn ứng dụng khác phía dưới. Chỉ **gán đè đúng khối HSBA**, không xóa hoặc thay phần bên dưới.

### Tài liệu
- `CHANGELOG.md`
- `TEST_REPORT.md`
- `PERFORMANCE_REPORT.md`
- `verification_results.json`
- `SHA256SUMS.txt`

## 7. Thứ tự triển khai bắt buộc

Nên thực hiện trong thời gian tạm ngưng nhập/sửa hồ sơ để không có phiên cũ ghi dữ liệu giữa lúc nâng cấp.

1. **Sao lưu** repository GitHub, Code.gs và toàn bộ Firebase Rules đang chạy.
2. Cập nhật **Code.gs** trong đúng Apps Script project hiện tại; tạo phiên bản/deployment mới nhưng **giữ URL Web App đang dùng**. Giữ Script Property `FIREBASE_API_KEY`. Property `HSBA_DELETE_TOKEN_SECRET` sẽ tự được tạo lần đầu nếu chưa có.
3. Gán đè **đúng khối Rules HSBA** bằng `FIREBASE_RULES_HSBA_DAN_DE.txt`, giữ nguyên toàn bộ Rules ứng dụng khác phía dưới, sau đó Publish Rules.
4. Đưa toàn bộ file GitHub Pages của bản `2026.09.11.2` lên repository.
5. Mở ứng dụng bằng tài khoản Quản trị, bấm **“Cập nhật danh mục xem”** một lần để rebuild `congKhai`, summary và scoped storage index. Nếu dữ liệu legacy có trùng vị trí hoặc nhiều quyển tử vong, hệ thống phải cảnh báo thay vì tự xóa.
6. Thực hiện Smoke test bên dưới bằng một hồ sơ thử không quan trọng trước khi mở lại cho tất cả người dùng.

## 8. Smoke test sau deploy

- Chưa đăng nhập: vẫn xem được dữ liệu cơ bản ở public mode.
- Login Editor/Admin: danh sách, tìm kiếm, filter hoạt động.
- Quyển có A → thêm B, **không bấm ✕ A** → sau lưu thấy A+B.
- Chỉnh lại → bấm ✕ A → Lưu → B còn; A được đưa vào thùng rác Drive. Nếu Drive tạm lỗi, job `hsbaFileChoXoa` phải còn và tự retry ở phiên Editor/Admin sau.
- Cùng `T1/V1` ở Kho chung và Kho tử vong → được phép.
- Trùng cùng `KHU + THÙNG + VỊ TRÍ` → bị chặn.
- Hồ sơ có quyển tử vong → không mở được quyển tiếp theo.
- PWA nhận bản mới mà không cần Ctrl+Shift+R.

## 9. File thay / file giữ nguyên

**Thay hoặc bổ sung:** `index.html`, `sw.js`, `version.json`, `Code.gs`, khối Rules HSBA.

**Giữ nguyên nội dung:** `manifest.webmanifest`, `assets/logo-192.png`, `assets/logo-512.png`.

Không sử dụng các file trung gian `HSBA-2026.09.10.1-production` hoặc `HSBA-2026.09.11.1-production`. Bản bàn giao cuối là **HSBA 2026.09.11.2**.
