// Public footer content. Replace the demo entries with approved store information before publishing.
export const FOOTER_CONFIG = {
  address: '36 Trịnh Đình Trọng, Phường Tân Phú',
  phone: '0344855913',
  phoneDisplay: '0344 855 913',
  hours: '08:00 – 20:00, Thứ Hai – Chủ nhật',
  hoursDemo: true,
  company: { name: 'Mộc Organic', description: 'Không gian thực phẩm xanh và những lựa chọn lành cho mỗi ngày.', taxCode: 'Đang cập nhật', demo: true },
  // .example is reserved for examples; these addresses are displayed as text, never as mailto links.
  emails: [
    { label: 'Đặt hàng & tư vấn', value: 'chamsoc@mocorganic.example', demo: true },
    { label: 'Hợp tác cùng Mộc', value: 'hoptac@mocorganic.example', demo: true },
  ],
  socialLinks: [
    { platform: 'facebook', label: 'Facebook', href: null, demo: true },
    { platform: 'instagram', label: 'Instagram', href: null, demo: true },
    { platform: 'youtube', label: 'YouTube', href: null, demo: true },
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
  ], demo: true },
  organicGuide: { title: 'Hiểu hơn về organic', description: 'Khởi đầu từ thông tin có thể đối chiếu.', steps: [
    ['Xem nguồn gốc', 'Kiểm tra quốc gia, vùng sản xuất và cơ sở được liên kết với từng sản phẩm.'],
    ['Đọc chứng nhận', 'Đối chiếu tổ chức cấp, số hồ sơ, thời hạn và tài liệu công bố. Không mặc định mọi sản phẩm có cùng một chứng nhận.'],
  ], demo: true },
  offers: { title: 'Tin tức & ưu đãi', description: 'Những cập nhật và trải nghiệm mới cùng Mộc.', steps: [
    ['Ưu đãi chính thức', 'Chương trình khuyến mãi thật sẽ được công bố khi cửa hàng xác nhận điều kiện và thời gian áp dụng.'],
    ['Áp dụng vào đơn hàng', 'Chọn sản phẩm rồi đến bước Thanh toán. Nhập mã và bấm Kiểm tra đơn hàng để xác nhận điều kiện và số tiền giảm.'],
  ], demo: true },
  shopping: { title: 'Hướng dẫn mua hàng', description: 'Tìm hiểu sản phẩm và chuẩn bị những lựa chọn của bạn.', steps: [
    ['Khám phá sản phẩm', 'Tìm sản phẩm theo tên hoặc danh mục. Mở trang chi tiết để xem ảnh, thông tin nguồn gốc và chứng nhận.'],
    ['Chọn quy cách phù hợp', 'So sánh giá và khối lượng, chọn quy cách rồi thêm sản phẩm vào giỏ hàng.'],
    ['Kiểm tra giỏ hàng', 'Chọn những sản phẩm muốn mua, điều chỉnh số lượng và xem lại tổng tiền trước khi tiếp tục.'],
    ['Xác nhận đơn', 'Đăng nhập tài khoản khách, nhập thông tin nhận hàng và chọn phương thức thanh toán. Kiểm tra lại đơn rồi bấm Đặt hàng. Theo dõi trong mục Đơn hàng.'],
  ] },
  membership: { title: 'Chương trình thành viên', description: 'Một tài khoản để chăm chút những lựa chọn của bạn.', steps: [
    ['Tạo tài khoản', 'Đăng ký thành viên để quản lý thông tin cá nhân và địa chỉ của bạn.'],
    ['Điểm thưởng', 'Xem số dư và lịch sử tại mục Điểm thưởng. Điểm khả dụng được xác nhận khi kiểm tra đơn hàng, điểm tích lũy được cộng khi đơn hoàn tất đủ điều kiện.'],
  ], demo: true },
  delivery: { title: 'Thông tin giao hàng', description: 'Nội dung minh họa để hoàn thiện giao diện hỗ trợ.', steps: [
    ['Xác nhận khu vực nhận hàng', 'Liên hệ cửa hàng và cung cấp khu vực nhận hàng để được tư vấn khả năng phục vụ.'],
    ['Phí và thời gian giao hàng', 'Phí giao hàng và thời gian dự kiến cần được cửa hàng xác nhận trước khi bạn đặt mua. Chưa áp dụng biểu phí hoặc thời hạn cố định trên website.'],
  ], demo: true },
  returns: { title: 'Đổi trả & hoàn tiền', description: 'Hướng dẫn liên hệ minh họa; chưa phải chính sách giao dịch chính thức.', steps: [
    ['Chuẩn bị thông tin', 'Giữ thông tin mua hàng, ảnh sản phẩm và mô tả vấn đề cần hỗ trợ.'],
    ['Trao đổi với cửa hàng', 'Gọi hotline để được hướng dẫn từng trường hợp. Điều kiện đổi trả, hoàn tiền và thời gian xử lý sẽ được cửa hàng công bố chính thức.'],
  ], demo: true },
  privacy: { title: 'Quyền riêng tư & bảo mật', description: 'Nội dung mô phỏng; chính sách bảo mật chính thức đang được cập nhật.', steps: [
    ['Bảo vệ tài khoản của bạn', 'Không chia sẻ mật khẩu hoặc mã xác thực. Đăng xuất sau khi dùng thiết bị công cộng.'],
    ['Thông tin cá nhân', 'Phạm vi sử dụng, thời gian lưu trữ và cách yêu cầu xử lý thông tin cần được công bố trong chính sách chính thức trước khi áp dụng.'],
  ], demo: true },
  personalData: { title: 'Xử lý dữ liệu cá nhân', description: 'Nội dung minh họa về kênh hỗ trợ dữ liệu cá nhân.', steps: [
    ['Cập nhật thông tin', 'Bạn có thể xem và cập nhật thông tin được hỗ trợ trong trang Tài khoản.'],
    ['Yêu cầu hỗ trợ', 'Liên hệ hotline của cửa hàng khi cần làm rõ việc sử dụng hoặc xử lý thông tin của bạn. Quy trình chính thức sẽ được công bố sau.'],
  ], demo: true },
  terms: { title: 'Điều khoản sử dụng', description: 'Điều khoản giao dịch chính thức chưa được công bố.', steps: [
    ['Kiểm tra trước khi lựa chọn', 'Đọc kỹ mô tả sản phẩm, quy cách, giá và thông tin nguồn gốc được công bố.'],
    ['Xác nhận giao dịch', 'Kiểm tra thông tin nhận hàng và tổng tiền trước khi đặt đơn. Trạng thái thanh toán được xác nhận từ hệ thống cửa hàng; trang quay về từ cổng không tự xác nhận đã thu tiền.'],
  ], demo: true },
  careers: { title: 'Cùng làm việc với Mộc', description: 'Một không gian làm việc gần hơn với lối sống xanh.', steps: [
    ['Cơ hội đồng hành', 'Mộc đang chuẩn bị chuyên mục tuyển dụng. Danh sách vị trí và kênh ứng tuyển chính thức sẽ được cập nhật sau.'],
  ], demo: true },
};
