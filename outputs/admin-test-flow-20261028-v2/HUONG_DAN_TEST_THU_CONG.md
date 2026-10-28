# Hướng dẫn thực hành thủ công: từ nhà sản xuất đến bán hàng

Ngày chuẩn bị: **28-10-2026**. Bộ dữ liệu: **AT281026**.

**Bản v2:** đã sửa kiểu lưu ngày Excel trong các file Đơn mua/Phiếu nhập. Dùng các file trong thư mục v2 khi nhập. Các ô vàng vẫn cần dữ liệu thực của hệ thống: mã NCC trong file 02, mã PO trong file 03. File 01 có thể chọn loại ngay tại giao diện Nhập Excel → **Bổ sung loại & kiểm tra lại file**, thay cho việc tự điền UUID categoryId. Xem thêm [hướng dẫn sửa Excel và nhà cung cấp](HUONG_DAN_SUA_EXCEL_VA_NHA_CUNG_CAP.md).

Đây là dữ liệu và kết quả **mong đợi để bạn tự đối chiếu**, chưa phải biên bản kiểm thử đạt. Người dùng tự đăng nhập, nhập Excel, gọi API nếu cần và ghi kết quả thực tế. Bộ tài liệu không tự nạp dữ liệu vào hệ thống.

## 1. Chuẩn bị trước khi thao tác

1. Khởi động PostgreSQL, Redis và backend theo cấu hình dự án của bạn; mở frontend bằng lệnh phát triển đang dùng.
2. Với chức năng nhập nhiều đợt/Đóng đơn mua vừa bổ sung: đọc tài liệu triển khai backend `docs/PURCHASE_PARTIAL_RECEIPTS.md`, sao lưu dữ liệu, **dừng tất cả instance backend** kết nối database này rồi **tự áp dụng** SQL `scripts/sql/20261028_purchase_order_partial_receipts.sql` theo tài liệu. Chỉ khởi động lại phiên bản backend mới khi migration đã hoàn tất. Không bỏ qua migration trên cơ sở dữ liệu đã tồn tại.
3. Xác nhận frontend đang kết nối backend thật. Địa chỉ frontend có thể là `http://localhost:5173` hoặc cổng Vite thực tế; API gốc của backend trong ví dụ là `http://localhost:8088/api/v1`.
4. Dùng tài khoản có đúng vai trò. Nếu dự án đã bật dữ liệu tài khoản mẫu và mật khẩu chưa được đổi, có thể dùng các tài khoản dưới đây. Nếu chưa có, nhờ Admin tạo theo quy trình hiện tại; tài liệu không tự tạo tài khoản.

| Tài khoản mẫu | Vai trò | Công việc trong bài thực hành |
|---|---|---|
| `admin` | `ADMIN` | Tạo loại sản phẩm; duyệt/từ chối đơn mua và phiếu nhập; kiểm tra tổng quan |
| `warehouse` | `WAREHOUSE_STAFF` | Nhà sản xuất/nhà cung cấp, xuất xứ, sản phẩm, lập đơn mua và phiếu nhập, kho |
| `sales` | `SALES_STAFF` | Khuyến mãi, đơn bán, vận chuyển, thu và đối soát COD |
| `customer` | `CUSTOMER` | Mua hàng, xem lịch sử/chi tiết đơn, hủy đơn hợp lệ, kiểm tra điểm |

Mật khẩu fixture ban đầu của cả bốn tài khoản: `Organic@123`. Mật khẩu hiện tại có thể đã được thay đổi; việc bật seed không nhất thiết đặt lại mật khẩu của tài khoản đã tồn tại.

Nên dùng cửa sổ trình duyệt riêng cho từng vai trò để tránh nhầm phiên. Ghi lại số điểm ban đầu của khách là **P0**. Chỉ chọn sản phẩm AT281026 khi đặt đơn mẫu để tránh thay đổi số liệu của giỏ hàng đang có.

### Các tệp trong bộ dữ liệu

| Tệp | Dùng ở đâu | Phần cần tự điền trước khi nhập |
|---|---|---|
| `01-san-pham.xlsx` | Sản phẩm → Nhập Excel | `categoryId` và `originId` ở các ô màu vàng |
| `02-don-mua-nha-san-xuat.xlsx` | Kho vận & Mua hàng → Đơn mua & Duyệt đơn → Lập đơn mua → Nhập từ Excel | Mã nhà cung cấp thực tế trong toàn bộ cột `supplierCode` |
| `03-phieu-nhap-nha-san-xuat.xlsx` | Phiếu nhập & Duyệt nhập → Lập phiếu nhập → Nhập từ Excel | Mã PO vừa tạo/duyệt trong toàn bộ cột `purchaseOrderCode` |
| `04-don-mua-du-lieu-loi.xlsx` | Màn hình xem trước nhập Excel đơn mua | Điền mã NCC trước; giữ số lượng âm/giá âm để kiểm tra cảnh báo |
| `du-lieu-test-api.json` | Tài liệu tham chiếu hoặc Bruno do bạn tự thao tác | Thay mọi `{{...}}` bằng ID/mã thật, chỉ sao chép `body` của request cần dùng |

