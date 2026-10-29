# Số tồn trên trang cửa hàng — 29-10-2026

## Kết quả đối chiếu

Phiếu nhập gần nhất đã có trạng thái `confirmed`, tạo tồn cho 12 mã hàng: SP03-01, SP05-01, SP06-01, SP07-01 có 10 đơn vị mỗi mã; SP08-01, SP09-01, SP14-01, SP15-01, SP16-01, SP22-01, SP23-01, SP24-01 có 6 đơn vị mỗi mã. Tổng là 88 đơn vị, chưa có hàng được giữ. Đây là ảnh chụp trạng thái tại thời điểm kiểm tra, không phải số cố định để hiển thị.

Yêu cầu đọc chi tiết SP03 trả HTTP 200 và `canAddToCart=true`. Yêu cầu đọc số lượng `GET /api/v1/products/{productId}/availability` không có đăng nhập trả HTTP 401, cả khi gọi trực tiếp cổng 8088 và qua cửa hàng cổng 5173.

Frontend dùng kết nối công khai cho danh mục và số tồn. Cấu hình bảo mật backend đã mở các đường dẫn chi tiết/related/reviews nhưng thiếu `availability`; vì vậy số lượng không tải được dù phiếu nhập đã duyệt.

## Thay đổi

- Backend `SecuriryConfig`: thêm `availability` vào nhóm đường dẫn sản phẩm công khai. Nhóm này chỉ cho GET/HEAD, không cấp quyền thay đổi tồn, xem truy xuất quản trị hoặc duyệt nhập.
- Giữ nguyên URL và cấu trúc phản hồi số lượng. Không thay dữ liệu kho hoặc cấu trúc bảng.
- Số tồn tải và làm mới tự động; không hiển thị nút “Tải lại số lượng” hoặc nút kiểm tra tồn thủ công ở thẻ, xem nhanh và chi tiết sản phẩm. Khi chưa tải được dữ liệu, hiển thị trạng thái chưa xác định thay vì coi là hết hàng.
- Thẻ sản phẩm đã tải và màn hình chi tiết cùng làm mới số lượng mỗi 30 giây khi tab đang hiển thị; vẫn cập nhật khi quay lại tab và sau thao tác liên quan.
- Các số hiển thị lấy theo đúng mã hàng, trừ số đã giữ và chỉ tính lô đã nhập duyệt/còn hạn. Lỗi tải không bị biến thành số 0.

## Áp dụng và kiểm tra thủ công

1. Khởi động lại Spring Boot để nhận cấu hình truy cập mới.
2. Tải lại trang cửa hàng. Xem SP03 (bí ngòi xanh), hiện có 10 gói ở thời điểm đối chiếu.
3. Kiểm tra trang chủ, danh sách sản phẩm và chi tiết quy cách. Trong Network, request `availability` cần trả 200 với bản đồ số lượng theo mã hàng.
4. Kiểm tra khi chưa đăng nhập và khi có phiên đăng nhập cũ; cả hai đều phải xem được số lượng công khai.
5. Phiếu còn nháp/chờ duyệt không tăng số bán được. Sản phẩm chưa nhận hàng hoặc lô đã hết hạn có thể vẫn hiển thị hết hàng.

Đã đọc dữ liệu và phản hồi API để xác định nguyên nhân, kiểm tra cú pháp JSX/JavaScript và khoảng trắng thay đổi. Bổ sung `PublicInventorySecurityTests` cho đọc ẩn danh, header token lỗi và quyền quản trị; chưa chạy bộ kiểm thử hoặc khởi động lại tiến trình backend của người dùng. Không tạo đơn/phiếu hoặc thay số tồn trong đợt sửa này.
