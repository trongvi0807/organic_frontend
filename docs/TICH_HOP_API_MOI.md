# Tích hợp API Home, khách hàng và truy xuất — 20/10/2026

Frontend đã được đối chiếu với controller, DTO và ba tài liệu `HOME_API.md`, `CUSTOMERS_SUPPLIERS.md`, `ORIGINS_CERTIFICATIONS.md` trong thư mục backend liền kề. Sau khi chạy thật, có bổ sung bản sửa truy vấn `GROUP BY` trong `HomeCatalogRepository` của backend cho lỗi Home 503; xem mục kiểm thử bên dưới. Không thay đổi cấu hình backend hay dữ liệu nghiệp vụ.

## 1. Chức năng đã nối

| Màn hình | Đường dẫn frontend | API chính, sau tiền tố `/api/v1` |
| --- | --- | --- |
| Trang chủ | `/` | `GET /home` |
| Biên tập trang chủ | `/admin/home` | `/admin/home/content`, `/admin/home/products`, `/admin/home/products/{id}/featured`, `/admin/home/cache/refresh` |
| Hồ sơ khách hàng | `/admin/customers` | `/customers`, `/customers/{id}`, avatar và địa chỉ của khách hàng |
| Hồ sơ cá nhân | `/tai-khoan` | `/customers/me`, `/customers/me/avatar`, `/customers/me/addresses` |
| Nhà cung cấp | `/admin/suppliers` | `/suppliers`, `/suppliers/{id}` |
| Xuất xứ | `/admin/origins` | `/origins`, `/origins/{id}`, `/origins/{id}/products` |
| Chứng nhận | `/admin/certifications` | `/certifications`, metadata, tài liệu, duyệt, lưu trữ/khôi phục, sản phẩm liên kết |
| Truy xuất sản phẩm | `/admin/traceability` | `/products/traceability-options`, `/products/{id}/traceability`, `/products/{id}/origin`, `/products/{id}/certifications/{certificationId}` |

Các danh sách hỗ trợ tìm kiếm, phân trang và bộ lọc phù hợp. Xuất xứ lọc thêm mã quốc gia, nhà cung cấp; chứng nhận lọc trạng thái duyệt, thời hạn và kho lưu trữ. Quản lý sản phẩm hiện có thêm liên kết đến truy xuất của từng sản phẩm.

**“Quản lý người dùng” hiện được triển khai theo API hồ sơ khách hàng của backend.** Tạo hồ sơ khách hàng không tạo tài khoản đăng nhập. Chưa có màn hình quản trị toàn bộ tài khoản, cấp quyền hoặc đổi mật khẩu vì nhóm API này không cung cấp các thao tác đó. Trường `accountId` dùng liên kết tài khoản CUSTOMER có sẵn; bỏ trống khi sửa sẽ gỡ liên kết theo hợp đồng backend.

## 2. Phân quyền giao diện

| Thao tác | ADMIN | SALES_STAFF | WAREHOUSE_STAFF | CUSTOMER |
| --- | --- | --- | --- | --- |
| Sản phẩm, danh mục, biên tập Home | Có | Không | Không | Không |
| Xem/thêm/sửa khách hàng | Có | Có | Không | Chỉ hồ sơ của mình |
| Xem nhà cung cấp, xuất xứ, chứng nhận, truy xuất | Có | Có | Có | Không |
| Thêm/sửa nhà cung cấp, xuất xứ, chứng nhận; tài liệu; gắn liên kết sản phẩm | Có | Không | Có | Không |
| Ngừng hoạt động/lưu trữ; khôi phục chứng nhận | Có | Không | Không | Không |
| Duyệt/từ chối/thu hồi chứng nhận | Có | Không | Không | Không |

CUSTOMER quản lý thông tin cá nhân, ảnh đại diện và địa chỉ nhận hàng của chính mình. Backend vẫn là nơi quyết định quyền cuối cùng; ẩn nút và bảo vệ route không thay thế Spring Security. Khi phiên hết hạn, cần đăng nhập lại.

