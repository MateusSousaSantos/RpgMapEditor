// src/hooks/useTileSelection.ts
import { useCallback } from 'react';
import Konva from 'konva';

interface TilePosition {
  row: number;
  col: number;
}

interface UseTileSelectionProps {
  rows: number;
  cols: number;
  tileSize: number;
  stageRef: React.RefObject<Konva.Stage | null>;
}

/**
 * Hook for calculating tile positions from canvas coordinates.
 * Handles coordinate transformation from screen space to tile grid space.
 * 
 * Optimizations:
 * - Memoized callbacks to prevent unnecessary re-renders
 * - Uses stable stageRef to ensure callbacks don't recreate on parent re-renders
 */
export const useTileSelection = ({
  rows,
  cols,
  tileSize,
  stageRef
}: UseTileSelectionProps) => {
  // Get tile position from stage coordinates
  // Memoized to prevent recreation on every render
  const getTilePosition = useCallback((): TilePosition | null => {
    if (!stageRef.current) return null;

    const stage = stageRef.current;
    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return null;

    // Transform screen coordinates to stage coordinates
    const transform = stage.getAbsoluteTransform().copy();
    transform.invert();

    const pos = transform.point(pointerPos);
    const col = Math.floor(pos.x / tileSize);
    const row = Math.floor(pos.y / tileSize);

    if (row >= 0 && row < rows && col >= 0 && col < cols) {
      return { row, col };
    }
    return null;
  }, [rows, cols, tileSize, stageRef]);

  // Get mouse position in screen coordinates (for drag detection)
  const getMousePosition = useCallback((): { x: number; y: number } | null => {
    if (!stageRef.current) return null;

    const stage = stageRef.current;
    const pointerPos = stage.getPointerPosition();
    return pointerPos;
  }, [stageRef]);

  // Calculate distance between two points (in pixels)
  const calculateDistance = useCallback(
    (pos1: { x: number; y: number }, pos2: { x: number; y: number }): number => {
      const dx = pos2.x - pos1.x;
      const dy = pos2.y - pos1.y;
      return Math.sqrt(dx * dx + dy * dy);
    },
    []
  );

  return {
    getTilePosition,
    getMousePosition,
    calculateDistance
  };
};
