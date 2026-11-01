import { formatResultsCount } from '@/components/shared/search/search-results-header';

describe('formatResultsCount', () => {
  it('says No results instead of the nonsense "1-0 of 0" when empty', () => {
    expect(formatResultsCount(0)).toBe('No results');
  });
  it('handles a single result', () => {
    expect(formatResultsCount(1)).toBe('Showing 1-1 of 1 results');
  });
  it('handles many results', () => {
    expect(formatResultsCount(31)).toBe('Showing 1-24 of 31 results');
  });
});

describe('formatResultsCount with pages', () => {
  it('shows the real total, not the page length', () => {
    expect(formatResultsCount(110, 1, 24)).toBe('Showing 1-24 of 110 results');
    expect(formatResultsCount(110, 2, 24)).toBe('Showing 25-48 of 110 results');
    expect(formatResultsCount(110, 5, 24)).toBe('Showing 97-110 of 110 results');
  });
  it('does not print an impossible range for a page past the end', () => {
    expect(formatResultsCount(10, 3, 24)).toBe('10 results');
  });
});
