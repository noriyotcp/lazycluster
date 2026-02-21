import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { ActiveWindowIdProvider, useActiveWindowId } from './ActiveWindowIdContext';

describe('ActiveWindowIdContext', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('useActiveWindowId', () => {
    it('throws when used outside of ActiveWindowIdProvider', () => {
      // Suppress console.error from React for expected error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => renderHook(() => useActiveWindowId())).toThrow(
        'useActiveWindowId must be used within an ActiveWindowIdProvider'
      );

      consoleSpy.mockRestore();
    });

    it('returns null initially before chrome API resolves', () => {
      chrome.windows.getCurrent = vi.fn(
        () => new Promise<chrome.windows.Window>(() => {}) // Never resolves
      );

      const { result } = renderHook(() => useActiveWindowId(), {
        wrapper: ActiveWindowIdProvider,
      });

      expect(result.current.activeWindowId).toBeNull();
    });

    it('returns the window id from chrome.windows.getCurrent()', async () => {
      chrome.windows.getCurrent = vi.fn(() =>
        Promise.resolve({
          id: 42,
          focused: true,
          incognito: false,
          alwaysOnTop: false,
        } as chrome.windows.Window)
      );

      const { result } = renderHook(() => useActiveWindowId(), {
        wrapper: ActiveWindowIdProvider,
      });

      await waitFor(() => {
        expect(result.current.activeWindowId).toBe(42);
      });
    });

    it('keeps null when window.id is undefined', async () => {
      chrome.windows.getCurrent = vi.fn(() =>
        Promise.resolve({
          focused: true,
          incognito: false,
          alwaysOnTop: false,
        } as chrome.windows.Window)
      );

      const { result } = renderHook(() => useActiveWindowId(), {
        wrapper: ActiveWindowIdProvider,
      });

      // Wait for the effect to complete
      await waitFor(() => {
        expect(chrome.windows.getCurrent).toHaveBeenCalled();
      });

      expect(result.current.activeWindowId).toBeNull();
    });

    it('updates activeWindowId when refreshActiveWindowId is called', async () => {
      // Initial window ID
      chrome.windows.getCurrent = vi.fn(() =>
        Promise.resolve({
          id: 42,
          focused: true,
          incognito: false,
          alwaysOnTop: false,
        } as chrome.windows.Window)
      );

      const { result } = renderHook(() => useActiveWindowId(), {
        wrapper: ActiveWindowIdProvider,
      });

      await waitFor(() => {
        expect(result.current.activeWindowId).toBe(42);
      });

      // Simulate manager tab moved to a different window
      chrome.windows.getCurrent = vi.fn(() =>
        Promise.resolve({
          id: 99,
          focused: true,
          incognito: false,
          alwaysOnTop: false,
        } as chrome.windows.Window)
      );

      let returnedId: number | null = null;
      await act(async () => {
        returnedId = await result.current.refreshActiveWindowId();
      });

      expect(returnedId).toBe(99);
      expect(result.current.activeWindowId).toBe(99);
    });

    it('refreshActiveWindowId returns null when window.id is undefined', async () => {
      chrome.windows.getCurrent = vi.fn(() =>
        Promise.resolve({
          id: 42,
          focused: true,
          incognito: false,
          alwaysOnTop: false,
        } as chrome.windows.Window)
      );

      const { result } = renderHook(() => useActiveWindowId(), {
        wrapper: ActiveWindowIdProvider,
      });

      await waitFor(() => {
        expect(result.current.activeWindowId).toBe(42);
      });

      // Simulate window with undefined id
      chrome.windows.getCurrent = vi.fn(() =>
        Promise.resolve({
          focused: true,
          incognito: false,
          alwaysOnTop: false,
        } as chrome.windows.Window)
      );

      let returnedId: number | null = 42; // Initialize to non-null to verify it changes
      await act(async () => {
        returnedId = await result.current.refreshActiveWindowId();
      });

      expect(returnedId).toBeNull();
      expect(result.current.activeWindowId).toBeNull();
    });
  });
});
