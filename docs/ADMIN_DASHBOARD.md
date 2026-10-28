# Dashboard tổng quan Organicfood.vn

Cập nhật frontend ngày 28-10-2026. Mở **Admin → Dashboard** hoặc `/admin/dashboard`. Không thay đổi backend, dữ liệu hay quy tắc duyệt chứng từ.

## Giao diện và thao tác

- React + Tailwind; component Card theo mô hình shadcn/ui, dùng cùng button và Radix Dialog của dự án. Recharts **3.10.1** được thêm vào package.json/pnpm-lock.yaml và chỉ tải cùng trang Dashboard.
- Bốn KPI: doanh thu đã thanh toán, số đơn còn cần xử lý, tỷ lệ giao thành công và tổng cảnh báo kho/hạn dùng.
- Chọn Hôm nay / 7 ngày / 30 ngày. Biểu đồ 2 trục cho doanh thu VNĐ và số đơn; chọn ngày/tuần, hover để xem số cụ thể. Nút biểu tượng bảng chuyển sang số liệu dạng bảng, hỗ trợ đọc dữ liệu mà không phụ thuộc màu sắc/tooltip.
- Donut tỷ trọng tiền hàng theo danh mục, bảng chú giải phần trăm. Khi có nhiều danh mục, gộp nhóm nhỏ vào Danh mục khác; khoản Chưa phân loại được giữ riêng.
- Lô đã nhập còn hàng, sắp hết hạn trong 7/14/30 ngày và lô quá hạn; danh sách sản phẩm dưới ngưỡng tồn.
- Tabs Đơn mua / Phiếu nhập / Đổi trả đang chờ xử lý. Mở xem chi tiết bằng mã nghiệp vụ; không thực hiện duyệt ngay từ Dashboard.
- Bảng đơn gần đây và hoạt động tạo/duyệt/từ chối chứng từ. Tất cả ngày hiển thị `dd-mm-yyyy`, ngày giờ bổ sung `HH:mm` theo múi giờ Việt Nam.
- Dùng **Xem bản mẫu** để xem bộ dữ liệu organic mô phỏng. Mẫu có nhãn rõ ràng; lỗi API thật không tự chuyển sang dữ liệu mẫu. Trong mẫu, cửa sổ chứng từ không có nút điều hướng tới chứng từ thật và không ghi dữ liệu.

## API hiện có, không tự tạo endpoint thống kê

| Nguồn | Endpoint sau `/api/v1` | Input | Dữ liệu sử dụng |
|---|---|---|---|
| Đơn bán | `GET /management/orders` | `page,size` | `orderCode,orderedAt,status,paymentStatus,pricing,shipments,receiverName` |
| Hồ sơ danh mục (ADMIN) | `GET /admin/products` | `page,size` | `id,categoryId,categoryName,defaultVariantId` |
| Hồ sơ công khai (nhân viên) | `GET /products` | `page,size` | Mã SP, danh mục và sản phẩm mặc định được công bố |
| Tồn kho | `GET /inventory/variants` | `page,size` | `variant.id,variant.productId,availableQuantity,reorderLevel,lowStock` |
| Lô đã nhập | `GET /product-batches` | `page,size` | `batchCode,variant,expiryDate,quantityOnHand,confirmed` |
| Đơn mua | `GET /purchase-orders` | `page,size` | `orderCode,status,orderDate,createdByEmployee,approvedByEmployee,approvedAt` |
| Phiếu nhập | `GET /goods-receipts` | `page,size` | `receiptCode,status,receiptDate,receivedByEmployee,confirmedByEmployee,confirmedAt` |
| Yêu cầu đổi trả | `GET /management/return-requests` | `page,size` | `requestCode,status,customer,order,requestedAt` |
| Chi tiết đổi trả khi mở | `GET /management/return-requests/{id}` | UUID nội bộ | `request,description,items` |

Tải toàn bộ các trang của từng nguồn để không tính KPI chỉ trên trang đầu. Các nguồn tải song song, nguồn lỗi được báo riêng, các nguồn thành công vẫn hiển thị. Làm mới thủ công, khi quay lại tab và mỗi 60 giây khi tab đang hiển thị. Các bộ lọc của Dashboard hiện xử lý ở frontend vì backend chưa có API tổng hợp/bộ lọc thời gian cho đơn bán.

Phân quyền theo controller đang có:

