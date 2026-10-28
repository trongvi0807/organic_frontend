# Nhập Excel theo nghiệp vụ — cập nhật 28-10-2026

Đã cập nhật cả frontend và backend. Không thêm/sửa bảng, entity, SQL, migration hoặc cấu hình database trong lần cập nhật này. Không chạy ứng dụng, build, test tự động, import API hay ghi dữ liệu nghiệp vụ để kiểm thử; người dùng tự kiểm tra thủ công.

## Cách sử dụng

### Đơn mua

1. Mở **Lập đơn đặt mua → Nhập từ Excel**.
2. Chọn nhà cung cấp bằng tên; nhập ngày giao dự kiến và ghi chú chung trên giao diện nếu cần.
3. Bấm **Tải Excel mẫu tiếng Việt**. Sheet `Data` đã có mã hàng, tên và quy cách của các sản phẩm liên kết với nhà cung cấp qua Xuất xứ. Không cần gõ supplierCode hoặc ID vào file.
4. Chỉ điền **Số lượng đặt** và **Giá nhập** cho các sản phẩm muốn mua. Dòng để trống cả hai ô được bỏ qua; dòng chỉ điền một trong hai sẽ báo thiếu dữ liệu. Có thể xóa các dòng không dùng.
5. Chọn file, xem tên sản phẩm, nhà cung cấp, quy cách, số lượng, giá và lỗi theo dòng. Bấm **Tạo đơn mua chờ duyệt** khi đã đối chiếu.

Mẫu giới hạn 100 dòng. Nhà cung cấp có hơn 100 quy cách được thông báo giới hạn trong `HuongDan`; cần chia đơn hoặc thêm mã hàng phù hợp từ danh mục hiện có. Nhà cung cấp chưa có sản phẩm liên kết cần cập nhật Xuất xứ/Truy xuất trước. Không tự liên kết hoặc tạo sản phẩm khi nhập đơn.

### Phiếu nhập

1. Mở **Lập phiếu nhập → Nhập từ Excel**, chọn đơn mua đã duyệt/giao một phần và còn hàng được nhận.
2. Tải mẫu dành riêng cho đơn đó. Mã đơn nằm ở `ThongTin`; danh sách hàng và số còn được nhận đã có trên `Data`.
3. Điền số lượng đạt/bị loại, mã lô, ngày sản xuất, hạn dùng và lý do thiếu/hỏng. Đối chiếu đủ các dòng, kể cả dòng nhận 0. Ghi chú chung nhập trên giao diện.
4. Chọn file và kiểm tra. Số còn được nhận trên Excel chỉ là tham khảo khi tải; backend kiểm tra lại số hiện tại khi xem trước và khi lưu.
5. Nhập thành công chỉ tạo **phiếu nháp**. Gửi duyệt, sau đó Admin duyệt mới tăng tồn. Không đổi quy trình nhập nhiều đợt/Đóng đơn trong lần cập nhật này.

Mẫu mới được dùng cả khi bấm **Tải Excel phiếu nhập** tại đơn mua hoặc tải tự động sau khi duyệt đơn.

### Sản phẩm

1. Mở **Sản phẩm → Nhập Excel** và tải mẫu tiếng Việt.
2. Nhập tên, quy cách, khối lượng, đơn vị, giá bán; mô tả, giá trước giảm, xuất xứ, mã vạch tùy chọn.
3. Chọn loại trong danh sách Excel hoặc nhập tên/mã loại chính xác. Nếu cùng một loại, có thể để trống trong Excel và chọn loại chung trên giao diện. File nhiều loại có thể chọn bổ sung từng sản phẩm sau khi xem trước.
4. Backend tự cấp `SP01`, `SP02`… và SKU `SP01-01`, `SP01-02`… dựa trên mã hiện có. Các dòng cùng tên được gom thành một sản phẩm; không lặp quy cách trong cùng sản phẩm. Mã và đường dẫn được hiển thị để đối chiếu trước khi lưu.
5. Nhập chỉ tạo sản phẩm **nháp**, organic **chờ xác minh**, không tạo tồn. Thêm ảnh, thương hiệu, chứng nhận và xác minh theo chức năng tương ứng sau đó.

Mã xem trước chưa được giữ chỗ. Nếu dữ liệu thay đổi trước khi lưu, hệ thống yêu cầu kiểm tra lại. Không tự ghi đè sản phẩm đã tồn tại, không tự tạo loại/xuất xứ và không tự suy diễn chứng nhận.

## File cũ và đối chiếu

