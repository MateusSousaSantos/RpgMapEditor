// src/hooks/useEraserTool.ts
import React, { useCallback, useMemo } from 'react';
import Konva from 'konva';
import { TileType } from '../types/textures';
import { AutotilingEngine, BatchUpdateResult } from '../utils/autotiling/AutotilingEngine';
import { useTileSelection } from './useTileSelection';
import { usePaintingMode, type PaintingMode } from './usePaintingMode';
import { usePaintingState } from './usePaintingState';
import { clearOverlaysAtPosition } from '../utils/overlayUtils';

interface UseEraserToolProps {
  updateLayerMatrix?: (layerIndex: number, matrix: TileType[][]) => void;
  updateLayerTextureMatrix?: (layerIndex: number, textureMatrix: string[][]) => void;
  updateLayerOverlayMatrix?: (layerIndex: number, overlayMatrix: string[][][]) => void;
  getCurrentLayer?: () => { matrix: TileType[][]; textureMatrix?: string[][]; overlayMatrix?: string[][][] } | undefined;
  currentLayerIndex: number;
  rows: number;
  cols: number;
  tileSize: number;
  autotilingEngine: AutotilingEngine | null;
  stageRef: React.RefObject<Konva.Stage | null>;
}

export type { PaintingMode };

export const useEraserTool = ({
  updateLayerMatrix,
  updateLayerTextureMatrix,
  updateLayerOverlayMatrix,
  getCurrentLayer,
  currentLayerIndex,
  rows,
  cols,
  tileSize,
  autotilingEngine,
  stageRef
}: UseEraserToolProps) => {
  const { getTilePosition, getMousePosition } = useTileSelection({
    rows,
    cols,
    tileSize,
    stageRef
  });

  const { mode: eraserMode, setPaintingMode: setEraserMode } = usePaintingMode({ initialMode: 'single' });

  const {
    paintingState,
    previewBoxSelection,
    startPainting,
    addDraggedTile,
    updateBoxPreview,
    resetPainting,
    wasDraggedAlready
  } = usePaintingState();

  const stableUpdateLayerMatrix = useMemo(() => updateLayerMatrix, [updateLayerMatrix]);
  const stableUpdateLayerTextureMatrix = useMemo(() => updateLayerTextureMatrix, [updateLayerTextureMatrix]);
  const stableUpdateLayerOverlayMatrix = useMemo(() => updateLayerOverlayMatrix, [updateLayerOverlayMatrix]);
  const stableGetCurrentLayer = useMemo(() => getCurrentLayer, [getCurrentLayer]);

  // Apply tile erasure (set tiles to null) and clear overlays
  const applyTileErasure = useCallback((tilesToErase: { row: number; col: number }[]) => {
    if (!autotilingEngine || tilesToErase.length === 0) return;

    if (stableUpdateLayerMatrix && stableGetCurrentLayer) {
      const currentLayer = stableGetCurrentLayer();
      if (!currentLayer) return;

      // Clear overlays first
      if (stableUpdateLayerOverlayMatrix && currentLayer.overlayMatrix) {
        let overlayMatrix = currentLayer.overlayMatrix.map(row => row.map(cell => [...cell]));
        
        tilesToErase.forEach(({ row, col }) => {
          overlayMatrix = clearOverlaysAtPosition(overlayMatrix, row, col);
        });

        stableUpdateLayerOverlayMatrix(currentLayerIndex, overlayMatrix);
      }

      const newMatrix = currentLayer.matrix.map(r => [...r]);
      
      // Erase tiles (set to 'empty' or null - using null as empty)
      tilesToErase.forEach(({ row, col }) => {
        newMatrix[row][col] = 'empty' as TileType;
      });

      // Update the autotiling engine with the new matrix
      autotilingEngine.updateMatrix(newMatrix);

      // Process autotiling for all changed tiles and their neighbors
      const processedTiles = new Set<string>();
      let allUpdates: BatchUpdateResult['updates'] = [];
      
      tilesToErase.forEach(({ row, col }) => {
        // Update the erased tile
        const updateResult = autotilingEngine.updateTile(row, col, 'empty' as TileType);
        
        updateResult.updates.forEach(update => {
          const tileKey = `${update.row}-${update.col}`;
          if (!processedTiles.has(tileKey)) {
            processedTiles.add(tileKey);
            allUpdates.push(update);
          }
        });

        // Update neighbors for proper autotiling
        const neighbors = [
          { row: row - 1, col }, // top
          { row: row + 1, col }, // bottom
          { row, col: col - 1 }, // left
          { row, col: col + 1 }, // right
        ];

        neighbors.forEach(neighbor => {
          if (neighbor.row >= 0 && neighbor.row < rows && 
              neighbor.col >= 0 && neighbor.col < cols &&
              newMatrix[neighbor.row][neighbor.col] !== 'empty') {
            const neighborType = newMatrix[neighbor.row][neighbor.col];
            const neighborUpdate = autotilingEngine.updateTile(neighbor.row, neighbor.col, neighborType);
            
            neighborUpdate.updates.forEach(update => {
              const tileKey = `${update.row}-${update.col}`;
              if (!processedTiles.has(tileKey)) {
                processedTiles.add(tileKey);
                allUpdates.push(update);
              }
            });
          }
        });
      });

      // Apply matrix changes
      stableUpdateLayerMatrix(currentLayerIndex, newMatrix);

      // Apply texture changes if we have updates
      if (allUpdates.length > 0 && stableUpdateLayerTextureMatrix) {
        const newTextureMatrix = currentLayer.textureMatrix ? 
          currentLayer.textureMatrix.map(r => [...r]) : 
          Array(rows).fill(null).map(() => Array(cols).fill(''));

        allUpdates.forEach(update => {
          newTextureMatrix[update.row][update.col] = update.textureId;
        });

        stableUpdateLayerTextureMatrix(currentLayerIndex, newTextureMatrix);
      }
    }
  }, [autotilingEngine, stableUpdateLayerMatrix, stableUpdateLayerTextureMatrix, stableUpdateLayerOverlayMatrix, stableGetCurrentLayer, currentLayerIndex, rows, cols]);

  // Handle mouse down event
  const handleMouseDown = useCallback(() => {
    const tilePos = getTilePosition();
    const mousePos = getMousePosition();
    if (!tilePos || !mousePos) return;

    if (eraserMode === 'single') {
      startPainting(tilePos, mousePos);
      applyTileErasure([tilePos]);
      addDraggedTile(tilePos.row, tilePos.col);
    } else if (eraserMode === 'box') {
      startPainting(tilePos, mousePos);
    }
  }, [getTilePosition, getMousePosition, eraserMode, startPainting, applyTileErasure, addDraggedTile]);

  // Handle mouse move event
  const handleMouseMove = useCallback(() => {
    if (!paintingState.isActive || !paintingState.startPosition) return;

    const tilePos = getTilePosition();
    if (!tilePos) return;

    if (eraserMode === 'single') {
      const alreadyErased = wasDraggedAlready(tilePos.row, tilePos.col);
      if (!alreadyErased) {
        applyTileErasure([tilePos]);
        addDraggedTile(tilePos.row, tilePos.col);
      }
    } else if (eraserMode === 'box') {
      // Box selection mode - update preview
      updateBoxPreview({
        startRow: paintingState.startPosition.row,
        startCol: paintingState.startPosition.col,
        endRow: tilePos.row,
        endCol: tilePos.col
      });
    }
  }, [paintingState.isActive, paintingState.startPosition, getTilePosition, eraserMode, applyTileErasure, wasDraggedAlready, addDraggedTile, updateBoxPreview]);

  // Handle mouse up event
  const handleMouseUp = useCallback(() => {
    if (!paintingState.isActive) {
      return;
    }

    if (eraserMode === 'box' && previewBoxSelection) {
      // Calculate min/max to handle all drag directions
      const minRow = Math.min(previewBoxSelection.startRow, previewBoxSelection.endRow);
      const maxRow = Math.max(previewBoxSelection.startRow, previewBoxSelection.endRow);
      const minCol = Math.min(previewBoxSelection.startCol, previewBoxSelection.endCol);
      const maxCol = Math.max(previewBoxSelection.startCol, previewBoxSelection.endCol);
      
      const tilesToErase: { row: number; col: number }[] = [];
      
      for (let row = minRow; row <= maxRow; row++) {
        for (let col = minCol; col <= maxCol; col++) {
          tilesToErase.push({ row, col });
        }
      }

      if (tilesToErase.length > 0) {
        applyTileErasure(tilesToErase);
      }
    }

    resetPainting();
  }, [paintingState.isActive, eraserMode, previewBoxSelection, applyTileErasure, resetPainting]);

  // Handle tile click (for single mode)
  const handleTileClick = useCallback((row: number, col: number) => {
    if (eraserMode === 'single') {
      applyTileErasure([{ row, col }]);
    }
  }, [eraserMode, applyTileErasure]);

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTileClick,
    paintingState,
    previewBoxSelection,
    eraserMode,
    setEraserMode
  };
};
