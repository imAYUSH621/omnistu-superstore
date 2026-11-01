import { catalogSource } from '@/lib/utils';
import CategoryQuadsGrid from './category-quads-grid';

// Server component on purpose: the quads are bundled sample-catalog links. In
// database mode they would point at products that do not exist there, so they
// are not rendered. The mode is only knowable on the server (a client component
// cannot see DATABASE_URL and would always look like sample mode).
export default function CategoryQuads() {
  if (catalogSource() !== 'sample') return null;
  return <CategoryQuadsGrid />;
}
