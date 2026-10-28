# Cập nhật vận hành Admin

Lưu ý: quy tắc mã và luồng giao nhiều đợt đã được cập nhật tiếp trong [ADMIN_PURCHASE_WORKFLOW_V2.md](ADMIN_PURCHASE_WORKFLOW_V2.md).

Phạm vi: frontend React hiện tại. Giữ nguyên endpoint, tên trường và quyền của API đang có trong `docs/api-contract.json`. Không thay đổi backend, cơ sở dữ liệu hoặc logic xác nhận thanh toán.

## Đã cập nhật

### Form và địa chỉ

- Dùng `AdminForm` để báo lỗi tiếng Việt khi nhập, khi rời trường và trước khi gửi. Những lỗi nghiệp vụ như trùng tên, thiếu lý do, chênh lệch số lượng được kiểm tra bổ sung.
- `SearchSelect` hỗ trợ tìm không dấu, chọn bằng bàn phím và chỉ chấp nhận giá trị đã chọn trong danh sách.
- Địa chỉ Nhà cung cấp, Xuất xứ và địa chỉ trong hồ sơ khách hàng dùng ba trường: Tỉnh / Thành phố, Xã / Phường / Thị trấn, Số nhà - Tên đường. Không có trường Quận/Huyện trên giao diện.
- Địa chỉ dạng chuỗi có sẵn không nhận diện được vẫn được giữ nguyên nếu chưa sửa; khi sửa phải chọn lại đủ địa chỉ.
- Ngày hiển thị và ngày nhập dùng `dd-mm-yyyy`; những trường cần giờ dùng `dd-mm-yyyy HH:mm`. Request vẫn gửi ISO `yyyy-mm-dd` hoặc `yyyy-mm-ddTHH:mm`, đúng hợp đồng API. Timestamp có múi giờ được hiển thị theo giờ Việt Nam; `LocalDateTime` không bị cộng múi giờ lần nữa.
- Thuật ngữ hiển thị “Biến thể” đã đổi thành “Sản phẩm”. Các khóa kỹ thuật `variantId`, `variants`, `variantName` giữ nguyên để không phá API.

### Sản phẩm

- Chọn loại sản phẩm trước, sau đó sinh mã dạng `MOC-RAUCU-<12 ký tự>`. Mã được giữ ổn định khi sửa hồ sơ.
- Ẩn mã sản phẩm/SKU ở danh sách thông thường; vẫn có trong form chi tiết và dữ liệu xuất khi cần đối chiếu.
- Kiểm tra trùng tên/mã trên danh sách đã tải và tải lại danh sách trước khi lưu. Backend tiếp tục kiểm tra mã/SKU. Kiểm tra tên ở frontend chưa thay thế được ràng buộc chống trùng đồng thời trong cơ sở dữ liệu.
- Nhập đơn vị đóng gói, trọng lượng/dung tích, đơn vị trọng lượng, giá bán, giá so sánh, mô tả, chứng nhận và thương hiệu.
- Bắt buộc chọn Nhà cung cấp và Xuất xứ thuộc Nhà cung cấp đó. Liên kết được lưu bằng quan hệ hiện có **Sản phẩm → Xuất xứ → Nhà cung cấp**, không gửi thêm `supplierId` ngoài hợp đồng tạo sản phẩm.
- “Giá nhập gần nhất” chỉ đọc từ dòng Đơn mua đã duyệt/đã nhận của đúng sản phẩm có quy cách. Giá nhập mới được nhập ở Đơn mua. Không có trường giá nhập cố định trong API sản phẩm hiện tại.
- Nút “Quy ước sản phẩm” cho phép đổi tiền tố mã, đơn vị, trọng lượng và kiểu đóng gói mặc định cho các form mở sau. Lưu trên **trình duyệt hiện tại**, không đồng bộ giữa máy/tài khoản và không sửa dữ liệu sản phẩm cũ.
- Sản phẩm mới được lưu nháp → lưu giá/quy cách → gắn xuất xứ → chuyển trạng thái yêu cầu. Nếu lỗi giữa chừng, giữ các ID đã nhận để lưu tiếp. Trường hợp mất phản hồi sau khi tạo hồ sơ mà chưa nhận được ID cần tải lại danh sách để đối chiếu; không tự tạo lại mù quáng.

