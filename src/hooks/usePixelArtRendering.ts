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
      if (stageRef.current && layerRef.current) {
        // Get the actual canvas element
        const canvas = stageRef.current.content?.querySelector('canvas');
        if (canvas) {
          const context = canvas.getContext('2d');
          if (context) {
            // Disable all forms of image smoothing
            context.imageSmoothingEnabled = false;
            (context as any).webkitImageSmoothingEnabled = false;
            (context as any).mozImageSmoothingEnabled = false;
            (context as any).msImageSmoothingEnabled = false;
            context.imageSmoothingQuality = 'low';
            
            console.log('Image smoothing disabled for pixel art');
          }
        }

        // Force layer to redraw with new settings
        layerRef.current.batchDraw();
      }
    };

    // Set up pixel art rendering after a short delay to ensure canvas is ready
    const timeoutId = setTimeout(setupPixelArt, 100);
    
    return () => clearTimeout(timeoutId);
  }, [stageRef.current, layerRef.current, stageScale]);
};