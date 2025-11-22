// src/components/WorkspaceUI/TileGrid.tsx
import React from "react";
import { Image as KonvaImage, Group } from "react-konva";
import { TILE_SIZE } from "../../utils/textureUtils";
import { 
  GRASS_AUTOTILING_TEXTURES,
  WATER_AUTOTILING_TEXTURES,
  type TileType 
} from "../../types/textures";
import { AutotilingEngine, type TileUpdate } from "../../utils/autotiling";

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

export const TileGrid: React.FC<TileGridProps> = ({ 
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

  const renderTiles = () => {
    return Array.from({ length: rows }).map((_, row) =>
      Array.from({ length: cols }).map((_, col) => {
        const textureId = resolvedTextures[row]?.[col];
        
        // Don't render anything for empty tiles (null or undefined textureId)
        if (!textureId) {
          return null;
        }
        
        const texture = getTexture(textureId);
        
        // Don't render if texture failed to load
        if (!texture) {
          return null;
        }
        
        return (
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
            listening={!!onTileClick}
            onClick={() => onTileClick && onTileClick(row, col)}
            onTap={() => onTileClick && onTileClick(row, col)}
          />
        );
      })
    );
  };

  // Method to update resolved textures (called internally)
  const updateResolvedTextures = React.useCallback((updates: TileUpdate[]) => {
    const newTextureMatrix = resolvedTextures.map(row => [...row]);
    updates.forEach(update => {
      if (newTextureMatrix[update.row]) {
        newTextureMatrix[update.row][update.col] = update.textureId;
      }
    });
    setResolvedTextures(newTextureMatrix);
  }, [resolvedTextures]);

  // Expose the update function and engine via props callback
  React.useEffect(() => {
    if (autotilingEngine && typeof onTileClick === 'function') {
      // Store references for parent access if needed
      (onTileClick as any).updateTiles = updateResolvedTextures;
      (onTileClick as any).getEngine = () => autotilingEngine;
    }
  }, [autotilingEngine, onTileClick, updateResolvedTextures]);

  return (
    <Group opacity={opacity}>
      {renderTiles()}
    </Group>
  );
};

// Export hook for external access to autotiling engine
export const useAutotilingEngine = (layer: Layer, rows: number, cols: number) => {
  return React.useMemo(() => {
    if (layer.matrix) {
      return new AutotilingEngine(layer.matrix, rows, cols);
    }
    return null;
  }, [layer, rows, cols]);
};
