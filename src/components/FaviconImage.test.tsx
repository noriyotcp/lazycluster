import { describe, it, expect, afterEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import FaviconImage from './FaviconImage';

afterEach(cleanup);

describe('FaviconImage', () => {
  it('renders fallback when src is undefined', () => {
    const { container, getByTestId } = render(
      <FaviconImage fallback={<span data-testid="fb" />} />
    );
    expect(getByTestId('fb')).toBeTruthy();
    expect(container.querySelector('img')).toBeNull();
  });

  it('renders default fallback (empty span) when src is undefined and no fallback prop', () => {
    const { container } = render(<FaviconImage />);
    expect(container.querySelector('img')).toBeNull();
    const span = container.querySelector('span');
    expect(span).not.toBeNull();
    expect(span?.className).toContain('size-4');
  });

  it('renders img with src and alt when src is provided', () => {
    const { container } = render(
      <FaviconImage src="https://example.com/favicon.ico" alt="Example" />
    );
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img?.getAttribute('src')).toBe('https://example.com/favicon.ico');
    expect(img?.getAttribute('alt')).toBe('Example');
  });

  it('switches to fallback when img onError fires', () => {
    const { container, getByTestId } = render(
      <FaviconImage src="https://bad.example/favicon.ico" fallback={<span data-testid="fb" />} />
    );
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    fireEvent.error(img!);
    expect(getByTestId('fb')).toBeTruthy();
    expect(container.querySelector('img')).toBeNull();
  });

  it('resets error state when src changes and re-renders img', () => {
    const { container, rerender } = render(
      <FaviconImage src="https://bad.example/favicon.ico" fallback={<span data-testid="fb" />} />
    );
    fireEvent.error(container.querySelector('img')!);
    expect(container.querySelector('img')).toBeNull();

    rerender(
      <FaviconImage src="https://good.example/favicon.ico" fallback={<span data-testid="fb" />} />
    );
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img?.getAttribute('src')).toBe('https://good.example/favicon.ico');
  });

  it('applies default className when not specified', () => {
    const { container } = render(<FaviconImage src="https://example.com/favicon.ico" />);
    expect(container.querySelector('img')?.className).toBe('size-4 object-contain');
  });

  it('applies custom className when specified', () => {
    const { container } = render(
      <FaviconImage src="https://example.com/favicon.ico" className="size-4 min-w-4 min-h-4 object-contain" />
    );
    expect(container.querySelector('img')?.className).toBe('size-4 min-w-4 min-h-4 object-contain');
  });

  it('uses empty alt by default', () => {
    const { container } = render(<FaviconImage src="https://example.com/favicon.ico" />);
    expect(container.querySelector('img')?.getAttribute('alt')).toBe('');
  });
});