### Đơn mua, Phiếu nhập, Duyệt

- Đơn mua dùng một dòng nhập nhanh phía trên; bấm **Thêm sản phẩm** để đưa xuống bảng chi tiết. Bảng có STT, đóng gói, trọng lượng, số lượng, giá nhập và thành tiền. Các cột số được căn phải; có thể sửa số lượng/giá trực tiếp trong bảng.
- Sản phẩm gợi ý được giới hạn theo Nhà cung cấp đã chọn. Ngày lập và Người lập dùng dữ liệu backend; với hồ sơ chưa lưu chỉ hiển thị ngày hiện tại và người đang thao tác.
- Phiếu nhập kiểm tra ngay số đạt/số loại, tổng vượt số đặt, lý do chênh lệch, mã lô trùng, mã lô thiếu, ngày sản xuất và hạn dùng. Chỉ cần khai báo lô cho lượng hàng đạt lớn hơn 0.
- Duyệt: ghi chú không bắt buộc. Từ chối: bắt buộc chọn lý do; chọn **Khác** phải nhập nội dung. Gửi lý do qua trường `note` sẵn có.
- Chi tiết hiển thị quyết định/ghi chú gần nhất từ backend. **Chưa có lịch sử nhiều lần từ chối** vì API không lưu và không trả dữ liệu đó; không mô phỏng lịch sử bằng localStorage.

### Đơn bán và Kho

- Bộ lọc Đơn bán: tìm nhanh mã/tên/sản phẩm/điện thoại/địa chỉ/ghi chú, trạng thái đơn, trạng thái thanh toán, người nhận/người lập nếu có, khoảng ngày, khoảng giá trị.
- Đơn mua/Phiếu nhập: thêm lọc Nhà cung cấp; Phiếu nhập đối chiếu nhà cung cấp qua `purchaseOrderId`.
- API chưa hỗ trợ toàn bộ các bộ lọc này ở server: frontend tải tất cả các trang với tham số hợp lệ, lọc rồi mới phân trang. Khi dữ liệu lớn cần backend hỗ trợ lọc trực tiếp để giảm tải. Danh sách đơn bán cập nhật nền mỗi 30 giây, chi tiết mỗi 5 giây khi đang mở.
- Đơn bán hiển thị ngày lập. Không lấy tên Người nhận hoặc Nhân viên phụ trách để giả làm Người lập khi response chưa có thông tin tác giả.
- Dòng Đơn bán có cột đơn vị/đóng gói và chỗ hiển thị trọng lượng. Nếu API chưa cung cấp `netQuantity`/`unitId`, hiển thị **Chưa công bố**, không suy đoán từ tên sản phẩm.
- Kho dùng một bảng sản phẩm thống nhất; **Xem lô** mở bảng lô và chi tiết lô. Nút **Số lượng** chỉnh **ngưỡng cảnh báo nhập thêm** qua API `reorder-level`; không thay đổi số tồn thực tế. Số tồn vẫn đi qua nghiệp vụ nhập/xuất kho.

## API được dùng

Các đường dẫn dưới đây có tiền tố `/api/v1`. Không thêm các trường truy vấn mới khi backend chưa hỗ trợ.

