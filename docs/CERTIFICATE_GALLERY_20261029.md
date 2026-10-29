# Công khai ảnh và thông tin ba hồ sơ chứng nhận

## Hiển thị tại cửa hàng

Mục trang chủ đổi tiêu đề thành “Minh bạch từ từng chứng nhận”, có lưới ba thẻ trên màn hình lớn và thu gọn trên điện thoại. Mỗi thẻ hiển thị ảnh phóng to, số chứng nhận, tổ chức cấp, ngày cấp, thời hạn, mô tả phạm vi, trạng thái và liên kết mở tài liệu gốc.

- Markal: ảnh xem trước được kết xuất trực tiếp từ trang đầu PDF gốc, giữ nguyên nội dung. File ảnh: `public/images/certificates/markal-eu-2026-2028.png`. [Nguồn PDF](https://www.markal.fr/travaux/certificats/2026/certificat-bio-ecocert-2026-2028-fr-markal.pdf).
- USDA Organic và HACCP: hiển thị ảnh tài liệu gốc do [Altavie công bố](https://altavie.vn/pages/chung-nhan), không thay bằng logo hay giấy tự dựng.
- Trạng thái/ngày tháng lấy từ hồ sơ quản trị. Không tự gán ngày hết hạn, không thay đổi trạng thái xác minh. Tại thời điểm cập nhật giao diện, cả ba hồ sơ trong database đã có trạng thái verified; hai hồ sơ Vạn Sơn Thịnh Phát đã được chỉnh ngày sau lần nhập ban đầu. Đợt này giữ nguyên các thay đổi đó, không coi chúng là kết quả xác minh lại tài liệu Internet.
- Hồ sơ pending được chọn công khai có nhãn “Chờ xác minh”; hồ sơ chưa được chọn không tự xuất hiện chỉ vì có ảnh. Hồ sơ lưu trữ, từ chối hoặc thu hồi không xuất hiện trong danh sách giới thiệu. Tài liệu nhà sản xuất/đơn vị được cấp không được diễn giải thành chứng nhận của toàn bộ cửa hàng.

## Quản lý

Trong quản lý trang chủ → Nội dung & liên hệ, thêm phần “Hồ sơ chứng nhận công khai”, tối đa sáu hồ sơ. Có thể chọn theo tên/số chứng nhận, viết giới thiệu, cấu hình ảnh xem trước. Ảnh PDF chỉ giữ khi đường dẫn tài liệu gốc còn khớp; thay tài liệu sẽ không tiếp tục dùng bìa cũ.

Đã lưu lựa chọn ba hồ sơ vào dòng `certification-gallery` của bảng `home_content` hiện có. Không đổi cấu trúc bảng, không đổi chứng nhận hoặc liên kết sản phẩm. Dùng dòng cấu hình riêng ban đầu để tiến trình backend phiên bản cũ vẫn đọc được nội dung trang chủ cho đến khi khởi động lại.

Backend bổ sung `certificationGallery` tùy chọn trong nội dung trang chủ; trả thêm `status`, `currentlyValid`, `documentUrl`, `documentContentType`, `previewImageUrl`, `description` cho thẻ chứng nhận. Chỉ xuất trường công khai; không trả ghi chú nội bộ/người duyệt. Thống kê chứng nhận hợp lệ và nhãn organic sản phẩm vẫn dùng điều kiện xác minh/hiệu lực/liên kết sản phẩm cũ.

## Áp dụng và kiểm tra thủ công

1. Khởi động lại backend để nhận phần dữ liệu công khai mới, tải lại frontend.
2. Xem ba thẻ trên trang chủ, bấm ảnh để phóng to, bấm “Mở tài liệu gốc”.
3. Kiểm tra bố cục trên điện thoại và máy tính; đối chiếu thông tin ngày tháng với hồ sơ quản trị.
4. Nếu cần thay danh sách, chọn lại ở phần quản lý trang chủ và lưu.

Đã kiểm tra cú pháp JSX/JavaScript và khoảng trắng thay đổi. Theo yêu cầu giữ các luồng kiểm thử cho người dùng thực hiện thủ công, không chạy build/test hoặc thao tác mua hàng. Chưa xác nhận giao diện thực tế sau khi backend được khởi động lại.

Bản sao lưu trước khi công khai và báo cáo nằm ngoài Git: `D:/oragnic-pro/data-maintenance/20261029/certificate-gallery-published.json`.
