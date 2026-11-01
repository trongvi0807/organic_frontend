# Rà soát trả hàng và hoàn tiền — 01-11-2026

Phạm vi: đọc mã nguồn frontend và backend hiện tại, đối chiếu hợp đồng hoàn tiền VNPay. Không chạy giao dịch, không thao tác dữ liệu nghiệp vụ, không chạy kiểm thử, không sửa code trong lượt rà soát này. Kết luận về nguyên nhân lỗi của một giao dịch cụ thể cần phản hồi hoặc nhật ký của lần gọi đó.

**Kết luận**

Luồng có đủ các bước chính và nhiều ràng buộc bảo vệ tiền/tồn kho, nhưng trải nghiệm đang khiến người dùng nhầm giữa nhận hàng, kiểm tra, xử lý kho, hoàn tiền và đối soát. Phần chẩn đoán lỗi VNPay chưa đủ thông tin để hỗ trợ hồ sơ đã rơi vào trạng thái cần đối soát.

**Các điểm cần xử lý**

| Mức ưu tiên | Phát hiện | Ảnh hưởng | Hướng điều chỉnh |
|---|---|---|---|
| Cao | ReturnExecutionService.java:21,29,37 bắt mọi RuntimeException rồi trả cùng một kết quả chung; hàm uncertain không giữ nguyên nhân hoặc mã phản hồi. | Lỗi mạng, lỗi chữ ký và lỗi đối chiếu dữ liệu trông giống nhau. Không xác định được nguyên nhân khoản 45.000 đồng chỉ từ thông báo hiện có. | Lưu phân loại lỗi, mã tương quan và phản hồi đã lọc dữ liệu nhạy cảm; không đưa secret, chữ ký hoặc thông tin tài khoản vào nhật ký công khai. |
| Cao | Khi không xác minh được phản hồi, Result không có mã hoàn; prepareAutomatic chỉ tra cứu khi đã có mã hoàn riêng. | Có thể phải đối soát thủ công dù tác vụ tự động vẫn chạy. Hiện chưa có cơ chế khôi phục tự động cho mọi tình huống mất phản hồi. | Bổ sung cách đối chiếu được VNPay hỗ trợ và bằng chứng bền vững. Không tự gửi lại lệnh hoàn hay lấy kết quả thanh toán gốc để kết luận đã hoàn. |
| Vừa — cần quyết định nghiệp vụ | warehouseComplete bắt buộc nhập lại/loại bỏ hết hàng trước khi hoàn tiền, thay vì chỉ nhận đủ và kiểm tra xong. | Tiến độ hoàn cho khách phụ thuộc cả thao tác xử lý kho sau kiểm tra. Đây là quy tắc hiện có, không phải lỗi tính tồn. | Có thể tách điều kiện được hoàn tiền (nhận đủ + kiểm tra xong + phương án hợp lệ) khỏi điều kiện kết thúc hồ sơ (xử lý hết kho + đủ tiền hoàn). Chỉ đổi khi thống nhất quy tắc nghiệp vụ; chưa áp dụng đề xuất này. |
| Vừa | ReturnExecutionPanel.jsx:80 mặc định outcome=succeeded khi mở đối soát. | Người dùng dễ hiểu nhầm hệ thống đã xác nhận hoàn thành công. | Để trống kết quả, buộc chọn theo chứng từ; giải thích đối soát chỉ ghi nhận kết quả đã kiểm tra, không chuyển tiền. |
| Vừa | ReturnWarehousePage.jsx:70-71 vẫn mở ô có số tối đa bằng 0; mặc định kiểm tra lại từ passed kể cả khi chỉ có hàng failed. | Xuất hiện thông báo khó hiểu 0–0 hoặc 1–0, chọn nhầm chiều kiểm tra lại. | Hiện số đang giữ của từng nhóm, khóa lựa chọn không có số lượng, tự chọn nhóm còn hàng, dùng thông báo tiếng Việt giải thích cụ thể. |
| Vừa | Hồ sơ tự động gắn với tài khoản người duyệt; tài khoản mất quyền/ngừng hoạt động hoặc không còn được phân công thì dừng. | Hồ sơ có thể ngừng hoàn tự động khi đổi nhân viên phụ trách. | Có trạng thái và cách chuyển giao quyền xử lý rõ ràng, lưu lịch sử người chịu trách nhiệm. |
| Vừa | Đối soát kiểm tra mã tham chiếu bằng chuỗi đúng nguyên trạng, trong khi kết quả tự động lưu dạng VNP-<mã>. | Cùng một mã có thể được nhập với cách trình bày khác nhau; việc chống trùng phụ thuộc người đối chiếu. | Chuẩn hóa mã theo phương thức, kiểm tra duy nhất trên mã giao dịch hoàn chuẩn, giữ chuỗi gốc làm bằng chứng. |

