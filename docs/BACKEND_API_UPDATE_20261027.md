# Đối chiếu backend mới và nhập Excel trong Admin

Ngày rà soát: 27-10-2026. Chỉ sửa frontend.

Nguồn đối chiếu: backend cùng thư mục, HEAD `18064e7`, commit chức năng `464877f` (`feat: add after-sales workflows and Excel/PDF APIs`), controller/DTO/service thực tế và `docs/EXCEL_IMPORT_PDF_EXPORT.md`, `FEEDBACK_API.md`, `RETURN_REQUESTS_API.md`, `RETURN_RECEIPTS_API.md`. Một số nhận định trong `API_FUNCTIONALITY_AUDIT.md` của backend còn mô tả thời điểm chưa có đổi trả/phản hồi; danh sách dưới lấy từ code mới.

Danh mục máy đọc: [backend-new-endpoints-20261027.json](backend-new-endpoints-20261027.json), gồm **62 endpoint** trong 8 controller mới. Đợt này đã nối **13 endpoint Excel/PDF** vào màn hình hiện có. **49 endpoint hậu mãi** còn cần màn hình riêng, được phân bổ ở mục 4; không coi đó là API backend còn thiếu.

## 1. Cách lập đơn mua bằng Excel

1. Đăng nhập ADMIN hoặc WAREHOUSE_STAFF, mở **Đơn mua → Lập đơn mua → Nhập từ Excel**.
2. Bấm **Tải Excel mẫu**. File lấy trực tiếp từ backend, có sheet `Data`, `Suppliers`, `Variants` và hướng dẫn/tra cứu hiện tại.
3. Nhập dữ liệu vào `Data`, giữ nguyên header và thứ tự cột:

   | Cột | Giá trị |
   |---|---|
   | supplierCode | Mã NCC đang hoạt động; tra sheet Suppliers |
   | expectedDeliveryDate | Không bắt buộc; yyyy-MM-dd hoặc ô ngày Excel; không trong quá khứ |
   | note | Ghi chú, tối đa 5.000 ký tự |
   | sku | Mã quy cách sản phẩm đang hoạt động; tra sheet Variants; không lặp SKU |
   | quantity | Số nguyên từ 1, tối đa 11 chữ số |
   | unitPrice | Giá mua một đơn vị gói/hộp, từ 0.01; tối đa 12 chữ số nguyên, 2 số lẻ |

4. Mỗi file là **một đơn mua**, tối đa 100 dòng. Lặp cùng `supplierCode`, ngày giao, ghi chú trên mọi dòng. Số trong Excel không có dấu phân cách hàng nghìn, dùng dấu chấm thập phân. Không dùng công thức. Chỉ `.xlsx`, tối đa 5 MiB.
5. Chọn file. Frontend gửi kiểm tra lên backend và hiển thị các dòng, lỗi theo số dòng Excel/cột, cảnh báo; ngày trên màn hình là dd-mm-yyyy. Kiểm tra chưa tạo dữ liệu.
6. Chỉ khi `canImport=true` mới bấm **Tạo đơn mua chờ duyệt**. Backend tạo đơn `pending_approval`, frontend đóng form và tải lại danh sách. Chưa có phiếu nhập và chưa tăng tồn.
7. Nếu mất kết nối khi xác nhận, dùng **Kiểm tra / thử lại lần nhập trước**. Frontend gửi lại đúng file + hash + Idempotency-Key, backend trả kết quả cũ nếu đã lưu. Không cần nhập thủ công lại.

Chế độ Excel tạo đơn độc lập theo dữ liệu trong file; không trộn với các dòng đang nhập thủ công. Các API này chỉ tạo mới, vì vậy form **sửa** đơn/phiếu vẫn dùng nhập thủ công.

## 2. Các API đã tích hợp vào giao diện

Tất cả đường dẫn dưới thêm tiền tố `/api/v1`. Dùng Axios chung, gửi JWT trong Authorization; không đưa token vào URL. JSON được đọc từ `response.data.data`. PDF/Excel trả binary, không unwrap như JSON.

