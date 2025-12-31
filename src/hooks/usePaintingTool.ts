// src/hooks/usePaintingTool.ts
import React, { useCallback, useMemo } from 'react';
import Konva from 'konva';
import { TileType } from '../types/textures';
import { AutotilingEngine, BatchUpdateResult } from '../utils/autotiling/AutotilingEngine';
import { Layer } from '../components/WorkspaceUI/TileGrid';
import { useTileSelection } from './useTileSelection';
import { usePaintingMode, type PaintingMode } from './usePaintingMode';
import { usePaintingState } from './usePaintingState';

interface UsePaintingToolProps {
  setLayers?: React.Dispatch<React.SetStateAction<Layer[]>>; // Legacy support
  updateLayerMatrix?: (layerIndex: number, matrix: TileType[][]) => void; // LayerContext support
  updateLayerTextureMatrix?: (layerIndex: number, textureMatrix: string[][]) => void; // LayerContext support
  getCurrentLayer?: () => { matrix: TileType[][]; textureMatrix?: string[][] } | undefined; // LayerContext support
  currentLayerIndex: number;
  selectedTileType: TileType;
  rows: number;
  cols: number;
  tileSize: number;
  autotilingEngine: AutotilingEngine | null;
  stageRef: React.RefObject<Konva.Stage | null>;
  // Color support
  selectedTileColor?: string;
  updateTileColor?: (layerIndex: number, row: number, col: number, color: string) => void;
  initializeColorMatrix?: (layerIndex: number) => void;
}

export type { PaintingMode };

