# Đơn mua → Duyệt đơn → Phiếu nhập → Duyệt nhập → Tồn kho/lô → Thông báo

Cập nhật bán hàng/thanh toán ngày 26/10/2026: xem [CHECKOUT_FRONTEND.md](CHECKOUT_FRONTEND.md). “Đơn mua” ở tài liệu này là đơn đặt mua từ nhà cung cấp; đơn khách hàng ở mục “Đơn bán & giao hàng”.

Frontend gọi API thật theo `organic_backend/docs/PROCUREMENT_API.md`. Không thay đổi backend hoặc tự cộng tồn trong trình duyệt. Giữ nguyên logo Mộc và giao diện organic hiện có.

## Chạy cùng backend

1. Backend cần có phiên bản API procurement mới, PostgreSQL/Redis và migration mà tài liệu backend yêu cầu. Nếu database đã có các bảng mua/nhập cũ, chạy `procurement-workflow-migration.sql` theo hướng dẫn backend trước khi khởi động Spring Boot.
2. Tài khoản Admin/nhân viên kho phải ACTIVE và liên kết **hồ sơ employee đang ACTIVE**. Chỉ có role trong tài khoản mà thiếu hồ sơ nhân viên vẫn bị backend từ chối thao tác (403).
3. Trong `.env.local` hiện có, kiểm tra:

   ```dotenv
   VITE_DEMO_MODE=false
   VITE_API_BASE_URL=/api/v1
   DEV_API_TARGET=http://localhost:8088
   ```

   Không cần tạo thêm `.env` cho Vite. `.env.example` là mẫu, không tự được Vite sử dụng. Khởi động lại Vite sau khi đổi biến môi trường.
4. Tại thư mục frontend:

   ```powershell
   pnpm install --frozen-lockfile
   pnpm dev
   ```

5. Đăng nhập bằng tài khoản backend thật. Sáu mục mới ở đầu menu quản lý. Nếu đang ở chế độ demo, trang sẽ hướng dẫn chuyển sang API thật.

## Quyền và đường dẫn

| Trang | Đường dẫn | Quyền |
|---|---|---|
| Đơn mua | `/admin/purchase-orders` | ADMIN, WAREHOUSE_STAFF |
| Duyệt đơn | `/admin/order-approvals` | ADMIN |
| Phiếu nhập | `/admin/goods-receipts` | ADMIN, WAREHOUSE_STAFF |
| Duyệt nhập | `/admin/receipt-approvals` | ADMIN |
| Tồn kho / lô | `/admin/inventory` | ADMIN, WAREHOUSE_STAFF |
| Thông báo | `/admin/notifications` | ADMIN, WAREHOUSE_STAFF |

Nhân viên bán hàng/khách hàng không thấy menu kho và bị chặn khi truy cập trực tiếp. Backend tiếp tục là nơi kiểm tra quyền cuối cùng.

## Thao tác theo quy trình

1. **Đơn mua:** chọn nhà cung cấp hoạt động, chọn biến thể sản phẩm, nhập số gói/hộp nguyên và **giá mua đã thỏa thuận**. Có thể thêm tối đa 100 dòng, không trùng biến thể. Lưu tạo đơn `pending_approval`. Sửa đơn đã duyệt cần duyệt lại. Đơn đã có phiếu nhập khóa sửa/hủy.
2. **Duyệt đơn:** mặc định lọc chờ duyệt. Mở chi tiết, kiểm tra dòng hàng và giá. Chọn duyệt hoặc từ chối; từ chối/hủy phải nhập lý do. Có hộp thoại xác nhận trước khi gửi.
3. **Phiếu nhập:** từ đơn approved chọn “Lập phiếu nhập”, hoặc chọn một đơn đã duyệt chưa có phiếu. Đối chiếu **mọi dòng**: số đạt, bị loại và thiếu. Nếu số đạt ít hơn số đặt phải ghi lý do và thỏa thuận nhà cung cấp. Dòng đạt > 0 cần mã lô và hạn dùng hợp lệ; dòng đạt = 0 không gửi thông tin lô. Lưu nháp rồi mở chi tiết và “Gửi duyệt”.
4. **Duyệt nhập:** Admin kiểm tra số đạt/loại/thiếu, nguồn gốc, ngày sản xuất và hạn dùng. Duyệt → confirmed và backend cộng đúng hàng đạt. Phiếu bị từ chối có thể sửa về draft rồi gửi lại. Phiếu confirmed không được sửa/duyệt lại.
5. **Tồn kho/lô:** tìm tên/SKU, lọc cảnh báo, đặt ngưỡng số gói/hộp nguyên. Chọn “Xem lô” để lọc theo biến thể; lọc lô đã/chưa hết hạn. Lô nháp/chờ duyệt không xuất hiện ở danh sách lô đã nhập.
6. **Thông báo:** đọc hộp thư của tài khoản hiện tại, đánh dấu đã đọc, xem tồn kho liên quan và yêu cầu backend thử lại các kênh chưa gửi. Hộp thư tải lại mỗi 30 giây khi trang đang hiển thị, khi quay lại cửa sổ và khi nhận push. “Thử gửi lại” không có nghĩa email/push đã giao thành công: trạng thái do backend cập nhật sau đó.

Nếu mất mạng lúc duyệt, **tải lại chi tiết trước khi gửi lại**. Frontend không tự lặp request duyệt vì lần đầu có thể đã thành công. Lỗi 409 thường do chứng từ đã đổi trạng thái, đã có phiếu hoặc trùng lô; lỗi 400 là dữ liệu không hợp lệ.

## Firebase Cloud Messaging

