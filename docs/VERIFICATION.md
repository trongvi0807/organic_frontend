# Kết quả kiểm tra — 19/10/2026

## Làm mới UI organic — 20/10/2026

- Theo yêu cầu cuối: giữ nguyên component logo; làm lại header, hero ảnh lớn, các section khách hàng, thẻ sản phẩm, theme bảng quản lý và form/modal. Tham khảo Pukka, giữ nội dung và nhận diện của dự án.
- `pnpm.cmd test`: 28/28 test hiện có đạt. `pnpm.cmd build`: thành công sau các chỉnh sửa cuối; không thêm dependency.
- Browser kiểm tra ở desktop 1440 × 1000 và mobile 390 × 844 bằng Vite riêng cổng 5174, demo mode chỉ qua biến môi trường tiến trình. `.env.local` vẫn dùng API thật, không thay đổi backend hoặc dữ liệu DB trong đợt UI này.
- Kiểm tra Home, trang sản phẩm, menu mobile, chi tiết sản phẩm, đăng nhập mẫu, quản lý sản phẩm/danh mục. Card xuất hiện khi vào viewport; phần bên dưới viewport còn pending trước khi cuộn.
- Lọc danh mục Trái cây trong Admin còn 2 bản ghi; mở/sửa/lưu sản phẩm mẫu thành công. Mở/hủy dialog ngừng bán và mở form thêm danh mục; Escape đóng form. Không thực hiện xóa/ngừng bán bản ghi.
- Modal có computed animation `organic-dialog-in`, thời gian 260ms, tâm ngang 720px tại viewport 1440px.
- Mobile không tràn ngang toàn trang; bảng 850px cuộn trong khung 342px. Menu quản lý đóng thì inert, mở giữ focus trong menu, Escape đóng và trả focus về nút mở.
- Không ghi nhận console error/warning trong các luồng kiểm tra. Nhánh reduced motion được hỗ trợ trong CSS/React; không thay đổi cài đặt hệ điều hành để thử chế độ này.
- Backend 8088 không phản hồi lúc kiểm tra UI; không tính demo browser là E2E với backend thật. Các test hợp đồng API hiện có vẫn đạt.
- Ảnh dữ liệu mẫu: [Trang chủ desktop](screenshots/organic-refresh/home-desktop.png), [Sản phẩm desktop](screenshots/organic-refresh/products-desktop.png), [Quản lý danh mục](screenshots/organic-refresh/admin-categories-desktop.png), [Trang chủ mobile](screenshots/organic-refresh/home-mobile.png).
- Tham số và cách tái sử dụng hiệu ứng: [UI_ORGANIC.md](UI_ORGANIC.md).

## Khắc phục Home 503 với backend thật — 20/10/2026

- Gọi trực tiếp `/api/v1/home` trên 8088 và qua Vite 5173 cùng trả 503. PostgreSQL log báo thiếu `products.category_id` trong GROUP BY; Redis trả PONG và PostgreSQL nhận kết nối.
- Sửa `HomeCatalogRepository` của backend: bổ sung khóa ngoại ID vào GROUP BY cho truy vấn danh mục và xuất xứ. Không đổi cấu hình, schema hoặc dữ liệu.
- PostgreSQL 14.1 chấp nhận cả hai SQL đã sửa qua EXPLAIN trong transaction chỉ đọc rồi ROLLBACK.
- Sau khi backend nạp lại mã: gọi trực tiếp Home trên 8088 và qua Vite 5173 đều trả HTTP 200; response qua frontend có nội dung Home và 4 danh mục. Bộ sưu tập sản phẩm nổi bật hiện rỗng theo dữ liệu backend.
- Có thêm test opt-in `HomePostgresQueryTests` chỉ đọc PostgreSQL. Lần chạy Maven ban đầu chưa đạt: test Home/H2 vướng Java NIO loopback khi mở kết nối Redis; test PostgreSQL vướng class projection bị thiếu trong lúc thư mục build đang được biên dịch lại. Không tính hai lần chạy này là test thành công. Kiểm tra HTTP thật sau reload và EXPLAIN là bằng chứng xác nhận bản sửa hiện tại.

## Tích hợp API mới — 20/10/2026