export const usePaintingTool = ({
  setLayers,
  updateLayerMatrix,
  updateLayerTextureMatrix,
  getCurrentLayer,
  currentLayerIndex,
  selectedTileType,
  rows,
  cols,
  tileSize,
  autotilingEngine,
  stageRef,
  selectedTileColor,
  updateTileColor,
  initializeColorMatrix
}: UsePaintingToolProps) => {
  // Use extracted hooks for specific concerns
  const { getTilePosition, getMousePosition, calculateDistance } = useTileSelection({
    rows,
    cols,
    tileSize,
    stageRef
  });

  const { mode: paintingMode, setPaintingMode } = usePaintingMode({ initialMode: 'single' });

  const {
    paintingState,
    previewBoxSelection,
    mouseStartPos,
    startPainting,
    updatePosition,
    addDraggedTile,
    updateBoxPreview,
    resetPainting,
    wasDraggedAlready
  } = usePaintingState();

  // Stable references to prevent callback recreation
  const stableUpdateLayerMatrix = useMemo(() => updateLayerMatrix, [updateLayerMatrix]);
  const stableUpdateLayerTextureMatrix = useMemo(() => updateLayerTextureMatrix, [updateLayerTextureMatrix]);
  const stableGetCurrentLayer = useMemo(() => getCurrentLayer, [getCurrentLayer]);

  // Memoize applyTileUpdates to prevent recreating on every render
  // Only recreates when autotilingEngine, selectedTileType, or layer update functions change
  const applyTileUpdates = useCallback((tilesToUpdate: { row: number; col: number }[]) => {
    if (!autotilingEngine || tilesToUpdate.length === 0) return;

    // Use LayerContext methods if available, otherwise fall back to setLayers
    if (stableUpdateLayerMatrix && stableGetCurrentLayer) {
      const currentLayer = stableGetCurrentLayer();
      if (!currentLayer) return;

      const newMatrix = currentLayer.matrix.map(r => [...r]);
      
      // Apply all tile changes first
      tilesToUpdate.forEach(({ row, col }) => {
        newMatrix[row][col] = selectedTileType;
      });

      // Update the autotiling engine with the new matrix
      autotilingEngine.updateMatrix(newMatrix);

      // Process autotiling for all changed tiles and collect unique updates
      const processedTiles = new Set<string>();
      let allUpdates: BatchUpdateResult['updates'] = [];
      
      tilesToUpdate.forEach(({ row, col }) => {
        const updateResult = autotilingEngine.updateTile(row, col, selectedTileType);
        
        // Add updates that haven't been processed yet
        updateResult.updates.forEach(update => {
          const tileKey = `${update.row}-${update.col}`;
          if (!processedTiles.has(tileKey)) {
            processedTiles.add(tileKey);
            allUpdates.push(update);
          }
        });
      });

      // Apply autotiling updates to matrix
      allUpdates.forEach(update => {
        if (update.row >= 0 && update.row < rows && update.col >= 0 && update.col < cols) {
          newMatrix[update.row][update.col] = update.tileType;
        }
      });

      // Update the layer matrix using LayerContext
      stableUpdateLayerMatrix(currentLayerIndex, newMatrix);

      // Update texture matrix if available
      if (stableUpdateLayerTextureMatrix) {
        let textureMatrix = currentLayer.textureMatrix;
        if (!textureMatrix) {
          textureMatrix = Array.from({ length: rows }, () =>
            Array.from({ length: cols }, () => 'grass_center')
          );
        } else {
          textureMatrix = textureMatrix.map(row => [...row]);
        }

        allUpdates.forEach(update => {
          if (update.row >= 0 && update.row < rows && update.col >= 0 && update.col < cols) {
            textureMatrix![update.row][update.col] = update.textureId;
          }
        });

        stableUpdateLayerTextureMatrix(currentLayerIndex, textureMatrix);
      }

      // Apply colors if color support is enabled and a non-white color is selected
      if (updateTileColor && initializeColorMatrix && selectedTileColor && selectedTileColor !== '#ffffff') {
        // Initialize color matrix if needed
        const currentLayerAfterUpdate = stableGetCurrentLayer();
        if (currentLayerAfterUpdate && !('colorMatrix' in currentLayerAfterUpdate)) {
          initializeColorMatrix(currentLayerIndex);
        }
        
        // Apply color to all original tile positions (not autotiling updates)
        tilesToUpdate.forEach(({ row, col }) => {
          updateTileColor(currentLayerIndex, row, col, selectedTileColor);
        });
      }
    } else if (setLayers) {
      // Legacy behavior using setLayers
      setLayers(prevLayers => {
        const newLayers = [...prevLayers];
        const newMatrix = newLayers[currentLayerIndex].matrix.map(r => [...r]);
        
        // Apply all tile changes first
        tilesToUpdate.forEach(({ row, col }) => {
          newMatrix[row][col] = selectedTileType;
        });

        // Update the autotiling engine with the new matrix
        autotilingEngine.updateMatrix(newMatrix);

        // Process autotiling for all changed tiles and collect unique updates
        const processedTiles = new Set<string>();
        let allUpdates: BatchUpdateResult['updates'] = [];
        
        tilesToUpdate.forEach(({ row, col }) => {
          const updateResult = autotilingEngine.updateTile(row, col, selectedTileType);
          
          // Add updates that haven't been processed yet
          updateResult.updates.forEach(update => {
            const tileKey = `${update.row}-${update.col}`;
            if (!processedTiles.has(tileKey)) {
              processedTiles.add(tileKey);
              allUpdates.push(update);
            }
          });
        });

        // Apply autotiling updates to matrix
        allUpdates.forEach(update => {
          if (update.row >= 0 && update.row < rows && update.col >= 0 && update.col < cols) {
            newMatrix[update.row][update.col] = update.tileType;
          }
        });

        newLayers[currentLayerIndex] = {
          ...newLayers[currentLayerIndex],
          matrix: newMatrix
        };

        // Update texture matrix for rendering
        if (!newLayers[currentLayerIndex].textureMatrix) {
          newLayers[currentLayerIndex].textureMatrix = Array.from({ length: rows }, () =>
            Array.from({ length: cols }, () => 'grass_center')
          );
        }

        const textureMatrix = newLayers[currentLayerIndex].textureMatrix!;
        allUpdates.forEach(update => {
          if (update.row >= 0 && update.row < rows && update.col >= 0 && update.col < cols) {
            textureMatrix[update.row][update.col] = update.textureId;
          }
        });

        return newLayers;
      });
      
      // Apply colors if color support is enabled and a non-white color is selected
      if (updateTileColor && initializeColorMatrix && selectedTileColor && selectedTileColor !== '#ffffff') {
        // Initialize color matrix if needed
        initializeColorMatrix(currentLayerIndex);
        
        // Apply color to all original tile positions (not autotiling updates)
        tilesToUpdate.forEach(({ row, col }) => {
          updateTileColor(currentLayerIndex, row, col, selectedTileColor);
        });
      }
    }
  }, [autotilingEngine, currentLayerIndex, selectedTileType, rows, cols, setLayers, stableUpdateLayerMatrix, stableUpdateLayerTextureMatrix, stableGetCurrentLayer, selectedTileColor, updateTileColor, initializeColorMatrix]);

  // Handle single tile painting
  const paintSingleTile = useCallback((row: number, col: number) => {
    applyTileUpdates([{ row, col }]);
  }, [applyTileUpdates]);

  // Handle box selection painting
  const paintBoxSelection = useCallback((startRow: number, startCol: number, endRow: number, endCol: number) => {
    const minRow = Math.min(startRow, endRow);
    const maxRow = Math.max(startRow, endRow);
    const minCol = Math.min(startCol, endCol);
    const maxCol = Math.max(startCol, endCol);

    const tilesToUpdate: { row: number; col: number }[] = [];
    
    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        if (row >= 0 && row < rows && col >= 0 && col < cols) {
          tilesToUpdate.push({ row, col });
        }
      }
    }

    applyTileUpdates(tilesToUpdate);
  }, [applyTileUpdates, rows, cols]);

  // Mouse event handlers
  const handleMouseDown = useCallback(() => {
    const pos = getTilePosition();
    const mousePos = getMousePosition();
    if (!pos || !mousePos) return;

    startPainting(pos, mousePos);

    // Disable stage dragging when painting starts
    if (stageRef.current) {
      stageRef.current.draggable(false);
    }
  }, [getTilePosition, getMousePosition, startPainting, stageRef]);

  const handleMouseMove = useCallback(() => {
    if (!paintingState.isActive || !paintingState.startPosition || !mouseStartPos) return;

    const pos = getTilePosition();
    const currentMousePos = getMousePosition();
    if (!pos || !currentMousePos) return;

    // Calculate distance from start position to determine if user is dragging
    const distance = calculateDistance(mouseStartPos, currentMousePos);
    const wasDragging = paintingState.isDragging;
    const isDragging = distance > paintingState.dragThreshold;

    updatePosition(pos, currentMousePos, isDragging);

    // If user just started dragging, paint the initial tile
    if (!wasDragging && isDragging && paintingMode === 'single') {
      paintSingleTile(paintingState.startPosition.row, paintingState.startPosition.col);
    }

    if (paintingMode === 'single' && isDragging) {
      // Drag painting mode - paint tiles as user drags
      if (!wasDraggedAlready(pos.row, pos.col)) {
        addDraggedTile(pos.row, pos.col);
        paintSingleTile(pos.row, pos.col);
      }
    } else if (paintingMode === 'box') {
      // Box selection mode - update preview
      updateBoxPreview({
        startRow: paintingState.startPosition.row,
        startCol: paintingState.startPosition.col,
        endRow: pos.row,
        endCol: pos.col
      });
    }
  }, [
    paintingState,
    getTilePosition,
    getMousePosition,
    mouseStartPos,
    calculateDistance,
    paintingMode,
    paintSingleTile,
    addDraggedTile,
    wasDraggedAlready,
    updatePosition,
    updateBoxPreview
  ]);

  const handleMouseUp = useCallback(() => {
    if (!paintingState.isActive || !paintingState.startPosition) {
      resetPainting();

      // Re-enable stage dragging
      if (stageRef.current) {
        stageRef.current.draggable(true);
      }
      return;
    }

    const currentPos = paintingState.currentPosition;

    if (paintingMode === 'box' && currentPos) {
      // Box selection mode - paint the selected area
      paintBoxSelection(
        paintingState.startPosition.row,
        paintingState.startPosition.col,
        currentPos.row,
        currentPos.col
      );
    } else if (paintingMode === 'single' && !paintingState.isDragging) {
      // Single click mode - paint only the clicked tile
      paintSingleTile(paintingState.startPosition.row, paintingState.startPosition.col);
    }
    // If user was dragging in single mode, tiles were already painted during drag

    resetPainting();

    // Re-enable stage dragging
    if (stageRef.current) {
      stageRef.current.draggable(true);
    }
  }, [paintingState, paintingMode, paintBoxSelection, paintSingleTile, resetPainting, stageRef]);

  // Handle tile click for direct tile interaction (when not using mouse events)
  const handleTileClick = useCallback((row: number, col: number) => {
    // This is mainly for fallback or when tiles are clicked directly
    if (!paintingState.isActive) {
      paintSingleTile(row, col);
    }
  }, [paintingState.isActive, paintSingleTile]);

  return {
    paintingState,
    previewBoxSelection,
    paintingMode,
    setPaintingMode,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTileClick,
    paintSingleTile,
    paintBoxSelection
  };
};