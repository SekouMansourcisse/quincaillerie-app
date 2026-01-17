import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../../hooks/useDebounce';

describe('useDebounce Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));

    expect(result.current).toBe('initial');
  });

  it('should debounce value changes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'initial' } }
    );

    expect(result.current).toBe('initial');

    // Change la valeur
    rerender({ value: 'updated' });

    // La valeur ne devrait pas encore avoir change
    expect(result.current).toBe('initial');

    // Avance le temps
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Maintenant la valeur devrait etre mise a jour
    expect(result.current).toBe('updated');
  });

  it('should reset timer on subsequent value changes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'initial' } }
    );

    // Premier changement
    rerender({ value: 'first' });

    // Avance partiellement
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // La valeur ne devrait pas encore avoir change
    expect(result.current).toBe('initial');

    // Deuxieme changement (reset le timer)
    rerender({ value: 'second' });

    // Avance encore 300ms (total 600ms depuis le premier changement, mais seulement 300ms depuis le deuxieme)
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // La valeur ne devrait toujours pas avoir change car le timer a ete reset
    expect(result.current).toBe('initial');

    // Avance les 200ms restants
    act(() => {
      vi.advanceTimersByTime(200);
    });

    // Maintenant la valeur devrait etre 'second'
    expect(result.current).toBe('second');
  });

  it('should use default delay of 500ms', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'updated' });

    // Avance 400ms
    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(result.current).toBe('initial');

    // Avance 100ms de plus (total 500ms)
    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current).toBe('updated');
  });

  it('should work with different types', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 100),
      { initialProps: { value: 42 } }
    );

    expect(result.current).toBe(42);

    rerender({ value: 100 });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current).toBe(100);
  });
});