- Đối chiếu controller, DTO, phân quyền và tài liệu trong backend liền kề. Chỉ sửa frontend và tài liệu bàn giao; không sửa backend.
- `pnpm.cmd test`: **28/28 test đạt, 5 file**. Bao gồm tương thích `content`/`items`, bảo toàn liên kết tài khoản, giá sản phẩm Home, public Axios không gửi token, phân quyền helper, payload tự sửa hồ sơ, chứng nhận và FormData.
- `pnpm.cmd build`: thành công; các màn hình quản lý mới được lazy load theo route.
- Browser QA desktop **1440 × 1000** với fixture loopback `127.0.0.1:19088` và Vite riêng cổng 5174: tạo khách hàng/nhà cung cấp/xuất xứ/chứng nhận; mở chi tiết; thu hồi chứng nhận có lý do; gắn xuất xứ/chứng nhận vào sản phẩm; sửa nội dung Home/banner và sản phẩm nổi bật.
- Sau khi thu hồi chứng nhận, trang Home không còn phần chứng nhận hợp lệ hoặc nhãn đã xác minh liên quan. Khi bỏ sản phẩm nổi bật, bộ sưu tập rỗng được ẩn. Gắn chứng nhận chờ duyệt vào sản phẩm vẫn hiển thị đang chờ xác minh.
- Kiểm tra đăng nhập QA theo ADMIN/SALES_STAFF/WAREHOUSE_STAFF/CUSTOMER: menu, nút tạo/sửa/ngừng hoạt động, quyền duyệt và route khách hàng đúng vai trò ở giao diện. CUSTOMER truy cập `/admin/customers` bị chặn.
- CUSTOMER thêm địa chỉ mặc định và cập nhật họ tên của chính mình; thông tin phiên tại frontend cập nhật theo response.
- Không thấy console warning/error ở thời điểm kiểm tra các luồng trên.
- Upload mới được kiểm tra ở mức hợp đồng service: MIME, giới hạn 5 MB, trường multipart `file`, không cố định boundary. **Chưa kiểm thử tải tệp thật lên Spring Boot/Cloudinary**.
- Backend thật `localhost:8088` không phản hồi trong phiên này. Fixture chỉ lưu bộ nhớ, không mô phỏng đầy đủ bảo mật/validation backend; kết quả UI QA không chứng minh Spring Security, lưu DB, cache Redis hoặc Cloudinary thật đã hoạt động. Các kiểm tra ngày 19/10 bên dưới là lịch sử, không thay thế kiểm tra tích hợp mới.
- Ảnh mới dùng dữ liệu QA: [Quản lý chứng nhận desktop](screenshots/2026-10-20/certifications-qa-desktop.png).

Hướng dẫn chạy thật, ma trận quyền và kịch bản demo: [TICH_HOP_API_MOI.md](TICH_HOP_API_MOI.md).

## Bổ sung tài liệu bàn giao

- Build frontend thành công sau khi chỉnh Vite dùng `loadEnv` cho `DEV_API_TARGET`.
- Đã kiểm tra bằng file `.env.local` tạm với cổng backend khác mặc định: proxy đọc đúng giá trị trong file.
- Compose frontend với environment mẫu: `config --quiet` thành công.
- Compose backend gốc kết hợp overlay `docs/examples/backend/compose.app.yml`: `config --quiet` thành công. Chưa build/chạy Spring Boot bằng cấu hình Docker mẫu này; không thay đổi hoặc khởi động lại backend người dùng đang chạy.
- 9 liên kết file tương đối trong hai tài liệu bàn giao trỏ tới file có thật.

## Kiểm tra triển khai frontend trước đó

- `pnpm test`: 8/8 test đạt (2 file).
- `pnpm build`: thành công, đã tách bundle cho các màn hình theo route.
- `docker compose config --quiet`: hợp lệ.
- `docker compose build`: build thành công hai stage Node/Nginx trên Linux.
- Container chạy trên `my-shared-network`, healthcheck báo `healthy`.
- `nginx -t`: cấu hình hợp lệ.
- HTTP `/health`, `/`, `/admin/products`, `/runtime-config.js`, `/images/hero.jpg`: đều 200 qua `127.0.0.1:3000`.
- Runtime config được tạo đúng theo environment container.
- Proxy chuyển `/api/v1/products?size=1` tới alias `organic-backend:8088` và giữ nguyên path/query. Kiểm tra bằng Nginx fixture tạm thời trong network; fixture đã được dọn sau kiểm tra. Đây không phải kiểm thử backend Spring Boot thật.
- Trình duyệt desktop 1440 × 1000: trang chủ, màn hình đăng nhập/đăng ký, bảng quản lý sản phẩm và loại sản phẩm đã render; không có lỗi/warning console tại thời điểm kiểm tra.
- Đã thử đăng nhập Admin mẫu, lọc danh mục, mở/lưu biểu mẫu sản phẩm, tạo/xóa danh mục thử, giỏ hàng, chi tiết sản phẩm và đăng xuất.
- Sau đăng xuất, truy cập trang Admin chuyển về đăng nhập.
- Trang Admin không tràn ngang toàn bộ trang tại 1440px; bảng hỗ trợ cuộn trong khung khi không đủ chiều rộng.

## Giới hạn

- Backend thật tại `localhost:8088` chưa chạy: chưa kiểm thử HTTP trực tiếp với Spring Boot, gửi email, đăng ký, xác thực OTP hoặc phân quyền backend bằng token thật.
- Chưa có hai ảnh mẫu được nhắc trong yêu cầu, nên chưa thể khẳng định khớp chính xác cấu trúc/bố cục trong ảnh.
- Demo dùng dữ liệu trình duyệt. Giá, tồn kho và ảnh trong demo không đại diện dữ liệu sản xuất.
- Không triển khai lên dịch vụ hosting. Các server/container phục vụ kiểm tra được dừng sau khi xác minh; source, image Docker và external network được giữ lại để chạy theo README.

## Ảnh giao diện desktop

- [Trang chủ — khung nhìn desktop](screenshots/home-preview-desktop.png)
- [Trang chủ — toàn trang](screenshots/home-desktop.png)
- [Quản lý sản phẩm](screenshots/admin-desktop.png)
- [Đăng nhập](screenshots/login-desktop.png)
