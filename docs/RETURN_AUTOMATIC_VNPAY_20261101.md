> Luồng hoàn tiền mới đã chuyển sang nhân viên chuyển khoản và xác nhận kết quả. Xem [RETURN_BANK_TRANSFER_20261101.md](RETURN_BANK_TRANSFER_20261101.md). Nội dung tự động bên dưới là mô tả phiên bản trước; chỉ giữ tra cứu/đối soát khoản VNPay đã gửi.

# Tự điền phương án và hoàn tiền VNPay

## Giao diện mới

- Chọn phương án hoặc đổi số lượng: hệ thống tự tính tiền và tạo nội dung sau khoảng 350 ms. Bỏ kết quả cũ khi người dùng thay đổi lựa chọn; không hiển thị phản hồi chậm của phương án trước.
- Không còn nhập tiền hoàn hay nội dung phương án thủ công. Tiền lấy từ đơn gốc, sau giảm giá, theo số lượng được duyệt trả; không lấy giá đang bán.
- Căn cứ xét duyệt chỉ xuất hiện khi có sản phẩm được duyệt cần xác minh chính sách. Không tự viết thay nội dung xác minh này.
- Khi khách đồng ý và kho xử lý xong hàng trả, tác vụ nền thực hiện hoàn VNPay. Trang tự đọc trạng thái mỗi 15 giây khi đang hiển thị, báo thành công ở góc trái khi ghi nhận khoản hoàn mới.
- Có tiến độ rõ ràng: chờ hàng trả, chờ VNPay, cần đối soát, đã hoàn. Các khoản chưa xác minh không hiển thị đã hoàn.

## Các bước bạn kiểm tra thủ công

1. Khởi động lại backend và frontend với mã mới. Dùng đơn VNPay đã được hệ thống ghi nhận đã thanh toán và còn số lượng có thể trả.
2. Khách mở chi tiết đơn, gửi yêu cầu trả/hoàn tiền.
3. Nhân viên bán hàng phụ trách tiếp nhận, mở Lập / sửa phương án.
4. Đổi số lượng và phương án: kiểm tra tiền và nội dung tự đổi, ô tiền/nội dung chỉ đọc. Ví dụ tiền hàng thực trả 90.000 đồng cho 2 sản phẩm, duyệt trả 1 thì tiền hoàn là 45.000 đồng. Phí giao hàng không tự hoàn.
5. Nếu có cảnh báo cần xác minh chính sách, ghi căn cứ xét duyệt, rồi duyệt và gửi khách xác nhận.
6. Khách bấm Đồng ý phương án → Xác nhận, không cần nhập nội dung. Hệ thống tự ghi nhận người xác nhận, thời gian và phiên bản phương án. Với trả hàng, kho nhận đủ hàng và xử lý hết phần giữ riêng. Khi đối chiếu lô gốc, chỉ chọn lô rồi xác nhận. Khi ghi kết quả kiểm tra, nhập số đạt/không đạt rồi xác nhận; hai thao tác này không cần ghi chú và tự lưu nội dung lịch sử. Sau kiểm tra, thực hiện nhập lại phần đủ điều kiện hoặc ghi nhận loại bỏ theo thực tế để hoàn tất xử lý kho.
7. Giữ trang tiến độ hoặc mở lại sau: hệ thống tự gửi lệnh hoàn VNPay. Không cần bấm thực hiện hoàn hay kiểm tra tại cổng cho luồng tự động này.
8. Khi VNPay xác nhận thành công, tổng đã hoàn tăng, đơn gốc cập nhật trạng thái thanh toán và có thông báo ở góc trái. Tải lại để kiểm tra lịch sử và tiền được lưu.
9. Nếu cổng chưa xác nhận, trang phải giữ đang xử lý/cần đối soát. Không được báo thành công, không được tạo thêm khoản hoàn khi mở nhiều tab hay tải lại.
10. Sau khi đủ tiền hoàn/hàng đổi/xử lý kho, nhân viên bấm Hoàn tất hồ sơ như luồng hiện tại.

Lưu ý: chỉ phương án được duyệt từ bản cập nhật này mới bật hoàn tự động. Hồ sơ đã được khách chấp nhận trước khi cập nhật vẫn theo luồng xử lý cũ. Hồ sơ cũ còn sửa được phương án có thể duyệt lại rồi khách xác nhận phiên bản mới. Trang hiển thị rõ trường hợp này.

Merchant VNPay cần hỗ trợ hoàn tiền và backend phải có thông tin giao dịch gốc hợp lệ. Nếu cấu hình hoặc giao dịch chưa đủ, trang hiển thị lý do cần kiểm tra; không tự đánh dấu thành công.

## Phạm vi xác minh

Build frontend và biên dịch backend không chạy kiểm thử. Không thực hiện giao dịch, không thao tác CSDL nghiệp vụ; các bước trên dành cho bạn kiểm tra thủ công. Không cần sửa SQL cho thay đổi này.
