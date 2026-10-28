# Bộ 16 biểu mẫu theo PDF tham chiếu

Cập nhật ngày 28-10-2026. Phạm vi: giao diện xem trước/in/lưu PDF phía frontend, không thay đổi nghiệp vụ backend.

Nguồn: `C:\Users\Trong Vi\Downloads\Bieu_mau_Organicfood_Trang_19_36.pdf`, 19 trang tài liệu chứa 16 ảnh biểu mẫu. Đã trích xuất và xem đủ các ảnh để đối chiếu tên phiếu, các mục, bảng, lựa chọn và vai trò ký. **Không đưa ảnh chụp biểu mẫu vào trang in**, vì ảnh gốc có con dấu đỏ và dữ liệu cần điền theo từng chứng từ. Nội dung được dựng lại bằng React.

## Mở ở đâu

- Sidebar Admin → **Biểu mẫu & bản in** (`/admin/business-forms`). Danh mục đủ 16 mẫu, chia theo 6 nhóm nghiệp vụ.
- **Đơn mua → Chi tiết → Xem trước bản in A4**: chọn Phiếu đề nghị hoặc PO.
- **Phiếu nhập → Chi tiết → Xem trước bản in A4**: chọn Phiếu nhập kho, Phiếu kiểm nhận, Biên bản hàng không đạt.
- **Đơn bán & Giao hàng → Chi tiết → Biểu mẫu bán hàng / giao hàng**: giữ đơn nguồn khi chuyển giữa 5 mẫu bán/giao hàng.
- **Tồn kho/Lô → Biểu mẫu thẻ kho / kiểm kê / xử lý hàng**; trong chi tiết lô có **In biểu mẫu của lô này**.
- Các mẫu sau bán lấy dữ liệu qua API GET phản hồi/đổi trả/nhận hàng trả ở trang Biểu mẫu & bản in. Chưa có màn hình vận hành hậu mãi riêng trong frontend; trang này chỉ đọc để tạo bản in, không thực hiện duyệt/hoàn tiền/nhập lại kho.

Chọn dữ liệu nguồn bằng ô tìm kiếm hoặc dùng **Mẫu trống** để điền tay. Nếu có nhiều chuyến giao trên một đơn, phải chọn chuyến cần in; không tự lấy chuyến mới nhất.

## Các mẫu và chức năng tương ứng

| Mã | Biểu mẫu | Màn hình/nguồn dữ liệu | Giấy |
|---|---|---|---|
| BM-NV01-01 | Phiếu đề nghị nhập hàng | Đơn mua, bản đề nghị minh họa từ danh sách hàng | A4 dọc |
| BM-NV01-02 | Đơn đặt hàng - Purchase Order | Đơn mua | A4 dọc |
| BM-NV02-01 | Phiếu kiểm nhận hàng | Phiếu nhập + đơn mua liên quan | A4 ngang |
| BM-NV02-02 | Phiếu nhập kho | Phiếu nhập + nhà cung cấp/đơn mua | A4 ngang |
| BM-NV02-03 | Biên bản ghi nhận hàng không đạt | Dòng bị loại trong Phiếu nhập | A4 dọc |
| BM-NV03-01 | Thẻ kho | Lô hàng; thông tin sản phẩm/lô | A4 dọc |
| BM-NV03-02 | Phiếu kiểm kê hàng hóa trong kho | Lô được chọn; số trên sổ hiện tại | A4 ngang |
| BM-NV03-03 | Phiếu xử lý hàng cận hạn/hư hỏng | Lô được chọn | A4 ngang |
| BM-NV04-01 | Phiếu bán hàng | Đơn bán + bảng giá đã lưu | A4 dọc |
| BM-NV04-02 | Phiếu xác nhận đơn hàng | Đơn bán | A4 dọc |
| BM-NV05-01 | Phiếu xuất hàng | Đơn bán; không tự suy ra lô xuất | A4 ngang |
| BM-NV05-02 | Phiếu giao hàng | Đơn bán + chuyến giao đã chọn | A4 dọc |
| BM-NV05-03 | Phiếu ghi nhận giao hàng không thành công | Đơn bán + chuyến giao thất bại | A4 dọc |
| BM-NV06-01 | Phiếu tiếp nhận phản hồi/yêu cầu sau bán | API phản hồi khách hàng | A4 dọc |
| BM-NV06-02 | Phiếu xử lý đổi trả/hoàn tiền | API phương án đổi trả | A4 dọc |
| BM-NV06-03 | Phiếu kiểm tra và xử lý hàng trả lại | API yêu cầu thu hồi + các lần nhận thực tế | A4 ngang |