- ADMIN đọc đủ các nguồn.
- SALES_STAFF đọc đơn bán, sản phẩm công khai và đổi trả; không gọi kho, đơn mua, phiếu nhập hay `/admin/products`.
- WAREHOUSE_STAFF đọc đơn bán theo quyền backend đang cấp, sản phẩm công khai, kho và mua hàng; không gọi API đổi trả của bộ phận bán hàng.
- Không có quyền: hiển thị thông báo phù hợp, không gọi rồi chờ lỗi 403. Đổi tài khoản/quyền làm khởi tạo lại trang, không giữ chứng từ của tài khoản trước.

## Định nghĩa chỉ số

### Doanh thu và tăng trưởng

Dashboard hiện hiển thị **giá trị đơn đã thanh toán theo ngày đặt đơn**, không phải báo cáo kế toán hoặc báo cáo theo ngày thu tiền:

- Chỉ `paymentStatus=paid`, trạng thái đơn `confirmed/paid/preparing/shipping/delivered/completed`, tiền tệ VND và có tổng tiền hợp lệ.
- Không cộng đơn chờ thanh toán, cần đối soát, đã hủy, trả hàng, refunded hay partially_refunded. Không tự quy đổi ngoại tệ; có ghi chú nếu gặp đơn hoàn một phần/ngoại tệ chưa tính.
- Cộng `pricing.totalAmount`, đã có giảm giá và phí giao theo snapshot đơn.
- So sánh với khoảng ngày liền trước có cùng số ngày. Kỳ trước bằng 0 thì ghi chưa đủ cơ sở so sánh, không bịa 100% hoặc chia cho 0. Hôm nay là khoảng ngày đang diễn ra, không phải cùng số giờ của hôm trước.
- Chưa trừ giao dịch hoàn tiền thực tế do DTO đơn/API nguồn chưa trả số tiền hoàn đã thực hiện. Đây không phải doanh thu thuần.

### Đơn cần xử lý và giao thành công

- Đơn cần xử lý: toàn bộ đơn đang `pending_confirmation/confirmed/preparing`, không chỉ trong kỳ lọc và không cộng `pending_payment`.
- Giao thành công trong tập đơn đặt của kỳ: số đơn có kết quả giao thành công / số đơn có kết quả cuối là thành công, thất bại hoặc trả về. Mỗi đơn tính một lần theo chuyến mới nhất. Đơn còn đang vận chuyển không nằm trong mẫu số. Đơn `delivered/completed` không có dữ liệu shipment được dùng theo trạng thái đơn.
- Không có kết quả giao thì hiển thị `—`, không coi là tỷ lệ 0% hoặc 100%.

### Cảnh báo kho

- Dựa trên ngày Việt Nam, chỉ lô `confirmed=true` và `quantityOnHand > 0`.
- Trước hôm nay: đã quá hạn; ngày hôm nay: hết hạn hôm nay; còn 1–3 ngày: ưu tiên; còn trong ngưỡng đã chọn: cận hạn.
- Dùng tồn thực tế để cảnh báo lô, không loại bỏ hàng chỉ vì đang được giữ chỗ.
- KPI cộng **số mức tồn thấp + số lô cận/quá hạn**; đây là số cảnh báo, không phải số sản phẩm phân biệt.
- API kho/lô lỗi hoặc chưa có quyền thì chỉ số `—`, không coi là kho không có cảnh báo.

### Tỷ trọng danh mục

- Tiền hàng sau giảm = `lineAmount - discountAmount`, không cộng phí giao. Tổng donut có thể khác KPI doanh thu đúng bằng phí giao và các dữ liệu dòng thiếu.
- Nối qua ID nội bộ của variant/product và hồ sơ danh mục hiện tại. ADMIN dùng tồn kho để nối các quy cách ngoài quy cách mặc định; người không có quyền kho chỉ nối những quy cách đã có trong hồ sơ sản phẩm được phép đọc.
- Không suy diễn danh mục theo tên sản phẩm. Không nối được thì hiển thị **Chưa phân loại** và số tiền tương ứng, không loại bỏ để làm tỷ trọng đẹp hơn.
- Chưa có snapshot danh mục tại lúc bán; đổi danh mục hiện tại có thể làm thay đổi phân tích lịch sử. Được ghi rõ dưới biểu đồ.

## Hoạt động và mã hiển thị

