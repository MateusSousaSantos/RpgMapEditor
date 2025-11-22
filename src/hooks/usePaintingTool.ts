// src/hooks/usePaintingTool.ts
import React, { useCallback, useState } from 'react';
import Konva from 'konva';
import { TileType } from '../types/textures';
import { AutotilingEngine, BatchUpdateResult } from '../utils/autotiling/AutotilingEngine';
import { Layer } from '../components/WorkspaceUI/TileGrid';

export type PaintingMode = 'single' | 'box'; // Remove 'drag' as it's now automatic

interface PaintingState {
  isActive: boolean;
  mode: PaintingMode;
  startPosition: { row: number; col: number } | null;
  currentPosition: { row: number; col: number } | null;
  draggedTiles: Set<string>;
  isDragging: boolean; // Track if user is actually dragging
  dragThreshold: number; // Minimum distance to consider it a drag
}

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
}

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
  stageRef
}: UsePaintingToolProps) => {
  const [paintingState, setPaintingState] = useState<PaintingState>({
    isActive: false,
    mode: 'single',
    startPosition: null,
    currentPosition: null,
    draggedTiles: new Set(),
    isDragging: false,
    dragThreshold: 5 // pixels
  });

  const [previewBoxSelection, setPreviewBoxSelection] = useState<{
    startRow: number;
    startCol: number;
    endRow: number;
    endCol: number;
  } | null>(null);

  const [mouseStartPos, setMouseStartPos] = useState<{ x: number; y: number } | null>(null);

  // Get tile position from stage coordinates
  const getTilePosition = useCallback(() => {
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

  // Get mouse position (screen coordinates for drag detection)
  const getMousePosition = useCallback(() => {
    if (!stageRef.current) return null;
    
    const stage = stageRef.current;
    const pointerPos = stage.getPointerPosition();
    return pointerPos;
  }, [stageRef]);

  // Calculate distance between two points
  const calculateDistance = useCallback((pos1: { x: number; y: number }, pos2: { x: number; y: number }) => {
    const dx = pos2.x - pos1.x;
    const dy = pos2.y - pos1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  // Apply tile updates with autotiling
  const applyTileUpdates = useCallback((tilesToUpdate: { row: number; col: number }[]) => {
    if (!autotilingEngine || tilesToUpdate.length === 0) return;

    // Use LayerContext methods if available, otherwise fall back to setLayers
    if (updateLayerMatrix && getCurrentLayer) {
      const currentLayer = getCurrentLayer();
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
      updateLayerMatrix(currentLayerIndex, newMatrix);

      // Update texture matrix if available
      if (updateLayerTextureMatrix) {
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

        updateLayerTextureMatrix(currentLayerIndex, textureMatrix);
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
    }
  }, [autotilingEngine, currentLayerIndex, selectedTileType, rows, cols, setLayers, updateLayerMatrix, updateLayerTextureMatrix, getCurrentLayer]);

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

  // Set painting mode
  const setPaintingMode = useCallback((mode: PaintingMode) => {
    setPaintingState(prev => ({ ...prev, mode }));
  }, []);

  // Mouse event handlers
  const handleMouseDown = useCallback(() => {
    const pos = getTilePosition();
    const mousePos = getMousePosition();
    if (!pos || !mousePos) return;

    setMouseStartPos(mousePos);
    setPaintingState(prev => ({
      ...prev,
      isActive: true,
      startPosition: pos,
      currentPosition: pos,
      draggedTiles: new Set([`${pos.row}-${pos.col}`]),
      isDragging: false
    }));

    // Don't paint immediately - wait to see if user is clicking or dragging
    // Disable stage dragging when painting starts
    if (stageRef.current) {
      stageRef.current.draggable(false);
    }
  }, [getTilePosition, getMousePosition, stageRef]);

  const handleMouseMove = useCallback(() => {
    if (!paintingState.isActive || !paintingState.startPosition || !mouseStartPos) return;

    const pos = getTilePosition();
    const currentMousePos = getMousePosition();
    if (!pos || !currentMousePos) return;

    // Calculate distance from start position to determine if user is dragging
    const distance = calculateDistance(mouseStartPos, currentMousePos);
    const wasDragging = paintingState.isDragging;
    const isDragging = distance > paintingState.dragThreshold;

    setPaintingState(prev => ({ 
      ...prev, 
      currentPosition: pos,
      isDragging 
    }));

    // If user just started dragging, paint the initial tile
    if (!wasDragging && isDragging && paintingState.mode === 'single') {
      paintSingleTile(paintingState.startPosition.row, paintingState.startPosition.col);
    }

    if (paintingState.mode === 'single' && isDragging) {
      // Drag painting mode - paint tiles as user drags
      const tileKey = `${pos.row}-${pos.col}`;
      if (!paintingState.draggedTiles.has(tileKey)) {
        setPaintingState(prev => ({
          ...prev,
          draggedTiles: new Set([...prev.draggedTiles, tileKey])
        }));
        paintSingleTile(pos.row, pos.col);
      }
    } else if (paintingState.mode === 'box') {
      // Box selection mode - update preview
      setPreviewBoxSelection({
        startRow: paintingState.startPosition.row,
        startCol: paintingState.startPosition.col,
        endRow: pos.row,
        endCol: pos.col
      });
    }
  }, [paintingState, getTilePosition, getMousePosition, mouseStartPos, calculateDistance, paintSingleTile]);

  const handleMouseUp = useCallback(() => {
    if (!paintingState.isActive || !paintingState.startPosition) {
      setPaintingState(prev => ({ ...prev, isActive: false, isDragging: false }));
      setPreviewBoxSelection(null);
      setMouseStartPos(null);
      
      // Re-enable stage dragging
      if (stageRef.current) {
        stageRef.current.draggable(true);
      }
      return;
    }

    const currentPos = paintingState.currentPosition;

    if (paintingState.mode === 'box' && currentPos) {
      // Box selection mode - paint the selected area
      paintBoxSelection(
        paintingState.startPosition.row,
        paintingState.startPosition.col,
        currentPos.row,
        currentPos.col
      );
    } else if (paintingState.mode === 'single' && !paintingState.isDragging) {
      // Single click mode - paint only the clicked tile
      paintSingleTile(paintingState.startPosition.row, paintingState.startPosition.col);
    }
    // If user was dragging in single mode, tiles were already painted during drag

    setPaintingState({
      isActive: false,
      mode: paintingState.mode,
      startPosition: null,
      currentPosition: null,
      draggedTiles: new Set(),
      isDragging: false,
      dragThreshold: paintingState.dragThreshold
    });

    setPreviewBoxSelection(null);
    setMouseStartPos(null);

    // Re-enable stage dragging
    if (stageRef.current) {
      stageRef.current.draggable(true);
    }
  }, [paintingState, paintBoxSelection, paintSingleTile, stageRef]);

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
    setPaintingMode,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTileClick,
    paintSingleTile,
    paintBoxSelection
  };
};