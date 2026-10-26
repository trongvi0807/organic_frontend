export const HIGHLIGHT_SECTIONS = [
  { id: 'tieu-chuan', label: 'Từ đất lành', short: 'Canh tác' },
  { id: 'chung-nhan', label: 'Rõ chứng nhận', short: 'Chứng nhận' },
  { id: 'dinh-duong', label: 'Trọn bữa ngon', short: 'Dinh dưỡng' },
  { id: 'bao-bi', label: 'Nhẹ dấu chân', short: 'Bao bì xanh' },
];

export const FARMING_STANDARDS = [
  { icon: 'sprout', title: 'Kiểm soát từ đầu vào', text: 'Tìm hiểu vật tư và điều kiện canh tác theo tiêu chuẩn được ghi trong hồ sơ. Mỗi lựa chọn bắt đầu từ thông tin rõ ràng.', detail: 'Đối chiếu tiêu chuẩn áp dụng', tone: 'green' },
  { icon: 'water', title: 'Chăm chút đất & nước', text: 'Ưu tiên thông tin về vùng sản xuất, cơ sở canh tác và cách quản lý nguồn đất, nước — những yếu tố tạo nên nền tảng của mùa vụ.', detail: 'Tìm hiểu vùng sản xuất', tone: 'cream' },
  { icon: 'route', title: 'Theo dấu từng chặng', text: 'Kết nối sản phẩm với nguồn gốc, cơ sở sản xuất và tài liệu chứng nhận được công bố để bạn có thể tìm hiểu trước khi mua.', detail: 'Xem hồ sơ từng sản phẩm', tone: 'wood' },
];

// Educational references, not certifications claimed by Mộc or its entire catalogue.
export const STANDARD_REFERENCES = [
  { name: 'USDA Organic', region: 'HOA KỲ', mark: 'USDA', description: 'Nhãn hữu cơ theo yêu cầu sản xuất, xử lý và ghi nhãn của USDA. Kiểm tra phạm vi chứng nhận của từng sản phẩm.', href: 'https://www.ams.usda.gov/rules-regulations/organic/labeling', linkLabel: 'Tìm hiểu từ USDA' },
  { name: 'EU Organic', region: 'LIÊN MINH CHÂU ÂU', mark: 'EU', description: 'Nhãn hữu cơ của Liên minh châu Âu. Trên nhãn có thông tin cơ quan kiểm soát và nguồn nguyên liệu nông nghiệp.', href: 'https://agriculture.ec.europa.eu/farming/organic-farming/organic-logo_en', linkLabel: 'Tìm hiểu từ EU' },
  { name: 'VietGAP', region: 'VIỆT NAM', mark: 'GAP', description: 'Thực hành nông nghiệp tốt. VietGAP và chứng nhận hữu cơ là các hệ tiêu chuẩn khác nhau; hãy đọc đúng hồ sơ được công bố.', href: 'https://tieuchuan.vsqi.gov.vn/tim-kiem?ic%5B%5D=65.020', linkLabel: 'Tra cứu tại VSQI' },
];

export const PACKAGING_TIPS = [
  { id: 'reduce', label: 'Giảm bớt', icon: 'bag', title: 'Vừa đủ bao bì, trọn vẹn lựa chọn.', text: 'Định hướng của Mộc là ưu tiên cách đóng gói vừa đủ và hạn chế vật liệu dùng một lần khi phù hợp với yêu cầu bảo quản thực phẩm.', tips: ['Chọn quy cách vừa với nhu cầu sử dụng.', 'Mang túi dùng lại khi ghé mua trực tiếp.', 'Tìm hiểu vật liệu bao bì trước khi lựa chọn.'] },
  { id: 'reuse', label: 'Dùng lại', icon: 'reuse', title: 'Một chiếc túi, thêm nhiều hành trình.', text: 'Những vật dụng còn phù hợp có thể tiếp tục được sử dụng. Giữ túi mua sắm để dùng cho lần ghé cửa hàng tiếp theo.', tips: ['Bảo quản túi dùng lại sạch và khô.', 'Chỉ tái sử dụng vật chứa khi phù hợp với hướng dẫn của nhà sản xuất.', 'Ưu tiên vật dụng bền và có thể dùng nhiều lần.'] },
  { id: 'sort', label: 'Phân loại', icon: 'recycle', title: 'Đọc đúng nhãn, phân loại đúng cách.', text: 'Khả năng tái chế hoặc ủ phân phụ thuộc vật liệu và điều kiện tiếp nhận tại địa phương. Bao bì ghi “compostable” có thể cần cơ sở ủ công nghiệp.', tips: ['Đọc hướng dẫn xử lý trên bao bì.', 'Kiểm tra loại vật liệu mà điểm thu gom tiếp nhận.', 'Không mặc định bao bì phân hủy sinh học có thể ủ tại nhà.'] },
];

export const HIGHLIGHT_SOURCES = {
  nutrition: 'https://www.who.int/en/news-room/fact-sheets/detail/healthy-diet',
  packaging: 'https://www.epa.gov/trash-free-waters/frequently-asked-questions-about-plastic-recycling-and-composting',
};
