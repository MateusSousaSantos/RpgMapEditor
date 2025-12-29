// src/hooks/useTextureManager.ts
import React from 'react';
import { TilesetRegistry, RuntimeTexture, TileType, AutotilingVariant, WallTilingVariant } from '../types/textures';
import { defaultTextureDiscovery } from '../utils/textureDiscovery';

// Enhanced texture cache with runtime texture support
const textureCache = new Map<string, HTMLImageElement>();
const loadingPromises = new Map<string, Promise<HTMLImageElement>>();

/**
 * Load a runtime texture from its definition
 */
const loadRuntimeTexture = (texture: RuntimeTexture): Promise<HTMLImageElement> => {
  if (loadingPromises.has(texture.id)) {
    return loadingPromises.get(texture.id)!;
  }

  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      textureCache.set(texture.id, img);
      texture.loaded = true;
      texture.imageElement = img;
      resolve(img);
    };
    img.onerror = () => {
      console.error(`Failed to load texture: ${texture.image_url}`);
      reject(new Error(`Failed to load texture: ${texture.image_url}`));
    };
    img.src = texture.image_url;
  });

  loadingPromises.set(texture.id, promise);
  return promise;
};

/**
 * Enhanced texture manager hook for dynamic tileset system
 */
export const useTextureManager = () => {
  const [loadedTextures, setLoadedTextures] = React.useState<Set<string>>(new Set());
  const [initializing, setInitializing] = React.useState(true);

  React.useEffect(() => {
    const initializeTextureSystem = async () => {
      try {
        // Discover available tilesets (can be extended to load from manifests)
        const discoveredTilesets = await defaultTextureDiscovery.discoverTilesets();
        
        // Register discovered tilesets
        discoveredTilesets.forEach(tileset => {
          TilesetRegistry.registerTileset(tileset);
        });

        // Collect all runtime textures from registered tilesets
        const allTilesets = TilesetRegistry.getAllTilesets();
        const allTextures: RuntimeTexture[] = [];

        for (const tileset of allTilesets) {
          const tilesetTextures = TilesetRegistry.getAllTexturesForTileset(tileset.id);
          allTextures.push(...tilesetTextures);
        }

        // Load textures in parallel with batch loading for performance
        const loadPromises = allTextures.map(async (texture) => {
          try {
            await loadRuntimeTexture(texture);
            return texture.id;
          } catch (error) {
            console.warn(`Failed to load texture ${texture.id}, attempting fallback:`, error);
            
            // Try to load fallback texture
            const tileset = TilesetRegistry.getTileset(texture.id.split('_')[0]);
            if (tileset) {
              const fallbackTexture = TilesetRegistry.getTexture(tileset.id, tileset.fallbackVariant as any);
              if (fallbackTexture && fallbackTexture.id !== texture.id) {
                try {
                  await loadRuntimeTexture(fallbackTexture);
                  return fallbackTexture.id;
                } catch (fallbackError) {
                  console.error(`Failed to load fallback texture for ${texture.id}:`, fallbackError);
                }
              }
            }
            return null;
          }
        });

        const loadedIds = await Promise.all(loadPromises);
        const successfulIds = loadedIds.filter((id): id is string => id !== null);
        setLoadedTextures(new Set(successfulIds));
        
        console.log(`Texture system initialized: ${successfulIds.length}/${allTextures.length} textures loaded`);
        
      } catch (error) {
        console.error('Failed to initialize texture system:', error);
      } finally {
        setInitializing(false);
      }
    };

    initializeTextureSystem();
  }, []);

  /**
   * Get a loaded texture by ID with fallback support
   */
  const getTexture = React.useCallback((textureId: string): CanvasImageSource | null => {
    // Direct cache lookup
    const cachedTexture = textureCache.get(textureId);
    if (cachedTexture) {
      return cachedTexture;
    }

    // If not found and still loading, return null
    if (initializing) {
      return null;
    }

    // Try to get fallback texture
    const parts = textureId.split('_');
    if (parts.length >= 2) {
      const tilesetId = parts[0];
      const tileset = TilesetRegistry.getTileset(tilesetId);
      if (tileset) {
        const fallbackTexture = TilesetRegistry.getTexture(tilesetId, tileset.fallbackVariant as any);
        if (fallbackTexture && fallbackTexture.imageElement) {
          return fallbackTexture.imageElement;
        }
      }
    }

    return null;
  }, [loadedTextures, initializing]);

  /**
   * Get texture for a specific tileset and variant
   */
  const getTextureForVariant = React.useCallback((
    tilesetId: string, 
    variant: AutotilingVariant | WallTilingVariant
  ): CanvasImageSource | null => {
    const texture = TilesetRegistry.getTexture(tilesetId, variant);
    if (!texture) {
      return null;
    }
    return getTexture(texture.id);
  }, [getTexture]);

  /**
   * Get all available textures for a tile type
   */
  const getTexturesForType = React.useCallback((tileType: TileType): RuntimeTexture[] => {
    const tilesets = TilesetRegistry.getTilesetsForType(tileType);
    const textures: RuntimeTexture[] = [];

    for (const tileset of tilesets) {
      const tilesetTextures = TilesetRegistry.getAllTexturesForTileset(tileset.id);
      textures.push(...tilesetTextures.filter(t => t.loaded));
    }

    return textures;
  }, [loadedTextures]);

  /**
   * Get the primary tileset ID for a tile type
   */
  const getPrimaryTilesetId = React.useCallback((tileType: TileType): string | null => {
    const tilesets = TilesetRegistry.getTilesetsForType(tileType);
    return tilesets.length > 0 ? tilesets[0].id : null;
  }, []);

  return { 
    getTexture, 
    getTextureForVariant,
    getTexturesForType,
    getPrimaryTilesetId,
    loadedTextures,
    initializing,
    isReady: !initializing && loadedTextures.size > 0
  };
};