## 3. Chạy với backend thật

### Bước 1 — Hạ tầng và Spring Boot

Mở Docker Desktop, vào thư mục backend, chạy các dịch vụ đã có:

```powershell
cd D:\oragnic-pro\organic_backend
docker compose up -d postgres_db redis
docker compose ps
```

Kiểm tra cấu hình PostgreSQL, Redis, JWT, email và Cloudinary của backend theo môi trường của nhóm. Nếu chạy Spring Boot bằng IntelliJ trên máy, địa chỉ DB/Redis dùng cổng publish trên host; nếu chạy Spring Boot trong Docker, dùng tên service và cổng bên trong container. Không dùng lẫn hai cách.

Chạy lớp ứng dụng Spring Boot trong IntelliJ và chờ log khởi động thành công ở cổng 8088. Kiểm tra API public bằng PowerShell:

```powershell
Invoke-RestMethod http://localhost:8088/api/v1/home | ConvertTo-Json -Depth 8
```

### Bước 2 — Cấu hình frontend

Sử dụng `.env.local` đang có, không cần tạo thêm `.env` cho Vite dev:

```dotenv
VITE_API_BASE_URL=/api/v1
VITE_DEMO_MODE=false
DEV_API_TARGET=http://localhost:8088
```

Không chép đè `.env.local` bằng `.env.example` nếu đã có cấu hình đúng. `.env.example` là mẫu; `.env.local` chứa lựa chọn trên máy. Các biến `VITE_*` là công khai, không đặt mật khẩu DB, JWT secret hoặc Cloudinary API secret ở frontend.

```powershell
cd D:\oragnic-pro\organic_frontend
node --version
pnpm.cmd --version
pnpm.cmd install --frozen-lockfile
pnpm.cmd dev
```

Nếu chưa có pnpm, chạy `npm.cmd install --global pnpm@11.25.0`, mở lại terminal rồi thử lại. `nvm` chỉ quản lý phiên bản Node, không thay cho `pnpm dev`. Trong terminal PowerShell, hậu tố `.cmd` giúp tránh vướng chính sách chạy script `.ps1`.

Mở URL Vite in trong terminal, thường là `http://localhost:5173`. Khởi động lại Vite sau mỗi lần thay đổi biến môi trường. Nếu cổng bận, Vite có thể chọn cổng khác.

```text
Trình duyệt :5173/api/v1/home → Vite proxy → Spring Boot :8088/api/v1/home
```

Nếu chạy cả ứng dụng bằng Docker, giữ cách cấu hình Nginx/network trong hướng dẫn chạy dự án: trình duyệt gọi `/api/v1`, Nginx gọi `http://organic-backend:8088` qua external network `my-shared-network`. Network là tài nguyên Docker, không phải thư mục dự án. Cần khai báo cả network cấp cao của Compose và gắn service Spring Boot vào network đó. Chỉ gắn PostgreSQL/Redis không làm xuất hiện container Spring Boot. Đợt tích hợp API này không yêu cầu thay đổi network.

### Bước 3 — Kiểm tra kết nối thật

1. Mở DevTools → Network → Fetch/XHR, tải lại trang chủ. Tìm `GET /api/v1/home`, kiểm tra HTTP 200 và JSON có `data.content`, các bộ sưu tập sản phẩm, xuất xứ/chứng nhận. Nếu API chưa có dữ liệu thì một số phần sẽ được ẩn.
2. Đăng nhập bằng tài khoản backend đã được cấp role. Dữ liệu đăng nhập demo của frontend không thay thế tài khoản thật.
3. Mở module quản lý phù hợp, kiểm tra request `GET` trả dữ liệu từ DB. Tạo một hồ sơ thử với mã riêng rồi tải lại trang để kiểm tra việc lưu bền vững.
4. Đối chiếu bản ghi trong backend/DB. Một toast thành công ở giao diện chưa đủ chứng minh lưu DB đúng.
5. Với upload, kiểm tra request multipart có trường `file`, response có `documentUrl`/`avatarUrl`, rồi mở URL thực tế. Cần cấu hình Cloudinary backend hợp lệ. Đừng đặt khóa Cloudinary ở frontend.

