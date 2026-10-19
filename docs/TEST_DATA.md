# Dữ liệu kiểm thử với backend local

Đã đọc API tại `http://127.0.0.1:8088/api/v1` ngày 19/10/2026. Tại thời điểm kiểm tra, backend trả 6 danh mục và 8 sản phẩm. Đây là dữ liệu trong backend đang chạy, sử dụng với `VITE_DEMO_MODE=false`.

## Tài khoản đã xác minh đăng nhập thành công

| Vai trò | Tên đăng nhập | Mật khẩu |
| --- | --- | --- |
| Quản trị viên | `admin` | `Organic@123` |
| Khách hàng | `customer` | `Organic@123` |

Cả hai tài khoản đã trả `LOGIN_SUCCESS`, HTTP 200 và role tương ứng `ADMIN`/`CUSTOMER`. Các phiên dùng để kiểm tra đã được đăng xuất. Những tài khoản này thuộc dữ liệu seed backend local; tài khoản frontend demo có mật khẩu khác.

Nguồn tài khoản: `organic_backend/src/main/java/vn/huit/nhom1/config/TestDataInitializer.java`. Seed chỉ thêm tài khoản thiếu, không đặt lại mật khẩu của tài khoản đã tồn tại.

## Sản phẩm hiện có

| Mã | Tên | Giá từ |
| --- | --- | ---: |
| DEMO-SP001 | Cải bó xôi hữu cơ | 32.000 đ |
| DEMO-SP002 | Cà rốt hữu cơ | 28.000 đ |
| DEMO-SP003 | Cà chua hữu cơ | 35.000 đ |
| DEMO-SP004 | Táo hữu cơ | 65.000 đ |
| DEMO-SP005 | Chuối hữu cơ | 25.000 đ |
| DEMO-SP006 | Gạo lứt hữu cơ | 45.000 đ |
| DEMO-SP007 | Yến mạch hữu cơ | 60.000 đ |
| DEMO-SP008 | Hạnh nhân hữu cơ | 95.000 đ |

Nguồn sản phẩm seed: `organic_backend/src/main/java/vn/huit/nhom1/config/CatalogDataInitializer.java`. Các tên, chứng nhận và ảnh placeholder được tạo cho việc kiểm thử.

[Snapshot JSON từ API](backend-test-data.json) chứa danh mục, ID thật, ID thương hiệu và dữ liệu sản phẩm tại thời điểm kiểm tra; đây là snapshot tham khảo, không phải script import. Các thay đổi sau này trong backend không tự cập nhật file này.

## Trình tự kiểm thử frontend

1. Giữ backend chạy; đặt `VITE_DEMO_MODE=false` trong `.env.local` và khởi động lại Vite nếu vừa sửa cấu hình.
2. Mở `/san-pham`: kiểm tra 8 sản phẩm, tìm `Cà rốt`, lọc `Rau củ hữu cơ`, mở chi tiết để so sánh giá với bảng.
3. Đăng nhập `admin / Organic@123`: truy cập `/admin/products`, thử bộ lọc danh mục và phân trang.
4. Vào `/admin/categories`, tạo danh mục theo mẫu bên dưới. Tải lại trang để kiểm tra dữ liệu vẫn được API trả về.
5. Thêm sản phẩm theo mẫu bên dưới, chọn danh mục vừa tạo. Sản phẩm ở trạng thái bản nháp nên chỉ hiện trong Admin.
6. Đăng xuất rồi đăng nhập `customer / Organic@123`: kiểm tra tài khoản khách hàng xem được cửa hàng và không vào được Admin.

Các bước tạo dữ liệu là hướng dẫn để bạn thực hiện; chưa tự tạo những bản ghi bên dưới trong backend.

### Mẫu nhập danh mục mới

```text
Mã loại sản phẩm: TEST-CAT-001
Tên loại sản phẩm: Rau củ kiểm thử
Trạng thái: Hoạt động
Danh mục cha: Không có
Mô tả: Danh mục kiểm thử thao tác thêm và sửa từ frontend.
```

### Mẫu nhập sản phẩm mới

```text
Mã sản phẩm: TEST-SP-001
Tên sản phẩm: Bí đỏ hữu cơ kiểm thử
Đường dẫn: bi-do-huu-co-kiem-thu
Loại sản phẩm: Rau củ kiểm thử
Trạng thái: Bản nháp
Xác minh hữu cơ: Đang xác minh
Mô tả: Sản phẩm kiểm thử thao tác thêm và sửa từ frontend.
```

Biểu mẫu API thật hiện quản lý thông tin sản phẩm; giá và ảnh nằm trong API biến thể/ảnh riêng. Dùng 8 sản phẩm seed để kiểm tra hiển thị giá/ảnh. API hiện chưa cung cấp tồn kho để kiểm tra số lượng hàng thực tế.

Nếu đã dùng mã `TEST-CAT-001`/`TEST-SP-001`, đổi sang mã mới để tránh trùng mã khi thử tạo lần tiếp theo.
