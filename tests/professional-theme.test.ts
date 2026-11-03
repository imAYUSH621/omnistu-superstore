/**
 * Three global themes: Light, Dark and Professional, plus System (OS
 * preference). Professional is a restrained slate/navy token palette only -
 * no layout, artwork or brand changes. Static regression coverage for the
 * wiring: provider declares the theme list, the toggle exposes all options,
 * and globals.css carries the .professional token block.
 */
import { readFileSync } from 'fs';

const layout = readFileSync('app/layout.tsx', 'utf8');
const toggle = readFileSync('components/shared/header/mode-toggle.tsx', 'utf8');
const globals = readFileSync('assets/styles/globals.css', 'utf8');

describe('three global themes (light, dark, professional) + system', () => {
  it('ThemeProvider declares the explicit theme list', () => {
    expect(layout).toContain("themes={['light', 'dark', 'professional']}");
    expect(layout).toContain('enableSystem');
    expect(layout).toContain("attribute='class'");
  });

  it('mode toggle offers System, Light, Dark and Professional', () => {
    for (const option of ['System', 'Light', 'Dark', 'Professional']) {
      expect(toggle).toContain(option);
    }
    expect(toggle).toContain("setTheme('professional')");
    expect(toggle).toContain("theme === 'professional'");
    expect(toggle).toContain('aria-label');
  });

  it('globals.css defines a complete professional token palette', () => {
    const match = globals.match(/\.professional\s*\{([\s\S]*?)\}/);
    expect(match).not.toBeNull();
    const block = match![1];
    for (const token of [
      '--background',
      '--foreground',
      '--card',
      '--popover',
      '--primary',
      '--secondary',
      '--muted',
      '--accent',
      '--destructive',
      '--border',
      '--input',
      '--ring',
    ]) {
      expect(block).toContain(`${token}:`);
    }
  });

  it('professional palette stays a token-only change (no layout edits)', () => {
    // The body chrome classes are unchanged from the light/dark design;
    // the theme only swaps CSS variables.
    expect(layout).toContain('bg-slate-50 dark:bg-slate-950');
  });
});
