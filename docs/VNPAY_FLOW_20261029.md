# VNPay: cửa hàng và Admin đồng bộ thanh toán — 29-10-2026

## Đã sửa

- Khi khách quay về `/payment/result?...vnp_...`, frontend gửi toàn bộ trường VNPay đến `POST /api/v1/payments/vnpay/return`. Backend xác minh chữ ký, merchant, chủ đơn, tham chiếu và số tiền, rồi lưu kết quả trong database.
- Kết quả `00/00` hợp lệ, đơn còn đủ điều kiện: backend lưu thanh toán `paid` và đơn `paid`; frontend hiện “Thanh toán thành công” cùng toast góc trái. Không đợi Admin xác nhận thu tiền; chưa coi là giao hàng hoàn tất.
- IPN và Return dùng chung xử lý chống trùng; tải lại trang không trừ điểm/ưu đãi hai lần.
- Đọc lại qua `GET /api/v1/payments/vnpay/reference/{reference}`, kể cả mất dữ liệu trình duyệt hoặc paymentUrl đã ẩn. Không còn quét danh sách đơn để đoán lần thanh toán.
- Mở kết quả từ chi tiết đơn không có query ký: tự đối chiếu QueryDR một lần qua `POST /api/v1/payments/{id}/sync`. Poll thường là GET, không gọi QueryDR mỗi 4 giây. Có nút đối chiếu thủ công; backend dùng lại kết quả QueryDR trong 5 phút theo giới hạn VNPay.
- Nếu cần đăng nhập lại sau thanh toán, giữ nguyên URL Return và quay lại xác minh sau đăng nhập đúng chủ đơn.
- Chặn tham số VNPay bị lặp/thiếu; không dùng riêng `vnp_ResponseCode=00` hoặc `status=paid` trên URL để hiển thị đã thu tiền. Kết quả cũ từ request đang chạy không ghi đè kết quả đối chiếu mới hơn hoặc tài khoản khác.
- Đơn/Admin đã tự làm mới; bổ sung tự làm mới danh sách đối soát mỗi 30 giây và khi quay lại tab.

## Ngoại lệ

Tiền đến sau khi đơn/phiên hết hạn, hàng đã giải phóng hoặc đơn bị hủy vẫn chuyển `requires_review`. Mã nghi ngờ/đảo/hoàn tiền không được coi là trả thành công hay cho thanh toán thêm. Không tự hồi sinh đơn cũ.

## Áp dụng và kiểm tra thủ công

1. Khởi động lại `organic_backend` và tải lại `organic_frontend`. Không cần sửa schema/SQL cho thay đổi này.
2. Frontend `http://localhost:5173`, backend `http://localhost:8088`. Vite proxy `/api` sang 8088; Network hiển thị request ở 5173 là bình thường.
3. Đăng nhập CUSTOMER, tạo đơn mới, chọn VNPay và hoàn tất Sandbox trước hạn.
4. Sau khi quay về, Network cần có POST `/api/v1/payments/vnpay/return` trả HTTP 200, `data.status=paid`, đúng `orderId`. Toast thành công xuất hiện góc trái.
5. Mở chi tiết đơn và Admin: trạng thái thanh toán đã trả. Danh sách Admin tự đọc lại mỗi 30 giây, chi tiết mỗi 5 giây, hoặc khi quay lại tab.
6. Tải lại trang và mở lại từ đơn: không ghi nhận lần hai. Hủy tại VNPay không báo thành công. Sửa số tiền/chữ ký phải bị từ chối.
7. Nếu bị yêu cầu đăng nhập lại, dùng đúng tài khoản đã đặt đơn; URL Return được giữ để tiếp tục.

Return giúp cập nhật ngay khi khách quay về dù IPN chưa đến. Khách đóng tab trước Return thì cần IPN HTTPS công khai để VNPay chủ động báo backend. Đợt này không tự mở tunnel hoặc đổi đăng ký merchant.

Hợp đồng API chi tiết: [backend VNPay](../../organic_backend/docs/VNPAY_RETURN_20261029.md).

Đã rà cú pháp JavaScript/JSX và bổ sung regression tests. Chưa chạy test, build hay giao dịch Sandbox theo yêu cầu người dùng tự kiểm tra thủ công. Không thay dữ liệu kinh doanh trong đợt sửa này.
