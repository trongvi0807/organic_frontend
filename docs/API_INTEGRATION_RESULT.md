# Kết quả tích hợp theo PDF — 26/10/2026

Hợp đồng tham chiếu: Organic_Backend_Tai_lieu_Tich_hop_API_Frontend.pdf (144 trang, 155 endpoint, 107 schema). Lượt này chỉ chỉnh frontend; không thay controller, DTO, nghiệp vụ, cấu hình hoặc dữ liệu backend.

## Những chỗ đã sửa

| Vị trí | Trước | Theo PDF / hiện tại |
|---|---|---|
| VNPay return | Gọi `/payments/vnpay/reference/{reference}` ngoài PDF; người dùng gặp HTTP 500 | Lấy đúng payment UUID đã lưu từ initiate, gọi `GET /payments/{id}`. Nếu thiếu mapping, tìm đúng reference trong paymentUrl do API đơn của tài khoản trả về. Không chọn giao dịch gần nhất để đoán. |
| Thanh toán checkout | Tạo đơn rồi cần bấm thanh toán thêm ở trang thành công | Preview → POST orders cùng body/Idempotency-Key → POST payments/initiate → lưu mapping → redirect paymentUrl backend. Nếu cổng lỗi, mở đơn đã tạo để tiếp tục, không đặt đơn mới. |
| Xác thực | 401 đăng xuất ngay | Dùng `POST /auth/refresh-token` với refreshToken. Nhiều request hết hạn dùng chung một lần refresh; giữ body và Idempotency-Key khi gửi lại. Không lặp refresh vô hạn, không thay phiên đăng nhập mới hơn. |
| Phiên giỏ | Token là định danh vòng đời giỏ | ID phiên trình duyệt ổn định qua refresh token, giữ lựa chọn/voucher/điểm trong lần đăng nhập. |
| Đánh giá | Dựa vào `/reviews/eligibility`, POST productId ngoài schema PDF | Đọc `GET /reviews/eligible-items`, tìm chi tiết đơn hợp lệ, POST `orderDetailId, rating, title, content`. Upload chỉ sau khi tạo review thành công. Backend vẫn kiểm tra sở hữu. |
| Admin sản phẩm | Chỉ metadata, chưa có thao tác biến thể/ảnh | Thêm service và cửa sổ **Quy cách / ảnh**: POST/PUT/DELETE variants và images đúng API 037–042. Giá thuộc biến thể, ảnh API nhận URL; không biến thành upload file tự chế. |
| Home / danh mục | Thiếu một số service đọc riêng | Bổ sung 6 API Home đọc riêng và chi tiết category công khai/Admin. Trang Home vẫn ưu tiên API aggregate; không gọi trùng tất cả endpoint khi tải một trang. |
| Tồn công khai | Gọi `/products/{id}/availability` ngoài PDF | Không gọi endpoint này nữa. PDF không cung cấp API công khai số lượng tồn; nếu response không có số lượng, hiển thị kiểm tra khi thanh toán và dùng preview để kiểm tra số lượng. Không gọi API kho của nhân viên bằng tài khoản khách. |

## Danh mục input/output

- [Bảng đủ 155 API](API_INTEGRATION_AUDIT.md): chức năng, method/path, path/query/header/body, kiểu output.
- [Cấu trúc máy đọc được](api-contract.json): requestShape/responseShape, permission, tham số và 107 schema với validation/ví dụ từ PDF. Ví dụ là cấu trúc tài liệu, không phải dữ liệu đã xác thực hoặc giao dịch thật.
- Frontend có service cho **152 API dành cho trình duyệt**. Ba API Stripe webhook, PayPal webhook, VNPay IPN là nhà cung cấp → backend, không gọi từ frontend.
- Kiểm thử `pdfContract.test.js` chạy 152 hàm service, đối chiếu method/path/query/field body (kể cả dòng items), multipart file, Idempotency-Key và phát hiện lời gọi ngoài PDF. Các kiểm thử refresh riêng chạy interceptor Axios thật.
- Tái trích tài liệu: chạy Python có pypdf, `python scripts/audit-api-reference.py "đường-dẫn-tới-PDF"`. Script đọc PDF, không sửa tài liệu gốc. Đường dẫn runtime Python đã dùng là bundle Codex, không cần đưa dependency PDF vào ứng dụng web.

## Phân biệt cổng 5173 và 8088

`.env.local` đang có `VITE_API_BASE_URL=/api/v1`, `DEV_API_TARGET=http://localhost:8088`, `VITE_DEMO_MODE=false`.

Trình duyệt → `http://localhost:5173/api/v1/payments/{id}` → Vite proxy → `http://localhost:8088/api/v1/payments/{id}`. Nhìn thấy 5173 trong Network là bình thường. Không đổi base URL sang đường dẫn `/payments/vnpay/` vì PDF không định nghĩa endpoint đó.

Return URL VNPay phải là route frontend `/payment/result`, giữ nguyên query cổng gửi. IPN là route backend `/api/v1/payments/vnpay/ipn`. Frontend không POST/GET IPN để tự xác nhận, không dùng vnp_ResponseCode=00 để thay trạng thái API.

## Kiểm tra lại trường hợp đang kẹt

1. Chạy backend 8088 và frontend bằng `pnpm dev`, tải lại trình duyệt để dùng mã mới.
2. Với đơn đã chuyển tiền: mở **Đơn mua → đúng đơn → Kiểm tra kết quả**. Đây là đường `paymentId` trực tiếp, không yêu cầu thanh toán lại hoặc cache reference cũ.
3. Network phải gọi `GET /api/v1/payments/<UUID>`, không còn `/payments/vnpay/reference/...`. Nếu API trả `status: paid`, trang báo thành công và toast góc trái; Admin lấy lại đơn qua API.
4. Nếu response của chính GET payments/id vẫn `pending`, frontend tiếp tục hiển thị chờ xác nhận đúng hợp đồng. Cần đối chiếu IPN/trạng thái thanh toán tại backend; không đổi trạng thái thành paid bằng frontend. HTTP 200 hoặc không có exception trong log chưa đủ để chứng minh paymentStatus đã paid.
5. Nếu mapping phiên bị mất và API đã xóa paymentUrl sau khi paid, PDF không có API tra merchant reference trực tiếp. Không suy đoán: mở đúng đơn và payment UUID theo bước 2. Lần thanh toán mới đã lưu mapping trước khi redirect.

Chưa xác minh giao dịch VNPay thực của người dùng hoặc gọi gateway/IPN thật trong lượt này. Các thử nghiệm dùng dữ liệu RAM riêng, không thay đổi DB thật. Ở lần kiểm tra đầu cổng 8088 chưa kết nối được; sau đó public API statistics trả HTTP 200. Chưa có token/mã payment UUID của giao dịch thật để đối chiếu status.

## Kết quả xác minh cuối

288/288 test (25 file) và build SPA/worker đạt. Browser QA riêng đã thấy VNPay tự chuyển sang Đã thanh toán theo API, Admin nhận trạng thái tương ứng, sửa giá quy cách đọc lại đúng. API fixture RAM không gọi gateway/IPN thật. Ảnh: [VNPay](screenshots/api-audit/vnpay-paid.png), [Admin](screenshots/api-audit/admin-paid.png), [biến thể](screenshots/api-audit/admin-variants.png).
