import { describe, expect, test } from '@jest/globals';
import {
  parseAcceptLanguage,
  detectLanguage,
  detectCurrency,
  detectLocale,
} from '../lib/locale-detect';

describe('parseAcceptLanguage', () => {
  test('orders by q-value descending and strips regions', () => {
    expect(parseAcceptLanguage('fr-CA,fr;q=0.9,en-US;q=0.8,hi;q=0.5')).toEqual(['fr', 'fr', 'en', 'hi']);
  });
  test('missing or malformed header yields empty list', () => {
    expect(parseAcceptLanguage(null)).toEqual([]);
    expect(parseAcceptLanguage('')).toEqual([]);
    expect(parseAcceptLanguage(';;;')).toEqual([]);
  });
  test('q=0 entries are excluded', () => {
    expect(parseAcceptLanguage('ja;q=0,en;q=0.5')).toEqual(['en']);
  });
});

describe('detectLanguage', () => {
  test('maps supported browser languages', () => {
    expect(detectLanguage('hi-IN,hi;q=0.9,en;q=0.8')).toBe('HI');
    expect(detectLanguage('es-MX,es;q=0.9')).toBe('ES');
    expect(detectLanguage('ja')).toBe('JA');
    expect(detectLanguage('de-DE,de;q=0.9,en;q=0.8')).toBe('DE');
    expect(detectLanguage('fr-FR')).toBe('FR');
  });
  test('browser language wins over geo country (language signal)', () => {
    // Spanish-speaking visitor in the US still gets ES.
    expect(detectLocale('US', 'es-ES,es;q=0.9,en;q=0.8').lang).toBe('ES');
  });
  test('unsupported or missing header falls back to EN', () => {
    expect(detectLanguage('pt-BR,pt;q=0.9')).toBe('EN');
    expect(detectLanguage(null)).toBe('EN');
  });
});

describe('detectCurrency', () => {
  test('maps geo countries to display currencies', () => {
    expect(detectCurrency('IN')).toBe('INR');
    expect(detectCurrency('US')).toBe('USD');
    expect(detectCurrency('GB')).toBe('GBP');
    expect(detectCurrency('JP')).toBe('JPY');
    expect(detectCurrency('CA')).toBe('CAD');
    expect(detectCurrency('AU')).toBe('AUD');
  });
  test('eurozone countries map to EUR', () => {
    expect(detectCurrency('DE')).toBe('EUR');
    expect(detectCurrency('fr')).toBe('EUR'); // case-insensitive
    expect(detectCurrency('IT')).toBe('EUR');
  });
  test('unknown, unmapped or VPN-country signals fall back to USD', () => {
    expect(detectCurrency(null)).toBe('USD');
    expect(detectCurrency('')).toBe('USD');
    expect(detectCurrency('XX')).toBe('USD');
    expect(detectCurrency('BR')).toBe('USD'); // unsupported display currency
  });
});

describe('detectLocale', () => {
  test('combines both signals independently', () => {
    expect(detectLocale('IN', 'en-US,en;q=0.9')).toEqual({ lang: 'EN', currency: 'INR' });
    expect(detectLocale('JP', 'ja-JP,ja;q=0.9')).toEqual({ lang: 'JA', currency: 'JPY' });
    expect(detectLocale(null, null)).toEqual({ lang: 'EN', currency: 'USD' });
  });
});
