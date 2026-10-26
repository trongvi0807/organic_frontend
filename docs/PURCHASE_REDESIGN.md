# Giỏ hàng, checkout theo mẫu và VNPay — 26/10/2026

## Giao diện cuối cùng

- Tham khảo cách tổ chức của [CellphoneS Cart](https://cellphones.com.vn/cart/) và ảnh checkout người dùng cung cấp. Giữ logo Mộc, màu xanh lá/be của dự án.
- Giỏ hai cột: chọn tất cả/từng dòng; nhập trực tiếp số lượng hoặc +/−; xóa từng dòng/toàn bộ có xác nhận; voucher, đổi điểm và thông tin đơn bên phải. Mobile có thanh Mua ngay cố định.
- Checkout: **sản phẩm → khách hàng → nhận hàng** ở trái; **thông tin đơn → phương thức thanh toán → THANH TOÁN** ở phải. Không có mục 4, nút chọn voucher hoặc ô nhập điểm ở checkout. Chỉ hiển thị mã/điểm đã chọn ở giỏ dưới dạng thông tin tổng kết.
- Sau tạo đơn chuyển `/dat-hang-thanh-cong/:id`, đọc lại đơn qua API. Đơn online chưa trả tiền ghi rõ chờ thanh toán, có nút tiếp tục qua cổng. Không đánh đồng đặt hàng thành công với đã thu tiền.

## Điểm thưởng

Backend có `GET /api/v1/customers/me/rewards`: balance, reserved, available, redeemLimit, redeemValue, earnPerVnd. Có thêm `GET /customers/me/reward-transactions` để xem lịch sử. `CheckoutService.complete` ghi giao dịch `earn` khi đơn hoàn tất; chưa hoàn tất không cộng điểm mới.

Frontend lấy **available = balance − reserved** từ backend, không suy diễn từ số lượng đơn đã đặt. Khi đổi điểm ở giỏ, tải lại số dư tài khoản rồi mới chấp nhận. Từ chối điểm âm/lẻ/không phải số, không có điểm, quá available hoặc quá giới hạn 50 điểm/đơn. Không kiểm tra được số dư thì chỉ cho chọn 0. Lỗi hiện trong khối và toast góc trái. Preview và POST orders vẫn kiểm tra số dư/tiền hàng ở backend.

Điểm đã chọn được giữ trong ShopContext khi đi từ giỏ sang checkout; xóa giỏ, đổi tài khoản hoặc tạo đơn thành công sẽ xóa lựa chọn điểm. Không lưu số dư vào localStorage. Checkout kiểm tra lại số dư và backend tính số tiền giảm; chưa có API giá theo giỏ độc lập nên nếu thiếu địa chỉ mặc định, giỏ ghi tổng tạm tính và xác nhận số tiền giảm ở checkout.

## Địa chỉ ba trường và GPS

- Không có trường Quận/Huyện. Chỉ Tỉnh/Thành phố → Xã/Phường → Số nhà/đường.
- Snapshot 34 tỉnh, 3.321 xã/phường, version `2026.10.8`, từ [tinhthanhpho.com](https://tinhthanhpho.com/api-docs), CC BY 4.0. Metadata nguồn/giấy phép được giữ trong `public/data/address/`. Đây là dữ liệu tham chiếu của nhà cung cấp, cần cập nhật khi danh mục hành chính thay đổi.
- Tra cứu tên mới và tên cũ tại thiết bị; Quận 1 cũ gợi ý các phường mới liên quan. Chỉ tự điền khi xác định duy nhất; không đoán khi địa danh cũ bị chia nhiều nơi. Địa chỉ gửi chỉ gồm đường, xã hiện hành, tỉnh hiện hành. Địa chỉ đã lưu không ánh xạ được yêu cầu chọn lại.
- GPS dùng `navigator.geolocation` sau khi khách bấm nút, cần HTTPS/localhost và quyền trình duyệt. Tọa độ được đối chiếu polygon tại trình duyệt; không gửi tọa độ đến nhà cung cấp. Ranh giới tỉnh lấy trong snapshot, ranh giới xã tải theo mã tỉnh, cache trong phiên. Có lỗi/từ chối/quá thời gian/độ chính xác thấp/ngoài vùng/ranh giới chồng nhau thì chuyển sang chọn thủ công. Chưa xác minh GPS thực của thiết bị người dùng; có kiểm thử logic polygon và quyền dữ liệu.
- Có thể mirror `wards-{provinceCode}.geojson` từ cùng phiên bản và cấu hình `VITE_ADDRESS_BOUNDARY_BASE_URL` bằng HTTPS hoặc `/data/...`; Docker đọc giá trị lúc khởi động. Không dùng API autocomplete tính phí hoặc khóa bên thứ ba.
- Cập nhật snapshot có kiểm tra số lượng trước khi ghi: `node scripts/update-address-data.mjs`. Nếu số đơn vị thay đổi, đọc và cập nhật guard có chủ đích.

## Phạm vi backend hiện tại

- Nhận tại cửa hàng là **yêu cầu** gửi trong note và địa chỉ cửa hàng; chưa có fulfillment/pickup workflow riêng. UI nhắc chờ xác nhận lịch nhận, không tự miễn trừ nghiệp vụ giao hàng hiện có.
- Email hóa đơn được gửi trong note theo yêu cầu; chưa có API xuất/gửi hóa đơn, không hiển thị đã phát hành.
- Chỉ chọn COD/Stripe/PayPal/VNPay khi `/payments/methods` cho phép. Đã bỏ hoàn toàn dòng chuyển khoản ngân hàng trực tiếp theo yêu cầu. Không đưa MoMo hoặc cổng khác thành phương thức hoạt động khi chưa có tích hợp.

## Footer, số lượng có thể đặt và quay lại mua sắm

- Footer còn ba nhóm: logo/liên hệ; khám phá; hỗ trợ/thanh toán. Giữ địa chỉ 36 Trịnh Đình Trọng, Phường Tân Phú và hotline 0344855913. Bỏ newsletter và các nhóm thông tin mô phỏng dài.
- Thêm API công khai **GET `/api/v1/products/{id}/availability`**, trả `productId`, `availableQuantity` theo variant ID và `checkedAt`. Tồn khả dụng lấy từ lô nhập đã xác nhận, chưa hết hạn, trừ số lượng đang giữ cho đơn khác. Tách khỏi cache chi tiết sản phẩm; không cần đổi schema database.
- GET giỏ hàng trả thêm `items[].availableQuantity`. Trang chi tiết hiển thị số gói/hộp theo quy cách, làm mới mỗi 15 giây/khi focus; giỏ hiển thị số lượng có thể đặt và chặn nhập vượt tồn đã biết. Backend kiểm tra lại khi checkout, thêm giỏ không giữ hàng. Khi không đọc được tồn, giao diện ghi rõ đang cập nhật thay vì tạo số lượng giả.
- Nút **Tiếp tục mua sắm** trở về URL đang xem, giữ bộ lọc/từ khóa/hash và vị trí cuộn. Nút Quay lại trình duyệt cũng lưu vị trí theo từng history entry. Dữ liệu điều hướng nằm trong phiên trình duyệt; không nhận URL ngoài website.
- Nhãn chứng nhận trên thẻ sản phẩm và phần chi tiết dẫn tới hồ sơ sản phẩm. Home/footer có liên kết tới khu chứng nhận của trang Về cửa hàng. Link tài liệu chỉ hiện khi backend có URL hợp lệ; không tự tạo tài liệu chứng nhận.
- Cần **restart Spring Boot** để có API tồn khả dụng và field giỏ mới; frontend cũ/backend cũ thiếu field vẫn hiển thị thông báo kiểm tra ở bước thanh toán.

## Giá khuyến mãi nhất quán

Danh sách sản phẩm dùng cùng `ProductCard` và adapter giá với Home. Backend bổ sung `defaultVariantId`, `defaultVariantName`, `defaultPrice`, `compareAtPrice` cho product summary; giá bán/giá gạch phải thuộc cùng quy cách đang bán. Nếu original price không lớn hơn selling price thì không hiện giá gạch. Với backend cũ thiếu field, frontend đối chiếu sản phẩm cùng ID trong Home để hiển thị nhất quán; cần cập nhật/restart backend để toàn bộ danh sách có đủ giá gốc.

## VNPay tự xác nhận

Backend sẵn có `GET /api/v1/payments/vnpay/ipn`: kiểm tra chữ ký HMAC, merchant, tham chiếu, tiền/currency; giao dịch thành công đúng hạn cập nhật **payment.status=paid**, **order.paymentStatus=paid**, **order.status=paid**. Không cần Admin bấm duyệt. Tiền đến muộn/trùng/đơn đã đóng có thể `requires_review`, cần xử lý ngoại lệ; không bỏ ràng buộc này.

Lượt này thêm API chỉ đọc, CUSTOMER và đúng chủ đơn:

```http
GET /api/v1/payments/vnpay/reference/{vnp_TxnRef}
Authorization: Bearer <customer token>
```

API tra cứu merchant reference thực trong database; không dùng tham số `vnp_ResponseCode` trên trình duyệt để đánh dấu đã thu tiền. Không tìm thấy/sai chủ trả 404; tham chiếu sai định dạng trả 400. Cần **restart backend** để có endpoint mới.

Frontend đọc đúng reference từ URL VNPay, không dùng lần thanh toán gần nhất của tài khoản. Lưu reference theo lần thanh toán để fallback khi backend cũ chưa có API. Trang kết quả tự đọc trạng thái khoảng 4 giây/lần khi tab hiển thị; trang đơn/Admin khoảng 5 giây, tải lại khi focus và khi nhận tín hiệu cập nhật cùng trình duyệt. Request đang chạy không bị lặp chồng. Khi backend trả paid mới có toast góc trái; deduplicate theo tài khoản/đơn trong phiên. Không POST IPN từ frontend, không tự gọi sync VNPay vì adapter hiện chỉ hỗ trợ IPN đã ký.

### Nếu VNPay báo thành công nhưng API vẫn pending

1. Giữ mã đơn, `paymentId`, `vnp_TxnRef`. Không trả tiền lại để thử.
2. Kiểm tra JSON GET payment/reference. Nếu đã paid nhưng giao diện cũ chưa đổi, cập nhật/reload frontend; phiên bản này tự làm mới.
3. Nếu API vẫn pending, kiểm tra **IPN đã đăng ký tại VNPay** có trỏ đến `https://<backend-public>/api/v1/payments/vnpay/ipn`. Backend localhost không nhận được callback server-to-server từ VNPay qua Internet. Return URL frontend và IPN backend là hai địa chỉ khác nhau.
4. Cấu hình `VNPAY_RETURN_URL=http://localhost:5173/payment/result` đúng origin đang dùng. Chỉ đăng ký public URL/tunnel sau khi chủ dự án quyết định môi trường; lượt này không mở tunnel hoặc đổi khóa thật.
5. Đối chiếu PaymentEvent và phản hồi IPN: 97 chữ ký/merchant không hợp lệ, 01 không tìm thấy, 04 tiền/currency/reference không khớp, 00 đã xử lý theo kết quả backend. URL return có `00` không thay thế xác nhận IPN.

Chưa nhận mã đơn/JSON/IPN URL thực bị kẹt từ người dùng, nên chưa kết luận nguyên nhân vận hành thực tế là thiếu IPN hay cấu hình khác. Đã kiểm tra luồng tự cập nhật bằng API RAM và xác minh IPN bằng test tích hợp H2, không thực hiện thanh toán hoặc webhook sandbox thật.

## Chạy và kiểm tra

Giữ `.env.local` hiện có với `VITE_DEMO_MODE=false`, `VITE_API_BASE_URL=/api/v1`, `DEV_API_TARGET=http://localhost:8088`. Restart Spring Boot để nhận API reference mới; chạy `pnpm dev` và vào `http://localhost:5173/gio-hang`. Backend cần cho phép đúng Origin này.

- Frontend: `pnpm test`, `pnpm build`.
- Backend: `mvn '-Dtest=CheckoutPaymentIntegrationTests,ProductSummaryPriceTests' test`: **23 + 1 test đạt**, gồm IPN hợp lệ tự paid, sai tiền không paid, chủ khác không xem reference; tồn loại lô chưa xác nhận/hết hạn/trừ giữ hàng; giá giảm cùng quy cách. Không dùng DB thật.
- Browser QA riêng: sai số lượng, checkbox, voucher sai/đúng, địa chỉ cũ, đơn online chờ/paid, toast và Admin tự cập nhật. Không gọi cổng thật. Ảnh trong `docs/screenshots/purchase-redesign/`; các ảnh trước khi người dùng đổi bố cục được giữ để tham chiếu, ảnh `checkout-final-*` là bố cục cuối.
