# Phản hồi và đổi trả — tích hợp ngày 29-10-2026

## Kết quả đọc backend

Backend Spring Boot đã tách ba luồng qua controller → service → repository/entity, dùng JWT, `ApiResponse`, `PageResponse`, khóa giao dịch và kiểm tra quyền sở hữu:

| Luồng | Controller | Service / DTO | API hiện có |
|---|---|---|---|
| Phản hồi, tin nhắn, bằng chứng | CustomerFeedbackController, ManagementFeedbackController | FeedbackService, FeedbackRequests, FeedbackViews | 19 |
| Yêu cầu và xét duyệt đổi trả | CustomerReturnRequestController, ManagementReturnRequestController | ReturnRequestService, ReturnRequests, ReturnViews | 17 |
| Thu hồi, kiểm tra, xử lý kho | ReturnReceiptController, CustomerReturnReceiptController | ReturnReceiptService, ReturnReceiptRequests, ReturnReceiptViews | 13 |

Ba nhóm ban đầu gồm 49 endpoint; đợt thực thi sau bán bổ sung 10 endpoint, gồm tiến độ, hoàn tiền, đơn đổi/giao hàng và hoàn tất hồ sơ. Đánh giá sao sản phẩm là module `CustomerReviewController`/`CustomerReviewService` riêng, đã có giao diện Đánh giá của tôi; không dùng đánh giá sao thay cho hồ sơ khiếu nại/đổi trả.

Nguồn đối chiếu là controller/service/DTO hiện tại và `organic_backend/docs/FEEDBACK_API.md`, `RETURN_REQUESTS_API.md`, `RETURN_RECEIPTS_API.md`. Các đường dẫn thực thi đã được bổ sung cùng controller/service thật trong backend; hợp đồng chi tiết ở `organic_backend/docs/RETURN_EXECUTION_API.md`.

## Màn hình đã bổ sung

| Đường dẫn | Đối tượng | Chức năng |
|---|---|---|
| `/phan-hoi` | CUSTOMER | Gửi góp ý chung hoặc gắn với đơn, tìm theo mã/chủ đề, lọc loại/trạng thái, xem cuộc trao đổi, gửi tin nhắn và ảnh/video, đóng/mở lại khi đủ điều kiện |
| `/doi-tra` | CUSTOMER | Danh sách/chi tiết yêu cầu, lịch sử, đồng ý hoặc yêu cầu xét lại phương án, báo đã bổ sung thông tin, hủy trước thực hiện, xem tiến độ hàng thu hồi |
| `/admin/feedbacks` | ADMIN, SALES_STAFF | Lọc phản hồi chưa phân công, tiếp nhận, phân công, trao đổi và chuyển trạng thái theo quyền trả về |
| `/admin/return-requests` | ADMIN, SALES_STAFF | Nhận xét duyệt, yêu cầu bổ sung, lập phương án từng sản phẩm, kiểm tra dự tính, duyệt/từ chối và đọc lịch sử |
| `/admin/return-receipts` | ADMIN, SALES_STAFF, WAREHOUSE_STAFF | Theo dõi hàng thu hồi; kho nhận, đối chiếu lô gốc, kiểm tra/kiểm tra lại, nhập lại hàng đạt hoặc ghi nhận loại bỏ |

Menu khách có Phản hồi & hỗ trợ, Đổi trả. Nhóm Bán hàng có tab Phản hồi, Đổi trả, Hàng thu hồi; nhân viên kho có tab Hàng thu hồi trong Kho vận. Sidebar vẫn giữ số nhóm cha hiện tại. Tài khoản đa vai trò không bị lặp tab hàng thu hồi.

Link chi tiết dùng `feedbackId`, `requestId`, `orderId` trong URL để định tuyến, nhưng nội dung hiển thị dùng `feedbackCode`, `requestCode`, `orderCode`, SKU, tên sản phẩm và mã lô. Không dùng UUID thay cho mã hiển thị. Nhật ký JSON được chuyển thành ghi chú/số lượng dễ đọc, giữ nguyên dữ liệu gốc ở server.

