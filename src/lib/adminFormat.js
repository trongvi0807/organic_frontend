export function adminDate(value, withTime = false) {
  if (!value) return '—';
  const text = String(value);
  let date = text;
  let time = text.slice(11, 16);
  if (/Z$|[+-]\d\d:\d\d$/.test(text)) {
    const parsed = new Date(text);
    if (Number.isNaN(parsed.getTime())) return '—';
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(parsed).map((part) => [part.type, part.value]));
    date = `${parts.year}-${parts.month}-${parts.day}`; time = `${parts.hour}:${parts.minute}`;
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(date);
  if (!match || !parseAdminDate(`${match[3]}-${match[2]}-${match[1]}`)) return '—';
  return `${match[3]}-${match[2]}-${match[1]}${withTime && /^\d\d:\d\d$/.test(time) ? ` ${time}` : ''}`;
}
export function parseAdminDate(text, withTime = false) {
  const match = (withTime ? /^(\d{2})-(\d{2})-(\d{4}) (\d{2}):(\d{2})$/ : /^(\d{2})-(\d{2})-(\d{4})$/).exec(text);
  if (!match) return '';
  const [, day, month, year, hour = '00', minute = '00'] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (Number(year) < 1900 || date.getUTCDate() !== Number(day) || date.getUTCMonth() !== Number(month) - 1 || Number(hour) > 23 || Number(minute) > 59) return '';
  return `${year}-${month}-${day}${withTime ? `T${hour}:${minute}` : ''}`;
}
export const searchText = (value) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase().trim();
export const matchesSearch = (value, search) => searchText(search).split(/\s+/).every((word) => searchText(value).includes(word));
export function inDateRange(value, from, to) {
  if (!from && !to) return true;
  if (!value) return false;
  const day = parseAdminDate(adminDate(value));
  return !!day && (!from || day >= from) && (!to || day <= to);
}
export const productMeasure = (product) => product?.netQuantity != null && product?.unitId
  ? `${Number(product.netQuantity).toLocaleString('vi-VN')} ${product.unitId}` : product?.variantName || 'Chưa công bố';
export const orderCreator = (order) => order.createdByEmployee?.fullName || order.createdByName || order.createdByAccount?.fullName || 'Chưa có thông tin người lập';
