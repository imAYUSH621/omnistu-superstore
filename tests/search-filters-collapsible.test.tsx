import { renderToString } from 'react-dom/server';
import SearchFiltersCollapsible from '@/components/shared/search/search-filters-collapsible';

describe('SearchFiltersCollapsible', () => {
  const html = renderToString(
    <SearchFiltersCollapsible>
      <div>facets-here</div>
    </SearchFiltersCollapsible>,
  );

  it('renders a mobile Filters toggle wired to the panel', () => {
    expect(html).toContain('Filters');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('aria-controls="search-filters-panel"');
    // Toggle is mobile-only
    expect(html).toMatch(/<button[^>]*class="[^"]*md:hidden/);
  });

  it('hides the panel by default on mobile but keeps it visible on md+', () => {
    expect(html).toContain('id="search-filters-panel"');
    expect(html).toMatch(/id="search-filters-panel" class="hidden md:block/);
    expect(html).toContain('facets-here');
  });
});
