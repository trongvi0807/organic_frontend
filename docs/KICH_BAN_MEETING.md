# Kịch bản meeting hướng dẫn chạy Organic — 30 phút

Tài liệu thao tác chi tiết: [Hướng dẫn cấu hình và chạy dự án](HUONG_DAN_CAU_HINH_VA_CHAY_DU_AN.md).

Mục tiêu: sau meeting, mỗi thành viên tự chạy được database/Redis, backend và frontend, biết kiểm tra API và phân biệt dữ liệu demo với dữ liệu backend.

## 1. Chuẩn bị trước buổi họp

- Chọn Cách A để demo trực tiếp: PostgreSQL/Redis Docker, Spring Boot IntelliJ, frontend Vite.
- Cài dependency trước; tránh dành thời gian meeting để chờ tải Maven/pnpm.
- Chuẩn bị tài khoản `admin / Organic@123` và `customer / Organic@123`, xác nhận mật khẩu trên database dùng trong buổi họp.
- Giữ frontend `VITE_DEMO_MODE=false`.
- Chuẩn bị mã mới như `MEETING-CAT-001`; nếu đã có thì chọn hậu tố khác.
- Mở sẵn IntelliJ Run, PowerShell frontend, Docker Desktop và trình duyệt DevTools Network.
- Chỉ chia sẻ màn hình chứa cấu hình đã che giá trị bí mật; không mở nội dung JWT/API key trong phần trình chiếu.

## 2. Lịch trình trình bày

| Thời gian | Nội dung | Người trình bày thao tác | Kết quả cần thấy |
| --- | --- | --- | --- |
| 0–3 phút | Kiến trúc và cổng | Mở sơ đồ Cách A và bảng cổng trong tài liệu chính | Mọi người biết 5173 là UI, 8088 là API |
| 3–7 phút | Môi trường và cấu hình | Giải thích JDK 21, Node, pnpm; mở `.env.example` và `.env.local` đã che thông tin nếu cần | Hiểu `.env.example` là mẫu, `.env.local` dùng cho Vite |
| 7–12 phút | Thứ tự chạy | Chạy Compose database/Redis, Run IntelliJ, kiểm tra API, chạy Vite | API HTTP 200; giao diện xuất hiện |
| 12–18 phút | Đọc dữ liệu và đăng nhập | Mở `/san-pham`, tìm Cà rốt, lọc danh mục, đăng nhập Admin | Thấy request API và dữ liệu tương ứng |
| 18–23 phút | Ghi dữ liệu và phân quyền | Thêm/sửa danh mục mới, tải lại, đăng xuất rồi đăng nhập Customer | Có POST/PUT thành công; Customer không vào Admin |
| 23–27 phút | Giải thích Docker toàn bộ | Mở file overlay, chỉ hai vị trí networks và alias, giải thích Nginx proxy | Hiểu backend Docker cần service riêng và network chung |
| 27–30 phút | Xử lý lỗi và bàn giao | Chỉ bảng lỗi thường gặp và checklist | Đồng nghiệp biết tự chạy lại và gửi thông tin lỗi phù hợp |

## 3. Lời dẫn gợi ý

### Mở đầu

“Dự án có ba phần cần khởi động: dữ liệu, API và giao diện. Hôm nay chúng ta chạy database/Redis bằng Docker, API bằng IntelliJ và giao diện bằng Vite. Khi chuyển sang Docker toàn bộ, cách gọi bên trong container sẽ khác; phần đó có hướng dẫn riêng.”

### Khi giới thiệu file môi trường

“Không cần tạo tất cả các file env. Với cách đang demo, frontend chỉ cần `.env.local`. `.env.example` để tham khảo các tên biến. Khi dùng Docker Compose, chúng ta dùng `.env` hoặc chỉ định một file bằng `--env-file`.”

### Khi chứng minh API thật

“Frontend đang tắt demo. Trong Network có request `products`, HTTP 200, Response có các sản phẩm này. URL request vẫn mang cổng frontend vì Vite chuyển tiếp sang cổng backend.”

### Khi tạo danh mục

“Tôi tạo một danh mục mới dành cho buổi họp. Network có POST thành công. Sau khi tải lại, danh mục vẫn được trả về từ API. Đây là bước xác nhận cả thao tác ghi và đọc dữ liệu.”

### Khi giải thích network

“`my-shared-network` tồn tại trong Docker, không phải một thư mục. Khai báo ở cuối Compose cho biết mạng nào được dùng; khai báo trong service cho biết container nào tham gia. Alias `organic-backend` phải thuộc container Spring Boot.”

### Khi nói về phạm vi hiện tại

“Giá và ảnh thuộc biến thể/ảnh riêng trong backend; biểu mẫu hiện tại quản lý thông tin sản phẩm. Tồn kho chưa được API trả về. Giỏ hàng đang lưu tại trình duyệt và chưa tạo đơn hàng. Luồng đăng ký/OTP cần cấu hình email hợp lệ.”

## 4. Lệnh để mở sẵn khi demo

Terminal database:

```powershell
cd D:\oragnic-pro\organic_backend
docker compose up -d
docker compose ps
```

Sau đó Run Spring Boot bằng IntelliJ. Nếu dùng terminal thay IntelliJ:

```powershell
cd D:\oragnic-pro\organic_backend
.\mvnw.cmd spring-boot:run
```

Terminal frontend:

```powershell
cd D:\oragnic-pro\organic_frontend
pnpm.cmd dev
```

Các trang mở sẵn:

```text
http://localhost:8088/api/v1/products?size=1
http://localhost:5173/san-pham
http://localhost:5173/dang-nhap
http://localhost:5173/admin/categories
http://localhost:5173/admin/products
```

Nếu Vite chọn cổng khác vì 5173 bận, thay bằng cổng thực tế trong terminal.

## 5. Câu hỏi thường gặp để trao đổi

| Câu hỏi | Câu trả lời ngắn |
| --- | --- |
| Có cần Dockerfile backend khi chạy IntelliJ không? | Không. Compose gốc chỉ dùng để chạy PostgreSQL/Redis. |
| Có phải thêm network vào cả PostgreSQL và Redis không? | Không cần cho kết nối frontend. Trong mẫu Docker, Spring Boot tham gia network database và network chung frontend. |
| Có cần frontend `.env` khi đã có `.env.local` không? | Không cần nếu chạy Vite. Docker Compose dùng `.env` theo mặc định hoặc `--env-file`. |
| Vì sao mở cổng 8088 không thấy giao diện? | Đó là backend API; giao diện nằm ở cổng Vite hoặc Nginx. |
| Vì sao tài khoản demo frontend không đăng nhập được? | Khi dùng API thật, dùng tài khoản trong backend. |
| Vì sao dữ liệu máy mới không đúng 6 danh mục? | Seed có 5; máy demo có thêm danh mục do người dùng tạo. |
| Vì sao sản phẩm mới chưa có giá? | Biểu mẫu hiện quản lý metadata; giá nằm trong API biến thể riêng. |
| Bằng chứng frontend gọi backend là gì? | Xem request/response trong Network và dữ liệu vẫn tồn tại sau khi tạo rồi tải lại. |

## 6. Kết thúc buổi bàn giao

Yêu cầu mỗi thành viên thực hiện ba việc trên máy của mình: mở API sản phẩm thành công, đăng nhập frontend bằng tài khoản backend và tạo một danh mục test mới rồi tải lại để kiểm tra. Nếu chưa đạt, đối chiếu bảng xử lý lỗi trong tài liệu chính trước khi kết luận lỗi thuộc frontend hay backend.
