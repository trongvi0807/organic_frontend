// Contact information supplied by the store; missing channels stay unpublished.
export const FOOTER_CONFIG = {
  address: '36 Trịnh Đình Trọng, Phường Tân Phú',
  phone: '0344855913',
  phoneDisplay: '0344 855 913',
  hours: 'Liên hệ hotline để được tư vấn',
  hoursDemo: false,
  company: { name: 'Mộc Organic', description: 'Không gian thực phẩm xanh và những lựa chọn lành cho mỗi ngày.', taxCode: 'Đang cập nhật', demo: false },
  emails: [],
  socialLinks: [
    { platform: 'facebook', label: 'Facebook', href: null, demo: false },
    { platform: 'instagram', label: 'Instagram', href: null, demo: false },
    { platform: 'youtube', label: 'YouTube', href: null, demo: false },
  ],
  paymentMethods: [
    { id: 'cash', label: 'COD', description: 'Thanh toán khi nhận hàng' },
    { id: 'card', label: 'Stripe', description: 'Thẻ quốc tế qua Stripe Checkout khi cổng được bật' },
    { id: 'wallet', label: 'PayPal', description: 'PayPal khi cổng được bật' },
    { id: 'bank', label: 'VNPay', description: 'VNPay khi cổng được bật' },
  ],
  paymentDemo: false,
  // Only add verification badges after receiving a genuine document and a public verification URL.
  verificationBadges: [],
};

