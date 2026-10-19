# Mộc Organic — Frontend

Tài liệu bàn giao nhóm: [Hướng dẫn cấu hình và chạy dự án](docs/HUONG_DAN_CAU_HINH_VA_CHAY_DU_AN.md) · [Kịch bản meeting 30 phút](docs/KICH_BAN_MEETING.md).

Website thương mại điện tử organic, ưu tiên giao diện desktop. React + Vite, Tailwind CSS v4, React Router, Axios, Radix UI (Dialog), hệ component theo cách tổ chức shadcn/ui, Lucide và Sonner. JavaScript/JSX, alias `@/` trỏ đến `src/`.

Thiết kế tham khảo tinh thần tự nhiên của [Pukka Herbs](https://www.pukkaherbs.com/uk/en) và cách tổ chức danh mục của [Organica](https://organica.vn/). Nhận diện “Mộc” và bố cục được xây mới. Hai ảnh cấu trúc thư mục/giao diện được nhắc trong yêu cầu chưa có trong hội thoại, nên chưa thể đối chiếu chính xác từng thư mục và chi tiết ảnh mẫu.

## 1. Chạy ngay trên máy

Cài Node.js 22.12+ (khuyến nghị Node 22 LTS) và pnpm. Nếu dùng nvm, chạy `nvm install 22` rồi `nvm use 22`. nvm là công cụ quản lý phiên bản Node.js; Radix UI và các component trong `src/components/ui` là phần thư viện giao diện.

PowerShell, trong thư mục dự án:

```powershell
cd D:\oragnic-pro\organic_frontend
npm install --global pnpm@11.25.0
pnpm install --frozen-lockfile
Copy-Item .env.example .env.local
pnpm dev
```

Mở [http://localhost:5173](http://localhost:5173). File `.env.local` bật dữ liệu mẫu để xem giao diện ngay cả khi backend chưa chạy. Chỉ sao chép lại file khi cần đặt lại cấu hình cá nhân.

Tài khoản mẫu (chỉ có tác dụng khi `VITE_DEMO_MODE=true`):

| Vai trò | Tên đăng nhập | Mật khẩu |
| --- | --- | --- |
| Quản trị viên | `admin` | `Admin@123` |
| Khách hàng | `khachhang` | `Khach@123` |

Chế độ mẫu lưu danh mục, sản phẩm và giỏ hàng bằng localStorage; phiên đăng nhập bằng sessionStorage. Không lưu mật khẩu hoặc giả lập đăng ký thành công. Đăng ký, OTP và gửi email cần backend thật. Dữ liệu mẫu không được đồng bộ lên backend.

Để khởi tạo một dự án tương tự từ đầu, lệnh Vite tương ứng là `pnpm create vite organic_frontend --template react`; dự án trong thư mục này đã được khởi tạo đầy đủ, không chạy lại lệnh scaffold lên mã hiện có.

## 2. Cấu trúc thư mục

```text
public/
  images/                   # Ảnh nông sản lưu cùng frontend
  runtime-config.js         # Cấu hình runtime, được Docker tạo lại
src/
  assets/                   # Tài nguyên import và ghi chú nguồn ảnh
  components/
    admin/CatalogForm.jsx
    common/                 # Logo, pagination, loading/error/empty state
    products/               # Card và chi tiết sản phẩm
    ui/                     # Button, field, Radix Dialog
  constants/demo.js
  contexts/                 # AuthProvider, ShopProvider
  hooks/                    # useResource, useDebouncedValue
  layouts/                  # StoreLayout, AdminLayout
  lib/                      # Tiện ích, storage
  pages/
    admin/ManagementPage.jsx # Dùng chung cho hai trang quản trị
    auth/                   # Login, register/OTP, logout
    client/                 # Home, catalog, account
    NotFoundPage.jsx
  routes/                   # Router và bảo vệ quyền Admin
  services/
    api.js                  # Axios instance, Bearer token, xử lý 401
    auth/authService.js
    admin/
      productService.js
      categoryService.js
    client/catalogService.js
    demoStore.js
  styles/globals.css
  App.jsx
  main.jsx
docker/
  default.conf.template
  40-runtime-config.sh
Dockerfile
docker-compose.yml
```

## 3. Các màn hình

| Đường dẫn | Chức năng |
| --- | --- |
| `/` | Trang chủ desktop, danh mục, sản phẩm nổi bật, lọc nhanh |
| `/san-pham` | Tìm sản phẩm, lọc danh mục, phân trang, xem chi tiết |
| `/dang-nhap` | Đăng nhập, hiện/ẩn mật khẩu, ghi nhớ đăng nhập |
| `/dang-ky` | Đăng ký đúng DTO backend, xác thực OTP và gửi lại mã |
| `/dang-xuat` | Xác nhận đăng xuất, gọi API và xóa phiên tại trình duyệt |
| `/tai-khoan` | Thông tin tài khoản và đăng xuất |
| `/admin/products` | Thống kê, tìm/lọc, phân trang, thêm/sửa/ngừng bán, xuất CSV |
| `/admin/categories` | Thống kê, tìm/lọc, phân trang, thêm/sửa/xóa, xuất CSV |

Các trang Admin yêu cầu role `ADMIN` hoặc `ROLE_ADMIN`. Phân quyền frontend hỗ trợ điều hướng; backend vẫn kiểm tra quyền thực tế. Khi API trả 401, phiên local được xóa và trang bảo vệ chuyển về đăng nhập. Token được giữ trong sessionStorage; `rememberMe` được gửi cho backend để backend quyết định thời hạn token.

Giỏ hàng và yêu thích hoạt động tại trình duyệt. Chưa có thanh toán/đặt đơn vì backend hiện chưa có API đơn hàng. Modal dùng Radix để quản lý focus, bàn phím và Escape.

## 4. Kết nối backend hiện có

Đã đối chiếu controller và DTO trong `../organic_backend`: backend Spring Boot chạy cổng **8088**, trả `{ statusCode, name, message, data }`; phân trang trong `data` có `items`, `page`, `size`, `totalElements`, `totalPages`, `hasNext`.

Đổi `.env.local`:

```dotenv
VITE_API_BASE_URL=/api/v1
VITE_DEMO_MODE=false
DEV_API_TARGET=http://localhost:8088
```

Khởi động lại `pnpm dev`. Vite proxy `/api` đến backend, giúp frontend dùng cùng origin và tránh phải thêm CORS khi phát triển. Axios tự đính kèm `Authorization: Bearer <accessToken>`.

Các endpoint đang sử dụng:

```text
POST /api/v1/auth/login
POST /api/v1/auth/register
POST /api/v1/auth/verify-otp
POST /api/v1/auth/resend-otp
POST /api/v1/auth/logout
GET  /api/v1/products[/{id}]
GET  /api/v1/categories
GET/POST       /api/v1/admin/products
GET/PUT/DELETE /api/v1/admin/products/{id}
GET            /api/v1/admin/products/options
GET/POST       /api/v1/admin/categories
PUT/DELETE     /api/v1/admin/categories/{id}
```

`DELETE products/{id}` là **ngừng bán**, phù hợp backend. Đăng ký yêu cầu `username`, `password`, `confirmPassword`, `fullName`, `phoneNumber`, `email`; tiếp theo phải xác thực OTP trước khi đăng nhập. Không tự gán quyền Admin cho tài khoản mới.

Điểm cần biết về dữ liệu backend:

- `ProductRequest` chỉ chứa thông tin sản phẩm, danh mục, thương hiệu, trạng thái và chứng nhận. Giá nằm trong `variants`; ảnh nằm trong `images`. Biểu mẫu thật bảo toàn thương hiệu/chứng nhận khi sửa và chưa cung cấp trình biên tập biến thể/ảnh. Muốn có giá/ảnh cho sản phẩm mới, dùng các API biến thể/ảnh của backend hoặc mở rộng biểu mẫu này.
- `ProductSummaryResponse` chưa có tồn kho/quy cách. Frontend không tự tạo số tồn kho trong chế độ API thật; hiển thị thông tin chưa được cung cấp trong chi tiết. Dữ liệu demo có tồn kho để minh họa Product Card.
- Trạng thái hữu cơ `verified` yêu cầu chứng nhận `verified` còn hiệu lực ở backend. Lỗi xác thực được hiển thị ngay trong biểu mẫu.
- Chưa tự làm mới access token; phiên hết hạn chuyển về đăng nhập. Backend có endpoint refresh-token để mở rộng sau.

## 5. Docker và network dùng chung

Dockerfile gồm hai stage: build bằng Node 22, serve `dist/` bằng Nginx. Nginx hỗ trợ SPA deep link, cache asset, healthcheck và reverse proxy API. Compose **chỉ chứa frontend** và dùng external network `my-shared-network`.

Tạo network một lần nếu chưa có:

```powershell
docker network create my-shared-network
```

Backend phải cùng network và có network alias `organic-backend`, lắng nghe cổng container **8088**. Ví dụ phần cần có trong **Compose của backend**:

```yaml
services:
  backend:
    # image/build và các biến PostgreSQL/Redis thuộc dự án backend
    networks:
      shared:
        aliases:
          - organic-backend
networks:
  shared:
    external: true
    name: my-shared-network
```

Compose hiện có trong thư mục backend chỉ khai báo PostgreSQL/Redis, chưa có service ứng dụng Spring Boot. Cần chạy ứng dụng backend trong container và nối network như trên trước khi API Docker có thể hoạt động. Frontend không thay đổi file backend.

Nếu container backend đã chạy, có thể nối bằng tên container thực tế:

```powershell
docker network connect --alias organic-backend my-shared-network TEN_CONTAINER_BACKEND
```

File `.env` dành cho Docker, tạo theo cấu hình thật (Compose không tự đọc `.env.local`):

```dotenv
FRONTEND_PORT=3000
VITE_API_BASE_URL=/api/v1
VITE_DEMO_MODE=false
BACKEND_URL=http://organic-backend:8088
```

Sau đó:

```powershell
docker compose config --quiet
docker compose up -d --build
docker compose ps
```

Mở [http://localhost:3000](http://localhost:3000).

```text
Trình duyệt → http://localhost:3000/api/v1/products
            → Nginx → http://organic-backend:8088/api/v1/products
                          (my-shared-network)
```

**Không đặt `VITE_API_BASE_URL=http://organic-backend:8088`**: tên container chỉ phân giải bên trong Docker. Cổng `BACKEND_URL` là cổng container backend, không phải cổng publish của host. Có thể đổi `BACKEND_URL` khi alias thực tế khác.

Compose cung cấp cả build arguments và environment. Entry point tạo `runtime-config.js` khi container khởi động; frontend ưu tiên cấu hình runtime. Nhờ đó, có thể đổi backend upstream hoặc demo mode rồi `docker compose up -d --force-recreate` mà không phải rebuild JS. Các biến `VITE_*` là thông tin công khai, không chứa bí mật.

Để xem giao diện Docker không cần backend, đặt `VITE_DEMO_MODE=true` trong `.env`; đây là chế độ xem thử, không dùng để vận hành thật. Khi backend chưa sẵn sàng ở API mode, Nginx vẫn phục vụ frontend; yêu cầu API báo lỗi kết nối và giao diện có nút thử lại.

## 6. Kiểm tra

```powershell
pnpm test
pnpm build
pnpm preview
docker compose config --quiet
docker compose build
```

Test kiểm tra phân trang/lọc, bảo toàn dữ liệu khi sửa, ngừng bán, ràng buộc xóa danh mục và DTO Axios. Ảnh từ Unsplash được lưu trong `public/images`; font Be Vietnam Pro/Lora tải từ Google Fonts, có fallback sans-serif/Georgia khi offline.

Tài liệu stack: [Vite](https://vite.dev/guide/), [Tailwind + Vite](https://tailwindcss.com/docs/installation/using-vite).
