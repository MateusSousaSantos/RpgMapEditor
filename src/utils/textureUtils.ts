// src/utils/textureUtils.ts

export const TILE_SIZE = 16; // Match your image's native resolution

// Create a fallback texture using default.png
export const createFallbackTexture = (): HTMLImageElement => {
  const img = new Image();
  img.src = '/assets/default.png';
  
  // Set pixel art styles
  img.style.imageRendering = 'pixelated';
  img.style.imageRendering = 'crisp-edges';
  
  return img;
};