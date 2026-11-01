import { isTestFixtureSlug } from '@/lib/test-fixture';
describe('isTestFixtureSlug', () => {
  it('flags fixture and staging prefixes only', () => {
    expect(isTestFixtureSlug('fxt-abc-a')).toBe(true);
    expect(isTestFixtureSlug('cjstg-2113186157915250689')).toBe(true);
    expect(isTestFixtureSlug('royal-kashmiri-mongra-saffron')).toBe(false);
    expect(isTestFixtureSlug(undefined)).toBe(false);
  });
});
