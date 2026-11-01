# Hướng dẫn trình diễn đăng nhập Google và thanh toán VietQR

Tài liệu dành cho người dùng tự thao tác trên dữ liệu hiện có. Không có chế độ giả lập thanh toán hoặc tự đánh dấu thành công. Chưa chạy các kịch bản bên dưới thay người dùng.

## 1. Chuẩn bị một lần

### Backend và dữ liệu

- Dùng backend từ commit `3ce410e` hoặc phiên bản mới hơn có cùng hợp đồng Google/payOS.
- Google cần database đã áp dụng `organic_backend/scripts/sql/20261031_google_login.sql`. Nhờ người quản lý database sao lưu, kiểm tra và chạy nếu chưa có. Đổi `application.yml` không thay thế bước này; frontend không tự chạy SQL.
- Backend và Redis phải hoạt động. Khởi động lại backend sau khi đổi cấu hình. Cổng backend hiện tại là `8088`.
- Chuẩn bị sản phẩm đang bán, có giá và tồn khả dụng, lô còn hạn đã duyệt nhập. Dùng dữ liệu thật đang có, không cần tạo sản phẩm mang tên thử nghiệm.
- Chuẩn bị tài khoản Google chưa liên kết cho luồng đăng ký, hoặc Google đã liên kết cho luồng đăng nhập. Để trình diễn liên kết tài khoản cũ, cần email Google trùng email hồ sơ và biết mật khẩu tài khoản hiện tại nếu có.

### Google Cloud

1. Vào OAuth client loại Web application đang được backend cấu hình.
2. Trong **Authorized JavaScript origins**, thêm đúng origin mở frontend: `http://localhost:5173`. Nếu mở bằng `127.0.0.1` hoặc cổng khác, phải đăng ký đúng origin tương ứng.
3. Nếu màn hình đồng ý của Google còn giới hạn tài khoản thử, thêm tài khoản trình diễn theo cấu hình của dự án.
4. Frontend lấy Client ID công khai từ API challenge. Không sao chép Client Secret vào React, `.env` frontend hoặc gửi qua chat.
5. Luồng đang dùng là Google popup với nonce, không phải chuyển trình duyệt sang `/oauth2/authorization/google` hoặc `/login/oauth2/code/google`.

### Mở frontend

Trong terminal tại `D:\oragnic-pro\organic_frontend`:

```powershell
pnpm dev
```

Mở `http://localhost:5173`. Giữ nguyên cấu hình API `/api/v1`; Vite chuyển tiếp request đến backend `http://localhost:8088`. Cookie challenge Google được gửi qua cùng origin frontend. Không cần chuyển API frontend sang domain ngrok chỉ để nhận webhook.

Với cách chạy local qua proxy này, cấu hình cookie backend mặc định `app.cart.cookie-secure=false`, `app.cart.cookie-same-site=Lax` và origin `http://localhost:5173` phù hợp. Khi triển khai HTTPS/khác site, đối chiếu lại hướng dẫn cookie/CORS trong `organic_backend/docs/GOOGLE_LOGIN.md`, không sao chép nguyên cấu hình local sang production.

### Mở ngrok cho webhook

Máy hiện đã có lệnh `ngrok`. Mở một terminal riêng:

```powershell
ngrok http 8088
```

Nếu ngrok yêu cầu đăng nhập/cấu hình authtoken, lấy token trong tài khoản của bạn và tự chạy trên máy:

```powershell
ngrok config add-authtoken "AUTHTOKEN_CUA_BAN"
ngrok http 8088
```

Không gửi authtoken cho người khác. Lệnh `cls` chỉ xóa nội dung terminal; không khởi động ngrok. Nếu phiên ngrok đang chạy và chiếm terminal, mở terminal khác để nhập các lệnh khác. `Ctrl+C` dừng tunnel.

Ngrok hiển thị một dòng dạng:

```text
Forwarding  https://ten-domain-cua-ban.ngrok-free.app -> http://localhost:8088
```

Lấy **đúng domain HTTPS được cấp**, không dùng nguyên địa chỉ minh họa này. Giữ backend và ngrok cùng chạy trong lúc trình diễn.

### payOS

1. Backend cần cấu hình `payos.client-id`, `payos.api-key`, `payos.checksum-key` trong môi trường/backend; không đưa các khóa đó vào frontend.
2. Đặt URL quay về đúng frontend:
   - `payos.return-url`: `http://localhost:5173/payment/result`
   - `payos.cancel-url`: `http://localhost:5173/payment/cancel`