| Method | Đường dẫn | Input | Output | Vị trí frontend |
|---|---|---|---|---|
| GET | /admin/products/import-template | Không | Binary xlsx | Sản phẩm → Nhập Excel → Tải mẫu |
| POST | /admin/products/import/preview | multipart `file` | ImportPreview | Sản phẩm → Nhập Excel → kiểm tra |
| POST | /admin/products/import | multipart `file`, `fileSha256`; header Idempotency-Key | ImportResult (201) | Sản phẩm → xác nhận nhập |
| GET | /purchase-orders/import-template | Không | Binary xlsx | Lập đơn mua → Nhập từ Excel |
| POST | /purchase-orders/import/preview | multipart `file` | ImportPreview | Xem trước đơn mua |
| POST | /purchase-orders/import | multipart `file`, `fileSha256`; header Idempotency-Key | ImportResult (201) | Tạo đơn chờ duyệt |
| GET | /goods-receipts/import-template | query `purchaseOrderId` UUID | Binary xlsx | Lập phiếu nhập → chọn đơn để tải mẫu |
| POST | /goods-receipts/import/preview | multipart `file` | ImportPreview | Xem trước phiếu nhập |
| POST | /goods-receipts/import | multipart `file`, `fileSha256`; header Idempotency-Key | ImportResult (201) | Tạo phiếu nháp |
| GET | /purchase-orders/{id}/pdf | UUID đơn mua | Binary PDF | Chi tiết đơn mua → Tải PDF |
| GET | /goods-receipts/{id}/pdf | UUID phiếu nhập | Binary PDF | Chi tiết phiếu nhập → Tải PDF |
| GET | /management/orders/{id}/invoice | UUID đơn bán | Binary PDF | Admin → Chi tiết đơn bán → Tải PDF |
| GET | /orders/{id}/invoice | UUID đơn của khách đăng nhập | Binary PDF | Khách → Chi tiết đơn hàng → Tải PDF |

Quyền: import sản phẩm chỉ ADMIN; mua/nhập và PDF kho là ADMIN/WAREHOUSE_STAFF; PDF bán ở Admin là ADMIN/SALES_STAFF, nên không hiện nút cho nhân viên kho; PDF khách chỉ CUSTOMER sở hữu đơn.

`ImportPreview`:

```text
importType, fileSha256, rowCount, productCount, valid, canImport,
rows: [{row, values: {tên_cột: chuỗi}}],
errors: [{row, column, message}], warnings: [chuỗi]
```

`ImportResult`:

```text
executionId, importType, fileSha256, rowCount,
products: [{id, productCode, variantIds}],
purchaseOrderId?, purchaseOrderCode?, purchaseOrderStatus?,
goodsReceiptId?, goodsReceiptCode?, goodsReceiptStatus?
```

Backend nhập cả file trong một transaction, không nhập từng dòng qua CRUD. HTTP 200 nhưng `canImport=false` chặn xác nhận; HTTP 422 lúc nhập hiển thị `data.errors` mới nhất; 409 yêu cầu chọn/kiểm tra lại file. Khi kết quả không rõ do lỗi mạng/5xx, giữ khóa chống trùng. Khóa pending/hash lưu trong sessionStorage theo tài khoản + loại import + hash, không lưu file/token trong dữ liệu retry. Chọn lại cùng file sau khi mở form lại sẽ cho phép khôi phục lần nhập trước, kể cả preview báo mã đã tồn tại do request trước đã thành công. Sau khi kết quả thành công hoặc bị từ chối rõ ràng, xóa khóa pending tương ứng.

Không tự đặt Content-Type multipart: trình duyệt/Axios sinh boundary. Download lỗi JSON được đọc lại từ Blob để báo đúng thông báo; file thành công lấy tên từ Content-Disposition. Object URL được giải phóng sau khi tải.

### Sản phẩm

Đã thay luồng Nhập Excel ở giao diện bằng API mới của backend. **Mẫu cũ `moc-san-pham-mau.xlsx`/sheet SanPham không dùng cho luồng này.** Tải mẫu hiện tại bằng nút trong giao diện.

