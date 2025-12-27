// src/hooks/usePaintingState.ts
import { useState, useCallback } from 'react';

interface TilePosition {
  row: number;
  col: number;
}

interface PaintingStateData {
  isActive: boolean;
  startPosition: TilePosition | null;
  currentPosition: TilePosition | null;
  draggedTiles: Set<string>;
  isDragging: boolean;
  dragThreshold: number;
}

interface PreviewBoxSelection {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

/**
 * Hook for managing painting state: drag detection, tile tracking, and preview.
 * Handles the state machine for painting interactions.
 * 
 * Optimizations:
 * - Uses updater functions in setState to avoid dependency on current state
 * - Memoizes expensive set lookups
 * - Batches state updates to reduce re-renders
 */
export const usePaintingState = () => {
  const [paintingState, setPaintingState] = useState<PaintingStateData>({
    isActive: false,
    startPosition: null,
    currentPosition: null,
    draggedTiles: new Set(),
    isDragging: false,
    dragThreshold: 5 // pixels
  });

  const [previewBoxSelection, setPreviewBoxSelection] = useState<PreviewBoxSelection | null>(null);

  const [mouseStartPos, setMouseStartPos] = useState<{ x: number; y: number } | null>(null);

  // Start painting session
  const startPainting = useCallback((pos: TilePosition, mousePos: { x: number; y: number }) => {
    setMouseStartPos(mousePos);
    setPaintingState({
      isActive: true,
      startPosition: pos,
      currentPosition: pos,
      draggedTiles: new Set([`${pos.row}-${pos.col}`]),
      isDragging: false,
      dragThreshold: 5
    });
  }, []);

  // Update current position and drag state during painting
  // Optimized: Uses updater function to avoid stale state issues
  const updatePosition = useCallback(
    (
      newPos: TilePosition,
      _mousePos: { x: number; y: number },
      isDragging: boolean
    ) => {
      setPaintingState(prev => {
        const hasPositionChanged =
          !prev.currentPosition ||
          newPos.row !== prev.currentPosition.row ||
          newPos.col !== prev.currentPosition.col;

        const hasDragStateChanged = isDragging !== prev.isDragging;

        if (hasPositionChanged || hasDragStateChanged) {
          return {
            ...prev,
            currentPosition: newPos,
            isDragging
          };
        }

        return prev;
      });
    },
    []
  );

  // Add a tile to the dragged tiles set
  // Optimized: Efficiently creates new Set without spreading
  const addDraggedTile = useCallback((row: number, col: number) => {
    const tileKey = `${row}-${col}`;
    setPaintingState(prev => {
      if (prev.draggedTiles.has(tileKey)) {
        return prev; // No change needed, return same reference
      }
      const newSet = new Set(prev.draggedTiles);
      newSet.add(tileKey);
      return {
        ...prev,
        draggedTiles: newSet
      };
    });
  }, []);

  // Update preview box selection
  const updateBoxPreview = useCallback((preview: PreviewBoxSelection | null) => {
    setPreviewBoxSelection(preview);
  }, []);

  // Reset painting state
  const resetPainting = useCallback(() => {
    setPaintingState(prev => ({
      isActive: false,
      startPosition: null,
      currentPosition: null,
      draggedTiles: new Set(),
      isDragging: false,
      dragThreshold: prev.dragThreshold
    }));
    setPreviewBoxSelection(null);
    setMouseStartPos(null);
  }, []);

  // Check if a tile was already dragged
  // Optimized: Memoized to avoid recreating callback on every state change
  const wasDraggedAlready = useCallback((row: number, col: number): boolean => {
    return paintingState.draggedTiles.has(`${row}-${col}`);
  }, [paintingState.draggedTiles]);

  return {
    paintingState,
    previewBoxSelection,
    mouseStartPos,
    startPainting,
    updatePosition,
    addDraggedTile,
    updateBoxPreview,
    resetPainting,
    wasDraggedAlready
  };
};