3. Trong kênh thanh toán payOS, nhập và xác nhận webhook:

```text
https://DOMAIN_NGROK_THUC_TE/api/v1/payments/payos/webhook
```

4. Khi domain ngrok thay đổi, cập nhật và xác nhận webhook lại ở payOS.
5. Backend tự thêm `gateway=payos` và `paymentId` vào URL quay về. Không tự gõ thêm `status=paid` để trình diễn thành công.
6. Sau đăng nhập khách hàng, `GET /api/v1/payments/methods` phải có `data.payos=true` thì VietQR mới chọn được. Điều này chỉ cho biết cấu hình hiện có, chưa chứng minh khóa/kênh thanh toán hợp lệ.

Ngrok cổng 8088 dành cho dịch vụ thanh toán gọi vào backend. Với trình diễn trên chính máy này, Google dùng origin frontend localhost và không cần domain ngrok. Người xem mở localhost trên máy họ sẽ không truy cập được máy của bạn.

## 2. Kịch bản trình diễn chính, khoảng 8–12 phút

| Bước | Thao tác trình diễn | Kết quả mong đợi |
| --- | --- | --- |
| 1 | Mở cửa hàng, vào Đăng nhập hoặc Đăng ký | Có nút Google chính thức và form tài khoản thông thường |
| 2 | Bấm nút Google, chọn tài khoản và chấp thuận | Đăng nhập vào Organic, hiển thị tên/ảnh theo hồ sơ; token Google không xuất hiện trên URL |
| 3 | Nếu là khách Google mới chưa có số điện thoại, cập nhật hồ sơ | Mở form hồ sơ, nhập họ tên/số điện thoại hợp lệ, lưu thành công; có thể tiếp tục mua sắm |
| 4 | Chọn sản phẩm hiện có, thêm vào giỏ, chọn số lượng | Giỏ hiển thị hàng đã chọn và tổng tiền; số lượng không vượt tồn khả dụng |
| 5 | Sang thanh toán, điền thông tin nhận hàng, chọn **Chuyển khoản ngân hàng · VietQR** | Phương thức khả dụng; tổng tiền lấy từ kết quả tính giá của hệ thống |
| 6 | Bấm **THANH TOÁN** sau khi đối chiếu tổng tiền | Tạo đơn, chuyển sang trang `https://pay.payos.vn/...` với QR của đúng lần thanh toán |
| 7 | Dùng ứng dụng ngân hàng quét QR, kiểm tra người nhận, số tiền/nội dung rồi tự xác nhận chuyển | Ngân hàng ghi nhận chuyển khoản thực tế; giữ nguyên thông tin từ QR |
| 8 | Chờ payOS chuyển về cửa hàng; nếu cần dùng nút quay về của payOS | Trang kết quả tự đọc/đối chiếu giao dịch, không cần bấm “Tôi đã thanh toán” |
| 9 | Khi backend trả `paid` | Hiển thị thanh toán thành công và thông báo góc trái; đơn được ghi nhận đã thanh toán |
| 10 | Mở Admin ở trình duyệt/hồ sơ trình duyệt khác, xem Đơn bán & giao hàng | Cùng mã đơn có trạng thái thanh toán đã trả tiền; Admin không phải xác nhận thu tiền trực tuyến thay cho cổng |
| 11 | Nếu muốn trình diễn tiếp, chuẩn bị hàng → lập chuyến → bàn giao → giao thành công → hoàn tất | Thanh toán thành công và giao hàng hoàn tất là hai giai đoạn riêng; tồn/điểm thay đổi theo nghiệp vụ |

payOS hiện dùng môi trường giao dịch thực. Bước chuyển khoản ở trên là chuyển tiền thật; người dùng tự chọn đơn/số tiền phù hợp và tự xác nhận. Không dùng thông tin thẻ/OTP NCB sandbox của VNPay cho payOS.

Để khách và Admin không thay phiên đăng nhập của nhau, nên mở hai hồ sơ trình duyệt khác nhau hoặc một cửa sổ thường và một cửa sổ ẩn danh.

## 3. Trình diễn liên kết Google với tài khoản cũ

