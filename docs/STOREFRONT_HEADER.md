# Header cửa hàng: tìm kiếm, tài khoản, giỏ hàng và thông báo

Cập nhật 28-10-2026, chỉ sửa frontend.

## Hành vi

- **Thêm giỏ hàng**: nút xanh có chữ trên ProductCard dùng chung Trang chủ/Sản phẩm, hiện đang thêm rồi đã thêm. Chặn bấm lặp khi request chưa kết thúc. Header nhấn mạnh icon và số lượng giỏ; toast có tên sản phẩm và nút **Xem giỏ hàng**. Không tự rời trang đang xem. Nút trong toast giữ lại đường dẫn/bộ lọc/vị trí cuộn để tiếp tục mua sắm đúng chỗ. Chỉ phản hồi thành công sau khi API thêm trả thành công; việc tải hoặc làm mới giỏ không tạo thông báo thêm hàng.
- **Tài khoản**: rê chuột vào icon hoặc bấm để mở dropdown. Khách chưa đăng nhập thấy Đăng nhập/Đăng ký; khách đăng nhập thấy Tài khoản, Đơn hàng và Đăng xuất. Nhân viên có đường dẫn Trang quản trị. Đăng xuất gọi AuthContext/logout hiện tại, không chỉ ẩn tên trên giao diện. Đóng bằng click ngoài/Escape; điều khiển được bằng bàn phím và trên điện thoại.
- **Tìm kiếm**: input trong header ở màn hình rộng; icon mở ô nhập ngay dưới thanh header trên điện thoại. Không mở modal/trang tìm kiếm khi gõ. Trì hoãn request 250 ms và chỉ nhận kết quả của từ khóa mới nhất. Gợi ý 6 sản phẩm gồm ảnh, tên, **mã sản phẩm `productCode`**, giá và giá gốc nếu có. Chọn kết quả để mở sản phẩm; Enter/Xem tất cả đưa đến danh sách sản phẩm với bộ lọc từ khóa. Hỗ trợ mũi tên lên/xuống, Enter, Escape, báo lỗi và thử lại. Không hiển thị ID kỹ thuật.
- **Thông báo**: có nhóm Tất cả, Đơn hàng, Sản phẩm mới, Ưu đãi; icon và dấu chưa đọc. Có thể sao chép mã giảm giá. Chọn một thông báo đánh dấu đã xem rồi mở sản phẩm/giỏ hàng/đơn tương ứng.

## API và nguồn dữ liệu thật

| Chức năng | API / nguồn |
|---|---|
| Gợi ý theo tên hoặc mã SP | `GET /api/v1/products?page=0&size=6&keyword=...` qua public catalogService |
| Sản phẩm mới | `GET /api/v1/home/products?section=newest`, tối đa 6 mục |
| Mã khuyến mãi của khách đăng nhập | `GET /api/v1/promotions?page=0&size=8`, CUSTOMER; API trả các mã đang hiệu lực |
| Cập nhật đơn thuộc khách | `GET /api/v1/orders?page=0&size=10` |
| Đặt hàng | Giữ `POST /api/v1/orders` và idempotency; phát sự kiện cập nhật hộp thông báo sau khi tạo thành công |
| Thêm giỏ | Giữ contract `/cart/items` và kiểm tra tồn kho của backend |
| Đăng xuất | Giữ authService/logout và thu hồi phiên hiện tại |
| Cảnh báo kho Admin | Giữ `/notifications` và Firebase Messaging hiện có, không gọi endpoint kho cho khách hàng |

Đã đọc backend `ProductService.list()`: predicate keyword tìm cả `productName` và `productCode`. Không tự thêm endpoint search/autocomplete mới. ID chỉ dùng nội bộ để định tuyến/gọi API.

Khách chưa đăng nhập chỉ nhận danh sách sản phẩm mới từ API công khai và lời nhắc đăng nhập cho ưu đãi/đơn riêng. Không gọi API đơn/mã giảm giá riêng tư khi chưa đăng nhập. Không dùng cảnh báo kho của Admin để giả làm thông báo người mua.

Backend chưa có hộp thư/push riêng cho sự kiện marketing của khách. Hiện thông báo cửa hàng được tổng hợp từ dữ liệu thật ở trên, làm mới khi mở chuông, focus, sau tạo/hủy đơn hoặc cập nhật thanh toán, và 30 giây/lần khi tab đang hiển thị. Mục “Sản phẩm mới” là bộ sưu tập newest đang được công bố, không suy diễn ngày tạo từ lúc tải frontend. Không tự sinh mã giảm giá giả; mã đang hiệu lực vẫn phải kiểm tra điều kiện tại giỏ hàng.

Trạng thái xem thông báo sản phẩm/ưu đãi/đơn lưu theo tài khoản hoặc khách trên trình duyệt. Khóa thông báo đơn có cả trạng thái đơn và thanh toán: trạng thái mới tạo thông báo chưa xem mới; không coi `pending` là thành công. Nguồn bị lỗi có cảnh báo, các nguồn tải thành công vẫn hiển thị. Trạng thái đọc cảnh báo kho tiếp tục đồng bộ qua API.

Muốn gửi thông báo cho khách ngay cả khi đóng web và đồng bộ đã đọc trên mọi thiết bị, backend cần thêm inbox sự kiện khách hàng + quyền đăng ký token FCM phù hợp và phát sự kiện sản phẩm/khuyến mãi/đơn; frontend chưa tự mở quyền push kho cho CUSTOMER.

## Kiểm tra nhanh

1. Rê/bấm icon tài khoản khi chưa đăng nhập và sau đăng nhập; thử Đăng xuất.
2. Gõ tên sản phẩm hoặc mã đang có như SP01 ở header, chọn gợi ý bằng chuột/bàn phím; gõ nhanh từ khóa khác để kiểm tra kết quả cũ không ghi đè.
3. Thêm sản phẩm từ Trang chủ và trang Sản phẩm; kiểm tra nút, toast, số lượng giỏ, sau đó Xem giỏ và Tiếp tục mua sắm.
4. Mở chuông bằng tài khoản CUSTOMER; thử lọc Sản phẩm mới/Ưu đãi/Đơn hàng và sao chép mã. Tạo đơn, kiểm tra thông báo giữ đúng Chờ thanh toán/Chờ chuẩn bị theo backend.
5. Không có mã đang hiệu lực thì mục Ưu đãi trống; không có API dữ liệu thật thì hiện cảnh báo, không tự tạo thông báo mẫu.

Test: `pnpm exec vitest run src/components/layout/storeHeaderInteractions.test.js src/contexts/cartFeedback.test.js src/services/inbox.test.js`.

Kết quả toàn dự án: **514/514 test, 50 tệp đạt**, build ứng dụng và service worker thành công. Test mới kiểm tra tương tác bằng jsdom; chưa xác minh trực quan trên trình duyệt do quyền điều khiển trình duyệt đang tắt. Cảnh báo chunk chính trên 500 kB vẫn còn, không chặn build.
