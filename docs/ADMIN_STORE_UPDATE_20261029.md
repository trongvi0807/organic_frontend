# Cập nhật Admin và cửa hàng — 29-10-2026

## Phạm vi đã thực hiện

Đã sửa frontend theo yêu cầu ban đầu và bổ sung đúng hai phần backend được người dùng duyệt: lọc danh mục cha bao gồm con, cấp mã/chống trùng tên ưu đãi khi lưu đồng thời. Không sửa entity, SQL, migration hoặc cấu hình database. Không gọi API để thử nghiệp vụ, không build/test hoặc thao tác trình duyệt; người dùng tự kiểm tra thủ công. Không tự commit/push đợt này. Chưa xoá dữ liệu mẫu.

### Danh mục cha–con

- Trang Sản phẩm tải đầy đủ các trang loại sản phẩm qua `GET /categories` và đọc `parentId`, `parentName` hiện có.
- Dropdown và đường dẫn hiển thị `Danh mục cha › Loại sản phẩm con`; trang chi tiết và thẻ sản phẩm thể hiện quan hệ này.
- Khi chọn danh mục có loại con, trang liệt kê các nút loại con để đi tới sản phẩm tương ứng.
- Giữ phân trang API. Backend mở rộng tập danh mục **trước** khi phân trang: `GET /api/v1/products?categoryId=...&includeDescendants=true` (mặc định true trên API cửa hàng). Bao gồm sản phẩm gắn trực tiếp với cha và toàn bộ cấp con đang hoạt động; không đi qua nhánh danh mục đã ngừng hoạt động. Không ghép trang trên frontend.
- `includeDescendants=false` vẫn lọc đúng một danh mục. API danh sách Admin giữ hành vi cũ. Vòng lặp dữ liệu cha–con cũ được chặn khi duyệt cây.

### Form sản phẩm

- Khử bản ghi lặp cùng ID trong dropdown loại. Nếu các ID khác nhau trùng tên/đường dẫn, thêm mã loại để phân biệt; không âm thầm gộp những bản ghi khác nhau.
- Đổi nhãn `Đơn vị tính / đóng gói` thành `Đơn vị tính`; dropdown hỗ trợ tìm kiếm Gói, Thùng, Hộp, Túi, Chai… và các lựa chọn đã cấu hình. Khử trùng hoa/thường.
- Đơn vị trọng lượng có dropdown g, kg, ml, l và các lựa chọn cấu hình hiện có. Trường cũ khi chỉnh sửa được giữ lại.
- Đổi `Giá so sánh` thành `Giá gốc`, giải thích đây là giá trước khi giảm. Giữ validation giá gốc không thấp hơn giá bán.
- Áp dụng cho form sản phẩm và phần thêm/sửa quy cách. Payload giữ nguyên `variantName`, `netQuantity`, `unitId`, `compareAtPrice`.
- Dữ liệu cũ như `Gói 1kg` không bị tự sửa khi mở form. Ở chi tiết cửa hàng, lựa chọn mới như `Gói` được kèm khối lượng để phân biệt các quy cách.

### Phiếu nhập thủ công

- Tự điền mã lô khi sản phẩm có số lượng đạt và danh sách lô hiện có đã tải xong. Dạng `LO-ddMMyyyy-SKU-hậu_tố`, dưới giới hạn 100 ký tự, không dùng ID bản ghi làm mã hiển thị.
- Kiểm tra tránh mã đang có và các mã trong cùng phiếu; backend vẫn kiểm tra ràng buộc thật khi lưu. Mã sinh trên frontend chưa được giữ chỗ trên server.
- Không thay mã lô đã lưu khi mở lại phiếu; số đạt 0 không gửi mã lô trong payload.
- Bỏ nhãn `dòng 1`, `dòng 2`… khỏi các trường thủ công. Các khối được nhận diện bằng tên sản phẩm/quy cách; lỗi trước khi lưu cũng dùng tên sản phẩm.
- Không đổi logic thực nhận/hàng loại, duyệt nhập, cộng tồn hoặc nhập nhiều đợt. Excel không bị thay đổi trong đợt này.

### Mã ưu đãi