Đã cấu hình project public `backend-organic` và Public VAPID key bạn cung cấp trong `src/constants/firebase.js`. Cài thư viện `firebase` bằng pnpm, chỉ dùng App/Messaging; **không khởi tạo Analytics**. Không đưa private key/service-account JSON của backend vào frontend.

Không bắt buộc thêm key lần nữa vào `.env.local` cho project này. Nếu muốn ghi đè cấu hình, các biến mẫu ở `.env.example`:

```dotenv
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
VITE_FIREBASE_VAPID_KEY=...
```

Phải đổi đồng bộ các giá trị khi đổi project. VAPID là **public key của Web Push certificates**, không phải API key hay private VAPID key.

1. Mở frontend bằng **localhost/127.0.0.1** lúc phát triển hoặc **HTTPS** khi deploy. `http://192.168...` thông thường không hỗ trợ Service Worker/Push.
2. Đăng nhập nhân viên kho → Thông báo → **Bật thông báo** → cho phép trong hộp thoại trình duyệt. Không tự bật quyền khi vào trang.
3. Frontend đăng ký Service Worker `/firebase-messaging-sw.js`, lấy token với VAPID và gửi `PUT /api/v1/notifications/devices` cùng Bearer token.
4. Thiết bị đã bật được đăng ký lại khi đăng nhập/quay lại cửa sổ. Token được lấy lại qua SDK để cập nhật khi thay đổi. Đăng xuất gọi DELETE devices **có body `{token}`**, sau đó thu hồi token tại Firebase trước khi xóa phiên. Phiên hết hạn cũng cố gắng thu hồi token tại trình duyệt. Nếu mạng không cho phép thu hồi, giao diện thông báo lỗi để người dùng xử lý.
5. Tab đang mở hiển thị toast, dẫn về đúng biến thể tồn kho; các payload lặp trong phiên được lọc theo notificationId. Tab nền dùng Service Worker. Payload có `notification` được Firebase hiển thị tự động; data-only mới được worker tự hiển thị để tránh thông báo kép. Nếu cần loại trùng thông báo hệ điều hành khi backend gửi lặp, backend nên thêm `webpush.notification.tag = notificationId`; frontend đã đặt tag cho data-only.
6. “Tắt trên thiết bị này” gỡ đăng ký và thu hồi token, giữ hộp thư trong ứng dụng. Khi quyền bị chặn, mở cài đặt quyền của trang web để cho phép lại. Cấu hình web/token là công khai cho client; không ghi token vào console hoặc URL.

Backend cần bật Firebase và jobs, có service-account **riêng ở backend**, truy cập được FCM và liên kết đúng project. Cảnh báo chỉ gửi cho employee ACTIVE có role WAREHOUSE_STAFF ACTIVE; Admin chỉ nhận khi đồng thời có role kho. Backend quét khoảng 5 phút và gửi đợt khoảng 30 giây; token mới đăng ký có thể cần chờ lượt gửi lại. Xem cấu hình chính xác trong tài liệu backend.

### Docker

`pnpm build` build cả SPA và Service Worker bằng npm SDK (không tải SDK từ CDN). Nginx phục vụ worker và runtime-config không cache. `docker/40-runtime-config.sh` tạo cấu hình cho cả page/worker qua `globalThis`.

`docker-compose.yml` đã truyền các biến `VITE_FIREBASE_*` vào container ở runtime; bỏ trống dùng project mặc định. Compose không tự đọc `.env.local` của Vite: nếu muốn override khi Docker chạy, truyền environment/`--env-file .env.local` rõ ràng. Ví dụ:

```powershell
docker compose --env-file .env.local up -d --build
```

Nginx dùng BACKEND_URL trong mạng `my-shared-network`; trình duyệt gọi `/api/v1`, không gọi tên container. Khi truy cập bằng domain thật cần HTTPS ở reverse proxy.

Tham khảo chính thức: [FCM Web setup](https://firebase.google.com/docs/cloud-messaging/web/get-started), [Nhận thông báo Web](https://firebase.google.com/docs/cloud-messaging/web/receive-messages).

## Kiểm chứng

- `pnpm test`: **76/76 đạt, 13 file**; kiểm tra payload, giới hạn số lượng, chênh lệch, ngày lô, quyền sửa theo trạng thái, hợp đồng API và lifecycle token (SDK giả lập).
- `pnpm build`: bundle SPA + worker.
- Browser QA dùng `test-support/backend-fixture.mjs` với `test-support/procurement-fixture.mjs`, dữ liệu trong RAM. Không kết nối database hay gửi email/FCM thật.
- Đã thử trên trình duyệt: lập đơn 10 gói, duyệt, tạo phiếu 8 đạt/1 loại/1 thiếu, gửi duyệt (tồn 0), duyệt nhập (tồn 8), sửa ngưỡng 10 → 5, trạng thái trên ngưỡng; đọc/retry thông báo; role kho không có nút duyệt và bị chặn URL duyệt; role bán hàng không có menu kho và bị chặn URL tồn kho. Màn hình 390 px không tràn ngang trang, bảng cuộn trong khung riêng.
- **Chưa xác minh giao push/email thật** trên project Firebase hoặc giao dịch database thật. Cần kiểm tra end-to-end cùng backend đang chạy bằng tài khoản nhân viên và quyền trình duyệt thực tế. Build/SDK mock không thay thế bước này.
- Docker Compose đã kiểm tra cú pháp; chưa build/chạy container vì Docker daemon trên máy đang tắt tại thời điểm kiểm tra.

Ảnh QA tại `docs/screenshots/procurement/`.
