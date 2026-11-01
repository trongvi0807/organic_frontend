# Danh mục nhiều cấp, nguồn cung, mã xuất xứ và đơn vị giao hàng

Cập nhật ngày 01-11-2026. Không cần chạy SQL hoặc sửa schema. Không tự sửa/xóa dữ liệu đang lưu.

## Cửa hàng: danh mục nhiều cấp

- Nhấn mũi tên cạnh **Sản phẩm** trên thanh điều hướng hoặc **Danh mục sản phẩm** trên trang sản phẩm.
- Menu mới theo kiểu danh sách dọc gọn của [Organicfood.vn](https://organicfood.vn/cart), mở ngay dưới nút danh mục; chiều cao theo nội dung thay vì khung lớn cố định.
- Trên máy tính, rê chuột hoặc bấm danh mục có mũi tên để mở menu con sang bên cạnh. Các cấp sâu hơn tiếp tục mở theo cùng cách; menu tự đổi phía khi sát mép màn hình.
- Nếu chỉ có một danh mục bao quát như Thực phẩm, tên nhóm vẫn là liên kết để xem toàn bộ; các con Rau củ, Trái cây... hiển thị ngay trong danh sách chính.
- Nhấn danh mục cuối để lọc sản phẩm. **Xem tất cả** của một danh mục bao gồm các sản phẩm ở các cấp con.
- Trên điện thoại, nhấn danh mục cha để mở nội dung ngay dưới dòng đó. Có thể cuộn danh mục, đóng bằng nút X, nhấn ngoài hoặc Escape.
- Tên và quan hệ danh mục lấy từ dữ liệu thực tế; không tạo thêm các danh mục mẫu.
- Bàn phím: Enter/mũi tên xuống mở menu; mũi tên lên/xuống chuyển dòng; mũi tên phải mở cấp con, mũi tên trái quay lại; Escape đóng và trả tiêu điểm về nút mở.

## Một sản phẩm thuộc một nhà cung cấp

Dùng quan hệ sẵn có: **Sản phẩm → Xuất xứ → Nhà cung cấp**. Một nhà cung cấp có thể có nhiều sản phẩm; mỗi sản phẩm có một xuất xứ và qua đó xác định một nhà cung cấp.

- Tạo sản phẩm thủ công hoặc Excel phải chọn xuất xứ đã liên kết với nhà cung cấp đang hoạt động.
- Liên kết đúng, còn hoạt động sẽ được giữ khi cập nhật thông tin. Không phải chọn lại mỗi lần lưu.
- Hồ sơ cũ thiếu liên kết hoặc nguồn cung đã ngừng hoạt động cần được cập nhật trước khi lưu.
- Không gỡ xuất xứ để để trống nguồn cung; thay bằng một xuất xứ hợp lệ khác.
- Nếu xuất xứ đã có sản phẩm, không đổi nhà cung cấp ngay trên xuất xứ đó để tránh chuyển toàn bộ sản phẩm ngoài ý muốn. Tạo xuất xứ mới rồi chuyển từng sản phẩm khi cần.
- Đơn mua nhập thủ công, Excel và khi duyệt đều kiểm tra sản phẩm phải thuộc nhà cung cấp của đơn.
- Đây là kiểm tra liên kết và trạng thái nguồn cung, không yêu cầu sản phẩm phải có chứng nhận organic.

## Mã xuất xứ tự động

- Form hiển thị mã dự kiến dạng **XX01, XX02…**, chỉ đọc.
- Mã chính thức được cấp khi lưu; mã cũ giữ nguyên khi sửa.
- Khi hai người lưu đồng thời, giao dịch kiểm soát xung đột và mã được bảo vệ bằng ràng buộc duy nhất hiện có. Nếu báo dữ liệu thay đổi, tải lại rồi lưu lại; không tạo hai hồ sơ trùng mã.

## Đơn vị giao hàng

- Dùng ô chọn có tìm kiếm với **Express** và **Giao Hàng Tiết Kiệm**.
- Áp dụng cho đơn bán và đơn giao hàng đổi.
- Lưu tên đơn vị giao hàng vào thông tin chuyến như hiện có. Đây là lựa chọn/ghi nhận đơn vị, không phải tích hợp đặt vận chuyển tự động qua hãng.

## Các điều chỉnh API

| API | Thay đổi |
| --- | --- |
| GET `/api/v1/origins/next-code` | Trả `{originCode, reserved:false}`; chỉ là gợi ý, chưa giữ mã |
| POST `/api/v1/origins` | `supplierId` bắt buộc. `originCode` có thể bỏ trống; mã được tự cấp, không dùng mã tự nhập |
| PUT `/api/v1/origins/{id}` | Giữ mã đã cấp; không cho đổi nhà cung cấp nếu xuất xứ đang có sản phẩm |
| POST `/api/v1/admin/products` | Thêm `originId`, bắt buộc để tạo sản phẩm với nguồn cung hợp lệ |
| PUT `/api/v1/admin/products/{id}` | Có thể truyền `originId` để thay nguồn cung. Bỏ qua trường này sẽ giữ liên kết đang có nếu hợp lệ |
| PUT `/api/v1/products/{id}/origin` | Xuất xứ phải có nhà cung cấp đang hoạt động |
| DELETE `/api/v1/products/{id}/origin` | Trả 409; cần thay liên kết thay vì gỡ để trống |
| Nhập sản phẩm / đơn mua từ Excel | Kiểm tra cùng quy tắc nguồn cung trước khi ghi; trả lỗi theo dòng khi thiếu hoặc sai liên kết |
| Tạo / cập nhật / duyệt đơn mua | Chặn sản phẩm thuộc nhà cung cấp khác |

## Hướng dẫn tự kiểm tra

1. Khởi động lại backend và frontend để nhận API/giao diện mới.
2. Mở danh mục tại cửa hàng: chọn từng cha, xem các con; chọn cấp sâu, kiểm tra danh sách sản phẩm. Thử trên máy tính và điện thoại; thử đóng bằng X/Escape/nhấn ngoài.
3. Tạo xuất xứ: kiểm tra mã dự kiến, chọn nhà cung cấp, lưu rồi mở lại. Mã phải được giữ và không cho nhập sửa.
4. Tạo sản phẩm: chọn nhà cung cấp và xuất xứ thuộc nhà cung cấp đó. Thiếu liên kết phải báo lỗi; lưu đúng phải giữ nguồn cung khi sửa tên/giá.
5. Trong Truy xuất sản phẩm, đổi sang một xuất xứ hợp lệ khác; không còn nút gỡ nguồn cung.
6. Nhập Excel sản phẩm thiếu xuất xứ hoặc dùng xuất xứ chưa gắn nhà cung cấp: phải báo lỗi theo dòng. Điền đúng liên kết rồi nhập lại.
7. Lập đơn mua từ Excel hoặc thủ công: các sản phẩm đều phải thuộc nhà cung cấp đã chọn. Không cho trộn sản phẩm của nhà cung cấp khác.
8. Đơn bán đang chuẩn bị / đơn giao hàng đổi: mở form chuyến giao, tìm và chọn Express hoặc Giao Hàng Tiết Kiệm; lưu và mở lại để kiểm tra tên đã ghi nhận.

Chưa tự chạy nghiệp vụ hoặc bộ kiểm thử tự động trên hệ thống của người dùng. Có cập nhật mã kiểm thử hồi quy để phù hợp quy tắc mới; việc xác minh hiện tại chỉ gồm biên dịch và kiểm tra cấu trúc mã.
