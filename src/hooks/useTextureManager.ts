// src/hooks/useTextureManager.ts
import React from 'react';
import {
  GRASS_AUTOTILING_TEXTURES,
  WATER_AUTOTILING_TEXTURES,
  WALL_AUTOTILING_TEXTURES
} from '../types/textures';

// Create a texture cache to store loaded images
const textureCache = new Map<string, HTMLImageElement>();
const loadingPromises = new Map<string, Promise<HTMLImageElement>>();

interface TextureConfig {
  id: string;
  name: string;
  image_url: string;
}

/**
 * Load a single texture from URL
 */
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

/**
 * Hook to manage texture loading for autotiling systems.
 * Loads all autotiling textures on mount and provides access to loaded textures.
 */
export const useTextureManager = () => {
  const [loadedTextures, setLoadedTextures] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    // Collect all autotiling textures
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
      })),
      ...WALL_AUTOTILING_TEXTURES.map(texture => ({
        id: texture.id,
        name: texture.name,
        image_url: texture.image_url
      }))
    ];

    // Load all textures in parallel
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

  /**
   * Get a loaded texture by ID
   * Returns null if texture hasn't finished loading yet
   */
  const getTexture = React.useCallback((texture_id: string): CanvasImageSource | null => {
    if (!loadedTextures.has(texture_id)) {
      return null;
    }
    return textureCache.get(texture_id) || null;
  }, [loadedTextures]);

  return { getTexture, loadedTextures };
};