Các điểm trên là phát hiện qua mã nguồn. Không khẳng định lỗi mạng/chữ ký/cấu hình cụ thể nào đã xảy ra với hồ sơ của người dùng khi chưa có bằng chứng của lần gọi đó.

**Các ràng buộc hiện có**

- Khách chỉ gửi cho đơn của mình, số lượng không vượt phần còn được xử lý; hồ sơ chưa kết thúc giữ chỗ số lượng để hạn chế yêu cầu trùng.
- Nhân viên bán hàng phụ trách tiếp nhận và duyệt phương án. Admin không thay thế bước duyệt phương án bán hàng theo phân quyền hiện tại.
- Tiền được tính từ tiền hàng thực trả sau giảm giá của đơn gốc, theo số lượng được duyệt; không dùng giá bán hiện tại và không tự cộng phí giao hàng vào tiền hoàn.
- Duyệt phương án chưa chuyển tiền; khách phải chấp nhận đúng phiên bản trước khi thực hiện.
- Nhân viên kho có vai trò WAREHOUSE_STAFF mới ghi nhận các thao tác hàng thu hồi. Admin xem được nhưng không tự có quyền thao tác kho nếu thiếu vai trò này.
- Nhận hàng chưa tăng tồn bán. Chỉ nhập lại phần đã kiểm đạt, đúng lô đã xuất, còn hạn và lô đã được duyệt nhập. Ghi nhận loại bỏ không tăng tồn.
- Phần đạt đang giữ = đạt đã kiểm − đã nhập lại − phần đạt đã loại bỏ.
- Phần không đạt đang giữ = không đạt đã kiểm − phần không đạt đã loại bỏ.
- Xong kho khi nhận đủ số được duyệt thu hồi và mọi phần giữ riêng đã được nhập lại hoặc loại bỏ. Phương án hoàn không thu hồi không cần bước kho.
- Hoàn tự động hiện dành cho giao dịch VNPay/VND đủ dữ liệu, phương án có dấu cho phép tự động của bản cập nhật, khách đã đồng ý và kho đã xong. Hồ sơ cũ đã chấp nhận trước cập nhật giữ luồng xử lý cũ.
- Giao dịch hoàn được giữ số tiền trong CSDL trước khi gọi cổng; có khóa đơn và mã thao tác để hạn chế gửi trùng. Chưa rõ kết quả thì không tạo thêm lệnh hoàn tự động.
- Trạng thái thành công yêu cầu phản hồi hoàn tiền đã được xác minh: chữ ký, giao dịch, số tiền, mã phản hồi và trạng thái. Mã 00 của thanh toán ban đầu không chứng minh đã hoàn tiền.
- Chỉ Admin có nhân viên đang hoạt động được đối soát thủ công. Nhân viên bán hàng phụ trách hoặc Admin đủ điều kiện được hoàn tất hồ sơ.
- Chưa có chặn cứng mọi yêu cầu sau 24 giờ. Chính sách theo danh mục; quá hạn/thiếu cấu hình/thiếu thời điểm giao thì yêu cầu căn cứ xét duyệt ngoại lệ.

**Các bước thực hiện trên giao diện**