- Tải danh sách ưu đãi đầy đủ, gồm cả mã không hoạt động, trước khi mở form. `GET /api/v1/admin/promotions/next-code` trả mã dự kiến dạng `KM01`, `KM02`…; không bắt nhập tay và không giữ chỗ mã.
- Kiểm tra trùng tên và mã trên frontend. Tên chuẩn hóa Unicode NFC, khoảng trắng và hoa/thường; giữ dấu tiếng Việt để tránh đồng nhất hai tên khác nghĩa.
- Trước khi lưu, tải lại danh sách để kiểm tra tên sớm. Tạo mới gửi `promotionCode: null` để backend cấp mã chính thức trong giao dịch; dùng mã trong response để thông báo. Chỉnh sửa giữ nguyên mã hiện có.
- Modal không đóng khi đang gửi yêu cầu lưu. Lỗi server được hiển thị, không tự coi yêu cầu thất bại mạng là lưu thành công.
- Backend chuẩn hóa Unicode NFC, khoảng trắng và hoa/thường khi kiểm tra tên, tính cả ưu đãi ngừng hoạt động. Lưu bằng transaction `SERIALIZABLE` để bảo vệ kiểm tra tên/cấp mã khi có nhiều phiên ghi qua service (kể cả bảng trống). Xung đột trả 409 tiếng Việt, frontend tải lại dữ liệu rồi để người dùng quyết định lưu lại, không tự gửi lại request.
- Giữ unique mã đang có; không tạo unique index tên. Các nguồn ghi trực tiếp SQL/bỏ qua service không nằm trong bảo đảm chống trùng tên. Tên trùng đã có sẵn không tự bị xóa hoặc đổi; cần sửa từng tên khi cập nhật.

### Số lượng trên cửa hàng

- Dùng API **đã có**: `GET /api/v1/products/{id}/availability`.
- Đọc `data.availableQuantity[variantId]`, không cộng gộp khác quy cách hoặc đoán từ tổng tồn.
- Thẻ sản phẩm hiện `Còn N` theo quy cách mặc định; chi tiết/xem nhanh hiện `Số lượng có thể mua: N` và quy cách đang chọn. Quy cách khác có số lượng riêng.
- `0` hiển thị hết hàng; lỗi/thiếu dữ liệu hiển thị chưa kiểm tra được số lượng, không biến lỗi thành tồn 0 hoặc tồn giả.
- Thẻ tải khi gần vào màn hình, dùng chung cache 15 giây, gộp request trùng sản phẩm và giới hạn 3 request đồng thời. Chi tiết cập nhật lại mỗi 30 giây khi tab đang hiển thị; quay lại tab/thanh toán cập nhật/nhấn thêm giỏ cũng tải lại.
- Tồn công khai do backend tính từ lô đã duyệt, còn hạn, trừ giữ chỗ. Thêm giỏ chưa giữ hàng; server kiểm tra lại khi thanh toán.

## Backend đề xuất — CHƯA thực hiện, cần người dùng chốt

| Phần | Cần sửa/thêm gì | SQL/schema |
|---|---|---|
| Mã lô do server cấp | Tùy chọn thêm fallback cho `ReceiptLine.batchCode` trống, trả mã cuối cùng trong response, kiểm tra trùng theo SKU. Giữ mã đã lưu/mã nhà sản xuất nếu nghiệp vụ cho phép. | Có unique `(variant_id,batch_code)` hiện có; thường không cần thêm cột. Frontend đã tự điền được theo API hiện tại. |
| Hoàn tiền theo đổi trả/hủy đơn | Bổ sung đọc/tạo/xác nhận giao dịch hoàn tiền theo ReturnRequest đã có. Xác nhận sau khi chi tiền thật, lưu số tiền, phương thức, tham chiếu, người xử lý, thời gian, lịch sử; kiểm tra tổng đã/đang hoàn. | Entity `RefundTransaction` và history đã có. Có thể dùng bảng hiện có **nếu DB đang tương thích với entity**, chưa truy vấn DB để xác nhận. |
| Giải quyết thanh toán cần đối soát | Bổ sung chi tiết và hành động có lịch sử cho khoản `requires_review`, nhất là tiền đến trễ/trùng. Không dùng thao tác “đã xử lý” thuần giao diện. | Có thể cần thay schema để lưu đối soát/hoàn tiền độc lập; `RefundTransaction.return_request_id` hiện bắt buộc, trong khi tiền trùng/trễ có thể không có ReturnRequest. Không tạo yêu cầu đổi trả giả để lách. |
| Tồn công khai hàng loạt | Tùy chọn trả availability cho nhiều productId hoặc nhúng vào summary để giảm request trên danh sách lớn. | Không bắt buộc cho tính năng hiện số lượng, không cần cột mới. |