Trong API mode, lỗi mạng được hiển thị cùng nút thử lại; không tự thay bằng dữ liệu demo. Các module quản lý mới yêu cầu API thật và sẽ báo rõ khi đang bật demo mode.

## 4. Kịch bản demo nghiệp vụ

1. **Nhà cung cấp:** thêm mã nhà cung cấp, tên và thông tin liên hệ.
2. **Xuất xứ:** thêm vùng/cơ sở sản xuất, mã quốc gia ISO alpha-2 (ví dụ `VN`), chọn nhà cung cấp.
3. **Chứng nhận:** thêm số chứng nhận, tổ chức cấp, ngày cấp/hết hạn. Hồ sơ ở trạng thái chờ duyệt.
4. **Minh chứng:** mở chi tiết chứng nhận, tải PDF/JPEG/PNG/WebP tối đa 5 MB.
5. **Duyệt:** đăng nhập ADMIN, chỉ duyệt khi có tài liệu và đang trong thời hạn. Từ chối/thu hồi yêu cầu lý do.
6. **Truy xuất:** chọn sản phẩm, gắn xuất xứ và chứng nhận. Kiểm tra `effectiveOrganicStatus` backend trả về; gắn hồ sơ đang chờ duyệt không tự tạo nhãn đã xác minh.
7. **Home:** chọn sản phẩm nổi bật/thứ tự trong quản lý trang chủ, sửa nội dung/banner/FAQ, lưu và mở trang chủ. Có nút làm mới cache nếu cần. Những điều kiện như sản phẩm hoạt động, có biến thể/giá hợp lệ vẫn do backend quyết định.
8. **Khách hàng:** tạo/sửa hồ sơ, xem địa chỉ/ảnh. Với CUSTOMER, mở `/tai-khoan` để sửa hồ sơ cá nhân và quản lý địa chỉ của chính tài khoản đó.

Lưu ý chứng nhận: sửa metadata, thay/gỡ tài liệu hoặc khôi phục sẽ đưa hồ sơ về chờ duyệt. `validityStatus` mô tả mốc ngày; `currentlyValid` mới biểu thị chứng nhận đang hợp lệ tổng thể. Frontend dùng `organicVerified` từ Home để hiện nhãn hữu cơ công khai, không suy luận từ khai báo hữu cơ cũ của sản phẩm. Cột cũ trong bảng sản phẩm được ghi rõ “Khai báo hữu cơ”.

## 5. Các điểm kỹ thuật đã xử lý

- Trang chủ dùng Axios public riêng để không gửi bearer token cũ. Nội dung công khai không dùng DTO chi tiết có thông tin riêng tư của nhà cung cấp/tài liệu duyệt.
- Phân trang hỗ trợ cả `content` và `items`. Các module mới gửi `search`; API catalog cũ vẫn dùng `keyword`.
- Payload dùng danh sách trường được phép. CUSTOMER không gửi điểm thưởng, role, trạng thái hoặc liên kết tài khoản qua API tự sửa hồ sơ.
- Khi sửa khách hàng/xuất xứ, biểu mẫu tải đầy đủ chi tiết để bảo toàn liên kết hiện có. Trường tùy chọn để trống được chuyển thành `null` khi backend yêu cầu.
- Upload gửi `FormData`, để trình duyệt tự tạo boundary. Kiểm tra loại tệp/dung lượng ở frontend; backend vẫn phải xác thực nội dung và quyền.
- Banner chỉ chấp nhận ảnh HTTPS và liên kết nội bộ hợp lệ. Không render HTML tùy ý từ nội dung Home. Đường dẫn banner `/products` được chuyển sang trang sản phẩm hiện có `/san-pham`.
- Không tự tạo tồn kho, doanh số, đánh giá hay cam kết vận chuyển từ Home API. Bộ sưu tập rỗng được ẩn; vùng trồng dùng thông tin văn bản API cung cấp.

