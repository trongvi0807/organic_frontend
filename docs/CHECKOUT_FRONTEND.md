# Thanh toán và tích hợp API backend — 26/10/2026

**VNPay cập nhật 29-10-2026:** xem [luồng hiện tại và kiểm tra thủ công](VNPAY_FLOW_20261029.md). Đã bổ sung xác minh Return ở backend và đồng bộ kết quả ngay khi khách quay về.

**Bố cục cuối đã cập nhật:** ưu đãi/đổi điểm chỉ ở giỏ, checkout theo ảnh mẫu và nút THANH TOÁN. Đọc [PURCHASE_REDESIGN.md](PURCHASE_REDESIGN.md) cho thay đổi mới, địa chỉ và VNPay tự làm mới; các mục dưới mô tả nền tảng tích hợp trước khi đổi bố cục.

Trang `/thanh-toan` đã thay bản xem trước bằng luồng dùng API thật theo `organic_backend/docs/CHECKOUT_PAYMENTS_API.md` và `CART_API.md`. Không sửa backend trong lượt này.

## Chạy local

1. Cập nhật backend có API checkout mới. Với database cũ, thực hiện migration `organic_backend/docs/checkout-migration.sql` theo tài liệu backend trước khi chạy Spring Boot. Có PostgreSQL/Redis và lô hàng đã được duyệt nhập, còn hạn, đủ số lượng bán.
2. Dùng `.env.local` hiện có ở frontend:

   ```dotenv
   VITE_DEMO_MODE=false
   VITE_API_BASE_URL=/api/v1
   DEV_API_TARGET=http://localhost:8088
   ```

3. Chạy tại thư mục frontend:

   ```powershell
   pnpm install --frozen-lockfile
   pnpm dev
   ```

4. Mở **http://localhost:5173**. Vite dùng `strictPort: true` để tránh tự đổi cổng, gây lệch Origin/callback thanh toán. Nếu cổng bận, đóng phiên Vite cũ hoặc chọn cổng khác **và đổi đồng bộ cấu hình backend**.
5. Đăng nhập CUSTOMER → chọn hàng trong Giỏ hàng → Tiến hành thanh toán. Admin/nhân viên không có CUSTOMER không dùng giỏ tài khoản. Các tài khoản xử lý đơn cần employee ACTIVE liên kết account ACTIVE.

### Origin và cổng frontend

Backend mặc định chỉ cho phép `http://localhost:5173`. `localhost` và `127.0.0.1` là hai Origin khác nhau; đổi cổng cũng là đổi Origin. Giỏ khách dùng cookie HttpOnly, frontend gửi `withCredentials: true`. Backend kiểm tra Origin khi ghi giỏ.

Nếu sử dụng cổng khác hoặc frontend Docker, cấu hình **ở backend** bằng Spring properties hoặc biến môi trường tương ứng, ví dụ:

```text
APP_CART_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
STRIPE_SUCCESS_URL=http://localhost:5173/payment/result
STRIPE_CANCEL_URL=http://localhost:5173/payment/cancel
PAYPAL_RETURN_URL=http://localhost:5173/payment/result
PAYPAL_CANCEL_URL=http://localhost:5173/payment/cancel
VNPAY_RETURN_URL=http://localhost:5173/payment/result
```

Thay bằng đúng URL đang dùng. Nếu frontend Docker chạy port 3000 thì return URL cũng dùng port 3000. Không sửa proxy để giả Origin hoặc tắt kiểm tra nguồn gửi. Production dùng HTTPS và cấu hình cookie secure ở backend.

## Cấu hình thanh toán

Frontend gọi `GET /payments/methods` để bật/tắt lựa chọn COD/Stripe/PayPal/VNPay. Cổng chưa đủ cấu hình hiển thị nhưng bị vô hiệu hóa. Không đưa secret của Stripe, PayPal hoặc VNPay vào `VITE_*`. Luồng hiện tại dùng trang thanh toán redirect của backend nên không cần Stripe.js hay publishable key ở frontend.

Backend giữ cấu hình trong `application.yml` và biến môi trường theo `organic_backend/docs/PAYMENT_LOCAL_SETUP.md`; không đưa secret vào frontend. Webhook/IPN cần URL HTTPS public của backend và signing secret/webhook ID đúng môi trường.

Các route quay về đã triển khai:

- `/payment/result?paymentId=...`
- `/payment/cancel?paymentId=...`

VNPay quay về không có paymentId thì gửi query đã ký sang POST `/payments/vnpay/return` để xác minh; đọc lại bằng GET `/payments/vnpay/reference/{vnp_TxnRef}`. Không phụ thuộc ánh xạ trình duyệt, không suy ra trả tiền từ riêng `vnp_ResponseCode`, `status=paid` hoặc tham số tự thêm.

