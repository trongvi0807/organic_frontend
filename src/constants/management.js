export const modules = {
  customers: {
    title: 'Khách hàng', singular: 'khách hàng', description: 'Chăm sóc hồ sơ khách hàng, thông tin liên hệ và địa chỉ.', nameKey: 'fullName', codeKey: 'customerId', active: 'ACTIVE', inactive: 'INACTIVE',
    fields: [
      { name: 'customerId', label: 'Mã khách hàng', required: true, maxLength: 50 },
      { name: 'fullName', label: 'Họ và tên', required: true, maxLength: 255 },
      { name: 'phoneNumber', label: 'Số điện thoại', required: true, type: 'tel', pattern: '\\+?[0-9]{9,15}', hint: '9–15 chữ số, có thể có dấu + ở đầu.' },
      { name: 'email', label: 'Email', type: 'email', maxLength: 255 },
      { name: 'dateOfBirth', label: 'Ngày sinh', type: 'date', past: true },
      { name: 'membershipStatus', label: 'Hạng thành viên', maxLength: 50, defaultValue: 'REGULAR' },
      { name: 'registrationDate', label: 'Ngày đăng ký', type: 'date', past: true, defaultToday: true },
      { name: 'rewardPoints', label: 'Điểm tích lũy', type: 'number', min: 0, step: 1, defaultValue: 0 },
      { name: 'status', label: 'Trạng thái', options: [['ACTIVE', 'Hoạt động'], ['INACTIVE', 'Ngừng hoạt động']], defaultValue: 'ACTIVE' },
      { name: 'accountId', label: 'ID tài khoản liên kết (UUID)', uuid: true, hint: 'Chỉ liên kết tài khoản có quyền CUSTOMER. Bỏ trống sẽ gỡ liên kết; tạo hồ sơ không tạo tài khoản đăng nhập.' },
    ],
  },
  suppliers: {
    title: 'Nhà cung cấp', singular: 'nhà cung cấp', description: 'Quản lý nguồn cung, người liên hệ, mã số thuế và địa chỉ nhà cung cấp.', nameKey: 'supplierName', codeKey: 'supplierCode', active: 'active', inactive: 'inactive',
    fields: [
      { name: 'supplierCode', label: 'Mã nhà cung cấp tự động', required: true, readOnly: true, maxLength: 50, hint: 'Tự động theo thứ tự NCC01, NCC02… Mã đã lưu được giữ nguyên.' },
      { name: 'supplierName', label: 'Tên nhà cung cấp', required: true, maxLength: 200 },
      { name: 'taxCode', label: 'Mã số thuế', maxLength: 50 },
      { name: 'contactPerson', label: 'Người đại diện / liên hệ', maxLength: 100 },
      { name: 'phoneNumber', label: 'Số điện thoại', type: 'tel', pattern: '\\+?[0-9]{9,15}', maxLength: 16, hint: '9–15 chữ số, có thể có dấu + ở đầu.' },
      { name: 'email', label: 'Email', type: 'email', maxLength: 100 },
      { name: 'address', label: 'Địa chỉ', type: 'textarea', maxLength: 500 },
      { name: 'status', label: 'Trạng thái', options: [['active', 'Hoạt động'], ['inactive', 'Ngừng hoạt động']], defaultValue: 'active' },
    ],
  },
  origins: {
    title: 'Xuất xứ organic', singular: 'xuất xứ', description: 'Kết nối sản phẩm với vùng trồng và cơ sở sản xuất rõ ràng.', nameKey: 'originName', codeKey: 'originCode', active: 'active', inactive: 'inactive',
    fields: [
      { name: 'originCode', label: 'Mã xuất xứ', required: true, maxLength: 50 },
      { name: 'originName', label: 'Tên vùng / cơ sở sản xuất', required: true, maxLength: 200 },
      { name: 'countryCode', label: 'Mã quốc gia', required: true, maxLength: 2, pattern: '[A-Za-z]{2}', hint: 'ISO alpha-2, ví dụ VN, US, AU.', defaultValue: 'VN' },
      { name: 'country', label: 'Quốc gia', required: true, maxLength: 100, defaultValue: 'Việt Nam' },
      { name: 'region', label: 'Tỉnh / vùng', maxLength: 150 },
      { name: 'producerName', label: 'Cơ sở sản xuất', maxLength: 200 },
      { name: 'supplierId', label: 'Nhà cung cấp', supplier: true },
      { name: 'status', label: 'Trạng thái', options: [['active', 'Hoạt động'], ['inactive', 'Ngừng hoạt động']], defaultValue: 'active' },
      { name: 'address', label: 'Địa chỉ', type: 'textarea', maxLength: 500 },
      { name: 'description', label: 'Mô tả', type: 'textarea', maxLength: 5000 },
    ],
  },
  certifications: {
    title: 'Chứng nhận organic', singular: 'chứng nhận', description: 'Quản lý hồ sơ, tài liệu minh chứng và hiệu lực chứng nhận.', nameKey: 'certificateName', codeKey: 'certificateNumber',
    fields: [
      { name: 'certificateName', label: 'Tên chứng nhận', required: true, maxLength: 150 },
      { name: 'certificateNumber', label: 'Số chứng nhận', required: true, maxLength: 100 },
      { name: 'issuingOrganization', label: 'Tổ chức cấp', required: true, maxLength: 200 },
      { name: 'issuedAt', label: 'Ngày cấp', type: 'date', required: true },
      { name: 'expiresAt', label: 'Ngày hết hạn', type: 'date', hint: 'Bỏ trống nếu không đặt thời hạn.' },
    ],
  },
};
export const reviewLabels = { pending: 'Chờ duyệt', verified: 'Đã duyệt', rejected: 'Từ chối', revoked: 'Thu hồi' };
export const validityLabels = { valid: 'Trong thời hạn', expired: 'Đã hết hạn', not_yet_valid: 'Chưa đến ngày cấp', unknown: 'Chưa đủ thông tin ngày' };
