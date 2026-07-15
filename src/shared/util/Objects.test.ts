import { describe, expect, it } from 'bun:test';

import { deepEqual } from './Objects';

describe('deepEqual', () => {
  it('compares primitives', () => {
    expect(deepEqual(1, 1)).toBe(true);
    expect(deepEqual('a', 'a')).toBe(true);
    expect(deepEqual(null, null)).toBe(true);
    expect(deepEqual(undefined, undefined)).toBe(true);
    expect(deepEqual(1, 2)).toBe(false);
    expect(deepEqual(1, '1')).toBe(false);
    expect(deepEqual(null, undefined)).toBe(false);
    expect(deepEqual(0, false)).toBe(false);
  });

  it('compares arrays', () => {
    expect(deepEqual([], [])).toBe(true);
    expect(deepEqual([1, 2, 3], [1, 2, 3])).toBe(true);
    expect(deepEqual([1, 2], [2, 1])).toBe(false);
    expect(deepEqual([1, 2], [1, 2, 3])).toBe(false);
    expect(deepEqual([1], { 0: 1 })).toBe(false);
  });

  it('compares nested objects', () => {
    expect(deepEqual({ a: 1, b: { c: [1, 2] } }, { a: 1, b: { c: [1, 2] } })).toBe(true);
    expect(deepEqual({ a: 1, b: { c: [1, 2] } }, { a: 1, b: { c: [1, 3] } })).toBe(false);
  });

  it('detects extra keys on either side', () => {
    expect(deepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    expect(deepEqual({ a: 1, b: 2 }, { a: 1 })).toBe(false);
    expect(deepEqual({ a: 1, b: 2 }, { a: 1, c: 2 })).toBe(false);
    expect(deepEqual({}, { a: undefined, b: 1 })).toBe(false);
  });

  it('ignores key order', () => {
    expect(deepEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
  });

  it('treats undefined-valued keys as absent', () => {
    expect(deepEqual({ a: 1, b: undefined }, { a: 1 })).toBe(true);
    expect(deepEqual({ a: 1 }, { a: 1, b: undefined })).toBe(true);
    expect(deepEqual({ a: undefined }, { b: undefined })).toBe(true);
    expect(deepEqual({ a: 1, b: null }, { a: 1 })).toBe(false);
  });
});
