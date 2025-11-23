// src/components/WorkspaceUI/TileGrid.tsx
import React from "react";
import { Image as KonvaImage, Group } from "react-konva";
import Konva from "konva";
import { TILE_SIZE } from "../../utils/textureUtils";
import { 
  GRASS_AUTOTILING_TEXTURES,
  WATER_AUTOTILING_TEXTURES,
  type TileType 
} from "../../types/textures";
import { AutotilingEngine, type TileUpdate } from "../../utils/autotiling";

// Chunk configuration
const CHUNK_SIZE = 32; // 32x32 tiles per chunk
const CACHE_DEBOUNCE_MS = 500; // 500ms debounce for recaching
const CACHE_PIXEL_RATIO = 0.75; // Optimize memory usage

// Chunk management utilities
interface ChunkInfo {
  id: string;
  isDirty: boolean;
}

const getChunkId = (row: number, col: number): string => {
  const chunkRow = Math.floor(row / CHUNK_SIZE);
  const chunkCol = Math.floor(col / CHUNK_SIZE);
  return `${chunkRow}-${chunkCol}`;
};

const getChunkBounds = (chunkId: string) => {
  const [chunkRow, chunkCol] = chunkId.split('-').map(Number);
  return {
    startRow: chunkRow * CHUNK_SIZE,
    endRow: Math.min((chunkRow + 1) * CHUNK_SIZE, Number.MAX_SAFE_INTEGER),
    startCol: chunkCol * CHUNK_SIZE,
    endCol: Math.min((chunkCol + 1) * CHUNK_SIZE, Number.MAX_SAFE_INTEGER)
  };
};

// Create a texture cache to store loaded images
const textureCache = new Map<string, HTMLImageElement>();
const loadingPromises = new Map<string, Promise<HTMLImageElement>>();

// Interface for texture config
interface TextureConfig {
  id: string;
  name: string;
  image_url: string;
}

// Function to load a single texture
const loadTexture = (textureConfig: TextureConfig): Promise<HTMLImageElement> => {
  if (loadingPromises.has(textureConfig.id)) {
    return loadingPromises.get(textureConfig.id)!;
  }

  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      textureCache.set(textureConfig.id, img);
      resolve(img);
    };
    img.onerror = () => {
      console.error(`Failed to load texture: ${textureConfig.image_url}`);
      reject(new Error(`Failed to load texture: ${textureConfig.image_url}`));
    };
    img.src = textureConfig.image_url;
  });

  loadingPromises.set(textureConfig.id, promise);
  return promise;
};

// Hook to manage chunk caching with dirty flags and debounced recaching
const useChunkCaching = (rows: number, cols: number) => {
  const [chunks, setChunks] = React.useState<Map<string, ChunkInfo>>(new Map());
  const debounceTimerRef = React.useRef<number | null>(null);
  const isInteractingRef = React.useRef(false);

  // Initialize chunks based on grid size
  React.useEffect(() => {
    const newChunks = new Map<string, ChunkInfo>();
    
    for (let row = 0; row < rows; row += CHUNK_SIZE) {
      for (let col = 0; col < cols; col += CHUNK_SIZE) {
        const chunkId = getChunkId(row, col);
        newChunks.set(chunkId, {
          id: chunkId,
          isDirty: true // Start as dirty to cache initially
        });
      }
    }
    
    setChunks(newChunks);
  }, [rows, cols]);

  // Mark chunk as dirty
  const markChunkDirty = React.useCallback((row: number, col: number) => {
    const chunkId = getChunkId(row, col);
    setChunks(prev => {
      const newChunks = new Map(prev);
      const chunk = newChunks.get(chunkId);
      if (chunk) {
        chunk.isDirty = true;
        newChunks.set(chunkId, chunk);
      }
      return newChunks;
    });
    
    // Start debounced recaching if not currently interacting
    if (!isInteractingRef.current) {
      startDebouncedRecache();
    }
  }, []);

  // Start interaction (prevents caching during active editing)
  const startInteraction = React.useCallback(() => {
    isInteractingRef.current = true;
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, []);

  // End interaction (allows caching to resume)
  const endInteraction = React.useCallback(() => {
    isInteractingRef.current = false;
    startDebouncedRecache();
  }, []);

  // Debounced recaching function
  const startDebouncedRecache = React.useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      if (!isInteractingRef.current) {
        recacheDirtyChunks();
      }
    }, CACHE_DEBOUNCE_MS);
  }, []);

  // Recache all dirty chunks
  const recacheDirtyChunks = React.useCallback(() => {
    setChunks(prev => {
      const newChunks = new Map(prev);
      let hasChanges = false;
      
      newChunks.forEach(chunk => {
        if (chunk.isDirty) {
          const groupRef = chunkRefsRef.current.get(chunk.id);
          if (groupRef) {
            // Cache the chunk group
            groupRef.cache({
              pixelRatio: CACHE_PIXEL_RATIO
            });
          }
          
          chunk.isDirty = false;
          hasChanges = true;
        }
      });
      
      return hasChanges ? newChunks : prev;
    });
  }, []);

  // Store chunk refs without triggering re-renders
  const chunkRefsRef = React.useRef<Map<string, Konva.Group>>(new Map());
  
  // Register chunk group ref
  const registerChunkRef = React.useCallback((chunkId: string, ref: Konva.Group | null) => {
    if (ref) {
      chunkRefsRef.current.set(chunkId, ref);
    } else {
      chunkRefsRef.current.delete(chunkId);
    }
  }, []);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    chunks,
    markChunkDirty,
    startInteraction,
    endInteraction,
    registerChunkRef
  };
};

// Hook to manage texture loading including autotiling textures
export const useTextureManager = () => {
  const [loadedTextures, setLoadedTextures] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    // Load only autotiling textures
    const allTextures: TextureConfig[] = [
      ...GRASS_AUTOTILING_TEXTURES.map(texture => ({
        id: texture.id,
        name: texture.name,
        image_url: texture.image_url
      })),
      ...WATER_AUTOTILING_TEXTURES.map(texture => ({
        id: texture.id,
        name: texture.name,
        image_url: texture.image_url
      }))
    ];

    // Load all textures on mount
    Promise.all(
      allTextures.map(texture => 
        loadTexture(texture).then(() => texture.id)
      )
    ).then(loadedIds => {
      setLoadedTextures(new Set(loadedIds));
    }).catch(error => {
      console.error('Failed to load some textures:', error);
    });
  }, []);

  const getTexture = (texture_id: string): CanvasImageSource | null => {
    if (!loadedTextures.has(texture_id)) {
      return null; // Return null if texture isn't loaded yet
    }
    return textureCache.get(texture_id) || null;
  };

  return { getTexture, loadedTextures };
};

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
  const { chunks, markChunkDirty, startInteraction, endInteraction, registerChunkRef } = useChunkCaching(rows, cols);
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

  const renderTilesInChunk = (chunkId: string) => {
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
  };

  const renderChunkedTiles = () => {
    return Array.from(chunks.entries()).map(([chunkId]) => (
      <Group
        key={chunkId}
        ref={(ref) => registerChunkRef(chunkId, ref)}
      >
        {renderTilesInChunk(chunkId)}
      </Group>
    ));
  };

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

  const handleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
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
  };
  
  const handlePointerDown = () => {
    startInteraction();
  };
  
  const handlePointerUp = () => {
    endInteraction();
  };

  return (
    <Group 
      opacity={opacity}
      onClick={handleClick}
      onTap={handleClick}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      listening={!!onTileClick}
    >
      {renderChunkedTiles()}
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