Chi tiết đơn có nút phản hồi và link mở yêu cầu đã gửi. Nút tạo yêu cầu được mở cho đơn đã giao/hoàn tất hoặc đơn đã hủy nhưng đã trả tiền, đúng chính sách backend; API eligibility tiếp tục quyết định điều kiện thực tế. Đơn hủy chỉ chọn hoàn tiền không thu hồi. Sau gửi thành công mở chi tiết yêu cầu để khách tiếp tục gửi bằng chứng.

## Quyền thực tế

- CUSTOMER chỉ thao tác hồ sơ thuộc mình. Không gửi customerId, senderAccountId hoặc tự gán trạng thái/nhân viên.
- SALES_STAFF phải có hồ sơ nhân viên hoạt động, nhận phụ trách trước khi trả lời/xét duyệt. Không được xử lý hồ sơ đang thuộc nhân viên khác.
- ADMIN xem và phân công phản hồi cho nhân viên bán hàng. Backend không cấp bước trả lời/duyệt phương án riêng cho Admin; giao diện dùng `actions` để hiện nút tương ứng.
- WAREHOUSE_STAFF có hồ sơ hoạt động mới được ghi nhận hàng thu hồi. Admin/bán hàng đọc tiến độ; các thao tác kho chỉ hiện khi backend trả quyền.
- Khách và nhân viên có thể đọc hồ sơ đã kết thúc, nhưng không được suy ra rằng mọi trạng thái đều cho phép ghi.

## Đầu vào và đầu ra quan trọng

`src/services/afterSalesService.js` dùng cùng transport Bearer/refresh hiện tại, mở gói `data`, chuẩn hóa phân trang bằng `content`/`items`.

### Phản hồi

Prefix khách `/api/v1/feedbacks`, quản lý `/api/v1/management/feedbacks`.

- Tạo: `{orderId?: UUID|null, feedbackType, subject, content}` → `Detail {feedback, content, media, messageCount, actions}`.
- Tin nhắn: `{content}` → `Message {id, senderName, senderType, messageType, content, media, createdAt}`.
- Phân công: PATCH `/{id}/assignment`, `{employeeId, note}`; employeeId là ID hồ sơ nhân viên trong danh sách assignees, không phải accountId.
- Chuyển trạng thái: PATCH `/{id}/status`, `{status, note}`. Khách đóng/mở lại bằng POST `close`/`reopen`, `{note}`.
- Upload multipart: `file`, `messageId` nếu gắn tin nhắn; nhân viên bắt buộc gắn tin nhắn của mình. Không tự đặt multipart boundary. Xóa theo quyền `canDelete` trả về.
- JPEG/PNG/WebP tối đa 5 MiB; MP4/WebM tối đa 50 MiB; tối đa 5 ảnh và 1 video/nội dung. Server vẫn kiểm tra chữ ký tệp và tổng quota.
- Tạo nội dung trước rồi upload từng tệp. Nếu upload lỗi, không gửi lại nội dung. Nếu mạng không rõ kết quả, yêu cầu xem lại trước khi gửi bổ sung để tránh trùng.

### Đổi trả

Prefix khách `/api/v1/return-requests`, quản lý `/api/v1/management/return-requests`.

- GET eligibility với `orderId` lấy số lượng còn có thể yêu cầu và mức hoàn theo số thực trả.
- POST tạo dùng Idempotency-Key, body `{orderId, requestType, reason, description, items:[{orderDetailId,quantity,reason}]}` → `Detail {request, description, decisionNote, policyNote, items, actions}`. Backend tự tạo feedback nếu không có feedbackId.
- Preview và approve cùng body `{expectedProposalVersion,note,policyNote,items:[{detailId,approvedQuantity,resolutionType,returnRequired,refundAmount}]}`. `detailId` là dòng yêu cầu, không phải dòng đơn gốc. Gửi đủ tất cả dòng; dòng từ chối dùng số 0, type null, không thu hồi/hoàn.
- Preview trả tổng và mức hoàn được kiểm tra tại thời điểm xem. Thay đổi bất kỳ dữ liệu nào sẽ bỏ kết quả preview; phải kiểm tra lại trước khi duyệt.
- Khách accept/decline gửi `{proposalVersion,note}`; request-information/reject gửi `{expectedProposalVersion,note}`; cancel/submit-information gửi `{note}`.
- `approved` là chờ khách xác nhận; `processing` là đã đồng ý, chờ thực hiện. Không hiển thị đã chuyển tiền/giao hàng đổi ở hai trạng thái này.
- Cần ghi căn cứ chính sách nếu dòng được duyệt có `policyReviewRequired=true`. Không tự suy đoán thời hạn theo tên loại sản phẩm.

