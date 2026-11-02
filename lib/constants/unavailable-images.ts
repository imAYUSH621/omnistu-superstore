// Sample-product image files whose photo does NOT depict the product
// (verified visually against a contact sheet, 2026-11-01; tracker D21).
// Two Omnistu-branded demo apparel items were replaced 2026-11-02 with
// clearly labeled concept illustrations (strip on the image itself).
// These render as an explicit neutral "Image unavailable" tile instead of
// a misleading photo, until real photography assets exist. The product
// itself, its name, price and link stay real - no substitution.
const P = '/images/sample-products';

export const UNAVAILABLE_IMAGES: ReadonlySet<string> = new Set([
  `${P}/a2-vedic-desi-gir-cow-cultured-ghee-traditional-bilona-method-grass-fe-1.jpg`,
  `${P}/royal-heritage-indian-festive-sweet-savory-hamper-kaju-katli-gulab-jam-1.jpg`,
  `${P}/smart-titanium-health-fitness-tracking-ring-continuous-heart-rate-slee-1.jpg`,
  `${P}/artisan-matte-ceramic-pour-over-coffee-brewer-station-double-wall-boro-1.jpg`,
  `${P}/precision-aerospace-aluminum-optical-illusion-kinetic-desk-toy-full-sp-1.jpg`,
  `${P}/artisan-laser-cut-wooden-mechanical-gear-treasure-box-3d-self-assembly-1.jpg`,
  `${P}/italian-18k-gold-plated-925-sterling-silver-miami-cuban-link-chain-nec-1.jpg`,
  `${P}/single-estate-darjeeling-first-flush-champagne-tea-100-handpicked-loos-1.jpg`,
  `${P}/japanese-raw-selvedge-denim-overshirt-jacket-14-5oz-kuroki-mill-denim--1.jpg`,
]);

export function isImageUnavailable(src: string | null | undefined): boolean {
  return !!src && UNAVAILABLE_IMAGES.has(src);
}
