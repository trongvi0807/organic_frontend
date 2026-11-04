# Footer và các trang chính sách

Footer sử dụng thông tin liên hệ công khai tại https://organicfood.vn/ và nội dung người dùng cung cấp ngày 04/11/2026: giờ hoạt động, cửa hàng Quận 1/Quận 2, văn phòng/kho, nông trại, hotline, email, thông tin doanh nghiệp và mã hồ sơ chứng nhận. Các mã trong footer là thông tin công bố, không tự gán chứng nhận cho sản phẩm trong cơ sở dữ liệu.

Các trang mới mở được khi chưa đăng nhập:

| Đường dẫn | Nội dung |
| --- | --- |
| `/chinh-sach-tich-diem` | Tích điểm khi hoàn tất, hai cách dùng điểm, voucher và điều chỉnh sau trả hàng |
| `/chinh-sach-doi-tra` | Điều kiện theo sản phẩm, gửi ảnh, xác nhận phương án, thu hồi hàng và hoàn tiền |
| `/chinh-sach-giao-hang` | Địa chỉ nhận, điểm ghim, thời gian theo tuyến thực tế và giới hạn của dự kiến |
| `/chinh-sach-bao-mat` | Dữ liệu được sử dụng, vị trí nhận, ảnh, bên hỗ trợ xử lý, tài khoản và yêu cầu hỗ trợ |
| `/phuong-thuc-thanh-toan` | COD, VNPay, VietQR, Stripe, PayPal; phân biệt chờ và đã xác nhận thanh toán |
| `/huong-dan-mua-hang` | Chọn hàng/quy cách, giỏ, ưu đãi, đặt đơn và hỗ trợ sau mua |
| `/dieu-khoan-dich-vu` | Sử dụng tài khoản, thông tin giao dịch, chứng nhận và nội dung gửi lên |

Nội dung nằm trong `src/constants/policies.js`, giao diện dùng chung `PolicyPage.jsx`. Footer dẫn tới chính sách của dự án, không dẫn khách sang website tham khảo để đọc các quy tắc khác với hệ thống đang dùng. Các đường dẫn `/pages/<slug>` cũng chuyển về trang tương ứng.

Nội dung bám mã nguồn hiện tại, không sao chép nguyên chính sách vận hành bên ngoài. Điểm hiện là 100.000₫/điểm khi hoàn tất, giá trị dùng 2.000₫/điểm và tối đa 50 điểm/đơn. Khi thay đổi các tỷ lệ trong backend cần cập nhật trang chính sách cùng lúc. Không áp thời hạn 24 giờ cho mọi sản phẩm: backend xét thời hạn theo danh mục và trường hợp cần nhân viên xác minh. Hồ sơ hoàn tiền mới thực hiện chuyển khoản có nhân viên xác nhận giao dịch thực tế.

## Điểm xuất phát giao hàng

- Frontend: `src/constants/store.js`.
- Backend: giá trị mặc định trong `RoutingConfig.Properties`.
- Địa chỉ: **123 Đinh Tiên Hoàng, Quận 1, Thành phố Hồ Chí Minh**.
- Tọa độ: **10.790650, 106.697009**, đồng nhất với vị trí đã lưu trong cấu hình local hiện tại.
- Cấu hình riêng đã lưu vẫn được ưu tiên. Admin có nút “Dùng cửa hàng này” để điền lại vị trí Quận 1, sau đó lưu khi muốn thay cấu hình riêng.
- Khi sửa địa chỉ bằng tay, tọa độ cũ được bỏ để tránh tính từ một địa điểm không còn khớp địa chỉ.

Không thêm bảng/cột, không tự sửa dữ liệu đơn hàng hoặc khóa API. Khởi động lại backend để nhận mặc định mới.
