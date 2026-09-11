# PERFORMANCE REPORT — HSBA 2026.09.11.2

## Bottleneck đã xử lý

1. **Save quyển**: bỏ full-read `quyenHoSo`; dùng scoped `hsbaViTriLuuTru` + transaction.
2. **Gợi ý vị trí**: đọc/index theo khu-thùng thay vì quét toàn bộ book.
3. **Patient list**: page size 50; Load more chỉ tải page tiếp.
4. **Status filter**: query Firebase theo field/index, không chỉ lọc page đã tải.
5. **Hồ sơ tử vong**: pagination 50 record.
6. **Dashboard**: dùng derived summary; không full-scan books trong đường chạy thường.
7. **Kho**: summary trước, detail lazy-load; giảm DOM lớn.
8. **Realtime**: debounce/coalesce, giữ page/filter context.
9. **PWA version**: dùng `version.json` nhỏ thay vì tải toàn `index.html` định kỳ.
10. **Report**: xử lý theo lô và yield event loop mỗi 100 hồ sơ.
11. **File cleanup**: hàng đợi `hsbaFileChoXoa` có query giới hạn; retry không cần scan database và không phụ thuộc bộ nhớ trình duyệt.

## Cache / memory

- Không đưa toàn bộ HSBA private vào localStorage/IndexedDB/Service Worker Cache.
- Cache runtime ưu tiên page/detail/summary; private state được dọn khi logout/đổi quyền.
- File Base64 chỉ dùng trong luồng upload và không được ghi RTDB.

## Synthetic benchmark

Kết quả vòng kiểm tra cuối trên môi trường thực thi hiện tại:

- 500 hồ sơ / 1.500 quyển: ~0.38 ms traversal mô hình.
- 2.000 hồ sơ / 6.000 quyển: ~2.56 ms.
- 5.000 hồ sơ / 15.000 quyển: ~3.72 ms.

Các số trên chỉ đo vòng xử lý synthetic trong bộ test, **không phải latency Firebase/Internet thực tế**. Mục đích là xác nhận thuật toán không phát sinh tăng trưởng bất thường trong mô hình dữ liệu lớn.

## Giới hạn còn lại

- Báo cáo toàn hệ thống vẫn phải đọc nhiều dữ liệu khi người dùng chủ động xuất báo cáo; đây là đường chạy có chủ đích, đã có chunk/yield để giảm freeze.
- Hiệu năng thực tế phụ thuộc mạng, Firebase region, thiết bị và kích thước file Google Drive.
- Cần Smoke test sau deploy để xác nhận latency và quyền Rules trong project thật.
