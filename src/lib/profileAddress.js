import { savedAddressToForm } from './address';
export function profileAddressPayload(fields, value, data, previous = {}) {
  const ward = data?.wards.find((row) => row.code === value.wardCode && row.provinceCode === value.provinceCode);
  if (!ward || !value.street.trim()) throw new Error('Chọn Tỉnh / Thành phố, Xã / Phường và nhập số nhà - tên đường.');
  if (value.street.trim().length > 255) throw new Error('Số nhà - tên đường tối đa 255 ký tự.');
  // Legacy API requires district. Retain actual historical data; never invent one.
  const old = savedAddressToForm(previous, data);
  const districts = [...new Set((ward.aliases || []).map((alias) => alias[1]).filter(Boolean))];
  const district = previous.district && old.wardCode === ward.code && old.provinceCode === ward.provinceCode ? previous.district : districts.length === 1 ? districts[0] : '';
  if (!district) throw new Error('Địa chỉ này chưa có ánh xạ tương thích với API cũ. Backend cần cho phép địa chỉ hai cấp để lưu; không cần nhập thêm trường địa chỉ nào.');
  return { ...fields, province: ward.province.name, ward: ward.name, district, streetAddress: value.street.trim() };
}
