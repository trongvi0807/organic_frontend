# Quản lý đánh giá sản phẩm — 01-11-2026

## Chức năng

- Admin / Nhân viên bán hàng: vào **Bán hàng & Khách hàng → Đánh giá sản phẩm** (`/admin/reviews`).
- Danh sách theo sản phẩm: ảnh, tên, mã sản phẩm, tổng đánh giá, điểm trung bình, số đánh giá tích cực/trung lập/tiêu cực và tỷ lệ tiêu cực.
- Tìm sản phẩm theo tên/mã; lọc khoảng ngày đánh giá; xếp theo số tiêu cực, tỷ lệ tiêu cực, điểm thấp nhất hoặc số đánh giá; tùy chọn số đánh giá tối thiểu.
- Mở sản phẩm để tìm trong nội dung/tên khách/quy cách/mã đơn, lọc số sao và nhóm đánh giá. Các bộ lọc kết hợp với nhau; phân trang và xếp hạng do máy chủ thực hiện trên toàn bộ tập kết quả.
- 1–2 sao: tiêu cực; 3 sao: trung lập; 4–5 sao: tích cực. Đây là phân nhóm theo số sao, không phải phân tích cảm xúc từ nội dung.
- Tổng thống kê Admin gồm đánh giá có tác giả khớp tài khoản mua hàng, kể cả đánh giá hiện không công khai do đơn chuyển sang trạng thái khác. Danh sách công khai chỉ tính đơn đã giao/hoàn tất, nên tổng có thể khác nhau.

## Quy tắc phía khách hàng

- Phải sở hữu đơn đã giao hoặc hoàn tất của sản phẩm.
- Mỗi tài khoản khách chỉ có **một đánh giá đang tồn tại cho một sản phẩm**, dùng chung cho tất cả quy cách và các lần mua.
- Chọn một quy cách thực tế đã mua. Tiêu đề được sinh ở máy chủ từ tên sản phẩm + quy cách/trọng lượng, không lấy tiêu đề tự nhập từ trình duyệt.
- Bắt buộc 1–5 sao và bình luận ít nhất 10 ký tự không tính khoảng trắng ở hai đầu.
- Ảnh/video không bắt buộc. Nếu đính kèm: tối đa 5 ảnh (5 MB/ảnh), 1 video (50 MB), tổng 75 MB.
- Gửi chữ và tệp trong một yêu cầu. Nếu tải tệp hoặc ghi dữ liệu thất bại, giao dịch dữ liệu được hoàn tác và các tệp đã tải trong giao dịch được dọn.
- Sau khi gửi: không sửa sao/nội dung/tiêu đề, không thêm/sửa/xóa riêng tệp. Chỉ được xóa toàn bộ đánh giá.
- Chỉ thông báo được viết lại sau khi yêu cầu xóa thành công. Xóa lỗi hoặc chưa xong không mở quyền viết lại.
- Khóa hàng khách hàng trong giao dịch tạo/xóa, mức cô lập READ_COMMITTED: hai yêu cầu đồng thời từ hai lần mua/quy cách không tạo được hai đánh giá.
- Không cần thay đổi schema SQL. Dữ liệu đánh giá trùng từ trước không bị tự xóa; khách cần xóa các bài cũ nếu muốn viết lại.

## API bổ sung / điều chỉnh

| API | Đầu vào | Kết quả |
| --- | --- | --- |
| GET `/api/v1/management/reviews/products` | `search`, `sort=negative/negative-rate/lowest/most`, `minReviews>=1`, `from/to=yyyy-MM-dd`, `page`, `size<=50` | PageResponse: sản phẩm, ảnh, mã, tổng/điểm/số từng nhóm/tỷ lệ |
| GET `/api/v1/management/reviews/products/{id}` | `from`, `to` | Thống kê một sản phẩm |
| GET `/api/v1/management/reviews/products/{id}/reviews` | `search`, `rating=1..5`, `sentiment=all/negative/neutral/positive`, `sort=newest/oldest/lowest/highest`, `from/to`, `page`, `size` | PageResponse: khách, đơn, quy cách, sao, tiêu đề, nội dung, ngày, ảnh/video, trạng thái công khai |
| GET `/api/v1/reviews/eligibility` | `productId` | `canReview=false` nếu đã có đánh giá hoặc chưa nhận hàng |
| GET `/api/v1/reviews/eligible-items` | Thêm `productId` tùy chọn; giữ `page/size` | Các lần mua đã nhận, `reviewCount` tính trên toàn sản phẩm, thêm `reviewTitle` |
| POST `/api/v1/reviews/submission` | Multipart: phần `review` JSON `{productId, orderDetailId, rating, content}`; phần `files` tùy chọn, lặp nhiều tệp | OwnReviewResponse sau khi lưu thành công |
| POST `/api/v1/reviews` | JSON cũ | Vẫn hỗ trợ đánh giá chỉ có chữ; cùng quy tắc chống trùng và tiêu đề tự động |
| DELETE `/api/v1/reviews/{id}` | Đánh giá thuộc khách đang đăng nhập | Xóa thành công rồi mới cho viết lại |
| PUT đánh giá / POST thêm media / PATCH hoặc DELETE media riêng | Các đường dẫn cũ | 403: không cho sửa đánh giá đã gửi |

Quyền API quản lý: ADMIN hoặc SALES_STAFF; khách và nhân viên kho không có quyền truy cập.

Giới hạn multipart tổng tại Spring và Nginx đã nâng lên **80 MB** để chứa tối đa 75 MB tệp cùng thông tin yêu cầu; giới hạn từng tệp vẫn 50 MB. Khởi động lại backend để nhận thay đổi. Nếu dùng Docker, cần dựng lại image frontend để nhận cấu hình Nginx mới.

## Các bước tự kiểm tra thủ công

1. Khởi động lại backend và frontend. Chuẩn bị khách có đơn đã giao/hoàn tất và ít nhất hai quy cách/lần mua cùng sản phẩm.
2. Khách chưa nhận hàng: không gửi được đánh giá. Khách đã nhận: chọn quy cách 500 g / 1 kg và kiểm tra tiêu đề tự đổi đúng.
3. Gửi 5 sao + bình luận, không ảnh: phải thành công. Tải lại trang: bài còn được lưu, không có nút sửa.
4. Mở hai tab gửi đánh giá cùng sản phẩm (có thể chọn hai quy cách khác nhau): chỉ một bài được tạo, yêu cầu còn lại báo đã đánh giá.
5. Vào Đánh giá của tôi → Xóa → hủy hộp thoại: không được viết thêm. Xác nhận xóa thành công: viết lại được.
6. Gửi lại với ảnh/video: xem tệp ở trang sản phẩm, trang cá nhân và Admin. Kiểm tra chữ và tệp còn khi tải lại. Nếu một tệp lỗi, không được lưu bài dang dở.
7. Admin/Bán hàng mở trang đánh giá; đối chiếu tổng số, điểm trung bình, số 1–2 sao và tỷ lệ. Thử số đánh giá tối thiểu và từng kiểu xếp hạng.
8. Tìm tên/mã sản phẩm; mở sản phẩm; thử 1 sao, 2 sao, tiêu cực/tích cực/trung lập, tìm nội dung, mã đơn và khoảng ngày.
9. Thử truy cập `/admin/reviews` bằng tài khoản khách hoặc nhân viên kho: phải bị chặn.

Các bước trên để người dùng tự thực hiện. Chưa chạy thử nghiệp vụ, chưa ghi/xóa dữ liệu trong database hiện tại, chưa chạy bộ kiểm thử tự động. Chỉ kiểm tra biên dịch và cấu trúc mã nguồn.
