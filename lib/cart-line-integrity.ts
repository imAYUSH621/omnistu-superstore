/** Current catalog binds the order lines. Old/forged/stale cart data cannot become a charge. */
export function cartLinesMatchCatalog(lines: {productId:string;qty:number;price:string;slug:string}[], products: {id:string;price:string|number;slug:string}[]): boolean {
  const catalog = new Map(products.map(p => [p.id,p]));
  const ids = new Set<string>();
  return lines.every(line => {
    const product = catalog.get(line.productId);
    if (!product || ids.has(line.productId) || !Number.isSafeInteger(line.qty) || line.qty <= 0) return false;
    ids.add(line.productId);
    const claimed = Number(line.price), current = Number(product.price);
    return Number.isFinite(claimed) && Number.isFinite(current) && current > 0 && claimed === current && line.slug === product.slug;
  });
}

export function cartTotalsConsistent(cart: {items:{price:string;qty:number}[];itemsPrice:string;shippingPrice:string;taxPrice:string;totalPrice:string}): boolean {
  const cents = (s:string) => { const n=Number(s); return Number.isFinite(n) && n >= 0 ? Math.round(n*100) : NaN; };
  const itemTotal = cart.items.reduce((n,i)=>n+cents(i.price)*i.qty,0);
  return Number.isSafeInteger(itemTotal) && itemTotal === cents(cart.itemsPrice) && itemTotal+cents(cart.shippingPrice)+cents(cart.taxPrice)===cents(cart.totalPrice);
}
