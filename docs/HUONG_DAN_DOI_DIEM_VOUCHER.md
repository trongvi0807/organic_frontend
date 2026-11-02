# Hướng dẫn sử dụng điểm đổi voucher

## Mở chức năng

Sau khi cập nhật, khởi động lại backend bằng code mới và tải lại frontend. Cấu trúc voucher cơ bản đã có trên database local. Để kết hợp hai ưu đãi, cần chạy thêm `organic_backend/scripts/sql/20261102_stack_promotion_and_voucher.sql` khi backend đã dừng. Máy mới chạy `20261102_customer_vouchers.sql` trước, rồi chạy migration kết hợp ưu đãi.

## 1. Tạo ưu đãi trong Admin

1. Vào **Bán hàng & Khách hàng → Khuyến mãi → Tạo mã ưu đãi**.
2. Nhập tên, hình thức giảm, số tiền giảm, đơn tối thiểu và thời gian áp dụng như trước.
3. Ở **Cách nhận ưu đãi**, chọn **Đổi điểm lấy voucher riêng**.
4. Nhập **Số điểm cần đổi** và **Hạn dùng kể từ khi đổi**. Điểm và hạn dùng phải là số nguyên dương, hạn tối đa 365 ngày.
5. Chọn sản phẩm áp dụng; đặt trạng thái hoạt động rồi lưu. Mức giảm tối đa cần lớn hơn số tiền trừ trực tiếp của cùng số điểm.

Ví dụ để kiểm tra thủ công: 1 điểm đổi voucher giảm 10.000đ, đơn từ 100.000đ, hạn dùng 5 ngày; chương trình phải còn hạn và có sản phẩm đang bán. Đây chỉ là cấu hình minh họa trong tài liệu, hệ thống không tự tạo chương trình hoặc cộng điểm.

Giới hạn tổng lượt bao gồm cả voucher đã cấp còn hiệu lực/đang giữ. Không thể sửa điều kiện sau khi khách đã đổi. **Ngừng mã** ngừng đổi mới; voucher đã cấp được giữ quyền sử dụng đến hạn.

## 2. Khách nhận điểm

Điểm được cộng khi đơn đã giao, đã trả tiền và được cửa hàng hoàn tất. Số dư hiện tại không được tự tăng sau khi cập nhật tính năng. Nếu chưa có điểm, cần hoàn tất luồng mua hàng trước.

## 3. Đổi điểm

1. Đăng nhập tài khoản khách hàng.
2. Mở menu tài khoản → **Điểm thưởng & voucher**, hoặc vào `/diem-thuong`.
3. Chọn **Đổi điểm lấy voucher**, xem mức giảm, sản phẩm áp dụng, đơn tối thiểu và hạn dùng.
4. Bấm **Đổi voucher → Xác nhận đổi điểm**.
5. Thành công: điểm giảm đúng một lần, voucher xuất hiện trong **Voucher của tôi**, lịch sử điểm có nội dung tương ứng.
6. Nếu mất mạng/chưa rõ kết quả, dùng **Kiểm tra lại lần đổi trước**. Không tạo lần đổi mới cho đến khi đã kiểm tra. Tải lại cùng tab vẫn giữ được lần xác nhận đang chờ.

## 4. Sử dụng

1. Trong **Voucher của tôi**, bấm **Sử dụng** để chọn voucher và về giỏ hàng.
2. Hoặc ở giỏ hàng/thanh toán, chọn **Quyền lợi từ điểm → Dùng voucher đã đổi**, rồi chọn voucher của bạn. Mã khuyến mãi thông thường chọn ở ô riêng phía trên.
3. Voucher đổi điểm sẽ bỏ lựa chọn trừ điểm trực tiếp của đơn này. Mã khuyến mãi đã chọn vẫn giữ nguyên. Không trừ thêm điểm khi đặt đơn.
4. Đủ điều kiện: tổng tiền hiển thị mức giảm; chưa đủ điều kiện: thông báo nguyên nhân bằng tiếng Việt.
5. Tạo đơn: voucher chuyển **Đang giữ cho đơn hàng**. Thanh toán được xác nhận: **Đã sử dụng**.

## 5. Danh sách kiểm tra thủ công

| Thao tác | Kết quả mong đợi |
|---|---|
| Tài khoản chưa đủ điểm | Không đổi được; không phát sinh voucher |
| Đổi thành công và tải lại | Voucher và lịch sử vẫn có, số dư đã giảm |
| Gửi lại lần xác nhận cũ sau mất mạng | Trả đúng voucher, không trừ điểm lần hai |
| Điều kiện ưu đãi đổi trước khi xác nhận | Yêu cầu tải lại/xem lại; không trừ điểm theo điều kiện khác |
| Khách khác nhập mã voucher | Bị từ chối |
| Nhập mã chương trình đổi điểm thay mã riêng | Bị từ chối; phải đổi điểm trước |
| Đơn chưa đủ mức tối thiểu hoặc sai sản phẩm | Không áp dụng; chưa dùng mất voucher |
| Xem trước tổng tiền rồi rời trang | Voucher chưa bị giữ |
| Tạo đơn chưa thanh toán | Voucher đang giữ, không chọn được cho đơn thứ hai |
| Hủy đơn chưa thanh toán | Voucher còn hạn được dùng lại, điểm không bị trừ thêm hoặc hoàn trùng |
| Thanh toán được xác nhận rồi tải lại | Voucher đã dùng; không áp dụng lần hai |
| Voucher quá hạn | Hiển thị hết hạn, không sử dụng được |
| Chương trình hết tổng lượt | Không cấp vượt hạn mức; thất bại không mất điểm |
| Ngừng chương trình sau khi đã cấp voucher | Không đổi mới; voucher đã cấp còn hạn vẫn dùng được |

Không có bài kiểm thử nghiệp vụ tự động nào được chạy và không có dữ liệu mẫu được nạp trong lần cập nhật này.

Chi tiết cách kết hợp và các bước kiểm tra: [Kết hợp khuyến mãi và voucher](KET_HOP_KHUYEN_MAI_VA_VOUCHER.md).
