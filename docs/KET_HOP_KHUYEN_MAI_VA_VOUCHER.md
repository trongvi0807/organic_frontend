# Kết hợp mã khuyến mãi và quyền lợi từ điểm

## Chuẩn bị sau khi cập nhật

1. Dừng backend.
2. Nếu chưa có cấu trúc voucher, chạy `organic_backend/scripts/sql/20261102_customer_vouchers.sql`.
3. Chạy `organic_backend/scripts/sql/20261102_stack_promotion_and_voucher.sql`.
4. Khởi động backend mới, cập nhật và tải lại frontend.

File SQL thứ hai thay giới hạn một ưu đãi/đơn bằng một mã khuyến mãi và một voucher/đơn. Không tạo bảng mới hoặc sửa điểm, sản phẩm, đơn hàng. File này được chuẩn bị trong lần cập nhật này, **chưa chạy trên database local**. Không chỉ khởi động lại với `ddl-auto:update`: ràng buộc cũ cần được gỡ bằng migration.

## Chính sách

- Mỗi đơn chọn tối đa một mã khuyến mãi thông thường.
- Có thể dùng thêm **điểm trừ trực tiếp** hoặc **một voucher đã đổi bằng điểm**.
- Không kết hợp cả ba. Chọn voucher sẽ gỡ số điểm đang chọn để trừ trực tiếp; không làm mất số dư điểm.
- Dùng voucher từ trang Điểm thưởng giữ nguyên mã khuyến mãi đã chọn trong giỏ.
- Tính mã khuyến mãi trước. Tính voucher trên tiền hàng còn lại thuộc sản phẩm/lô được áp dụng. Hai phần áp dụng cho những lô khác nhau không trừ vào phạm vi của nhau.
- Điều kiện đơn tối thiểu của mỗi mã xét trên tổng tiền hàng trước giảm. Tổng giảm không vượt tiền hàng; không giảm phí giao hàng.
- Nếu mã khuyến mãi đã giảm hết phần hàng được áp dụng voucher, yêu cầu gỡ/đổi voucher; không giữ voucher mà không mang lại tiền giảm.
- Trừ điểm trực tiếp vẫn là 1 điểm = 2.000₫, tối đa 50 điểm/đơn và không vượt tiền hàng còn lại.
- Chương trình đổi điểm mới phải có mức giảm tối đa tiềm năng lớn hơn giá trị trừ trực tiếp của cùng số điểm. Với giảm theo phần trăm, số giảm thực tế còn phụ thuộc giá trị hàng đủ điều kiện. Không tự thay giá hoặc điều kiện voucher đã cấp.
- Khi hủy đơn chưa thanh toán, trả voucher về ví và giải phóng lượt mã khuyến mãi. Không hoàn điểm đã đổi voucher vì khách vẫn giữ voucher.
- Chỉ khi xác nhận thanh toán mới sử dụng voucher và tính lượt mã khuyến mãi. Đọc lại trạng thái không tính thêm lần nữa. Trả hàng theo số tiền thực trả đã phân bổ trên từng sản phẩm.

## Kiểm tra thủ công

Chuẩn bị tài khoản có đủ điểm, sản phẩm đủ tồn. Tạo hai chương trình cùng áp dụng các sản phẩm cần mua, còn hạn:

- Mã khuyến mãi thường giảm 20.000₫.
- Chương trình đổi 10 điểm lấy voucher 30.000₫, đơn tối thiểu 200.000₫, hạn dùng 5 ngày.

Giá trị và điều kiện trên dùng để hướng dẫn thao tác; không có chương trình hoặc điểm nào tự được nạp.

| Thao tác | Kết quả mong đợi |
|---|---|
| Tạo chương trình đổi 10 điểm lấy 20.000₫ | Báo cần mức giảm tốt hơn 20.000₫ |
| Đổi 10 điểm lấy voucher 30.000₫ | Trừ đúng 10 điểm, cấp một voucher |
| Giỏ 237.000₫, chọn mã thường và trừ trực tiếp 10 điểm | Khuyến mãi 20.000₫ + điểm 20.000₫, còn 197.000₫ |
| Chuyển sang Dùng voucher đã đổi, chọn voucher 30.000₫ | Mã thường giữ nguyên, điểm trực tiếp về 0, còn 187.000₫ |
| Chuyển lại Trừ điểm trực tiếp | Gỡ voucher khỏi đơn, mã thường vẫn giữ; khách tự chọn số điểm |
| Dùng nút Sử dụng voucher ở trang Điểm thưởng | Về giỏ với voucher đã chọn, mã thường giữ nguyên |
| Qua thanh toán, tải lại chi tiết đơn sau khi tạo | Lưu đúng hai mã, hai khoản giảm và tổng thanh toán |
| Nhập mã người khác hoặc voucher hết hạn | Từ chối, không trừ thêm điểm hoặc giữ mất voucher |
| Mã thường và voucher chỉ áp dụng sản phẩm khác nhau | Chỉ giảm trong đúng phạm vi từng mã |
| Voucher vượt tiền hàng còn lại đủ điều kiện | Chỉ giảm đến số tiền hàng còn lại |
| Mã thường đã giảm hết phần hàng của voucher | Yêu cầu gỡ/đổi voucher; không sử dụng mất voucher |
| Hủy đơn COD trước chuẩn bị | Giải phóng cả hai ưu đãi, voucher còn hạn dùng lại được |
| Thanh toán được xác nhận, tải lại nhiều lần | Mỗi mã chỉ tính một lượt, voucher dùng một lần |
| Gửi lại cùng lần đặt hàng sau mất mạng | Trả đúng đơn đã tạo, không tạo lại hoặc giữ voucher lần hai |
| Hai đơn đồng thời dùng cùng voucher | Chỉ một đơn được giữ voucher |

Đã kiểm tra build/biên dịch. Các kịch bản nghiệp vụ dành cho người dùng kiểm tra thủ công; chưa thực thi đặt đơn, đổi voucher, thanh toán hoặc hoàn tiền để kiểm thử.
