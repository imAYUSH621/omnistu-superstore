import { formatResultsCount } from '@/components/shared/search/search-results-header';

describe('formatResultsCount', () => {
  it('says No results instead of the nonsense "1-0 of 0" when empty', () => {
    expect(formatResultsCount(0)).toBe('No results');
  });
  it('handles a single result', () => {
    expect(formatResultsCount(1)).toBe('Showing 1-1 of 1 results');
  });
  it('handles many results', () => {
    expect(formatResultsCount(31)).toBe('Showing 1-31 of 31 results');
  });
});
