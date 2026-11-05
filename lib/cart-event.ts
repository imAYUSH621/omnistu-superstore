/** Legacy drawer messages require a complete item. A qualified-cart refresh
 * carries no legacy item and must never imply reservation or checkout. */
export interface CartToastEventDetail {
  productId: string;
  name: string;
  price: string | number;
  image: string;
  qty: number;
}
export function isCartToastEventDetail(v: unknown): v is CartToastEventDetail {
  if (!v || typeof v !== 'object') return false;
  const d = v as Record<string, unknown>;
  return typeof d.productId === 'string' && d.productId.length > 0 &&
    typeof d.name === 'string' && d.name.trim().length > 0 &&
    typeof d.image === 'string' &&
    (typeof d.price === 'string' || typeof d.price === 'number') &&
    String(d.price).trim().length > 0 && Number.isFinite(Number(d.price)) && Number(d.price) >= 0 &&
    Number.isSafeInteger(d.qty) && Number(d.qty) > 0;
}
