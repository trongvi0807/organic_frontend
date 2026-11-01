# Trả hàng và hoàn tiền bằng chuyển khoản

Thay thế luồng tự gửi lệnh hoàn VNPay cho khoản hoàn mới. Không cần thay đổi SQL: sử dụng bảng `refund_transactions` và lịch sử xử lý hiện có.

## Thao tác trên giao diện

1. Khách gửi yêu cầu. Nhân viên bán hàng phụ trách tiếp nhận, lập phương án và duyệt; tiền hoàn tính theo tiền hàng thực trả sau giảm giá và số lượng được duyệt.
2. Khách đồng ý phương án. Nhân viên chọn **Trao đổi & gửi bằng chứng** để trao đổi ngân hàng, tên chủ tài khoản và số tài khoản nhận tiền.
3. Mở lại hồ sơ, tại **Thực hiện hoàn tiền & giao hàng đổi**, chọn **Lưu tài khoản nhận tiền**. Chỉ lưu thông tin đã xác nhận với khách; không tự lấy tên người nhận hàng làm tên chủ tài khoản.
4. Tài khoản và số tiền được lưu, khoản hoàn có trạng thái **Chờ chuyển khoản**. Có thể sửa tài khoản trước khi xác nhận chuyển tiền. Tiền chưa được ghi nhận là đã hoàn.
5. Nếu cần thu hồi hàng: kho nhận, kiểm tra và nhập lại/loại bỏ hàng. Chỉ khi hoàn thành xử lý hàng thu hồi mới có nút **Xác nhận đã chuyển tiền**.
6. Nhân viên chuyển tiền bằng ứng dụng ngân hàng bên ngoài hệ thống. Kiểm tra đúng tài khoản và số tiền hiển thị, sau đó chọn **Xác nhận đã chuyển tiền**, nhập mã giao dịch, đánh dấu xác nhận và lưu. Ghi chú là tùy chọn ở bước này.
7. Hệ thống ghi nhận khoản hoàn **Đã hoàn tiền**, cập nhật trạng thái thanh toán của đơn gốc (`partially_refunded` hoặc `refunded`), lưu người thực hiện, thời gian và lịch sử/tin nhắn hệ thống. Cửa sổ tự đóng và dữ liệu được tải lại.
8. Bấm **Hoàn tất hồ sơ** sau khi đã đủ tiền hoàn, xử lý xong hàng thu hồi và giao đủ hàng đổi (nếu có). Hộp thoại chỉ giữ nội dung giải thích và nút **Xác nhận**, không yêu cầu ghi chú. Hệ thống tự lưu nội dung hoàn tất, người thực hiện và thời gian vào lịch sử.

Khách theo dõi tiến độ tại hồ sơ đổi trả. Số tài khoản đầy đủ chỉ trả cho nhân viên có quyền xử lý tài chính; khách và kho thấy số tài khoản được che. Thông tin nhập mới không lưu trong localStorage/sessionStorage.

## API bổ sung

### Lưu / sửa tài khoản nhận tiền

`POST /api/v1/management/return-requests/{id}/refund-bank-account`

Header: `Idempotency-Key`. Body:

```json
{
  "proposalVersion": 1,
  "recipientName": "Tên chủ tài khoản khách xác nhận",
  "bankAccountNumber": "0123456789",
  "bankName": "Vietcombank",
  "bankBranch": null,
  "recipientPhone": null
}
```

Không nhận số tiền từ frontend. Server tính phần còn được hoàn và tạo/cập nhật duy nhất một khoản `bank_transfer / pending` của hồ sơ. Được lưu trước khi kho xử lý xong, nhưng phải sau khi khách đồng ý.

### Ghi nhận chuyển khoản đã thực hiện

`POST /api/v1/management/return-requests/{id}/refunds/{refundId}/confirm-transfer`

Header: `Idempotency-Key`. Body:

```json
{
  "proposalVersion": 1,
  "referenceCode": "Mã giao dịch trên chứng từ ngân hàng",
  "confirmedTransferred": true,
  "bankAccountFingerprint": "Giá trị trả về trong thông tin khoản hoàn",
  "note": null
}
```

Hai API trả cấu trúc `RETURN_EXECUTION.Detail` hiện có, bổ sung quyền thao tác và thông tin tài khoản. Các quyền gồm `actions.canSaveBankAccount`, `refunds[].canEditBankAccount`, `refunds[].canConfirmTransfer`. `bankAccountFingerprint` bảo đảm nhân viên xác nhận đúng thông tin đang xem, tránh trường hợp người khác sửa tài khoản hoặc số tiền trong lúc cửa sổ đang mở.

## Ràng buộc và khoản hoàn VNPay cũ

- Chỉ nhân viên bán hàng phụ trách hoặc Admin có hồ sơ nhân viên đang hoạt động được lưu/xác nhận; khách và kho không thể gọi API chuyển tiền.
- Số tiền không vượt phương án được duyệt hoặc số tiền đã thu còn lại của đơn gốc. Chỉ hỗ trợ chuyển khoản VND trong luồng này.
- Khóa đơn gốc khi thao tác; yêu cầu gửi lại cùng mã không ghi nhận hai lần; mã giao dịch chuyển khoản không dùng lại ở khoản hoàn khác.
- Không tự tạo thêm lệnh hoàn VNPay cho khoản hoàn mới, kể cả cấu hình tự động cũ vẫn bật. Tác vụ nền chỉ tra cứu khoản VNPay đã gửi trước đây khi có mã tra cứu riêng.
- Khoản VNPay cũ đang xử lý/cần đối soát vẫn chặn chuyển khoản mới. Admin đối chiếu giao dịch thực tế: nếu đã hoàn thành công thì giữ kết quả đó; nếu xác minh không hoàn tiền thì mới cho lưu tài khoản và chuyển khoản. Không tự chuyển khoản thay cho khoản chưa rõ kết quả.
- Trạng thái hồ sơ vẫn là đang thực hiện cho tới khi nhân viên hoàn tất đủ điều kiện. Không đổi hồ sơ sang hoàn tất chỉ vì đã lưu tài khoản.
- Luồng này **ghi nhận chuyển khoản thực tế do nhân viên xác nhận**, không tích hợp lệnh chuyển tiền từ ngân hàng và không tự xác minh sao kê.

## Các điểm kiểm tra thủ công

- Lưu tài khoản, tải lại: còn tài khoản/tiền chờ hoàn, tiền đã hoàn vẫn bằng 0.
- Mở bằng tài khoản khách hoặc kho: số tài khoản được che, không có nút ghi nhận chuyển tiền.
- Chưa xử lý xong hàng trả: không xác nhận chuyển tiền được.
- Sửa tài khoản ở phiên khác: xác nhận theo cửa sổ cũ bị từ chối, phải tải lại.
- Chưa tích xác nhận hoặc thiếu mã giao dịch: báo lỗi tiếng Việt, không cập nhật tiền.
- Xác nhận thành công: cập nhật trạng thái đơn và lịch sử, khách thấy tiến độ mới sau khi tải lại/tự cập nhật.
- Gửi lại cùng thao tác: chỉ có một khoản hoàn thành công. Mã giao dịch đã dùng không được ghi nhận lại.
- Khoản VNPay cũ chưa rõ kết quả: không có nút lưu tài khoản/chuyển khoản mới.
- Co giãn ô ghi chú, nội dung nhiều dòng, màn hình hẹp: ô ghi chú và hàng nút nằm riêng, nút xuống dòng khi cần.

Đã kiểm tra tĩnh/biên dịch; không chạy bài kiểm thử tự động, không gửi lệnh hoàn tiền/chuyển khoản, không ghi dữ liệu vào database. Cần khởi động lại backend và tải frontend mới trước khi kiểm tra thủ công. Image Docker Hub `1.1.0` đã xuất bản trước thay đổi này chưa chứa luồng chuyển khoản mới.
