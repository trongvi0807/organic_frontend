# Lịch sử mua hàng, theo dõi đơn và hủy đơn

Cập nhật frontend ngày 28-10-2026. Không sửa backend hoặc cơ sở dữ liệu.

## Mở giao diện

```powershell
pnpm dev
```

- Đơn thật: `/don-hang`, đăng nhập tài khoản CUSTOMER. Chọn **Xem hành trình / Chi tiết** để mở `/don-hang/:id`.
- Thử ngay không cần đăng nhập: `/demo/don-hang` (ví dụ `http://localhost:5173/demo/don-hang`).
- Ví dụ đơn đã trả trước, chưa chuẩn bị: `/demo/don-hang/demo-order-3`.
- Ví dụ đã giao và hoàn tất, có lô hàng: `/demo/don-hang/demo-order-6`.

Demo có nhãn rõ ràng, dùng hình ảnh thực phẩm trong `public/images`, không gọi API đơn hàng/thanh toán và không ghi dữ liệu thật. Bộ mẫu có 12 đơn: chờ thanh toán, chờ xác nhận, chờ chuẩn bị, đang chuẩn bị, đang giao, hoàn tất, đã hủy, chờ hoàn tiền, có yêu cầu đổi trả, giao thất bại, đã giao nhưng chưa hoàn tất và COD có thể hủy. Nút **Khôi phục dữ liệu mẫu** trên trang lịch sử đặt lại bộ mẫu.

Trạng thái demo được giữ qua tải lại trong sessionStorage `moc.customer-orders.demo.v1`; thông tin tài khoản ngân hàng nhập thử không được lưu. Chỉ dùng thông tin giả trong demo. Thời gian hoàn tiền 3–7 ngày là nội dung mô phỏng, không phải cam kết vận hành thực tế.

## Component

| Tệp | Vai trò |
|---|---|
| `src/pages/client/OrderHistoryPage.jsx` | Tabs, tìm kiếm, lọc thời gian, phân trang, danh sách đơn |
| `src/pages/client/OrderTrackingPage.jsx` | Hành trình, thanh toán, nhận hàng/vận chuyển, các lần thanh toán và tải hóa đơn |
| `src/components/orders/OrderPrimitives.jsx` | Card, danh sách sản phẩm, badge, stepper, trạng thái sau bán |
| `src/components/orders/CancelOrderModal.jsx` | Radix Dialog dùng chung, lý do hủy, kiểm tra dữ liệu và thông tin hoàn tiền mẫu |
| `src/components/orders/ReturnRequestModal.jsx` | Kiểm tra sản phẩm đủ điều kiện và gửi yêu cầu đổi/trả thật |
| `src/lib/customerOrders.js` | Bộ lọc, ngày giờ, nhãn trạng thái, điều kiện hành động, validation tiếng Việt |
| `src/services/client/customerOrderService.js` | Ranh giới API thật / demo tách biệt |

`OrdersPage.jsx` và `OrderPage.jsx` vẫn export các trang mới để tương thích các import cũ. Route thanh toán/kết quả thanh toán hiện có được giữ nguyên; thanh toán thành công chỉ thông báo khi `paymentStatus=paid` được backend xác nhận.

## Mã nghiệp vụ, không hiển thị UUID

Đã đọc entity/DTO backend cùng thư mục và đối chiếu:

| Dữ liệu | Cột entity | Trường API dùng hiển thị |
|---|---|---|
| Đơn hàng | `OrderEntity.order_code` | `orderCode` |
| Yêu cầu đổi trả | `ReturnRequestEntity.request_code` | `requestCode` |
| Vận chuyển | `ShipmentEntity.tracking_code` | `trackingCode` |
| Lô hàng | `ProductBatchEntity.batch_code` | `batchCode` — hiện DTO đơn khách hàng chưa trả trường này |

ID vẫn dùng làm React key, tham số đường dẫn và liên kết dữ liệu. Không thay bằng mã nghiệp vụ khi gọi API vì controller hiện nhận UUID. Tiêu đề, breadcrumb và card không fallback sang ID. Thiếu mã thì hiển thị **Chưa có mã**. Tìm kiếm trên giao diện chỉ dùng mã đơn và tên sản phẩm.

## API thật đã tích hợp

Base URL là cấu hình Axios hiện tại, mặc định `/api/v1`. Các endpoint bên dưới là phần sau base URL. API yêu cầu token của khách hàng đang đăng nhập; không truyền customerId tùy ý.

