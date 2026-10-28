# Mộc Organic — Frontend

Cập nhật giỏ hàng/checkout theo mẫu, đổi điểm ở giỏ và VNPay tự cập nhật: [PURCHASE_REDESIGN.md](docs/PURCHASE_REDESIGN.md).

Tài liệu bàn giao nhóm: [Hướng dẫn cấu hình và chạy dự án](docs/HUONG_DAN_CAU_HINH_VA_CHAY_DU_AN.md) · [Kịch bản meeting 30 phút](docs/KICH_BAN_MEETING.md).

API mới ngày 20/10/2026: [Home, khách hàng, nhà cung cấp, xuất xứ, chứng nhận và truy xuất](docs/TICH_HOP_API_MOI.md), gồm phân quyền, trình tự demo và cách kiểm tra với backend thật.

Giao diện mới: [Design system organic, scroll reveal và hiệu ứng modal](docs/UI_ORGANIC.md).

Trang chi tiết sản phẩm hỗ trợ đọc và gửi đánh giá sau mua: [hướng dẫn đánh giá](docs/VERIFIED_PURCHASE_REVIEWS.md). Giỏ Redis, đặt hàng/thanh toán, quản lý đơn/COD, điểm thưởng, khuyến mãi và chuông thông báo: [CHECKOUT_FRONTEND.md](docs/CHECKOUT_FRONTEND.md).

Upload avatar: [Phân tích lỗi 502 Cloudinary, kiểm tra cấu hình backend và giới hạn upload frontend](docs/AVATAR_UPLOAD.md).

Giỏ hàng: [Giao diện, mã ưu đãi dùng thử và phạm vi kết nối backend](docs/CART_FRONTEND.md). Nhấn biểu tượng túi trên header để mở `/gio-hang`; chỉ những sản phẩm được chọn mới chuyển sang `/thanh-toan`.

Về cửa hàng: [Nguồn gốc, chứng nhận và so sánh quy cách sản phẩm](docs/ABOUT_STORE.md). Trang `/ve-cua-hang` đọc API công khai, cho chọn sản phẩm, kiểm tra ngày hiệu lực và so giá/kg hoặc lít trước khi thêm từng biến thể vào giỏ.

Footer: [Bố cục, nội dung mô phỏng và cách thay thông tin liên hệ](docs/FOOTER.md). Đã thêm địa chỉ 36 Trịnh Đình Trọng, Phường Tân Phú và hotline 0344 855 913; các nhóm hỗ trợ, nhận tin, mạng xã hội và thanh toán có hướng dẫn rõ phạm vi mô phỏng.

Điểm nổi bật: [Banner, tiêu chuẩn, chứng nhận, dinh dưỡng và bao bì](docs/HIGHLIGHTS_PAGE.md). Trang `/diem-noi-bat` có điều hướng riêng, hiệu ứng cuộn, nội dung bao bì tương tác và hồ sơ chứng nhận đọc từ Home.

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
    admin/                  # CatalogForm, RecordForm, RecordDetails, chứng nhận
    customers/ProfilePanel.jsx
    common/                 # Logo, pagination, loading/error/empty state
    products/               # Card và chi tiết sản phẩm
    ui/                     # Button, field, Radix Dialog
  constants/                # Demo, schema các module quản lý
  contexts/                 # AuthProvider, ShopProvider, HomeProvider
  hooks/                    # useResource, useDebouncedValue
  layouts/                  # StoreLayout, AdminLayout
  lib/                      # Tiện ích, storage
  pages/
    admin/                  # Catalog, hồ sơ, truy xuất, biên tập Home
    auth/                   # Login, register/OTP, logout
    client/                 # Home, catalog, account
    NotFoundPage.jsx
  routes/                   # Router và bảo vệ theo vai trò
  services/
    api.js                  # Axios instance, Bearer token, xử lý 401
    auth/authService.js
    admin/
      productService.js
      categoryService.js
      managementService.js
      homeAdminService.js
    client/                 # Catalog, Home public, hồ sơ cá nhân
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
| `/tai-khoan` | Hồ sơ cá nhân, ảnh đại diện và địa chỉ của CUSTOMER |
| `/admin/products` | Thống kê, tìm/lọc, phân trang, thêm/sửa/ngừng bán, xuất CSV |
| `/admin/categories` | Thống kê, tìm/lọc, phân trang, thêm/sửa/xóa, xuất CSV |
| `/admin/home` | Nội dung Home, banner, FAQ, sản phẩm nổi bật và cache |
| `/admin/customers` | Hồ sơ khách hàng, liên kết tài khoản, avatar, địa chỉ |
| `/admin/suppliers` | Nhà cung cấp và thông tin liên hệ |
| `/admin/origins` | Xuất xứ, vùng sản xuất và nhà cung cấp liên kết |
| `/admin/certifications` | Chứng nhận, tài liệu, duyệt và lưu trữ/khôi phục |
| `/admin/traceability` | Gắn/gỡ xuất xứ và chứng nhận của sản phẩm |