## Luồng khách hàng

1. **Giỏ Redis:** khách vãng lai dùng cookie qua public transport; CUSTOMER dùng Bearer qua private transport. GET sau login tự gộp giỏ khách. Hiển thị merge pending khi vượt giới hạn, không tự cắt số lượng. Không tự import giỏ localStorage cũ vào tài khoản thật; giỏ localStorage chỉ còn dùng ở demo.
2. **Chọn hàng:** giữ checkbox chọn riêng, tăng/giảm số lượng, xóa dòng, xóa tất cả có xác nhận. Số lượng PATCH là tuyệt đối; POST thêm là phép cộng. Khi write lỗi, chỉ đọc lại, không tự lặp POST.
3. **Thông tin:** điền người nhận/điện thoại/địa chỉ, có thể chọn địa chỉ đã lưu. Chọn mã đang công bố hoặc tự nhập; chọn điểm nguyên theo số dư khả dụng; tối đa 50 điểm/đơn.
4. **Kiểm tra đơn:** POST preview bằng variantId/quantity và thông tin giao hàng. Không gửi đơn giá, tổng tiền, customerId hoặc paymentStatus. Tổng tiền, VAT, phí giao, giảm giá và điểm dự kiến hiển thị từ backend.
5. **Đặt đơn:** chỉ bật khi preview khớp nội dung hiện tại. Kiểm tra preview lần nữa trước khi gửi để phát hiện thay đổi giá/ưu đãi; nếu thay đổi yêu cầu khách xem lại. Backend vẫn là nơi chốt giá và tồn ở giao dịch tạo đơn; API chưa có quote-version để khóa tuyệt đối giá giữa hai request.
6. **Chống đặt trùng:** lưu payload và Idempotency-Key vào sessionStorage trước POST orders. Nếu không lưu được key thì không gửi tạo đơn. Lỗi mạng/5xx giữ lần đặt; tải lại trang vẫn có nút khôi phục, gửi đúng body/key cũ. Không preview lại hoặc tạo key mới trong bước khôi phục vì đơn có thể đã giữ hàng.
7. **Sau tạo:** mở chi tiết đơn. Chỉ xóa các dòng đã mua nếu số lượng hiện tại còn khớp; giữ dòng chưa chọn hoặc số lượng đã đổi. Backend chưa có thao tác remove-if-quantity nguyên tử, nên sửa cùng lúc từ nhiều tab vẫn có thể chạy đua; frontend không gọi clear toàn giỏ khi checkout.
8. **Thanh toán online:** tại chi tiết đơn chọn “Tiếp tục thanh toán”, gọi initiate, lưu paymentId/orderId trước redirect. Chỉ chấp nhận URL HTTPS đến host của cổng tương ứng. COD và đơn 0 đồng không gọi cổng.
9. **Kết quả:** hiển thị theo trạng thái backend. VNPay gửi query Return để xác minh/lưu; khi thiếu query thì tra cứu reference/payment và đối chiếu QueryDR một lần. Có nút sync; polling thường chỉ GET trạng thái. PayPal vẫn yêu cầu thao tác capture sau buyer approval, không capture chỉ vì truy cập URL.
10. **Đơn hàng/điểm:** xem trạng thái và yêu cầu hủy trước khi chuẩn bị/chưa trả tiền theo điều kiện backend. Không tự báo đã hủy khi chỉ quay lại `/payment/cancel`. Đơn paid/requires_review không tự hoàn tiền. Xem số dư, điểm đang giữ và lịch sử điểm dạng list phân trang từ API.

## Trang và phân quyền

| Trang | Route | Vai trò |
|---|---|---|
| Thanh toán | `/thanh-toan` | Khách chưa login thấy lời mời; đặt hàng cần CUSTOMER |
| Đơn của tôi / chi tiết | `/don-hang`, `/don-hang/:id` | CUSTOMER |
| Điểm thưởng | `/diem-thuong` | CUSTOMER |
| Đánh giá của tôi | `/danh-gia-cua-toi` | CUSTOMER |
| Xử lý đơn bán / giao hàng | `/admin/sales-orders` | ADMIN, SALES_STAFF, WAREHOUSE_STAFF |
| Khoản tiền cần đối soát | `/admin/payment-review` | ADMIN, SALES_STAFF |
| Mã khuyến mãi | `/admin/promotions` | ADMIN |