| Bước | Người thực hiện | Thao tác | Kết quả cần thấy |
|---|---|---|---|
| 1 | Khách hàng | Chi tiết đơn đã giao → yêu cầu trả hàng, chọn sản phẩm/số lượng/lý do, gửi bằng chứng nếu cần. | Chờ tiếp nhận. |
| 2 | Bán hàng phụ trách | Bán hàng & Khách hàng → Đổi trả → mở hồ sơ → Tiếp nhận xét duyệt. | Đang xét duyệt. |
| 3 | Bán hàng phụ trách | Lập / sửa phương án → chọn Trả hàng và hoàn tiền, số lượng; xem tiền và nội dung tự điền; ghi căn cứ nếu cần xác minh chính sách; duyệt. | Chờ khách xác nhận phương án. |
| 4 | Khách hàng | Mở hồ sơ → Đồng ý phương án → Xác nhận, không cần nhập nội dung. | Đã đồng ý · Chờ thực hiện. |
| 5 | Kho | Hàng thu hồi → mở hồ sơ → Nhận hàng thu hồi, nhập số thực nhận; chọn lô nếu xác định được. | Đã nhận tăng; tồn có thể bán chưa tăng. |
| 6 | Kho | Đối chiếu lô gốc khi cần; Ghi kết quả kiểm tra theo chất lượng thực tế. | Chưa kiểm giảm; phần đạt/không đạt đang giữ được cập nhật. |
| 7 | Kho | Hàng đủ điều kiện bán lại → Nhập lại tồn bán; hàng thực tế loại bỏ → Ghi nhận loại bỏ đúng nhóm và số lượng. Nếu chọn nhầm kết quả trước khi xử lý xong, dùng Kiểm tra lại. | Còn cần nhận = 0, Chưa kiểm = 0, hai nhóm đang giữ = 0. |
| 8 | Hệ thống | Tác vụ nền gửi yêu cầu hoàn VNPay khi đủ điều kiện, không cần bấm hoàn thủ công ở luồng tự động. | Đang xử lý; khi VNPay xác nhận thành công thì Đã hoàn thực tế tăng. |
| 9 | Admin, chỉ khi có ngoại lệ | Nếu Cần đối soát: kiểm tra giao dịch hoàn/chứng từ thực tế, sau đó mới ghi nhận kết quả. Chưa có bằng chứng thì không xác nhận thành công. | Đã hoàn hoặc thất bại theo kết quả thực tế. |
| 10 | Bán hàng phụ trách/Admin đủ điều kiện | Đổi trả → mở hồ sơ → Hoàn tất hồ sơ, ghi chú xác nhận và lưu. | Hồ sơ Hoàn tất, có lịch sử. |

Nếu có đổi hàng, trước khi hoàn tất còn phải tạo đơn đổi, chuẩn bị, giao và ghi nhận giao thành công. Với luồng chỉ trả hàng và hoàn tiền thì không tạo đơn đổi.

**Tình huống túi chuối hoàn 45.000 đồng**

1. Nhận thực tế 1 túi. Nếu kiểm tra thực tế hỏng, ghi Đạt=0, Không đạt=1. Nếu trước đó nhập nhầm Đạt=1 thì dùng Kiểm tra lại, chuyển 1 từ Đạt sang Không đạt.
2. Sau khi đã loại bỏ thực tế, ghi nhận loại bỏ: phần đạt=0, phần không đạt=1. Khi đó không còn hàng giữ riêng và kho đã xong.
3. Tác vụ hoàn tự động có thể thực hiện. Nếu đã có khoản HT-... với trạng thái Cần đối soát thì hồ sơ đã đi tới nhánh xử lý tiền, không cần làm lại các bước nhận/kiểm tra/loại bỏ.
4. Không tạo lại hồ sơ hoặc lệnh hoàn để cố thoát trạng thái chưa rõ. Cần xác minh khoản hoàn đang có; thao tác đối soát chỉ ghi sổ kết quả đã xác minh, không chuyển tiền.
5. Sau khi Đã hoàn thực tế=45.000 đồng và không còn khoản chờ, nhân viên đủ quyền hoàn tất hồ sơ. Đơn gốc có thể là Hoàn một phần nếu chỉ trả một phần hàng hoặc không hoàn phí giao hàng.

**Tài liệu đối chiếu VNPay**

[API QueryDr và Refund chính thức](https://sandbox.vnpayment.vn/apis/docs/truy-van-hoan-tien/querydr%26refund.html): phân biệt kết quả xử lý API và tình trạng giao dịch, trạng thái đang xử lý/chuyển ngân hàng, mã hoàn riêng và quy tắc chữ ký.

**Những việc chưa thực hiện**

Không xác nhận đã chuyển/đã nhận tiền; không gửi thêm lệnh hoàn; không chạy kiểm thử hoặc sửa dữ liệu; không thay chính sách 24 giờ. Các lỗi và điều chỉnh đề xuất trong báo cáo chưa được sửa ở lượt rà soát này.
