# Bộ Excel kiểm tra thủ công v3

Các file là Excel dữ liệu mẫu, không phải chỉ là tài liệu hướng dẫn. Mỗi file có sheet Data đúng cấu trúc nhập v2 và HuongDan để đọc. Không có công thức.

1. **01-san-pham.xlsx**: nhập 4 sản phẩm / 5 quy cách. Chọn loại trên giao diện vì B2:B6 còn trống. Backend tự cấp mã.
2. Tạo/chọn Nhà cung cấp và Xuất xứ đang hoạt động rồi gắn vào từng sản phẩm trước khi lập đơn mua.
3. **02-don-mua.xlsx**: chọn NCC đúng trên giao diện, ngày giao không trong quá khứ nếu có. Mã hàng để trống; backend mới đối chiếu tên + quy cách. Đối chiếu 240 gói/hộp, tổng 6.280.000 đồng.
4. Duyệt đơn, tải Excel Phiếu nhập của đúng đơn để lấy mã hàng và thông tin nguồn thật.
5. **03-phieu-nhap-dot-1.xlsx**: dữ liệu đợt 1. Trong mẫu Phiếu nhập vừa tải, giữ A:D và chép E:K theo đúng tên/quy cách B:C từ file 03. Không chép nguyên dòng hoặc dựa vào thứ tự khi khác nhau. Nhận đạt 235, bị loại 3, chưa giao 2.
6. Sau khi gửi duyệt và duyệt phiếu 1, đơn còn phải nhận 5 gói Cà rốt 500 g (gồm 3 bị loại và 2 chưa giao).
7. **04-phieu-nhap-bu-dot-2.xlsx**: tải lại mẫu mới của cùng đơn, giữ A:D và chép E:K theo tên/quy cách. Nhận bù 5, các dòng khác 0. Đối chiếu đủ 240 đạt, tổng giá nhập 6.280.000 đồng. Mã lô đợt 2 khác đợt 1.
8. **05-don-mua-so-am-co-y.xlsx**: lỗi có chủ ý ở D2=-1 và E3=-23000. Chỉ kiểm tra lỗi, không phải đơn hợp lệ.

## Lưu ý

- Hai file Phiếu nhập 03/04 chưa có SKU thật trong cột A, nên không được tải thẳng khi cột đó còn trống. Dùng mẫu do backend tạo làm file nhập chính như bước 5/7.
- Không tự đoán mã NCC, SKU hoặc mã đơn mua. Không cần sửa SQL. Bộ này không tự tạo dữ liệu hoặc chạy các thao tác thay bạn.
- Hạn dùng mẫu Cà rốt 10/11/2026, Táo 20/11/2026, hàng khô 26/04/2027. Nếu kiểm tra sau các mốc đó, chỉnh hạn dùng phù hợp.
- Đợt 2 yêu cầu backend và DB đã hỗ trợ luồng nhập nhiều đợt. Nếu DB chưa được phép cập nhật cho nghiệp vụ này, chỉ xem trước/đối chiếu và ghi lại giới hạn; không chạy migration chỉ để dùng bộ file.
- Dữ liệu có tiền tố KT281026V3. Nếu đã nhập rồi, dùng lại dữ liệu hoặc đổi tiền tố đồng nhất cả bộ để tránh trùng tên.
- Đã kiểm tra nội dung/cấu trúc file offline; chưa gọi API hoặc xác nhận các nghiệp vụ chạy thành công.