Các workbook có sheet **Data**, hàng đầu là tên cột theo hợp đồng backend. Không đổi tên, thứ tự hoặc thêm cột vào sheet Data; không thêm công thức, gộp ô hay macro. Dữ liệu tiền/số lượng là số; mã là chuỗi; ngày trong file là `yyyy-MM-dd` để nhập API. Giao diện Admin hiển thị `dd-mm-yyyy`; biểu mẫu in có thể dùng `dd/mm/yyyy`.

Nếu chạy lại trên cùng cơ sở dữ liệu, dùng tiền tố mới và sửa đồng bộ tên sản phẩm, mã sản phẩm, slug, SKU, mã lô và mã khuyến mãi. Không nhập lại bộ AT281026 để mong hệ thống tự ghi đè dữ liệu cũ. Các ngày mẫu dựa trên 28-10-2026: giao dự kiến **29-10-2026**, sản xuất **27-10-2026**, hạn dùng **26-04-2027**. Điều chỉnh khi thực hành ở thời điểm khác.

## 2. Danh mục, nhà sản xuất và liên kết nguồn gốc

### Bước 1 — Tạo loại sản phẩm bằng Admin

Vào **Sản phẩm → Loại sản phẩm** (`/admin/categories`). Tạo hoặc dùng loại đang hoạt động: **Rau củ**, **Trái cây**, **Thực phẩm khô**. Không cần tạo trùng loại đã có.

### Bước 2 — Tạo nhà sản xuất trong Nhà cung cấp

Đăng nhập Kho hoặc Admin, vào **Kho vận & Mua hàng → Nhà cung cấp** (`/admin/suppliers`).

- Tên: **AT281026 - Nhà sản xuất nông sản mẫu**.
- Trạng thái: **Hoạt động**.
- Địa chỉ mẫu: **36 Trịnh Đình Trọng, Phường Tân Phú, Thành phố Hồ Chí Minh**; nhập qua ba trường Tỉnh/Thành phố, Phường/Xã, Số nhà - Tên đường theo giao diện.
- Các trường không bắt buộc có thể để trống. Nếu cần điện thoại mẫu, dùng `0344855913`.
- Để hệ thống sinh mã NCC; mở chi tiết và ghi lại **mã nghiệp vụ thực tế**. Không tự đoán NCC01/NCC02.

Hiện nhà sản xuất được quản lý bằng bản ghi **Nhà cung cấp**, không có một module nhà sản xuất riêng. Tên/mã NCC dùng để nhận diện trên giao diện; ID kỹ thuật chỉ dùng khi API hoặc file nhập yêu cầu.

### Bước 3 — Tạo Xuất xứ gắn đúng nhà sản xuất

Vào **Nguồn gốc & Minh bạch → Xuất xứ** (`/admin/origins`).

| Trường | Giá trị mẫu |
|---|---|
| Mã xuất xứ | `AT281026-XX` |
| Tên xuất xứ | `AT281026 - Vùng sản xuất mẫu` |
| Quốc gia / mã | Việt Nam / `VN` |
| Vùng sản xuất | Vùng sản xuất giả lập |
| Cơ sở sản xuất | AT281026 - Nhà sản xuất nông sản mẫu |
| Nhà cung cấp | Chọn bản ghi vừa tạo ở bước 2 |
| Trạng thái | Hoạt động |
| Mô tả | Thông tin giả lập phục vụ thực hành, không phải công bố nguồn gốc thực tế |

Liên kết cần có: **Nhà cung cấp → Xuất xứ → Sản phẩm → SKU/quy cách**. Chỉ đặt tên sản phẩm giống tên nhà cung cấp chưa tạo ra liên kết này. Đây là điều kiện quan trọng để sản phẩm xuất hiện khi chọn NCC trong form đơn mua.

### Bước 4 — Điền và nhập Excel sản phẩm