Backend dùng các cột `productCode, productName, slug, categoryId, brandId, description, productStatus, organicClaimStatus, certificationIds, originId, imageUrl, sku, variantName, netQuantity, unitId, sellingPrice, compareAtPrice, barcode, reorderLevel, variantStatus`. Danh mục, thương hiệu, xuất xứ, chứng nhận được tra qua các sheet của mẫu. Tối đa 100 sản phẩm / 500 dòng quy cách. Các dòng cùng một sản phẩm phải lặp cùng thông tin sản phẩm. Trạng thái mặc định draft/active cho sản phẩm/quy cách theo backend.

Khác với form nhập tay tự gợi mã SP, backend import hiện **bắt buộc** có productCode, slug và SKU trong file. Frontend không tự sửa mã/UUID trong file. Muốn tự cấp mã cả khi import cần bổ sung nghiệp vụ ở backend.

### Phiếu nhập

Chọn một đơn mua `approved`, chưa có phiếu nhập, tải mẫu được điền sẵn SKU. Các cột: `purchaseOrderCode, note, sku, quantityReceived, quantityRejected, discrepancyReason, batchCode, manufactureDate, expiryDate, originDescription`.

Phải có đủ SKU của đơn, kể cả dòng nhận 0. Đạt + loại không vượt số đặt; thiếu/hỏng cần lý do. Có hàng đạt cần mã lô/HSD. Sau import là phiếu `draft`, lô tồn 0. Gửi duyệt và Admin duyệt vẫn là các thao tác riêng, chỉ duyệt mới tăng tồn. Ô chọn đơn trong chế độ Excel dùng để tải mẫu; đơn thực tế nhập được xác định bởi `purchaseOrderCode` trong file và được backend kiểm tra.

PDF là chứng từ nội bộ, tải PDF không xác nhận tiền hoặc phát hành hóa đơn thuế.

## 3. Các yêu cầu trước đây backend vẫn chưa có

- ProcurementService và API phiếu nhập vẫn giới hạn **một phiếu nhập trên một đơn mua**. Import mới cũng giữ ràng buộc này.
- Chưa có endpoint đóng phần hàng còn thiếu/Close PO, trạng thái giao một phần vận hành thực tế, tổng lượng còn chờ nhập theo nhiều đợt.
- Chưa có API lưu hệ số quy đổi đơn vị dùng chung; frontend quy đổi thùng → gói trước khi lập đơn tay và ghi chú hệ số.
- Mã SP/NCC ở form tay mới là gợi ý phía frontend; backend cần cấp mã nguyên tử nếu muốn bảo đảm quy ước trong môi trường nhiều người cùng nhập.
- Chưa có API lịch sử nhiều lần từ chối/duyệt **đơn mua**. API lịch sử đổi trả mới không thay cho lịch sử đơn mua.

Không tự gọi endpoint Close PO hoặc bật tạo phiếu nhập đợt 2 khi backend chưa có hợp đồng. Các nút giới hạn của luồng giao nhiều đợt hiện tại vẫn thể hiện đúng khả năng backend.

## 4. API mới cần thêm vào chức năng nào

Các mục dưới là **kết quả rà soát và đề xuất màn hình còn thiếu**, chưa triển khai UI/API service hậu mãi trong đợt Excel/PDF này. Danh sách endpoint đầy đủ và quyền trong JSON kèm theo; quy tắc lấy theo DTO và trường `actions` backend trả về.

### 4.1. Phản hồi / chăm sóc khách hàng (19 endpoint)

**Khách hàng:** thêm mục “Hỗ trợ / Phản hồi của tôi” tại Tài khoản và nút liên hệ trong Chi tiết đơn hàng.

