// src/hooks/usePaintingMode.ts
import { useState, useCallback, useMemo } from 'react';

export type PaintingMode = 'single' | 'box';

interface UsePaintingModeProps {
  initialMode?: PaintingMode;
}

/**
 * Hook for managing painting mode state (single vs box selection).
 * Separates mode management from other painting concerns.
 * 
 * Optimizations:
 * - Memoizes mode-derived boolean values to prevent unnecessary comparisons
 * - Stable callback with no dependencies for mode switching
 */
export const usePaintingMode = ({ initialMode = 'single' }: UsePaintingModeProps = {}) => {
  const [mode, setMode] = useState<PaintingMode>(initialMode);

  // Memoized callback - never needs to recreate since setMode is always the same
  const setPaintingMode = useCallback((newMode: PaintingMode) => {
    setMode(newMode);
  }, []);

  // Memoize boolean checks to prevent recalculation on every render
  const isSingleMode = useMemo(() => mode === 'single', [mode]);
  const isBoxMode = useMemo(() => mode === 'box', [mode]);

  return {
    mode,
    setPaintingMode,
    isSingleMode,
    isBoxMode
  };
};