### Hàng thu hồi

Prefix `/api/v1/management/return-receipts`.

- Hàng chờ và chi tiết: GET `/requests`, `/requests/{id}`, `/requests/{id}/items`, `/requests/{id}/histories`; GET `/items/{id}` đọc một lần nhận.
- Nhận: POST `/requests/{id}/items`, `{returnRequestDetailId, originalOrderDetailBatchId?: UUID|null, quantity, note}`. Lô phải lấy từ `originalAllocations`; không truyền batchId thay allocationId.
- Đối chiếu lô: `{expectedVersion,originalOrderDetailBatchId,note}`.
- Kiểm tra/loại bỏ: `{expectedVersion,passedQuantity,failedQuantity,note}`.
- Kiểm tra lại: `{expectedVersion,from:'passed'|'failed',quantity,note}`.
- Nhập lại: `{expectedVersion,quantity,note}`.
- Tất cả POST kho có Idempotency-Key. Giữ key và nội dung cũ khi thử lại; không tự đổi key nếu chưa rõ kết quả. Lấy version từ response, không giả định 0.
- Các số là lượng xử lý thêm, không ghi đè tổng. Có kiểm tra số nguyên, không âm, tổng kiểm không quá số chưa kiểm, số nhập lại/loại bỏ không vượt phần còn giữ.
- Nhận/kiểm đạt chưa tăng tồn; chỉ restock hợp lệ mới tăng tồn lô gốc. Không có nút tự sửa mã lô hoặc HSD để vượt điều kiện.
- Khách đọc GET `/return-requests/{id}/warehouse-progress` và `/{id}/receipts`, không có thao tác kho.

## Thực thi hoàn tiền và đơn đổi đã bổ sung

Nguồn hợp đồng: [RETURN_EXECUTION_API.md](../../organic_backend/docs/RETURN_EXECUTION_API.md). Không thêm/chạy SQL hoặc thay dữ liệu để thử.

- `ReturnExecutionPanel.jsx` xuất hiện trong chi tiết đổi trả của khách/quản trị và trang kho. Phân biệt tiền được duyệt, tiền đã hoàn thực tế và phần còn đang xử lý/đối soát; các nút dùng `actions` do server trả.
- Khách đọc `GET /return-requests/{id}/execution`. Nhân viên đọc `/management/return-requests/{id}/execution`.
- Hoàn tiền: POST `/management/return-requests/{id}/refunds`, giữ Idempotency-Key và body khi thử lại. Chọn hoàn VNPay hoặc ghi nhận tiền mặt/chuyển khoản đã thực hiện. Không tự gán thành công, không tự gửi lại lệnh hoàn VNPay khi mạng chưa rõ.
- Kiểm tra khoản hoàn riêng: POST `/{id}/refunds/{refundId}/sync`; chưa có mã hoàn riêng thì Admin đối chiếu tại cổng/sao kê rồi dùng POST `reconcile`. Giao diện không lấy kết quả thu tiền gốc làm kết quả hoàn.
- Đơn đổi: POST `/{id}/replacement-order`; thông tin người nhận điền sẵn từ đơn gốc. Danh sách hàng/số lượng/giá lấy theo phương án đã duyệt trên server, không gửi tùy ý từ client.
- Kho chuẩn bị, tạo chuyến và cập nhật trạng thái qua các endpoint `replacement-order/...`; có thể xem cả hồ sơ đổi không cần thu hồi. Chỉ bàn giao hàng mới trừ tồn. Hủy chuyến trước bàn giao có thể đặt chuyến mới; giao thất bại/trả về không tự nhập lại hoặc hoàn tất.
- Hoàn tất: POST `/{id}/complete`, server kiểm tra hàng thu hồi, tiền hoàn, giao hàng đổi và điểm thành viên. Chưa đủ điều kiện có ghi rõ phần còn thiếu.
- Khoản hoàn thành công cập nhật trạng thái thanh toán đơn gốc; lịch sử điểm có nhãn hoàn điểm/thu hồi điểm. Khi điểm đã dùng ở đơn khác không đủ thu hồi, báo cần đối chiếu; không xóa khoản tiền đã hoàn.
- Đơn đổi tổng 0, không thu thêm tiền, không tự cộng điểm. Trang đơn bán thường chỉ xem đơn đổi, các thao tác phải thực hiện tại hồ sơ sau bán.
- Hộp thoại tự đóng sau thành công; mạng/5xx chưa rõ giữ nội dung và key khi gửi lại. Cập nhật tiến độ nền không tự thực hiện giao dịch hoàn tiền.

