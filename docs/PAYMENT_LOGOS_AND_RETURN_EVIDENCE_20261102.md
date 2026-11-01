# Logo thanh toán, số 0 và ảnh minh chứng đổi trả

## Logo

- VNPay: ảnh PNG người dùng cung cấp.
- PayPal: ảnh PNG người dùng cung cấp.
- VietQR: ảnh PNG từ đường dẫn người dùng cung cấp: https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQxYwcDHdAcQN2QxVTKIL951fKlJLe4T62KwgxWtQVvKQ&s=10
- Stripe: wordmark Blurple từ [bộ nhận diện chính thức](https://stripe.com/newsroom/information), [logo kit](https://assets.stripeassets.com/fzn2n1nzq965/7q0dJGs6fRS1LRmMpChoAF/87def4edfbb7fd5aef4ab9baf904b2db/Stripe_logo_kit.zip). Ảnh bài viết FPT được gửi có cả Stripe và PayPal nên không dùng làm logo riêng.

File được lưu tại `public/images/payments/` và đóng gói cùng frontend. Không gọi ảnh bên ngoài khi khách chọn thanh toán. `PaymentBrand` dùng chung tại danh sách phương thức, trang kết quả và chi tiết đơn. VietQR vẫn sử dụng khóa `payos` và luồng thanh toán hiện có.

## Số 0

Bộ định dạng tiền và các chỗ định dạng số sử dụng `signDisplay: negative`: số âm thật vẫn có dấu trừ; âm 0 hoặc số âm làm tròn thành 0 hiển thị không có dấu trừ. Các dòng giảm giá/đổi điểm gửi giá trị âm vào bộ định dạng, thay cho nối dấu trừ vào chuỗi đã định dạng. Không thay đổi dữ liệu hay cách tính giá.

## Ảnh minh chứng đổi trả

- Form **Yêu cầu Đổi/Trả** bắt buộc có ít nhất 1 ảnh, tối đa 5 ảnh JPG/PNG/WebP, tối đa 5 MB mỗi ảnh.
- Cho phép chọn ảnh nhiều lần, xem trước và bỏ ảnh trước khi gửi. URL xem trước được thu hồi khi thay ảnh/đóng form.
- Gửi thông tin và ảnh cùng một request `POST /api/v1/return-requests`, kiểu `multipart/form-data`: part `request` là JSON (`application/json`), các part `images` là ảnh.
- Backend kiểm tra cả loại tệp và nội dung ảnh, giới hạn kích thước bằng dịch vụ lưu trữ hiện có. Lưu yêu cầu, phản hồi liên quan và ảnh trong cùng transaction. Nếu tải ảnh thất bại thì không giữ hồ sơ đổi trả tạo dở; các ảnh đã tải của transaction bị rollback được đưa qua cơ chế xóa Cloudinary hiện có.
- Khóa chống trùng bao gồm nội dung JSON và hash của từng ảnh. Gửi lại cùng khóa/nội dung/ảnh không tạo thêm hồ sơ hoặc upload thêm ảnh. Cùng khóa với ảnh hoặc thông tin khác bị từ chối.
- API JSON cũ chỉ nhận tạo mới khi `feedbackId` trỏ tới phản hồi của đúng khách/đơn đã có ảnh gắn trực tiếp. Không thể tạo yêu cầu mới không ảnh qua API JSON. Hồ sơ cũ vẫn xem và xử lý được.
- `ReturnViews.Detail.evidence` trả ảnh minh chứng. Khách và nhân viên xem được ảnh trong hồ sơ đổi trả; nhân viên cũng thấy khi lập phương án. Ảnh đã thuộc hồ sơ không được xóa bằng chức năng xóa ảnh của phản hồi.
- Chủ đề phản hồi tự tạo dùng tên tiếng Việt thay cho `return_refund`/`exchange`/`refund`.
- Không thêm/sửa SQL. Dùng bảng `feedback_media` và các bảng đổi trả hiện có. Cần khởi động lại backend để nhận endpoint multipart, tải lại frontend mới.

## Kiểm tra thủ công

1. Mở form từ đơn đủ điều kiện; bỏ trống ảnh và bấm gửi: báo cần ảnh, chưa tạo hồ sơ.
2. Thêm ảnh JPG/PNG/WebP; xem ảnh, thêm ảnh khác và bỏ ảnh. Thử ảnh quá 5 MB hoặc quá 5 ảnh: thông báo tiếng Việt, không nhận lựa chọn sai.
3. Điền đủ lý do, mô tả và số lượng; gửi: hồ sơ chỉ báo thành công sau khi lưu đủ ảnh.
4. Mở lại chi tiết hồ sơ, tải lại trang; ảnh vẫn còn. Tài khoản nhân viên phụ trách thấy ảnh ngay trong hồ sơ/lập phương án và trong phản hồi liên quan.
5. Nếu tải lên thất bại: không báo thành công. Lần thử lại giữ nguyên nội dung, ảnh và mã thao tác khi kết quả chưa rõ, tránh tạo trùng.
6. Kiểm tra giỏ hàng, thanh toán, chi tiết đơn: giảm giá hoặc đổi điểm bằng 0 hiển thị `0 ₫`; số tiền giảm thật vẫn có dấu trừ.
7. Kiểm tra bốn logo trên màn hình rộng/hẹp, chọn phương thức và trạng thái không khả dụng.

Chỉ kiểm tra biên dịch/phân tích mã. Không chạy kiểm thử nghiệp vụ tự động, không tải ảnh vào Cloudinary, tạo đơn hoặc sửa dữ liệu thật.