### Hợp đồng đề xuất cho hoàn tiền/đối soát

Đây là thiết kế để xem xét, **chưa phải API đang chạy**. Tên endpoint và trạng thái cần thống nhất trước khi triển khai.

- `GET /management/return-requests/{id}/refunds`: danh sách giao dịch hoàn tiền theo yêu cầu.
- `POST /management/return-requests/{id}/refunds`: tạo đề nghị, có `Idempotency-Key`, số tiền, nguyên tệ, phương thức, payment nguồn và thông tin nhận tiền phù hợp.
- `POST /management/refunds/{id}/confirm`: ghi nhận đã chi thực tế, tham chiếu/chứng từ, thời gian, ghi chú; cập nhật tổng đã hoàn và lịch sử trong cùng transaction.
- `GET /management/payments/{id}/review`: chi tiết khoản tiền cần đối soát, đơn nguồn, nguyên nhân và lịch sử xử lý.
- `POST /management/payments/{id}/review-resolutions`: hành động xử lý được phép theo thực trạng (ghi nhận hoàn tiền đã chi hoặc xác nhận đơn còn hợp lệ). Không tự chuyển đơn đã hủy/thất bại sang paid hoặc cấp hàng khi không còn tồn.

Chỉ tài khoản có quyền Admin/Bán hàng và hồ sơ nhân viên phù hợp được xử lý. Khóa order/payment/refund nhất quán, không hoàn vượt tiền thực nhận/được duyệt, key gắn nội dung request, lưu actor/time/reference/history. Không hứa hoàn tiền tự động qua VNPay/PayPal/Stripe khi adapter chưa có operation refund. Nút xác nhận thủ công chỉ ghi nhận một giao dịch chi đã thực hiện.

Trang Đối soát hiện giữ danh sách đọc từ API có sẵn; chưa thêm nút xác nhận giả hoặc gọi endpoint chưa tồn tại.

## Người dùng tự kiểm tra

1. Sau khi khởi động lại backend, tạo loại con, chọn cha; mở cửa hàng và kiểm tra dropdown/đường dẫn `Cha › Con`. Chọn cha phải có cả sản phẩm của cha, con, cháu; chọn con chỉ có nhánh con. Đối chiếu tổng số và trang tiếp theo, kết hợp từ khóa tìm kiếm.
2. Mở Thêm sản phẩm và sửa quy cách; kiểm tra đơn vị không lặp Gói/gói, đơn vị trọng lượng, nhãn Giá gốc và dữ liệu cũ được giữ nguyên. Hai quy cách Gói 500 g / Gói 1 kg vẫn phân biệt được trên trang chi tiết.
3. Lập phiếu nhập thủ công: mã lô tự điền, không có nhãn dòng 1; đổi số đạt về 0 rồi tăng lại không làm mất dữ liệu người dùng; mở sửa phiếu không đổi mã đã lưu.
4. Tạo ưu đãi mới thấy KM dự kiến; nhập tên đã có với khoảng trắng/hoa thường khác phải báo trùng. Mã ngừng hoạt động vẫn không được cấp lại. Dùng hai phiên tạo cùng tên đồng thời: không được lưu hai bản ghi trùng tên, phiên xung đột nhận 409. Hai tên khác nhau có thể cần lưu lại sau 409; khi cả hai đã lưu thì mã phải khác nhau. Chỉnh sửa không đổi mã. Xem chi tiết hợp đồng ở `D:/oragnic-pro/organic_backend/docs/CATEGORY_PROMOTION_RULES_20261029.md`.
5. Mở thẻ/xem nhanh/chi tiết sản phẩm, đổi quy cách và đối chiếu số từ availability. Hết hàng khóa thêm giỏ; API lỗi phải báo chưa kiểm tra được, không báo còn hàng giả.
6. Trang Đối soát vẫn chưa có hành động hoàn tiền/đánh dấu đã xử lý cho đến khi API và lưu trữ lịch sử được duyệt triển khai.

Các ca trên là hướng dẫn, chưa được thực hiện tự động hoặc thay người dùng.
