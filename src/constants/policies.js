// Customer-facing explanations of the current purchase and after-sales flows.
// Keep loyalty rates and eligibility wording aligned with the corresponding services.
export const POLICY_PAGES = [
  {
    slug: 'chinh-sach-tich-diem', title: 'Chương trình tích điểm', icon: 'points',
    summary: 'Mua sắm, tích điểm và chọn cách sử dụng ưu đãi phù hợp với bạn.',
    action: { to: '/diem-thuong', label: 'Xem điểm thưởng & voucher' },
    sections: [
      { title: 'Tham gia bằng tài khoản khách hàng', paragraphs: ['Đăng ký và đăng nhập tài khoản để xem số điểm, voucher đang sở hữu và lịch sử sử dụng. Điểm được ghi nhận cho tài khoản đã đặt mua hàng.'] },
      { title: 'Khi nào bạn được cộng điểm?', bullets: ['Điểm được cộng khi đơn đã giao, đã thanh toán và được cửa hàng hoàn tất. Đơn mới đặt hoặc đang chờ thanh toán chưa được cộng điểm.', 'Hiện tại, mỗi 100.000₫ thực trả đủ điều kiện được 1 điểm; phần chưa đủ 100.000₫ trong đơn không được làm tròn thành điểm.', 'Ví dụ: đơn hoàn tất có giá trị thực trả đủ điều kiện 250.000₫ được cộng 2 điểm. Khoản tiền đã hoàn được loại khỏi giá trị tích điểm.'] },
      { title: 'Hai cách sử dụng điểm', bullets: ['Trừ tiền trực tiếp: hiện tại 1 điểm tương ứng 2.000₫, tối đa 50 điểm cho một đơn. Số tiền trừ không vượt tiền hàng còn lại sau ưu đãi.', 'Đổi voucher: chọn ưu đãi trong mục Điểm thưởng, xem số điểm cần đổi, hạn sử dụng và điều kiện rồi xác nhận. Voucher được lưu trong tài khoản của bạn.', 'Trong cùng một đơn, chọn voucher đổi điểm hoặc trừ điểm trực tiếp; không dùng đồng thời cả hai. Mã ưu đãi công khai có thể kết hợp khi đơn đáp ứng điều kiện và được chấp nhận tại bước thanh toán.'] },
      { title: 'Điểm đang giữ và điều chỉnh sau mua', paragraphs: ['Điểm dùng cho đơn đang xử lý có thể ở trạng thái đang giữ, nên chưa thể dùng cho đơn khác. Khi đơn được hủy hợp lệ, phần điểm đang giữ được giải phóng.'], bullets: ['Voucher phải còn hạn, thuộc tài khoản của bạn và chưa được dùng hoặc giữ cho đơn khác.', 'Khi hoàn tiền hoặc trả hàng, số điểm đã tích và đã sử dụng được đối chiếu với phần hàng thực tế được xử lý. Bạn có thể xem kết quả trong lịch sử điểm.'] },
    ],
  },
  {
    slug: 'chinh-sach-doi-tra', title: 'Chính sách đổi trả & hoàn tiền', icon: 'returns',
    summary: 'Gửi yêu cầu ngay từ đơn đã mua và theo dõi từng bước xử lý cùng cửa hàng.',
    action: { to: '/don-hang', label: 'Chọn đơn hàng cần hỗ trợ' },
    sections: [
      { title: 'Trường hợp cần hỗ trợ', paragraphs: ['Nếu nhận sai hàng, thiếu hàng hoặc sản phẩm có vấn đề về chất lượng, hãy giữ lại bao bì, nhãn lô và chụp rõ tình trạng sản phẩm. Bảo quản theo hướng dẫn trên nhãn trong thời gian chờ cửa hàng trao đổi.'], bullets: ['Chọn đúng đơn, sản phẩm và số lượng cần hỗ trợ.', 'Yêu cầu không vượt số lượng đã mua còn được xử lý; phần đã có hồ sơ liên quan sẽ được đối chiếu để tránh trùng.'] },
      { title: 'Thời hạn gửi yêu cầu', paragraphs: ['Hãy kiểm tra hàng khi nhận và liên hệ sớm khi phát hiện bất thường. Thời hạn được xét theo nhóm sản phẩm, tính từ thời điểm ghi nhận giao thành công.'], bullets: ['Bạn được thông báo điều kiện của từng sản phẩm khi tạo yêu cầu.', 'Nếu chưa xác định được thời hạn, thiếu thông tin giao nhận hoặc có tình huống ngoài thời hạn, cửa hàng cần xác minh trước khi quyết định. Gửi yêu cầu chưa có nghĩa đã được chấp thuận đổi trả.'] },
      { title: 'Các bước gửi và xác nhận phương án', steps: ['Đăng nhập, mở Đơn hàng và chọn Yêu cầu Đổi/Trả ở đơn cần hỗ trợ.', 'Chọn hình thức hỗ trợ, lý do, mô tả, số lượng và tải ảnh bằng chứng trước khi gửi.', 'Nhân viên tiếp nhận, trao đổi thêm nếu cần và gửi phương án gồm số lượng, hình thức xử lý, số tiền hoàn dự kiến.', 'Mở hồ sơ trong mục Đổi trả, xem kỹ phương án rồi xác nhận đồng ý. Nếu cần làm rõ, trao đổi với cửa hàng trước khi xác nhận.'] },
      { title: 'Nhận lại hàng và hoàn tiền', paragraphs: ['Với phương án có thu hồi hàng, cửa hàng hướng dẫn cách giao lại và kiểm tra hàng trước khi tiếp tục xử lý. Không tự gửi hàng về một địa chỉ khác khi chưa thống nhất.'], bullets: ['Tiền hoàn được tính theo phần tiền hàng thực trả của số lượng được duyệt sau các khoản giảm giá; không mặc định hoàn theo giá gốc.', 'Nhân viên trao đổi và xác nhận tên chủ tài khoản, số tài khoản, ngân hàng cùng thông tin liên quan với bạn trước khi chuyển khoản.', 'Cửa hàng cập nhật kết quả sau khi đã chuyển tiền và kiểm tra giao dịch. Xác nhận đồng ý phương án không phải xác nhận đã nhận tiền.', 'Thời gian xử lý và tình trạng từng khoản hoàn được trao đổi trong hồ sơ. Trường hợp chưa rõ kết quả cần được đối chiếu trước khi thực hiện khoản hoàn khác.'] },
    ],
  },
  {
    slug: 'chinh-sach-giao-hang', title: 'Chính sách giao hàng', icon: 'delivery',
    summary: 'Thông tin nhận hàng rõ ràng, tiến độ dễ theo dõi và thời gian dự kiến dựa trên tuyến đường.',
    action: { to: '/don-hang', label: 'Theo dõi đơn hàng của bạn' },
    sections: [
      { title: 'Địa điểm và thời gian phục vụ', paragraphs: ['Cửa hàng xuất phát mặc định là 123 Đinh Tiên Hoàng, Quận 1, Thành phố Hồ Chí Minh. Giờ tư vấn từ 7h đến 20h; khung giờ giao hàng công bố từ 7h30 đến 20h. Khả năng giao đến địa chỉ cụ thể được cửa hàng kiểm tra khi xử lý đơn.'] },
      { title: 'Cung cấp thông tin nhận hàng', bullets: ['Nhập họ tên, số điện thoại có thể liên hệ và địa chỉ đầy đủ, gồm số nhà, đường, phường/xã và tỉnh/thành phố.', 'Kiểm tra vị trí được tìm từ địa chỉ. Nếu cần, chọn vị trí được gợi ý hoặc cung cấp điểm ghim bản đồ chính xác.', 'Nếu có yêu cầu thay đổi địa chỉ hoặc giờ nhận sau khi đặt đơn, liên hệ cửa hàng để kiểm tra khả năng điều chỉnh trước khi bàn giao vận chuyển.'] },
      { title: 'Theo dõi thời gian giao dự kiến', paragraphs: ['Khi ghi nhận đơn vị vận chuyển đã lấy hàng, hệ thống tính thời gian di chuyển từ cửa hàng đến vị trí nhận, sau đó hiển thị giờ đến dự kiến trong chi tiết đơn.'], bullets: ['Giờ đến là dự kiến, có thể khác thời gian thực tế do giao thông, thời tiết, thời gian liên hệ và nhận hàng.', 'Tuyến đường đang tính là từ cửa hàng đến điểm nhận; chưa bao gồm trung chuyển hoặc các điểm dừng giao đơn khác của đơn vị vận chuyển.', 'Nếu vị trí chưa rõ hoặc chưa lấy được tuyến đường, trạng thái sẽ là đang cập nhật; cửa hàng không tự đặt một giờ đến cố định.'] },
      { title: 'Phí giao hàng và kiểm tra khi nhận', bullets: ['Kiểm tra phí giao hàng và tổng tiền hiển thị ở bước thanh toán trước khi xác nhận. Không mặc định mọi đơn đều được miễn phí.', 'Khi nhận, đối chiếu sản phẩm, quy cách, số lượng và tình trạng bao bì. Với đơn COD, thanh toán số tiền cần thu còn lại theo đơn.', 'Nếu giao không thành công hoặc có bất thường, theo dõi ghi nhận trong đơn và gửi phản hồi để cửa hàng hỗ trợ.'] },
    ],
  },
  {
    slug: 'chinh-sach-bao-mat', title: 'Chính sách bảo mật thông tin', icon: 'privacy',
    summary: 'Hiểu thông tin nào được sử dụng khi bạn mua sắm và cách liên hệ để được hỗ trợ.',
    action: { to: '/tai-khoan', label: 'Quản lý thông tin tài khoản' },
    sections: [
      { title: 'Thông tin phục vụ mua hàng', bullets: ['Thông tin tài khoản và liên hệ như họ tên, email, số điện thoại, địa chỉ nhận hàng.', 'Thông tin đơn hàng, kết quả thanh toán, điểm thưởng, voucher và lịch sử xử lý sau mua.', 'Nội dung đánh giá, phản hồi, trao đổi và ảnh bạn chủ động gửi.', 'Vị trí nhận hàng được chọn được lưu cùng đơn để hỗ trợ xác định tuyến đường và thời gian giao dự kiến.'] },
      { title: 'Mục đích sử dụng và bên hỗ trợ xử lý', paragraphs: ['Thông tin được sử dụng để xác nhận tài khoản, xử lý đơn, giao hàng, thanh toán, quản lý ưu đãi và giải quyết các yêu cầu của bạn. Nhân viên tiếp cận thông tin theo chức năng được phân công.'], bullets: ['Đơn vị vận chuyển cần thông tin liên hệ và địa điểm nhận để giao hàng.', 'Đơn vị thanh toán xử lý các bước xác thực giao dịch; dịch vụ bản đồ xử lý địa điểm để tìm tuyến giao.', 'Ảnh được tải lên có thể được xử lý qua dịch vụ lưu trữ ảnh mà cửa hàng sử dụng. Chỉ gửi ảnh liên quan, tránh đưa giấy tờ hoặc thông tin riêng tư không cần thiết vào hình.'] },
      { title: 'Tài khoản và dữ liệu trên trình duyệt', paragraphs: ['Trình duyệt sử dụng thông tin đăng nhập, giỏ hàng, sản phẩm yêu thích và các lựa chọn để duy trì trải nghiệm mua sắm. Hãy đăng xuất khi sử dụng thiết bị chung.'], bullets: ['Không cung cấp mật khẩu, mã OTP, mã PIN hoặc mã bảo mật thẻ cho nhân viên qua tin nhắn.', 'Nhập thông tin xác thực thanh toán tại trang của đơn vị thanh toán và kiểm tra địa chỉ trang trước khi tiếp tục.'] },
      { title: 'Tra cứu, cập nhật và yêu cầu hỗ trợ', paragraphs: ['Bạn có thể cập nhật các thông tin được hỗ trợ trong mục Tài khoản và xem lịch sử đơn, điểm, phản hồi của mình. Với yêu cầu truy cập, chỉnh sửa hoặc xóa thông tin khác, liên hệ cửa hàng qua Phản hồi & hỗ trợ hoặc email.'], bullets: ['Việc xử lý yêu cầu cần xác minh chủ tài khoản và đối chiếu các đơn hoặc hồ sơ đang giải quyết.', 'Dữ liệu giao dịch và hồ sơ hỗ trợ được lưu để theo dõi quá trình xử lý, đối chiếu thanh toán và giải quyết yêu cầu liên quan. Phạm vi xử lý cụ thể được trao đổi với bạn khi tiếp nhận.'] },
    ],
  },
  {
    slug: 'phuong-thuc-thanh-toan', title: 'Phương thức thanh toán', icon: 'payment',
    summary: 'Chọn hình thức khả dụng khi đặt hàng và theo dõi kết quả trong đơn của bạn.',
    action: { to: '/gio-hang', label: 'Xem giỏ hàng & thanh toán' },
    sections: [
      { title: 'Các hình thức thanh toán', bullets: ['COD: thanh toán khoản cần thu khi nhận hàng.', 'VNPay: thực hiện các bước thanh toán và xác thực tại trang VNPay.', 'VietQR: quét mã hiển thị cho đơn và chuyển đúng số tiền, đúng nội dung hướng dẫn.', 'Stripe: thanh toán bằng phương thức được cung cấp tại trang thanh toán Stripe.', 'PayPal: đăng nhập hoặc xác thực theo hướng dẫn trên trang PayPal.'], paragraphs: ['Danh sách khả dụng thực tế được hiển thị ở bước thanh toán. Một phương thức có thể tạm thời chưa được cung cấp.'] },
      { title: 'Kiểm tra trước khi xác nhận', bullets: ['Xem sản phẩm, số lượng, địa chỉ, ưu đãi, điểm đã dùng và tổng tiền cuối cùng.', 'Không sửa số tiền hoặc nội dung chuyển khoản được chỉ định cho giao dịch VietQR.', 'Nếu giao dịch có thời hạn, hoàn thành trong thời gian được hướng dẫn. Không thanh toán lại ngay khi kết quả của lần trước chưa rõ.'] },
      { title: 'Khi nào đơn được xác nhận đã thanh toán?', paragraphs: ['Sau khi quay về cửa hàng, kết quả được tự động kiểm tra. Đơn chỉ hiển thị đã thanh toán khi cửa hàng nhận được kết quả xác nhận phù hợp.'], bullets: ['Nếu còn chờ thanh toán hoặc chờ đối chiếu, hãy mở lại chi tiết đơn để xem cập nhật.', 'Nếu tài khoản đã bị trừ tiền nhưng đơn chưa cập nhật, gửi mã đơn, thời gian và mã giao dịch cho cửa hàng. Không gửi OTP hoặc đầy đủ thông tin thẻ.', 'Ảnh chụp chuyển khoản hoặc việc đóng trang thanh toán chưa tự xác nhận giao dịch thành công.'] },
      { title: 'Hủy đơn đã trả tiền và hoàn tiền', paragraphs: ['Đơn đã thanh toán cần được cửa hàng đối chiếu khi có yêu cầu hủy hoặc hoàn. Việc đổi trả và hoàn tiền được thực hiện theo phương án đã được xác nhận; không phải mọi giao dịch đều được tự động hoàn về cổng ban đầu.'] },
    ],
  },
  {
    slug: 'huong-dan-mua-hang', title: 'Hướng dẫn mua hàng', icon: 'shopping',
    summary: 'Từ chọn món đến theo dõi đơn, mọi bước đều có thể thực hiện ngay trên cửa hàng.',
    action: { to: '/san-pham', label: 'Bắt đầu chọn sản phẩm' },
    sections: [
      { title: 'Chọn sản phẩm và quy cách', steps: ['Tìm theo tên hoặc mã sản phẩm, hoặc mở danh mục phù hợp.', 'Xem mô tả, nguồn gốc, chứng nhận, giá và số lượng còn có thể mua của quy cách đang chọn.', 'Chọn quy cách, số lượng rồi thêm vào giỏ. Có thể bấm trái tim để lưu sản phẩm yêu thích.'] },
      { title: 'Kiểm tra giỏ và sử dụng ưu đãi', bullets: ['Chọn những sản phẩm muốn thanh toán; sản phẩm chưa chọn được giữ lại trong giỏ.', 'Chọn mã ưu đãi hoặc combo và xem điều kiện về sản phẩm, số lượng, hạn sử dụng, giá trị đơn.', 'Nếu dùng điểm, chọn trừ điểm trực tiếp hoặc sử dụng voucher đã đổi. Kiểm tra kết quả giảm và tổng tiền trước khi tiếp tục.', 'Thêm vào giỏ chưa giữ tồn kho; số lượng còn bán được kiểm tra lại khi đặt hàng.'] },
      { title: 'Đặt hàng và thanh toán', steps: ['Đăng nhập tài khoản khách hàng để tiếp tục đặt đơn.', 'Nhập người nhận, số điện thoại, địa chỉ và kiểm tra vị trí nhận được chọn.', 'Chọn phương thức thanh toán khả dụng, xem tổng tiền rồi xác nhận đặt hàng.', 'Với thanh toán trực tuyến, làm theo hướng dẫn của đơn vị thanh toán và quay về cửa hàng để xem kết quả.'] },
      { title: 'Theo dõi, hủy và hỗ trợ sau mua', bullets: ['Vào Đơn hàng để xem trạng thái, hành trình và giờ giao dự kiến khi đã có kết quả tính.', 'Nút hủy chỉ xuất hiện khi đơn còn đủ điều kiện. Đơn đã trả tiền hoặc đã chuyển sang bước xử lý tiếp theo cần cửa hàng hỗ trợ.', 'Khi đơn hoàn tất, bạn có thể đánh giá sản phẩm đã mua. Đánh giá đang tồn tại không được sửa; có thể xóa và gửi lại sau khi việc xóa được xác nhận.', 'Nếu có vấn đề, mở yêu cầu Đổi/Trả từ đơn hoặc vào Phản hồi & hỗ trợ để trao đổi với cửa hàng.'] },
    ],
  },
  {
    slug: 'dieu-khoan-dich-vu', title: 'Điều khoản sử dụng', icon: 'terms',
    summary: 'Những thông tin cần biết khi sử dụng tài khoản, đặt mua và trao đổi với cửa hàng.',
    action: { to: '/phan-hoi', label: 'Liên hệ hỗ trợ' },
    sections: [
      { title: 'Thông tin tài khoản và đặt hàng', paragraphs: ['Cung cấp thông tin liên hệ chính xác và bảo vệ tài khoản của bạn. Kiểm tra sản phẩm, quy cách, địa chỉ, phương thức thanh toán và tổng tiền trước khi gửi đơn. Không sử dụng tài khoản của người khác khi chưa được phép.'] },
      { title: 'Giá bán, số lượng và ưu đãi', bullets: ['Giá và số lượng có thể thay đổi trước khi đơn được ghi nhận. Kiểm tra báo giá cuối cùng tại bước thanh toán.', 'Ưu đãi chỉ áp dụng khi đáp ứng điều kiện đang công bố. Một mã không được dùng vượt lượt cho phép hoặc áp dụng trùng trái điều kiện.', 'Chứng nhận được đối chiếu theo hồ sơ của từng sản phẩm; không mặc định tất cả sản phẩm có cùng chứng nhận.'] },
      { title: 'Giao nhận và xử lý yêu cầu', paragraphs: ['Theo dõi trạng thái đơn và phối hợp với cửa hàng khi cần xác minh nhận hàng, thanh toán hoặc đổi trả. Giờ giao được ghi rõ là dự kiến khi chưa có kết quả giao thực tế. Các thay đổi và phương án hỗ trợ được trao đổi trong đơn hoặc hồ sơ liên quan.'] },
      { title: 'Đánh giá và nội dung gửi lên', bullets: ['Nội dung cần liên quan đến sản phẩm, đơn hàng hoặc yêu cầu hỗ trợ; không đăng thông tin giả mạo hoặc thông tin riêng tư của người khác.', 'Sử dụng ảnh mà bạn có quyền cung cấp, ưu tiên ảnh rõ tình trạng thực tế khi gửi bằng chứng.', 'Bạn có thể liên hệ cửa hàng khi cần làm rõ điều kiện áp dụng hoặc yêu cầu kiểm tra lại một kết quả xử lý.'] },
    ],
  },
];

export const policyPath = slug => `/${slug}`;