Sản phẩm, danh mục và biên tập Home yêu cầu `ADMIN`; hồ sơ khách hàng dành cho `ADMIN`/`SALES_STAFF`. `WAREHOUSE_STAFF` được quản lý nhà cung cấp, xuất xứ, chứng nhận và liên kết truy xuất; duyệt/lưu trữ chỉ dành cho ADMIN. Sales có quyền xem các module nguồn gốc. Hỗ trợ cả tiền tố `ROLE_`; xem ma trận chi tiết trong tài liệu tích hợp. Backend vẫn kiểm tra quyền thực tế. Khi API riêng tư trả 401, phiên local được xóa và trang bảo vệ chuyển về đăng nhập. Token được giữ trong sessionStorage; `rememberMe` được gửi cho backend để quyết định thời hạn token.

Chế độ API thật dùng giỏ Redis qua cookie/Bearer; thanh toán và đơn hàng gọi API backend. Yêu thích vẫn lưu trên trình duyệt; chế độ demo giữ giỏ cục bộ. Modal dùng Radix để quản lý focus, bàn phím và Escape.

## 4. Kết nối backend hiện có

Đã đối chiếu controller và DTO trong `../organic_backend`: backend Spring Boot chạy cổng **8088**, trả `{ statusCode, name, message, data }`; phân trang hỗ trợ `content` và `items`, cùng `page`, `size`, `totalElements`, `totalPages`, `hasNext`.

Đổi `.env.local`:

```dotenv
VITE_API_BASE_URL=/api/v1
VITE_DEMO_MODE=false
DEV_API_TARGET=http://localhost:8088
```

Khởi động lại `pnpm dev`. Vite proxy `/api` đến backend, giúp frontend dùng cùng origin và tránh phải thêm CORS khi phát triển. Axios riêng tư đính kèm `Authorization: Bearer <accessToken>`; Home và catalog dùng transport public không gửi token.

Các endpoint catalog/auth đã có (API mới liệt kê trong tài liệu tích hợp):

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
- Nhãn hữu cơ công khai trên Home dựa vào `organicVerified` backend trả về; chứng nhận quản trị dùng `currentlyValid` và truy xuất dùng `effectiveOrganicStatus`. Không suy luận từ khai báo hữu cơ cũ. Sửa metadata/tài liệu chứng nhận sẽ đưa về chờ duyệt.
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

Luồng mới **Đơn mua → Duyệt đơn → Phiếu nhập → Duyệt nhập → Tồn kho/lô → Thông báo**, phân quyền và hướng dẫn bật Firebase Push: [PROCUREMENT_FRONTEND.md](docs/PROCUREMENT_FRONTEND.md). Đã tích hợp public config và VAPID project `backend-organic`; chỉ xin quyền thông báo khi người dùng bấm bật.

```powershell
pnpm test
pnpm build
pnpm preview
docker compose config --quiet
docker compose build
```