- Dùng `orderCode`, `receiptCode`, `requestCode`, `batchCode` để hiển thị; thiếu mã thì ghi Chưa có mã, không thay bằng UUID. UUID chỉ dùng làm key, gọi API và điều hướng.
- Dùng người lập/duyệt thật từ chứng từ; thiếu người thì ghi chưa có thông tin, không gán người đang đăng nhập.
- Backend dùng `approvedAt/approvedByEmployee` cho cả duyệt/từ chối đơn mua và `confirmedAt/confirmedByEmployee` cho cả duyệt/từ chối phiếu nhập. Dashboard phân biệt nhãn theo trạng thái, không coi mọi timestamp này là duyệt thành công.
- Khi chứng từ bị hủy nhưng không còn lịch sử quyết định cũ, dùng nhãn trung tính Ghi nhận quyết định; không tự đoán trước đó đã duyệt hay từ chối.
- Đơn bán hiện chưa trả hồ sơ người mua, nên nếu dùng `receiverName` thì bảng ghi rõ **Người nhận hàng**; không khẳng định đó là tên chủ tài khoản mua.
- Mở đơn mua/phiếu nhập tới module quản lý bằng query `documentId`; đã cập nhật ProcurementPage để mở đúng chứng từ. Đơn bán dùng `orderId`, kho dùng `variantId`, giữ contract hiện tại.

## Backend cần bổ sung để báo cáo đầy đủ và mở rộng quy mô

1. API tổng hợp Dashboard có khoảng ngày, múi giờ, độ phân giải ngày/tuần và tổng hợp phân quyền phía server. Không nên tải toàn bộ chứng từ ở trình duyệt khi dữ liệu lớn.
2. Dữ liệu thu tiền theo ngày thực hiện và hoàn tiền thực tế, trạng thái đối soát, tiền tệ/quy đổi đã chốt; phân biệt doanh thu gộp, doanh thu thuần, COD chưa đối soát và hoàn tiền chờ xử lý.
3. Snapshot `productId/categoryId/categoryName` trên dòng đơn tại thời điểm bán hoặc API báo cáo danh mục theo thời gian; tránh phân loại lại lịch sử theo danh mục hiện tại và các quy cách đã ngừng bán.
4. Hồ sơ khách hàng mua trên DTO đơn bán, tách biệt người nhận hàng.
5. Nhật ký audit tổng hợp toàn hệ thống có thời điểm, người thực hiện, hành động, mã chứng từ, trạng thái trước/sau. Snapshot chứng từ hiện chỉ cho một phần sự kiện; không thể khôi phục mọi lần sửa/xóa/duyệt lại.
6. Module frontend sau bán chuyên biệt để tiếp nhận/xét duyệt đổi trả theo đúng quyền SALES_STAFF; Dashboard hiện cung cấp danh sách và xem đầy đủ thông tin yêu cầu, không tự gọi API approve hoặc hoàn tiền.

## Tệp và kiểm thử

Trang: `src/pages/admin/AdminDashboardPage.jsx`. Các khối UI trong `src/components/dashboard/`; chuẩn Card trong `src/components/ui/card.jsx`; công thức trong `src/lib/adminDashboard.js`; ranh giới API/phân quyền trong `src/services/admin/dashboardService.js`; bộ mẫu trong `src/constants/demoDashboard.js`.

```powershell
pnpm exec vitest run src/lib/adminDashboard.test.js src/services/dashboard.test.js src/pages/admin/dashboardInteractions.test.js
pnpm test
pnpm build
```

Kiểm tra mới bao gồm: kỳ so sánh, VND, thanh toán chờ/hoàn tiền không bị tính thành đã trả, mẫu số giao hàng, gộp tuần bảo toàn tổng, lô chưa duyệt/không tồn không tạo cảnh báo, HSD hôm nay, danh mục chưa nối được, từ chối không ghi thành đã duyệt, phân quyền API, tải nhiều trang, lỗi một nguồn và render SVG Recharts thật trong jsdom.

Kết quả cuối: **535/535 test, 53 tệp đạt**; `pnpm build` thành công cho ứng dụng và service worker. Vẫn có cảnh báo chunk chính trên 500 kB như trước, không chặn build. Đã kiểm tra tương tác và SVG biểu đồ trong jsdom; chưa kiểm tra trực quan bằng trình duyệt vì quyền điều khiển trình duyệt của phiên làm việc đang tắt. Không thực hiện giao dịch, duyệt chứng từ hoặc sửa dữ liệu backend khi kiểm thử.

Tài liệu thư viện chính thức: [Recharts — cài đặt](https://recharts.github.io/en-US/guide/), [Recharts — kích thước biểu đồ responsive](https://recharts.github.io/en-US/guide/sizes/), [shadcn/ui — Card](https://ui.shadcn.com/docs/components/card).
