# Nhà cung cấp và Excel mẫu đã sửa — 28-10-2026

> Cập nhật tiếp theo: luồng nhập đã chuyển sang mẫu tiếng Việt và gửi lựa chọn trực tiếp cho backend. Xem [EXCEL_IMPORT_UX_V2.md](EXCEL_IMPORT_UX_V2.md). Các phần dưới ghi lại cách xử lý trước đó; thao tác bổ sung loại/NCC không còn cần sửa workbook trên trình duyệt trong luồng mới.

Lần sửa này chỉ cập nhật frontend và file mẫu. Chưa gọi API nghiệp vụ, chạy build/kiểm thử chức năng hoặc thay đổi database.

## Nhà cung cấp và chi tiết đơn mua

Form Nhà cung cấp đã bổ sung lại **Người đại diện / liên hệ**, **Số điện thoại**, **Email**. Các trường từng bị ẩn theo yêu cầu tối giản form trước đây. Khi lưu, form gửi giá trị vừa nhập thay vì ghi đè bằng thông tin cũ. Điện thoại/email có kiểm tra định dạng; thông tin không bắt buộc có thể để trống.

Chi tiết nhà cung cấp và chi tiết đơn mua hiển thị riêng người đại diện, điện thoại, email. Dùng các trường backend đã có: `contactPerson`, `phoneNumber`, `email`. Không thêm API hay cột dữ liệu.

## Sản phẩm: Loại sản phẩm không được để trống

File 01 để trống categoryId vì phải lấy đúng loại trong hệ thống của bạn; không thể điền UUID giả vào file mẫu chung.

1. Tạo loại đang hoạt động nếu chưa có: Rau củ, Trái cây, Thực phẩm khô.
2. Vào Sản phẩm → Nhập Excel, chọn file 01.
3. Khối **Chọn loại sản phẩm còn thiếu** hiển thị danh sách loại ngay dưới từng sản phẩm, không cần mở dropdown. Gõ tên/mã để lọc, rồi bấm một dòng: Cà rốt → Rau củ; Táo → Trái cây; Gạo lứt và Yến mạch → Thực phẩm khô. Hai quy cách cà rốt dùng chung một lựa chọn. Kiểm tra dấu tích, dòng “Đã chọn” và bộ đếm 4/4 trước khi tiếp tục. Nếu không có loại đang hoạt động thì tạo loại trước rồi bấm tải lại danh sách.
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
| 02 | A2:A6: cùng một supplierCode đã lưu, ví dụ NCC01 nếu đó đúng là mã NCC của bạn. Nếu để trống, chọn nhà cung cấp trong giao diện xem trước rồi bấm Bổ sung nhà cung cấp & kiểm tra lại file |
| 03 | A2:A6: cùng một purchaseOrderCode của đơn mua đã duyệt, có SKU tương ứng và còn số lượng được nhận |
| 04 | Chủ đích có số lượng âm/giá âm; chỉ dùng để tự kiểm tra cảnh báo, không làm đơn hợp lệ |

Giữ nguyên sheet Data, tên/thứ tự cột và SKU. Không nhập tên NCC vào cột mã hoặc UUID vào cột mã PO. Một file PO/GR thuộc một NCC/đơn mua; lặp đúng mã tương ứng trên mọi dòng. Nếu thao tác vào ngày khác, điều chỉnh ngày giao và NSX/HSD theo thời điểm thực tế.

### Chọn nhà cung cấp cho file Đơn mua thiếu mã

- Sau khi chọn file 02, khối **Chọn nhà cung cấp còn thiếu** tải danh sách nhà cung cấp đang hoạt động từ API hiện có `/suppliers`.
- Tìm bằng tên/mã và bấm chọn nhà cung cấp thật đã lưu. Bấm **Bổ sung nhà cung cấp & kiểm tra lại file** để điền mã vào các ô trống của cột A. Không điền tên, mã thuế hoặc UUID vào supplierCode.
- Các ô mã đã có được giữ nguyên. Nếu file có nhiều mã khác nhau, hoặc mã đã có không khớp nhà cung cấp đang hoạt động, phải sửa file trước.
- File bổ sung được gửi lại `/purchase-orders/import/preview`; chỉ nhập bằng đúng file, SHA và khóa chống trùng sau khi backend xác nhận hợp lệ. Có thể tải bản file đã bổ sung; file gốc trên máy không tự thay đổi.
- Lỗi SKU, ngày, giá hoặc số lượng vẫn phải sửa theo bản xem trước. Thao tác bổ sung mã không tạo đơn, không tăng tồn và không sửa SQL.

