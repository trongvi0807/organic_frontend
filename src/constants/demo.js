export const demoCategories = [
  { id: 'vegetables', categoryCode: 'RAU_CU', categoryName: 'Rau củ hữu cơ', description: 'Tươi ngon từ nông trại mỗi ngày', status: 'active', image: '/images/vegetables.jpg', icon: 'Carrot' },
  { id: 'fruits', categoryCode: 'TRAI_CAY', categoryName: 'Trái cây tươi', description: 'Ngọt lành, trọn vị tự nhiên', status: 'active', image: '/images/avocado.jpg', icon: 'Apple' },
  { id: 'grains', categoryCode: 'HAT', categoryName: 'Ngũ cốc & hạt', description: 'Năng lượng lành mạnh cho bạn', status: 'active', image: '/images/nuts.jpg', icon: 'Wheat' },
  { id: 'tea', categoryCode: 'TRA', categoryName: 'Trà & thảo mộc', description: 'Một chút thư thái mỗi ngày', status: 'active', image: '/images/tea.jpg', icon: 'Coffee' },
  { id: 'pantry', categoryCode: 'GIA_VI', categoryName: 'Gia vị & đồ khô', description: 'Chăm chút từng bữa cơm nhà', status: 'active', image: '/images/oil.jpg', icon: 'CookingPot' },
  { id: 'dairy', categoryCode: 'SUA', categoryName: 'Sữa & dinh dưỡng', description: 'Dưỡng chất từ thiên nhiên', status: 'active', image: '/images/milk.jpg', icon: 'Milk' },
];

export const demoProducts = [
  { id: 'p1', productCode: 'MOC-001', productName: 'Bơ sáp hữu cơ Đắk Lắk', slug: 'bo-sap-huu-co', categoryId: 'fruits', categoryName: 'Trái cây tươi', minPrice: 89000, compareAtPrice: 105000, unit: '500g', stock: 48, status: 'active', organicClaimStatus: 'verified', imageUrl: '/images/avocado.jpg', description: 'Bơ sáp dẻo béo, được chọn lựa từ nông trại hữu cơ. Dữ liệu minh họa.', badge: 'Bán chạy' },
  { id: 'p2', productCode: 'MOC-002', productName: 'Cà rốt hữu cơ Đà Lạt', slug: 'ca-rot-huu-co', categoryId: 'vegetables', categoryName: 'Rau củ hữu cơ', minPrice: 45000, unit: '500g', stock: 62, status: 'active', organicClaimStatus: 'verified', imageUrl: '/images/carrots.jpg', description: 'Cà rốt tươi, giòn ngọt tự nhiên, phù hợp cho bữa ăn gia đình. Dữ liệu minh họa.' },
  { id: 'p3', productCode: 'MOC-003', productName: 'Dâu tây hữu cơ Đà Lạt', slug: 'dau-tay-huu-co', categoryId: 'fruits', categoryName: 'Trái cây tươi', minPrice: 129000, compareAtPrice: 155000, unit: '250g', stock: 15, status: 'active', organicClaimStatus: 'verified', imageUrl: '/images/strawberries.jpg', description: 'Dâu tây được thu hoạch và tuyển chọn cẩn thận. Dữ liệu minh họa.', badge: '-17%' },
  { id: 'p4', productCode: 'MOC-004', productName: 'Hạnh nhân nguyên hạt', slug: 'hanh-nhan-nguyen-hat', categoryId: 'grains', categoryName: 'Ngũ cốc & hạt', minPrice: 165000, unit: '250g', stock: 32, status: 'active', organicClaimStatus: 'verified', imageUrl: '/images/nuts.jpg', description: 'Hạnh nhân thơm bùi, không tẩm gia vị. Dữ liệu minh họa.' },
  { id: 'p5', productCode: 'MOC-005', productName: 'Trà thảo mộc an nhiên', slug: 'tra-thao-moc-an-nhien', categoryId: 'tea', categoryName: 'Trà & thảo mộc', minPrice: 125000, unit: '20 túi', stock: 0, status: 'active', organicClaimStatus: 'pending', imageUrl: '/images/tea.jpg', description: 'Hương thảo mộc nhẹ nhàng cho những phút thư giãn. Dữ liệu minh họa.' },
  { id: 'p6', productCode: 'MOC-006', productName: 'Dầu olive nguyên chất', slug: 'dau-olive-nguyen-chat', categoryId: 'pantry', categoryName: 'Gia vị & đồ khô', minPrice: 249000, unit: '500ml', stock: 8, status: 'active', organicClaimStatus: 'verified', imageUrl: '/images/oil.jpg', description: 'Dầu olive dùng cho salad và chế biến món ăn. Dữ liệu minh họa.' },
  { id: 'p7', productCode: 'MOC-007', productName: 'Sữa hạt thuần thực vật', slug: 'sua-hat-thuan-thuc-vat', categoryId: 'dairy', categoryName: 'Sữa & dinh dưỡng', minPrice: 59000, unit: '1 lít', stock: 24, status: 'active', organicClaimStatus: 'pending', imageUrl: '/images/milk.jpg', description: 'Lựa chọn thực vật cho thực đơn mỗi ngày. Dữ liệu minh họa.' },
  { id: 'p8', productCode: 'MOC-008', productName: 'Giỏ rau xanh theo mùa', slug: 'gio-rau-xanh', categoryId: 'vegetables', categoryName: 'Rau củ hữu cơ', minPrice: 99000, unit: '1 giỏ', stock: 20, status: 'draft', organicClaimStatus: 'pending', imageUrl: '/images/vegetables.jpg', description: 'Rau xanh theo mùa từ nông trại. Dữ liệu minh họa.' },
];
export const DEMO_ACCOUNTS = [
  { username: 'admin', password: 'Admin@123', fullName: 'Quản trị viên', roles: ['ADMIN'] },
  { username: 'khachhang', password: 'Khach@123', fullName: 'Bạn của Mộc', roles: ['CUSTOMER'] },
];