100 test kiểm tra phân trang/lọc, bảo toàn liên kết khi sửa, phân quyền helper, public transport, payload hồ sơ/chứng nhận, upload FormData qua HTTP, DTO Axios, hợp đồng chi tiết/đánh giá và giới hạn tệp nháp. Xem [kết quả và giới hạn kiểm thử](docs/VERIFICATION.md). Ảnh từ Unsplash được lưu trong `public/images`; font Be Vietnam Pro/Lora tải từ Google Fonts, có fallback sans-serif/Georgia khi offline.

Tài liệu stack: [Vite](https://vite.dev/guide/), [Tailwind + Vite](https://tailwindcss.com/docs/installation/using-vite).

Đối chiếu API theo tài liệu 26/10/2026: [Kết quả và hướng dẫn kiểm tra thanh toán](docs/API_INTEGRATION_RESULT.md) · [155 API và input/output](docs/API_INTEGRATION_AUDIT.md).

Tài liệu cập nhật giao diện và nghiệp vụ Admin: [ADMIN_OPERATIONS_UPDATE.md](docs/ADMIN_OPERATIONS_UPDATE.md).

Cập nhật mã tự động, nhập Excel và quy trình giao nhiều đợt: [ADMIN_PURCHASE_WORKFLOW_V2.md](docs/ADMIN_PURCHASE_WORKFLOW_V2.md).

API backend mới (27-10-2026): [Hướng dẫn nhập Excel Đơn mua/Sản phẩm/Phiếu nhập, tải PDF và rà soát API còn thiếu giao diện](docs/BACKEND_API_UPDATE_20261027.md). Luồng Excel hiện tại tải mẫu và kiểm tra/nhập trực tiếp qua backend, thay cho mẫu SanPham trước đây.

Khung biểu mẫu khóa luận A4: [PrintFormLayout — hướng dẫn dùng chung, xem trước, in và lưu PDF](docs/PRINT_FORMS.md). Đã gắn nút xem trước vào chi tiết Đơn mua và Phiếu nhập.

Hai biểu mẫu UC01 theo Golden Reference: [Phiếu đề nghị BM-NV01-01 và Đơn đặt hàng BM-NV01-02](docs/UC01_PRINT_FORMS.md), dùng chung font Times New Roman, dòng chấm, bảng 8 dòng và vùng xác nhận trống để đóng dấu thủ công sau khi in.

Cập nhật 28-10-2026: [Bộ đầy đủ 16 biểu mẫu theo PDF tham chiếu](docs/BUSINESS_FORMS_PDF_REFERENCE.md). Mở **Admin → Biểu mẫu & bản in**, có A4 ngang/dọc theo từng mẫu và font Noto Sans tiếng Việt đóng gói trong dự án; không tạo con dấu đỏ.

Đơn hàng khách hàng: [Lịch sử mua hàng, theo dõi đơn, hủy và đổi trả — API và phần backend còn thiếu](docs/CUSTOMER_ORDERS.md). Mở `/don-hang` cho tài khoản CUSTOMER hoặc `/demo/don-hang` để thử ngay với dữ liệu organic mẫu. Hiển thị mã đơn/mã vận đơn/mã yêu cầu nghiệp vụ, không hiển thị UUID.

Header cửa hàng: [Tìm kiếm gợi ý theo tên/mã SP, menu tài khoản, phản hồi thêm giỏ và chuông sản phẩm/ưu đãi/đơn](docs/STOREFRONT_HEADER.md).

Dashboard quản trị tại `/admin/dashboard`: [KPI, Recharts, cảnh báo lô/tồn, công việc chờ duyệt và hoạt động từ chứng từ — định nghĩa chỉ số và API](docs/ADMIN_DASHBOARD.md). Có nút Xem bản mẫu để xem dữ liệu organic mô phỏng mà không thay đổi dữ liệu thật.

Điều hướng Admin: [Sidebar theo vai trò, tab ngang, quyền sản phẩm/khuyến mãi và các API lựa chọn tương ứng](docs/ADMIN_NAVIGATION_ROLES.md). Cần cập nhật và khởi động lại backend đi kèm.
