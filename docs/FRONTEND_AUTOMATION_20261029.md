# Tự động xác nhận thanh toán và điền phiếu nhập — 29/10/2026

Phạm vi: chỉ frontend, dùng API hiện có. Không chỉnh backend, SQL hoặc dữ liệu; không chạy thanh toán/duyệt/nhập kho để thử.

## Thanh toán

- Trang `/payment/result` bỏ nút **Đối chiếu với cổng**, **Xác nhận giao dịch PayPal** và nút kiểm tra trạng thái thủ công trong phần kết quả. Có tiến độ xác minh tự động, thông báo thành công góc trái khi API trả `paid`, và liên kết theo dõi đơn hàng.
- Stripe tự gọi `POST /api/v1/payments/{paymentId}/sync` khi lần thanh toán còn chờ. API đối chiếu cổng và cập nhật cả thanh toán/đơn hàng; frontend không gọi endpoint giả để tự gán `paid`.
- PayPal tự đối chiếu trước. Nếu đã thu tiền thì không gọi capture nữa. Khi khách quay lại từ PayPal sau chấp thuận (URL trả về do backend tạo có `gateway=paypal` và PayPal bổ sung `token`), hoặc giao dịch đang `capturing`, frontend tự gọi `POST /api/v1/payments/{paymentId}/paypal/capture`. Không capture ở trang hủy hoặc chỉ vì URL có `status=paid`.
- URL/token chỉ chọn quy trình cần thực hiện. Backend dùng giao dịch đã lưu và kiểm tra sở hữu, tình trạng thực ở cổng, tiền tệ/số tiền. Chỉ API trả `paid` mới hiển thị thành công và phát thông báo làm mới đơn hàng.
- Giữ bước xác minh chữ ký VNPay hiện có. Liên kết VNPay thiếu dữ liệu trả về được đối chiếu tự động một lần; không QueryDR liên tục.
- Gộp các lời gọi đồng thời để tránh React StrictMode/re-render tạo nhiều lệnh thu tiền. Capture sử dụng cơ chế chống trùng sẵn có ở backend. Stripe/PayPal giới hạn tối đa 6 lượt đối chiếu tự động mỗi đợt trạng thái, cách nhau 15/20 giây; đọc trạng thái nền mỗi 4 giây vẫn tiếp tục để nhận xác nhận đến sau từ webhook. Khi tab ẩn, hoãn truy vấn; mở lại tiếp tục cập nhật.
- Lỗi mạng và `requires_review` không được đổi thành thành công. Không tự tạo lần thanh toán mới để xử lý giao dịch đang chờ. API có trạng thái thực tế khác với trạng thái người dùng mong đợi vẫn được giữ nguyên.

## Mã vận chuyển

- Mở hộp thoại tạo chuyến ở Đơn bán hoặc Giao hàng đổi sẽ có sẵn mã `VC-yyyyMMdd-...`, ví dụ `VC-20261029-A1B2C3D4E5F6`.
- Mã này là tham chiếu chuyến nội bộ trong trường `trackingCode` hiện có; có thể thay bằng mã vận đơn mà đơn vị vận chuyển cung cấp. Không tự tuyên bố đã đăng ký chuyến với một hãng vận chuyển bên ngoài.
- Tránh trùng với mã chuyến đã có trên đơn; mã được giữ trong form khi lỗi, không tự đổi theo mỗi lần render. Không có schema/unique constraint mới cho mã chuyến trong đợt chỉ frontend này.

## Duyệt đơn / duyệt nhập

- Khi duyệt Đơn mua hoặc Phiếu nhập: chỉ xác nhận mã chứng từ và nội dung quyết định, không có ô ghi chú. Gửi `note=null` theo API hiện có.
- Bước gửi phiếu nhập cũng không có ô ghi chú quyết định vì API gửi duyệt không dùng trường đó. Ghi chú nội dung phiếu vẫn nằm ở form lập/sửa phiếu.
- Từ chối/hủy vẫn có lý do bắt buộc. Từ chối dùng danh sách gợi ý; chọn Khác cần nhập nội dung cụ thể.
- Người duyệt và ngày duyệt tiếp tục do backend ghi nhận. Hộp thoại đóng sau khi thao tác thành công.

