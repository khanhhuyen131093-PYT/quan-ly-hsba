# TEST REPORT — HSBA 2026.09.11.2

## Kết quả tự động

**72/72 kiểm tra tĩnh + synthetic đã PASS.**

Đã kiểm tra:
- JavaScript module trong `index.html`: `node --check` PASS.
- `sw.js`: syntax PASS.
- `Code.gs`: syntax PASS bằng bản sao `.js`.
- `manifest.webmanifest`, `version.json`, Rules validation copy: JSON PASS.
- Không có ID tĩnh trùng trong DOM.
- Frontend / Service Worker / version metadata đồng bộ `2026.09.11.2`.

## Nghiệp vụ file

PASS:
- A + thêm B, không ✕ A → A+B.
- A + ✕ A + thêm B → B.
- A+B + ✕ A → B.
- Không ✕ → giữ toàn bộ file cũ.
- Quyển tử vong sau thao tác phải còn >=1 file.
- Job `hsbaFileChoXoa` được ghi cùng commit RTDB bỏ tham chiếu file.
- Drive delete chỉ chạy sau commit RTDB.
- RTDB commit fail → file mới upload được cleanup, file cũ giữ nguyên.
- Sau commit mà browser đóng → job vẫn tồn tại để phiên sau retry.
- Xóa Drive thành công → job RTDB được xóa.
- Delete retry có giới hạn theo mỗi phiên; queue query được bound.
- Đổi số hồ sơ cập nhật context job chờ xóa.
- Apps Script token xóa được ký HMAC, không còn phụ thuộc CacheService ticket dễ hết hạn.
- Apps Script kiểm tra HSBA root, `HSBA_UPLOAD`, job RTDB, book và `hoSoTuVong` không còn tham chiếu.
- File đã ở thùng rác → thao tác retry idempotent.

## Storage / tử vong / lock

PASS qua kiểm tra code/rules/synthetic:
- Cùng Khu + cùng Thùng/Vị trí → transaction chặn.
- Khác Khu + cùng Thùng/Vị trí → key khác nhau.
- Temporary reservation có TTL; committed occupancy không expire.
- Same UID không thể lấy token lock mới khi lock cũ còn hiệu lực.
- Save re-check đúng lock token.
- Một patient không được có >1 death book.
- Death book phải là quyển cuối; Rules không dành ngoại lệ cho Admin.
- `quyenSo` bất biến khi edit.

## Public / hiệu năng

PASS:
- `congKhai` vẫn `.read: true`.
- Private books/queue vẫn yêu cầu auth/quyền.
- Patient page bound 50.
- Death page bound 50.
- Status filter dùng Firebase query.
- Save final không gọi `readBooksRootCached()`.
- Excel có `Khu lưu trữ`, 24 cột.
- Report lớn có yield event loop.
- `version.json` được dùng cho version check.

## Synthetic scale

Đã chạy mô hình 3 quyển/hồ sơ ở các mức:
- 500 hồ sơ / 1.500 quyển.
- 2.000 hồ sơ / 6.000 quyển.
- 5.000 hồ sơ / 15.000 quyển.

Các traversal synthetic đều hoàn tất dưới ngưỡng kiểm thử nội bộ; chi tiết nằm trong `verification_results.json` và `PERFORMANCE_REPORT.md`.

## Giới hạn kiểm thử

Môi trường này **không kết nối Firebase/Google Drive production** và không có Firebase Emulator project tương ứng, nên không ghi/xóa dữ liệu thật.

Vì vậy:
- Rules đã được parse + review logic, chưa chạy `firebase emulators:exec` với project thật.
- Apps Script Drive upload/delete đã được kiểm tra syntax/luồng, chưa xóa file thật trong thư mục Drive production.
- Bắt buộc thực hiện Smoke test sau deploy theo README bằng một hồ sơ thử không quan trọng trước khi mở lại cho toàn bộ người dùng.

Đây là giới hạn có chủ đích để tránh phá dữ liệu production.
