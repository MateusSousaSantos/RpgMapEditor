// src/hooks/useTextureLoader.ts
import { useEffect, useState } from 'react';

export const useTextureLoader = (src: string) => {
  const [texture, setTexture] = useState<HTMLImageElement | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      setTexture(img);
      setImageError(null);
      console.log(`Texture loaded successfully: ${src}`);
    };
    img.onerror = (error) => {
      console.error(`Failed to load texture: ${src}`, error);
      setImageError(`Failed to load texture from ${src}`);
    };
  }, [src]);

  // Apply pixel art styles to the image
  useEffect(() => {
    if (texture) {
      // Force nearest neighbor interpolation on the image itself
      texture.style.imageRendering = 'pixelated';
      texture.style.imageRendering = 'crisp-edges';
    }
  }, [texture]);

  return { texture, imageError };
};