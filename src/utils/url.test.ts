import { describe, it, expect } from 'vitest';
import { extractDomain } from './url';

describe('extractDomain', () => {
  // Regression anchor: callers render the result as the tab subtitle, so a
  // change of implementation (e.g. URL.host with port, www-stripping) must
  // surface here.
  it('returns the hostname for a URL with path, query, and hash', () => {
    expect(extractDomain('https://sub.example.co.jp/page?query=1#hash')).toBe('sub.example.co.jp');
  });

  // Tabs in a tab manager routinely include chrome:// pages; document what
  // the subtitle shows for them.
  it('returns the host part of a chrome:// URL', () => {
    expect(extractDomain('chrome://extensions/')).toBe('extensions');
  });

  // The fallback is the contract this util owns: invalid input must yield
  // an empty string, never a throw.
  it('returns an empty string for a string that is not a URL', () => {
    expect(extractDomain('not a url')).toBe('');
  });

  it('returns an empty string for a scheme-less domain', () => {
    expect(extractDomain('example.com')).toBe('');
  });

  it('returns an empty string for an empty string', () => {
    expect(extractDomain('')).toBe('');
  });
});
