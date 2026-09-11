# CHANGELOG — HSBA 2026.09.11.2

## File scan / Google Drive
- Một quyển hỗ trợ nhiều file scan.
- Upload file mới là **bổ sung**, không tự thay/xóa file cũ.
- Mỗi file hiện có có nút ✕; chỉ file được đánh dấu mới bị xóa sau khi người dùng Lưu thành công.
- File mới pending cũng có ✕ để bỏ khỏi danh sách trước upload.
- RTDB chỉ lưu metadata/tham chiếu; binary/PDF/hình vẫn chỉ nằm trên Google Drive.
- Bổ sung node private `hsbaFileChoXoa` làm hàng đợi xóa bền vững.
- Job xóa được commit atomically với việc RTDB bỏ tham chiếu file cũ.
- Nếu trình duyệt đóng/mạng lỗi sau commit, Admin/Editor ở phiên sau tự retry job còn tồn tại.
- Apps Script dùng token HMAC ký theo file, kiểm tra HSBA Drive root, mô tả `HSBA_UPLOAD`, job RTDB và xác minh book/death không còn tham chiếu trước khi xóa.
- Xóa là idempotent: file đã ở thùng rác được xem là hoàn tất.
- Giữ fallback an toàn cho phiên frontend cũ đang mở trong khoảng nâng cấp.

## Storage
- Tách 02 khu `CHUNG` / `TU_VONG`.
- Unique location = `KHU + THÙNG + VỊ TRÍ`.
- Scoped key `chung_t_XXXXXX_v_XXXXXX` / `tuvong_t_XXXXXX_v_XXXXXX`.
- Gợi ý vị trí theo từng kho; không lấp gap; input vẫn chỉnh sửa được.
- Save không full-read toàn `quyenHoSo`; transaction `hsbaViTriLuuTru` quyết định cuối.
- Temporary reservation có TTL; committed occupancy không tự hết hạn.
- Đổi số/xóa hồ sơ đồng bộ storage index.

## Tử vong
- Mỗi đối tượng tối đa 01 death book.
- Death book bắt buộc là quyển cuối và không có quyển sau.
- Rules áp dụng death-last cho cả Admin lẫn Editor, không chỉ UI.
- Có thể sửa trạng thái tử vong nhập nhầm và đồng bộ lại `hoSoTuVong`.
- Death book phải còn ít nhất 01 file scan sau thao tác thêm/xóa.

## Lock / Rules
- Cùng UID ở thiết bị khác không được thay token lock còn hiệu lực.
- Save kiểm tra lại lock token trước commit.
- Editor không đổi số hồ sơ; `quyenSo` bất biến khi edit.
- Bổ sung Rules/index cho `hsbaFileChoXoa`, filter, death pagination và storage lookup.
- `congKhai` tiếp tục public read; private nodes không mở rộng quyền.

## Performance / UI
- Patient page size 50, search/filter remote query.
- Death pagination.
- Dashboard summary, storage summary trước/detail lazy-load.
- Version check dùng `version.json`.
- Report lớn xử lý theo lô; Excel có `Khu lưu trữ`.
- Giữ phong cách UI hiện tại và tinh gọn mật độ thông tin.