1. Sau khi đã có loại sản phẩm và xuất xứ, vào **Sản phẩm → Nhập Excel**, tải **mẫu Excel mới từ backend**.
2. Trong các sheet tra cứu của mẫu vừa tải, lấy UUID loại từ **Categories**, UUID xuất xứ vừa tạo từ **Origins**. Đây là những cột ID mà file nhập yêu cầu; giao diện danh sách vẫn dùng tên/mã dễ đọc.
3. Mở `01-san-pham.xlsx`. Điền `categoryId` tương ứng cho năm dòng: cà rốt hai dòng thuộc Rau củ; táo thuộc Trái cây; gạo và yến mạch thuộc Thực phẩm khô. Điền cùng `originId` vừa lấy vào cả năm dòng.
4. Hai dòng cà rốt phải giữ cùng mã/tên/slug/categoryId để tạo một sản phẩm có hai quy cách. Không đổi riêng một trong hai dòng.
5. Để `brandId`, `certificationIds`, `imageUrl`, `barcode` trống nếu chưa có dữ liệu thật. Sau nhập có thể bổ sung ảnh bằng màn hình **Sản phẩm / ảnh**.
6. Chọn file, **Xem trước**, đọc lỗi/cảnh báo rồi mới bấm nhập. Lấy các ID sản phẩm/SKU thực tế từ chi tiết hoặc response nếu cần thao tác Bruno.
7. Vào **Truy xuất sản phẩm**, kiểm tra xuất xứ đã gắn đúng nhà sản xuất. Nếu file chưa gắn được, thực hiện gắn tại đây trước khi lập đơn mua.

| SKU trong file | Sản phẩm / quy cách | Giá bán | Giá nhập | Số lượng đặt |
|---|---|---:|---:|---:|
| `AT281026-CR500` | Cà rốt hữu cơ — Gói 500 g | 28.000 đ | 12.000 đ | 100 |
| `AT281026-CR1K` | Cà rốt hữu cơ — Gói 1 kg | 50.000 đ | 23.000 đ | 50 |
| `AT281026-TAO1K` | Táo hữu cơ — Hộp 1 kg | 120.000 đ | 65.000 đ | 40 |
| `AT281026-GAO1K` | Gạo lứt — Túi 1 kg | 45.000 đ | 23.000 đ | 30 |
| `AT281026-YM500` | Yến mạch — Gói 500 g | 60.000 đ | 32.000 đ | 20 |

Kết quả cần đối chiếu: **4 sản phẩm, 5 SKU**, đang hoạt động; trạng thái khai báo organic **Chờ xác minh (`pending`)**. Giá so sánh trong file bằng giá bán + 10.000 đ. Nhập sản phẩm **chưa tạo tồn kho**; trước khi nhập hàng, không được coi năm SKU này đã có số lượng bán được.

Nếu nhập tay thay cho Excel và giao diện sinh mã/SKU khác, dùng mã thực tế đó trong file PO/GR; không dùng đồng thời hai cách để tạo trùng sản phẩm.

### Chứng nhận — thực hành bổ sung

Tạo chứng nhận mẫu ở tab Chứng nhận; nhập tổ chức cấp, số, ngày cấp/hết hạn phù hợp. Đính kèm tài liệu của bạn trước khi Admin chọn xác minh. Chỉ gắn chứng nhận vào sản phẩm khi dữ liệu đã sẵn sàng. Nếu không có tài liệu, giữ **Chờ xác minh** và đánh dấu tình huống xác minh là chưa thực hiện; không tự công bố sản phẩm mẫu đạt USDA/EU/VietGAP.

## 3. Đặt hàng nhà sản xuất và duyệt đơn mua

1. Điền mã NCC thực tế vào **A2:A6** của `02-don-mua-nha-san-xuat.xlsx`.
2. Vào **Kho vận & Mua hàng → Đơn mua & Duyệt đơn** (`/admin/purchase-orders`) → **Lập đơn mua → Nhập từ Excel**.
3. Xem trước: đúng NCC, năm SKU, ngày giao dự kiến và giá nhập. Tổng số lượng **240 gói/hộp**; tổng đơn **6.280.000 đ**.
4. Nhập file và ghi lại `orderCode`/số PO thực tế. Trạng thái ban đầu **Chờ duyệt (`pending_approval`)**; tồn kho vẫn bằng 0.
5. Chuyển Admin, mở đơn và **Duyệt**. Có thể để ghi chú trống. Trạng thái thành **Đã duyệt (`approved`)**; tồn kho vẫn bằng 0.
6. Đối chiếu tên người lập, ngày lập và ngày giao dự kiến; mở xem trước/in PO. Bản in không có con dấu đỏ tạo sẵn.

Nếu dropdown không tìm thấy sản phẩm: kiểm tra SKU/sản phẩm hoạt động, xuất xứ gắn nhà cung cấp đúng, loại sản phẩm đúng và danh sách đã được tải lại. Nếu Excel báo mã không tồn tại, kiểm tra mã nghiệp vụ/SKU thật; không thay bằng ID tùy ý.

