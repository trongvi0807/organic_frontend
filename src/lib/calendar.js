export function calendarMonth(value) {
  const match = /^(\d{4})-(\d{2})/.exec(value || '');
  if (match) return { year: Number(match[1]), month: Number(match[2]) - 1 };
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: 'numeric' }).formatToParts(new Date()).map((part) => [part.type, part.value]));
  return { year: Number(parts.year), month: Number(parts.month) - 1 };
}
export function calendarDays(year, month) {
  const offset = (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7;
  const count = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return Array.from({ length: Math.ceil((offset + count) / 7) * 7 }, (_, index) => {
    const day = index - offset + 1;
    return day < 1 || day > count ? null : `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  });
}