1. Đăng nhập bằng tên đăng nhập/mật khẩu hiện tại.
2. Mở **Tài khoản → Đăng nhập bằng Google → Liên kết Google**.
3. Nhập mật khẩu hiện tại nếu tài khoản có mật khẩu, bấm **Tiếp tục liên kết**.
4. Chọn Google có cùng email trong hồ sơ.
5. Thông báo đã liên kết; số đơn và điểm thành viên vẫn giữ trên tài khoản cũ.
6. Đăng xuất, đăng nhập lại bằng Google để xác nhận vào cùng tài khoản.

Nếu bắt đầu bằng Google mà email đã có hồ sơ chưa liên kết, giao diện yêu cầu đăng nhập tài khoản cũ và liên kết. Không tự gộp tài khoản theo email. Backend chưa cung cấp API gỡ Google hoặc đặt mật khẩu cho tài khoản chỉ dùng Google nên không có nút cho các thao tác này.

## 4. Các tình huống đối chiếu thêm

| Tình huống | Kết quả cần thấy |
| --- | --- |
| Không chuyển tiền, quay lại từ payOS | Không hiện thành công nếu backend còn `pending`/`cancelled`; tự cập nhật kết quả thực tế |
| Sửa URL thành `code=00&status=PAID` | Không làm thanh toán thành công; trạng thái lấy từ backend |
| Chuyển thiếu | Chờ xác minh/nhận đủ theo kết quả backend, không ghi nhận đã trả đủ |
| Chuyển thừa/tiền đến trễ | Có thể chuyển cần đối soát, không tự báo thành công hoặc yêu cầu chuyển thêm |
| Tải lại trang kết quả | Đọc lại cùng `paymentId`, không tạo đơn hoặc thu tiền lần nữa |
| Mất kết nối sau khi bấm thanh toán | Mở đơn đã tạo để kiểm tra, không tạo/chuyển lại ngay |
| Google popup bị trình duyệt chặn hoặc tải lỗi | Cho phép popup của website; có thông báo và nút thử lại |
| Phiên Google quá 5 phút, nonce đã dùng hoặc cookie không được gửi | Thử lại nút Google để lấy challenge mới; không phát lại ID token cũ |
| Google email khác email hồ sơ lúc liên kết | Báo lỗi, không chuyển hoặc gộp tài khoản |
| Khách Google mới chưa có điện thoại | Yêu cầu cập nhật hồ sơ trước đặt đơn |

Các tình huống chuyển thiếu/thừa/trễ có thể phát sinh tiền thật và hồ sơ đối soát, không cần thực hiện để trình diễn luồng thành công cơ bản. Khoản hoàn payOS chưa có API hoàn tự động trong backend này; xử lý sau bán dùng ghi nhận hoàn thực tế theo quy trình hiện có.

## 5. Đối chiếu request trong DevTools khi cần

Không sao chép token, mật khẩu hoặc khóa cấu hình ra màn hình trình chiếu/chụp ảnh.

| Luồng | Request chính | Kết quả |
| --- | --- | --- |
| Google | `POST /api/v1/auth/google/challenge` | `clientId`, `nonce`, `expiresIn`; cookie HttpOnly |
| Google | `POST /api/v1/auth/google` với `credential`, `rememberMe` | Phiên Organic và `user.profileCompletionRequired` |
| Liên kết | `POST /api/v1/auth/google/link/challenge`, sau đó `/auth/google/link` | Xác nhận liên kết; giữ phiên/tài khoản hiện tại |
| VietQR | `POST /api/v1/checkout/preview` và `POST /api/v1/orders` | `paymentMethod=payos`; tạo đơn chống lặp bằng Idempotency-Key |
| VietQR | `POST /api/v1/payments/initiate` | `{orderId,gateway:"payos"}` → `id`, `paymentUrl` |
| Kết quả | `GET /api/v1/payments/{paymentId}` và `POST /api/v1/payments/{paymentId}/sync` | Chỉ `data.status=paid` là đã xác minh thu tiền |
| Webhook | `POST /api/v1/payments/payos/webhook` | Xem tại log backend/ngrok; không phải request trình duyệt gửi |

Request trình duyệt ở cổng 5173 là bình thường khi dùng Vite proxy; không có nghĩa đang gửi nhầm cổng backend.

Tài liệu tham khảo: [Google GIS](https://developers.google.com/identity/gsi/web/reference/js-reference), [payOS API](https://payos.vn/docs/api/), [cài đặt và dùng ngrok Windows](https://ngrok.com/download/windows).