| API | Input | Output / mục đích |
|---|---|---|
| POST /feedbacks | JSON `{orderId?, feedbackType, subject, content}` | Detail ticket vừa tạo |
| GET /feedbacks/me | status, feedbackType, search, orderId, page, size | Page Summary ticket của khách |
| GET /feedbacks/{id} | id | Detail: feedback, content, media, messageCount, actions |
| GET /feedbacks/{id}/messages | page, size | Page Message |
| POST /feedbacks/{id}/messages | `{content}` | Message |
| POST /feedbacks/{id}/media | multipart file; query messageId tùy chọn | Media ảnh/video |
| DELETE /feedbacks/{id}/media/{mediaId} | Hai UUID | Xóa tệp được phép |
| POST /feedbacks/{id}/close, /reopen | `{note}` | Detail mới |

`feedbackType`: product/delivery/payment/service/other. Subject <=200, content <=10000, note <=1000. Phần nhận tệp là đính kèm ticket hoặc tin nhắn theo messageId, không phải media đánh giá sản phẩm.

**Admin:** thêm màn hình “Phản hồi khách hàng” cạnh Khách hàng / Đơn bán, có lọc/tìm, trao đổi và phân công:

| API /management/feedbacks | Input | Output |
|---|---|---|
| GET danh sách | Bộ lọc như khách + assignedEmployeeId, unassigned | Page Summary |
| GET /assignees | page, size; ADMIN | Page nhân viên bán hàng đang hoạt động |
| POST /{id}/claim | Không body; SALES_STAFF | Detail sau tiếp nhận |
| PATCH /{id}/assignment | `{employeeId, note}`; ADMIN | Detail sau phân công |
| PATCH /{id}/status | `{status, note}`; SALES_STAFF | Detail; processing/waiting_customer/resolved/closed |
| GET /{id}, GET /{id}/messages | id, phân trang messages | Detail / Page Message |
| POST /{id}/messages, POST /{id}/media, DELETE /{id}/media/{mediaId} | Như phía khách; SALES_STAFF | Message / Media / null |

ADMIN không tự có quyền trả lời/đổi trạng thái nếu không có SALES_STAFF. Hiện nút theo role và `actions`, không mặc định Admin được làm tất cả.

### 4.2. Đổi trả / phương án xử lý (17 endpoint)

**Khách:** thêm “Yêu cầu đổi trả” trong Chi tiết đơn hàng + danh sách yêu cầu ở Tài khoản. Trước khi hiện form gọi eligible-items, không lấy số được trả từ số đã mua đơn thuần.

| API | Input | Output |
|---|---|---|
| GET /return-requests/eligible-items | query orderId | Eligibility: canSubmit, unavailableReason, items với availableQuantity, hạn chính sách, mức hoàn tối đa |
| POST /return-requests | Header Idempotency-Key; `{orderId, feedbackId?, requestType, reason, description, items:[{orderDetailId, quantity, reason?, conditionNote?}]}` | Detail yêu cầu |
| GET /return-requests/me | status, orderId, page, size | Page Summary |
| GET /return-requests/{id}, /{id}/histories | id, phân trang lịch sử | Detail / Page History |
| POST /return-requests/{id}/cancel, /submit-information | `{note}` | Detail |
| POST /return-requests/{id}/accept, /decline | `{proposalVersion, note}` | Detail sau phản hồi phương án |

requestType: exchange/refund/return_refund. reason: damaged/expired/wrong_product/missing_product/quality_issue/other. Quantity nguyên >=1; description/note <=5000. Phải giữ proposalVersion hiện tại, không chấp nhận nhầm phương án cũ.

**Admin:** thêm “Đổi trả” cạnh Đơn bán. API `/management/return-requests`:

- GET danh sách (`status, orderId, mine, page, size`), GET `/{id}`, GET `/{id}/histories` (ADMIN/SALES_STAFF).
- POST `/{id}/claim` (không body), `/{id}/request-information`, `/{id}/reject` với `{expectedProposalVersion, note}`: chỉ SALES_STAFF.
- POST `/{id}/preview-decision`, `/{id}/approve`: `{expectedProposalVersion, note, policyNote?, items:[{detailId, approvedQuantity, resolutionType?, returnRequired, refundAmount?}]}`; chỉ SALES_STAFF. Preview trả giới hạn/mức hoàn từng dòng và tổng, chưa lưu; approve trả Detail chờ khách xác nhận.