| Nghiệp vụ | API hiện có | Input chính | Output được dùng |
|---|---|---|---|
| Hồ sơ sản phẩm | `GET/POST /admin/products`, `GET/PUT /admin/products/{id}` | `productCode`, `productName`, `categoryId`, `slug`, trạng thái, mô tả, thương hiệu, chứng nhận | ID, thông tin sản phẩm, `variants`, `images` |
| Giá/đóng gói | `POST/PUT /admin/products/{productId}/variants[/{id}]` | `sku`, `variantName`, `netQuantity`, `unitId`, `sellingPrice`, `compareAtPrice`, `reorderLevel`, trạng thái | ID và thông tin sản phẩm có quy cách |
| Nguồn cung | `GET /origins?supplierId={id}`, `GET /origins/{id}/products`, `GET /products/{id}/traceability`, `PUT /products/{id}/origin` | Phân trang; khi gắn xuất xứ gửi `{originId}` | Sản phẩm thuộc nhà cung cấp, xuất xứ và nhà cung cấp liên kết |
| Đơn mua | `GET/POST /purchase-orders`, `GET/PUT /purchase-orders/{id}` | Bộ lọc server: `status`, `supplierId`, `page`, `size`; ghi: `supplierId`, `expectedDeliveryDate`, `note`, `items[{variantId,quantity,unitPrice}]` | Đơn, chi tiết, người/ngày lập, người/ngày duyệt, ghi chú gần nhất |
| Phiếu nhập | `GET/POST /goods-receipts`, `GET/PUT /goods-receipts/{id}` | Bộ lọc server: `status`, `purchaseOrderId`, `page`, `size`; ghi: đơn mua, ghi chú, chi tiết số đạt/loại, lý do, lô, NSX/HSD | Phiếu, các dòng, lô, người/ngày lập, quyết định gần nhất |
| Quyết định | `POST /purchase-orders/{id}/{approve,reject,cancel}`, `POST /goods-receipts/{id}/{approve,reject}`, `POST /goods-receipts/{id}/submit` | `{note}`; duyệt cho phép `null`; submit không có body | Chứng từ và trạng thái do server xác nhận |
| Đơn bán | `GET /management/orders`, `GET /management/orders/{id}` | `page`, `size` cho danh sách | Đơn, `pricing`, người nhận, thanh toán, giao hàng, ngày lập |
| Kho/lô | `GET /inventory/variants`, `GET /inventory/variants/{id}`, `GET /product-batches`, `GET /product-batches/{id}` | Kho: `search`, `lowStock`, `page`, `size`; lô: `variantId`, `expired`, `page`, `size` | Sản phẩm, trọng lượng, số có thể bán, ngưỡng; lô và số giữ chỗ |
| Ngưỡng cảnh báo | `PATCH /inventory/variants/{id}/reorder-level` | `{reorderLevel}` | Tồn và ngưỡng mới; không ghi đè tồn thực tế |
| Địa chỉ khách hàng | API địa chỉ đã có trong `profileService` | Người nhận, điện thoại, `province`, `ward`, `streetAddress`, `district` tương thích dữ liệu cũ nếu xác định được | Địa chỉ đã lưu |

## Backend cần bổ sung để hoàn thiện các yêu cầu còn lại

Đây là đề xuất bàn giao; frontend **chưa gọi** endpoint hoặc trường mới nào ngoài hợp đồng hiện tại.

| Ưu tiên | Phần cần bổ sung | Lý do / dữ liệu cần trả |
|---|---|---|
| Cao | Lịch sử quyết định bất biến cho Đơn mua và Phiếu nhập | Mỗi lần duyệt/từ chối/hủy: hành động, mã lý do, nội dung, người thao tác, thời gian, trạng thái trước/sau. Không xóa lịch sử khi sửa hoặc gửi duyệt lại. Cần API đọc lịch sử theo chứng từ. |
| Cao | Người lập và khách hàng của Đơn bán | Trả ID/tên người hoặc tài khoản tạo đơn; phân biệt với người nhận và nhân viên phụ trách. Thêm định danh khách hàng để lọc đúng chủ đơn. |
| Cao | Chống trùng tên sản phẩm và cấp mã tại server | Ràng buộc tên chuẩn hóa thống nhất và mã duy nhất ở tầng lưu trữ; trả lỗi rõ ràng khi hai người tạo đồng thời. Frontend không thể bảo đảm tính duy nhất xuyên các phiên làm việc. |
| Cao | Hỗ trợ lưu địa chỉ hai cấp | Bỏ bắt buộc `district` trên DTO/validation và xử lý dữ liệu cũ. Hiện frontend chỉ gửi địa danh lịch sử khi ánh xạ có một kết quả hoặc giữ được địa chỉ cũ tương ứng; trường hợp không xác định được sẽ báo lỗi thay vì gửi dữ liệu giả. |
| Trung bình | Snapshot đơn vị/trọng lượng trên dòng Đơn bán | Thêm tên đơn vị đóng gói, `netQuantity`, `unitId` vào dòng quote/order. Snapshot cần giữ đúng thông tin lúc mua, kể cả sản phẩm thay đổi sau này. |
| Trung bình | Giá nhập mặc định trên sản phẩm nếu nghiệp vụ cần | Bổ sung trường trên DTO tạo/sửa/đọc, quy định rõ khác biệt với giá nhập thực tế theo từng Đơn mua. Hiện chỉ có `unitPrice` ở dòng Đơn mua. |
| Trung bình | Quy ước sản phẩm dùng chung hệ thống | API cấu hình, kiểm tra giá trị hợp lệ, phân quyền sửa, lưu vết thay đổi. Hiện các mặc định chỉ lưu cục bộ trên trình duyệt. |
| Trung bình | Bộ lọc server tương ứng các trường trên UI | Hỗ trợ từ khóa, khoảng ngày/giá, tác giả/khách hàng, thanh toán; Phiếu nhập thêm nhà cung cấp. Trả tổng bản ghi sau lọc cùng phân trang. |
| Theo nhu cầu | Điều chỉnh tồn thực tế | Nếu cần sửa tồn ngoài luồng nhập/xuất, bổ sung phiếu điều chỉnh có lý do, người lập và nhật ký; không dùng `reorder-level` để sửa tồn. |

