# Kiểm tra lỗi upload avatar — 21/10/2026

## Đối chiếu frontend và backend đang chạy — 22/10/2026

Đã kiểm tra trên tài khoản seed `customer`, xác nhận ban đầu không có avatar. Đăng nhập thật lấy JWT,
dùng cùng token và cùng ảnh `public/images/carrots.jpg` (JPEG, 46.256 byte) cho hai request liên tiếp:

| Đường gọi | Kết quả |
| --- | --- |
| `createProfileService().uploadAvatar()` của frontend → Vite `127.0.0.1:5173/api/v1` → backend | HTTP 502, `Không thể tải ảnh lên Cloudinary. Vui lòng thử lại.` |
| POST FormData trực tiếp `127.0.0.1:8088/api/v1/customers/me/avatar`, bỏ qua frontend/Vite | HTTP 502, cùng message |

Tệp đầu vào có SHA-256 `1081b5231e4930529fecf5a0c531dfb35285999d7fe012598b60849a39f6a3f3`.
Hai request tạo multipart riêng, nhưng token, bytes, MIME và tên field `file` giống nhau.
Sau kiểm tra tài khoản seed vẫn không có avatar; không thay hồ sơ người dùng cá nhân.

**Kết luận:** lỗi 502 đang tái hiện được bằng request đi thẳng tới Spring Boot, không phụ thuộc frontend.
Điều này chưa xác định chính xác vì sao tiến trình Spring Boot thất bại ở Cloudinary; cần log exception
của request thực tế để phân biệt cấu hình đang chạy, dịch vụ ngoài hoặc nội dung tệp.

Phép đối chiếu chạy mã service Axios thật bằng Vitest/Node và backend đang chạy, không phải fixture.
Chưa chạy lại thao tác trong trình duyệt ở lượt này do công cụ trình duyệt lỗi khởi tạo sandbox.
Test chẩn đoán tạm đã được dọn; kết quả đối chiếu không được tính là upload thành công.

### Tự kiểm tra bằng Bruno

1. POST `http://localhost:8088/api/v1/auth/login`, JSON `username`/`password` của tài khoản CUSTOMER hợp lệ.
2. Lấy `data.accessToken`, đặt vào Auth Bearer Token của request upload.
3. POST `http://localhost:8088/api/v1/customers/me/avatar`. Body chọn Multipart Form, thêm trường `file`,
   kiểu File, chọn cùng ảnh đã dùng trên frontend. Để Bruno tự tạo Content-Type/boundary.
4. Xem HTTP status và JSON Response. 502 với cùng message nghĩa là backend vẫn lỗi khi bỏ qua frontend;
   200 kèm `data.avatarUrl` mới là upload thành công. 401/403 là vấn đề phiên/quyền, không dùng làm kết luận về Cloudinary.

## Cập nhật xác minh credentials — 22/10/2026

Đã dùng credentials người dùng cung cấp để kiểm tra REST ping và Java SDK 1.38.0 của backend: cả hai xác thực
thành công. Upload JPEG kiểm thử với cùng bộ tùy chọn avatar thành công, response HTTPS/public ID hợp lệ;
đã xóa ảnh QA ngay sau đó (`ok`). Không ghi key/secret vào mã nguồn/file chẩn đoán, không thay avatar thật.
Gọi trực tiếp lớp `CloudinaryAvatarStorage` với `MultipartFile` JPEG cũng thành công, xóa ảnh thử thành công.
Backend unit test `CloudinaryAvatarStorageTests` đạt 5/5, bao gồm việc che credentials trong log.

Backend có thêm log `Cloudinary avatar upload failed: ...`, che credentials, giữ loại exception/nguyên nhân
để tìm lỗi 502 của request thực tế sau restart. Chưa tái hiện lỗi với bộ key này và ảnh JPEG hợp lệ;
không kết luận chắc chắn credentials trong tiến trình IntelliJ sai hoặc tệp gốc lỗi khi chưa có log runtime.
Xem thêm `organic_backend/docs/CLOUDINARY_CONFIGURATION.md`.

## Kết luận từ request thực tế

Người dùng cung cấp request `POST http://localhost:5173/api/v1/customers/me/avatar`, HTTP **502**, response:

```json
{
  "code": 502,
  "message": "Không thể tải ảnh lên Cloudinary. Vui lòng thử lại.",
  "error": "Bad Gateway",
  "path": "/api/v1/customers/me/avatar"
}
```

Thông báo này được tạo bởi `organic_backend/src/main/java/vn/huit/nhom1/service/impl/CloudinaryAvatarStorage.java`, trong catch của `upload()`. Nhánh này bắt lỗi gọi Cloudinary hoặc kiểm tra phản hồi Cloudinary không đầy đủ (`secure_url`, `public_id`), rồi trả `ApiException(BAD_GATEWAY, ...)`.

Luồng: trình duyệt → Vite 5173 → Spring Boot 8088 → Cloudinary. Địa chỉ 5173 trong DevTools là bình thường vì frontend dùng proxy. Backend và Home hoạt động không bảo đảm tích hợp Cloudinary hoạt động.

