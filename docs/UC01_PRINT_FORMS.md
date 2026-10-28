# UC01 — Đề nghị nhập hàng và Đơn đặt hàng

Hai component dùng chung PrintFormLayout:

- `src/components/print/forms/PurchaseRequisitionForm.jsx`: BM-NV01-01, export thêm alias `PhieuDeNghiNhapHang` khớp Golden Reference.
- `src/components/print/forms/PurchaseOrderPrintForm.jsx`: BM-NV01-02, export thêm alias `DonDatHang`.

Vào **Admin → Đơn mua → Xem → Xem trước bản in A4**, chọn một trong hai biểu mẫu bằng nút ở đầu. Chỉ mount/in mẫu đang chọn. Dùng **In biểu mẫu** hoặc **Lưu PDF → Save as PDF**. File PDF từ API backend vẫn là template riêng, không bị thay đổi bởi component frontend.

> Cập nhật 28-10-2026: Font chung đã chuyển sang Noto Sans có hỗ trợ tiếng Việt, đóng gói trong dự án. Đã có đủ 16 mẫu theo PDF; xem [BUSINESS_FORMS_PDF_REFERENCE.md](BUSINESS_FORMS_PDF_REFERENCE.md).

## Chuẩn thị giác dùng chung

Noto Sans tiếng Việt trên toàn bộ tờ phiếu; nền giấy `#F7FAF5`; viền ngoài `#A3C1AD`; chữ tiêu đề/logo `#1B4D2E`; nền thanh mục/header bảng `#DCEAD6`; lưới/khung `#689F75`; khối dữ liệu trắng. Header 3 cột theo Golden Reference, tiêu đề phiếu riêng phía dưới.

Không có input trong tờ phiếu. `DottedField` dùng flex và border-bottom dotted; dữ liệu nằm trên dòng chấm. Giá trị 0 được giữ. Ngày dd/mm/yyyy; ngày thiếu là dòng chấm, không gán năm cố định hoặc lấy ngày hiện tại thay cho dữ liệu chưa có. Numeric căn phải, phân cách hàng nghìn vi-VN.

Bảng 8 cột, có đầy đủ lưới dọc/ngang, tối thiểu 8 dòng. Ví dụ 2 sản phẩm thêm 6 dòng trống cao 28px. Không bỏ bớt dữ liệu khi quá 8 sản phẩm; bảng tiếp trang và lặp tiêu đề cột.

Primitive checkbox dùng ô vuông viền xanh và ✓, có nhãn đọc cho trình đọc màn hình; là ký hiệu trên giấy, không phải control thay đổi nghiệp vụ. Không tạo hình dấu đỏ trên bản xem trước, bản in hay PDF. Vùng ký xác nhận để trống để ký và đóng dấu thật bằng tay sau khi in.

**Thứ tự chữ ký PO đã chốt theo trả lời của người dùng:** Người lập đơn (Purchasing) → Đại diện nhà cung cấp (Ngày NCC xác nhận) → Người xác nhận bên đặt (đóng dấu thủ công sau khi in). Phiếu đề nghị: Người lập đề nghị → Purchasing → Người xác nhận (đóng dấu thủ công sau khi in).

## 1. Dữ liệu Phiếu đề nghị BM-NV01-01

```jsx
<PurchaseRequisitionForm data={{
  documentNumber: 'DN-001',
  createdAt: '2026-10-27',
  department: 'Kho',
  creatorName: 'Người lập đề nghị',
  purchaserName: 'Nhân viên Purchasing',
  confirmerName: 'Người xác nhận',
  generalNotes: 'Nội dung đề nghị',
  requiredDate: '2026-11-02',
  suggestedSupplier: 'Nhà cung cấp đề xuất',
  items: [{
    id: 'line-1', productCode: 'SP01', productName: 'Cà rốt hữu cơ',
    unit: 'Túi 1kg', actualStock: 12, requestedQuantity: 30,
    reason: 'Bổ sung tồn kho', note: 'Giao hàng mới',
  }],
}} />
```

Đồng thời nhận các tên dữ liệu trong Golden Reference: soPhieu/ngayLap/boPhan/nguoiLap/nguoiThuMua/nguoiXacNhan/ghiChuChung/thoiGianCan/nccDeXuat và dòng maSP/tenSP/dvt/tonThucTe/slDeNghi/lyDo/ghiChu.

## 2. Dữ liệu Đơn đặt hàng BM-NV01-02

```jsx
<PurchaseOrderPrintForm data={{
  documentNumber: 'PO-001', createdAt: '2026-10-27',
  creatorName: 'Nhân viên mua hàng', confirmerName: 'Người xác nhận bên đặt',
  supplierRepresentative: 'Đại diện NCC', supplierConfirmedAt: '2026-10-28',
  buyer: {
    name: 'Cửa hàng thực phẩm hữu cơ Organicfood.vn',
    contactName: 'Người phụ trách', department: 'Purchasing',
    phone: '...', email: '...', receivingLocation: 'Kho / Cửa hàng',
  },
  supplier: {
    name: 'Nhà cung cấp', contactName: 'Người liên hệ', phone: '...',
    email: '...', address: '...', code: 'NCC-001',
  },
  items: [{ id: 'line-1', productCode: 'SP01', productName: 'Cà rốt hữu cơ',
    unit: 'Túi 1kg', quantity: 30, unitPrice: 40000, amount: 1200000, note: '' }],
  totalAmount: 1200000,
  productRequirements: 'Yêu cầu sản phẩm / chứng nhận',
  delivery: {
    expectedDate: '2026-11-02', timeWindow: '08:00–10:00', address: 'Kho nhận',
    receiverName: 'Người nhận', receiverPhone: '...', transportMethod: 'Xe lạnh',
  },
  terms: {
    paymentMethod: 'Chuyển khoản', paymentDeadline: 'Trong 7 ngày',
    shippingCost: 0, otherNotes: 'Thông tin thương mại bổ sung',
  },
}} />
```

