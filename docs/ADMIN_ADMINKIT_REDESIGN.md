# Giao diện quản trị tham khảo AdminKit

Nguồn tham khảo ngày 28-10-2026:

- [AdminKit repository](https://github.com/adminkit/adminkit)
- [Demo dashboard](https://demo.adminkit.io/)
- [Sidebar SCSS](https://github.com/adminkit/adminkit/blob/main/src/scss/3-components/_sidebar.scss)
- [Navbar SCSS](https://github.com/adminkit/adminkit/blob/main/src/scss/3-components/_navbar.scss)

Triển khai lại bằng React, Tailwind và Recharts hiện có; không thêm Bootstrap, script hoặc CSS CDN của AdminKit. Mượn cách tổ chức vùng làm việc, sắc độ sidebar và hệ phân cấp thông tin, giữ nhận diện Mộc.

## Những thay đổi

- Sidebar xanh xám đậm mặc định, trạng thái active có thanh màu bên trái; vẫn chỉ các mục cha theo quyền và tab ngang trong trang. Logo Mộc giữ nguyên. Có thể đổi sidebar sáng/tối; tùy chọn trước đó trong localStorage được tôn trọng.
- Nút đầu thanh công cụ thu/mở sidebar thành rail biểu tượng trên desktop. Rail rộng 78px; đầy đủ 256px. Trên mobile <=640px dùng drawer; có backdrop, Escape, vòng Tab, inert và trả focus về nút menu khi đóng.
- Thanh trên nền trắng, breadcrumb chức năng hiện tại, tìm chức năng theo tên không dấu, chuông thông báo và menu tài khoản. Ctrl/Cmd+K mở tìm nhanh khi không có hộp thoại/drawer đang mở. Kết quả lấy đúng getAdminNavigation(user), không bổ sung quyền hay endpoint.
- Vùng nội dung nền xám nhạt, tiêu đề sans, card trắng bo 7–9px, shadow rất nhẹ. Tab ngang, bảng, thanh lọc, nút, badge, phân trang và form thống nhất.
- Dashboard gồm KPI gọn, biểu đồ doanh thu/số đơn và donut danh mục, bảng cảnh báo, tác vụ, đơn gần đây và timeline hoạt động. Dữ liệu thật/mô phỏng, nguồn lỗi/không có quyền và cách tính cũ được giữ nguyên; không tạo số liệu mới để trang có vẻ đẹp hơn.
- Modal qua Radix Portal vẫn nhận kiểu quản trị nhờ AdminAppearanceContext. Chỉ modal nằm dưới AdminLayout nhận scope này; dialog trang bán hàng không bị đổi.
- Biểu mẫu in A4 giữ font/khổ giấy hiện có; không áp dụng reset font lên print sheet hoặc #organic-print-root. Không thêm dấu đỏ.

## File chính

- src/layouts/AdminLayout.jsx
- src/components/admin/AdminSidebar.jsx
- src/components/admin/AdminQuickSearch.jsx
- src/components/admin/AdminAccountMenu.jsx
- src/contexts/AdminAppearanceContext.jsx
- src/components/ui/dialog.jsx (gắn class theo context)
- src/styles/admin-kit.css
- src/pages/admin/AdminDashboardPage.jsx
- src/components/dashboard/DashboardMetrics.jsx
- src/components/dashboard/DashboardCharts.jsx
- src/components/dashboard/DashboardOperations.jsx
- src/styles/admin-dashboard-refresh.css

Không thay API, backend, SQL, quyền, trạng thái đơn, dữ liệu tồn hoặc quy trình duyệt. Giữ bộ nhớ nhóm/tab/filter và cảnh báo dữ liệu chưa lưu hiện có.

## Kiểm tra và giới hạn

Đã rà mã nguồn, đường dẫn route, độ ưu tiên CSS với style legacy, context qua Portal và scope của biểu mẫu in. Chưa chạy build/test tự động, mở luồng trên trình duyệt hoặc gọi API nghiệp vụ, theo yêu cầu người dùng tự kiểm thử. Chưa có xác nhận bằng ảnh chụp thực tế trên desktop/mobile.

Người dùng tự kiểm tra:

1. Đăng nhập Admin / Kho / Bán hàng, kiểm tra số mục sidebar và tab vẫn đúng quyền; URL cũ vẫn hoạt động.
2. Thu/mở sidebar, đổi sidebar sáng/tối, tải lại trang; mở drawer trên mobile, Tab/Escape và backdrop hoạt động đúng.
3. Tìm tên chức năng có/không dấu, dùng phím mũi tên/Enter; kết quả không đưa tới chức năng ngoài quyền. Ctrl+K không đưa focus ra khỏi modal/drawer.
4. Xem Dashboard, đổi thời gian/ngày-tuần, đọc dạng bảng của biểu đồ, mở chi tiết chứng từ và kiểm tra thông báo dữ liệu thiếu.
5. Vào Sản phẩm, Đơn mua, Phiếu nhập, Kho: kiểm tra bộ lọc, căn phải cột số, form, validation và popup vẫn thao tác được.
6. Mở xem trước biểu mẫu A4, kiểm tra font/khổ giấy và tính năng in/PDF vẫn như trước; logo và trang bán hàng không đổi.