Đã đối chiếu contract: frontend dùng POST, FormData trường `file`, có bearer token; endpoint khớp `CustomerProfileController`. Sai MIME/chữ ký ảnh thường được backend trả 400, quá dung lượng trả 413, quyền truy cập trả 401/403. Response 502 cụ thể ở trên khoanh vùng tới storage Cloudinary; **chưa xác định exception gốc** vì catch hiện tại không lưu cause/log lỗi upload.

## Các bước phía backend cần kiểm tra

1. Trong Run Configuration của ứng dụng Spring Boot ở IntelliJ, kiểm tra các biến `CLOUDINARY_API_KEY` và `CLOUDINARY_API_SECRET` mà `application.yml` tham chiếu. Chúng phải thuộc cùng product environment với `cloudinary.cloud-name`. Biến trong terminal/frontend không tự truyền cho tiến trình Java đã chạy. Khởi động lại backend sau khi sửa cấu hình. Không đưa khóa này vào `VITE_*`.
2. Để biết lỗi chính xác, đặt breakpoint tại catch của `CloudinaryAvatarStorage.upload()` và xem biến `failure` trong IntelliJ khi thử lại một ảnh JPEG/PNG nhỏ, hợp lệ. Kiểm tra loại exception và thông báo gốc: xác thực/signature, kết nối/TLS/timeout, nội dung ảnh hoặc phản hồi thiếu trường. Có thể bổ sung logging nội bộ ở backend nếu nhóm muốn; chưa thay đổi backend trong lượt kiểm tra này.
3. Kiểm tra kết nối từ môi trường chạy Java tới Cloudinary. Endpoint `GET https://api.cloudinary.com/v1_1/{cloud_name}/ping` dùng Basic Auth cho chẩn đoán chỉ đọc; xem [tài liệu Cloudinary](https://cloudinary.com/documentation/admin_api#ping). Không công khai secret/header Authorization khi chia sẻ log. HTTP 200 của ping chỉ chứng minh xác thực/kết nối Admin API, không chứng minh quyền upload hay xử lý ảnh thành công.
4. Sau khi xử lý nguyên nhân, thử upload ở `/tai-khoan`: kỳ vọng HTTP 200, `data.avatarUrl` mới, ảnh vẫn còn khi tải lại trang. Kiểm tra ảnh được lưu trên Cloudinary và hồ sơ backend thật. Các bước này chưa được xác minh với tài khoản thật trong phiên này.

## Các cải thiện frontend đã thực hiện

- Giữ đúng multipart/boundary do trình duyệt tạo, tên part `file`, private Axios đính kèm token.
- Timeout riêng cho avatar 60 giây thay vì mặc định 15 giây; không tự gửi lại POST khi timeout vì backend có thể vẫn đang xử lý.
- Hiển thị đang tải, HTTP status và message thực từ server; lỗi không làm mất hồ sơ/ảnh cũ. Có nút tải lại hồ sơ để kiểm tra kết quả sau timeout/lỗi.
- Chặn tệp rỗng, giữ giới hạn JPEG/PNG/WebP, 5 MiB.
- Frontend Docker: đặt Nginx `client_max_body_size 6m` để đủ tệp 5 MiB cộng multipart overhead; `proxy_read_timeout 90s`. Đã tái hiện giới hạn mặc định cũ chặn body 2 MiB với 413. Đây là lỗi cấu hình riêng, **không phải nguyên nhân của response 502 người dùng cung cấp ở Vite 5173**.

Nếu dùng `pnpm dev`, tải lại trang để nhận code frontend mới. Nếu dùng frontend Docker, áp dụng cấu hình mới bằng:

```powershell
docker compose up -d --build frontend
```

Rebuild frontend không sửa được khóa/kết nối Cloudinary phía Java.

## Bằng chứng và giới hạn kiểm thử

- 43/43 test đạt, build thành công. Test transport dùng Axios thật qua HTTP tới server cục bộ, xác minh multipart boundary, bearer, part `file`, MIME, tên tệp, toàn bộ byte và unwrapping response hồ sơ. Không gọi Cloudinary trong unit test.
- Browser QA riêng: đăng nhập CUSTOMER fixture, mở `/tai-khoan`, chọn JPEG qua file chooser, thấy đang tải/khóa nút rồi cập nhật ảnh theo `avatarUrl` response. Chọn README.md bị chặn, ảnh cũ được giữ; tải lại hồ sơ hoạt động. Fixture trả ảnh bơ cố định sau khi xác minh multipart, không lưu ảnh thật lên Cloudinary/DB.
- Nginx container cô lập dùng chính template frontend, upstream stub: body 2 MiB trước sửa trả 413, sau sửa đi qua nhận 204 từ stub; body 7 MiB vẫn 413; `nginx -t` đạt. Không coi đây là upload thật lên Spring Boot.
- Trong phiên kiểm tra sau ảnh người dùng gửi: Home trực tiếp 8088 và qua Vite 5173 đều 200. Cloudinary public ping không xác thực trả 401 (host truy cập được), chưa xác minh credential/quyền upload của tiến trình Java.
- Không sửa backend, không thay avatar người dùng thật. Ảnh QA: [Tài khoản sau upload fixture](screenshots/avatar-upload/account-qa.png).