export const FOOTER_TOPICS = {
  greenLiving: { title: 'Ăn lành mỗi ngày', description: 'Một trang nhật ký nhỏ về những lựa chọn thường ngày.', steps: [
    ['Bắt đầu từ bữa ăn của bạn', 'Chọn sản phẩm phù hợp với nhu cầu, quy cách và cách chế biến của gia đình. Đọc kỹ nhãn, thành phần và hướng dẫn bảo quản được công bố.'],
    ['Một chút vừa đủ', 'Cân nhắc số lượng trước khi mua và ưu tiên sử dụng thực phẩm đã có. Những bài viết và câu chuyện từ cửa hàng sẽ được bổ sung sau.'],
  ], demo: false },
  organicGuide: { title: 'Hiểu hơn về organic', description: 'Khởi đầu từ thông tin có thể đối chiếu.', steps: [
    ['Xem nguồn gốc', 'Kiểm tra quốc gia, vùng sản xuất và cơ sở được liên kết với từng sản phẩm.'],
    ['Đọc chứng nhận', 'Đối chiếu tổ chức cấp, số hồ sơ, thời hạn và tài liệu công bố. Không mặc định mọi sản phẩm có cùng một chứng nhận.'],
  ], demo: false },
  offers: { title: 'Tin tức & ưu đãi', description: 'Những cập nhật và trải nghiệm mới cùng Mộc.', steps: [
    ['Ưu đãi chính thức', 'Chương trình khuyến mãi thật sẽ được công bố khi cửa hàng xác nhận điều kiện và thời gian áp dụng.'],
    ['Áp dụng vào đơn hàng', 'Chọn sản phẩm vào giỏ hàng, áp dụng mã ưu đãi rồi kiểm tra số tiền giảm trước khi thanh toán.'],
  ], demo: false },
  shopping: { title: 'Hướng dẫn mua hàng', description: 'Tìm hiểu sản phẩm và chuẩn bị những lựa chọn của bạn.', steps: [
    ['Khám phá sản phẩm', 'Tìm sản phẩm theo tên hoặc danh mục. Mở trang chi tiết để xem ảnh, thông tin nguồn gốc và chứng nhận.'],
    ['Chọn quy cách phù hợp', 'So sánh giá và khối lượng, chọn quy cách rồi thêm sản phẩm vào giỏ hàng.'],
    ['Kiểm tra giỏ hàng', 'Chọn những sản phẩm muốn mua, điều chỉnh số lượng và xem lại tổng tiền trước khi tiếp tục.'],
    ['Xác nhận đơn', 'Đăng nhập tài khoản khách, nhập thông tin nhận hàng và chọn phương thức thanh toán. Kiểm tra lại đơn rồi bấm THANH TOÁN. Theo dõi trong mục Đơn hàng.'],
  ] },
  membership: { title: 'Chương trình thành viên', description: 'Một tài khoản để chăm chút những lựa chọn của bạn.', steps: [
    ['Tạo tài khoản', 'Đăng ký thành viên để quản lý thông tin cá nhân và địa chỉ của bạn.'],
    ['Điểm thưởng', 'Xem số dư và lịch sử tại mục Điểm thưởng. Điểm khả dụng được xác nhận khi kiểm tra đơn hàng, điểm tích lũy được cộng khi đơn hoàn tất đủ điều kiện.'],
  ], demo: false },
  delivery: { title: 'Thông tin giao hàng', description: 'Thông tin nhận hàng và hỗ trợ giao hàng.', steps: [
    ['Xác nhận khu vực nhận hàng', 'Liên hệ cửa hàng và cung cấp khu vực nhận hàng để được tư vấn khả năng phục vụ.'],
    ['Phí và thời gian giao hàng', 'Phí giao hàng và thời gian dự kiến cần được cửa hàng xác nhận trước khi bạn đặt mua. Chưa áp dụng biểu phí hoặc thời hạn cố định trên website.'],
  ], demo: false },
  returns: { title: 'Đổi trả & hoàn tiền', description: 'Liên hệ cửa hàng để được hướng dẫn xử lý vấn đề với sản phẩm.', steps: [
    ['Chuẩn bị thông tin', 'Giữ thông tin mua hàng, ảnh sản phẩm và mô tả vấn đề cần hỗ trợ.'],
    ['Trao đổi với cửa hàng', 'Gọi hotline để được hướng dẫn từng trường hợp. Điều kiện đổi trả, hoàn tiền và thời gian xử lý sẽ được cửa hàng công bố chính thức.'],
  ], demo: false },
  privacy: { title: 'Quyền riêng tư & bảo mật', description: 'Hướng dẫn bảo vệ tài khoản và thông tin cá nhân.', steps: [
    ['Bảo vệ tài khoản của bạn', 'Không chia sẻ mật khẩu hoặc mã xác thực. Đăng xuất sau khi dùng thiết bị công cộng.'],
    ['Thông tin cá nhân', 'Phạm vi sử dụng, thời gian lưu trữ và cách yêu cầu xử lý thông tin cần được công bố trong chính sách chính thức trước khi áp dụng.'],
  ], demo: false },
  personalData: { title: 'Xử lý dữ liệu cá nhân', description: 'Hướng dẫn cập nhật thông tin và liên hệ hỗ trợ.', steps: [
    ['Cập nhật thông tin', 'Bạn có thể xem và cập nhật thông tin được hỗ trợ trong trang Tài khoản.'],
    ['Yêu cầu hỗ trợ', 'Liên hệ hotline của cửa hàng khi cần làm rõ việc sử dụng hoặc xử lý thông tin của bạn. Quy trình chính thức sẽ được công bố sau.'],
  ], demo: false },
  terms: { title: 'Điều khoản sử dụng', description: 'Điều khoản giao dịch chính thức chưa được công bố.', steps: [
    ['Kiểm tra trước khi lựa chọn', 'Đọc kỹ mô tả sản phẩm, quy cách, giá và thông tin nguồn gốc được công bố.'],
    ['Xác nhận giao dịch', 'Kiểm tra thông tin nhận hàng và tổng tiền trước khi đặt đơn. Trạng thái thanh toán được xác nhận từ hệ thống cửa hàng; trang quay về từ cổng không tự xác nhận đã thu tiền.'],
  ], demo: false },
  careers: { title: 'Cùng làm việc với Mộc', description: 'Một không gian làm việc gần hơn với lối sống xanh.', steps: [
    ['Cơ hội đồng hành', 'Mộc đang chuẩn bị chuyên mục tuyển dụng. Danh sách vị trí và kênh ứng tuyển chính thức sẽ được cập nhật sau.'],
  ], demo: false },
};
