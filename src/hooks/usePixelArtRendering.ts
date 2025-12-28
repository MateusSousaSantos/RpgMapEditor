// src/hooks/usePixelArtRendering.ts
import { useEffect } from 'react';
import Konva from 'konva';

export const usePixelArtRendering = (
  stageRef: React.RefObject<Konva.Stage | null>,
  layerRef: React.RefObject<Konva.Layer | null>,
  stageScale: number
) => {
  // Enhanced pixel art rendering setup
  useEffect(() => {
    const setupPixelArt = () => {
      const stage = stageRef.current;
      const layer = layerRef.current;
      
      if (stage && layer) {
        // Get the actual canvas element
        const canvas = stage.content?.querySelector('canvas');
        if (canvas) {
          const context = canvas.getContext('2d');
          if (context) {
            // Only update if image smoothing is currently enabled to prevent spam
            if (context.imageSmoothingEnabled !== false) {
              // Disable all forms of image smoothing
              context.imageSmoothingEnabled = false;
              (context as any).webkitImageSmoothingEnabled = false;
              (context as any).mozImageSmoothingEnabled = false;
              (context as any).msImageSmoothingEnabled = false;
              context.imageSmoothingQuality = 'low';
              
              console.log('Image smoothing disabled for pixel art');
            }
          }
          
          // Ensure canvas uses device pixel ratio of 1 for crisp pixels
          const dpr = window.devicePixelRatio || 1;
          if (dpr !== 1) {
            canvas.style.width = canvas.width + 'px';
            canvas.style.height = canvas.height + 'px';
          }
        }

        // Force layer to redraw with new settings
        layer.batchDraw();
      }
    };

    // Set up pixel art rendering after a short delay to ensure canvas is ready
    const timeoutId = setTimeout(setupPixelArt, 100);
    
    return () => clearTimeout(timeoutId);
  }, [stageScale]); // Removed ref.current dependencies to prevent infinite re-renders
};