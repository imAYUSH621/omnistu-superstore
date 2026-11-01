/**
 * Omnistu theme-token contract (PROVISIONAL DRAFT).
 * A theme is one complete token set. The contract is theme-count-agnostic:
 * the three global themes Ayush will name drop in as three registrations.
 * No theme designs are chosen here; the registry ships empty and tests use
 * their own fixture values.
 */

export interface ColorTokens {
  surface: string;
  surfaceRaised: string;
  text: string;
  textMuted: string;
  action: string;
  actionText: string;
  feedbackSuccess: string;
  feedbackWarning: string;
  feedbackDanger: string;
}

export interface TypeTokens {
  fontFamily: string;
  /** rem sizes keyed by step. */
  scale: { xs: number; sm: number; base: number; lg: number; xl: number };
}

export interface SpacingTokens {
  /** Base unit in px; all spacing derives as multiples. */
  unit: number;
  scale: { xs: number; sm: number; md: number; lg: number; xl: number };
}

export interface RadiusTokens {
  sm: number;
  md: number;
  lg: number;
}

export interface ThemeTokens {
  color: ColorTokens;
  type: TypeTokens;
  spacing: SpacingTokens;
  radius: RadiusTokens;
}

export interface NamedTheme {
  name: string;
  tokens: ThemeTokens;
}

const REQUIRED_COLOR_KEYS: readonly (keyof ColorTokens)[] = [
  'surface', 'surfaceRaised', 'text', 'textMuted', 'action', 'actionText',
  'feedbackSuccess', 'feedbackWarning', 'feedbackDanger',
];

/** Throws naming the first missing token; returns the theme unchanged when complete. */
export function assertThemeComplete(theme: NamedTheme): NamedTheme {
  for (const key of REQUIRED_COLOR_KEYS) {
    if (typeof theme.tokens.color[key] !== 'string' || theme.tokens.color[key].length === 0) {
      throw new Error(`Theme "${theme.name}" is missing color token "${key}"`);
    }
  }
  for (const step of ['xs', 'sm', 'base', 'lg', 'xl'] as const) {
    if (typeof theme.tokens.type.scale[step] !== 'number') {
      throw new Error(`Theme "${theme.name}" is missing type scale step "${step}"`);
    }
  }
  for (const step of ['xs', 'sm', 'md', 'lg', 'xl'] as const) {
    if (typeof theme.tokens.spacing.scale[step] !== 'number') {
      throw new Error(`Theme "${theme.name}" is missing spacing scale step "${step}"`);
    }
  }
  return theme;
}

/** Theme-count-agnostic registry. Empty by default: no design defaults chosen. */
export class ThemeRegistry {
  private readonly themes = new Map<string, NamedTheme>();

  register(theme: NamedTheme): void {
    this.themes.set(theme.name, assertThemeComplete(theme));
  }

  get(name: string): NamedTheme | undefined {
    return this.themes.get(name);
  }

  names(): string[] {
    return [...this.themes.keys()];
  }

  get size(): number {
    return this.themes.size;
  }
}