## 6. Kiểm thử và giới hạn

### Lỗi Home 503 phát hiện khi chạy backend thật

Kiểm tra sau khi Spring Boot được bật ngày 20/10: gọi trực tiếp `http://localhost:8088/api/v1/home` và qua proxy `http://localhost:5173/api/v1/home` đều trả HTTP 503 với thông báo “Dịch vụ lưu trữ tạm thời không khả dụng”. PostgreSQL nhận kết nối và Redis trả PONG. Log PostgreSQL chỉ ra lỗi `column "pe1_0.category_id" must appear in the GROUP BY clause or be used in an aggregate function`.

Nguyên nhân nằm trong `HomeCatalogRepository`: Hibernate nhóm theo khóa chính của bảng danh mục đã join, nhưng sắp xếp theo khóa ngoại `products.category_id`. PostgreSQL yêu cầu biểu thức sắp xếp này nằm trong GROUP BY. Truy vấn xuất xứ có cùng cách viết. Bản sửa bổ sung `p.category.id` và `p.origin.id` vào GROUP BY tương ứng. Cần build/restart Spring Boot trong IntelliJ để nạp mã mới; không cần đổi `.env.local`, port, network hoặc xóa dữ liệu. `GlobalExceptionHandler` ánh xạ `DataAccessException` thành 503 nên thông báo HTTP chưa thể hiện rõ lỗi SQL gốc.

Kiểm tra lại sau restart:

```powershell
Invoke-WebRequest http://localhost:8088/api/v1/home | Select-Object StatusCode
Invoke-WebRequest http://localhost:5173/api/v1/home | Select-Object StatusCode
```

Trong backend có thêm test opt-in chỉ đọc PostgreSQL thực, không sửa schema/seed/cache, để tránh bỏ sót lỗi khác biệt so với H2:

```powershell
# Chạy tại thư mục organic_backend, dùng cấu hình DB local hiện có.
$env:ORGANIC_POSTGRES_QUERY_TEST = 'true'
.\mvnw.cmd '-Dtest=HomePostgresQueryTests' test
Remove-Item Env:ORGANIC_POSTGRES_QUERY_TEST
```

Ngày 20/10/2026: kiểm tra tự động hợp đồng request, phân trang, phân quyền helper, public transport và dữ liệu catalog; build production. Xem kết quả cuối trong [VERIFICATION.md](VERIFICATION.md).

Do Spring Boot cổng 8088 không phản hồi trong phiên tích hợp, các luồng giao diện mới được kiểm tra bằng API QA chạy trong bộ nhớ tại `127.0.0.1:19088`. Đây là fixture chỉ dùng phát triển, không ghi DB, không mô phỏng đầy đủ Spring Security/validation và không gọi Cloudinary. Chưa khẳng định E2E với backend thật, email hoặc upload Cloudinary đã đạt.

Có thể lặp lại QA bằng hai terminal PowerShell riêng:

```powershell
# Terminal 1, tại thư mục frontend. Dữ liệu mất khi dừng tiến trình.
node test-support/backend-fixture.mjs
```

```powershell
# Terminal 2, tại thư mục frontend. Biến chỉ áp dụng phiên terminal này.
$env:DEV_API_TARGET = 'http://127.0.0.1:19088'
$env:VITE_DEMO_MODE = 'false'
pnpm.cmd dev --port 5174 --strictPort
```

Mở `http://localhost:5174`; tài khoản QA: `admin`, `sales`, `warehouse`, `customer`; mật khẩu chung `Organic@123`. Tài khoản này chỉ thuộc fixture. Fixture chỉ lắng nghe loopback, không dùng làm backend vận hành. Dừng cả hai bằng Ctrl+C. Mở terminal mới để chạy kết nối backend thật, hoặc xóa các biến vừa đặt bằng `Remove-Item Env:DEV_API_TARGET, Env:VITE_DEMO_MODE`.

Ảnh giao diện trong `docs/screenshots/2026-10-20/` dùng dữ liệu QA này.