### Lỗi frontend khi bổ sung mã: Không đọc được file .xlsx

Đối chiếu trực tiếp cấu trúc file mẫu 02 v2: workbook, styles và worksheet dùng namespace với tiền tố `x:` (ví dụ `x:workbook`, `x:worksheet`). ExcelJS 4.4.0 đang so khớp tên thẻ trực tiếp trong các bộ đọc XML (`workbook-xform.js`, `parse-sax.js`), khiến bước mở workbook có thể thất bại dù backend đọc được dữ liệu. Thông báo cũ đã gom lỗi này thành “Không đọc được file .xlsx”; lỗi xảy ra trước khi gửi file bổ sung tới backend, chưa phải kết quả kiểm tra nhà cung cấp.

Đã thay đường bổ sung mã NCC và loại sản phẩm bằng `importWorkbookCells.js`: mở ZIP bằng JSZip, nhận diện thẻ theo namespace XML và chỉ cập nhật các ô trống trong worksheet Data. Không đọc/ghi lại toàn bộ workbook qua ExcelJS. Các phần ngày tháng, giá, số lượng, định dạng, sheet khác và liên kết workbook được giữ trong file. Chưa thay API hoặc SQL.

Đã đọc cấu trúc XML của file mẫu và rà mã nguồn; chưa chạy kiểm thử chức năng, chưa gọi import API theo yêu cầu của người dùng. Các bước người dùng tự kiểm tra:

1. Mở lại form, chọn file 02 v2 và nhà cung cấp thật. Bổ sung mã rồi xem kết quả kiểm tra lại.
2. Tải file đã bổ sung; kiểm tra A2:A6 có cùng mã NCC, B2:B6 giữ đúng ngày, SKU/số lượng/giá không đổi.
3. Thử tương tự với file 01 thiếu loại; chỉ các ô categoryId trống được điền.
4. File có mã sẵn, nhiều NCC, sai SKU, công thức hoặc tên cột sai vẫn phải được chặn/báo lỗi tại bước tương ứng. Không tự xác nhận tạo đơn.

## Các bước tự kiểm tra

- Tạo/sửa nhà cung cấp với thông tin liên hệ rồi mở lại chi tiết để đối chiếu dữ liệu lưu.
- Mở đơn mua: Người đại diện / liên hệ, điện thoại và email có nhãn riêng.
- Chọn loại cho file sản phẩm thiếu categoryId; hai dòng cà rốt cùng loại, giá/quy cách giữ nguyên.
- Dùng file PO/GR v2 sau khi điền mã thật; kiểm tra bản xem trước và xử lý lỗi dữ liệu nếu còn.
- File sai số lượng, giá, mã tham chiếu hoặc ngày hết hạn vẫn phải báo lỗi. Mở được workbook chưa có nghĩa đã nhập thành công hay tăng tồn.

## Xuất Excel phiếu nhập ngay từ Đơn mua đã duyệt

- Khi Admin duyệt đơn mua thành công trong giao diện, cửa sổ duyệt đóng, danh sách cập nhật và frontend yêu cầu tải mẫu phiếu nhập của chính đơn đó.
- API hiện có: `GET /api/v1/goods-receipts/import-template?purchaseOrderId=<id đơn mua>`. ID chỉ dùng gọi API; backend điền mã nghiệp vụ `orderCode` vào cột `purchaseOrderCode` trên mọi dòng sheet Data, kèm toàn bộ SKU.
- Nút **Tải Excel phiếu nhập** xuất hiện tại danh sách và chi tiết đơn đã duyệt/giao một phần còn có thể lập phiếu. Dùng để tải lại hoặc tải mẫu mới cho đợt giao tiếp theo. Nếu đang lọc Chờ duyệt, chuyển Tất cả hoặc Đã duyệt để tìm đơn vừa duyệt.
- Sheet `OrderedItems` có số đặt, số đã nhận, số đang chờ và số còn có thể nhận. Điền thực nhận/hàng loại, mã lô, NSX/HSD và lý do chênh lệch vào Data; không phải gõ lại purchaseOrderCode.
- Nếu tải Excel thất bại sau khi duyệt, thông báo nêu rõ đơn đã được duyệt. Chỉ tải lại file; không duyệt đơn lần nữa. Đơn kết thúc/không còn số có thể nhận không hiện nút tải mẫu.
- Tải mẫu không tạo phiếu nháp và không tăng tồn. Vẫn cần kiểm tra file, tạo phiếu, gửi duyệt rồi duyệt nhập. Không thay đổi API/SQL và chưa chạy các bước kiểm thử chức năng này thay người dùng.
