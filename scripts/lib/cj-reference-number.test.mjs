import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseCjReferenceNumber } from './cj-reference-number.mjs';

test('exact observed scalar zero and decimals survive without guessed values', () => {
  for (const [raw, expected] of [[0, 0], ['0', 0], [' 3.48 ', 3.48], [8.74, 8.74], ['2.50', 2.5]]) assert.equal(parseCjReferenceNumber(raw), expected);
});

test('missing, malformed, negative, range, coercion and overflow values stay unknown', () => {
  for (const raw of [null, undefined, '', '  ', false, true, [], {}, -1, '-1', NaN, Infinity, -Infinity, 'NaN', 'Infinity', '1--2', '1-2', '$3.48', '3.48USD', '1e2', Number.MAX_SAFE_INTEGER]) assert.equal(parseCjReferenceNumber(raw), null, String(raw));
});

test('actual staging entry point uses strict parser, never range-first coercion', () => {
  const source = readFileSync(new URL('../stage-cj-products.mjs', import.meta.url), 'utf8');
  assert.match(source, /const num = parseCjReferenceNumber/);
  assert.doesNotMatch(source, /split\('--'\)\[0\]/);
  for (const field of ['variantSellPrice', 'variantSugSellPrice', 'variantWeight']) assert.ok(source.includes(`num(v.${field})`));
});
