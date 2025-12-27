// src/components/WorkspaceUI/TileGrid.tsx
import React, { useMemo, useCallback } from "react";
import { Image as KonvaImage, Group } from "react-konva";
import Konva from "konva";
import { TILE_SIZE } from "../../utils/textureUtils";
import { 
  type TileType 
} from "../../types/textures";
import { AutotilingEngine, type TileUpdate } from "../../utils/autotiling";
import { useChunkCache, getChunkBounds, getChunkId, CHUNK_SIZE } from "../../hooks/useChunkCache";
import { useTextureManager } from "../../hooks/useTextureManager";

export interface Layer {
  name: string;
  matrix: TileType[][];
  textureMatrix?: string[][]; // Resolved texture IDs from autotiling
}

interface TileGridProps {
  layer: Layer | import('../../types/map').EnhancedLayer;
  rows: number;
  cols: number;
  onTileClick?: (row: number, col: number) => void;
  useAutotiling?: boolean;
  opacity?: number;
  isCurrentLayer?: boolean;
}

/**
 * Optimized TileGrid component with memoization and performance improvements:
 * - Uses React.memo to prevent unnecessary re-renders
 * - Memoizes expensive texture matrix calculations
 * - Optimizes chunk rendering with useMemo
 * - Efficient state updates with batching
 */
export const TileGrid = React.memo<TileGridProps>(({ 
  layer, 
  rows, 
  cols, 
  onTileClick,
  opacity = 1.0,
  isCurrentLayer = true, // Currently not used but available for future features
  useAutotiling = true 
}) => {
  // Suppress unused variable warning for isCurrentLayer
  void isCurrentLayer;
  const { getTexture } = useTextureManager();
  const { chunks, markChunkDirty, startInteraction, endInteraction, registerChunkRef } = useChunkCache({ rows, cols });
  const [autotilingEngine, setAutotilingEngine] = React.useState<AutotilingEngine | null>(null);
  const [resolvedTextures, setResolvedTextures] = React.useState<(string | null)[][]>([]);

  // Initialize autotiling engine when layer changes
  React.useEffect(() => {
    if (useAutotiling && layer.matrix) {
      const engine = new AutotilingEngine(layer.matrix, rows, cols);
      setAutotilingEngine(engine);
      
      // Resolve all tiles initially
      const updates = engine.resolveAllTiles();
      const textureMatrix = Array.from({ length: rows }, () => 
        Array.from({ length: cols }, () => null as string | null)
      );
      
      updates.forEach(update => {
        textureMatrix[update.row][update.col] = update.textureId;
      });
      
      setResolvedTextures(textureMatrix);
    } else {
      // Fallback for non-autotiling mode - use single variants
      const textureMatrix = layer.matrix.map(row => 
        row.map(tileType => {
          // Map TileType to single texture variants
          if (tileType === 'grass') return 'grass_single';
          if (tileType === 'water') return 'water_single';
          if (tileType === 'empty') return null;
          return null; // Return null for unknown tile types
        })
      );
      setResolvedTextures(textureMatrix);
    }
  }, [layer, rows, cols, useAutotiling]);

  const renderTilesInChunk = useCallback((chunkId: string) => {
    const bounds = getChunkBounds(chunkId);
    const tiles = [];
    
    for (let row = bounds.startRow; row < Math.min(bounds.endRow, rows); row++) {
      for (let col = bounds.startCol; col < Math.min(bounds.endCol, cols); col++) {
        const textureId = resolvedTextures[row]?.[col];
        
        // Don't render anything for empty tiles
        if (!textureId) {
          continue;
        }
        
        const texture = getTexture(textureId);
        
        // Don't render if texture failed to load
        if (!texture) {
          continue;
        }
        
        tiles.push(
          <KonvaImage
            key={`${row}-${col}`}
            image={texture}
            x={col * TILE_SIZE}
            y={row * TILE_SIZE}
            width={TILE_SIZE}
            height={TILE_SIZE}
            perfectDrawEnabled={false}
            shadowForStrokeEnabled={false}
            transformsEnabled="position"
            listening={false}
          />
        );
      }
    }
    
    return tiles;
  }, [resolvedTextures, getTexture, rows, cols]);

  // Memoize chunk rendering to prevent recalculating on every state change
  const renderChunkedTiles = useMemo(() => {
    return Array.from(chunks.entries()).map(([chunkId]) => (
      <Group
        key={chunkId}
        ref={(ref) => registerChunkRef(chunkId, ref)}
      >
        {renderTilesInChunk(chunkId)}
      </Group>
    ));
  }, [chunks, renderTilesInChunk, registerChunkRef]);

  // Method to update resolved textures (called internally)
  const updateResolvedTextures = React.useCallback((updates: TileUpdate[]) => {
    const newTextureMatrix = resolvedTextures.map(row => [...row]);
    const affectedChunks = new Set<string>();
    
    updates.forEach(update => {
      if (newTextureMatrix[update.row]) {
        newTextureMatrix[update.row][update.col] = update.textureId;
        // Track which chunks are affected
        affectedChunks.add(getChunkId(update.row, update.col));
      }
    });
    
    // Mark affected chunks as dirty
    affectedChunks.forEach(chunkId => {
      const [row, col] = chunkId.split('-').map(n => parseInt(n) * CHUNK_SIZE);
      markChunkDirty(row, col);
    });
    
    setResolvedTextures(newTextureMatrix);
  }, [resolvedTextures, markChunkDirty]);

  // Expose the update function and engine via props callback
  React.useEffect(() => {
    if (autotilingEngine && typeof onTileClick === 'function') {
      // Store references for parent access if needed
      (onTileClick as any).updateTiles = updateResolvedTextures;
      (onTileClick as any).getEngine = () => autotilingEngine;
    }
  }, [autotilingEngine, onTileClick, updateResolvedTextures]);

  // Memoized event handlers to prevent unnecessary re-binding
  const handleClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos || !onTileClick) return;
    const col = Math.floor(pos.x / TILE_SIZE);
    const row = Math.floor(pos.y / TILE_SIZE);
    
    // Ensure click is within bounds
    if (row >= 0 && row < rows && col >= 0 && col < cols) {
      // Mark chunk as dirty for future recaching
      markChunkDirty(row, col);
      onTileClick(row, col);
    }
  }, [onTileClick, rows, cols, markChunkDirty]);
  
  const handlePointerDown = useCallback(() => {
    startInteraction();
  }, [startInteraction]);
  
  const handlePointerUp = useCallback(() => {
    endInteraction();
  }, [endInteraction]);

  return (
    <Group 
      opacity={opacity}
      onClick={handleClick}
      onTap={handleClick}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      listening={!!onTileClick}
    >
      {renderChunkedTiles}
    </Group>
  );
});

// Export hook for external access to autotiling engine
export const useAutotilingEngine = (layer: Layer, rows: number, cols: number) => {
  return React.useMemo(() => {
    if (layer.matrix) {
      return new AutotilingEngine(layer.matrix, rows, cols);
    }
    return null;
  }, [layer, rows, cols]);
};