Ảnh Phiếu bán hàng không in mã BM ở header; frontend dùng BM-NV04-01 để thống nhất với nhóm NV04 và mẫu xác nhận NV04-02. Thứ tự chữ ký PO giữ lựa chọn đã chốt: Người lập → Đại diện NCC → Người xác nhận bên đặt cuối cùng. Mọi vùng ký/đóng dấu đều không có hình con dấu tạo sẵn.

## Thiết kế và font mới

- Noto Sans thường và đậm hỗ trợ tiếng Việt, tự lưu ở `public/fonts/noto-sans/`, giấy phép OFL đi kèm. Dùng font này thay Times New Roman cho nội dung biểu mẫu, không phụ thuộc tải Google Fonts hoặc font đã cài trên máy.
- Giữ tông xanh kem `#F7FAF5`, chữ xanh đậm `#1B4D2E`, thanh mục `#DCEAD6`, lưới `#689F75` và các khối trắng.
- Cải thiện độ đậm, cỡ chữ tiêu đề, khoảng cách dòng và khoảng trống giữa các khối. Các mẫu nhiều cột dùng A4 ngang như ảnh gốc.
- Bảng có đủ lưới, số căn phải và phân cách hàng nghìn. Ngày dd/mm/yyyy. Dòng chấm thay cho input trên bản in.
- Mẫu mới có tối thiểu 6 dòng trống/dữ liệu, hai mẫu UC01 và biên bản hàng không đạt dùng 8 dòng; Thẻ kho có 14 dòng để giữ bố cục sổ. Không cắt bớt khi có nhiều dữ liệu hơn; bảng tự nối trang và lặp tiêu đề cột.
- Giữ phần chữ ký trống để ký và đóng dấu thủ công. Không có component/CSS tạo dấu đỏ; không dùng ảnh gốc chứa dấu.

Chọn **In biểu mẫu** hoặc **Lưu PDF → Save as PDF**. Giấy A4 đúng hướng được thiết lập qua named `@page`; bật Background graphics để giữ nền, tắt header/footer mặc định trình duyệt. Sidebar/navbar/modal ngoài trang in bị ẩn. PDF tải từ API backend hiện có vẫn dùng template phía backend, chưa tự đổi theo bộ React này.

## Dữ liệu và ràng buộc

Tất cả thao tác mới với backend là GET, dùng Axios/JWT và đúng các endpoint đang có:

- Procurement: `/purchase-orders`, `/goods-receipts`, `/product-batches`, các API chi tiết hiện hành.
- Mã sản phẩm: `/products/{id}/traceability`; không dùng SKU giả làm Mã SP.
- Nhà cung cấp: `/suppliers/{id}`.
- Đơn bán: `/management/orders` và chi tiết.
- Phản hồi: `/management/feedbacks` và `/{id}`.
- Đổi trả: `/management/return-requests` và `/{id}`.
- Nhận hàng trả: `/management/return-receipts/requests?pendingOnly=false`, `/{id}`, `/{id}/items` đủ trang.

Các API bị giới hạn theo vai trò: kho không tự gọi dữ liệu feedback/đổi trả của bán hàng; bán hàng không tự gọi số lô kho. Vai trò không đọc được nguồn vẫn xem/in mẫu giấy trống. Backend tiếp tục là nơi kiểm tra quyền cuối cùng.

Thông tin chưa có được để trống, không đoán giá trị:

