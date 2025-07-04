import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { JSDOM } from 'jsdom';
import { useMousePosition } from './use-mouse-position.js';

describe('useMousePosition', () => {
  let originalWindow: typeof globalThis.window;
  let originalDocument: typeof globalThis.document;

  beforeAll(() => {
    const dom = new JSDOM('<!doctype html><html><body></body></html>');
    const { window } = dom;
    originalWindow = globalThis.window;
    originalDocument = globalThis.document;
    globalThis.window = window as unknown as typeof globalThis.window;
    globalThis.document = window.document;
  });

  afterAll(() => {
    globalThis.window = originalWindow;
    globalThis.document = originalDocument;
  });

  it('updates position on mousemove and cleans up listener', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    const { result, unmount } = renderHook(() => useMousePosition());

    expect(addSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
    const handler = addSpy.mock.calls[0][1] as (e: MouseEvent) => void;

    act(() => {
      handler(new window.MouseEvent('mousemove', { clientX: 5, clientY: 10 }));
    });
    expect(result.current).toEqual({ x: 5, y: 10 });

    unmount();
    expect(removeSpy).toHaveBeenCalledWith('mousemove', handler);
  });
});