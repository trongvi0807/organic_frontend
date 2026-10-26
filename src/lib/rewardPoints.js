export function validateRewardPoints(value, rewards) {
  if (!/^\d+$/.test(String(value)) || !Number.isSafeInteger(Number(value))) throw new Error('Điểm đổi phải là số nguyên từ 0 trở lên.');
  const points = Number(value);
  if (points === 0) return 0;
  if (!rewards || !Number.isInteger(rewards.available) || !Number.isInteger(rewards.redeemLimit)) throw new Error('Chưa kiểm tra được điểm thưởng. Vui lòng tải lại rồi thử lại.');
  if (rewards.available <= 0) throw new Error('Bạn chưa có điểm khả dụng để đổi. Điểm được tích từ đơn hàng đã hoàn tất.');
  if (points > rewards.available) throw new Error(`Bạn chỉ có ${rewards.available} điểm khả dụng. Vui lòng nhập lại.`);
  if (points > Math.min(50, rewards.redeemLimit)) throw new Error(`Mỗi đơn chỉ được đổi tối đa ${Math.min(50, rewards.redeemLimit)} điểm.`);
  return points;
}