## Điền sẵn phiếu nhập thủ công

- Ngày sản xuất mặc định là ngày lập phiếu theo múi giờ Việt Nam; sửa một phiếu cũ dùng ngày lập của phiếu đó, không đổi thành hôm nay.
- Hạn sử dụng gợi ý = ngày sản xuất + 10 ngày theo lịch, tính đúng khi sang tháng/năm hoặc năm nhuận. Cho sửa cả hai trường.
- Đổi ngày sản xuất sẽ tính lại hạn gợi ý. Nếu người dùng đã chủ động sửa hạn dùng, giữ giá trị đó khi đổi ngày sản xuất để không xóa thông tin đã đối chiếu trên nhãn hàng.
- Giữ ngày sản xuất/hạn dùng/nguồn gốc đã lưu trên lô. Giá trị mặc định chỉ dùng cho phần còn thiếu; không ghi đè HSD có thật của lô cũ.
- Lấy xuất xứ đúng từng sản phẩm bằng `GET /api/v1/products/{productId}/traceability`, dùng tên xuất xứ/cơ sở/vùng/quốc gia từ `origin`. Cùng sản phẩm có nhiều quy cách chỉ cần tra một lần; tối đa 4 truy vấn song song.
- Cho sửa trường xuất xứ. Nội dung sửa gửi vào `originDescription` của lô trong phiếu; không âm thầm đổi liên kết xuất xứ trên hồ sơ sản phẩm. Thông tin nhập tay, kể cả xóa trống có chủ đích, không bị phản hồi mạng đến sau ghi đè.
- Sản phẩm chưa gắn nguồn gốc để trống, không suy ra theo tên nhà cung cấp. Tra cứu lỗi có thông báo/tải lại và cho điền theo nhãn hàng.
- Chỉ gửi các trường được API Phiếu nhập chấp nhận, không gửi các cờ tự động của giao diện. Luồng Excel tiếp tục dùng nội dung file và kiểm tra của chức năng nhập Excel; không tự sửa ngày/hạn dùng đã điền trong Excel ở đợt này.

## Kiểm tra thủ công

1. Tạo chuyến giao đơn bán và đơn đổi: mã tự có, nhập hãng giao hàng, lưu; mở lại xem mã đã lưu. Nếu thay bằng mã của hãng, giữ đúng mã đó.
2. Thanh toán Stripe: hoàn tất ở Stripe và quay về; không có nút đối chiếu, trang tự gọi sync và hiển thị theo kết quả API. Kiểm tra đơn hàng trong trang quản trị tự cập nhật.
3. PayPal: chấp thuận thanh toán, quay về; không bấm thêm nút xác nhận, backend tự được gọi capture và trang hiện thành công sau kết quả `paid`. Thử quay về trang hủy: không tự capture.
4. Tải lại trang kết quả/đóng mở tab: không tạo thanh toán khác; giao dịch đã `paid` không bị capture lại. Chưa rõ kết quả không hiển thị thành công.
5. Duyệt Đơn mua và Phiếu nhập: không còn ô ghi chú; kiểm tra người/ngày duyệt. Từ chối phải có lý do, chọn Khác phải nhập cụ thể.
6. Lập phiếu nhập ngày 29-10-2026: NSX gợi ý 29-10-2026, HSD 08-11-2026. Đổi NSX 28-10-2026: HSD tự thành 07-11-2026 nếu còn dùng hạn gợi ý. Sửa HSD rồi đổi NSX: HSD đã sửa được giữ.
7. So xuất xứ trong hồ sơ sản phẩm với phiếu nhập, sửa nội dung rồi lưu/mở lại lô. Thử gõ trong lúc đang tải xuất xứ: phần đã gõ không bị ghi đè. Phiếu/lô cũ giữ HSD và xuất xứ đã lưu.

Đã bổ sung/cập nhật source regression tests về điều phối thanh toán, không suy diễn thành công từ URL, chống gửi lặp, ngày tháng, giữ sửa tay, tra cứu xuất xứ và mã chuyến. **Chưa chạy tests/build hoặc gọi API nghiệp vụ theo yêu cầu người dùng tự kiểm tra thủ công.** Kiểm tra cú pháp/import không thay thế chạy và đối chiếu với cổng thực tế.
