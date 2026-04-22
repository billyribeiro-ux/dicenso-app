import { describe, it, expect } from 'vitest';
import { slugify, formatDate, formatRelative, generateId } from '@/lib/utils';

describe('slugify', () => {
  it('converts text to slug', () => {
    expect(slugify('Hello World')).toBe('hello-world');
    expect(slugify('My Note Title!')).toBe('my-note-title');
    expect(slugify('  Spaces  ')).toBe('spaces');
  });
});

describe('formatDate', () => {
  it('formats a date', () => {
    const date = new Date(2024, 2, 15); // month is 0-indexed
    expect(formatDate(date)).toContain('Mar');
    expect(formatDate(date)).toContain('15');
  });

  it('returns empty string for undefined', () => {
    expect(formatDate(undefined)).toBe('');
  });
});

describe('generateId', () => {
  it('generates a UUID string', () => {
    const id = generateId();
    expect(typeof id).toBe('string');
    expect(id.length).toBe(36);
  });
});
