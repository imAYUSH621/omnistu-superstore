import {
  ThemeRegistry,
  assertThemeComplete,
  membershipKey,
  resolveCustomerId,
  type CustomerId,
  type LocalIdentityMapping,
  type NamedTheme,
  type ThemeTokens,
} from '@/lib/foundation';

// Test fixture values only: these are NOT a chosen theme design.
const fixtureTokens = (): ThemeTokens => ({
  color: {
    surface: '#ffffff', surfaceRaised: '#f5f5f5', text: '#111111', textMuted: '#555555',
    action: '#0000ee', actionText: '#ffffff',
    feedbackSuccess: '#008800', feedbackWarning: '#aa6600', feedbackDanger: '#cc0000',
  },
  type: { fontFamily: 'system-ui', scale: { xs: 0.75, sm: 0.875, base: 1, lg: 1.25, xl: 1.5 } },
  spacing: { unit: 4, scale: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } },
  radius: { sm: 4, md: 8, lg: 16 },
});

const fixtureTheme = (name: string): NamedTheme => ({ name, tokens: fixtureTokens() });

describe('theme-token contract', () => {
  it('accepts a complete theme', () => {
    expect(assertThemeComplete(fixtureTheme('fixture')).name).toBe('fixture');
  });

  it('rejects a theme missing a color token, naming the token', () => {
    const broken = fixtureTheme('broken');
    // @ts-expect-error intentionally incomplete for the test
    delete broken.tokens.color.action;
    expect(() => assertThemeComplete(broken)).toThrow('"action"');
  });

  it('rejects a theme missing a type scale step', () => {
    const broken = fixtureTheme('broken');
    // @ts-expect-error intentionally incomplete for the test
    delete broken.tokens.type.scale.lg;
    expect(() => assertThemeComplete(broken)).toThrow('"lg"');
  });

  it('registry is theme-count-agnostic: one or three themes satisfy the same contract', () => {
    const registry = new ThemeRegistry();
    expect(registry.size).toBe(0);
    registry.register(fixtureTheme('one'));
    expect(registry.size).toBe(1);
    registry.register(fixtureTheme('two'));
    registry.register(fixtureTheme('three'));
    expect(registry.names()).toEqual(['one', 'two', 'three']);
    expect(registry.get('two')?.tokens.color.surface).toBe('#ffffff');
    expect(registry.get('missing')).toBeUndefined();
  });
});

describe('customer-id contract', () => {
  const customerA = 'cust-a' as CustomerId;
  const customerB = 'cust-b' as CustomerId;
  const mappings: LocalIdentityMapping[] = [
    { product: 'store', localUserId: 'local-1', customerId: customerA },
    { product: 'services', localUserId: 'local-1', customerId: customerB },
  ];

  it('scopes membership keys by product and customer', () => {
    expect(membershipKey(customerA, 'store')).toBe('store:cust-a');
    expect(membershipKey(customerA, 'services')).not.toBe(membershipKey(customerA, 'store'));
  });

  it('resolves a product-local identity to the shared customer, isolated per product', () => {
    expect(resolveCustomerId(mappings, 'store', 'local-1')).toBe(customerA);
    expect(resolveCustomerId(mappings, 'services', 'local-1')).toBe(customerB);
    expect(resolveCustomerId(mappings, 'store', 'nobody')).toBeUndefined();
  });
});