## 4. Nhập hàng đợt 1, duyệt và kiểm tra tồn kho

1. Điền số PO vừa duyệt vào **A2:A6** của `03-phieu-nhap-nha-san-xuat.xlsx`.
2. Vào **Phiếu nhập & Duyệt nhập** (`/admin/goods-receipts`) → **Lập phiếu nhập → Nhập từ Excel**. Chọn đúng PO nếu cần tải mẫu hoặc đối chiếu đơn.
3. Xem trước và đối chiếu bảng dưới; giải thích chênh lệch cà rốt: **“3 gói hỏng, thiếu 2 gói; đối chiếu với nhà sản xuất”**.
4. Lưu phiếu nháp. Sau đó **Gửi duyệt** bằng Kho. Cả bản nháp và chờ duyệt đều **chưa tăng tồn kho**.
5. Đăng nhập Admin, mở phiếu và **Duyệt**; không bắt buộc lý do khi duyệt. Phiếu thành **Đã nhập kho (`confirmed`)** và chỉ số lượng **đạt** được cộng tồn.

| SKU | Đặt | Đạt đợt 1 | Bị loại đợt 1 | Thiếu trong chuyến đợt 1 | Còn nghĩa vụ giao đạt của PO |
|---|---:|---:|---:|---:|---:|
| CR500 | 100 | 95 | 3 | 2 | 5 |
| CR1K | 50 | 50 | 0 | 0 | 0 |
| TAO1K | 40 | 40 | 0 | 0 | 0 |
| GAO1K | 30 | 30 | 0 | 0 | 0 |
| YM500 | 20 | 20 | 0 | 0 | 0 |
| **Tổng** | **240** | **235** | **3** | **2** | **5** |

Mã lô trong file: `AT281026-LO-CR500`, `AT281026-LO-CR1K`, `AT281026-LO-TAO1K`, `AT281026-LO-GAO1K`, `AT281026-LO-YM500`. Mỗi lô phải có hạn dùng hợp lệ và mã chưa tồn tại.

Giá trị hàng đạt đợt 1: **6.220.000 đ**. Chênh lệch so với đơn: **60.000 đ**, gồm 36.000 đ hàng bị loại và 24.000 đ hàng thiếu. Ba gói bị loại chưa hoàn thành nghĩa vụ giao hàng đạt, nên **PO còn 5 gói**, dù cột thiếu riêng của chuyến là 2.

Kết quả mong đợi sau duyệt: PO **Giao hàng một phần (`partially_received`)**, tổng đã nhận đạt 235; kho năm SKU lần lượt **95 / 50 / 40 / 30 / 20**. Kiểm tra ở **Tồn kho / Lô** (`/admin/inventory`) và phần **Các đợt giao hàng** trong chi tiết PO. Tải lại trang để xác nhận dữ liệu đã được lưu.

## 5. Chọn một trong hai nhánh kết thúc PO

Hai nhánh A/B áp dụng cho cùng PO là **loại trừ nhau**. Nếu muốn kiểm tra cả hai, tự tạo thêm một PO với tiền tố/mã lô mới. Không đóng PO rồi mong tiếp tục nhập trên chính PO đó.

### Nhánh A — Nhà sản xuất giao bù đợt 2

1. Mở PO giao một phần → **Tạo phiếu nhập đợt tiếp theo**. Vẫn là **PO cũ**, không tạo đơn mua bù.
2. CR500 còn 5: nhập **đạt 5**, **bị loại 0**, lô mới **`AT281026-LO-CR500-2`**, ngày sản xuất/hạn dùng hợp lệ. Các dòng đã nhận đủ có số cần nhận 0 và không được cộng thêm; nếu nhập qua JSON/file giữ các dòng này là đạt 0, bị loại 0, không cần lô.
3. Có thể sao chép file 03 để dùng thủ công cho đợt 2: giữ PO/SKU, sửa CR500 đạt 5/bị loại 0 và lô mới; bốn dòng khác đạt 0/bị loại 0, xóa thông tin lô/ngày không dùng. Dùng màn hình nhập tay sẽ dễ đối chiếu phần còn lại hơn.
4. Lưu nháp → Gửi duyệt: kho vẫn **95 CR500**. Admin duyệt: kho **100 CR500**, năm SKU **100 / 50 / 40 / 30 / 20**.
5. PO thành **Đã nhập kho (`received`)**, đã nhận đạt **240**, còn **0**, có hai phiếu đã duyệt. Giá trị hàng đạt lũy kế **6.280.000 đ**. Không cho tạo thêm phiếu để nhập vượt đơn.
6. Mở lại hai phiếu: giữ riêng số liệu, người lập/người duyệt, lô, giá trị từng đợt; phiếu đợt 1 không bị sửa thành đợt 2.

