/**
 * Tests for cn() className utility
 * Phase 26 — Testing
 */

import { describe, it, expect } from 'vitest';
import { cn } from './cn';

describe('cn — className utility', () => {
  it('returns a single class unchanged', () => {
    expect(cn('text-red-500')).toBe('text-red-500');
  });

  it('merges multiple classes', () => {
    expect(cn('text-sm', 'font-bold')).toBe('text-sm font-bold');
  });

  it('filters out falsy values', () => {
    expect(cn('text-sm', false && 'font-bold', undefined, null, '')).toBe('text-sm');
  });

  it('handles conditional classes via object syntax', () => {
    expect(cn({ 'font-bold': true, 'text-red-500': false })).toBe('font-bold');
  });

  it('resolves Tailwind conflicts — later class wins', () => {
    // tailwind-merge should resolve p-2 vs p-4 conflict
    const result = cn('p-2', 'p-4');
    expect(result).toBe('p-4');
  });

  it('resolves text color conflicts', () => {
    const result = cn('text-red-500', 'text-blue-500');
    expect(result).toBe('text-blue-500');
  });

  it('handles array inputs', () => {
    const result = cn(['text-sm', 'font-medium'], 'p-4');
    expect(result).toContain('text-sm');
    expect(result).toContain('font-medium');
    expect(result).toContain('p-4');
  });

  it('handles empty inputs', () => {
    expect(cn()).toBe('');
  });

  it('handles all-falsy inputs', () => {
    expect(cn(false, undefined, null, '')).toBe('');
  });

  it('preserves non-conflicting classes together', () => {
    const result = cn('flex', 'items-center', 'gap-4', 'rounded-lg');
    expect(result).toContain('flex');
    expect(result).toContain('items-center');
    expect(result).toContain('gap-4');
    expect(result).toContain('rounded-lg');
  });

  it('handles border class merging', () => {
    const result = cn('border', 'border-red-500');
    expect(result).toContain('border');
    expect(result).toContain('border-red-500');
  });
});
