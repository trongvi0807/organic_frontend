# Nhà cung cấp và Excel mẫu đã sửa — 28-10-2026

Lần sửa này chỉ cập nhật frontend và file mẫu. Chưa gọi API nghiệp vụ, chạy build/kiểm thử chức năng hoặc thay đổi database.

## Nhà cung cấp và chi tiết đơn mua

Form Nhà cung cấp đã bổ sung lại **Người đại diện / liên hệ**, **Số điện thoại**, **Email**. Các trường từng bị ẩn theo yêu cầu tối giản form trước đây. Khi lưu, form gửi giá trị vừa nhập thay vì ghi đè bằng thông tin cũ. Điện thoại/email có kiểm tra định dạng; thông tin không bắt buộc có thể để trống.

Chi tiết nhà cung cấp và chi tiết đơn mua hiển thị riêng người đại diện, điện thoại, email. Dùng các trường backend đã có: `contactPerson`, `phoneNumber`, `email`. Không thêm API hay cột dữ liệu.

## Sản phẩm: Loại sản phẩm không được để trống

File 01 để trống categoryId vì phải lấy đúng loại trong hệ thống của bạn; không thể điền UUID giả vào file mẫu chung.

1. Tạo loại đang hoạt động nếu chưa có: Rau củ, Trái cây, Thực phẩm khô.
2. Vào Sản phẩm → Nhập Excel, chọn file 01.
3. Khối **Chọn loại sản phẩm còn thiếu** xuất hiện: Cà rốt → Rau củ; Táo → Trái cây; Gạo lứt và Yến mạch → Thực phẩm khô. Hai quy cách cà rốt dùng chung một lựa chọn.
4. Bấm **Bổ sung loại & kiểm tra lại file**. Hệ thống chỉ điền ID thật của loại đã chọn vào ô đang trống, rồi gửi lại file để backend kiểm tra. Có thể tải bản file đã bổ sung.
5. Chỉ bấm **Nhập sản phẩm** khi backend báo hợp lệ. Các lỗi khác vẫn phải sửa theo thông báo.

Giữ nguyên giá, mã/SKU, nguồn gốc và các ô đã có dữ liệu. Không tự xác nhận nhập hay tăng tồn. SHA và khóa chống trùng áp dụng cho đúng bản file đã được kiểm tra lại. Lần nhập chưa rõ kết quả phải được xử lý trước khi thay đổi file.

Nếu originId còn trống, cần gắn xuất xứ với sản phẩm và nhà cung cấp ở trang Truy xuất trước khi dùng luồng chọn sản phẩm theo NCC trong Đơn mua.

## Đơn mua / Phiếu nhập: Không mở được Excel

Các ô ngày trong file mẫu cũ lưu kiểu ISO `t="d"`. Đường đọc XSSF hiện tại không hỗ trợ kiểu ô này; ngày Excel thông thường được đọc từ giá trị số. Đã đối chiếu phần `getBaseCellType` và `getLocalDateTimeCellValue` trong [mã nguồn Apache POI](https://github.com/apache/poi/blob/trunk/poi-ooxml/src/main/java/org/apache/poi/xssf/usermodel/XSSFCell.java).

Bộ thay thế: **outputs/admin-test-flow-20261028-v2/**. Các ngày đã chuyển thành số ngày Excel, định dạng hiển thị yyyy-mm-dd; không còn ô t="d". Đã đọc cấu trúc và xem ảnh render của file; chưa chạy import/API chức năng. File cũ được giữ để không ghi đè thông tin bạn có thể đã điền.

| File | Cần tự điền trước khi nhập |
|---|---|
| 01 | Chọn loại trên giao diện mới, hoặc điền categoryId thật. originId có thể điền/gắn theo nguồn cung |
| 02 | A2:A6: cùng một supplierCode đã lưu, ví dụ NCC01 nếu đó đúng là mã NCC của bạn |
| 03 | A2:A6: cùng một purchaseOrderCode của đơn mua đã duyệt, có SKU tương ứng và còn số lượng được nhận |
| 04 | Chủ đích có số lượng âm/giá âm; chỉ dùng để tự kiểm tra cảnh báo, không làm đơn hợp lệ |

Giữ nguyên sheet Data, tên/thứ tự cột và SKU. Không nhập tên NCC vào cột mã hoặc UUID vào cột mã PO. Một file PO/GR thuộc một NCC/đơn mua; lặp đúng mã tương ứng trên mọi dòng. Nếu thao tác vào ngày khác, điều chỉnh ngày giao và NSX/HSD theo thời điểm thực tế.

## Các bước tự kiểm tra

- Tạo/sửa nhà cung cấp với thông tin liên hệ rồi mở lại chi tiết để đối chiếu dữ liệu lưu.
- Mở đơn mua: Người đại diện / liên hệ, điện thoại và email có nhãn riêng.
- Chọn loại cho file sản phẩm thiếu categoryId; hai dòng cà rốt cùng loại, giá/quy cách giữ nguyên.
- Dùng file PO/GR v2 sau khi điền mã thật; kiểm tra bản xem trước và xử lý lỗi dữ liệu nếu còn.
- File sai số lượng, giá, mã tham chiếu hoặc ngày hết hạn vẫn phải báo lỗi. Mở được workbook chưa có nghĩa đã nhập thành công hay tăng tồn.