### Nhánh B — Nhà sản xuất không giao phần còn lại, Đóng đơn mua

1. Sau khi duyệt đợt 1, bảo đảm không còn phiếu **nháp/chờ duyệt/từ chối chưa hủy** gắn PO. Nếu đã lập thử đợt 2, dùng **Hủy phiếu nhập**, nhập lý do; thao tác này không tăng tồn.
2. Mở PO → **Đóng đơn mua hàng** → chọn **Nhà cung cấp hủy phần thiếu**. Có thể bổ sung “Nhà sản xuất dừng giao 5 gói CR500 còn lại”. Nếu chọn **Khác**, phải nhập lý do cụ thể.
3. Xác nhận. PO thành **Đã đóng (`closed`)**, lưu lý do/người đóng/thời gian. Phiếu đợt 1 vẫn đã nhập kho; số đã nhận đạt và giá trị không bị xóa.
4. Kho vẫn **95 / 50 / 40 / 30 / 20**; giá trị hàng đạt **6.220.000 đ**. Đối chiếu công nợ theo hàng thực nhận, không lấy toàn bộ 6.280.000 đ làm hàng đã nhập.
5. Không cho nhận tiếp hoặc sửa đơn đã đóng. Phần chênh lệch còn lại được thể hiện để tra cứu, không tự biến thành hàng đã giao.

### Các số lũy kế cần hiểu đúng

Trong response PO, mỗi dòng có `quantityReceived` (đã duyệt nhập đạt), `quantityPending` (đạt đang được giữ chỗ bởi các phiếu chưa xác nhận), `quantityRemaining` (đặt trừ đã nhận đạt), `quantityAvailableToReceive` (còn lại trừ giữ chỗ). `receivedTotalAmount` là giá trị đạt lũy kế; `receiptIds`/`receiptCount` giúp đối chiếu nhiều phiếu.

Ví dụ sau đợt 1: CR500 nhận đạt 95, còn 5. Lập nháp đợt 2 đạt 5 làm `quantityPending=5`, `quantityAvailableToReceive=0`, nhưng kho vẫn 95. Duyệt mới chuyển 5 này thành hàng đã nhận và tăng kho. Hủy phiếu nháp giải phóng giữ chỗ, không trừ kho.

## 6. Các ca lỗi nhập hàng để tự thực hiện

Thực hiện trên chứng từ phụ hoặc trước khi duyệt chứng từ chính. Sau mỗi ca, ghi kết quả thật ở bảng cuối tài liệu; nếu cần, hủy phiếu thử trước khi tiếp tục nhánh A/B.

| Mã ca | Thao tác thủ công | Kết quả mong đợi |
|---|---|---|
| NH01 | Nhập file 04 sau khi điền đúng mã NCC | Xem trước báo dòng số lượng âm và giá âm; không nhập thành công dữ liệu lỗi |
| NH02 | Nhập âm tại số lượng/giá trên form | Cảnh báo tiếng Việt ngay khi nhập; không cho lưu |
| NH03 | Lập phiếu từ PO chưa duyệt | Không cho chọn/lưu nhập kho |
| NH04 | Sau đợt 1, nhập CR500 đạt 6 khi chỉ còn 5 | Chặn vượt số còn có thể nhận, kho không tăng |
| NH05 | Lập nháp đợt 2 đạt 5; tab khác thử lập thêm đạt 1 | Chặn do 5 đã giữ chỗ; tải lại tiến độ để thấy số khả dụng mới |
| NH06 | Với phiếu nháp/chờ duyệt còn tồn tại, thử Đóng PO | Chặn đóng; yêu cầu xử lý/hủy phiếu mở trước |
| NH07 | Admin từ chối phiếu, sau đó Kho sửa/gửi lại | Bắt buộc lý do từ danh sách; Khác cần ghi rõ. Chưa tăng kho. Phiếu từ chối vẫn giữ chỗ cho đến khi sửa/hủy |
| NH08 | Hủy phiếu nháp/chờ duyệt/từ chối có lý do | Phiếu cancelled; giải phóng giữ chỗ; không đổi tồn đã xác nhận |
| NH09 | Duyệt phiếu với ghi chú trống | Duyệt được khi dữ liệu hợp lệ; đóng popup và cập nhật trạng thái |
| NH10 | Gửi lại thao tác duyệt cùng phiếu hoặc tải lại trang | Không cộng tồn kho lần thứ hai; API có thể trả trạng thái hiện tại hoặc từ chối thao tác lặp |
| NH11 | Nhập mã lô trùng, NSX sau HSD, lô hết hạn | Chặn dữ liệu; chỉ sửa về hợp lệ mới lưu được |
| NH12 | Chọn Khác khi đóng PO nhưng bỏ trống lý do | Cảnh báo tiếng Việt; không đóng |
| NH13 | Đóng PO rồi thử tạo phiếu nhập tiếp | Chặn; giữ nguyên tồn và lịch sử |
| NH14 | Dùng Warehouse gọi duyệt/từ chối qua Bruno | Backend từ chối do thiếu quyền ADMIN; không chỉ ẩn nút ở frontend |
| NH15 | Dùng Sales truy cập route kho/sản phẩm | Chặn theo quyền hiện có; Sales vẫn vào được Khuyến mãi |
| NH16 | Xem trước/in PO và phiếu nhập | Đúng mã nghiệp vụ, ngày, người lập, ĐVT/trọng lượng/giá; không có con dấu đỏ tạo sẵn |