- Mẫu kỹ thuật cũ vẫn được backend nhận diện bằng tiêu đề nguyên bản. File cũ có nhiều trường hơn, vẫn giữ ý nghĩa các trường đó.
- Với Đơn mua/Phiếu nhập, nếu mã trong file khác lựa chọn trên giao diện, backend báo lỗi thay vì thay thế. Với file cũ có ngày giao/ghi chú, thông tin đã điền phải khớp lựa chọn tương ứng.
- Bổ sung loại sản phẩm hiện gửi lựa chọn trực tiếp lên backend. Frontend không cần mở/ghi lại workbook bằng ExcelJS hoặc sửa byte file để điền ID.
- Ngày Excel nhận `dd/MM/yyyy`, `dd-MM-yyyy`, `yyyy-MM-dd` hoặc ô ngày Excel. Ngày trên giao diện Admin vẫn theo `dd-mm-yyyy`.
- Không nhận công thức, macro, file mã hóa, file trên 5 MiB hoặc sai tiêu đề/cấu trúc. Những giới hạn kiểm tra an toàn file hiện có được giữ lại.
- Mẫu có danh sách chọn loại/xuất xứ và cảnh báo số âm trong Excel; backend vẫn kiểm tra lại vì Excel có thể bỏ qua validation khi dán dữ liệu.

## Khi đổi thông tin hoặc mất kết nối

- Đổi nhà cung cấp/ngày giao/ghi chú/loại chung làm hết hiệu lực kết quả cũ; file được giữ để bấm **Kiểm tra lại file**.
- Đổi đơn mua nguồn của Phiếu nhập bắt đầu phiên nhập mới; chọn file thuộc đúng đơn đó.
- Khi chưa nhận được kết quả nhập rõ ràng, giao diện khóa thông tin và dùng lại cùng khóa chống trùng. Không bấm tạo chứng từ thủ công để thay thế.
- Backend giữ transaction toàn bộ file, kiểm tra lại tham chiếu và khả năng nhận hàng, đối chiếu file + thông tin lựa chọn + kết quả đã chuẩn hóa. Khóa thử lại không được dùng với nhà cung cấp/đơn mua khác.
- SessionStorage chỉ giữ hash và khóa thử lại, không giữ file, ID lựa chọn hay nội dung ghi chú. Nếu đóng/mở lại, chọn lại đúng thông tin và file để khôi phục lần nhập đang chờ kết quả.

## Danh sách người dùng tự kiểm tra

1. Đơn mua: nhà cung cấp có sản phẩm → mẫu điền sẵn đúng hàng; chỉ điền 1 dòng → xem trước đúng 1 dòng; tạo đơn ở trạng thái chờ duyệt, chưa tăng tồn.
2. Đổi nhà cung cấp sau khi xem trước → phải kiểm tra lại; tải file của NCC A vào lựa chọn NCC B → báo lỗi.
3. Nhà cung cấp ngừng hoạt động/chưa liên kết hàng → thông báo tiếng Việt, không tạo đơn.
4. Phiếu nhập: chọn PO A, tải mẫu, đối chiếu mã đơn trong ThongTin; nhập ít/đủ/vượt số còn được nhận và các trường mã lô/HSD/lý do.
5. Dùng file của PO A khi chọn PO B → báo lỗi. Thay đổi số còn nhận ở phiên khác sau khi xem trước → phải kiểm tra lại, không nhập vượt.
6. Phiếu nháp không tăng tồn; sau gửi duyệt và duyệt mới tăng tồn. Đây là luồng nghiệp vụ đã có, cần DB đang hỗ trợ luồng đó.
7. Sản phẩm: một tên có 2 quy cách → một mã sản phẩm, hai SKU. Thử trùng quy cách/trùng tên có sẵn/mã vạch, số âm, giá 0, tên loại không tồn tại.
8. Loại trống → chọn loại chung hoặc chọn riêng sau xem trước; kiểm tra tên loại hiển thị và file gốc không bị sửa.
9. Thử mẫu cũ còn ID hợp lệ và các file mẫu AT281026; chọn NCC/loại tương ứng rồi xem trước, không tự đổi mã cũ sang mã tự sinh.
10. Khi có yêu cầu nhập đang chờ, thử lại cùng file/lựa chọn/khóa → nhận lại kết quả cũ, không tạo chứng từ thứ hai. Thay file hoặc context với cùng khóa → lỗi 409.

Chưa xác nhận các ca trên đã chạy thành công. Đây là hướng dẫn để người dùng tự thực hiện theo yêu cầu.

## Tệp chính

- Frontend: `src/components/admin/ExcelImportPanel.jsx`, `ExcelImportContextFields.jsx`, `ProductCategoryMapping.jsx`, `src/services/admin/fileService.js`.
- Backend: `ExcelImportController`, `ExcelImportContext`, `ExcelImportPreparation`, `ExcelFriendlyTemplateService`, `ExcelImportSchema`, `ExcelCodec`, `ExcelImportService`, `ImportViews`.
- Hợp đồng API chi tiết: `organic_backend/docs/EXCEL_IMPORT_CONTEXT_V2.md`.
