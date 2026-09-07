/// <reference types="vitest/globals" />

/**
 * Vitest global test setup
 * Phase 26 — Testing
 */

// ── Canvas stub ───────────────────────────────────────────────────────────────
// jsdom has no canvas implementation; provide a minimal stub so imageOptimization
// tests can run without a real browser.

const mockCtx = {
  imageSmoothingEnabled: false,
  imageSmoothingQuality: 'low',
  drawImage: () => {},
  translate: () => {},
  scale: () => {},
  setTransform: () => {},
};

const mockCanvas = {
  width: 0,
  height: 0,
  getContext: () => mockCtx,
  toDataURL: (type = 'image/jpeg') => `data:${type};base64,mock`,
};

vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
  if (tag === 'canvas') return mockCanvas as unknown as HTMLCanvasElement;
  // Fall back to the real implementation for everything else
  return Object.getPrototypeOf(document).createElement.call(document, tag);
});

// ── Image stub ────────────────────────────────────────────────────────────────
// new Image() must fire onload so async utilities resolve.

class MockImage {
  width = 100;
  height = 100;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  private _src = '';

  get src() { return this._src; }
  set src(value: string) {
    this._src = value;
    // Schedule onload on the next microtask so the constructor finishes first
    Promise.resolve().then(() => this.onload?.());
  }
}

Object.defineProperty(globalThis, 'Image', {
  writable: true,
  configurable: true,
  value: MockImage,
});
