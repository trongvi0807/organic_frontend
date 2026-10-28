export function nextRecordCode(rows, field, prefix) {
  if (!/^[A-Z][A-Z0-9_-]{0,9}$/.test(prefix)) throw new Error('Tiền tố mã phải bắt đầu bằng chữ, tối đa 10 ký tự A–Z, 0–9, _ hoặc -.');
  const pattern = new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\d+)$`, 'i');
  let maximum = 0;
  for (const row of rows) { const match = pattern.exec(row[field] || ''); if (match) { const number = Number(match[1]); if (!Number.isSafeInteger(number)) throw new Error('Dãy mã đã vượt giới hạn an toàn.'); maximum = Math.max(maximum, number); } }
  if (maximum >= 999999999) throw new Error('Dãy mã đã đạt giới hạn. Vui lòng đổi tiền tố mã.');
  return `${prefix}${String(maximum + 1).padStart(2, '0')}`;
}
