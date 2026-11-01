# Kiểm tra và xử lý hàng khách trả

Giao diện dùng lựa chọn tình trạng bằng tiếng Việt. Nhân viên không cần nhập hai ô số tốt/hỏng hoặc chọn chiều chuyển trạng thái kỹ thuật.

**Kiểm tra tình trạng hàng**

1. Mở Hàng thu hồi, chọn hồ sơ và sản phẩm.
2. Bấm Kiểm tra tình trạng hàng.
3. Chọn Toàn bộ còn tốt hoặc Toàn bộ bị hỏng / không thể bán lại. Hệ thống tự tính số lượng theo phần chưa kiểm tra.
4. Nếu có từ hai sản phẩm trở lên và có cả tốt/hỏng, chọn Có cả hàng tốt và hàng hỏng, chỉ nhập số bị hỏng. Phần tốt được tự tính.
5. Đọc kết quả tóm tắt rồi bấm Lưu kết quả kiểm tra.

Chưa chọn tình trạng thì không cho lưu. Một sản phẩm chỉ hiện hai lựa chọn tốt hoặc hỏng.

**Sửa kết quả kiểm tra**

Bấm Sửa kết quả kiểm tra và chọn kết quả đúng giống bước trên. Hệ thống chỉ điều chỉnh phần đã kiểm và còn đang giữ tại kho, tự tính lượng chênh lệch. Nếu kết quả giống dữ liệu đang lưu, không tạo thêm thao tác. Hàng đã nhập lại kho hoặc loại bỏ không nằm trong phần được sửa.

**Nhập lại kho**

Bấm Nhập lại kho, xem sản phẩm, lô và số hàng tốt rồi xác nhận. Số lượng mặc định là toàn bộ phần tốt còn chờ xử lý. Nếu có nhiều sản phẩm và chỉ nhập một phần, bật Chỉ nhập lại một phần số hàng này rồi nhập số thực tế.

Không yêu cầu ghi chú thủ công ở bước này; nội dung được tạo tự động. Hệ thống vẫn kiểm tra lô gốc, hạn sử dụng, trạng thái nhập kho trước khi tăng tồn.

**Xác nhận đã loại bỏ**

- Nếu chỉ có hàng hỏng, hộp thoại hỏi xác nhận đúng số hàng hỏng đã loại bỏ. Một sản phẩm không cần nhập số lượng.
- Nếu có cả tốt/hỏng, mặc định chọn nhóm hàng hỏng. Có thể chọn nhóm hàng tốt không thể bán lại hoặc toàn bộ, với số lượng được hiển thị rõ.
- Khi chọn một nhóm cụ thể có nhiều hàng, có thể bật Chỉ loại bỏ một phần và nhập số thực tế.
- Chỉ xác nhận sau khi thực tế đã loại bỏ. Thao tác tự lưu lịch sử và không tăng tồn bán.

**Trường hợp một túi chuối hỏng**

Kiểm tra tình trạng hàng → Toàn bộ bị hỏng / không thể bán lại → Lưu kết quả kiểm tra → Xác nhận đã loại bỏ → Xác nhận đã loại bỏ 1 sản phẩm.

Sau khi kho xử lý xong, luồng hoàn VNPay hiện có tiếp tục theo điều kiện của hồ sơ. Thay đổi giao diện này không thay kết quả giao dịch hoàn đang chờ xác minh/đối soát.

**Các tình huống để kiểm tra thủ công**

| Tình huống | Kết quả cần thấy |
|---|---|
| Một sản phẩm chưa kiểm | Chỉ hiện lựa chọn toàn bộ tốt/toàn bộ hỏng, chưa chọn thì không cho lưu |
| Năm sản phẩm, chọn có cả tốt/hỏng và nhập hai hỏng | Tóm tắt ba tốt, hai hỏng; không cần nhập số tốt |
| Số hỏng để trống, âm, số lẻ, bằng hoặc lớn hơn toàn bộ trong lựa chọn hỗn hợp | Hiện hướng dẫn rõ ràng và chặn lưu |
| Đã ghi một sản phẩm tốt nhưng cần sửa thành hỏng | Chọn lại toàn bộ bị hỏng; tự điều chỉnh một sản phẩm từ tốt sang hỏng |
| Sửa thành kết quả giống dữ liệu hiện có | Không gửi thao tác thay đổi |
| Nhập lại hoặc loại bỏ một phần | Chỉ số thực tế được ghi nhận; phần còn lại vẫn chờ xử lý |
| Hàng đã nhập lại/loại bỏ | Không tính vào số có thể sửa |
| Mất kết nối khi lưu | Giữ nguyên yêu cầu khi thử lại, không tự gửi lệnh mới |

Thay đổi chỉ ở frontend, dùng API hiện có; không sửa SQL/schema. Chỉ kiểm tra cú pháp và build, không chạy kiểm thử hoặc thực hiện thao tác trên dữ liệu nghiệp vụ.