Không suy ra đã chuyển tiền hoàn hoặc tạo đơn đổi hàng chỉ vì phương án được duyệt. Backend mới chưa có API thực thi hoàn tiền/đơn thay thế tương ứng trong các controller này.

### 4.3. Nhận hàng trả và kiểm định kho (13 endpoint)

Thêm màn hình **“Hàng khách trả”** cạnh Tồn kho/Lô; không trộn với Phiếu nhập NCC.

Base `/management/return-receipts`:

| API | Input | Output / chức năng |
|---|---|---|
| GET /requests | orderId?, pendingOnly=true, page, size | Page Summary yêu cầu cần thu hồi |
| GET /requests/{id} | UUID yêu cầu | Detail: totals, dòng cần nhận, originalAllocations, canReceive |
| GET /requests/{id}/items | inspectionStatus?, page, size | Page các lần nhận |
| GET /requests/{id}/histories | page, size | Page lịch sử nhận/kiểm định |
| GET /items/{id} | UUID lần nhận | Item có version, tồn giữ riêng, actions, restockEligible, restockBlockedReason |
| POST /requests/{id}/items | Idempotency-Key; `{returnRequestDetailId, originalOrderDetailBatchId?, quantity, note}` | Nhận hàng, chưa tăng tồn bán |
| POST /items/{id}/identify-batch | Idempotency-Key; `{expectedVersion, originalOrderDetailBatchId, note}` | Đối chiếu lô gốc |
| POST /items/{id}/inspect | Idempotency-Key; `{expectedVersion, passedQuantity, failedQuantity, note}` | Ghi kiểm định |
| POST /items/{id}/reinspect | Idempotency-Key; `{expectedVersion, from: passed/failed, quantity, note}` | Kiểm định lại |
| POST /items/{id}/restock | Idempotency-Key; `{expectedVersion, quantity, note}` | Cộng đúng phần đạt đủ điều kiện vào lô gốc |
| POST /items/{id}/dispose | Idempotency-Key; `{expectedVersion, passedQuantity, failedQuantity, note}` | Loại bỏ hàng giữ riêng |

Các GET cho ADMIN/SALES_STAFF/WAREHOUSE_STAFF; mọi POST nghiệp vụ kho trên chỉ WAREHOUSE_STAFF. Note bắt buộc <=3000, lượng là số nguyên không âm (receive/restock/reinspect từ 1). Giữ version và key khi retry, reload sau 409. Chỉ bật restock theo actions/restockEligible, không tự cộng tồn khi nhận hàng.

Khách theo dõi tại Chi tiết yêu cầu đổi trả bằng GET `/return-requests/{id}/warehouse-progress` (Summary tổng lượng) và GET `/return-requests/{id}/receipts?inspectionStatus=&page=&size=` (Page Item), chỉ CUSTOMER sở hữu yêu cầu.

### 4.4. Thanh toán

Backend mới đã có VNPay querydr ở VnpayGateway. Frontend hiện có `POST /payments/{id}/sync` và `GET /payments/{id}`, không cần đổi sang endpoint tự đặt hoặc tự xác nhận thành công từ URL. Phần Excel/PDF không thay đổi luồng tiền và không thêm thao tác tạo thanh toán khi tải chứng từ.

## 5. Kiểm chứng

Kiểm thử tự động bao gồm request multipart binary qua HTTP/Axios thật đến fixture local, JWT/boundary/fileSha256/Idempotency-Key, giả lập backend đã commit nhưng mất response rồi retry không tạo thêm đơn; lỗi preview/422; thử lại sau mở form lại; chặn double-click; luồng Lập đơn mua → Excel; download binary và lỗi JSON trong Blob; các route PDF đúng hợp đồng.

Không tạo đơn/phiếu/sản phẩm hoặc giao dịch trong database backend của người dùng để thử nghiệm. Browser automation bị tắt trong môi trường hiện tại; kiểm tra tương tác bằng DOM/jsdom và build production, chưa xác nhận giao diện bằng trình duyệt thật.