Phần chưa bổ sung: tên người thao tác trên mọi dòng lịch sử cũ; tự động hoàn Stripe/PayPal; quy trình thu hồi/giao lại sau chuyến đổi thất bại. Không tự mở lại voucher khi hoàn tiền. Chứng từ và tên ngân hàng không thay thế xác minh tài khoản tại ngân hàng.

## Kiểm tra thủ công

1. Khách vào chi tiết đơn, bấm Phản hồi cửa hàng, tạo phản hồi và thêm ảnh/video. Kiểm tra danh sách/chi tiết hiển thị mã hồ sơ, không lộ ID.
2. Admin vào Bán hàng → Phản hồi, chọn hồ sơ, phân công nhân viên bán hàng. Nhân viên khác không được ghi; người phụ trách trả lời và yêu cầu bổ sung.
3. Khách trả lời, đóng/mở lại khi đủ điều kiện. Phản hồi có đổi trả chưa xong không đóng được; server trả thông báo tương ứng.
4. Với đơn đã giao, khách chọn sản phẩm/số lượng đổi trả; mở yêu cầu vừa tạo và gửi bằng chứng qua liên kết Trao đổi.
5. Sales tiếp nhận, chọn từng dòng và nhập ghi chú/căn cứ chính sách. Bấm Kiểm tra phương án, đối chiếu tổng, rồi duyệt. Đổi dữ liệu phải kiểm tra lại; từ chối cần chọn lý do và ghi cụ thể.
6. Khách đồng ý hoặc yêu cầu xét lại đúng phương án hiện tại. Hồ sơ đồng ý chuyển chờ thực hiện, không được hiển thị đã hoàn tiền.
7. Kho mở Hàng thu hồi: hồ sơ khách chưa đồng ý không được nhận. Với hồ sơ đã đồng ý có thu hồi, nhận một phần, chọn đúng lô đã giao hoặc để chưa xác định rồi đối chiếu sau.
8. Kiểm tra đạt/không đạt theo số chưa kiểm. Hàng chưa kiểm/chưa đối chiếu lô/hết hạn không được nhập lại. Nhập lại phần đạt hoặc ghi loại bỏ phần giữ riêng; xem tổng và lịch sử.
9. Khách/bán hàng/Admin đọc được tiến độ và lịch sử theo quyền. Tải lại hoặc thử gửi lặp thao tác kho không cộng số lần hai. Màn hình stale phải được đối chiếu lại khi server trả xung đột.
10. Theo hướng dẫn `RETURN_EXECUTION_API.md`, kiểm tra cả hoàn VNPay và hoàn thủ công, gửi lặp/mất kết nối, tạo/giao đơn đổi, điều kiện hoàn tất và điều chỉnh điểm. Không chỉ xem mã API 00 để kết luận tiền đã hoàn.
11. Thử số âm, số lẻ, số vượt giới hạn, thiếu ghi chú, ảnh/video quá dung lượng và tài khoản sai vai trò. Thông báo phải rõ bằng tiếng Việt.

Đã bổ sung source regression tests về hợp đồng API, phân quyền menu, phiên bản phương án, số lượng thu hồi, chống gửi trùng và hiển thị lịch sử. **Chưa chạy test/build, không đăng nhập thao tác nghiệp vụ, không tạo hồ sơ hoặc giao dịch**, theo yêu cầu người dùng kiểm tra thủ công. Kiểm tra tĩnh cú pháp/import không thay thế kiểm thử thực tế với backend và Cloudinary đang chạy.
