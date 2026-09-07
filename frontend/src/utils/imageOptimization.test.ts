/**
 * Tests for imageOptimization utilities
 * Phase 26 — Testing
 *
 * Note: Canvas and Image are mocked in src/test/setup.ts
 */

import { describe, it, expect } from 'vitest';
import {
  getDataUrlSize,
  formatBytes,
  isImageSizeValid,
} from './imageOptimization';

// ── getDataUrlSize ────────────────────────────────────────────────────────────

describe('getDataUrlSize', () => {
  it('returns 0 for an empty/invalid dataUrl', () => {
    expect(getDataUrlSize('')).toBe(0);
    expect(getDataUrlSize('no-comma-here')).toBe(0);
  });

  it('calculates size for a known base64 string', () => {
    // 4 base64 chars = 3 bytes
    const base64 = 'AAAA'; // 4 chars → 3 bytes
    const dataUrl = `data:image/jpeg;base64,${base64}`;
    expect(getDataUrlSize(dataUrl)).toBe(3);
  });

  it('accounts for base64 padding', () => {
    // "AA==" = 2 bytes (1 padding char)
    const dataUrl = 'data:image/jpeg;base64,AA==';
    expect(getDataUrlSize(dataUrl)).toBe(1);
  });

  it('handles realistic base64 data URL', () => {
    // A small realistic-ish data URL
    const b64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const dataUrl = `data:image/png;base64,${b64}`;
    const size = getDataUrlSize(dataUrl);
    expect(size).toBeGreaterThan(0);
    // Rough estimate: base64 of 88 chars ≈ 63 bytes
    expect(size).toBeLessThan(200);
  });
});

// ── formatBytes ───────────────────────────────────────────────────────────────

describe('formatBytes', () => {
  it('returns "0 Bytes" for zero', () => {
    expect(formatBytes(0)).toBe('0 Bytes');
  });

  it('formats bytes correctly', () => {
    expect(formatBytes(500)).toBe('500 Bytes');
  });

  it('formats kilobytes correctly', () => {
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1536)).toBe('1.5 KB');
  });

  it('formats megabytes correctly', () => {
    expect(formatBytes(1048576)).toBe('1 MB');
    expect(formatBytes(2097152)).toBe('2 MB');
  });

  it('formats gigabytes correctly', () => {
    expect(formatBytes(1073741824)).toBe('1 GB');
  });

  it('handles fractional megabytes', () => {
    const result = formatBytes(1500000);
    expect(result).toContain('MB');
  });
});

// ── isImageSizeValid ──────────────────────────────────────────────────────────

describe('isImageSizeValid', () => {
  it('returns true when image is within limit', () => {
    // 4 base64 chars = 3 bytes
    const smallDataUrl = 'data:image/jpeg;base64,AAAA';
    expect(isImageSizeValid(smallDataUrl, 100)).toBe(true);
  });

  it('returns false when image exceeds limit', () => {
    const smallDataUrl = 'data:image/jpeg;base64,AAAA';
    expect(isImageSizeValid(smallDataUrl, 1)).toBe(false);
  });

  it('returns true exactly at the limit', () => {
    // 3 bytes exactly
    const dataUrl = 'data:image/jpeg;base64,AAAA';
    expect(isImageSizeValid(dataUrl, 3)).toBe(true);
  });

  it('handles empty data URL', () => {
    expect(isImageSizeValid('', 100)).toBe(true); // 0 bytes ≤ 100
  });
});

// ── compressImage (async, uses mocked canvas) ─────────────────────────────────

describe('compressImage', () => {
  it('resolves to a data URL string', async () => {
    const { compressImage } = await import('./imageOptimization');
    const fakeDataUrl = 'data:image/jpeg;base64,/9j/fake';
    const result = await compressImage(fakeDataUrl);
    expect(typeof result).toBe('string');
    expect(result).toMatch(/^data:/);
  });

  it('respects maxWidth and maxHeight options', async () => {
    const { compressImage } = await import('./imageOptimization');
    const fakeDataUrl = 'data:image/jpeg;base64,/9j/fake';
    // Should not throw even with custom dimensions
    await expect(
      compressImage(fakeDataUrl, { maxWidth: 400, maxHeight: 300, quality: 0.7 })
    ).resolves.toMatch(/^data:/);
  });
});

// ── validateImageDimensions (async) ──────────────────────────────────────────

describe('validateImageDimensions', () => {
  it('resolves with width and height from mock image', async () => {
    const { validateImageDimensions } = await import('./imageOptimization');
    const result = await validateImageDimensions('data:image/jpeg;base64,fake');
    // Mock image returns width=100, height=100
    expect(result.width).toBe(100);
    expect(result.height).toBe(100);
    expect(result.valid).toBe(true);
  });

  it('fails when image is too small', async () => {
    const { validateImageDimensions } = await import('./imageOptimization');
    const result = await validateImageDimensions(
      'data:image/jpeg;base64,fake',
      200,  // minWidth=200, mock returns 100
      200
    );
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });
});

// ── getImageMetadata (async) ──────────────────────────────────────────────────

describe('getImageMetadata', () => {
  it('returns comprehensive metadata', async () => {
    const { getImageMetadata } = await import('./imageOptimization');
    const dataUrl = 'data:image/jpeg;base64,AAAA'; // 3 bytes
    const meta = await getImageMetadata(dataUrl);
    expect(meta).toHaveProperty('width');
    expect(meta).toHaveProperty('height');
    expect(meta).toHaveProperty('size');
    expect(meta).toHaveProperty('sizeFormatted');
    expect(meta).toHaveProperty('mimeType');
    expect(meta.mimeType).toBe('image/jpeg');
    expect(meta.size).toBeGreaterThanOrEqual(0);
    expect(typeof meta.sizeFormatted).toBe('string');
  });
});
