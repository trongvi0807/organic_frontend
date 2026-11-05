# Hướng dẫn thao tác với 7 vai trò — Organicfood.vn

## Chuẩn bị tài khoản

1. Chạy lại backend và frontend sau khi cập nhật code. Đăng xuất và đăng nhập lại để bắt đầu buổi demo.
2. Đăng nhập tài khoản **Admin** hiện có, vào **Hệ thống → Nhân viên & Phân quyền**.
3. Tạo nhân viên bằng thông tin thật của người được phân công hoặc sửa vai trò của tài khoản hiện có.
4. Chọn vai trò phù hợp. Nếu kiêm nhiệm, có thể chọn nhiều vai trò; quyền của các vai trò được kết hợp.

Các tài khoản hiện tại được giữ nguyên. Hệ thống bổ sung danh sách vai trò, không tự cấp thêm quyền cho những tài khoản cũ. Admin quản lý tài khoản và cấu hình; muốn thực hiện nghiệp vụ, tài khoản phải được cấp vai trò nghiệp vụ tương ứng.

| Vai trò | Công việc chính |
| --- | --- |
| Giám đốc điều hành | Xem tổng quan và tra cứu hoạt động; các màn hình nghiệp vụ ở chế độ xem. |
| Trưởng nhóm thu mua | Quản lý nguồn cung, lập/sửa và duyệt đơn mua. |
| Nhân viên thu mua | Thông tin sản phẩm, nguồn cung; lập/sửa/theo dõi đơn mua. |
| Cửa hàng trưởng | Giám sát cửa hàng, duyệt nhập kho, duyệt phương án đổi trả và hỗ trợ xử lý hồ sơ. |
| Nhân viên kho | Theo dõi kho, xuất danh sách mua, lập phiếu nhập, soạn/giao hàng và kiểm nhận hàng thu hồi. |
| Nhân viên bán hàng | Xử lý đơn bán, khách hàng, ưu đãi, phản hồi; lập phương án đổi trả và thực hiện phương án được duyệt. |
| Nhân viên kinh doanh | Ghi nhận chuyến giao, cập nhật vận chuyển và đối soát tiền thu hộ. |

## Luồng mua và nhập hàng

| Bước | Người thực hiện | Thao tác | Kết quả cần xem |
| --- | --- | --- | --- |
| 1 | Kho | **Kho vận & Mua hàng → Tồn kho / Lô → Lập danh sách mua hàng**, chọn một nhà cung cấp và các sản phẩm đã từng nhập từ nhà cung cấp đó; kiểm tra rồi xuất Excel. | File danh sách mua hàng; chưa tạo đơn và chưa tăng tồn. |
| 2 | Thu mua | **Đơn mua & Duyệt đơn → Lập đơn mua**; nhập thủ công hoặc dùng Excel đúng mẫu. | Đơn chờ duyệt, có người lập và thông tin nhà cung cấp. |
| 3 | Trưởng nhóm thu mua | Mở đơn chờ duyệt → kiểm tra → **Duyệt đơn** hoặc **Từ chối**. | Lưu người duyệt và thời điểm duyệt. |
| 4 | Kho | Mở đơn đã duyệt → tải mẫu phiếu nhập hoặc **Lập phiếu nhập**; ghi số thực nhận, phần không đạt, lô và hạn sử dụng → gửi duyệt. | Phiếu chờ duyệt; chưa tăng tồn. |
| 5 | Cửa hàng trưởng | **Phiếu nhập & Duyệt nhập** → mở phiếu chờ duyệt → **Duyệt & nhập kho**. | Tồn tăng theo phần hàng đạt, có người duyệt. |
| 6 | Nhân viên có quyền xem | Mở đơn mua và **Lịch sử chỉnh sửa**. | Xem người sửa, thời điểm, dữ liệu trước/sau; không có nút sửa hoặc xóa lịch sử. |

Lần mua đầu tiên của sản phẩm dùng chức năng lập đơn mua thông thường. Danh sách đặt lại từ cảnh báo kho chỉ lấy sản phẩm có lịch sử thực nhập phù hợp với nhà cung cấp đang chọn. Trao đổi với nhà cung cấp thực hiện qua điện thoại/file Excel.

## Luồng bán và giao hàng

