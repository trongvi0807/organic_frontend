# Kết quả kiểm tra — 19/10/2026

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
