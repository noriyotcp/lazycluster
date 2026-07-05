import { describe, it, expect } from 'vitest';
import { extractDomain } from './url';

describe('extractDomain', () => {
  it('returns the hostname for a valid http URL', () => {
    expect(extractDomain('http://example.com/path?query=1')).toBe('example.com');
  });

  it('returns the hostname for a valid https URL', () => {
    expect(extractDomain('https://sub.example.co.jp/page#hash')).toBe('sub.example.co.jp');
  });

  it('returns an empty string for an invalid URL string', () => {
    expect(extractDomain('not a url')).toBe('');
  });

  it('returns an empty string for an empty string', () => {
    expect(extractDomain('')).toBe('');
  });
});
