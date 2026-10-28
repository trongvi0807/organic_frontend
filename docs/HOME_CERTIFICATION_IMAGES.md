# Ảnh giấy chứng nhận trong thẻ hồ sơ trang chủ

Mục Thông tin chứng nhận hiển thị ảnh ngay trong từng thẻ, có nút Xem ảnh mở hộp thoại phóng to. Đã bỏ phần logo USDA/EU thêm nhầm ở lần trước.

- Ba hồ sơ DEMO-CERT-001/002/003 là dữ liệu mẫu. Hình tờ giấy minh họa được dựng bằng SVG, có đúng mã hồ sơ, loại chứng nhận, ngày cấp và hết hạn; ghi rõ Mẫu / Không phải chứng nhận thực tế. Không có con dấu, chữ ký hay logo tổ chức cấp giả.
- Với hồ sơ thật: ưu tiên documentUrl đã công bố. HomeResponse.CertificateCard hiện chưa có trường này; frontend đối chiếu ID và số chứng nhận với danh sách chứng nhận còn hiệu lực trong public GET /products/{id}. Không gọi API quản trị /certifications từ trang chủ.
- Tra cứu tối đa 24 sản phẩm khác nhau từ các bộ sưu tập trang chủ, mỗi nhóm 3 request, dừng khi tìm đủ. Nếu chứng nhận không gắn với sản phẩm nào trong các bộ sưu tập đó, ảnh có thể chưa tìm được; hiển thị chưa có ảnh thay vì tự gán giấy của hồ sơ khác.
- Ảnh dùng object-contain, có alt và trạng thái khi tải lỗi. PDF có liên kết mở tài liệu gốc. Hình minh họa chỉ áp dụng cho mã DEMO-CERT, không tự áp dụng cho hồ sơ thật thiếu ảnh.
- Giữ nguyên các trường thông tin và ngày từ backend. Nếu tìm thấy sản phẩm chứa chứng nhận, link hồ sơ chuyển đúng sản phẩm đó ở trang Về cửa hàng.

Không thay API, backend hoặc SQL. Để loại bỏ hoàn toàn bước tra cứu qua sản phẩm, backend có thể bổ sung documentUrl, documentContentType vào CertificateCard của /home và /home/certifications (chưa thực hiện).

Chưa chạy kiểm thử trình duyệt, build hoặc API theo yêu cầu người dùng tự kiểm tra. Người dùng mở trang chủ, bấm ảnh từng hồ sơ mẫu, kiểm tra đúng loại/mã/ngày; thử ảnh thật/PDF/URL lỗi với dữ liệu phù hợp.