| API | Input | Output sử dụng |
|---|---|---|
| `GET /orders` | `page`, `size` | Page `CheckoutViews.Order`: `orderCode`, `orderedAt`, `status`, `paymentStatus`, `pricing`, `shipments` |
| `GET /orders/{id}` | UUID đơn thuộc khách đang đăng nhập | `CheckoutViews.Order`, sản phẩm/quy cách/số lượng/giá, người nhận, tổng tiền, các lần thanh toán và chuyến giao |
| `POST /orders/{id}/cancel` | UUID; **không có request body** theo `CheckoutController` hiện tại | Đơn sau xử lý. Chỉ đóng modal/thông báo thành công khi output có `status=cancelled` |
| `GET /return-requests/me` | `page`, `size`, có `orderId` khi xem chi tiết | Page Summary: `requestCode`, `status`, `requestType`, `approvedRefundAmount`, `order.id` |
| `GET /return-requests/eligible-items` | `orderId` | `canSubmit`, `unavailableReason`, `items[].orderDetailId`, `availableQuantity` |
| `POST /return-requests` | Header `Idempotency-Key`; JSON bên dưới | Detail chứa `request`; là yêu cầu chờ xét duyệt, không phải xác nhận hoàn tiền |
| `GET /payments/methods` | Không có body | Các cổng đang bật cho nút tiếp tục thanh toán |
| `POST /payments/initiate` | `{orderId,gateway}` | Phiên thanh toán; tiếp tục luồng redirect/rememberPayment hiện tại |
| `GET /orders/{id}/invoice` | UUID qua `DocumentDownloadButton` | PDF hóa đơn, giữ cơ chế tải file hiện có |

Ví dụ payload đổi trả:

```json
{
  "orderId": "<UUID đơn>",
  "requestType": "return_refund",
  "reason": "damaged",
  "description": "Sản phẩm bị dập khi nhận hàng.",
  "items": [{"orderDetailId": "<UUID chi tiết đủ điều kiện>", "quantity": 1, "reason": "damaged"}]
}
```

`requestType` hỗ trợ `exchange`, `refund`, `return_refund`; lý do dùng chính xác các enum backend. Số lượng là số nguyên dương, không vượt `availableQuantity`. Giữ cùng idempotency key khi thử gửi lại trong một lần mở modal. Yêu cầu được duyệt chưa đồng nghĩa đã chuyển tiền hoàn thành.

Controller `/orders` hiện chỉ nhận page/size. Frontend tải các trang đơn thuộc khách rồi lọc theo mã/tên/ngày/trạng thái và phân trang 5 đơn/trang tại máy. Không tự thêm query chưa được backend hỗ trợ. Nếu tải yêu cầu sau bán thất bại, vẫn hiển thị đơn thật kèm cảnh báo rằng phần đổi trả chưa cập nhật đủ. Có cập nhật nền khi focus tab và định kỳ; lỗi cập nhật không biến trạng thái cũ thành kết quả thành công mới.

## Quy tắc trạng thái

- `pending_payment`: **Chờ thanh toán**, không suy diễn từ return URL thành đã trả tiền.
- `confirmed`: **Chờ chuẩn bị hàng**; bước xác nhận đã xong, nhưng thời gian xác nhận chỉ hiện nếu có dữ liệu.
- `preparing`: Đang chuẩn bị thực tế, không tự hủy theo guard hiện tại của backend.
- `delivered`: **Đã giao hàng**, chưa coi là `completed`. Nút Đánh giá/Đổi-Trả của cụm này chỉ hiện khi `completed` theo yêu cầu.
- Hủy chỉ hiện ở trạng thái sớm (`pending_payment`, `confirmed`; demo thêm `pending_confirmation`). Không cho hủy nếu một chuyến giao bất kỳ đã được lấy/giao, dù trạng thái đơn trả về còn cũ.
- Không dùng `orderedAt` thay ngày xác nhận hoặc ngày kho chuẩn bị. Thiếu mốc thì ghi **Chưa có thời gian cập nhật**. Thời gian được hiển thị theo Việt Nam, `dd-mm-yyyy • HH:mm`.
- Không tự suy diễn lý do hủy từ ghi chú giao hàng của khách.
- `refundStatus=pending` trong demo là **Chờ hoàn tiền**, giữ lịch sử đã trả tiền; không chuyển thành `refunded` hay `completed` sau khi bấm hủy.

## Backend còn cần bổ sung

Đây là các thiếu hụt đã xác nhận từ source, không phải endpoint frontend tự ý thay đổi:

1. **Hủy có lý do và hoàn tiền đơn trả trước**: endpoint hủy hiện không nhận body. `PaymentTransactions.cancel()` chỉ chấp nhận `pending_payment`/`confirmed`; `CheckoutService.release()` chặn `paymentStatus=paid` với thông báo cần xử lý hoàn/hủy thủ công. Cần mở rộng contract hoặc cung cấp API chuyên biệt: lưu `reasonCode`, `reason`, người/thời điểm hủy; thông tin tài khoản hoàn tiền; khóa đơn và kiểm tra chưa xuất/giao trong cùng transaction; tạo yêu cầu hoàn tiền liên kết module sau bán, cung cấp mã yêu cầu và thời gian xử lý. Cần chống gửi lặp, không hoàn hai lần và kiểm tra tình trạng cổng thanh toán trước khi giải phóng tồn/ưu đãi. Frontend hiện không gọi endpoint giả hoặc tự đánh dấu đơn thật đã hủy/đã hoàn.
2. **Thông tin hoàn tiền**: cần trạng thái hoàn tiền và kết quả thực hiện đáng tin cậy (`pending/processing/refunded/failed`, số tiền, mã yêu cầu, ngày xử lý dự kiến). `approvedRefundAmount` chỉ là số tiền được duyệt; không chứng minh hoàn tiền đã thực hiện.
3. **Chi tiết dòng đơn**: `CheckoutViews.Line` hiện chỉ có `variantId, sku, productName, variantName, quantity, unitPrice, lineAmount, discountAmount`. Cần thêm ảnh sản phẩm, mã sản phẩm nếu cần, đơn vị/khối lượng chuẩn, khối lượng thực nhận, `batches[{batchCode,quantity}]` từ phân bổ xuất kho. Giao diện thật dùng ảnh chiếc lá và ghi chưa có thông tin lô khi DTO thiếu, không lấy mã lô mẫu gắn vào đơn thật.
4. **Hành trình đơn**: cần `confirmedAt`, `preparingAt`, `completedAt`, lịch sử trạng thái và lý do hủy/giao thất bại. Shipment hiện đã có `shippedAt`, `deliveredAt`, `failureReason`, `driverName`, `driverPhone`, `carrier`, `trackingCode`; dùng đúng các trường đó. Chưa có biển số xe và thời gian giao dự kiến.
5. **Địa chỉ cấu trúc**: DTO đơn hiện trả `shippingAddress` dạng chuỗi; frontend hiển thị nguyên địa chỉ thật, không thêm trường Quận/Huyện. Có thể bổ sung các trường Tỉnh/Thành, Phường/Xã, số nhà/tên đường cho đơn mới; cần giữ snapshot địa chỉ tại lúc đặt đơn.
6. **Lọc server**: khi dữ liệu nhiều, bổ sung tìm theo mã/tên sản phẩm, khoảng ngày và nhóm trạng thái cho `/orders`, tránh tải hết danh sách ở client.

Trong khi chưa có các API trên: modal đơn thật chưa trả tiền cho phép hủy qua contract cũ và có ghi rõ lý do chi tiết chưa được lưu; đơn thật đã trả tiền hướng dẫn liên hệ hotline **0344 855 913** và không thu thập tài khoản ngân hàng qua một API không hỗ trợ. Form ngân hàng đầy đủ chỉ bật ở demo để thử UX. Không có thông tin ngân hàng được âm thầm bỏ qua rồi báo hoàn tiền thành công.

## Kiểm thử

```powershell
pnpm exec vitest run src/lib/customerOrders.test.js src/services/customerOrder.test.js src/components/orders/customerOrdersInteractions.test.js
pnpm test
pnpm build
```

Các kiểm tra mới bao gồm: phân biệt paid/pending/refund-pending, không hiển thị UUID, lọc ngày/mã/tên, không bịa mốc hành trình, cấm hủy sau bàn giao, lý do Khác bắt buộc, tìm ngân hàng, dữ liệu hoàn tiền, không lưu số tài khoản demo, không submit hai lần, lỗi 409 không đóng modal/báo hủy thành công, gửi đổi trả đúng quantity và contract, trang demo không ghi đơn thật. Không thực hiện giao dịch thanh toán, hủy đơn hoặc hoàn tiền thật khi chạy test.

Kết quả kiểm tra cuối cùng: **514/514 test, 50 tệp đạt**, `pnpm build` thành công (gồm build service worker). Kiểm tra tương tác mới chạy bằng jsdom; chưa xác minh trực quan bằng trình duyệt vì quyền điều khiển trình duyệt của phiên làm việc đang tắt. Build còn cảnh báo chunk chính trên 500 kB; cảnh báo không chặn build.
