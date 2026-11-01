/**
 * Omnistu Services catalog (data only). Intentionally EMPTY until the real,
 * owner-approved service list is supplied: no invented offerings, prices or
 * claims. The /services page renders an honest holding state when empty and
 * a category grid as soon as entries are added here.
 */
export interface ServiceItem {
  slug: string;
  title: string;
  summary: string;
}
export const SERVICES: ServiceItem[] = [];