- Phiếu đề nghị/kiểm nhận/biên bản không đạt chưa có số phiếu/ngày lập độc lập: không lấy số Phiếu nhập hay PO làm số chứng từ khác.
- Tồn trên sổ lô không phải số kiểm đếm thực tế. Chưa có API kiểm kê và lịch sử nhập/xuất nên Thẻ kho không tự bịa các dòng biến động; cột kiểm đếm/chênh lệch và kết quả xử lý để trống. Chọn một lô chỉ in dữ liệu của lô đó, không trình bày thành đã kiểm kê toàn kho.
- Phiếu kiểm nhận tách SL đặt / thực nhận / đạt / không đạt; thực nhận = đạt + loại, không cộng phần thiếu. Biên bản không đạt chỉ lấy dòng có số bị loại > 0.
- Bảng nhập kho lấy tiền hàng đạt từ backend, không tự cộng thuế/phí. Phiếu nguồn nháp/chờ duyệt được ghi trạng thái trong ghi chú; in phiếu không tăng tồn.
- Đơn bán giữ subtotal/giảm/tổng theo snapshot backend. Chỉ status paid mới ghi tiền đã thanh toán. Pending/requires_review không tự đổi thành đã trả tiền. Phân biệt người mua và người nhận khi API chỉ có người nhận.
- Không lấy mã vận đơn làm số phiếu giao độc lập. Không suy ra số thực xuất/thực giao, lô xuất hoặc số hàng mang về từ số đặt. Chuyến thất bại không tự xác nhận đã nhập hàng trả vào kho.
- Không coi phương án hoàn tiền được duyệt là đã hoàn tiền; ngày/kết quả chuyển tiền thực tế để trống. Phản hồi không mặc định mọi sản phẩm trong đơn đều bị khiếu nại.
- Nhận hàng trả dùng số đã nhận/nhập lại/đang giữ/đã loại thật từ API; không giả người ký, ngày xử lý hoặc kết quả kiểm định chưa có.

## Mã nguồn

- `src/constants/businessForms.js`: danh mục, cấu trúc mục/cột/lựa chọn/vai trò ký của 16 mẫu.
- `src/components/print/BusinessFormDocument.jsx`: renderer dùng chung; tái sử dụng hai mẫu UC01.
- `src/components/print/PrintFormLayout.jsx`, `PrintFormPrimitives.jsx`, `print-forms.css`: giấy A4, font, dòng chấm, bảng, chữ ký, print isolation.
- `src/pages/admin/BusinessFormsPage.jsx`: danh mục và chọn chứng từ.
- `src/components/print/BusinessFormPreview.jsx`: chọn mẫu trong chi tiết chứng từ.
- `src/lib/businessFormData.js`: ánh xạ dữ liệu theo nghiệp vụ.
- `src/services/admin/businessFormService.js`: GET danh sách/chi tiết và nguồn hậu mãi.

## Kiểm chứng và giới hạn

Đã đối chiếu trực quan đủ 16 ảnh nguồn và kiểm tra ký tự tiếng Việt trong cả hai tệp font. Kiểm thử DOM/SSR kiểm tra đủ 16 mẫu, 6 hướng ngang, số cột theo từng nghiệp vụ, dòng trắng, ô tick, số/ngày, không có con dấu; kiểm tra ánh xạ dữ liệu để không giả kết quả tiền/kho và quyền đọc nguồn theo vai trò.

Không tạo/duyệt đơn, điều chỉnh tồn, thực hiện hoàn tiền hoặc sửa backend khi kiểm thử. Trình duyệt tự động hiện bị tắt trong Work settings nên chưa thể kiểm tra ảnh chụp giao diện mới/phân trang bằng trình duyệt thật. Cần kiểm tra một phiếu ngắn và phiếu dài trên trình duyệt/máy in sử dụng thực tế. Tài liệu nguồn và ảnh trích xuất chỉ để tham chiếu, không được đóng gói vào ứng dụng.

Kết quả kiểm tra: **471/471 tests, 45 tệp đạt**, `pnpm build` thành công. Cảnh báo chunk chính >500 kB đã có từ trước vẫn còn; hai font chỉ tải khi giao diện dùng chúng.
