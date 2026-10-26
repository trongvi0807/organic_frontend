export function validShoppingReturn(value) {
  return value && typeof value.to === 'string' && /^\/(?:san-pham(?:\/[^\s\\?#]*)?)?(?:\?[^\s\\#]*)?(?:#[^\s\\]*)?$/.test(value.to) && Number.isFinite(value.y) && value.y >= 0 && value.y <= 100000 ? value : { to:'/san-pham',y:0 };
}
export function shoppingReturn() { try { return validShoppingReturn(JSON.parse(sessionStorage.getItem('moc.shopping.return'))); } catch { return {to:'/san-pham',y:0}; } }
