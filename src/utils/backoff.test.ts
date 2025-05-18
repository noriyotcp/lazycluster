import { describe, it, expect, vi, afterEach } from 'vitest';
import { calculateBackoff } from './backoff';

describe('calculateBackoff', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns correct delay with default options (attempt=5)', () => {
    // calculatedDelay = 30000 * 2^5 = 960000
    // delay = 960000/2 + (Math.random() * 960000)/2
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const delay = calculateBackoff();
    // 960000/2 = 480000, (0.5*960000)/2 = 240000, total = 720000
    expect(delay).toBe(720000);
  });

  it('returns -1 if attempt > maxRetries', () => {
    expect(calculateBackoff({ attempt: 8 })).toBe(-1);
    expect(calculateBackoff({ attempt: 100, maxRetries: 10 })).toBe(-1);
  });

  it('returns correct delay for custom options and Math.random=0', () => {
    // baseInterval=1000, factor=3, attempt=2, maxRetries=5
    // calculatedDelay = 1000 * 3^2 = 9000
    // delay = 9000/2 + (0*9000)/2 = 4500
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const delay = calculateBackoff({ attempt: 2, baseInterval: 1000, factor: 3, maxRetries: 5 });
    expect(delay).toBe(4500);
  });

  it('returns correct delay for custom options and Math.random=1', () => {
    // baseInterval=1000, factor=3, attempt=2, maxRetries=5
    // calculatedDelay = 1000 * 3^2 = 9000
    // delay = 9000/2 + (1*9000)/2 = 9000
    vi.spyOn(Math, 'random').mockReturnValue(1);
    const delay = calculateBackoff({ attempt: 2, baseInterval: 1000, factor: 3, maxRetries: 5 });
    expect(delay).toBe(9000);
  });

  it('returns correct delay for attempt=0', () => {
    // baseInterval=30000, factor=2, attempt=0
    // calculatedDelay = 30000 * 1 = 30000
    // delay = 30000/2 + (0.25*30000)/2 = 15000 + 3750 = 18750
    vi.spyOn(Math, 'random').mockReturnValue(0.25);
    const delay = calculateBackoff({ attempt: 0 });
    expect(delay).toBe(18750);
  });

  it('returns correct delay for maxRetries boundary', () => {
    // attempt = maxRetries = 7
    // calculatedDelay = 30000 * 2^7 = 3840000
    // delay = 3840000/2 + (0.1*3840000)/2 = 1920000 + 192000 = 2112000
    vi.spyOn(Math, 'random').mockReturnValue(0.1);
    const delay = calculateBackoff({ attempt: 7 });
    expect(delay).toBe(2112000);
  });
});