Tên đơn vị và bộ phận Purchasing mặc định theo định nghĩa biểu mẫu. Các tên/điện thoại/email/địa chỉ/điều khoản chưa truyền để dòng chấm. Số tiền đã truyền từ backend được giữ nguyên; chỉ khi dùng component trực tiếp mà không truyền amount/totalAmount mới tính giá trị dự kiến đơn giản từ số lượng × giá (không tính thêm thuế/giảm giá).

## 3. Tích hợp API hiện có và giới hạn dữ liệu

PO lấy số đơn, ngày đặt, số lượng, đơn giá/thành tiền/tổng tiền, ngày giao, người lập/người duyệt từ PurchaseOrder DTO. Liên hệ và địa chỉ NCC đọc thêm bằng `GET /suppliers/{id}`. Mã SP đọc bằng `GET /products/{productId}/traceability`; **không lấy SKU để giả làm mã SP**. Các request tham chiếu giới hạn tối đa 4 song song, chống gọi lặp theo productId.

Phiếu đề nghị ở màn hình hiện tại là biểu mẫu in minh họa lấy danh sách hàng từ PO. Backend chưa có entity/API hồ sơ đề nghị độc lập: không lấy số PO làm số đề nghị, không lấy ngày đặt/người duyệt PO giả làm ngày lập/người xác nhận đề nghị. Trường độc lập này được để trống.

Tồn thực tế trong phiếu đề nghị đọc đủ trang từ `GET /product-batches?variantId=...`, cộng `quantityOnHand` của các lô `confirmed=true`. Không lấy availableQuantity vì số đó đã trừ giữ chỗ/hạn dùng. Tồn in là tồn vật lý **tại thời điểm mở mẫu**, gồm cả lượng giữ chỗ và hàng hết hạn; không phải snapshot lịch sử vào ngày lập PO. Không tải được tồn thì để trống và báo cảnh báo, không biến lỗi API thành tồn 0. Lô chưa duyệt không tính.

Backend chưa trả riêng trên PO các trường bộ phận đề nghị/lý do đề nghị/ghi chú từng dòng, bên mua đầy đủ, khung giờ giao, điểm nhận, người nhận/điện thoại, phương thức vận chuyển, điều khoản thanh toán/chi phí và xác nhận NCC. Các component đã hỗ trợ props đầy đủ; khi cần lưu các giá trị này lâu dài, backend cần thêm hợp đồng tương ứng. Không nhét các field tự đặt vào API lưu PO hiện hành.

Không có request POST/PUT/PATCH trong luồng xem/in. Biểu mẫu không tạo chữ ký hoặc dấu đỏ điện tử; việc ký và đóng dấu được làm thủ công trên giấy. Trạng thái PO hiện tại được ghi ở phần Ghi chú khác khi in từ backend để không nhầm đơn chờ duyệt thành đơn đã phê duyệt.

## 4. Bộ 16 biểu mẫu

Hai mẫu UC01 tiếp tục dùng khung chung. 14 mẫu còn lại đã được bổ sung theo PDF vào danh mục Biểu mẫu & bản in, mỗi mẫu có mục, cột, phương án và chữ ký riêng; các mẫu rộng dùng A4 ngang. Xem [BUSINESS_FORMS_PDF_REFERENCE.md](BUSINESS_FORMS_PDF_REFERENCE.md).

## 5. Kiểm tra

Kiểm thử DOM/SSR kiểm tra đúng mã/mục/cột, 8 dòng, dòng 0 tồn, tương thích dữ liệu Golden Reference, ngày dd/mm/yyyy, vùng ký xác nhận cuối không có dấu tạo sẵn, ngày NCC ở giữa, số tiền backend được giữ, không thay mã SP bằng SKU, chuyển qua lại hai mẫu chỉ mount một bản in. Kiểm thử service xác nhận tải đủ trang lô, chỉ cộng lô đã duyệt, không trừ giữ chỗ, giữ ô trống khi API lỗi và không giả định số phiếu đề nghị.

Browser automation đang bị tắt trong môi trường, chưa xác minh phân trang/màu bằng trình duyệt hoặc máy in thật. PDF vẫn phụ thuộc thiết lập máy in đích A4 và Background graphics như hướng dẫn khung in.

Kết quả: `pnpm exec vitest run --maxWorkers=2` đạt **437/437 kiểm thử, 42 tệp**. `pnpm build` thành công; còn cảnh báo kích thước chunk chính đã có trước đó. Không sửa backend hoặc tạo/duyệt chứng từ thật trong quá trình kiểm thử.