Với NH05, thao tác hai tab là do bạn thực hiện; không cần chạy script song song. Một lỗi validation hoặc 409 phù hợp được xem là chặn thành công khi dữ liệu không bị ghi sai; ghi rõ message thực tế để đánh giá UX.

## 7. Bán hàng, khuyến mãi và hoàn tất đơn COD

Thực hiện sau **một trong hai nhánh nhập hàng** ở trên. Cả hai đều đủ tồn cho đơn bán mẫu.

### Bước 1 — Tạo khuyến mãi bằng Sales hoặc Admin

Vào **Bán hàng & Khách hàng → Khuyến mãi** (`/admin/promotions`). Tạo mã **`AT281026_10`**: giảm **10%**, đơn tối thiểu **100.000 đ**, tối đa giảm **50.000 đ**, giới hạn sử dụng 100, mỗi khách 5; trạng thái hoạt động. Chọn phạm vi sản phẩm cà rốt, táo, gạo của bộ AT281026. Chọn thời gian bao phủ ngày bạn thực hành; ngày mẫu trong JSON từ 28-10-2026 đến 28-11-2026.

Ca phụ có thể tự tạo mã `AT281026_30K`: giảm cố định 30.000 đ, tối thiểu 200.000 đ. Không áp dụng đồng thời mã này khi đối chiếu đơn 10% dưới đây.

### Bước 2 — Khách đặt đơn

1. Đăng nhập Customer. Tìm sản phẩm AT281026 trong cửa hàng, xem chi tiết ảnh/quy cách/giá/tồn/chứng nhận và thêm **2 CR500 + 1 TAO1K**.
2. Ở giỏ hàng, chỉ chọn ba đơn vị này. Thử chọn/bỏ chọn và nhập số lượng để đối chiếu tổng; đưa về 2 + 1 trước khi thanh toán. Kiểm tra nhập 0 hoặc âm phải báo lỗi.
3. Áp dụng `AT281026_10` tại **giỏ hàng**. Chưa dùng điểm để giữ số đối chiếu đơn giản.
4. Sang thanh toán; kiểm tra không có ô áp dụng mã giảm giá lặp. Nhập người nhận, điện thoại, địa chỉ ba trường; chọn **COD**. Kiểm tra tổng trước khi bấm **THANH TOÁN**.

| Khoản | Giá trị mong đợi |
|---|---:|
| 2 × CR500 | 56.000 đ |
| 1 × TAO1K | 120.000 đ |
| Tạm tính | **176.000 đ** |
| Giảm 10% | **17.600 đ** |
| Điểm sử dụng | **0** |
| Phí giao hàng theo preview hiện tại | **0 đ** |
| Tổng thanh toán | **158.400 đ** |

Giả định không có ưu đãi khác làm thay đổi giá bán. Luôn lấy kết quả **preview/backend** làm căn cứ cuối; nếu số khác, ghi response/ưu đãi đang có để đối chiếu, không sửa thủ công tổng tiền trên trình duyệt.

Sau đặt: ghi mã đơn thực tế; COD ở trạng thái đơn `confirmed`, thanh toán chưa thu. Đặt hàng **giữ hàng** nên số có thể bán (`availableQuantity`) giảm; số đang có thực tế (`quantityOnHand`) chưa giảm trước khi bàn giao. Không suy diễn “đã thanh toán” từ việc tạo đơn thành công.

### Bước 3 — Xử lý đơn, giao và đối soát

Vào **Bán hàng & Khách hàng → Đơn bán & Giao hàng** bằng Sales hoặc Admin. Thao tác theo đúng thứ tự:

| Thứ tự | Hành động | Trạng thái/kết quả cần đối chiếu |
|---:|---|---|
| 1 | Chuẩn bị hàng | `preparing` |
| 2 | Tạo chuyến giao: đơn vị “Giao hàng mẫu AT281026”, mã vận đơn `AT281026-GH01`, phí 0 | Chuyến `pending`; chưa coi là đã giao |
| 3 | Bàn giao tài xế (`picked_up`) | Đơn `shipping`; xuất kho 2 CR500 và 1 TAO1K, giải phóng giữ hàng tương ứng |
| 4 | Giao thành công (`delivered`) | Đơn `delivered`; COD chưa mặc nhiên đối soát |
| 5 | Ghi nhận thu COD | Thanh toán `paid`, ghi nhận thời gian thu |
| 6 | Đối soát COD | Ghi nhận thời gian đối soát; phải thu trước |
| 7 | Hoàn tất đơn | `completed`; cộng **1 điểm** một lần |

Thử bấm Hoàn tất trước khi giao/thu/đối soát trên đơn phụ: hệ thống phải chặn. Khách mở lịch sử đơn, kiểm tra badge và hành trình khớp thực tế; đơn chưa giao/hoàn tất không hiện như đã hoàn tất. Mã lô nếu API trả phân bổ phải khớp lô đã xuất, không tạo mã lô giả.

Sau đơn chính hoàn tất, số điểm mong đợi **P0 + 1** (nếu không có giao dịch điểm khác). Hoàn tất lặp không được cộng điểm lần nữa. Nếu đổi điểm ở đơn tiếp theo, 1 điểm = 2.000 đ, tối đa 50 điểm/đơn và không vượt điểm khả dụng; thử nhập vượt số dư hoặc âm phải báo lỗi.

### Tồn kho sau duy nhất đơn bán chính

| Nhánh nhập | CR500 | CR1K | TAO1K | GAO1K | YM500 |
|---|---:|---:|---:|---:|---:|
| Nhận đủ qua hai đợt | **98** | 50 | **39** | 30 | 20 |
| Đóng PO sau đợt 1 | **93** | 50 | **39** | 30 | 20 |

Đây là `quantityOnHand` sau bàn giao đơn chính, giả định không có đơn mẫu khác tác động. Tồn khả dụng còn phụ thuộc các đơn đang giữ hàng.

## 8. Các tình huống bán hàng và giao diện bổ sung

| Tình huống | Cách tự kiểm tra | Điều cần ghi nhận |
|---|---|---|
| Hủy trước chuẩn bị | Tạo đơn riêng 1 CR1K rồi hủy khi còn hợp lệ | Đơn cancelled, giải phóng giữ hàng; tồn có thực vẫn 50 nếu chưa xuất |
| Đang giao | Tạo đơn riêng 3 GAO1K, chuẩn bị và bàn giao | Kho gạo từ 30 còn 27; ghi riêng để không nhầm bảng tồn của đơn chính |
| Giao thất bại/trả về | Dùng đơn phụ và nhập lý do khi chuyển trạng thái | Không tự nhập lại tồn của hàng organic trả về trước kiểm nhận |
| Voucher sai/chưa đủ điều kiện/hết hạn | Thử ở giỏ rồi bỏ mã sai trước đơn chính | Báo tiếng Việt, không trừ tiền bằng mã không hợp lệ |
| VNPay | Tự tạo đơn riêng, hoàn tất trên sandbox, quay lại trang kết quả | Chỉ công nhận thành công khi backend trả `paid`; tham số URL `00` chưa đủ để chứng minh backend đã xác minh |
| Tìm kiếm/lọc | Tìm AT281026, lọc ngày/trạng thái/NCC/loại sản phẩm | Hiển thị đúng tập dữ liệu, xóa lọc khôi phục danh sách |
| Dashboard | So sánh KPI/đơn gần đây/cảnh báo với dữ liệu vừa tạo | Ghi số trước/sau; không mặc định tổng KPI toàn hệ thống bằng riêng bộ mẫu |
| Thông báo | Theo dõi khi tạo/duyệt/đặt hàng theo API đang hỗ trợ | Ghi thông báo thực nhận; push còn phụ thuộc quyền trình duyệt/cấu hình Firebase |
| Sidebar theo vai trò | Đăng nhập lần lượt Admin, Kho, Sales | Admin đủ nhóm; Kho bốn nhóm; Sales Tổng quan + Bán hàng & Khách hàng |

