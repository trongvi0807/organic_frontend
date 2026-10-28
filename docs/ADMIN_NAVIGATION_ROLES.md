# Điều hướng Admin theo vai trò — 28/10/2026

## Bố cục

Sidebar chỉ hiển thị mục cha; từng nhóm dùng liên kết ngang theo URL thật. Không thêm vai trò mới.

| Vai trò API | Mục Sidebar |
|---|---|
| ADMIN | Tổng quan; Nguồn gốc & Minh bạch; Sản phẩm; Bán hàng & Khách hàng; Kho vận & Mua hàng; Hệ thống |
| WAREHOUSE_STAFF | Tổng quan; Nguồn gốc & Minh bạch; Sản phẩm; Kho vận & Mua hàng |
| SALES_STAFF | Tổng quan; Bán hàng & Khách hàng |

Tài khoản nhiều vai trò nhận hợp các nhóm được phép. Hỗ trợ tiền tố ROLE_. Vai trò lạ không được cấp quyền quản trị.

Các tab:

- Nguồn gốc: Xuất xứ / Chứng nhận / Truy xuất sản phẩm.
- Sản phẩm: Sản phẩm / Loại sản phẩm (tab loại sản phẩm chỉ ADMIN).
- Bán hàng: Đơn bán & Giao hàng / Đối soát thanh toán / Khuyến mãi / Khách hàng.
- Kho vận: Nhà cung cấp / Đơn mua & Duyệt đơn / Phiếu nhập & Duyệt nhập / Tồn kho-Lô.
- Hệ thống (ADMIN): Thông báo / Biểu mẫu & Bản in / Nội dung trang chủ.

Biểu mẫu vẫn có lối vào trên thanh công cụ cho mọi nhân viên. Kho có lối vào “Đơn cần chuẩn bị” và trung tâm thông báo; không bỏ quyền nghiệp vụ cũ chỉ vì ẩn nhóm bán hàng trên Sidebar. SALES vẫn dùng chuông thông báo ở thanh trên.

## URL và trạng thái

Giữ các URL `/admin/products`, `/admin/promotions`, `/admin/purchase-orders`… và các liên kết từ Dashboard/thông báo. `/admin` mở Tổng quan. Không thay đổi chính sách chuyển hướng đăng nhập nhân viên hiện có.

Các URL cũ `/admin/order-approvals`, `/admin/receipt-approvals` vẫn chỉ ADMIN, mở cùng bảng với lọc Chờ duyệt và đánh dấu đúng tab Kho vận. Trong trang thường, ADMIN có bộ lọc nhanh Tất cả/Chờ duyệt; quyền duyệt vẫn do backend kiểm tra.

Ghi nhớ trang con vừa xem trong thời gian AdminLayout còn được mở. Bộ lọc/phân trang sản phẩm, hồ sơ, đơn mua/phiếu nhập và đơn bán được giữ trong bộ nhớ theo phiên đăng nhập khi chuyển tab rồi quay lại. Không giữ form nghiệp vụ chưa lưu hay dữ liệu API trong bộ nhớ này; không lưu qua lần tải lại trình duyệt. Phân trang dùng tối đa 50 để tương thích giới hạn API đơn hàng.

Tab dùng liên kết HTML/React Router, hỗ trợ bàn phím, aria-current, Back/Forward và cuộn ngang trên điện thoại. Drawer giữ đóng/mở, Escape, focus trap, inert. Chuyển tab không giữ trang cũ chạy ngầm. Phát hiện sửa form trong modal để cảnh báo khi bấm liên kết điều hướng hoặc tải lại/đóng trang; không chặn nút Back nội bộ của trình duyệt. Tôn trọng prefers-reduced-motion; ẩn thanh điều hướng khi in.

## Quyền được mở rộng theo yêu cầu

### Kho / Thu mua

- Cho ADMIN và WAREHOUSE_STAFF dùng `/api/v1/admin/products` và các API con: hồ sơ sản phẩm, quy cách/giá, ảnh, mẫu Excel, xem trước/import.
- Excel kiểm tra cả quyền tài khoản trong database, không chỉ JWT; ghi nhận người import như trước.
- Cho kho GET `/api/v1/admin/categories` và `/{id}` để chọn danh mục kể cả danh mục ẩn. POST/PUT/DELETE loại sản phẩm vẫn chỉ ADMIN; không hiện trang quản lý loại sản phẩm cho kho.
- Không mở quyền duyệt đơn mua/phiếu nhập hay quản lý trang chủ cho kho.

### Bán hàng

- Cho ADMIN và SALES_STAFF GET/POST/PUT/DELETE `/api/v1/admin/promotions` và `/{id}`. DELETE ngừng mã, không xóa lịch sử.
- Giữ nguyên kiểm tra mã đã sử dụng/đang giữ, phạm vi, hiệu lực, mức giảm và giới hạn lượt.
- Thêm đúng hai API chỉ đọc phục vụ chọn phạm vi, cùng quyền ADMIN/SALES_STAFF:

| API | Đầu vào | `data.items[]` |
|---|---|---|
| GET `/api/v1/admin/promotions/products` | `page` mặc định 0, `size` mặc định 20 | `id`, `productCode`, `productName` |
| GET `/api/v1/admin/promotions/batches` | `page` mặc định 0, `size` mặc định 20 | `id`, `batchCode`, `productName`, `expiryDate` |

Phản hồi dùng ApiResponse/PageResponse hiện tại, có `totalPages`, `totalElements`, `content`/`items`. API lô chỉ lấy lô đã duyệt nhập còn hạn; không trả tồn kho, lượng giữ hay giá nhập. Không cấp quyền cho SALES gọi `/admin/products`, `/admin/categories` hay quản lý kho. Frontend chọn sản phẩm/lô qua hai API này, tránh lỗi 403 khi mở form khuyến mãi.

## Áp dụng

1. Khởi động lại Spring Boot để nạp cấu hình phân quyền và hai API lựa chọn.
2. Chạy frontend bằng `pnpm dev`, hoặc build/deploy cả frontend và backend tương ứng.
3. Kiểm tra tài khoản kho, bán hàng và Admin. Không cần đổi mã vai trò hoặc dữ liệu phân vai hiện có.

Chỉ chạy frontend mới với backend cũ sẽ chưa dùng được quyền mới và API lựa chọn khuyến mãi.

## Kiểm tra

Các kiểm thử mới kiểm tra ma trận Sidebar/tab, hợp nhiều vai trò, đường dẫn duyệt cũ, route truy cập trực tiếp, giữ bộ lọc theo phiên, cảnh báo form chưa lưu, form khuyến mãi dùng đúng API, filter-chain + method security backend. Kiểm thử Excel riêng kiểm tra quyền database và không cộng tồn khi import sản phẩm.

Kết quả: 556 kiểm thử frontend (57 tệp), 9 kiểm thử HTTP security backend và 16 kiểm thử Excel/PDF tích hợp với H2 đều đạt. Production build frontend + service worker thành công; vẫn có cảnh báo kích thước bundle chính trên 500 kB. Giao diện được kiểm tra tương tác bằng jsdom, chưa kiểm tra trực quan trên trình duyệt trong phiên này. Không chạy thao tác ghi trên database thật.