## Kiểm chứng

- `pnpm test`: 355/355 kiểm thử, 30 tệp, đã đạt. Bao gồm kiểm tra hợp đồng API, transport HTTP hiện có và các ca mới cho ngày tháng, lọc trước phân trang, lý do từ chối, lô, mã sản phẩm, địa chỉ và khôi phục luồng lưu nhiều bước.
- Kiểm tra render HTML cho các component form, combobox, địa chỉ ba trường và bảng chi tiết đơn bán đã đạt.
- `pnpm build`: đã đạt. Còn cảnh báo kích thước chunk chính lớn hơn 500 kB.
- Chưa kiểm tra tương tác/hình ảnh trong trình duyệt: công cụ trình duyệt của phiên làm việc đang bị tắt trong Work settings. Chưa thực hiện tạo/duyệt chứng từ thật trên backend.

### Checklist kiểm tra với dữ liệu thật

1. Thêm sản phẩm: chọn loại → kiểm tra mã → chọn nhà cung cấp/xuất xứ → nhập quy cách/giá → lưu; thử tên trùng, sai giá/khối lượng và mạng lỗi giữa các bước.
2. Lập Đơn mua với hai sản phẩm: thêm bằng dòng nhanh, sửa số lượng/giá trong bảng, kiểm tra tổng; thử số lượng 0, âm, giá trống và ngày giao quá khứ.
3. Duyệt không nhập ghi chú; từ chối bằng lý do có sẵn; chọn Khác và để trống để kiểm tra chặn gửi. Sửa rồi gửi lại để thấy giới hạn ghi chú gần nhất của API hiện tại.
4. Lập Phiếu nhập: thử mã lô trùng, số đạt + số loại vượt số đặt, thiếu lý do chênh lệch, NSX tương lai, HSD quá khứ. Lưu nháp chưa cộng tồn; duyệt mới cộng hàng đạt.
5. Thử lọc các chứng từ nằm ngoài trang đầu: nhà cung cấp, từ khóa sản phẩm, người lập, khoảng ngày và khoảng giá.
6. Mở Kho → Xem lô → Chi tiết; đổi Số lượng cảnh báo và xác nhận số tồn thực tế không bị ghi đè.
7. Kiểm tra địa chỉ ba trường trên desktop/mobile; với địa danh không ánh xạ được API cũ phải báo lỗi, không phát sinh trường Quận/Huyện.

## Sửa lỗi 404 khi chọn Nhà cung cấp

Form Đơn mua trước đó gọi nhầm `/suppliers/{id}/products` (không tồn tại trong tài liệu và controller). Đã thay bằng tải đủ trang `GET /origins` với `supplierId`, sau đó lấy đủ trang `GET /origins/{id}/products`, gộp và loại trùng theo ID sản phẩm. Không bỏ ràng buộc nhà cung cấp và không đổi backend. Có kiểm thử đối chiếu mọi đường dẫn/tham số của luồng mới với hợp đồng API.