Với VNPay, thông tin cổng sandbox và callback/IPN phải được cấu hình theo tài liệu payment của dự án. Không đổi trạng thái đơn thành paid bằng thao tác giả lập trên frontend. Nếu lỗi, lưu mã đơn/mã thanh toán, HTTP status và JSON đã che token để phân tích.

## 9. Tham chiếu API để tự kiểm tra bằng Bruno (tùy chọn)

API gốc ví dụ: `http://localhost:8088/api/v1`. Tự đăng nhập để lấy Bearer token đúng vai trò; không dùng token của người khác. File JSON là tài liệu dữ liệu, **không gửi nguyên cả file** vào một endpoint.

| Việc | Method + đường dẫn sau API gốc | Vai trò |
|---|---|---|
| Lấy chi tiết PO và số lũy kế | `GET /purchase-orders/{id}` | Kho/Admin |
| Lập PO | `POST /purchase-orders` | Kho/Admin |
| Duyệt hoặc từ chối PO | `POST /purchase-orders/{id}/approve` hoặc `/reject` | Admin |
| Lập phiếu nhập | `POST /goods-receipts` | Kho/Admin |
| Gửi duyệt phiếu nhập | `POST /goods-receipts/{id}/submit` | Kho/Admin |
| Duyệt/từ chối phiếu nhập | `POST /goods-receipts/{id}/approve` hoặc `/reject` | Admin |
| Hủy phiếu mở, giải phóng giữ chỗ | `POST /goods-receipts/{id}/cancel` với `{"note":"Hủy phiếu thử để đóng PO"}` | Kho/Admin |
| Đóng PO | `POST /purchase-orders/{id}/close` với `{"reasonCode":"supplier_cancelled","note":"Nhà sản xuất hủy phần còn lại"}` | Kho/Admin |
| Kiểm tra tồn SKU/lô | `GET /inventory/variants` và `GET /product-batches` | Kho/Admin |
| Xem trước giá thanh toán | `POST /checkout/preview` | Khách |
| Tạo đơn bán | `POST /orders`, có `Idempotency-Key` riêng | Khách |
| Điểm hiện có | `GET /customers/me/rewards` | Khách |

`reasonCode` đóng PO nhận `supplier_cancelled`, `no_longer_needed`, `other`; `other` cần `note` không trống. Duyệt/từ chối dùng body `{"note":...}`: duyệt có thể null; từ chối phải có nội dung. Khi tạo phiếu nhập, `purchaseOrderDetailId` là **ID dòng PO**, không phải productId/variantId. Trong dữ liệu mẫu, thay placeholder từ response thật.

Nếu thử lại cùng thao tác đặt đơn do mất kết nối, dùng lại cùng Idempotency-Key và cùng body để tránh tạo trùng; một đơn mới phải dùng key mới. Khi tự kiểm tra qua URL frontend `/api/...`, Vite có thể proxy tới backend nên thấy cổng frontend trong Network là bình thường; đối chiếu response và cấu hình proxy trước khi kết luận sai cổng.

## 10. Phiếu ghi kết quả do người thực hiện điền

Không đánh dấu Đạt chỉ vì đã chuẩn bị file. Mỗi ca cần ngày thực hiện, tài khoản, mã chứng từ thực tế và số liệu/ảnh/response quan sát được.

| Ca / bước | Người thực hiện | Mã PO / GR / đơn bán | Kết quả thực tế | Đạt / Không đạt / Chưa chạy | Ghi chú bằng chứng |
|---|---|---|---|---|---|
| Tạo NCC + xuất xứ | | | | Chưa chạy | |
| Nhập 4 sản phẩm / 5 SKU | | | | Chưa chạy | |
| Nhập/duyệt PO 6.280.000 đ | | | | Chưa chạy | |
| Duyệt GR đợt 1: 235 đạt | | | | Chưa chạy | |
| Nhánh A: nhập bù đợt 2 | | | | Chưa chạy | |
| Nhánh B: Đóng PO có lý do | | | | Chưa chạy | |
| Giữ chỗ / vượt số còn nhận / hủy phiếu | | | | Chưa chạy | |
| Đơn COD 158.400 đ | | | | Chưa chạy | |
| Giao / thu / đối soát / hoàn tất | | | | Chưa chạy | |
| Tồn kho và điểm sau hoàn tất | | | | Chưa chạy | |
| Quyền / ngày / in / thông báo | | | | Chưa chạy | |

Khi báo lỗi, gửi tên bước, vai trò, mã nghiệp vụ chứng từ, thông báo nguyên văn và response đã che Authorization/token/thông tin nhạy cảm. Giữ lại chứng từ mẫu để đối chiếu lịch sử nhập/xuất; không xóa trực tiếp dữ liệu có quan hệ bằng SQL chỉ để chạy lại bài.