| Bước | Người thực hiện | Thao tác |
| --- | --- | --- |
| 1 | Khách hàng | Mua sản phẩm còn tồn và chọn phương thức thanh toán. |
| 2 | Bán hàng hoặc Kho | **Bán hàng & Khách hàng → Đơn bán & Giao hàng** → mở đơn đủ điều kiện → **Chuẩn bị hàng**. |
| 3 | Kinh doanh hoặc Kho | Mở đơn đang chuẩn bị → **Ghi nhận chuyến giao**. |
| 4 | Kinh doanh hoặc Kho | Khi đã bàn giao thực tế, xác nhận **Đã lấy hàng**, cập nhật tiến độ và kết quả giao. Thời gian dự kiến được tính theo vị trí hợp lệ đã lưu. |
| 5 | Kinh doanh hoặc Bán hàng | Với COD: ghi nhận khách đã trả tiền, sau đó đối soát tiền từ người giao khi có kết quả thực tế. |
| 6 | Bán hàng hoặc Cửa hàng trưởng | Khi đủ điều kiện → **Hoàn tất đơn**; kiểm tra điểm thưởng của khách. |

## Luồng trả hàng và hoàn tiền

| Bước | Người thực hiện | Thao tác | Kết quả |
| --- | --- | --- | --- |
| 1 | Khách hàng | Chọn đơn đủ điều kiện, gửi yêu cầu kèm ảnh minh chứng. | Hồ sơ chờ tiếp nhận. |
| 2 | Bán hàng | **Đổi trả** → mở hồ sơ → **Tiếp nhận xét duyệt**. | Nhân viên phụ trách được ghi nhận. |
| 3 | Bán hàng | **Lập / sửa phương án**, chọn số lượng và phương án; tiền hoàn tự tính → **Gửi cửa hàng trưởng duyệt**. | Lưu phương án nội bộ và thông báo cho cửa hàng trưởng; chưa gửi khách xác nhận. |
| 4 | Cửa hàng trưởng | Mở hồ sơ → **Xem / duyệt phương án**. Phương án đã lưu được điền sẵn; kiểm tra rồi **Duyệt và gửi khách xác nhận** hoặc từ chối. | Có người duyệt; nhân viên bán hàng phụ trách vẫn được giữ. |
| 5 | Khách hàng | Mở hồ sơ → đồng ý hoặc yêu cầu xét lại phương án. | Chỉ phương án đã duyệt mới được khách xác nhận. |
| 6 | Kho | Nếu cần thu hồi: **Hàng thu hồi** → nhận hàng → đối chiếu lô → kiểm tra → nhập lại phần đạt hoặc ghi nhận loại bỏ theo thực tế. | Hàng trả không tự tăng tồn có thể bán. |
| 7 | Bán hàng phụ trách hoặc Cửa hàng trưởng | Trao đổi và lưu thông tin tài khoản nhận tiền; sau khi thực sự chuyển tiền, ghi nhận kết quả và mã giao dịch. | Tiền đã hoàn và trạng thái được lưu theo kết quả thực tế. |
| 8 | Bán hàng phụ trách hoặc Cửa hàng trưởng | Khi hoàn đủ và xử lý hàng xong → **Hoàn tất hồ sơ**. | Hồ sơ hoàn tất, có lịch sử xử lý. |

Nếu đổi sản phẩm, người được quyền tạo đơn hàng đổi; Kho/Bán hàng chuẩn bị và Kinh doanh/Kho cập nhật chuyến giao theo các nút được phép hiển thị. Các điều kiện về số lượng, phiên bản phương án, người phụ trách và kết quả thanh toán vẫn được kiểm tra.

## Dữ liệu đã cập nhật ngày 05-11-2026

- Thêm **72 sản phẩm**, **75 quy cách**, kèm **80 ảnh** từ danh mục sản phẩm công khai của Organicfood.vn.
- Hiện có **97 sản phẩm đang kinh doanh**. Ngừng bán **11 sản phẩm mẫu**, giữ chứng từ và số lượng liên quan.
- Giữ nguyên **9 nhà cung cấp**, **6 chứng nhận**, tồn kho và lịch sử giao dịch.
- Không tạo đơn bán, giao dịch thanh toán hay số lượng tồn giả để tăng số liệu.
- Sản phẩm mới có tồn bằng 0. Bạn nhập hàng và duyệt phiếu để sản phẩm đủ điều kiện xuất hiện trên cửa hàng.
- Có thêm hai chương trình combo trên sản phẩm hiện có; thời hạn 10 ngày từ lúc tạo. Kiểm tra điều kiện trong trang Khuyến mãi trước khi dùng.

Nguồn danh mục: https://organicfood.vn/collections/rau-cu-qua, https://organicfood.vn/collections/trai-cay-theo-mua và các nhóm thực phẩm khô, hạt, ngũ cốc, đồ uống tương ứng. Không gán thêm chứng nhận cho sản phẩm mới.