Quản lý đơn: prepare → ghi nhận chuyến đặt ngoài → picked_up → giao hàng. Xác nhận bàn giao mới xuất kho. COD collect/reconcile chỉ Admin/bán hàng; complete chỉ khi đủ điều kiện. Các hành động có hộp thoại xác nhận, nút bị khóa khi đang xử lý. Không có nút tự hoàn tiền/đánh dấu resolved vì backend chưa cung cấp API đó.

Khuyến mãi: tạo/sửa/xem/ngừng mã, chọn phạm vi sản phẩm hoặc lô đã nhập còn hạn. Mã đã dùng/đang giữ bị backend khóa sửa; ngừng mã không thay đổi điều kiện của đơn đã giữ.

Đánh giá: nối eligibility hiện có, tạo/sửa/xóa đánh giá của mình, xem dòng mua đủ điều kiện, tải ảnh/video, sửa mô tả/thứ tự và xóa tệp có xác nhận. DTO mediaUrl được hỗ trợ. Quota 5 ảnh × 5 MiB + 1 video × 50 MiB; upload từng tệp. Nginx đã tăng giới hạn multipart lên **60m** khớp backend, thay mức 6m cũ gây 413 cho video.

## Chuông thông báo ở hai giao diện

`NotificationBell` có trong header Admin và header cửa hàng. Chấm đỏ chỉ hiện khi dữ liệu gần đây có mục chưa đọc/chưa xem. Dropdown có thể đóng bằng Escape hoặc bấm bên ngoài, dẫn về đúng đơn/biến thể.

- ADMIN/WAREHOUSE đọc cảnh báo kho từ `/notifications` và PATCH read qua API.
- Khách hàng đọc cập nhật từ **đơn của chính mình**; nhân viên đọc danh sách đơn quản lý theo quyền. Thay đổi orderStatus/paymentStatus tạo mục cập nhật mới.
- Backend hiện chưa có notification inbox cho CUSTOMER/SALES_STAFF. Vì vậy trạng thái đã xem của **cập nhật đơn** được lưu theo tài khoản trên thiết bị, không giả gọi PATCH notifications vốn chỉ dành cho role kho/Admin. Giao diện ghi rõ khác biệt này.
- Chuông chỉ lấy 20 cảnh báo kho và 10 đơn gần nhất, tải lại định kỳ 30 giây khi tab hiển thị, khi focus/bấm chuông và khi nhận push. Chấm đỏ không phải bộ đếm tổng mọi thông báo lịch sử.
- Firebase push vẫn theo quyền/kênh của backend hiện có, không tự mở rộng thành push cho khách hàng. Xem `PROCUREMENT_FRONTEND.md`.

## Kiểm thử và giới hạn

- **100/100 test đạt, 16 file**; build SPA + worker thành công. Vẫn có cảnh báo chunk chính khoảng 526 kB trước gzip.
- Browser QA chỉ dùng fixture RAM ở 19094, Vite 5184; không tạo đơn DB thật, gọi gateway thật hay gửi FCM/email.
- Đã kiểm tra: guest add/merge sau login; mã sai và hợp lệ; dùng 2 điểm; tổng 56.000 − 5.600 − 4.000 = 46.400; tạo COD, chi tiết đơn và xóa dòng đã mua; flow nhân viên chuẩn bị/chuyến/lấy/giao/COD/đối soát/hoàn tất; sửa/ngừng mã; eligibility và gửi/sửa đánh giá; chuông hai header và đánh dấu đã xem.
- Giả lập server đã ghi đơn rồi trả 503: tải lại checkout, khôi phục đúng key/body, danh sách vẫn chỉ có một đơn. Pha 503/409 có lỗi HTTP chủ động dự kiến; luồng bình thường không có lỗi console khi kiểm tra.
- Kết quả URL thêm `status=paid` vẫn hiện pending cho đến khi API sync trả paid. Màn hình 390 px có chiều rộng trang 375 px gồm scrollbar, không tràn ngang; có ảnh desktop/mobile.
- **Chưa chạy sandbox end-to-end với webhook Stripe/PayPal/IPN VNPay thật**, chưa kiểm tra gateway redirect thực tế/capture/thu tiền. Chưa xác minh upload Cloudinary hoặc FCM thật trong lượt này. Cần bước này cùng backend và cấu hình callback public trước khi vận hành.
- Compose kiểm tra cú pháp đạt; image Docker build thành công. Chạy Nginx với backend QA RAM trong mạng Docker cô lập: nginx -t đạt, health/deep link `/thanh-toan`/worker trả 200, runtime config đúng và proxy cart/payment methods trả JSON 200 qua container network. Không thay đổi container database hoặc mạng backend thật.
- Không đưa private payment/Firebase keys vào frontend.

Ảnh tại `docs/screenshots/checkout/`.
